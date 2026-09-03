import {
  getComponentContract,
  recommendComponents,
  searchComponents,
} from './catalog.js';
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
const SERVER_VERSION = '0.1.0-beta.6';
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

interface ZodRuntime {
  object(shape: Record<string, unknown>): unknown;
  string(): ZodStringRuntime;
  number(): ZodNumberRuntime;
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
  return {
    content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
  };
}

function errorResult(message: string): Record<string, unknown> {
  return {
    isError: true,
    content: [{ type: 'text', text: message }],
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
