import { GENERATED_ICON_CATALOG } from './generated/icons.js';
import type {
  NeuralIconCatalog,
  NeuralIconCatalogEntry,
  NeuralIconContract,
  NeuralIconSearchResult,
  NeuralIconStyle,
} from './types.js';

const MAX_RESULTS = 50;
const INTENTS: Readonly<Record<string, readonly string[]>> = {
  add: ['plus', 'circle-plus', 'square-plus'],
  back: ['arrow-left', 'chevron-left'],
  calendar: ['calendar', 'calendar-event', 'calendar-time'],
  cancel: ['x', 'circle-x'],
  close: ['x', 'circle-x'],
  confirm: ['check', 'circle-check'],
  copy: ['copy', 'clipboard'],
  dashboard: ['layout-dashboard', 'dashboard'],
  delete: ['trash', 'trash-x'],
  download: ['download', 'file-download'],
  edit: ['edit', 'pencil'],
  error: ['alert-circle', 'alert-triangle', 'exclamation-circle'],
  filter: ['filter', 'filter-search'],
  forward: ['arrow-right', 'chevron-right'],
  info: ['info-circle', 'info-hexagon'],
  loading: ['loader', 'loader-2', 'loader-3'],
  menu: ['menu-2', 'menu-deep'],
  more: ['dots', 'dots-vertical'],
  notification: ['bell', 'bell-ringing'],
  remove: ['minus', 'trash'],
  save: ['device-floppy', 'check'],
  search: ['search', 'zoom'],
  settings: ['settings', 'adjustments', 'tool'],
  upload: ['upload', 'file-upload'],
  user: ['user', 'users', 'user-circle'],
  warning: ['alert-triangle', 'alert-circle'],
};

export function getIconCatalog(): NeuralIconCatalog {
  return GENERATED_ICON_CATALOG;
}

export function getIconCatalogSummary(): Omit<NeuralIconCatalog, 'icons'> & {
  readonly searchTool: 'search_icons';
  readonly defaultBrandPolicy: 'excluded';
} {
  return {
    schemaVersion: GENERATED_ICON_CATALOG.schemaVersion,
    packageName: GENERATED_ICON_CATALOG.packageName,
    packageVersion: GENERATED_ICON_CATALOG.packageVersion,
    upstream: GENERATED_ICON_CATALOG.upstream,
    totals: GENERATED_ICON_CATALOG.totals,
    categories: GENERATED_ICON_CATALOG.categories,
    searchTool: 'search_icons',
    defaultBrandPolicy: 'excluded',
  };
}

export function searchIcons(
  query: string,
  options: {
    readonly limit?: number;
    readonly style?: NeuralIconStyle | 'any';
    readonly category?: string;
    readonly includeBrands?: boolean;
  } = {},
): NeuralIconSearchResult {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery)
    throw new TypeError('query must be a non-empty string.');
  const limit = Math.max(1, Math.min(MAX_RESULTS, options.limit ?? 10));
  const style = options.style ?? 'any';
  if (style !== 'any' && style !== 'outline' && style !== 'filled') {
    throw new TypeError('style must be "any", "outline", or "filled".');
  }
  const category = options.category ? normalize(options.category) : undefined;
  if (
    category &&
    !GENERATED_ICON_CATALOG.categories.some((item) => item.name === category)
  ) {
    throw new TypeError(`Unknown icon category: ${options.category}.`);
  }
  const includeBrands = options.includeBrands ?? false;
  const originalTokens = tokenize(normalizedQuery);
  const semanticTerms = new Set(
    originalTokens.flatMap((token) => INTENTS[token] ?? []),
  );

  const candidates = GENERATED_ICON_CATALOG.icons
    .filter((icon) => includeBrands || icon.category !== 'brand')
    .filter((icon) => !category || icon.category === category)
    .filter(
      (icon) =>
        style === 'any' ||
        (icon.styles as readonly NeuralIconStyle[]).includes(style),
    )
    .map((icon) => ({
      icon,
      score: scoreIcon(icon, normalizedQuery, originalTokens, semanticTerms),
    }))
    .filter((candidate) => candidate.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.icon.name.localeCompare(right.icon.name, 'en'),
    );

  return {
    schemaVersion: 1,
    query,
    filters: {
      style,
      ...(category ? { category } : {}),
      includeBrands,
    },
    totalMatches: candidates.length,
    truncated: candidates.length > limit,
    matches: candidates.slice(0, limit).map(({ icon, score }) => ({
      icon: toIconContract(icon, style),
      score,
      reason: explainMatch(icon, normalizedQuery, semanticTerms),
    })),
  };
}

function scoreIcon(
  icon: NeuralIconCatalogEntry,
  query: string,
  tokens: readonly string[],
  semanticTerms: ReadonlySet<string>,
): number {
  const name = normalize(icon.name);
  const parts = new Set(name.split('-'));
  let score = 0;
  if (name === query) score += 400;
  else if (name.startsWith(query)) score += 180;
  else if (name.includes(query)) score += 100;
  for (const token of tokens) {
    if (parts.has(token)) score += 70;
    else if (name.includes(token)) score += 25;
    if (icon.category === token) score += 35;
  }
  for (const term of semanticTerms) {
    if (name === term) score += 240;
    else if (name.startsWith(`${term}-`)) score += 130;
    else if (name.includes(term)) score += 55;
  }
  if (score > 0 && icon.core) score += 8;
  return score;
}

function toIconContract(
  icon: NeuralIconCatalogEntry,
  requestedStyle: NeuralIconStyle | 'any',
): NeuralIconContract {
  const useFilled =
    requestedStyle === 'filled' && icon.styles.includes('filled');
  const className = useFilled
    ? `nt nt-filled-${icon.name}`
    : `nt nt-${icon.name}`;
  const outlineImport = icon.core
    ? "@import '@neural-ng/icons/icons.css';"
    : `@import '@neural-ng/icons/categories/${icon.category}.css';`;
  const filledImport = icon.styles.includes('filled')
    ? `@import '@neural-ng/icons/categories/filled/${icon.category}.css';`
    : undefined;
  return {
    ...icon,
    className: `nt nt-${icon.name}`,
    ...(icon.styles.includes('filled')
      ? { filledClassName: `nt nt-filled-${icon.name}` }
      : {}),
    cssImports: {
      outline: outlineImport,
      ...(filledImport ? { filled: filledImport } : {}),
    },
    example: `<i class="${className}" aria-hidden="true"></i>`,
    accessibility:
      'Decorative icons use aria-hidden="true". Icon-only controls still require an accessible label on the control.',
  };
}

function explainMatch(
  icon: NeuralIconCatalogEntry,
  query: string,
  semanticTerms: ReadonlySet<string>,
): string {
  if (icon.name === query) return 'Exact icon name match.';
  if (
    [...semanticTerms].some(
      (term) => icon.name === term || icon.name.startsWith(`${term}-`),
    )
  ) {
    return `Semantic UI intent match in the ${icon.category} category.`;
  }
  if (icon.category === query) return `Exact ${icon.category} category match.`;
  return `Name match in the ${icon.category} category.`;
}

function tokenize(value: string): string[] {
  return [...new Set(value.split(/[^a-z0-9]+/).filter(Boolean))];
}

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^nt(?:-filled)?-/, '');
}
