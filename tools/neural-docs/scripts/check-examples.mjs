import { assertIncludes, readJson, readText } from './shared.mjs';

const contract = await readJson('tools/neural-docs/docs-contract.json');
const starterManifest = await readJson(`${contract.starter.root}/package.json`);
const starterSource = [
  await readText(`${contract.starter.root}/src/app/app.ts`),
  await readText(`${contract.starter.root}/src/app/app.config.ts`),
  await readText(`${contract.starter.root}/src/app/app.html`),
  await readText(`${contract.starter.root}/src/styles.css`),
].join('\n');

const expectedPlacement = new Map([
  ['@neural-ng/core', 'dependencies'],
  ['@neural-ng/icons', 'dependencies'],
  ['@neural-ng/editor', 'dependencies'],
  ['@neural-ng/theme', 'devDependencies'],
  ['@neural-ng/mcp-server', 'devDependencies'],
]);

for (const [packageName, collection] of expectedPlacement) {
  if (!starterManifest[collection]?.[packageName]) {
    throw new Error(`${packageName} must be listed in starter ${collection}.`);
  }
}

for (const forbidden of ['libs/neural-', '../../libs/', 'dist/libs/']) {
  if (starterSource.includes(forbidden)) {
    throw new Error(
      `Starter examples must not import workspace source: ${forbidden}`,
    );
  }
}

for (const expected of [
  "@import 'tailwindcss'",
  "@import '@neural-ng/icons/icons.css'",
  "@import './styles/generated/starter.css'",
]) {
  assertIncludes(starterSource, expected, 'starter global styles');
}

const themeRecipe = await readJson(
  `${contract.starter.root}/neural.theme.json`,
);
if (themeRecipe.name !== 'starter' || themeRecipe.extends !== 'neutral') {
  throw new Error(
    'Starter theme recipe must compile the starter theme from neutral.',
  );
}
if (
  starterSource.includes('@neural-ng/core/themes/neutral.css') ||
  starterSource.includes('@neural-ng/editor/themes/neutral.css')
) {
  throw new Error(
    'Starter must not import Neutral themes together with generated theme CSS.',
  );
}

const mcp = await readJson(`${contract.starter.root}/mcp.json`);
const neuralServer = mcp.mcpServers?.['neural-ng'];
if (
  neuralServer?.command !== 'npx' ||
  JSON.stringify(neuralServer.args) !==
    JSON.stringify(['--no-install', 'neural-ng-mcp'])
) {
  throw new Error(
    'Starter MCP config must run the installed neural-ng-mcp executable.',
  );
}

for (const pilot of contract.pilots) {
  const controller = await readText(pilot.controller);
  assertIncludes(
    controller,
    pilot.entryPoint,
    `${pilot.id} controller examples`,
  );
  if (
    controller.includes("from '../../../..") ||
    controller.includes('libs/neural-')
  ) {
    throw new Error(`${pilot.id} examples contain a workspace-only import.`);
  }
}

console.log(
  'Neural site examples use installable package entry points and assets.',
);
