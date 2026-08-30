import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import process from 'node:process';

const workspaceRoot = process.cwd();
const packageRoot = resolve(workspaceRoot, 'libs/neural-theme');
const assetsRoot = join(packageRoot, 'assets');
const checkOnly = process.argv.includes('--check');

const sources = {
  core: resolve(workspaceRoot, 'libs/neural-ng/themes/neutral.css'),
  editor: resolve(workspaceRoot, 'libs/neural-editor/themes/neutral.css'),
  tailwind: resolve(workspaceRoot, 'libs/neural-ng/themes/tailwind.css'),
};

const presetSources = {
  glass: {
    label: 'Glass',
    description:
      'Layered translucent surfaces, soft depth, and indigo emphasis.',
    stability: 'experimental',
    density: 'comfortable',
    radius: 'large',
    elevation: 'strong',
    motion: 'default',
    primary: '#4f46e5',
    surface: 'slate',
    core: resolve(
      workspaceRoot,
      'libs/neural-ng/themes/experimental/glass.css',
    ),
    editor: resolve(
      workspaceRoot,
      'libs/neural-editor/themes/experimental/glass.css',
    ),
  },
  mist: {
    label: 'Mist',
    description:
      'Calm translucent layers, desaturated teal focus, and restrained depth for long sessions.',
    stability: 'experimental',
    density: 'comfortable',
    radius: 'large',
    elevation: 'soft',
    motion: 'default',
    primary: '#4f747b',
    surface: 'slate',
    core: resolve(workspaceRoot, 'libs/neural-ng/themes/experimental/mist.css'),
    editor: resolve(
      workspaceRoot,
      'libs/neural-editor/themes/experimental/mist.css',
    ),
  },
  futuristic: {
    label: 'Futuristic',
    description:
      'High-contrast cyan surfaces, magenta actions, and precise geometry.',
    stability: 'experimental',
    density: 'comfortable',
    radius: 'small',
    elevation: 'strong',
    motion: 'fast',
    primary: '#c026d3',
    surface: '#06b6d4',
    core: resolve(
      workspaceRoot,
      'libs/neural-ng/themes/experimental/futuristic.css',
    ),
    editor: resolve(
      workspaceRoot,
      'libs/neural-editor/themes/experimental/futuristic.css',
    ),
  },
};

const presetQuality = {
  neutral: {
    status: 'release',
    minimumPrimarySurfaceContrast: 3,
    allowedDiagnosticCodes: [],
  },
  glass: {
    status: 'preview',
    minimumPrimarySurfaceContrast: 3,
    allowedDiagnosticCodes: ['contrast.primary.light', 'contrast.primary.dark'],
  },
  mist: {
    status: 'preview',
    minimumPrimarySurfaceContrast: 3,
    allowedDiagnosticCodes: [],
  },
  futuristic: {
    status: 'preview',
    minimumPrimarySurfaceContrast: 3,
    allowedDiagnosticCodes: ['contrast.primary.light', 'contrast.primary.dark'],
  },
};

const componentNames = await discoverComponentNames();
const normalizedSources = {};
for (const [name, path] of Object.entries(sources)) {
  normalizedSources[name] = normalizeText(await readFile(path, 'utf8'));
}

const parsed = [
  ...parseStylesheet(normalizedSources.core, 'core'),
  ...parseStylesheet(normalizedSources.editor, 'editor'),
];
const byName = new Map();
for (const declaration of parsed) {
  const current = byName.get(declaration.name) ?? {
    name: declaration.name,
    component: classifyToken(declaration.name, componentNames),
    source: declaration.source,
    modes: {},
  };
  current.modes[declaration.mode] = declaration.value;
  if (current.source !== declaration.source) current.source = 'shared';
  byName.set(declaration.name, current);
}

const tokens = [...byName.values()].sort((a, b) =>
  a.name.localeCompare(b.name, 'en'),
);
const components = {};
for (const token of tokens) {
  (components[token.component] ??= []).push(token.name);
}
for (const names of Object.values(components))
  names.sort((a, b) => a.localeCompare(b, 'en'));

const sourceHash = createHash('sha256')
  .update(normalizedSources.core)
  .update('\n--EDITOR--\n')
  .update(normalizedSources.editor)
  .update('\n--TAILWIND--\n')
  .update(normalizedSources.tailwind)
  .digest('hex');

const contractDocument = {
  version: 1,
  preset: 'neutral',
  sourceHash,
  generatedFrom: [
    'libs/neural-ng/themes/neutral.css',
    'libs/neural-editor/themes/neutral.css',
    'libs/neural-ng/themes/tailwind.css',
  ],
  stats: {
    tokens: tokens.length,
    coreTokens: tokens.filter((token) => token.source === 'core').length,
    editorTokens: tokens.filter((token) => token.source === 'editor').length,
    sharedTokens: tokens.filter((token) => token.source === 'shared').length,
    components: Object.keys(components).length,
  },
  components,
  tokens,
};
const contract = `${JSON.stringify(contractDocument, null, 2)}\n`;

const neutralModes = new Map(
  contractDocument.tokens.map((token) => [token.name, token.modes]),
);
const presetDefinitions = {
  neutral: {
    id: 'neutral',
    label: 'Neutral',
    description:
      'Balanced product surfaces and accessible defaults for general applications.',
    stability: 'stable',
    primary: '#2563eb',
    surface: 'slate',
    density: 'comfortable',
    radius: 'medium',
    elevation: 'soft',
    motion: 'default',
    sourceHash,
    baseTokens: {},
    darkTokens: {},
  },
};

for (const [id, definition] of Object.entries(presetSources)) {
  const core = normalizeText(await readFile(definition.core, 'utf8'));
  const editor = normalizeText(await readFile(definition.editor, 'utf8'));
  const declarations = [
    ...parseStylesheet(core, 'core'),
    ...parseStylesheet(editor, 'editor'),
  ];
  const baseTokens = {};
  const darkTokens = {};
  for (const declaration of declarations) {
    if (declaration.mode !== 'base' && declaration.mode !== 'dark') continue;
    const neutralValue = neutralModes.get(declaration.name)?.[declaration.mode];
    if (neutralValue === declaration.value) continue;
    const target = declaration.mode === 'dark' ? darkTokens : baseTokens;
    target[declaration.name] = declaration.value;
  }
  const presetSourceHash = createHash('sha256')
    .update(core)
    .update('\n--EDITOR--\n')
    .update(editor)
    .digest('hex');
  presetDefinitions[id] = {
    id,
    label: definition.label,
    description: definition.description,
    stability: definition.stability,
    primary: definition.primary,
    surface: definition.surface,
    density: definition.density,
    radius: definition.radius,
    elevation: definition.elevation,
    motion: definition.motion,
    sourceHash: presetSourceHash,
    baseTokens: sortRecord(baseTokens),
    darkTokens: sortRecord(darkTokens),
  };
}

const presetCatalog = Object.values(presetDefinitions).map((preset) => ({
  id: preset.id,
  label: preset.label,
  description: preset.description,
  stability: preset.stability,
  quality: presetQuality[preset.id],
  primary: preset.primary,
  surface: preset.surface,
  density: preset.density,
  radius: preset.radius,
  elevation: preset.elevation,
  motion: preset.motion,
}));
const builtInPresets = `${JSON.stringify(presetDefinitions, null, 2)}\n`;
const presetCatalogJson = `${JSON.stringify({ version: 1, presets: presetCatalog }, null, 2)}\n`;
const presetQualitySource = [
  `import type { NeuralThemePresetName, NeuralThemePresetQuality } from './types.js';`,
  '',
  `export const BUILT_IN_THEME_PRESET_QUALITY = ${JSON.stringify(presetQuality, null, 2)} as const satisfies Readonly<Record<NeuralThemePresetName, NeuralThemePresetQuality>>;`,
  '',
  'export function getThemePresetQuality(',
  '  preset: NeuralThemePresetName,',
  '): NeuralThemePresetQuality {',
  '  return BUILT_IN_THEME_PRESET_QUALITY[preset];',
  '}',
  '',
].join('\n');
const browserAssets = [
  `import type { NeuralThemeContract, NeuralThemePresetDefinition, NeuralThemePresetName } from './types.js';`,
  '',
  `export const NEUTRAL_THEME_CONTRACT = ${JSON.stringify(contractDocument)} as unknown as NeuralThemeContract;`,
  '',
  `export const BUILT_IN_THEME_PRESETS = ${JSON.stringify(presetDefinitions)} as unknown as Readonly<Record<NeuralThemePresetName, NeuralThemePresetDefinition>>;`,
  '',
  `export const CORE_NEUTRAL_TEMPLATE = ${JSON.stringify(normalizedSources.core)};`,
  '',
  `export const EDITOR_NEUTRAL_TEMPLATE = ${JSON.stringify(normalizedSources.editor)};`,
  '',
  `export const TAILWIND_TEMPLATE = ${JSON.stringify(normalizedSources.tailwind)};`,
  '',
].join('\n');

const outputs = new Map([
  [join(assetsRoot, 'contracts/neutral.tokens.json'), contract],
  [join(assetsRoot, 'templates/core-neutral.css'), normalizedSources.core],
  [join(assetsRoot, 'templates/editor-neutral.css'), normalizedSources.editor],
  [join(assetsRoot, 'templates/tailwind.css'), normalizedSources.tailwind],
  [join(assetsRoot, 'presets/built-ins.json'), builtInPresets],
  [join(assetsRoot, 'presets/catalog.json'), presetCatalogJson],
  [
    join(assetsRoot, 'presets/glass.recipe.json'),
    `${JSON.stringify(createPublicPresetRecipe('glass'), null, 2)}\n`,
  ],
  [
    join(assetsRoot, 'presets/mist.recipe.json'),
    `${JSON.stringify(createPublicPresetRecipe('mist'), null, 2)}\n`,
  ],
  [
    join(assetsRoot, 'presets/futuristic.recipe.json'),
    `${JSON.stringify(createPublicPresetRecipe('futuristic'), null, 2)}\n`,
  ],
  [join(packageRoot, 'src/browser-assets.ts'), browserAssets],
  [join(packageRoot, 'src/preset-quality.ts'), presetQualitySource],
]);

if (checkOnly) {
  const stale = [];
  for (const [path, expected] of outputs) {
    let actual = '';
    try {
      actual = normalizeText(await readFile(path, 'utf8'));
    } catch {
      stale.push(relativePath(path));
      continue;
    }
    if (actual !== expected) stale.push(relativePath(path));
  }
  if (stale.length > 0) {
    throw new Error(
      `Neural theme contract is stale: ${stale.join(', ')}. Run \`node libs/neural-theme/scripts/generate-contract.mjs\`.`,
    );
  }
  console.log(
    `Neural theme contract is current: ${tokens.length} tokens across ${Object.keys(components).length} groups.`,
  );
} else {
  for (const [path, contents] of outputs) {
    await mkdir(resolve(path, '..'), { recursive: true });
    await writeFile(path, contents, 'utf8');
  }
  console.log(
    `Generated Neural theme contract: ${tokens.length} tokens across ${Object.keys(components).length} groups.`,
  );
}

async function discoverComponentNames() {
  const roots = [
    resolve(workspaceRoot, 'libs/neural-ng'),
    resolve(workspaceRoot, 'libs/neural-editor'),
  ];
  const names = new Set(['editor']);
  for (const root of roots) {
    for (const entry of await readdir(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (
        ['src', 'themes', 'scripts', 'testing', 'locales'].includes(entry.name)
      )
        continue;
      names.add(entry.name);
    }
  }
  return [...names].sort(
    (a, b) => b.length - a.length || a.localeCompare(b, 'en'),
  );
}

function parseStylesheet(css, source) {
  const declarations = [];
  for (const block of topLevelBlocks(css)) {
    const mode = classifyMode(block.selector);
    const expression = /(--neural-[a-z0-9-]+)\s*:\s*([\s\S]*?);/gi;
    for (const match of block.body.matchAll(expression)) {
      declarations.push({
        name: match[1],
        value: normalizeValue(match[2]),
        source,
        mode,
      });
    }
  }
  return declarations;
}

function topLevelBlocks(css) {
  const blocks = [];
  let cursor = 0;
  while (cursor < css.length) {
    const open = css.indexOf('{', cursor);
    if (open < 0) break;
    const selectorStart = Math.max(css.lastIndexOf('}', open - 1) + 1, cursor);
    const selector = css
      .slice(selectorStart, open)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim();
    let depth = 1;
    let index = open + 1;
    while (index < css.length && depth > 0) {
      if (css[index] === '{') depth += 1;
      if (css[index] === '}') depth -= 1;
      index += 1;
    }
    if (selector.startsWith('@')) {
      cursor = index;
      continue;
    }
    blocks.push({ selector, body: css.slice(open + 1, index - 1) });
    cursor = index;
  }
  return blocks;
}

function classifyMode(selector) {
  if (selector.includes("data-neural-mode='dark'")) return 'dark';
  if (selector.includes("data-neural-density='compact'")) return 'compact';
  if (selector.includes("data-neural-density='spacious'")) return 'spacious';
  return 'base';
}

function classifyToken(token, names) {
  const tail = token.slice('--neural-'.length);
  if (
    tail.startsWith('color-') ||
    tail.startsWith('font-') ||
    tail.startsWith('line-height-') ||
    tail.startsWith('density-') ||
    tail.startsWith('control-')
  ) {
    return 'foundation';
  }
  return (
    names.find((name) => tail === name || tail.startsWith(`${name}-`)) ??
    'foundation'
  );
}

function normalizeValue(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeText(value) {
  return (
    value
      .replace(/^\uFEFF/, '')
      .replace(/\r\n?/g, '\n')
      .replace(/\s+$/u, '') + '\n'
  );
}

function sortRecord(input) {
  return Object.fromEntries(
    Object.entries(input).sort(([left], [right]) =>
      left.localeCompare(right, 'en'),
    ),
  );
}

function createPublicPresetRecipe(id) {
  return {
    $schema: '../../schema.json',
    schemaVersion: 1,
    name: id,
    extends: id,
    modes: { dark: 'auto' },
    output: { tailwind: true, tokens: true, report: true, types: true },
    generator: { colorAlgorithm: 'neural-oklch-v1' },
  };
}

function relativePath(path) {
  return path.slice(workspaceRoot.length + 1).replaceAll('\\', '/');
}
