import {
  GENERATED_COMPONENTS,
  GENERATED_PACKAGE_CATALOG,
  GENERATED_SOURCE_HASH,
  GENERATED_THEMES,
} from './generated/catalog.js';
import type {
  NeuralComponentContract,
  NeuralComponentDocument,
  NeuralPackageCatalog,
  NeuralSearchMatch,
  NeuralThemeCatalogEntry,
} from './types.js';

const MAX_RESULTS = 20;
const componentLookup = buildComponentLookup(GENERATED_COMPONENTS);

export function getCatalogSourceHash(): string {
  return GENERATED_SOURCE_HASH;
}

export function listComponents(): readonly NeuralComponentContract[] {
  return GENERATED_COMPONENTS.map(toContract);
}

export function getComponentContract(
  reference: string,
): NeuralComponentContract | undefined {
  const document = getComponentDocument(reference);
  return document ? toContract(document) : undefined;
}

export function getPackageCatalog(): NeuralPackageCatalog {
  return GENERATED_PACKAGE_CATALOG;
}

export function listThemes(): readonly NeuralThemeCatalogEntry[] {
  const themes: NeuralThemeCatalogEntry[] = [
    ...GENERATED_THEMES,
    {
      id: 'compiler',
      exportPath: '@neural-ng/theme',
      stability: 'tooling',
    },
  ];
  return themes.sort((left, right) => left.id.localeCompare(right.id, 'en'));
}

export function searchComponents(
  query: string,
  limit = 10,
): readonly NeuralSearchMatch[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];

  const boundedLimit = clampLimit(limit);
  const tokens = uniqueTokens(normalizedQuery);
  const matches = GENERATED_COMPONENTS.map((document) => ({
    document,
    score: scoreDocument(document, normalizedQuery, tokens),
  }))
    .filter((match) => match.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        compareText(left.document.id, right.document.id),
    )
    .slice(0, boundedLimit);

  return matches.map(({ document, score }) => ({
    component: toContract(document),
    score,
    reason: buildSearchReason(document, normalizedQuery, tokens),
  }));
}

export function recommendComponents(
  goal: string,
  limit = 5,
): readonly NeuralSearchMatch[] {
  const normalizedGoal = normalize(goal);
  if (!normalizedGoal) return [];

  const tokens = uniqueTokens(normalizedGoal);
  const intentBoosts = buildIntentBoosts(normalizedGoal);
  const boundedLimit = clampLimit(limit);

  return GENERATED_COMPONENTS.map((document) => {
    const baseScore = scoreDocument(document, normalizedGoal, tokens);
    const boost = intentBoosts.get(document.id) ?? 0;
    return { document, score: baseScore + boost, boost };
  })
    .filter((match) => match.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        compareText(left.document.id, right.document.id),
    )
    .slice(0, boundedLimit)
    .map(({ document, score, boost }) => ({
      component: toContract(document),
      score,
      reason:
        boost > 0
          ? buildIntentReason(document, normalizedGoal)
          : buildSearchReason(document, normalizedGoal, tokens),
    }));
}

export function getComponentDocument(
  reference: string,
): NeuralComponentDocument | undefined {
  const normalizedReference = normalizeReference(reference);
  if (!normalizedReference) return undefined;
  return componentLookup.get(normalizedReference);
}

function buildComponentLookup(
  documents: readonly NeuralComponentDocument[],
): ReadonlyMap<string, NeuralComponentDocument> {
  const lookup = new Map<string, NeuralComponentDocument>();
  for (const document of documents) {
    const aliases = [
      document.id,
      document.name,
      document.className,
      document.selector,
      document.entryPoint,
      document.entryPoint.slice('@neural-ng/core/'.length),
    ];
    for (const alias of aliases) {
      const normalizedAlias = normalizeReference(alias);
      if (normalizedAlias && !lookup.has(normalizedAlias)) {
        lookup.set(normalizedAlias, document);
      }
    }
  }
  return lookup;
}

function toContract(
  document: NeuralComponentDocument,
): NeuralComponentContract {
  return {
    schemaVersion: document.schemaVersion,
    id: document.id,
    name: document.name,
    className: document.className,
    kind: document.kind,
    selector: document.selector,
    entryPoint: document.entryPoint,
    status: document.status,
    summary: document.summary,
    formContract: document.formContract,
    inputs: document.inputs,
    models: document.models,
    outputs: document.outputs,
    classes: document.classes,
    relatedComponents: document.relatedComponents,
    resources: document.resources,
  };
}

function scoreDocument(
  document: NeuralComponentDocument,
  normalizedQuery: string,
  tokens: readonly string[],
): number {
  const id = normalize(document.id);
  const name = normalize(document.name);
  const className = normalize(document.className);
  const selector = normalize(document.selector);
  const entryPoint = normalize(document.entryPoint);
  const summary = normalize(document.summary);
  const docs = normalize(`${document.readme}\n${document.llms}`);
  let score = 0;

  if (
    id === normalizedQuery ||
    name === normalizedQuery ||
    selector === normalizedQuery
  ) {
    score += 200;
  }
  if (id.startsWith(normalizedQuery) || name.startsWith(normalizedQuery))
    score += 80;
  if (selector.includes(normalizedQuery)) score += 55;
  if (entryPoint.includes(normalizedQuery)) score += 35;
  if (summary.includes(normalizedQuery)) score += 24;
  if (docs.includes(normalizedQuery)) score += 12;

  for (const token of tokens) {
    if (id === token || name === token) score += 45;
    else if (id.includes(token) || name.includes(token)) score += 24;
    if (className.includes(token)) score += 14;
    if (selector.includes(token)) score += 18;
    if (entryPoint.includes(token)) score += 12;
    if (summary.includes(token)) score += 7;
    if (docs.includes(token)) score += 2;
  }

  return score;
}

function buildIntentBoosts(goal: string): ReadonlyMap<string, number> {
  const boosts = new Map<string, number>();
  const add = (ids: readonly string[], score: number): void => {
    for (const id of ids) boosts.set(id, (boosts.get(id) ?? 0) + score);
  };

  if (
    containsAny(goal, [
      'nullable',
      'null',
      'mixed',
      'inherit',
      'tri state',
      'tri-state',
    ])
  ) {
    add(['tri-state-checkbox'], 240);
  }
  if (containsAny(goal, ['boolean', 'binary', 'accept terms', 'checkbox'])) {
    add(['checkbox'], 90);
  }
  if (containsAny(goal, ['toggle', 'on off', 'setting', 'switch']))
    add(['switch'], 120);
  if (
    containsAny(goal, ['multiple', 'many options', 'chips', 'multi select'])
  ) {
    add(['multi-select'], 150);
  }
  if (containsAny(goal, ['single option', 'dropdown', 'combobox', 'select'])) {
    add(['select'], 105);
  }
  if (
    containsAny(goal, [
      'search suggestion',
      'autocomplete',
      'typeahead',
      'remote search',
    ])
  ) {
    add(['auto-complete'], 170);
  }
  if (containsAny(goal, ['tree', 'hierarchy', 'nested options'])) {
    add(['tree', 'tree-select'], 130);
  }
  if (containsAny(goal, ['date', 'time', 'calendar']))
    add(['date-picker'], 150);
  if (containsAny(goal, ['number', 'currency', 'numeric']))
    add(['input-number'], 130);
  if (containsAny(goal, ['range', 'slider'])) add(['slider'], 130);
  if (containsAny(goal, ['upload', 'file', 'drag drop']))
    add(['file-upload'], 150);
  if (containsAny(goal, ['validation message', 'label hint', 'form field'])) {
    add(['field'], 120);
  }

  return boosts;
}

function buildSearchReason(
  document: NeuralComponentDocument,
  query: string,
  tokens: readonly string[],
): string {
  const directFields = [
    document.id,
    document.name,
    document.selector,
    document.entryPoint,
  ]
    .map(normalize)
    .join(' ');
  const matched = tokens.filter((token) => directFields.includes(token));
  if (matched.length > 0) {
    return `Matched ${matched.join(', ')} in ${document.selector} and its public entry point.`;
  }
  if (normalize(document.summary).includes(query)) {
    return 'Matched the component summary.';
  }
  return 'Matched the component README or llms.txt guidance.';
}

function buildIntentReason(
  document: NeuralComponentDocument,
  goal: string,
): string {
  if (document.id === 'tri-state-checkbox') {
    return 'Uses a boolean | null value model for mixed or inherited state.';
  }
  if (document.id === 'checkbox') {
    return 'Uses a native boolean checked model for binary choices.';
  }
  if (document.id === 'switch') {
    return 'Represents an immediate boolean on/off setting.';
  }
  return `Recommended from the documented ${document.name} contract for “${goal}”.`;
}

function normalizeReference(value: string): string {
  const normalized = normalize(value);
  if (!normalized || normalized.includes('..') || normalized.includes('\\')) {
    return '';
  }
  return normalized;
}

function normalize(value: string): string {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9@/.[\]-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function uniqueTokens(value: string): readonly string[] {
  return [
    ...new Set(value.split(/[\s/.[\]@-]+/).filter((token) => token.length > 1)),
  ];
}

function containsAny(value: string, candidates: readonly string[]): boolean {
  return candidates.some((candidate) => value.includes(candidate));
}

function clampLimit(limit: number): number {
  if (!Number.isFinite(limit)) return 10;
  return Math.min(MAX_RESULTS, Math.max(1, Math.trunc(limit)));
}

function compareText(left: string, right: string): number {
  return left.localeCompare(right, 'en');
}
