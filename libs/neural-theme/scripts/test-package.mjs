import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import process from 'node:process';

const outputRoot = resolve(process.cwd(), 'dist/libs/neural-theme');
const manifest = JSON.parse(
  await readFile(join(outputRoot, 'package.json'), 'utf8'),
);
if (manifest.name !== '@neural-ng/theme')
  throw new Error('Unexpected package name.');
if (manifest.bin?.['neural-theme'] !== 'src/cli.js')
  throw new Error('Missing neural-theme executable.');
for (const path of [
  'src/index.js',
  'src/index.d.ts',
  'src/cli.js',
  'src/browser.js',
  'src/browser.d.ts',
  'schema.json',
  'presets/neutral.json',
  'presets/glass.json',
  'presets/mist.json',
  'presets/futuristic.json',
  'presets/catalog.json',
  'presets/quality-baseline.json',
  'contracts/neutral.tokens.json',
  'assets/templates/core-neutral.css',
  'assets/templates/editor-neutral.css',
]) {
  await readFile(join(outputRoot, path));
}

if (manifest.exports?.['./browser']?.import !== './src/browser.js') {
  throw new Error('Missing browser compiler export.');
}
if (
  manifest.exports?.['./presets/quality-baseline.json'] !==
  './presets/quality-baseline.json'
) {
  throw new Error('Missing preset quality baseline export.');
}

const api = await import(pathToFileURL(join(outputRoot, 'src/index.js')).href);
const recipe = {
  schemaVersion: 1,
  name: 'package-smoke',
  extends: 'neutral',
  color: { primary: '#7c3aed', surface: 'slate' },
  shape: { radius: 'large', border: 'subtle' },
  density: 'compact',
  components: { button: { radius: '1rem' } },
};
const validation = await api.validateThemeRecipe(recipe);
if (!validation.valid) throw new Error(JSON.stringify(validation.diagnostics));
const unsafeOverride = await api.validateThemeRecipe({
  schemaVersion: 1,
  name: 'unsafe-override',
  components: { button: { radius: '1rem; color: red' } },
});
if (
  unsafeOverride.valid ||
  !unsafeOverride.diagnostics.some(
    (entry) => entry.code === 'recipe.token.css.unsafe',
  )
) {
  throw new Error('Unsafe CSS override diagnostics are not enforced.');
}
const unknownAlias = await api.validateThemeRecipe({
  schemaVersion: 1,
  name: 'unknown-alias',
  components: { button: { radius: '{components.missing.radius}' } },
});
if (
  unknownAlias.valid ||
  !unknownAlias.diagnostics.some(
    (entry) => entry.code === 'recipe.token.alias.unknown',
  )
) {
  throw new Error('Unknown token alias diagnostics are not enforced.');
}
const migration = api.migrateThemeRecipe({
  version: 0,
  name: 'legacy-theme',
  preset: 'glass',
  colors: { primary: '#7c3aed' },
  radius: 'large',
  componentOverrides: { button: { radius: '1rem' } },
});
if (
  !migration.changed ||
  migration.recipe.schemaVersion !== 1 ||
  migration.recipe.extends !== 'glass'
) {
  throw new Error('Legacy recipe migration failed.');
}
const versionlessMigration = api.migrateThemeRecipe({
  name: 'versionless-legacy-theme',
  preset: 'neutral',
});
if (
  versionlessMigration.fromVersion !== 0 ||
  versionlessMigration.recipe.extends !== 'neutral'
) {
  throw new Error('Versionless legacy recipe migration failed.');
}
const conflictingMigration = api.migrateThemeRecipe({
  schemaVersion: 1,
  name: 'conflicting-theme',
  extends: 'neutral',
  preset: 'glass',
});
if (
  conflictingMigration.recipe.extends !== 'neutral' ||
  'preset' in conflictingMigration.recipe
) {
  throw new Error(
    'Migration did not preserve the current field during a legacy conflict.',
  );
}
let futureVersionRejected = false;
try {
  api.migrateThemeRecipe({ schemaVersion: 2, name: 'future-theme' });
} catch {
  futureVersionRejected = true;
}
if (!futureVersionRejected)
  throw new Error('Future recipe versions must be rejected.');
const artifacts = await api.compileTheme(recipe);
const glassArtifacts = await api.compileTheme({
  schemaVersion: 1,
  name: 'glass-smoke',
  extends: 'glass',
});
if (
  !glassArtifacts.css.includes(
    '--neural-button-backdrop-filter: blur(16px) saturate(140%);',
  )
) {
  throw new Error('Glass preset tokens were not emitted.');
}
const mistArtifacts = await api.compileTheme({
  schemaVersion: 1,
  name: 'mist-smoke',
  extends: 'mist',
});
if (
  !mistArtifacts.css.includes(
    '--neural-card-backdrop-filter: blur(24px) saturate(110%);',
  )
) {
  throw new Error('Mist preset tokens were not emitted.');
}
const presets = await api.listThemePresets();
if (
  presets.map((preset) => preset.id).join(',') !==
  'futuristic,glass,mist,neutral'
) {
  throw new Error('Built-in preset catalog is incomplete.');
}
if (
  presets.find((preset) => preset.id === 'neutral')?.quality.status !==
  'release'
) {
  throw new Error('Preset quality governance metadata is missing.');
}
if (!artifacts.css.includes("data-neural-theme='package-smoke'"))
  throw new Error('Generated CSS is not scoped.');
if (!artifacts.css.includes('--neural-button-radius: 1rem;'))
  throw new Error('Component override was not emitted.');
if (!artifacts.css.includes('@theme inline'))
  throw new Error('Tailwind bridge was not emitted.');

const temporary = await mkdtemp(join(tmpdir(), 'neural-theme-'));
try {
  const config = join(temporary, 'neural.theme.json');
  await writeFile(config, `${JSON.stringify(recipe)}\n`, 'utf8');
  const result = await api.buildThemeFromFile({
    config,
    outputDirectory: join(temporary, 'generated'),
  });
  if (result.files.length !== 4)
    throw new Error('Expected four generated artifacts.');
} finally {
  await rm(temporary, { recursive: true, force: true });
}

const browserSource = await readFile(
  join(outputRoot, 'src/browser.js'),
  'utf8',
);
if (/node:(?:fs|path|process)/.test(browserSource)) {
  throw new Error('Browser compiler must not import Node built-ins.');
}
const browserApi = await import(
  pathToFileURL(join(outputRoot, 'src/browser.js')).href
);
const browserArtifacts = browserApi.compileTheme(recipe, {
  includeTailwind: false,
  scope: 'theme',
});
if (browserArtifacts.css.includes(':root')) {
  throw new Error('Theme-only browser output leaked a :root selector.');
}
if (!browserArtifacts.css.includes("data-neural-theme='package-smoke'")) {
  throw new Error('Browser compiler did not emit the requested theme scope.');
}

console.log('Neural theme package contract passed.');
