import { NgTemplateOutlet } from '@angular/common';
import {
  APP_ID,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injectable,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import {
  NEURAL_FIELD_CONTEXT,
  NEURAL_NG_CONFIG,
  NeuralLocaleService,
} from '@neural-ng/core';
import { PopoverComponent } from '@neural-ng/core/popover';
import {
  NeuralAutoCompleteClearIconTemplate,
  NeuralAutoCompleteDropdownIconTemplate,
  NeuralAutoCompleteEmptyTemplate,
  NeuralAutoCompleteGroupTemplate,
  NeuralAutoCompleteLoadingTemplate,
  NeuralAutoCompleteOptionTemplate,
  type NeuralAutoCompleteGroupTemplateContext,
  type NeuralAutoCompleteIconTemplateContext,
  type NeuralAutoCompleteOptionTemplateContext,
} from './auto-complete-templates';
import type {
  NeuralAutoCompleteClasses,
  NeuralAutoCompleteClearEvent,
  NeuralAutoCompleteDataMode,
  NeuralAutoCompleteFilterMode,
  NeuralAutoCompleteInteractionSource,
  NeuralAutoCompleteInvalidInputEvent,
  NeuralAutoCompleteSearchEvent,
  NeuralAutoCompleteSearchReason,
  NeuralAutoCompleteSelectEvent,
  NeuralAutoCompleteValueMode,
  NeuralResolvedAutoCompleteOption,
} from './auto-complete.types';

@Injectable({ providedIn: 'root' })
class NeuralAutoCompleteIdGenerator {
  private readonly appId = inject(APP_ID);
  private nextId = 0;
  next(): string {
    return `${this.appId}-neural-auto-complete-${this.nextId++}`;
  }
}

@Component({
  selector: 'neural-auto-complete',
  standalone: true,
  imports: [NgTemplateOutlet, PopoverComponent],
  templateUrl: './auto-complete.component.html',
  styleUrl: './auto-complete.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neural-auto-complete-host',
    '[class.neural-auto-complete-host-fluid]': 'effectiveFluid()',
  },
})
export class NeuralAutoComplete<TOption = unknown, TValue = TOption>
  implements FormValueControl<TValue | string | null>
{
  private readonly config = inject(NEURAL_NG_CONFIG);
  private readonly locale = inject(NeuralLocaleService);
  protected readonly field = inject(NEURAL_FIELD_CONTEXT, { optional: true });
  private readonly generatedId = inject(NeuralAutoCompleteIdGenerator).next();
  private readonly popover =
    viewChild.required<PopoverComponent>('suggestionsPopover');
  private readonly anchor =
    viewChild.required<ElementRef<HTMLElement>>('anchor');
  private readonly inputElement =
    viewChild.required<ElementRef<HTMLInputElement>>('inputElement');
  readonly optionTemplate = contentChild(NeuralAutoCompleteOptionTemplate);
  readonly groupTemplate = contentChild(NeuralAutoCompleteGroupTemplate);
  readonly emptyTemplate = contentChild(NeuralAutoCompleteEmptyTemplate);
  readonly loadingTemplate = contentChild(NeuralAutoCompleteLoadingTemplate);
  readonly dropdownIconTemplate = contentChild(
    NeuralAutoCompleteDropdownIconTemplate,
  );
  readonly clearIconTemplate = contentChild(
    NeuralAutoCompleteClearIconTemplate,
  );

  readonly options = input<readonly TOption[]>([]);
  readonly optionLabel = input('label');
  readonly optionValue = input('value');
  readonly optionDisabled = input('disabled');
  readonly optionGroup = input('');
  readonly value = model<TValue | string | null>(null);
  readonly query = model('');
  readonly valueMode = input<NeuralAutoCompleteValueMode>('option');
  readonly dataMode = input<NeuralAutoCompleteDataMode>('local');
  readonly filterMode = input<NeuralAutoCompleteFilterMode>('contains');
  readonly filterBy = input('');
  readonly filterLocale = input('');
  readonly compareWith = input<
    (first: TValue | string, second: TValue | string | null) => boolean
  >(Object.is);
  readonly minLength = input<number | undefined, unknown>(1, {
    transform: (value) => numberAttribute(value),
  });
  readonly delay = input(250, { transform: numberAttribute });
  readonly limit = input(50, { transform: numberAttribute });
  readonly forceSelection = input(true, { transform: booleanAttribute });
  readonly completeOnFocus = input(false, { transform: booleanAttribute });
  readonly showDropdown = input(false, { transform: booleanAttribute });
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly pending = input(false, { transform: booleanAttribute });
  readonly touched = input(false, { transform: booleanAttribute });
  readonly dirty = input(false, { transform: booleanAttribute });
  readonly name = input('');
  readonly fluid = input(false, { transform: booleanAttribute });
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly placeholder = input('');
  readonly emptyLabel = input('');
  readonly loadingLabel = input('');
  readonly clearLabel = input('');
  readonly dropdownLabel = input('');
  readonly ariaLabel = input('');
  readonly autoCompleteId = input('');
  readonly autoComplete = input('off');
  readonly dropdownIconClass = input('nt-chevron-down');
  readonly clearIconClass = input('nt-x');
  readonly loadingIconClass = input('nt-loader-3 nt-spin');
  readonly autoCompleteClass = input('');
  readonly classes = input<NeuralAutoCompleteClasses>({});

  // `search` is the concise public semantic event; it is not a DOM SearchEvent.
  // eslint-disable-next-line @angular-eslint/no-output-native
  readonly search = output<NeuralAutoCompleteSearchEvent>();
  readonly selected = output<NeuralAutoCompleteSelectEvent<TValue, TOption>>();
  readonly cleared = output<NeuralAutoCompleteClearEvent<TValue>>();
  readonly opened = output<void>();
  readonly closed = output<void>();
  readonly invalidInput = output<NeuralAutoCompleteInvalidInputEvent>();
  readonly touch = output<void>();

  readonly open = signal(false);
  readonly activeIndex = signal(-1);
  readonly composing = signal(false);
  readonly requestId = signal(0);
  readonly listboxId = `${this.generatedId}-listbox`;
  private searchTimer: ReturnType<typeof setTimeout> | undefined;
  private suppressValueSync = false;

  readonly effectiveUnstyled = computed(
    () =>
      this.unstyled() ||
      this.field?.effectiveUnstyled() ||
      this.config.unstyled,
  );
  readonly effectiveFluid = computed(() => this.fluid() || this.field?.fluid());
  readonly effectiveDisabled = computed(
    () => this.disabled() || (this.field?.disabled() ?? false),
  );
  readonly effectiveReadonly = computed(
    () => this.readonly() || (this.field?.readonly() ?? false),
  );
  readonly effectiveRequired = computed(
    () => this.required() || (this.field?.required() ?? false),
  );
  readonly effectiveInvalid = computed(
    () => this.invalid() || (this.field?.invalid() ?? false),
  );
  readonly controlId = computed(
    () =>
      this.field?.controlId() ||
      this.autoCompleteId().trim() ||
      this.generatedId,
  );
  readonly resolvedPlaceholder = computed(
    () => this.placeholder() || this.locale.messages().autoComplete.placeholder,
  );
  readonly resolvedEmptyLabel = computed(
    () => this.emptyLabel() || this.locale.messages().autoComplete.empty,
  );
  readonly resolvedLoadingLabel = computed(
    () => this.loadingLabel() || this.locale.messages().autoComplete.loading,
  );
  readonly resolvedClearLabel = computed(
    () => this.clearLabel() || this.locale.messages().autoComplete.clear,
  );
  readonly resolvedDropdownLabel = computed(
    () => this.dropdownLabel() || this.locale.messages().autoComplete.dropdown,
  );
  readonly resolvedOptions = computed<
    readonly NeuralResolvedAutoCompleteOption<TValue, TOption>[]
  >(() =>
    this.options().map((option, index) => this.resolveOption(option, index)),
  );
  private readonly revealAllOptions = signal(false);
  readonly visibleOptions = computed(() => {
    const source = this.resolvedOptions();
    const maximum = Math.max(1, this.limit());
    if (this.dataMode() === 'remote' || this.revealAllOptions())
      return source.slice(0, maximum);
    const query = normalizeSearch(this.query(), this.filterLocale());
    if (!query) return source.slice(0, maximum);
    return source
      .filter((option) => this.matches(option, query))
      .slice(0, maximum);
  });
  readonly activeDescendant = computed(() =>
    this.open()
      ? (this.visibleOptions()[this.activeIndex()]?.id ?? null)
      : null,
  );

  readonly rootClass = computed(() =>
    this.compose(
      'neural-auto-complete-root',
      'neural-auto-complete-base',
      this.autoCompleteClass(),
      this.classes().root,
    ),
  );
  readonly inputGroupClass = computed(() =>
    this.compose(
      'neural-auto-complete-input-group-root',
      'neural-auto-complete-input-group-base',
      this.classes().inputGroup,
    ),
  );
  readonly inputClass = computed(() =>
    this.compose(
      'neural-auto-complete-input-root',
      'neural-auto-complete-input-base',
      this.classes().input,
    ),
  );
  readonly clearButtonClass = computed(() =>
    this.compose(
      'neural-auto-complete-clear-root',
      'neural-auto-complete-clear-base',
      this.classes().clearButton,
    ),
  );
  readonly dropdownButtonClass = computed(() =>
    this.compose(
      'neural-auto-complete-dropdown-root',
      'neural-auto-complete-dropdown-base',
      this.classes().dropdownButton,
    ),
  );
  readonly loadingIndicatorClass = computed(() =>
    this.compose(
      'neural-auto-complete-loading-indicator-root',
      'neural-auto-complete-loading-indicator-base',
      this.classes().loadingIndicator,
    ),
  );
  readonly panelClass = computed(() =>
    this.compose(
      'neural-auto-complete-panel-root',
      'neural-auto-complete-panel-base',
      this.classes().panel,
    ),
  );
  readonly listClass = computed(() =>
    this.compose(
      'neural-auto-complete-list-root',
      'neural-auto-complete-list-base',
      this.classes().list,
    ),
  );
  readonly groupClass = computed(() =>
    this.compose(
      'neural-auto-complete-group-root',
      'neural-auto-complete-group-base',
      this.classes().group,
    ),
  );
  readonly emptyClass = computed(() =>
    this.compose(
      'neural-auto-complete-empty-root',
      'neural-auto-complete-empty-base',
      this.classes().emptyMessage,
    ),
  );
  readonly loadingClass = computed(() =>
    this.compose(
      'neural-auto-complete-loading-root',
      'neural-auto-complete-loading-base',
      this.classes().loadingMessage,
    ),
  );

  constructor() {
    effect(() => {
      if (this.effectiveDisabled() && this.open()) this.closePanel(false);
    });
    effect(() => {
      const value = this.value();
      if (this.suppressValueSync) return;
      if (this.valueMode() === 'text') {
        const next = typeof value === 'string' ? value : '';
        if (this.query() !== next) this.query.set(next);
        return;
      }
      if (value == null) return;
      const match = this.resolvedOptions().find((option) =>
        this.compareWith()(option.value, value),
      );
      if (match && this.query() !== match.label) this.query.set(match.label);
    });
    inject(DestroyRef).onDestroy(() => this.cancelSearch());
  }

  handleInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.effectiveDisabled() || this.effectiveReadonly()) {
      input.value = this.query();
      return;
    }
    const nextQuery = input.value;
    this.revealAllOptions.set(false);
    this.query.set(nextQuery);
    if (this.valueMode() === 'text') this.setValue(nextQuery);
    else if (this.value() !== null) this.setValue(null);
    if (!this.composing()) this.scheduleSearch('input');
  }

  handleCompositionEnd(event: CompositionEvent): void {
    this.composing.set(false);
    this.handleInput(event);
  }

  handleFocus(): void {
    if (this.completeOnFocus()) this.scheduleSearch('focus', true);
  }

  handleBlur(): void {
    this.touch.emit();
    if (
      !this.effectiveDisabled() &&
      !this.effectiveReadonly() &&
      this.forceSelection() &&
      this.valueMode() === 'option'
    ) {
      const normalizedQuery = normalizeSearch(
        this.query(),
        this.filterLocale(),
      );
      const exact = this.resolvedOptions().find(
        (option) =>
          normalizeSearch(option.label, this.filterLocale()) ===
            normalizedQuery && !option.disabled,
      );
      if (exact && !this.isSelected(exact)) {
        const previousValue = this.value();
        this.setValue(exact.value);
        this.selected.emit({
          value: exact.value,
          previousValue,
          option: exact.source,
          source: 'input',
        });
      }
      if (!exact && this.query()) {
        const invalidQuery = this.query();
        this.query.set('');
        this.setValue(null);
        this.invalidInput.emit({
          query: invalidQuery,
          reason: 'force-selection',
        });
      }
    }
    this.closePanel(false);
  }

  focus(options?: FocusOptions): void {
    this.inputElement().nativeElement.focus(options);
  }

  reset(): void {
    this.cancelSearch();
    this.query.set('');
    this.value.set(null);
    this.closePanel(false);
  }

  handleKeydown(event: KeyboardEvent): void {
    if (this.effectiveDisabled()) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.open()) {
        if (this.effectiveReadonly()) this.revealAllOptions.set(true);
        this.openPanel();
      }
      this.moveActive(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }
    if (event.key === 'Enter' && this.open()) {
      const option = this.visibleOptions()[this.activeIndex()];
      if (option) {
        event.preventDefault();
        this.selectOption(option, 'keyboard');
      }
      return;
    }
    if (event.key === 'Escape' && this.open()) {
      event.preventDefault();
      this.closePanel();
      return;
    }
    if (event.key === 'Tab') this.closePanel(false);
  }

  showAll(event: Event): void {
    event.preventDefault();
    if (this.effectiveDisabled()) return;
    this.revealAllOptions.set(true);
    this.inputElement().nativeElement.focus();
    this.emitSearch('dropdown', true);
  }

  clear(event?: Event): void {
    event?.preventDefault();
    if (this.effectiveDisabled() || this.effectiveReadonly()) return;
    const previousValue = this.value();
    const previousQuery = this.query();
    this.query.set('');
    this.setValue(null);
    this.closePanel(false);
    this.cleared.emit({ previousValue, previousQuery });
    this.inputElement().nativeElement.focus();
  }

  selectOption(
    option: NeuralResolvedAutoCompleteOption<TValue, TOption>,
    source: NeuralAutoCompleteInteractionSource,
  ): void {
    if (option.disabled || this.effectiveDisabled() || this.effectiveReadonly())
      return;
    const previousValue = this.value();
    const nextValue = this.valueMode() === 'text' ? option.label : option.value;
    if (this.isSelected(option)) {
      this.closePanel(false);
      this.inputElement().nativeElement.focus({ preventScroll: true });
      return;
    }
    this.query.set(option.label);
    this.setValue(nextValue);
    this.selected.emit({
      value: nextValue,
      previousValue,
      option: option.source,
      source,
    });
    this.closePanel(false);
    this.inputElement().nativeElement.focus({ preventScroll: true });
  }

  handleOptionPointerDown(
    event: PointerEvent,
    option: NeuralResolvedAutoCompleteOption<TValue, TOption>,
  ): void {
    event.preventDefault();
    this.selectOption(option, 'pointer');
  }

  activate(index: number): void {
    if (!this.visibleOptions()[index]?.disabled) this.activeIndex.set(index);
  }
  isSelected(
    option: NeuralResolvedAutoCompleteOption<TValue, TOption>,
  ): boolean {
    return (
      this.value() != null &&
      (this.valueMode() === 'text'
        ? option.label === this.value()
        : this.compareWith()(option.value, this.value()))
    );
  }
  showGroup(index: number): boolean {
    const option = this.visibleOptions()[index];
    return (
      !!option?.group &&
      (index === 0 || this.visibleOptions()[index - 1]?.group !== option.group)
    );
  }
  optionClass(
    option: NeuralResolvedAutoCompleteOption<TValue, TOption>,
    index: number,
  ): string {
    return this.compose(
      'neural-auto-complete-option-root',
      [
        'neural-auto-complete-option-base',
        index === this.activeIndex()
          ? 'neural-auto-complete-option-active-base'
          : '',
        this.isSelected(option)
          ? 'neural-auto-complete-option-selected-base'
          : '',
        option.disabled ? 'neural-auto-complete-option-disabled-base' : '',
      ].join(' '),
      this.classes().option,
      index === this.activeIndex() ? this.classes().activeOption : '',
      this.isSelected(option) ? this.classes().selectedOption : '',
      option.disabled ? this.classes().disabledOption : '',
    );
  }
  iconClass(className: string): string {
    return this.compose(`nt ${className}`, '', this.classes().icon);
  }
  optionTemplateContext(
    option: NeuralResolvedAutoCompleteOption<TValue, TOption>,
    index: number,
  ): NeuralAutoCompleteOptionTemplateContext<TValue, TOption> {
    return {
      $implicit: option.source,
      option: option.source,
      resolved: option,
      label: option.label,
      value: option.value,
      index,
      active: index === this.activeIndex(),
      selected: this.isSelected(option),
      disabled: option.disabled,
    };
  }
  groupTemplateContext(group: string): NeuralAutoCompleteGroupTemplateContext {
    return { $implicit: group, group };
  }
  iconTemplateContext(
    className: string,
  ): NeuralAutoCompleteIconTemplateContext {
    return { $implicit: className, className };
  }

  protected onOpened(): void {
    this.open.set(true);
    this.opened.emit();
  }
  protected onClosed(): void {
    const wasOpen = this.open();
    this.open.set(false);
    this.activeIndex.set(-1);
    this.revealAllOptions.set(false);
    if (wasOpen) this.closed.emit();
  }

  private scheduleSearch(
    reason: NeuralAutoCompleteSearchReason,
    ignoreMinLength = false,
  ): void {
    this.cancelSearch();
    if (
      !ignoreMinLength &&
      this.query().length < Math.max(0, this.minLength() ?? 1)
    ) {
      this.closePanel(false);
      return;
    }
    const wait = Math.max(0, this.delay());
    if (wait === 0) {
      this.emitSearch(reason, ignoreMinLength);
      return;
    }
    this.searchTimer = setTimeout(
      () => this.emitSearch(reason, ignoreMinLength),
      wait,
    );
  }
  private emitSearch(
    reason: NeuralAutoCompleteSearchReason,
    ignoreMinLength = false,
  ): void {
    this.cancelSearch();
    if (
      !ignoreMinLength &&
      this.query().length < Math.max(0, this.minLength() ?? 1)
    )
      return;
    const requestId = this.requestId() + 1;
    this.requestId.set(requestId);
    this.search.emit({ query: this.query(), requestId, reason });
    this.openPanel();
  }
  private openPanel(): void {
    if (this.effectiveDisabled()) return;
    this.activeIndex.set(this.nextEnabled(-1, 1));
    this.popover().showFor(this.anchor().nativeElement);
  }
  private closePanel(restoreFocus = false): void {
    this.popover().hide('api', restoreFocus);
    this.revealAllOptions.set(false);
  }
  private moveActive(direction: 1 | -1): void {
    this.activeIndex.set(this.nextEnabled(this.activeIndex(), direction));
  }
  private nextEnabled(start: number, direction: 1 | -1): number {
    const options = this.visibleOptions();
    if (!options.length) return -1;
    for (let step = 1; step <= options.length; step += 1) {
      const index =
        (start + direction * step + options.length) % options.length;
      if (!options[index]?.disabled) return index;
    }
    return -1;
  }
  private cancelSearch(): void {
    if (this.searchTimer !== undefined) {
      clearTimeout(this.searchTimer);
      this.searchTimer = undefined;
    }
  }
  private setValue(value: TValue | string | null): void {
    this.suppressValueSync = true;
    this.value.set(value);
    this.suppressValueSync = false;
  }
  private resolveOption(
    option: TOption,
    index: number,
  ): NeuralResolvedAutoCompleteOption<TValue, TOption> {
    const labelValue = readPath(option, this.optionLabel());
    const valuePath = this.optionValue().trim();
    const mappedValue = valuePath ? readPath(option, valuePath) : option;
    return {
      id: `${this.listboxId}-option-${index}`,
      label: labelValue == null ? String(option ?? '') : String(labelValue),
      value: (mappedValue === undefined ? option : mappedValue) as TValue,
      disabled: Boolean(readPath(option, this.optionDisabled())),
      group: this.optionGroup().trim()
        ? String(readPath(option, this.optionGroup()) ?? '')
        : '',
      source: option,
      index,
    };
  }
  private matches(
    option: NeuralResolvedAutoCompleteOption<TValue, TOption>,
    query: string,
  ): boolean {
    const keys = this.filterBy()
      .split(',')
      .map((key) => key.trim())
      .filter(Boolean);
    const candidates = keys.length
      ? keys.map((key) => readPath(option.source, key))
      : [option.label];
    return candidates.some((candidate) => {
      const value = normalizeSearch(
        String(candidate ?? ''),
        this.filterLocale(),
      );
      return this.filterMode() === 'startsWith'
        ? value.startsWith(query)
        : this.filterMode() === 'endsWith'
          ? value.endsWith(query)
          : value.includes(query);
    });
  }
  private compose(
    structural: string,
    visual: string,
    ...consumer: Array<string | undefined>
  ): string {
    return [structural, this.effectiveUnstyled() ? '' : visual, ...consumer]
      .filter(Boolean)
      .join(' ');
  }
}

/** @deprecated Import and use `NeuralAutoComplete` instead. */
export { NeuralAutoComplete as AutoCompleteComponent };

function readPath(source: unknown, path: string): unknown {
  const key = path.trim();
  if (!key) return source;
  return key
    .split('.')
    .reduce<unknown>(
      (value, segment) =>
        value != null && typeof value === 'object'
          ? (value as Record<string, unknown>)[segment]
          : undefined,
      source,
    );
}

function normalizeSearch(value: string, locale: string): string {
  const normalized = locale.trim()
    ? value.toLocaleLowerCase(locale.trim())
    : value.toLocaleLowerCase();
  return normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
