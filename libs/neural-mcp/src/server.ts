import {
  getComponentContract,
  getComponentExamples,
  recommendComponents,
  searchComponents,
} from './catalog.js';
import { planUi } from './composition.js';
import { searchIcons } from './icons.js';
import { validateUsage } from './validation.js';
import { inspectNeuralProject, suggestConsistentUi } from './project.js';
import { listNeuralResources, readNeuralResource } from './resources.js';
import {
  compileThemeRecipeJson,
  createThemeRecipe,
  diffThemeRecipeJson,
  editThemeRecipeJson,
  formatJson,
  getThemeComponentContract,
  validateThemeRecipeJson,
  type NeuralThemeRecipeCreateInput,
} from './theme.js';

const SERVER_NAME = 'neural-ng';
// Replaced from package.json in the packed artifact by prepare-package.mjs.
const SERVER_VERSION = '__NEURAL_MCP_PACKAGE_VERSION__';
const serverPackageSpecifier = '@modelcontextprotocol/server';
const stdioPackageSpecifier = '@modelcontextprotocol/server/stdio';
const zodPackageSpecifier = 'zod/v4';

interface McpServerRuntime {
  registerResource(
    name: string,
    uri: string,
    config: Record<string, unknown>,
    handler: (uri: URL) => Promise<{
      contents: readonly {
        uri: string;
        mimeType: string;
        text: string;
      }[];
    }>,
  ): unknown;
  registerTool(
    name: string,
    config: Record<string, unknown>,
    handler: (
      input: Record<string, unknown>,
    ) => Promise<Record<string, unknown>>,
  ): unknown;
}

interface McpServerConstructor {
  new (info: { name: string; version: string }): McpServerRuntime;
}

interface ZodStringRuntime {
  min(value: number): ZodStringRuntime;
  optional(): ZodStringRuntime;
  default(value: string): ZodStringRuntime;
}

interface ZodNumberRuntime {
  int(): ZodNumberRuntime;
  min(value: number): ZodNumberRuntime;
  max(value: number): ZodNumberRuntime;
  optional(): ZodNumberRuntime;
  default(value: number): ZodNumberRuntime;
}

interface ZodBooleanRuntime {
  optional(): ZodBooleanRuntime;
  default(value: boolean): ZodBooleanRuntime;
}

interface ZodRuntime {
  object(shape: Record<string, unknown>): unknown;
  string(): ZodStringRuntime;
  number(): ZodNumberRuntime;
  boolean(): ZodBooleanRuntime;
}

interface ServerModuleRuntime {
  McpServer: McpServerConstructor;
}

interface StdioModuleRuntime {
  serveStdio(factory: () => McpServerRuntime): Promise<void> | void;
}

interface RuntimeModules {
  readonly server: ServerModuleRuntime;
  readonly stdio: StdioModuleRuntime;
  readonly zod: ZodRuntime;
}

export async function createNeuralMcpServer(): Promise<McpServerRuntime> {
  const runtime = await loadRuntimeModules();
  return buildServer(runtime);
}

export async function serveNeuralMcpStdio(): Promise<void> {
  const runtime = await loadRuntimeModules();
  await runtime.stdio.serveStdio(() => buildServer(runtime));
}

function buildServer(runtime: RuntimeModules): McpServerRuntime {
  const server = new runtime.server.McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  for (const resource of listNeuralResources()) {
    server.registerResource(
      resource.name,
      resource.uri,
      {
        title: resource.title,
        description: resource.description,
        mimeType: resource.mimeType,
        cacheHint: { ttlMs: 0, cacheScope: 'private' },
      },
      async () => {
        const contents = readNeuralResource(resource.uri);
        if (!contents)
          throw new Error(`Unknown NeuralNg resource: ${resource.uri}`);
        return {
          contents: [
            {
              uri: contents.uri,
              mimeType: contents.mimeType,
              text: contents.text,
            },
          ],
        };
      },
    );
  }

  const commonAnnotations = {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  };

  server.registerTool(
    'search_components',
    {
      title: 'Search NeuralNg components',
      description:
        'Search the deterministic NeuralNg component catalog, README files, and llms.txt guidance.',
      inputSchema: runtime.zod.object({
        query: runtime.zod.string().min(1),
        limit: runtime.zod.number().int().min(1).max(20).optional().default(10),
      }),
      annotations: commonAnnotations,
    },
    async (input) =>
      jsonResult({
        matches: searchComponents(
          readRequiredString(input, 'query'),
          readNumber(input, 'limit', 10),
        ),
      }),
  );

  server.registerTool(
    'search_icons',
    {
      title: 'Search Neural Icons by UI intent',
      description:
        'Search all 6,184 Neural Icons variants by name, category, or common UI intent and return exact CSS classes, smallest category imports, usage markup, and accessibility guidance. Brand icons are excluded unless explicitly requested.',
      inputSchema: runtime.zod.object({
        query: runtime.zod.string().min(1),
        limit: runtime.zod.number().int().min(1).max(50).optional().default(10),
        style: runtime.zod.string().optional().default('any'),
        category: runtime.zod.string().optional().default(''),
        include_brands: runtime.zod.boolean().optional().default(false),
      }),
      annotations: commonAnnotations,
    },
    async (input) => {
      try {
        const category = readOptionalString(input, 'category', '').trim();
        return jsonResult({
          icons: searchIcons(readRequiredString(input, 'query'), {
            limit: readNumber(input, 'limit', 10),
            style: readOptionalString(input, 'style', 'any') as
              | 'any'
              | 'outline'
              | 'filled',
            ...(category ? { category } : {}),
            includeBrands: readBoolean(input, 'include_brands', false),
          }),
        });
      } catch (error) {
        return errorResult(readErrorMessage(error));
      }
    },
  );

  server.registerTool(
    'get_component',
    {
      title: 'Get a structured NeuralNg component API',
      description:
        'Resolve a component and return its versioned public API. Use summary for discovery, standard for implementation, or full for every class slot and example.',
      inputSchema: runtime.zod.object({
        component: runtime.zod.string().min(1),
        detail: runtime.zod.string().optional().default('standard'),
      }),
      annotations: commonAnnotations,
    },
    async (input) => {
      const reference = readRequiredString(input, 'component');
      const detail = readOptionalString(input, 'detail', 'standard');
      if (detail !== 'summary' && detail !== 'standard' && detail !== 'full') {
        return errorResult('detail must be "summary", "standard", or "full".');
      }
      const component = getComponentContract(reference);
      if (!component) {
        return errorResult(`Unknown NeuralNg component: ${reference}`);
      }
      return jsonResult({ component: componentView(component, detail) });
    },
  );

  server.registerTool(
    'get_component_examples',
    {
      title: 'Get NeuralNg component examples',
      description:
        'Return bounded, executable examples extracted from the published component README with their heading and language.',
      inputSchema: runtime.zod.object({
        component: runtime.zod.string().min(1),
        limit: runtime.zod.number().int().min(1).max(20).optional().default(5),
      }),
      annotations: commonAnnotations,
    },
    async (input) => {
      const reference = readRequiredString(input, 'component');
      const component = getComponentContract(reference);
      if (!component) {
        return errorResult(`Unknown NeuralNg component: ${reference}`);
      }
      return jsonResult({
        component: {
          id: component.id,
          className: component.className,
          selector: component.selector,
          entryPoint: component.entryPoint,
        },
        examples: getComponentExamples(
          reference,
          readNumber(input, 'limit', 5),
        ),
      });
    },
  );

  server.registerTool(
    'get_component_contract',
    {
      title: 'Get a NeuralNg component contract',
      description:
        'Resolve a component by id, class, selector, or entry point and return its public contract.',
      inputSchema: runtime.zod.object({
        component: runtime.zod.string().min(1),
      }),
      annotations: commonAnnotations,
    },
    async (input) => {
      const reference = readRequiredString(input, 'component');
      const component = getComponentContract(reference);
      if (!component) {
        return errorResult(`Unknown NeuralNg component: ${reference}`);
      }
      return jsonResult({ component });
    },
  );

  server.registerTool(
    'recommend_components',
    {
      title: 'Recommend NeuralNg components',
      description:
        'Recommend documented NeuralNg components for a UI goal using deterministic intent matching.',
      inputSchema: runtime.zod.object({
        goal: runtime.zod.string().min(1),
        limit: runtime.zod.number().int().min(1).max(20).optional().default(5),
      }),
      annotations: commonAnnotations,
    },
    async (input) =>
      jsonResult({
        matches: recommendComponents(
          readRequiredString(input, 'goal'),
          readNumber(input, 'limit', 5),
        ),
      }),
  );

  server.registerTool(
    'plan_ui',
    {
      title: 'Plan a NeuralNg UI composition',
      description:
        'Turn a product goal into a deterministic, contract-backed component composition with exact imports, providers, state, accessibility checks, and implementation order.',
      inputSchema: runtime.zod.object({
        goal: runtime.zod.string().min(1),
        kind: runtime.zod.string().optional().default('auto'),
      }),
      annotations: commonAnnotations,
    },
    async (input) => {
      try {
        const kind = readOptionalString(input, 'kind', 'auto');
        if (
          kind !== 'auto' &&
          kind !== 'form' &&
          kind !== 'page' &&
          kind !== 'table'
        ) {
          return errorResult(
            'kind must be "auto", "form", "page", or "table".',
          );
        }
        return jsonResult({
          plan: planUi({
            goal: readRequiredString(input, 'goal'),
            kind,
          }),
        });
      } catch (error) {
        return errorResult(readErrorMessage(error));
      }
    },
  );

  registerStructureTool(
    server,
    runtime,
    commonAnnotations,
    'suggest_form_structure',
    'form',
  );
  registerStructureTool(
    server,
    runtime,
    commonAnnotations,
    'suggest_page_structure',
    'page',
  );
  registerStructureTool(
    server,
    runtime,
    commonAnnotations,
    'suggest_table_structure',
    'table',
  );

  server.registerTool(
    'validate_usage',
    {
      title: 'Validate NeuralNg Angular template usage',
      description:
        'Parse an Angular template with @angular/compiler and validate syntax, NeuralNg elements and attribute directives, bindings, required inputs, literal values, icon-button accessibility, standalone imports, provider requirements, and duplicate Toast channels.',
      inputSchema: runtime.zod.object({
        template: runtime.zod.string().min(1),
        imports_json: runtime.zod.string().optional().default('[]'),
        providers_json: runtime.zod.string().optional().default('[]'),
      }),
      annotations: commonAnnotations,
    },
    async (input) => {
      try {
        return jsonResult({
          validation: validateUsage({
            template: readRequiredString(input, 'template'),
            imports: readStringArrayJson(
              readOptionalString(input, 'imports_json', '[]'),
              'imports_json',
            ),
            providers: readStringArrayJson(
              readOptionalString(input, 'providers_json', '[]'),
              'providers_json',
            ),
          }),
        });
      } catch (error) {
        return errorResult(readErrorMessage(error));
      }
    },
  );

  const inspectProjectHandler = async (): Promise<Record<string, unknown>> => {
    try {
      return jsonResult({ inspection: await inspectNeuralProject() });
    } catch (error) {
      return errorResult(readErrorMessage(error));
    }
  };
  server.registerTool(
    'inspect_project',
    {
      title: 'Inspect the current Angular project',
      description:
        'Read the bounded MCP working directory and return a schema-v2 Angular compiler-backed inventory of NeuralNg versions, templates, elements and attribute directives, exact imports, providers, icons, theme/appearance setup, conventions, evidence, and diagnostics.',
      inputSchema: runtime.zod.object({}),
      annotations: commonAnnotations,
    },
    inspectProjectHandler,
  );
  server.registerTool(
    'inspect_neuralng_project',
    {
      title: 'Inspect the current NeuralNg Angular workspace (legacy name)',
      description:
        'Compatibility alias for inspect_project. It accepts no path and returns the same read-only schema-v2 inspection.',
      inputSchema: runtime.zod.object({}),
      annotations: commonAnnotations,
    },
    inspectProjectHandler,
  );

  server.registerTool(
    'suggest_consistent_ui',
    {
      title: 'Plan UI consistent with the current project',
      description:
        'Inspect the current Angular workspace, create a contract-backed NeuralNg UI plan, and separate primitives that reuse existing project conventions from newly introduced primitives.',
      inputSchema: runtime.zod.object({
        goal: runtime.zod.string().min(1),
      }),
      annotations: commonAnnotations,
    },
    async (input) => {
      try {
        return jsonResult({
          suggestion: await suggestConsistentUi(
            readRequiredString(input, 'goal'),
          ),
        });
      } catch (error) {
        return errorResult(readErrorMessage(error));
      }
    },
  );

  server.registerTool(
    'create_theme_recipe',
    {
      title: 'Create a compact NeuralNg theme recipe',
      description:
        'Create a deterministic sparse recipe from high-level brand and interface decisions. Pass optional fields as a compact JSON object.',
      inputSchema: runtime.zod.object({
        name: runtime.zod.string().min(1),
        options_json: runtime.zod.string().optional().default('{}'),
      }),
      annotations: commonAnnotations,
    },
    async (input) => {
      try {
        const options = readJsonObject(
          readOptionalString(input, 'options_json', '{}'),
          'options_json',
        );
        const recipe = createThemeRecipe({
          name: readRequiredString(input, 'name'),
          ...readThemeCreateOptions(options),
        });
        const validation = await validateThemeRecipeJson(formatJson(recipe));
        return jsonResult({ recipe, validation: validation.validation });
      } catch (error) {
        return errorResult(readErrorMessage(error));
      }
    },
  );

  server.registerTool(
    'validate_theme_recipe',
    {
      title: 'Validate a NeuralNg theme recipe',
      description:
        'Validate compact recipe JSON against the published schema and the complete Core and Editor token contract.',
      inputSchema: runtime.zod.object({
        recipe_json: runtime.zod.string().min(2),
      }),
      annotations: commonAnnotations,
    },
    async (input) =>
      jsonResult(
        await validateThemeRecipeJson(readRequiredString(input, 'recipe_json')),
      ),
  );

  server.registerTool(
    'edit_theme_recipe',
    {
      title: 'Edit a compact NeuralNg theme recipe',
      description:
        'Apply a safe sparse patch with dotted set paths and unset paths, then validate the resulting recipe.',
      inputSchema: runtime.zod.object({
        recipe_json: runtime.zod.string().min(2),
        patch_json: runtime.zod.string().min(2),
      }),
      annotations: commonAnnotations,
    },
    async (input) =>
      jsonResult(
        await editThemeRecipeJson(
          readRequiredString(input, 'recipe_json'),
          readRequiredString(input, 'patch_json'),
        ),
      ),
  );

  server.registerTool(
    'diff_theme_recipes',
    {
      title: 'Diff compact NeuralNg theme recipes',
      description:
        'Return only the deterministic dotted paths that differ between two compact recipes.',
      inputSchema: runtime.zod.object({
        left_json: runtime.zod.string().min(2),
        right_json: runtime.zod.string().min(2),
      }),
      annotations: commonAnnotations,
    },
    async (input) => {
      try {
        return jsonResult({
          changes: diffThemeRecipeJson(
            readRequiredString(input, 'left_json'),
            readRequiredString(input, 'right_json'),
          ),
        });
      } catch (error) {
        return errorResult(readErrorMessage(error));
      }
    },
  );

  server.registerTool(
    'get_component_theme_contract',
    {
      title: 'Get a component-scoped NeuralNg theme contract',
      description:
        'Return only the supported theme properties for one Core or Editor component. Use detail=defaults only when current default values are needed.',
      inputSchema: runtime.zod.object({
        component: runtime.zod.string().min(1),
        detail: runtime.zod.string().optional().default('names'),
      }),
      annotations: commonAnnotations,
    },
    async (input) => {
      try {
        const detail = readOptionalString(input, 'detail', 'names');
        if (detail !== 'names' && detail !== 'defaults') {
          return errorResult('detail must be either "names" or "defaults".');
        }
        return jsonResult(
          await getThemeComponentContract(
            readRequiredString(input, 'component'),
            detail === 'defaults',
          ),
        );
      } catch (error) {
        return errorResult(readErrorMessage(error));
      }
    },
  );

  server.registerTool(
    'compile_theme_recipe',
    {
      title: 'Compile a NeuralNg theme recipe summary',
      description:
        'Compile and validate a compact recipe, returning summary, diagnostics, artifact byte sizes and integration instructions without emitting the full token graph.',
      inputSchema: runtime.zod.object({
        recipe_json: runtime.zod.string().min(2),
      }),
      annotations: commonAnnotations,
    },
    async (input) =>
      jsonResult(
        await compileThemeRecipeJson(readRequiredString(input, 'recipe_json')),
      ),
  );

  return server;
}

function registerStructureTool(
  server: McpServerRuntime,
  runtime: RuntimeModules,
  annotations: Record<string, boolean>,
  name: string,
  kind: 'form' | 'page' | 'table',
): void {
  server.registerTool(
    name,
    {
      title: `Suggest a NeuralNg ${kind} structure`,
      description: `Return a contract-backed ${kind} composition with exact imports, providers, state ownership, accessibility checks, and implementation order.`,
      inputSchema: runtime.zod.object({
        goal: runtime.zod.string().min(1),
      }),
      annotations,
    },
    async (input) => {
      try {
        return jsonResult({
          plan: planUi({ goal: readRequiredString(input, 'goal'), kind }),
        });
      } catch (error) {
        return errorResult(readErrorMessage(error));
      }
    },
  );
}

async function loadRuntimeModules(): Promise<RuntimeModules> {
  const [server, stdio, zod] = await Promise.all([
    import(serverPackageSpecifier) as Promise<unknown>,
    import(stdioPackageSpecifier) as Promise<unknown>,
    import(zodPackageSpecifier) as Promise<unknown>,
  ]);

  if (!hasConstructor(server, 'McpServer')) {
    throw new Error('@modelcontextprotocol/server does not export McpServer.');
  }
  if (!hasFunction(stdio, 'serveStdio')) {
    throw new Error(
      '@modelcontextprotocol/server/stdio does not export serveStdio.',
    );
  }
  if (!isZodRuntime(zod)) {
    throw new Error('zod/v4 does not expose the required schema builders.');
  }

  return {
    server: server as unknown as ServerModuleRuntime,
    stdio: stdio as unknown as StdioModuleRuntime,
    zod,
  };
}

function jsonResult(value: unknown): Record<string, unknown> {
  const structuredContent = isRecord(value) ? value : { result: value };
  return {
    content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    structuredContent,
  };
}

function errorResult(message: string): Record<string, unknown> {
  return {
    isError: true,
    content: [{ type: 'text', text: message }],
    structuredContent: {
      error: {
        schemaVersion: 1,
        message,
      },
    },
  };
}

function componentView(
  component: NonNullable<ReturnType<typeof getComponentContract>>,
  detail: 'summary' | 'standard' | 'full',
): Record<string, unknown> {
  if (detail === 'full') return { ...component };

  const base = {
    schemaVersion: component.schemaVersion,
    id: component.id,
    name: component.name,
    className: component.className,
    kind: component.kind,
    selector: component.selector,
    entryPoint: component.entryPoint,
    status: component.status,
    summary: component.summary,
    formContract: component.formContract,
    relatedComponents: component.relatedComponents,
    resources: component.resources,
  };
  if (detail === 'summary') return base;

  return {
    ...base,
    inputs: component.inputs,
    models: component.models,
    outputs: component.outputs,
    templates: component.templates,
    providers: component.providers,
    providerRequirements: component.providerRequirements,
    methods: component.methods,
    typeAliases: component.typeAliases,
    classTypes: component.classes.map((contract) => contract.typeName),
    exampleCount: component.examples.length,
  };
}

function readRequiredString(
  input: Record<string, unknown>,
  key: string,
): string {
  const value = input[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`${key} must be a non-empty string.`);
  }
  return value;
}

function readNumber(
  input: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const value = input[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function readBoolean(
  input: Record<string, unknown>,
  key: string,
  fallback: boolean,
): boolean {
  const value = input[key];
  return typeof value === 'boolean' ? value : fallback;
}

function readOptionalString(
  input: Record<string, unknown>,
  key: string,
  fallback: string,
): string {
  const value = input[key];
  return typeof value === 'string' ? value : fallback;
}

function readJsonObject(value: string, label: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value) as unknown;
  } catch (error) {
    throw new SyntaxError(
      `${label} must be valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (!isRecord(parsed)) throw new TypeError(`${label} must be a JSON object.`);
  return parsed;
}

function readStringArrayJson(value: string, label: string): string[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new TypeError(`${label} must be valid JSON.`);
  }
  if (
    !Array.isArray(parsed) ||
    parsed.some((item) => typeof item !== 'string')
  ) {
    throw new TypeError(`${label} must be a JSON array of strings.`);
  }
  return parsed;
}

function readThemeCreateOptions(
  input: Record<string, unknown>,
): Omit<NeuralThemeRecipeCreateInput, 'name'> {
  const allowed = new Set([
    'description',
    'preset',
    'primary',
    'surface',
    'radius',
    'border',
    'density',
    'elevation',
    'motion',
    'typographyScale',
  ]);
  for (const key of Object.keys(input)) {
    if (!allowed.has(key))
      throw new TypeError(`Unknown theme recipe option: ${key}.`);
    if (typeof input[key] !== 'string') {
      throw new TypeError(`Theme recipe option ${key} must be a string.`);
    }
  }
  return input as Omit<NeuralThemeRecipeCreateInput, 'name'>;
}

function readErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function hasConstructor(
  value: unknown,
  key: string,
): value is Record<string, new (...args: never[]) => unknown> {
  return isRecord(value) && typeof value[key] === 'function';
}

function hasFunction(
  value: unknown,
  key: string,
): value is Record<string, (...args: never[]) => unknown> {
  return isRecord(value) && typeof value[key] === 'function';
}

function isZodRuntime(value: unknown): value is ZodRuntime {
  return (
    isRecord(value) &&
    typeof value['object'] === 'function' &&
    typeof value['string'] === 'function' &&
    typeof value['number'] === 'function'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
