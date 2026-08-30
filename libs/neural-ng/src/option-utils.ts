export type NeuralOptionFilterMode = 'contains' | 'startsWith' | 'endsWith';

export interface NeuralOptionSourceConfig {
  readonly idPrefix: string;
  readonly labelPath?: string;
  readonly valuePath?: string;
  readonly disabledPath?: string;
  readonly groupPath?: string;
  readonly iconPath?: string;
}

export interface NeuralResolvedOption<TValue = unknown, TOption = unknown> {
  readonly id: string;
  readonly label: string;
  readonly value: TValue;
  readonly disabled: boolean;
  readonly group: string;
  readonly iconClass: string;
  readonly source: TOption;
  readonly index: number;
}

export interface NeuralVirtualRange {
  readonly start: number;
  readonly end: number;
  readonly offsetBefore: number;
  readonly offsetAfter: number;
  readonly totalSize: number;
}

export interface NeuralVirtualRangeOptions {
  readonly itemCount: number;
  readonly itemSize: number;
  readonly viewportSize: number;
  readonly scrollOffset: number;
  readonly overscan?: number;
}

export function readNeuralOptionPath(source: unknown, path: string): unknown {
  const normalized = path.trim();
  if (!normalized) return source;
  return normalized.split('.').reduce<unknown>((value, key) => {
    if (
      value == null ||
      (typeof value !== 'object' && typeof value !== 'function')
    ) {
      return undefined;
    }
    return (value as Record<string, unknown>)[key];
  }, source);
}

export function resolveNeuralOption<TValue = unknown, TOption = unknown>(
  option: TOption,
  index: number,
  config: NeuralOptionSourceConfig,
): NeuralResolvedOption<TValue, TOption> {
  const label = readNeuralOptionPath(option, config.labelPath ?? 'label');
  const value = readNeuralOptionPath(option, config.valuePath ?? 'value');
  return {
    id: `${config.idPrefix}-${index}`,
    label: String(label ?? option),
    value: (value ?? option) as TValue,
    disabled: Boolean(
      readNeuralOptionPath(option, config.disabledPath ?? 'disabled'),
    ),
    group: config.groupPath?.trim()
      ? String(readNeuralOptionPath(option, config.groupPath) ?? '')
      : '',
    iconClass: config.iconPath?.trim()
      ? String(readNeuralOptionPath(option, config.iconPath) ?? '')
      : '',
    source: option,
    index,
  };
}

export function normalizeNeuralOptionText(value: unknown, locale = ''): string {
  const text = String(value ?? '').trim();
  return locale ? text.toLocaleLowerCase(locale) : text.toLocaleLowerCase();
}

export function matchesNeuralOption<TOption>(
  option: TOption,
  fallbackLabel: string,
  query: string,
  paths: string | readonly string[],
  mode: NeuralOptionFilterMode = 'contains',
  locale = '',
): boolean {
  const normalizedQuery = normalizeNeuralOptionText(query, locale);
  if (!normalizedQuery) return true;
  const normalizedPaths: readonly string[] = (
    typeof paths === 'string' ? paths.split(',') : paths
  )
    .map((path) => path.trim())
    .filter(Boolean);
  const values = normalizedPaths.length
    ? normalizedPaths.map((path) => readNeuralOptionPath(option, path))
    : [fallbackLabel];
  return values.some((value) => {
    const candidate = normalizeNeuralOptionText(value, locale);
    if (mode === 'startsWith') return candidate.startsWith(normalizedQuery);
    if (mode === 'endsWith') return candidate.endsWith(normalizedQuery);
    return candidate.includes(normalizedQuery);
  });
}

export function findNextEnabledOption(
  options: readonly { readonly disabled: boolean }[],
  currentIndex: number,
  direction: 1 | -1,
  wrap = true,
): number {
  if (!options.length) return -1;
  let index = currentIndex;
  for (let count = 0; count < options.length; count += 1) {
    index += direction;
    if (wrap) index = (index + options.length) % options.length;
    else if (index < 0 || index >= options.length) return -1;
    if (!options[index]?.disabled) return index;
  }
  return -1;
}

export function findNeuralTypeaheadOption(
  options: readonly { readonly label: string; readonly disabled: boolean }[],
  query: string,
  locale = '',
): number {
  const normalized = normalizeNeuralOptionText(query, locale);
  return options.findIndex(
    (option) =>
      !option.disabled &&
      normalizeNeuralOptionText(option.label, locale).startsWith(normalized),
  );
}

export class NeuralTypeaheadController {
  private query = '';
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly timeout = 500) {}

  push(
    key: string,
    options: readonly { readonly label: string; readonly disabled: boolean }[],
    locale = '',
  ): number {
    this.query += normalizeNeuralOptionText(key, locale);
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.reset(), Math.max(0, this.timeout));
    return findNeuralTypeaheadOption(options, this.query, locale);
  }

  reset(): void {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
    this.query = '';
  }

  destroy(): void {
    this.reset();
  }
}

export function resolveNeuralVirtualRange(
  options: NeuralVirtualRangeOptions,
): NeuralVirtualRange {
  const itemCount = Math.max(0, Math.floor(options.itemCount));
  const itemSize = Math.max(1, options.itemSize);
  const viewportSize = Math.max(itemSize, options.viewportSize);
  const overscan = Math.max(0, Math.floor(options.overscan ?? 3));
  const maximumOffset = Math.max(0, itemCount * itemSize - viewportSize);
  const scrollOffset = Math.min(
    maximumOffset,
    Math.max(0, options.scrollOffset),
  );
  const firstVisible = Math.floor(scrollOffset / itemSize);
  const visibleCount = Math.ceil(viewportSize / itemSize);
  const start = Math.max(0, firstVisible - overscan);
  const end = Math.min(itemCount, firstVisible + visibleCount + overscan);
  return {
    start,
    end,
    offsetBefore: start * itemSize,
    offsetAfter: Math.max(0, (itemCount - end) * itemSize),
    totalSize: itemCount * itemSize,
  };
}
