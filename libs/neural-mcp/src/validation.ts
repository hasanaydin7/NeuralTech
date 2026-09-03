import { getComponentContract } from './catalog.js';
import type {
  NeuralComponentContract,
  NeuralProviderRequirement,
  NeuralUsageDiagnostic,
  NeuralUsageValidationRequest,
  NeuralUsageValidationResult,
} from './types.js';

interface ParsedElement {
  readonly selector: string;
  readonly start: number;
  readonly end: number;
  readonly selfClosing: boolean;
  readonly attributes: ReadonlyMap<string, string | true>;
}

const GLOBAL_ATTRIBUTES = new Set([
  'class',
  'id',
  'role',
  'style',
  'title',
  'tabindex',
  'dir',
  'lang',
  'hidden',
  'ngclass',
  'ngstyle',
  'ngmodel',
  'formcontrol',
  'formcontrolname',
  'routerlink',
  'routerlinkactive',
]);

export function validateUsage(
  request: NeuralUsageValidationRequest,
): NeuralUsageValidationResult {
  if (!request.template.trim()) {
    throw new TypeError('template must be a non-empty string.');
  }

  const diagnostics: NeuralUsageDiagnostic[] = [];
  const contracts = new Map<string, NeuralComponentContract>();
  const elements = parseNeuralElements(request.template);

  for (const element of elements) {
    const contract = getComponentContract(element.selector);
    if (!contract) {
      diagnostics.push(
        diagnostic(
          request.template,
          element.start,
          'NNG001',
          'error',
          `Unknown NeuralNg selector <${element.selector}>.`,
          element.selector,
          'Use search_components to resolve the intended public selector.',
        ),
      );
      continue;
    }
    contracts.set(contract.id, contract);
    validateBindings(request.template, element, contract, diagnostics);
    validateRequiredInputs(request.template, element, contract, diagnostics);
    validateLiteralValues(request.template, element, contract, diagnostics);
    validateAccessibility(request.template, element, contract, diagnostics);
  }

  validateDuplicateToastOutlets(request.template, elements, diagnostics);

  const imports = new Set(request.imports ?? []);
  const missingContracts = [...contracts.values()].filter(
    (contract) => !imports.has(contract.className),
  );
  for (const contract of missingContracts) {
    diagnostics.push(
      diagnostic(
        request.template,
        elements.find((element) => element.selector === contract.selector)
          ?.start ?? 0,
        'NNG101',
        'info',
        `${contract.className} is not listed in the supplied standalone imports.`,
        contract.id,
        `Import ${contract.className} from '${contract.entryPoint}'.`,
      ),
    );
  }

  const suggestedProviders = requiredProviders([...contracts.values()]);
  const configuredProviders = new Set(request.providers ?? []);
  for (const provider of suggestedProviders) {
    if (
      provider.requirement !== 'required' ||
      configuredProviders.has(provider.name)
    )
      continue;
    diagnostics.push(
      diagnostic(
        request.template,
        0,
        'NNG102',
        'error',
        `Required provider ${provider.name} is not listed in the supplied providers.`,
        undefined,
        `Register ${provider.name}() in application or route providers.`,
      ),
    );
  }

  diagnostics.sort(
    (left, right) =>
      severityRank(left.severity) - severityRank(right.severity) ||
      left.line - right.line ||
      left.column - right.column ||
      left.code.localeCompare(right.code, 'en'),
  );
  const summary = {
    errors: diagnostics.filter((item) => item.severity === 'error').length,
    warnings: diagnostics.filter((item) => item.severity === 'warning').length,
    infos: diagnostics.filter((item) => item.severity === 'info').length,
  };

  return {
    schemaVersion: 1,
    valid: summary.errors === 0,
    components: [...contracts.keys()],
    diagnostics,
    suggestedImports: groupImports(missingContracts),
    suggestedProviders,
    summary,
  };
}

function validateBindings(
  template: string,
  element: ParsedElement,
  contract: NeuralComponentContract,
  diagnostics: NeuralUsageDiagnostic[],
): void {
  const inputs = new Set(contract.inputs.map((input) => input.bindingName));
  const models = new Set(
    contract.models.map((model) => model.bindingName ?? model.name),
  );
  const outputs = new Set(contract.outputs.map((output) => output.bindingName));

  for (const rawName of element.attributes.keys()) {
    const binding = classifyBinding(rawName);
    if (!binding || isGlobalAttribute(binding.name)) continue;
    const known =
      binding.kind === 'input'
        ? inputs.has(binding.name) || models.has(binding.name)
        : binding.kind === 'model'
          ? models.has(binding.name)
          : outputs.has(binding.name) || models.has(binding.name);
    if (known) continue;
    diagnostics.push(
      diagnostic(
        template,
        element.start,
        'NNG002',
        'error',
        `Unknown ${binding.kind} binding "${rawName}" on <${element.selector}>.`,
        contract.id,
        `Use get_component with detail=standard to inspect supported inputs, models, and outputs.`,
      ),
    );
  }
}

function validateRequiredInputs(
  template: string,
  element: ParsedElement,
  contract: NeuralComponentContract,
  diagnostics: NeuralUsageDiagnostic[],
): void {
  const supplied = new Set(
    [...element.attributes.keys()]
      .map(classifyBinding)
      .filter(
        (binding): binding is NonNullable<ReturnType<typeof classifyBinding>> =>
          Boolean(binding),
      )
      .map((binding) => binding.name),
  );
  for (const input of contract.inputs) {
    if (!input.required || supplied.has(input.bindingName)) continue;
    diagnostics.push(
      diagnostic(
        template,
        element.start,
        'NNG003',
        'error',
        `<${element.selector}> requires the "${input.bindingName}" input (${input.type}).`,
        contract.id,
        `Bind [${input.bindingName}] to a value of type ${input.type}.`,
      ),
    );
  }
}

function validateLiteralValues(
  template: string,
  element: ParsedElement,
  contract: NeuralComponentContract,
  diagnostics: NeuralUsageDiagnostic[],
): void {
  for (const input of contract.inputs) {
    const value = element.attributes.get(input.bindingName);
    if (typeof value !== 'string') continue;
    const allowed = literalUnion(input.type, contract);
    if (!allowed.length || allowed.includes(value)) continue;
    diagnostics.push(
      diagnostic(
        template,
        element.start,
        'NNG004',
        'error',
        `Invalid literal "${value}" for ${element.selector}.${input.bindingName}.`,
        contract.id,
        `Use one of: ${allowed.join(', ')}.`,
      ),
    );
  }
}

function validateAccessibility(
  template: string,
  element: ParsedElement,
  contract: NeuralComponentContract,
  diagnostics: NeuralUsageDiagnostic[],
): void {
  if (contract.id !== 'button') return;
  const hasIcon = hasBinding(element, 'icon');
  const hasLabel =
    hasBinding(element, 'label') ||
    hasBinding(element, 'ariaLabel') ||
    hasBinding(element, 'aria-label') ||
    projectedText(template, element).length > 0;
  if (!hasIcon || hasLabel) return;
  diagnostics.push(
    diagnostic(
      template,
      element.start,
      'NNG201',
      'error',
      'Icon-only NeuralButton requires an accessible label.',
      contract.id,
      'Add ariaLabel="Describe the action" or bind [ariaLabel].',
    ),
  );
}

function validateDuplicateToastOutlets(
  template: string,
  elements: readonly ParsedElement[],
  diagnostics: NeuralUsageDiagnostic[],
): void {
  const channels = new Map<string, ParsedElement>();
  for (const element of elements.filter(
    (item) => item.selector === 'neural-toast',
  )) {
    const channelValue = element.attributes.get('channel');
    const channel = typeof channelValue === 'string' ? channelValue : 'global';
    if (!channels.has(channel)) {
      channels.set(channel, element);
      continue;
    }
    diagnostics.push(
      diagnostic(
        template,
        element.start,
        'NNG202',
        'warning',
        `Multiple NeuralToast outlets render the "${channel}" channel.`,
        'toast',
        'Mount only one Toast outlet per channel.',
      ),
    );
  }
}

function parseNeuralElements(template: string): ParsedElement[] {
  const elements: ParsedElement[] = [];
  let cursor = 0;
  while (cursor < template.length) {
    const start = template.indexOf('<neural-', cursor);
    if (start < 0) break;
    let index = start + 1;
    let quote = '';
    while (index < template.length) {
      const character = template[index];
      if (quote) {
        if (character === quote) quote = '';
      } else if (character === '"' || character === "'") {
        quote = character;
      } else if (character === '>') {
        break;
      }
      index += 1;
    }
    if (index >= template.length) break;
    const source = template.slice(start + 1, index);
    const selector = /^([a-z0-9-]+)/i.exec(source)?.[1]?.toLowerCase();
    if (selector) {
      elements.push({
        selector,
        start,
        end: index + 1,
        selfClosing: /\/\s*$/.test(source),
        attributes: parseAttributes(source.slice(selector.length)),
      });
    }
    cursor = index + 1;
  }
  return elements;
}

function parseAttributes(source: string): ReadonlyMap<string, string | true> {
  const attributes = new Map<string, string | true>();
  const pattern = /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s]+)))?/g;
  for (const match of source.matchAll(pattern)) {
    const name = match[1];
    if (!name || name === '/') continue;
    attributes.set(name, match[2] ?? match[3] ?? match[4] ?? true);
  }
  return attributes;
}

function classifyBinding(
  rawName: string,
): { kind: 'input' | 'output' | 'model'; name: string } | undefined {
  const model = /^\[\((.+)\)\]$/.exec(rawName);
  if (model?.[1]) return { kind: 'model', name: model[1] };
  const input = /^\[(.+)\]$/.exec(rawName);
  if (input?.[1]) return { kind: 'input', name: input[1] };
  const output = /^\((.+)\)$/.exec(rawName);
  if (output?.[1]) return { kind: 'output', name: output[1] };
  if (/^[*#]/.test(rawName)) return undefined;
  return { kind: 'input', name: rawName };
}

function isGlobalAttribute(name: string): boolean {
  const normalized = name.toLowerCase();
  return (
    GLOBAL_ATTRIBUTES.has(normalized) ||
    normalized.startsWith('aria-') ||
    normalized.startsWith('data-') ||
    normalized.startsWith('class.') ||
    normalized.startsWith('style.') ||
    normalized.startsWith('attr.')
  );
}

function literalUnion(
  type: string,
  contract: NeuralComponentContract,
): string[] {
  const resolved =
    contract.typeAliases.find((alias) => alias.name === type)?.type ?? type;
  const parts = resolved
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts.length || parts.some((part) => !/^(['"]).*\1$/.test(part)))
    return [];
  return parts.map((part) => part.slice(1, -1));
}

function hasBinding(element: ParsedElement, name: string): boolean {
  return [...element.attributes.keys()].some(
    (rawName) => classifyBinding(rawName)?.name === name,
  );
}

function projectedText(template: string, element: ParsedElement): string {
  if (element.selfClosing) return '';
  const close = template.indexOf(`</${element.selector}>`, element.end);
  if (close < 0) return '';
  return template
    .slice(element.end, close)
    .replace(/<[^>]+>/g, ' ')
    .replace(/{{[^}]+}}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function groupImports(
  contracts: readonly NeuralComponentContract[],
): Readonly<Record<string, readonly string[]>> {
  const imports = new Map<string, string[]>();
  for (const contract of contracts) {
    const values = imports.get(contract.entryPoint) ?? [];
    if (!values.includes(contract.className)) values.push(contract.className);
    imports.set(contract.entryPoint, values);
  }
  return Object.fromEntries(imports);
}

function requiredProviders(
  contracts: readonly NeuralComponentContract[],
): NeuralProviderRequirement[] {
  const priorities = { supported: 0, optional: 1, required: 2 } as const;
  const providers = new Map<string, NeuralProviderRequirement>();
  for (const contract of contracts) {
    for (const provider of contract.providerRequirements) {
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

function diagnostic(
  template: string,
  index: number,
  code: string,
  severity: NeuralUsageDiagnostic['severity'],
  message: string,
  component?: string,
  suggestion?: string,
): NeuralUsageDiagnostic {
  const prefix = template.slice(0, index);
  const lines = prefix.split('\n');
  return {
    code,
    severity,
    message,
    line: lines.length,
    column: (lines.at(-1)?.length ?? 0) + 1,
    ...(component ? { component } : {}),
    ...(suggestion ? { suggestion } : {}),
  };
}

function severityRank(severity: NeuralUsageDiagnostic['severity']): number {
  return severity === 'error' ? 0 : severity === 'warning' ? 1 : 2;
}
