import { getComponentContract } from './catalog.js';
import type {
  NeuralComponentContract,
  NeuralCompositionComponent,
  NeuralCompositionKind,
  NeuralCompositionPlan,
  NeuralCompositionRequest,
  NeuralCompositionSection,
  NeuralProviderRequirement,
} from './types.js';

type PlanKind = Exclude<NeuralCompositionKind, 'auto'>;
type ComponentRole = NeuralCompositionComponent['role'];

interface Candidate {
  readonly reference: string;
  readonly role: ComponentRole;
  readonly reason: string;
  readonly section: string;
}

interface SectionDefinition {
  readonly id: string;
  readonly purpose: string;
}

const SECTIONS: Readonly<Record<string, SectionDefinition>> = {
  navigation: {
    id: 'navigation',
    purpose: 'Orient the user and expose page-level navigation.',
  },
  actions: {
    id: 'actions',
    purpose: 'Expose search, filters, and primary page actions.',
  },
  content: {
    id: 'content',
    purpose: 'Present the primary task data and interaction surface.',
  },
  details: {
    id: 'details',
    purpose: 'Show focused details without losing page context.',
  },
  feedback: {
    id: 'feedback',
    purpose: 'Communicate loading, empty, validation, and operation states.',
  },
};

export function planUi(
  request: NeuralCompositionRequest,
): NeuralCompositionPlan {
  const goal = request.goal.trim();
  if (!goal) throw new TypeError('goal must be a non-empty string.');

  const normalized = normalize(goal);
  const kind = resolveKind(request.kind ?? 'auto', normalized);
  const candidates = baseCandidates(kind);
  addGoalCandidates(candidates, normalized, kind);
  const components = resolveCandidates(candidates);
  const sections = buildSections(candidates, components);

  return {
    schemaVersion: 1,
    kind,
    goal,
    rationale: buildRationale(kind, normalized),
    components,
    sections,
    imports: buildImports(components),
    providers: mergeProviders(components),
    state: buildState(kind, normalized),
    accessibility: buildAccessibility(kind, normalized),
    implementationOrder: buildImplementationOrder(kind, normalized),
    exampleQueries: components.slice(0, 6).map((component) => component.id),
  };
}

function resolveKind(kind: NeuralCompositionKind, goal: string): PlanKind {
  if (kind !== 'auto') return kind;
  if (
    containsAny(goal, ['table', 'grid', 'rows', 'admin users', 'data list'])
  ) {
    return 'table';
  }
  if (
    containsAny(goal, [
      'form',
      'register',
      'sign up',
      'edit profile',
      'checkout',
    ])
  ) {
    return 'form';
  }
  return 'page';
}

function baseCandidates(kind: PlanKind): Candidate[] {
  if (kind === 'table') {
    return [
      candidate(
        'table',
        'foundation',
        'Owns typed rows, columns, state templates, and table semantics.',
        'content',
      ),
      candidate(
        'neural-paginator',
        'support',
        'Keeps paging state explicit and reusable.',
        'content',
      ),
      candidate(
        'toolbar',
        'support',
        'Groups filters and row-independent actions semantically.',
        'actions',
      ),
    ];
  }
  if (kind === 'form') {
    return [
      candidate(
        'neural-field',
        'foundation',
        'Composes label, control, hint, and error semantics.',
        'content',
      ),
      candidate(
        'neural-input',
        'foundation',
        'Provides the primary text entry control and Forms integration.',
        'content',
      ),
      candidate(
        'button',
        'foundation',
        'Submits or cancels the form with accessible action semantics.',
        'actions',
      ),
      candidate(
        'neural-message',
        'support',
        'Presents form-level success or error feedback in document flow.',
        'feedback',
      ),
    ];
  }
  return [
    candidate(
      'toolbar',
      'foundation',
      'Defines a predictable page action region.',
      'actions',
    ),
    candidate(
      'card',
      'foundation',
      'Groups related page content without inventing layout behavior.',
      'content',
    ),
  ];
}

function addGoalCandidates(
  candidates: Candidate[],
  goal: string,
  kind: PlanKind,
): void {
  if (
    kind !== 'form' &&
    containsAny(goal, [
      'button',
      'save',
      'create',
      'add action',
      'primary action',
    ])
  ) {
    candidates.push(
      candidate(
        'button',
        'feature',
        'Provides the named page action with accessible button semantics.',
        'actions',
      ),
    );
  }
  if (containsAny(goal, ['search', 'filter', 'query'])) {
    candidates.push(
      candidate(
        'neural-input',
        'feature',
        'Captures free-text search or filter state.',
        'actions',
      ),
    );
  }
  if (
    containsAny(goal, [
      'status',
      'category',
      'role filter',
      'dropdown',
      'single option',
    ])
  ) {
    candidates.push(
      candidate(
        'select',
        'feature',
        'Provides a typed single-value filter or choice.',
        kind === 'form' ? 'content' : 'actions',
      ),
    );
  }
  if (
    containsAny(goal, [
      'multiple',
      'multi select',
      'many options',
      'tags filter',
    ])
  ) {
    candidates.push(
      candidate(
        'multi-select',
        'feature',
        'Provides a typed multi-value selection model.',
        kind === 'form' ? 'content' : 'actions',
      ),
    );
  }
  if (containsAny(goal, ['date', 'calendar', 'due date', 'date range'])) {
    candidates.push(
      candidate(
        'date-picker',
        'feature',
        'Captures date or range state with keyboard-accessible calendar behavior.',
        kind === 'form' ? 'content' : 'actions',
      ),
    );
  }
  if (containsAny(goal, ['toggle', 'enabled', 'active setting', 'on off'])) {
    candidates.push(
      candidate(
        'switch',
        'feature',
        'Represents an immediate boolean setting.',
        'content',
      ),
    );
  }
  if (
    containsAny(goal, [
      'nullable',
      'inherited',
      'mixed permission',
      'tri state',
    ])
  ) {
    candidates.push(
      candidate(
        'tri-state-checkbox',
        'feature',
        'Preserves true, false, and inherited null states.',
        'content',
      ),
    );
  } else if (
    containsAny(goal, [
      'checkbox',
      'bulk select',
      'row selection',
      'accept terms',
    ])
  ) {
    candidates.push(
      candidate(
        'checkbox',
        'feature',
        'Represents explicit binary or selection state.',
        'content',
      ),
    );
  }
  if (containsAny(goal, ['detail', 'drawer', 'side panel', 'inspect row'])) {
    candidates.push(
      candidate(
        'neural-drawer',
        'feature',
        'Shows details while preserving the current page and filter context.',
        'details',
      ),
    );
  }
  if (containsAny(goal, ['dialog', 'modal', 'blocking edit'])) {
    candidates.push(
      candidate(
        'neural-dialog',
        'feature',
        'Contains a focused modal task with managed focus.',
        'details',
      ),
    );
  }
  if (containsAny(goal, ['delete', 'destructive', 'remove', 'confirm'])) {
    candidates.push(
      candidate(
        'confirm-dialog',
        'support',
        'Requires explicit confirmation before a destructive action.',
        'feedback',
      ),
    );
  }
  if (
    containsAny(goal, ['toast', 'notification', 'saved', 'success feedback'])
  ) {
    candidates.push(
      candidate(
        'toast',
        'support',
        'Renders global operation feedback from the message store.',
        'feedback',
      ),
    );
  }
  if (containsAny(goal, ['loading', 'async', 'remote', 'server'])) {
    candidates.push(
      candidate(
        'neural-loading-overlay',
        'support',
        'Blocks only the affected region during a pending operation.',
        'feedback',
      ),
    );
  }
  if (containsAny(goal, ['hierarchy', 'tree'])) {
    candidates.push(
      candidate(
        kind === 'form' ? 'tree-select' : 'tree',
        'feature',
        'Represents nested data with explicit expansion state.',
        'content',
      ),
    );
  }
  if (containsAny(goal, ['sidebar', 'navigation rail', 'app shell'])) {
    candidates.push(
      candidate(
        'neural-sidebar',
        'feature',
        'Owns responsive expanded, mini, overlay, and focus behavior.',
        'navigation',
      ),
      candidate(
        'neural-menu',
        'feature',
        'Provides grouped application navigation inside the sidebar.',
        'navigation',
      ),
    );
  }
  if (containsAny(goal, ['tabs', 'tabbed'])) {
    candidates.push(
      candidate(
        'tabs',
        'feature',
        'Splits peer views with keyboard-managed tab semantics.',
        'navigation',
      ),
    );
  }
  if (kind === 'table' && containsAny(goal, ['status', 'state badge'])) {
    candidates.push(
      candidate(
        'tag',
        'support',
        'Renders compact semantic row status.',
        'content',
      ),
    );
  }
}

function resolveCandidates(
  candidates: readonly Candidate[],
): NeuralCompositionComponent[] {
  const seen = new Set<string>();
  const result: NeuralCompositionComponent[] = [];
  for (const item of candidates) {
    const contract = getComponentContract(item.reference);
    if (!contract || seen.has(contract.id)) continue;
    seen.add(contract.id);
    result.push(toCompositionComponent(contract, item));
  }
  return result;
}

function toCompositionComponent(
  contract: NeuralComponentContract,
  candidateValue: Candidate,
): NeuralCompositionComponent {
  return {
    id: contract.id,
    className: contract.className,
    selector: contract.selector,
    entryPoint: contract.entryPoint,
    role: candidateValue.role,
    reason: candidateValue.reason,
    requiredInputs: contract.inputs
      .filter((input) => input.required)
      .map((input) => input.bindingName),
    models: contract.models.map((model) => model.bindingName ?? model.name),
    outputs: contract.outputs.map((output) => output.bindingName),
    templates: contract.templates.map((template) => template.selector),
  };
}

function buildSections(
  candidates: readonly Candidate[],
  components: readonly NeuralCompositionComponent[],
): NeuralCompositionSection[] {
  const componentIds = new Set(components.map((component) => component.id));
  const aliases = new Map<string, string>();
  for (const item of candidates) {
    const contract = getComponentContract(item.reference);
    if (contract && componentIds.has(contract.id))
      aliases.set(item.reference, contract.id);
  }
  const result: NeuralCompositionSection[] = [];
  for (const definition of Object.values(SECTIONS)) {
    const ids = candidates
      .filter((item) => item.section === definition.id)
      .map((item) => aliases.get(item.reference))
      .filter((id): id is string => Boolean(id))
      .filter((id, index, values) => values.indexOf(id) === index);
    if (ids.length) result.push({ ...definition, components: ids });
  }
  return result;
}

function buildImports(
  components: readonly NeuralCompositionComponent[],
): Readonly<Record<string, readonly string[]>> {
  const imports = new Map<string, string[]>();
  for (const component of components) {
    const symbols = imports.get(component.entryPoint) ?? [];
    if (!symbols.includes(component.className))
      symbols.push(component.className);
    imports.set(component.entryPoint, symbols);
  }
  return Object.fromEntries(
    [...imports.entries()].sort(([left], [right]) =>
      left.localeCompare(right, 'en'),
    ),
  );
}

function mergeProviders(
  components: readonly NeuralCompositionComponent[],
): NeuralProviderRequirement[] {
  const priorities = { supported: 0, optional: 1, required: 2 } as const;
  const providers = new Map<string, NeuralProviderRequirement>();
  for (const component of components) {
    const contract = getComponentContract(component.id);
    for (const provider of contract?.providerRequirements ?? []) {
      const current = providers.get(provider.name);
      if (
        !current ||
        priorities[provider.requirement] > priorities[current.requirement]
      ) {
        providers.set(provider.name, provider);
      }
    }
  }
  return [...providers.values()].sort((left, right) =>
    left.name.localeCompare(right.name, 'en'),
  );
}

function buildState(kind: PlanKind, goal: string): string[] {
  const state =
    kind === 'table'
      ? ['rows', 'loading', 'page', 'pageSize', 'sort', 'filters', 'selection']
      : kind === 'form'
        ? ['form value', 'validation status', 'submitting', 'submit result']
        : ['route/view state', 'loading', 'operation feedback'];
  if (containsAny(goal, ['detail', 'drawer', 'dialog', 'modal']))
    state.push('selected item', 'details open state');
  if (containsAny(goal, ['remote', 'server', 'async']))
    state.push('request error', 'retry state');
  return [...new Set(state)];
}

function buildAccessibility(kind: PlanKind, goal: string): string[] {
  const checks = [
    'Give every icon-only button an accessible ariaLabel.',
    'Preserve visible focus and logical start/end direction behavior.',
    'Expose loading, empty, error, and retry states without relying on color alone.',
  ];
  if (kind === 'form')
    checks.push(
      'Associate every control with NeuralField label, hint, and error content.',
    );
  if (kind === 'table')
    checks.push(
      'Keep column headers semantic and announce sort state; provide a non-table mobile fallback when columns cannot fit.',
    );
  if (containsAny(goal, ['drawer', 'dialog', 'modal', 'detail']))
    checks.push(
      'Provide a visible title, intentional initial focus, Escape behavior, and focus restoration.',
    );
  if (containsAny(goal, ['delete', 'destructive', 'remove']))
    checks.push(
      'Name the destructive target in the confirmation copy and keep cancellation as the safe default.',
    );
  return checks;
}

function buildImplementationOrder(kind: PlanKind, goal: string): string[] {
  const steps = [
    'Define typed domain data and local/remote state before writing the template.',
    'Import each standalone NeuralNg declaration from its component entry point.',
    'Compose the structural regions and bind required inputs/models.',
    'Add loading, empty, error, and success behavior.',
    'Verify keyboard, screen-reader, RTL, SSR/hydration, and narrow viewport behavior.',
  ];
  if (kind === 'table')
    steps.splice(
      3,
      0,
      'Keep filter, sort, page, and selection state controlled so remote data can replace local data safely.',
    );
  if (containsAny(goal, ['toast', 'notification']))
    steps.splice(
      2,
      0,
      'Register required message providers once at application or route scope.',
    );
  return steps;
}

function buildRationale(kind: PlanKind, goal: string): string {
  const details = containsAny(goal, [
    'detail',
    'drawer',
    'side panel',
    'inspect row',
  ])
    ? ' Details remain in a drawer so the user keeps list context.'
    : '';
  return `A ${kind} composition was selected from explicit interaction intents, then resolved against the generated NeuralNg public contracts.${details}`;
}

function candidate(
  reference: string,
  role: ComponentRole,
  reason: string,
  section: string,
): Candidate {
  return { reference, role, reason, section };
}

function containsAny(value: string, needles: readonly string[]): boolean {
  return needles.some((needle) => value.includes(needle));
}

function normalize(value: string): string {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
