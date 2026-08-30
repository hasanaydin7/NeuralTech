import { access, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import process from 'node:process';

const packageRoot = resolve(
  process.cwd(),
  process.argv[2] ?? 'dist/libs/neural-icons',
);
const packageJson = await readJson('package.json');
const metadata = await readJson('metadata.json');

assert(packageJson.name === '@neural-ng/icons', 'Unexpected package name.');
assert(
  !JSON.stringify({
    dependencies: packageJson.dependencies,
    peerDependencies: packageJson.peerDependencies,
    optionalDependencies: packageJson.optionalDependencies,
  }).includes('@tabler/icons'),
  'The published package must not install @tabler/icons for consumers.',
);

const expectedExports = [
  './icons.css',
  './outline.css',
  './filled.css',
  './all.css',
  './brands.css',
  './categories/*.css',
  './categories/filled/*.css',
  './metadata.json',
];
for (const entryPoint of expectedExports) {
  assert(packageJson.exports[entryPoint], `Missing export: ${entryPoint}`);
}

assert(metadata.totals.icons === 6184, 'Expected 6,184 SVG files.');
assert(metadata.totals.outline === 5130, 'Expected 5,130 outline icons.');
assert(metadata.totals.filled === 1054, 'Expected 1,054 filled icons.');
assert(metadata.icons.length === 5130, 'Metadata must list every icon name.');
assert(
  metadata.icons.filter((icon) => icon.styles.includes('filled')).length ===
    1054,
  'Metadata filled style count is incorrect.',
);

const outlineCss = await read('outline.css');
const filledCss = await read('filled.css');
const outlineClasses = [...outlineCss.matchAll(/^\.nt-([a-z0-9-]+) \{/gm)].map(
  (match) => match[1],
);
const filledClasses = [
  ...filledCss.matchAll(/^\.nt-filled-([a-z0-9-]+) \{/gm),
].map((match) => match[1]);

assert(
  outlineClasses.filter(
    (name) => !['spin', 'spin-reverse', 'spin-dual'].includes(name),
  ).length === 5130,
  'outline.css class count is incorrect.',
);
assert(filledClasses.length === 1054, 'filled.css class count is incorrect.');
assert(outlineCss.includes('.nt-user {'), 'Missing nt-user outline class.');
const tabler346Icons = [
  'play-bug',
  'play-bugs',
  'remote-control',
  'rocking-chair',
  'run-sprint',
  'sparkles-2-off',
  'tabs',
  'tags-chevron-down',
  'tags-chevron-left',
  'tags-chevron-right',
  'tags-chevron-up',
  'thinking-high',
  'thinking-low',
  'thinking-medium',
  'treasure-chest',
  'twig',
  'vault',
  'yarn',
];
for (const icon of tabler346Icons) {
  assert(
    outlineCss.includes(`.nt-${icon} {`),
    `Missing Tabler 3.46 icon: nt-${icon}.`,
  );
}
assert(
  filledCss.includes('.nt-filled-user {'),
  'Missing nt-filled-user class.',
);
assert(
  !outlineCss.includes('.nt-filled-user {'),
  'Filled class leaked into the outline entry point.',
);
assert(
  (await read('all.css')).includes("@import './filled.css';"),
  'all.css does not compose the filled set.',
);
assert(
  outlineCss.includes('--nt-icon-outer:') &&
    outlineCss.includes('--nt-icon-inner:') &&
    outlineCss.includes('.nt-loader-3.nt-spin-dual'),
  'Layered loader-3 animation CSS is missing.',
);
assert(
  outlineCss.includes('.nt-spin-reverse') &&
    outlineCss.includes('--nt-spin-inner-duration, 0.75s') &&
    outlineCss.includes('animation: none !important'),
  'Spin direction or duration contracts are missing.',
);
assert(
  metadata.icons
    .filter((icon) => icon.effects?.includes('spin-dual'))
    .map((icon) => icon.name)
    .join(',') === 'loader-3',
  'Layered animation metadata is incorrect.',
);

for (const category of metadata.categories) {
  if (category.outline > 0) {
    await access(join(packageRoot, 'categories', `${category.name}.css`));
  }
  if (category.filled > 0) {
    await access(
      join(packageRoot, 'categories', 'filled', `${category.name}.css`),
    );
  }
}

console.log(
  `Validated @neural-ng/icons: ${metadata.totals.outline} outline, ${metadata.totals.filled} filled, ${metadata.categories.length} categories, zero consumer Tabler dependencies.`,
);

async function read(relativePath) {
  return readFile(join(packageRoot, relativePath), 'utf8');
}

async function readJson(relativePath) {
  return JSON.parse(await read(relativePath));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
