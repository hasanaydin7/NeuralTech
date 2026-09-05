import { access, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import process from 'node:process';

const packageRoot = resolve(
  process.cwd(),
  process.argv[2] ?? 'dist/libs/neural-mcp',
);
const packageJson = await readJson('package.json');

assert(
  packageJson.name === '@neural-ng/mcp-server',
  'Unexpected package name.',
);
assert(
  /^0\.1\.0(?:-(?:beta|rc)\.\d+)?$/.test(packageJson.version),
  'Unexpected package version.',
);
assert(
  packageJson.mcpName === 'io.github.hasanaydin7/neuralng',
  'Published MCP package must declare its verified registry name.',
);
assert(packageJson.type === 'module', 'MCP package must publish ESM.');
assert(packageJson.license === 'MIT', 'MCP package must declare MIT.');
assert(
  packageJson.dependencies?.['@modelcontextprotocol/server'] === '2.0.0',
  'MCP server SDK must remain pinned to the verified v2 release.',
);
assert(
  packageJson.dependencies?.['@angular/compiler'] === '^22.0.0',
  'MCP validation must use the supported Angular 22 template parser.',
);
assert(
  packageJson.dependencies?.zod?.startsWith('^4.'),
  'MCP package must use Zod v4 Standard Schema inputs.',
);
assert(
  packageJson.dependencies?.['@neural-ng/theme'] === '0.1.0-beta.5',
  'MCP theme tools must depend on the verified @neural-ng/theme release.',
);
assert(
  Object.keys(packageJson.dependencies ?? {}).filter((name) =>
    name.startsWith('@angular/'),
  ).length === 1,
  'Only @angular/compiler may enter the MCP runtime dependency graph.',
);

for (const path of [
  'src/index.js',
  'src/index.d.ts',
  'src/cli.js',
  'README.md',
  'CHANGELOG.md',
  'llms.txt',
  'server.json',
  'LICENSE',
]) {
  await access(join(packageRoot, path));
}

const api = await import(pathToFileURL(join(packageRoot, 'src/index.js')).href);
const registryMetadata = await readJson('server.json');
assert(
  registryMetadata.name === packageJson.mcpName &&
    registryMetadata.version === packageJson.version,
  'Registry metadata must match the published MCP package.',
);
const compiledServer = await readFile(
  join(packageRoot, 'src/server.js'),
  'utf8',
);
assert(
  !compiledServer.includes('__NEURAL_MCP_PACKAGE_VERSION__') &&
    compiledServer.includes(packageJson.version),
  'Runtime server version must be injected from package.json.',
);
assert(
  registryMetadata.packages?.[0]?.identifier === packageJson.name &&
    registryMetadata.packages?.[0]?.version === packageJson.version &&
    registryMetadata.packages?.[0]?.transport?.type === 'stdio',
  'Registry npm transport metadata is incorrect.',
);
const components = api.listComponents();
const triState = api.getComponentContract('neural-tri-state-checkbox');
const autoComplete = api.getComponentContract('neural-auto-complete');
const multiSelect = api.getComponentContract('neural-multi-select');
const treeSelect = api.getComponentContract('neural-tree-select');
const recommendations = api.recommendComponents(
  'nullable inherited permission checkbox',
);

assert(components.length > 80, 'Published catalog is unexpectedly small.');
assert(
  triState?.formContract === 'FormValueControl<boolean | null>',
  'Tri-state checkbox contract is incorrect.',
);
assert(
  autoComplete?.formContract === 'FormValueControl<TValue | string | null>',
  'AutoComplete contract is incorrect.',
);
assert(
  multiSelect?.formContract === 'FormValueControl<readonly TValue[]>',
  'MultiSelect contract is incorrect.',
);
assert(
  treeSelect?.formContract ===
    'FormValueControl<NeuralTreeSelectValue<TValue>>',
  'TreeSelect contract is incorrect.',
);
assert(
  treeSelect?.models?.some(
    (model) =>
      model.name === 'value' && model.type === 'NeuralTreeSelectValue<TValue>',
  ),
  'TreeSelect value model is incorrect.',
);
assert(
  recommendations[0]?.component?.id === 'tri-state-checkbox',
  'Deterministic recommendation contract is incorrect.',
);
assert(
  api.readNeuralResource('neural://components/../../package.json') ===
    undefined,
  'Traversal-like resource URI was accepted.',
);
assert(
  api
    .readNeuralResource('neural://themes/schema')
    ?.text?.includes('compact sparse JSON recipe'),
  'Compact theme schema resource is missing.',
);
const capabilities = JSON.parse(
  api.readNeuralResource('neural://server/capabilities')?.text ?? '{}',
);
assert(
  capabilities.schemaVersion === 1 &&
    capabilities.resultSchemas?.usageValidation === 2 &&
    capabilities.resultSchemas?.iconSearch === 1 &&
    capabilities.toolGroups?.icons?.includes('search_icons') &&
    capabilities.toolGroups?.composition?.includes('plan_ui') &&
    capabilities.toolGroups?.correctness?.includes('validate_usage'),
  'Published MCP package is missing its versioned capabilities resource.',
);
const iconSearch = api.searchIcons('delete user', { limit: 10 });
assert(
  iconSearch.schemaVersion === 1 &&
    iconSearch.matches.some(
      (match) =>
        match.icon.name === 'trash' &&
        match.icon.className === 'nt nt-trash' &&
        match.icon.cssImports.outline.includes('@neural-ng/icons/'),
    ),
  'Published MCP package icon search contract is incomplete.',
);
assert(
  typeof api.createThemeRecipe === 'function' &&
    typeof api.validateThemeRecipeJson === 'function',
  'Published MCP package is missing theme helper exports.',
);

const cli = await readFile(join(packageRoot, 'src/cli.js'), 'utf8');
assert(
  cli.startsWith('#!/usr/bin/env node'),
  'Published CLI is missing its shebang.',
);

console.log(
  `Validated @neural-ng/mcp-server: ${components.length} public declarations, ` +
    '6,184 icon variants, fixed resources, compact theme tools, and the isolated Angular template parser.',
);

async function readJson(path) {
  return JSON.parse(await readFile(join(packageRoot, path), 'utf8'));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
