import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import process from 'node:process';

const workspaceRoot = process.cwd();
const packageRoot = resolve(workspaceRoot, 'libs/neural-icons');
const manifest = JSON.parse(
  await readFile(join(packageRoot, 'manifest.json'), 'utf8'),
);
const upstreamRoot = resolve(
  workspaceRoot,
  'node_modules',
  ...manifest.upstream.package.split('/'),
);
const upstreamPackage = JSON.parse(
  await readFile(join(upstreamRoot, 'package.json'), 'utf8'),
);
const upstreamMetadata = JSON.parse(
  await readFile(join(upstreamRoot, 'icons.json'), 'utf8'),
);

const layeredIcons = new Map([
  ['loader-3', { outer: [0], inner: [1] }],
]);

assertManifest(upstreamPackage);
const coreCss = await generateCoreCss();
const outlineIcons = await readIconInventory('outline');
const filledIcons = await readIconInventory('filled');
await assertUpstreamInventory(outlineIcons, filledIcons);
const metadataJson = generateMetadata(outlineIcons, filledIcons);
const argument = process.argv[2] ?? '--write-source';

if (argument === '--write-source') {
  await write(join(packageRoot, 'icons.css'), coreCss);
  await write(join(packageRoot, 'metadata.json'), metadataJson);
} else if (argument.startsWith('--check=')) {
  const target = resolve(workspaceRoot, argument.slice('--check='.length));
  const current = await readFile(target, 'utf8');
  if (normalizeNewlines(current) !== normalizeNewlines(coreCss)) {
    throw new Error(
      `Generated icon CSS is stale: ${target}. Run "nx generate neural-icons".`,
    );
  }
  const metadataPath = join(packageRoot, 'metadata.json');
  const currentMetadata = await readFile(metadataPath, 'utf8');
  if (normalizeNewlines(currentMetadata) !== normalizeNewlines(metadataJson)) {
    throw new Error(
      `Generated icon metadata is stale: ${metadataPath}. Run "nx generate neural-icons".`,
    );
  }
} else if (argument.startsWith('--out-dir=')) {
  const outputDirectory = resolve(
    workspaceRoot,
    argument.slice('--out-dir='.length),
  );
  await buildPackage(outputDirectory);
} else {
  throw new Error(`Unknown generator argument: ${argument}`);
}

async function buildPackage(outputDirectory) {
  await mkdir(outputDirectory, { recursive: true });
  await write(join(outputDirectory, 'icons.css'), coreCss);

  await write(
    join(outputDirectory, 'outline.css'),
    await generateSetCss('outline', outlineIcons),
  );
  await write(
    join(outputDirectory, 'filled.css'),
    await generateSetCss('filled', filledIcons, 'filled-'),
  );
  await write(
    join(outputDirectory, 'all.css'),
    `${licenseHeader('all outline and filled')}@import './outline.css';\n@import './filled.css';\n`,
  );

  const outlineCategories = groupByCategory(outlineIcons);
  for (const [category, icons] of outlineCategories) {
    await write(
      join(outputDirectory, 'categories', `${category}.css`),
      await generateSetCss(`outline category: ${category}`, icons),
    );
  }
  const filledCategories = groupByCategory(filledIcons);
  for (const [category, icons] of filledCategories) {
    await write(
      join(outputDirectory, 'categories', 'filled', `${category}.css`),
      await generateSetCss(`filled category: ${category}`, icons, 'filled-'),
    );
  }
  await write(
    join(outputDirectory, 'brands.css'),
    await generateSetCss(
      'outline category: brands',
      outlineCategories.get('brand'),
    ),
  );
  await write(join(outputDirectory, 'metadata.json'), metadataJson);

  for (const file of [
    'package.json',
    'README.md',
    'llms.txt',
    'LICENSE',
    'THIRD_PARTY_NOTICES.md',
    'manifest.json',
  ]) {
    await write(
      join(outputDirectory, file),
      await readFile(join(packageRoot, file), 'utf8'),
    );
  }
}

async function generateCoreCss() {
  const icons = manifest.icons.map((icon) => ({
    name: icon.name,
    source: icon.source,
  }));
  return generateSetCss('curated core', icons);
}

async function generateSetCss(label, icons, classPrefix = '') {
  const iconRules = [];

  for (const icon of icons) {
    const sourcePath = join(
      upstreamRoot,
      'icons',
      classPrefix ? 'filled' : 'outline',
      `${icon.source}.svg`,
    );
    const svg = optimizeSvg(await readFile(sourcePath, 'utf8'));
    const encoded = encodeURIComponent(svg).replaceAll('%20', ' ');
    const layerConfig = classPrefix ? undefined : layeredIcons.get(icon.name);
    const layerProperties = layerConfig
      ? `\n  --nt-icon-outer: url("data:image/svg+xml,${encodeSvg(createLayerSvg(svg, layerConfig.outer))}");\n  --nt-icon-inner: url("data:image/svg+xml,${encodeSvg(createLayerSvg(svg, layerConfig.inner))}");`
      : '';
    iconRules.push(
      `.nt-${classPrefix}${icon.name} {\n  --nt-icon: url("data:image/svg+xml,${encoded}");${layerProperties}\n}`,
    );
  }

  return `${licenseHeader(label)}${getBaseCss()}\n${iconRules.join('\n\n')}\n`;
}

async function readIconInventory(style) {
  const directory = join(upstreamRoot, 'icons', style);
  return (await readdir(directory))
    .filter((file) => file.endsWith('.svg'))
    .map((file) => {
      const source = basename(file, '.svg');
      return {
        name: source,
        source,
        category: slugify(
          upstreamMetadata[source]?.category ?? 'uncategorized',
        ),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function groupByCategory(icons) {
  const categories = new Map();
  for (const icon of icons) {
    const list = categories.get(icon.category) ?? [];
    list.push(icon);
    categories.set(icon.category, list);
  }
  return new Map([...categories].sort(([a], [b]) => a.localeCompare(b)));
}

function generateMetadata(outline, filled) {
  const filledNames = new Set(filled.map((icon) => icon.name));
  const outlineCategories = groupByCategory(outline);
  const filledCategories = groupByCategory(filled);
  const categoryNames = new Set([
    ...outlineCategories.keys(),
    ...filledCategories.keys(),
  ]);

  return `${JSON.stringify({
    package: '@neural-ng/icons',
    version: '0.1.0-beta.0',
    upstream: {
      package: manifest.upstream.package,
      version: manifest.upstream.version,
      license: 'MIT',
    },
    totals: {
      icons: outline.length + filled.length,
      outline: outline.length,
      filled: filled.length,
    },
    categories: [...categoryNames]
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({
        name,
        outline: outlineCategories.get(name)?.length ?? 0,
        filled: filledCategories.get(name)?.length ?? 0,
      })),
    icons: outline.map((icon) => ({
      name: icon.name,
      category: icon.category,
      styles: filledNames.has(icon.name) ? ['outline', 'filled'] : ['outline'],
      ...(layeredIcons.has(icon.name) ? { effects: ['spin-dual'] } : {}),
    })),
  })}\n`;
}

async function assertUpstreamInventory(outlineIcons, filledIcons) {
  const outline = outlineIcons ?? (await readIconInventory('outline'));
  const filled = filledIcons ?? (await readIconInventory('filled'));
  if (outline.length !== 5130 || filled.length !== 1054) {
    throw new Error(
      `Unexpected Tabler inventory: ${outline.length} outline and ${filled.length} filled icons.`,
    );
  }
}

function licenseHeader(label) {
  return `/*\n * Neural Icons v0.1.0-beta.0 — ${label}\n * Generated from Tabler Icons ${manifest.upstream.version} SVG sources (MIT).\n * https://tabler.io/icons — see THIRD_PARTY_NOTICES.md\n * Do not edit generated CSS directly.\n */\n\n`;
}

function getBaseCss() {
  return `.nt {
  display: inline-block;
  flex: 0 0 auto;
  width: 1em;
  height: 1em;
  vertical-align: -0.125em;
  background-color: currentColor;
  -webkit-mask: var(--nt-icon) center / contain no-repeat;
  mask: var(--nt-icon) center / contain no-repeat;
}

.nt-spin,
.nt-spin-reverse,
.nt-spin-dual {
  animation: nt-spin var(--nt-spin-duration, 1s) linear infinite;
}

.nt-spin-reverse {
  animation-direction: reverse;
}

.nt-loader-3.nt-spin-dual {
  position: relative;
  background-color: transparent;
  -webkit-mask: none;
  mask: none;
  animation: none;
}

.nt-loader-3.nt-spin-dual::before,
.nt-loader-3.nt-spin-dual::after {
  content: '';
  position: absolute;
  inset: 0;
  background-color: currentColor;
  transform-origin: center;
}

.nt-loader-3.nt-spin-dual::before {
  -webkit-mask: var(--nt-icon-outer) center / contain no-repeat;
  mask: var(--nt-icon-outer) center / contain no-repeat;
  animation: nt-spin var(--nt-spin-duration, 1s) linear infinite;
}

.nt-loader-3.nt-spin-dual::after {
  -webkit-mask: var(--nt-icon-inner) center / contain no-repeat;
  mask: var(--nt-icon-inner) center / contain no-repeat;
  animation: nt-spin var(--nt-spin-inner-duration, 0.75s) linear infinite reverse;
}

@keyframes nt-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .nt-spin,
  .nt-spin-reverse,
  .nt-spin-dual,
  .nt-spin-dual::before,
  .nt-spin-dual::after {
    animation: none !important;
  }
}`;
}

function createLayerSvg(svg, elementIndexes) {
  const openingTag = svg.match(/^<svg\b[^>]*>/)?.[0];
  const elements = [
    ...svg.matchAll(
      /<(?:path|circle|ellipse|line|polyline|polygon|rect)\b[^>]*\/>/g,
    ),
  ].map((match) => match[0]);

  if (!openingTag || elementIndexes.some((index) => !elements[index])) {
    throw new Error('Unable to extract a configured icon layer.');
  }

  return `${openingTag}${elementIndexes.map((index) => elements[index]).join('')}</svg>`;
}

function encodeSvg(svg) {
  return encodeURIComponent(svg).replaceAll('%20', ' ');
}

function optimizeSvg(svg) {
  return svg
    .replace(/<path stroke="none"[^>]*\/>/g, '')
    .replace(/\s(?:width|height|class)="[^"]*"/g, '')
    .replace('stroke="currentColor"', 'stroke="black"')
    .replaceAll('fill="currentColor"', 'fill="black"')
    .replace(/\r?\n/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function assertManifest(upstreamPackage) {
  if (upstreamPackage.version !== manifest.upstream.version) {
    throw new Error(
      `Expected ${manifest.upstream.package}@${manifest.upstream.version}, found ${upstreamPackage.version}.`,
    );
  }

  const names = new Set();
  for (const icon of manifest.icons) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(icon.name)) {
      throw new Error(`Invalid Neural icon name: ${icon.name}`);
    }
    if (names.has(icon.name)) {
      throw new Error(`Duplicate Neural icon name: ${icon.name}`);
    }
    names.add(icon.name);
  }
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function write(path, contents) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, contents, 'utf8');
}

function normalizeNewlines(value) {
  return value.replaceAll('\r\n', '\n');
}
