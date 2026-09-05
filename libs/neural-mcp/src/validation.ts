import {
  DomElementSchemaRegistry,
  parseTemplate,
  TmplAstElement,
  TmplAstRecursiveVisitor,
  TmplAstText,
  VERSION,
  tmplAstVisitAll,
} from '@angular/compiler';
import { listComponents } from './catalog.js';
import type {
  NeuralComponentContract,
  NeuralProviderRequirement,
  NeuralUsageDiagnostic,
  NeuralUsageValidationRequest,
  NeuralUsageValidationResult,
} from './types.js';

interface ParsedElement {
  readonly tagName: string;
  readonly start: number;
  readonly attributes: ReadonlyMap<string, string | true>;
  readonly attributeStarts: ReadonlyMap<string, number>;
  readonly hasProjectedText: boolean;
}

interface ContractSelectorVariant {
  readonly contract: NeuralComponentContract;
  readonly tagName?: string;
  readonly attributes: readonly string[];
}

const DOM_SCHEMA = new DomElementSchemaRegistry();
const CONTRACT_SELECTOR_VARIANTS = listComponents().flatMap((contract) =>
  contract.selector
    .split(',')
    .map((selector) => parseContractSelector(contract, selector.trim())),
);

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
  'formfield',
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
  const componentUsageCounts = new Map<string, number>();
  const elements = parseAngularElements(request.template, diagnostics);

  for (const element of elements) {
    const matchedContracts = matchContracts(element);
    const elementContract = matchedContracts.find((contract) =>
      CONTRACT_SELECTOR_VARIANTS.some(
        (variant) =>
          variant.contract.id === contract.id &&
          variant.tagName === element.tagName,
      ),
    );
    if (element.tagName.startsWith('neural-') && !elementContract) {
      diagnostics.push(
        diagnostic(
          request.template,
          element.start,
          'NNG001',
          'error',
          `Unknown NeuralNg selector <${element.tagName}>.`,
          element.tagName,
          'Use search_components to resolve the intended public selector.',
        ),
      );
    }
    validateUnknownNeuralAttributes(
      request.template,
      element,
      matchedContracts,
      diagnostics,
    );
    if (!matchedContracts.length) continue;

    for (const contract of matchedContracts) {
      contracts.set(contract.id, contract);
      componentUsageCounts.set(
        contract.id,
        (componentUsageCounts.get(contract.id) ?? 0) + 1,
      );
    }
    validateBindings(request.template, element, matchedContracts, diagnostics);
    for (const contract of matchedContracts) {
      validateRequiredInputs(request.template, element, contract, diagnostics);
      validateLiteralValues(request.template, element, contract, diagnostics);
      validateAccessibility(request.template, element, contract, diagnostics);
    }
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
        elements.find((element) =>
          matchContracts(element).some((match) => match.id === contract.id),
        )?.start ?? 0,
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
    schemaVersion: 2,
    valid: summary.errors === 0,
    syntax: {
      parser: '@angular/compiler',
      parserVersion: VERSION.full,
      valid: !diagnostics.some((item) => item.code === 'NNG000'),
      errors: diagnostics.filter((item) => item.code === 'NNG000').length,
    },
    components: [...contracts.keys()],
    componentUsages: [...componentUsageCounts.entries()].map(
      ([id, occurrences]) => ({ id, occurrences }),
    ),
    diagnostics,
    suggestedImports: groupImports(missingContracts),
    suggestedProviders,
    summary,
  };
}

function validateBindings(
  template: string,
  element: ParsedElement,
  contracts: readonly NeuralComponentContract[],
  diagnostics: NeuralUsageDiagnostic[],
): void {
  const inputs = new Set(
    contracts.flatMap((contract) =>
      contract.inputs.map((input) => input.bindingName),
    ),
  );
  const models = new Set(
    contracts.flatMap((contract) =>
      contract.models.map((model) => model.bindingName ?? model.name),
    ),
  );
  const outputs = new Set(
    contracts.flatMap((contract) => [
      ...contract.outputs.map((output) => output.bindingName),
      ...contract.models.map(
        (model) => `${model.bindingName ?? model.name}Change`,
      ),
    ]),
  );
  const selectorAttributes = new Set(
    CONTRACT_SELECTOR_VARIANTS.filter((variant) =>
      contracts.some((contract) => contract.id === variant.contract.id),
    ).flatMap((variant) => variant.attributes),
  );

  for (const rawName of element.attributes.keys()) {
    const binding = classifyBinding(rawName);
    if (!binding || isGlobalAttribute(binding.name)) continue;
    if (
      !rawName.startsWith('[') &&
      !rawName.startsWith('(') &&
      binding.name.includes('-')
    ) {
      continue;
    }
    const known =
      binding.kind === 'input'
        ? inputs.has(binding.name) ||
          models.has(binding.name) ||
          selectorAttributes.has(binding.name)
        : binding.kind === 'model'
          ? models.has(binding.name)
          : outputs.has(binding.name) || models.has(binding.name);
    if (known || isNativeBinding(element.tagName, rawName, binding)) continue;
    diagnostics.push(
      diagnostic(
        template,
        element.attributeStarts.get(rawName) ?? element.start,
        'NNG002',
        'error',
        `Unknown ${binding.kind} binding "${rawName}" on <${element.tagName}>.`,
        contracts[0]?.id,
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
        `<${element.tagName}> requires the "${input.bindingName}" input (${input.type}).`,
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
        element.attributeStarts.get(input.bindingName) ?? element.start,
        'NNG004',
        'error',
        `Invalid literal "${value}" for ${element.tagName}.${input.bindingName}.`,
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
    element.hasProjectedText;
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
    (item) => item.tagName === 'neural-toast',
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

function parseAngularElements(
  template: string,
  diagnostics: NeuralUsageDiagnostic[],
): ParsedElement[] {
  const parsed = parseTemplate(template, 'inline-template.html', {
    preserveWhitespaces: true,
    alwaysAttemptHtmlToR3AstConversion: true,
    enableBlockSyntax: true,
    enableLetSyntax: true,
  });
  for (const error of parsed.errors ?? []) {
    diagnostics.push(
      diagnostic(
        template,
        error.span.start.offset,
        'NNG000',
        'error',
        `Angular template parse error: ${error.msg}`,
        undefined,
        'Fix the Angular template syntax before validating NeuralNg contracts.',
      ),
    );
  }

  const elements: ParsedElement[] = [];
  tmplAstVisitAll(new NeuralElementCollector(template, elements), parsed.nodes);
  return elements;
}

class NeuralElementCollector extends TmplAstRecursiveVisitor {
  constructor(
    private readonly template: string,
    private readonly elements: ParsedElement[],
  ) {
    super();
  }

  override visitElement(element: TmplAstElement): void {
    this.elements.push(toParsedElement(this.template, element));
    super.visitElement(element);
  }
}

function toParsedElement(
  template: string,
  element: TmplAstElement,
): ParsedElement {
  const attributes = new Map<string, string | true>();
  const attributeStarts = new Map<string, number>();
  for (const attribute of element.attributes) {
    attributes.set(attribute.name, attribute.value || true);
    attributeStarts.set(attribute.name, attribute.sourceSpan.start.offset);
  }
  for (const binding of [...element.inputs, ...element.outputs]) {
    const source = template.slice(
      binding.sourceSpan.start.offset,
      binding.sourceSpan.end.offset,
    );
    const rawName = source.split('=', 1)[0]?.trim();
    if (!rawName) continue;
    attributes.set(rawName, true);
    attributeStarts.set(rawName, binding.sourceSpan.start.offset);
  }

  const projectedText = new ProjectedTextVisitor();
  tmplAstVisitAll(projectedText, element.children);
  return {
    tagName: element.name.toLowerCase(),
    start: element.startSourceSpan.start.offset,
    attributes,
    attributeStarts,
    hasProjectedText: projectedText.found,
  };
}

class ProjectedTextVisitor extends TmplAstRecursiveVisitor {
  found = false;

  override visitText(text: TmplAstText): void {
    if (text.value.trim()) this.found = true;
  }

  override visitBoundText(): void {
    this.found = true;
  }
}

function parseContractSelector(
  contract: NeuralComponentContract,
  selector: string,
): ContractSelectorVariant {
  const tagName = /^[a-z][a-z0-9-]*/i.exec(selector)?.[0]?.toLowerCase();
  const attributes = [...selector.matchAll(/\[([A-Za-z][A-Za-z0-9-]*)\]/g)]
    .map((match) => match[1])
    .filter((name): name is string => Boolean(name));
  return { contract, ...(tagName ? { tagName } : {}), attributes };
}

function matchContracts(element: ParsedElement): NeuralComponentContract[] {
  const supplied = new Set(
    [...element.attributes.keys()]
      .map(classifyBinding)
      .filter(
        (binding): binding is NonNullable<ReturnType<typeof classifyBinding>> =>
          Boolean(binding),
      )
      .map((binding) => binding.name),
  );
  const matches = CONTRACT_SELECTOR_VARIANTS.filter(
    (variant) =>
      (!variant.tagName || variant.tagName === element.tagName) &&
      variant.attributes.every((attribute) => supplied.has(attribute)),
  ).map((variant) => variant.contract);
  return [
    ...new Map(matches.map((contract) => [contract.id, contract])).values(),
  ];
}

function validateUnknownNeuralAttributes(
  template: string,
  element: ParsedElement,
  contracts: readonly NeuralComponentContract[],
  diagnostics: NeuralUsageDiagnostic[],
): void {
  const knownNames = new Set(
    contracts.flatMap((contract) => [
      ...contract.inputs.map((input) => input.bindingName),
      ...contract.models.map((model) => model.bindingName ?? model.name),
      ...contract.models.map(
        (model) => `${model.bindingName ?? model.name}Change`,
      ),
      ...contract.outputs.map((output) => output.bindingName),
    ]),
  );
  const knownSelectorNames = new Set(
    CONTRACT_SELECTOR_VARIANTS.flatMap((variant) => variant.attributes),
  );
  for (const rawName of element.attributes.keys()) {
    const binding = classifyBinding(rawName);
    if (
      binding &&
      !rawName.startsWith('[') &&
      !rawName.startsWith('(') &&
      binding.name.includes('-')
    ) {
      continue;
    }
    if (
      !binding ||
      !binding.name.startsWith('neural') ||
      knownNames.has(binding.name) ||
      knownSelectorNames.has(binding.name)
    ) {
      continue;
    }
    diagnostics.push(
      diagnostic(
        template,
        element.attributeStarts.get(rawName) ?? element.start,
        'NNG001',
        'error',
        `Unknown NeuralNg directive or binding "${rawName}" on <${element.tagName}>.`,
        undefined,
        'Use search_components to resolve the intended public directive or input.',
      ),
    );
  }
}

function isNativeBinding(
  tagName: string,
  rawName: string,
  binding: NonNullable<ReturnType<typeof classifyBinding>>,
): boolean {
  if (tagName.startsWith('neural-')) return false;
  if (!rawName.startsWith('[') && !rawName.startsWith('(')) return true;
  if (binding.kind === 'output') {
    return DOM_SCHEMA.allKnownEventsOfElement(tagName).includes(binding.name);
  }
  return DOM_SCHEMA.hasProperty(tagName, binding.name, []);
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
