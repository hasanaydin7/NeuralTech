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
assert(packageJson.version === '0.1.0-beta.5', 'Unexpected package version.');
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
  packageJson.dependencies?.zod?.startsWith('^4.'),
  'MCP package must use Zod v4 Standard Schema inputs.',
);
assert(
  packageJson.dependencies?.['@neural-ng/theme'] === packageJson.version,
  'MCP theme tools must depend on the matching @neural-ng/theme release.',
);
assert(
  !JSON.stringify(packageJson).includes('@angular/'),
  'Angular leaked into MCP package.',
);

for (const path of [
  'src/index.js',
  'src/index.d.ts',
  'src/cli.js',
  'README.md',
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
    'fixed resources, compact theme tools, and no Angular runtime dependency.',
);

async function readJson(path) {
  return JSON.parse(await readFile(join(packageRoot, path), 'utf8'));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
