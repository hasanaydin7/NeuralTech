export interface NeuralThemeDiagnostic {
  readonly severity: 'error' | 'warning';
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface NeuralThemeValidationResult {
  readonly valid: boolean;
  readonly diagnostics: readonly NeuralThemeDiagnostic[];
}

export interface NeuralThemeTokenContractEntry {
  readonly name: string;
  readonly component: string;
  readonly source: 'core' | 'editor' | 'shared';
  readonly modes: Readonly<Record<string, string | undefined>>;
}

export interface NeuralThemeRecipe {
  readonly [key: string]: unknown;
  readonly name: string;
  readonly schemaVersion?: 1;
  readonly extends?: 'neutral' | 'glass' | 'mist' | 'futuristic';
  readonly description?: string;
  readonly color?: Readonly<Record<string, string | undefined>>;
  readonly typography?: Readonly<Record<string, string | undefined>>;
  readonly shape?: Readonly<Record<string, string | undefined>>;
  readonly density?: 'compact' | 'comfortable' | 'spacious';
  readonly elevation?: 'none' | 'soft' | 'default' | 'strong';
  readonly motion?: 'reduced' | 'fast' | 'default' | 'slow';
  readonly modes?: Readonly<Record<string, unknown>>;
  readonly components?: Readonly<
    Record<string, Readonly<Record<string, unknown>>>
  >;
  readonly tokens?: Readonly<Record<string, string | number>>;
  readonly output?: Readonly<Record<string, boolean>>;
  readonly generator?: Readonly<Record<string, string>>;
}

export interface NeuralThemeSummary {
  readonly name: string;
  readonly extends: 'neutral' | 'glass' | 'mist' | 'futuristic';
  readonly primary: string;
  readonly surface: string;
  readonly density: string;
  readonly radius: string;
  readonly elevation: string;
  readonly motion: string;
  readonly quality: {
    readonly status: 'release' | 'preview';
    readonly minimumPrimarySurfaceContrast: number;
    readonly allowedDiagnosticCodes: readonly string[];
  };
  readonly modes: readonly string[];
  readonly componentOverrides: readonly string[];
  readonly tokenOverrides: number;
  readonly sourceHash: string;
}

export interface NeuralThemeArtifacts {
  readonly name: string;
  readonly css: string;
  readonly tokens: string;
  readonly report: string;
  readonly types: string;
  readonly summary: NeuralThemeSummary;
}

const themePackageSpecifier = '@neural-ng/theme/browser';
const MAX_RECIPE_LENGTH = 64_000;
const MAX_PATCH_ENTRIES = 64;
const MAX_PATH_DEPTH = 8;
const BLOCKED_PATH_SEGMENTS = new Set([
  '__proto__',
  'prototype',
  'constructor',
]);

export interface NeuralThemeRuntime {
  readonly NEURAL_THEME_RECIPE_VERSION: number;
  compileTheme(recipe: NeuralThemeRecipe): NeuralThemeArtifacts;
  validateThemeRecipe(input: unknown): NeuralThemeValidationResult;
  listThemeComponents(): readonly string[];
  listThemePresets(): readonly {
    readonly id: 'neutral' | 'glass' | 'mist' | 'futuristic';
    readonly label: string;
    readonly description: string;
    readonly stability: 'stable' | 'experimental';
    readonly quality: {
      readonly status: 'release' | 'preview';
      readonly minimumPrimarySurfaceContrast: number;
      readonly allowedDiagnosticCodes: readonly string[];
    };
  }[];
  getComponentThemeContract(
    component: string,
  ): readonly NeuralThemeTokenContractEntry[];
}

export interface NeuralThemeRecipeCreateInput {
  readonly name: string;
  readonly preset?: 'neutral' | 'glass' | 'mist' | 'futuristic';
  readonly description?: string;
  readonly primary?: string;
  readonly surface?: string;
  readonly radius?: string;
  readonly border?: string;
  readonly density?: string;
  readonly elevation?: string;
  readonly motion?: string;
  readonly typographyScale?: string;
}

export interface NeuralThemeRecipePatch {
  readonly set?: Readonly<Record<string, unknown>>;
  readonly unset?: readonly string[];
}

export interface NeuralThemeRecipeDiffEntry {
  readonly path: string;
  readonly before?: unknown;
  readonly after?: unknown;
}

export const NEURAL_THEME_SCHEMA_GUIDE = {
  schemaVersion: 1,
  package: '@neural-ng/theme',
  authoringFormat: 'compact sparse JSON recipe',
  extends: ['neutral', 'glass', 'mist', 'futuristic'],
  required: ['name'],
  defaults: {
    preset: 'neutral',
    primary: 'blue',
    surface: 'slate',
    radius: 'medium',
    border: 'default',
    density: 'comfortable',
    elevation: 'soft',
    motion: 'default',
    typographyScale: 'default',
    darkMode: 'auto',
  },
  presetGovernance: {
    neutral: { stability: 'stable', quality: 'release' },
    glass: { stability: 'experimental', quality: 'preview' },
    mist: { stability: 'experimental', quality: 'preview' },
    futuristic: { stability: 'experimental', quality: 'preview' },
  },
  enums: {
    surface: ['slate', 'gray', 'zinc', 'neutral', 'stone'],
    radius: ['none', 'small', 'medium', 'large', 'xlarge'],
    border: ['none', 'subtle', 'default', 'strong'],
    density: ['compact', 'comfortable', 'spacious'],
    elevation: ['none', 'soft', 'default', 'strong'],
    motion: ['reduced', 'fast', 'default', 'slow'],
    typographyScale: ['compact', 'default', 'large'],
  },
  sparsePatch: {
    set: {
      'color.primary': '#7c3aed',
      'shape.radius': 'large',
      'components.toast.progressColor': '{color.primary}',
    },
    unset: ['components.toast.progressColor'],
  },
} as const;

export const NEURAL_THEME_AI_GUIDE = {
  principle:
    'Author or edit the compact recipe only. Never emit the resolved 1,348-token graph unless the user explicitly requests an artifact from the CLI.',
  workflow: [
    'Read neural://themes/schema and neural://themes/presets.',
    'Prefer a release-quality preset unless the user requests a preview visual system.',
    'Create or edit a sparse recipe.',
    'Validate before recommending integration.',
    'Read only the target component theme contract for component overrides.',
    'Use the CLI to write CSS and token artifacts to disk.',
  ],
  preferredTools: [
    'create_theme_recipe',
    'validate_theme_recipe',
    'edit_theme_recipe',
    'diff_theme_recipes',
    'get_component_theme_contract',
    'compile_theme_recipe',
  ],
  integration: {
    install: 'npm install -D @neural-ng/theme',
    build: 'npx neural-theme build',
    css: "@import './styles/generated/<theme-name>.css';",
    html: '<html data-neural-theme="<theme-name>" data-neural-mode="light">',
  },
} as const;

export const BUILT_IN_THEME_RECIPES: Readonly<
  Record<'neutral' | 'glass' | 'mist' | 'futuristic', NeuralThemeRecipe>
> = {
  neutral: {
    schemaVersion: 1,
    name: 'neutral',
    extends: 'neutral',
    modes: { dark: 'auto' },
    output: { tailwind: true, tokens: true, report: true, types: true },
    generator: { colorAlgorithm: 'neural-oklch-v1' },
  },
  glass: {
    schemaVersion: 1,
    name: 'glass',
    extends: 'glass',
    modes: { dark: 'auto' },
    output: { tailwind: true, tokens: true, report: true, types: true },
    generator: { colorAlgorithm: 'neural-oklch-v1' },
  },
  mist: {
    schemaVersion: 1,
    name: 'mist',
    extends: 'mist',
    modes: { dark: 'auto' },
    output: { tailwind: true, tokens: true, report: true, types: true },
    generator: { colorAlgorithm: 'neural-oklch-v1' },
  },
  futuristic: {
    schemaVersion: 1,
    name: 'futuristic',
    extends: 'futuristic',
    modes: { dark: 'auto' },
    output: { tailwind: true, tokens: true, report: true, types: true },
    generator: { colorAlgorithm: 'neural-oklch-v1' },
  },
};

export const NEUTRAL_THEME_RECIPE = BUILT_IN_THEME_RECIPES.neutral;

let runtimePromise: Promise<NeuralThemeRuntime> | undefined;

export async function loadNeuralThemeRuntime(): Promise<NeuralThemeRuntime> {
  runtimePromise ??= import(themePackageSpecifier).then((module) => {
    if (!isThemeRuntime(module)) {
      throw new Error(
        '@neural-ng/theme/browser does not expose the required compiler contract.',
      );
    }
    return module;
  });
  return runtimePromise;
}

export function createThemeRecipe(
  input: NeuralThemeRecipeCreateInput,
): NeuralThemeRecipe {
  const name = input.name.trim();
  const recipe: NeuralThemeRecipe = {
    schemaVersion: 1,
    name,
    extends: input.preset ?? 'neutral',
    color: compactNested({
      primary: optionalTrimmed(input.primary),
      surface: optionalTrimmed(input.surface),
    }),
    typography: compactNested({
      scale: optionalTrimmed(input.typographyScale),
    }) as NeuralThemeRecipe['typography'],
    shape: compactNested({
      radius: optionalTrimmed(input.radius),
      border: optionalTrimmed(input.border),
    }) as NeuralThemeRecipe['shape'],
    density: optionalTrimmed(input.density) as NeuralThemeRecipe['density'],
    elevation: optionalTrimmed(
      input.elevation,
    ) as NeuralThemeRecipe['elevation'],
    motion: optionalTrimmed(input.motion) as NeuralThemeRecipe['motion'],
    modes: { dark: 'auto' },
    generator: { colorAlgorithm: 'neural-oklch-v1' },
  };

  const description = optionalTrimmed(input.description);
  return compactObject({
    ...recipe,
    description,
  }) as unknown as NeuralThemeRecipe;
}

export function parseThemeRecipeJson(recipeJson: string): unknown {
  if (recipeJson.length > MAX_RECIPE_LENGTH) {
    throw new RangeError(
      `Theme recipe JSON exceeds the ${MAX_RECIPE_LENGTH}-character MCP limit.`,
    );
  }
  try {
    return JSON.parse(recipeJson) as unknown;
  } catch (error) {
    throw new SyntaxError(
      `Theme recipe is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export async function validateThemeRecipeJson(
  recipeJson: string,
  runtime?: NeuralThemeRuntime,
): Promise<{
  readonly recipe?: NeuralThemeRecipe;
  readonly validation: NeuralThemeValidationResult;
}> {
  let input: unknown;
  try {
    input = parseThemeRecipeJson(recipeJson);
  } catch (error) {
    return {
      validation: {
        valid: false,
        diagnostics: [
          {
            severity: 'error',
            code: 'recipe.json',
            path: '$',
            message: error instanceof Error ? error.message : String(error),
          },
        ],
      },
    };
  }

  const activeRuntime = runtime ?? (await loadNeuralThemeRuntime());
  const validation = activeRuntime.validateThemeRecipe(input);
  return {
    recipe: validation.valid ? (input as NeuralThemeRecipe) : undefined,
    validation,
  };
}

export async function editThemeRecipeJson(
  recipeJson: string,
  patchJson: string,
  runtime?: NeuralThemeRuntime,
): Promise<{
  readonly recipe?: NeuralThemeRecipe;
  readonly recipeJson?: string;
  readonly validation: NeuralThemeValidationResult;
}> {
  const activeRuntime = runtime ?? (await loadNeuralThemeRuntime());
  const source = await validateThemeRecipeJson(recipeJson, activeRuntime);
  if (!source.recipe) return { validation: source.validation };

  let patch: NeuralThemeRecipePatch;
  try {
    patch = parseRecipePatch(patchJson);
  } catch (error) {
    return {
      validation: {
        valid: false,
        diagnostics: [
          {
            severity: 'error',
            code: 'recipe.patch',
            path: '$',
            message: error instanceof Error ? error.message : String(error),
          },
        ],
      },
    };
  }

  const edited = cloneJson(source.recipe) as Record<string, unknown>;
  for (const [path, value] of Object.entries(patch.set ?? {}).sort(
    ([left], [right]) => left.localeCompare(right, 'en'),
  )) {
    setPath(edited, path, cloneJson(value));
  }
  for (const path of [...(patch.unset ?? [])].sort((left, right) =>
    left.localeCompare(right, 'en'),
  )) {
    unsetPath(edited, path);
  }

  const validation = activeRuntime.validateThemeRecipe(edited);
  return {
    recipe: validation.valid
      ? (edited as unknown as NeuralThemeRecipe)
      : undefined,
    recipeJson: validation.valid ? formatJson(edited) : undefined,
    validation,
  };
}

export function diffThemeRecipeJson(
  leftJson: string,
  rightJson: string,
): readonly NeuralThemeRecipeDiffEntry[] {
  const left = parseThemeRecipeJson(leftJson);
  const right = parseThemeRecipeJson(rightJson);
  const leftFlat = flattenJson(left);
  const rightFlat = flattenJson(right);
  const paths = [...new Set([...leftFlat.keys(), ...rightFlat.keys()])].sort(
    (a, b) => a.localeCompare(b, 'en'),
  );

  return paths
    .filter((path) => !deepEqual(leftFlat.get(path), rightFlat.get(path)))
    .map((path) => ({
      path,
      ...(leftFlat.has(path) ? { before: leftFlat.get(path) } : {}),
      ...(rightFlat.has(path) ? { after: rightFlat.get(path) } : {}),
    }));
}

export async function compileThemeRecipeJson(
  recipeJson: string,
  runtime?: NeuralThemeRuntime,
): Promise<{
  readonly valid: boolean;
  readonly diagnostics: readonly NeuralThemeDiagnostic[];
  readonly summary?: NeuralThemeSummary;
  readonly artifacts?: Readonly<Record<string, { readonly bytes: number }>>;
  readonly integration?: {
    readonly command: string;
    readonly cssImport: string;
    readonly htmlAttributes: string;
  };
}> {
  const activeRuntime = runtime ?? (await loadNeuralThemeRuntime());
  const validated = await validateThemeRecipeJson(recipeJson, activeRuntime);
  if (!validated.recipe) {
    return {
      valid: false,
      diagnostics: validated.validation.diagnostics,
    };
  }

  const artifacts = activeRuntime.compileTheme(validated.recipe);
  const reportDiagnostics = readReportDiagnostics(artifacts.report);
  return {
    valid: !reportDiagnostics.some(
      (diagnostic) => diagnostic.severity === 'error',
    ),
    diagnostics: reportDiagnostics,
    summary: artifacts.summary,
    artifacts: {
      css: { bytes: byteLength(artifacts.css) },
      tokens: { bytes: byteLength(artifacts.tokens) },
      report: { bytes: byteLength(artifacts.report) },
      types: { bytes: byteLength(artifacts.types) },
    },
    integration: {
      command: 'npx neural-theme build',
      cssImport: `@import './styles/generated/${artifacts.name}.css';`,
      htmlAttributes: `data-neural-theme="${artifacts.name}" data-neural-mode="light"`,
    },
  };
}

export async function getThemeComponentContract(
  component: string,
  includeDefaults: boolean,
  runtime?: NeuralThemeRuntime,
): Promise<{
  readonly component: string;
  readonly tokenCount: number;
  readonly properties: readonly Record<string, unknown>[];
}> {
  const activeRuntime = runtime ?? (await loadNeuralThemeRuntime());
  const entries = activeRuntime.getComponentThemeContract(component);
  if (entries.length === 0) {
    throw new Error(`Unknown NeuralNg theme component: ${component}`);
  }
  const normalized = entries[0]?.component ?? component;
  return {
    component: normalized,
    tokenCount: entries.length,
    properties: entries.map((entry) => ({
      property: tokenToProperty(entry.name, normalized),
      token: entry.name,
      source: entry.source,
      modes: Object.keys(entry.modes).sort((left, right) =>
        left.localeCompare(right, 'en'),
      ),
      ...(includeDefaults ? { defaults: entry.modes } : {}),
    })),
  };
}

export async function listThemeComponentIds(
  runtime?: NeuralThemeRuntime,
): Promise<readonly string[]> {
  const activeRuntime = runtime ?? (await loadNeuralThemeRuntime());
  return activeRuntime.listThemeComponents();
}

export function formatJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function parseRecipePatch(patchJson: string): NeuralThemeRecipePatch {
  const input = parseThemeRecipeJson(patchJson);
  if (!isRecord(input))
    throw new TypeError('Theme recipe patch must be an object.');

  const allowedKeys = new Set(['set', 'unset']);
  for (const key of Object.keys(input)) {
    if (!allowedKeys.has(key))
      throw new TypeError(`Unknown theme patch field: ${key}.`);
  }

  const set = input['set'];
  const unset = input['unset'];
  if (set !== undefined && !isRecord(set)) {
    throw new TypeError('Theme patch set must be an object of dotted paths.');
  }
  if (
    unset !== undefined &&
    (!Array.isArray(unset) || unset.some((value) => typeof value !== 'string'))
  ) {
    throw new TypeError('Theme patch unset must be an array of dotted paths.');
  }

  const setEntries = Object.entries(set ?? {});
  const unsetEntries = (unset ?? []) as string[];
  if (setEntries.length + unsetEntries.length > MAX_PATCH_ENTRIES) {
    throw new RangeError(
      `Theme patch supports at most ${MAX_PATCH_ENTRIES} changes.`,
    );
  }
  for (const path of [...setEntries.map(([path]) => path), ...unsetEntries]) {
    parseSafePath(path);
  }
  return {
    set: set as Record<string, unknown> | undefined,
    unset: unsetEntries,
  };
}

function setPath(
  target: Record<string, unknown>,
  path: string,
  value: unknown,
): void {
  const segments = parseSafePath(path);
  let cursor = target;
  for (const segment of segments.slice(0, -1)) {
    const current = cursor[segment];
    if (!isRecord(current)) cursor[segment] = {};
    cursor = cursor[segment] as Record<string, unknown>;
  }
  cursor[segments[segments.length - 1] as string] = value;
}

function unsetPath(target: Record<string, unknown>, path: string): void {
  const segments = parseSafePath(path);
  let cursor: Record<string, unknown> = target;
  for (const segment of segments.slice(0, -1)) {
    const current = cursor[segment];
    if (!isRecord(current)) return;
    cursor = current;
  }
  delete cursor[segments[segments.length - 1] as string];
}

function parseSafePath(path: string): readonly string[] {
  const segments = path.split('.');
  if (
    segments.length === 0 ||
    segments.length > MAX_PATH_DEPTH ||
    segments.some(
      (segment) =>
        !segment ||
        !/^[A-Za-z][A-Za-z0-9-]*$/.test(segment) ||
        BLOCKED_PATH_SEGMENTS.has(segment),
    )
  ) {
    throw new TypeError(`Unsafe or invalid theme recipe path: ${path}.`);
  }
  return segments;
}

function flattenJson(value: unknown): ReadonlyMap<string, unknown> {
  const output = new Map<string, unknown>();
  visit(value, '', output);
  return output;
}

function visit(
  value: unknown,
  path: string,
  output: Map<string, unknown>,
): void {
  if (isRecord(value)) {
    const entries = Object.entries(value).sort(([left], [right]) =>
      left.localeCompare(right, 'en'),
    );
    if (entries.length === 0 && path) output.set(path, {});
    for (const [key, child] of entries)
      visit(child, path ? `${path}.${key}` : key, output);
    return;
  }
  if (Array.isArray(value)) {
    if (value.length === 0 && path) output.set(path, []);
    value.forEach((child, index) => visit(child, `${path}[${index}]`, output));
    return;
  }
  if (path) output.set(path, value);
}

function readReportDiagnostics(
  report: string,
): readonly NeuralThemeDiagnostic[] {
  try {
    const parsed = JSON.parse(report) as unknown;
    if (!isRecord(parsed) || !Array.isArray(parsed['diagnostics'])) return [];
    return parsed['diagnostics'].filter(isDiagnostic);
  } catch {
    return [];
  }
}

function tokenToProperty(token: string, component: string): string {
  const prefix = `--neural-${component}-`;
  const value = token.startsWith(prefix) ? token.slice(prefix.length) : token;
  return value.replace(/-([a-z0-9])/g, (_match, letter: string) =>
    letter.toUpperCase(),
  );
}

function compactNested<T extends Record<string, unknown>>(
  value: T,
): Partial<T> | undefined {
  const compact = compactObject(value);
  return Object.keys(compact).length > 0 ? compact : undefined;
}

function compactObject<T extends Record<string, unknown>>(
  value: T,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, entry]) => entry !== undefined && entry !== '',
    ),
  ) as Partial<T>;
}

function optionalTrimmed(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}

function cloneJson(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value)) as unknown;
}

function deepEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

function isThemeRuntime(value: unknown): value is NeuralThemeRuntime {
  return (
    isRecord(value) &&
    typeof value['compileTheme'] === 'function' &&
    typeof value['validateThemeRecipe'] === 'function' &&
    typeof value['listThemeComponents'] === 'function' &&
    typeof value['listThemePresets'] === 'function' &&
    typeof value['getComponentThemeContract'] === 'function' &&
    typeof value['NEURAL_THEME_RECIPE_VERSION'] === 'number'
  );
}

function isDiagnostic(value: unknown): value is NeuralThemeDiagnostic {
  return (
    isRecord(value) &&
    (value['severity'] === 'error' || value['severity'] === 'warning') &&
    typeof value['code'] === 'string' &&
    typeof value['path'] === 'string' &&
    typeof value['message'] === 'string'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
