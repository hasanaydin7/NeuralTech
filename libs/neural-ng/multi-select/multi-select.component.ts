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
  NeuralTypeaheadController,
  findNextEnabledOption,
  matchesNeuralOption,
  resolveNeuralOption,
  resolveNeuralVirtualRange,
} from '@neural-ng/core';
import { PopoverComponent } from '@neural-ng/core/popover';
import {
  NeuralMultiSelectEmptyTemplate,
  NeuralMultiSelectFooterTemplate,
  NeuralMultiSelectGroupTemplate,
  NeuralMultiSelectHeaderTemplate,
  NeuralMultiSelectLoadingTemplate,
  NeuralMultiSelectOptionTemplate,
  NeuralMultiSelectValueTemplate,
  type NeuralMultiSelectGroupTemplateContext,
  type NeuralMultiSelectOptionTemplateContext,
  type NeuralMultiSelectValueTemplateContext,
} from './multi-select-templates';
import type {
  NeuralMultiSelectChange,
  NeuralMultiSelectClasses,
  NeuralMultiSelectClearEvent,
  NeuralMultiSelectDataMode,
  NeuralMultiSelectDisplay,
  NeuralMultiSelectFilterEvent,
  NeuralMultiSelectFilterMode,
  NeuralMultiSelectInteractionSource,
  NeuralMultiSelectItemEvent,
  NeuralMultiSelectSelectAllEvent,
  NeuralResolvedMultiSelectOption,
} from './multi-select.types';

@Injectable({ providedIn: 'root' })
class NeuralMultiSelectIdGenerator {
  private readonly appId = inject(APP_ID);
  private nextId = 0;
  next(): string {
    return `${this.appId}-neural-multi-select-${this.nextId++}`;
  }
}

@Component({
  selector: 'neural-multi-select',
  standalone: true,
  imports: [NgTemplateOutlet, PopoverComponent],
  templateUrl: './multi-select.component.html',
  styleUrl: './multi-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neural-multi-select-host',
    '[class.neural-multi-select-host-fluid]': 'effectiveFluid()',
  },
})
export class NeuralMultiSelect<TOption = unknown, TValue = TOption>
  implements FormValueControl<readonly TValue[]>
{
  private readonly config = inject(NEURAL_NG_CONFIG);
  private readonly locale = inject(NeuralLocaleService);
  protected readonly field = inject(NEURAL_FIELD_CONTEXT, { optional: true });
  private readonly generatedId = inject(NeuralMultiSelectIdGenerator).next();
  private readonly popover =
    viewChild.required<PopoverComponent>('optionsPopover');
  private readonly anchor =
    viewChild.required<ElementRef<HTMLElement>>('anchor');
  private readonly filterElement =
    viewChild<ElementRef<HTMLInputElement>>('filterElement');
  private readonly listElement =
    viewChild<ElementRef<HTMLElement>>('listElement');
  private readonly typeahead = new NeuralTypeaheadController(500);

  readonly optionTemplate = contentChild(NeuralMultiSelectOptionTemplate);
  readonly valueTemplate = contentChild(NeuralMultiSelectValueTemplate);
  readonly groupTemplate = contentChild(NeuralMultiSelectGroupTemplate);
  readonly headerTemplate = contentChild(NeuralMultiSelectHeaderTemplate);
  readonly footerTemplate = contentChild(NeuralMultiSelectFooterTemplate);
  readonly emptyTemplate = contentChild(NeuralMultiSelectEmptyTemplate);
  readonly loadingTemplate = contentChild(NeuralMultiSelectLoadingTemplate);

  readonly options = input<readonly TOption[]>([]);
  readonly optionLabel = input('label');
  readonly optionValue = input('value');
  readonly optionDisabled = input('disabled');
  readonly optionGroup = input('');
  readonly value = model<readonly TValue[]>([]);
  readonly filterValue = model('');
  readonly display = input<NeuralMultiSelectDisplay>('chip');
  readonly dataMode = input<NeuralMultiSelectDataMode>('local');
  readonly filterMode = input<NeuralMultiSelectFilterMode>('contains');
  readonly filterBy = input('');
  readonly filterLocale = input('');
  readonly filter = input(true, { transform: booleanAttribute });
  readonly showToggleAll = input(true, { transform: booleanAttribute });
  readonly clearable = input(true, { transform: booleanAttribute });
  readonly closeOnSelect = input(false, { transform: booleanAttribute });
  readonly selectionLimit = input(0, { transform: numberAttribute });
  readonly maxSelectedLabels = input(3, { transform: numberAttribute });
  readonly filterDelay = input(150, { transform: numberAttribute });
  readonly virtualScroll = input(false, { transform: booleanAttribute });
  readonly virtualItemSize = input(42, { transform: numberAttribute });
  readonly virtualScrollHeight = input(256, { transform: numberAttribute });
  readonly virtualOverscan = input(3, { transform: numberAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly pending = input(false, { transform: booleanAttribute });
  readonly touched = input(false, { transform: booleanAttribute });
  readonly dirty = input(false, { transform: booleanAttribute });
  readonly fluid = input(false, { transform: booleanAttribute });
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly placeholder = input('');
  readonly filterPlaceholder = input('');
  readonly emptyLabel = input('');
  readonly loadingLabel = input('');
  readonly selectedItemsLabel = input('');
  readonly selectAllLabel = input('');
  readonly clearLabel = input('');
  readonly dropdownLabel = input('');
  readonly removeLabel = input('');
  readonly ariaLabel = input('');
  readonly multiSelectId = input('');
  readonly name = input('');
  readonly dropdownIconClass = input('nt-chevron-down');
  readonly clearIconClass = input('nt-x');
  readonly removeIconClass = input('nt-x');
  readonly searchIconClass = input('nt-search');
  readonly checkIconClass = input('nt-check');
  readonly loadingIconClass = input('nt-loader-3 nt-spin');
  readonly multiSelectClass = input('');
  readonly classes = input<NeuralMultiSelectClasses>({});
  readonly compareWith = input<(first: TValue, second: TValue) => boolean>(
    Object.is,
  );

  readonly selectionChange = output<NeuralMultiSelectChange<TValue, TOption>>();
  readonly selected = output<NeuralMultiSelectItemEvent<TValue, TOption>>();
  readonly removed = output<NeuralMultiSelectItemEvent<TValue, TOption>>();
  readonly cleared = output<NeuralMultiSelectClearEvent<TValue>>();
  readonly selectAllChange = output<NeuralMultiSelectSelectAllEvent<TValue>>();
  readonly filterChange = output<NeuralMultiSelectFilterEvent>();
  readonly opened = output<void>();
  readonly closed = output<void>();
  readonly touch = output<void>();

  readonly open = signal(false);
  readonly activeIndex = signal(-1);
  readonly requestId = signal(0);
  readonly virtualScrollTop = signal(0);
  readonly listboxId = `${this.generatedId}-listbox`;
  private filterTimer: ReturnType<typeof setTimeout> | undefined;

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
      this.multiSelectId().trim() ||
      this.generatedId,
  );
  readonly resolvedPlaceholder = computed(
    () => this.placeholder() || this.locale.messages().multiSelect.placeholder,
  );
  readonly resolvedFilterPlaceholder = computed(
    () =>
      this.filterPlaceholder() ||
      this.locale.messages().multiSelect.filterPlaceholder,
  );
  readonly resolvedEmptyLabel = computed(
    () => this.emptyLabel() || this.locale.messages().multiSelect.empty,
  );
  readonly resolvedLoadingLabel = computed(
    () => this.loadingLabel() || this.locale.messages().multiSelect.loading,
  );
  readonly resolvedSelectedItemsLabel = computed(
    () =>
      this.selectedItemsLabel() ||
      this.locale.messages().multiSelect.selectedItems,
  );
  readonly resolvedSelectAllLabel = computed(
    () => this.selectAllLabel() || this.locale.messages().multiSelect.selectAll,
  );
  readonly resolvedClearLabel = computed(
    () => this.clearLabel() || this.locale.messages().multiSelect.clear,
  );
  readonly resolvedDropdownLabel = computed(
    () => this.dropdownLabel() || this.locale.messages().multiSelect.dropdown,
  );
  readonly resolvedRemoveLabel = computed(
    () => this.removeLabel() || this.locale.messages().multiSelect.remove,
  );
  readonly currentValue = computed<readonly TValue[]>(() => {
    const value = this.value();
    return Array.isArray(value) ? value : [];
  });
  readonly resolvedOptions = computed<
    readonly NeuralResolvedMultiSelectOption<TValue, TOption>[]
  >(() =>
    this.options().map((option, index) => this.resolveOption(option, index)),
  );
  readonly visibleOptions = computed(() => {
    const source = this.resolvedOptions();
    if (this.dataMode() === 'remote') return source;
    const query = this.filterValue();
    if (!query) return source;
    return source.filter((option) =>
      matchesNeuralOption(
        option.source,
        option.label,
        query,
        this.filterBy(),
        this.filterMode(),
        this.filterLocale(),
      ),
    );
  });
  readonly effectiveVirtualScroll = computed(
    () =>
      this.virtualScroll() &&
      !this.optionGroup().trim() &&
      this.visibleOptions().length > 0,
  );
  readonly virtualRange = computed(() =>
    resolveNeuralVirtualRange({
      itemCount: this.visibleOptions().length,
      itemSize: this.virtualItemSize(),
      viewportSize: this.virtualScrollHeight(),
      scrollOffset: this.virtualScrollTop(),
      overscan: this.virtualOverscan(),
    }),
  );
  readonly renderedOptions = computed(() => {
    const options = this.visibleOptions();
    if (!this.effectiveVirtualScroll()) {
      return options.map((option, index) => ({ option, index }));
    }
    const range = this.virtualRange();
    return options
      .slice(range.start, range.end)
      .map((option, offset) => ({ option, index: range.start + offset }));
  });
  readonly selectedOptions = computed(() =>
    this.currentValue()
      .map((value) =>
        this.resolvedOptions().find((option) =>
          this.compareWith()(option.value, value),
        ),
      )
      .filter(
        (option): option is NeuralResolvedMultiSelectOption<TValue, TOption> =>
          !!option,
      ),
  );
  readonly selectedLabels = computed(() =>
    this.selectedOptions().map((option) => option.label),
  );
  readonly summaryLabel = computed(() => {
    const labels = this.selectedLabels();
    const max = Math.max(0, this.maxSelectedLabels());
    if (!max || labels.length <= max) return labels.join(', ');
    return this.resolvedSelectedItemsLabel().replace(
      '{count}',
      String(labels.length),
    );
  });
  readonly allVisibleSelected = computed(() => {
    const enabled = this.visibleOptions().filter((option) => !option.disabled);
    return (
      enabled.length > 0 && enabled.every((option) => this.isSelected(option))
    );
  });
  readonly someVisibleSelected = computed(
    () =>
      !this.allVisibleSelected() &&
      this.visibleOptions().some(
        (option) => !option.disabled && this.isSelected(option),
      ),
  );
  readonly activeDescendant = computed(() =>
    this.open()
      ? (this.visibleOptions()[this.activeIndex()]?.id ?? null)
      : null,
  );

  readonly rootClass = computed(() =>
    this.compose(
      'neural-multi-select-root',
      'neural-multi-select-base',
      this.multiSelectClass(),
      this.classes().root,
    ),
  );
  readonly triggerClass = computed(() =>
    this.compose(
      'neural-multi-select-trigger-root',
      'neural-multi-select-trigger-base',
      this.classes().trigger,
    ),
  );
  readonly panelClass = computed(() =>
    this.compose(
      'neural-multi-select-panel-root',
      'neural-multi-select-panel-base',
      this.classes().panel,
    ),
  );
  readonly listClass = computed(() =>
    this.compose(
      'neural-multi-select-list-root',
      'neural-multi-select-list-base',
      this.classes().list,
    ),
  );
  readonly filterClass = computed(() =>
    this.compose(
      'neural-multi-select-filter-root',
      'neural-multi-select-filter-base',
      this.classes().filter,
    ),
  );
  readonly headerClass = computed(() =>
    this.compose(
      'neural-multi-select-header-root',
      'neural-multi-select-header-base',
      this.classes().header,
    ),
  );

  constructor() {
    effect(() => {
      if (this.effectiveDisabled() && this.open()) this.closePanel(false);
    });
    inject(DestroyRef).onDestroy(() => {
      this.cancelFilter();
      this.typeahead.destroy();
    });
  }

  togglePanel(event?: Event): void {
    event?.preventDefault();
    if (this.effectiveDisabled()) return;
    if (this.open()) this.closePanel();
    else this.openPanel();
  }
  openPanel(): void {
    if (this.effectiveDisabled()) return;
    const selectedIndex = this.visibleOptions().findIndex(
      (option) => this.isSelected(option) && !option.disabled,
    );
    this.setActiveIndex(
      selectedIndex >= 0 ? selectedIndex : this.nextEnabled(-1, 1),
    );
    this.popover().showFor(this.anchor().nativeElement);
  }
  closePanel(restoreFocus = true): void {
    this.popover().hide('api', restoreFocus);
  }
  handleOpened(): void {
    this.open.set(true);
    this.opened.emit();
    if (this.filter())
      queueMicrotask(() =>
        this.filterElement()?.nativeElement.focus({ preventScroll: true }),
      );
  }
  handleClosed(): void {
    const wasOpen = this.open();
    this.open.set(false);
    this.activeIndex.set(-1);
    this.touch.emit();
    if (wasOpen) this.closed.emit();
  }
  handleTriggerBlur(): void {
    if (!this.open()) this.touch.emit();
  }
  focus(options?: FocusOptions): void {
    this.anchor().nativeElement.focus(options);
  }
  reset(): void {
    this.closePanel(false);
    this.filterValue.set('');
    this.commitValue([]);
  }
  handleTriggerKeydown(event: KeyboardEvent): void {
    if (this.effectiveDisabled()) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.open()) this.openPanel();
      this.moveActive(event.key === 'ArrowDown' ? 1 : -1);
    } else if ((event.key === 'Enter' || event.key === ' ') && !this.open()) {
      event.preventDefault();
      this.openPanel();
    } else if (event.key === 'Escape' && this.open()) {
      event.preventDefault();
      this.closePanel();
    }
  }
  handlePanelKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveActive(event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      this.setActiveIndex(
        this.nextEnabled(
          event.key === 'Home' ? -1 : 0,
          event.key === 'Home' ? 1 : -1,
        ),
      );
    } else if (event.key === 'Enter' || event.key === ' ') {
      const option = this.visibleOptions()[this.activeIndex()];
      if (option) {
        event.preventDefault();
        this.toggleOption(option, 'keyboard');
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.closePanel();
    } else if (
      !this.filter() &&
      event.key.length === 1 &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey
    ) {
      const index = this.typeahead.push(
        event.key,
        this.visibleOptions(),
        this.filterLocale(),
      );
      if (index >= 0) this.setActiveIndex(index);
    }
  }
  updateFilter(event: Event): void {
    this.filterValue.set((event.target as HTMLInputElement).value);
    this.resetVirtualScroll();
    this.setActiveIndex(this.nextEnabled(-1, 1));
    this.cancelFilter();
    const emit = () => {
      const requestId = this.requestId() + 1;
      this.requestId.set(requestId);
      this.filterChange.emit({ query: this.filterValue(), requestId });
    };
    const delay = Math.max(0, this.filterDelay());
    if (delay) this.filterTimer = setTimeout(emit, delay);
    else emit();
  }
  toggleOption(
    option: NeuralResolvedMultiSelectOption<TValue, TOption>,
    source: NeuralMultiSelectInteractionSource,
  ): void {
    if (option.disabled || this.effectiveDisabled() || this.effectiveReadonly())
      return;
    const previousValue = [...this.currentValue()];
    const selected = this.isSelected(option);
    if (
      !selected &&
      this.selectionLimit() > 0 &&
      previousValue.length >= this.selectionLimit()
    )
      return;
    const next = selected
      ? previousValue.filter(
          (value) => !this.compareWith()(option.value, value),
        )
      : [...previousValue, option.value];
    this.commitValue(next);
    const event = {
      value: option.value,
      values: next,
      option: option.source,
      source,
    };
    (selected ? this.removed : this.selected).emit(event);
    this.selectionChange.emit({
      value: next,
      previousValue,
      option: option.source,
      source,
    });
    if (this.closeOnSelect()) this.closePanel();
  }
  removeOption(
    option: NeuralResolvedMultiSelectOption<TValue, TOption>,
    event: Event,
  ): void {
    event.preventDefault();
    event.stopPropagation();
    this.toggleOption(option, 'pointer');
  }
  clear(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (
      this.effectiveDisabled() ||
      this.effectiveReadonly() ||
      !this.currentValue().length
    )
      return;
    const previousValue = [...this.currentValue()];
    this.commitValue([]);
    this.selectionChange.emit({
      value: [],
      previousValue,
      option: null,
      source: event ? 'pointer' : 'api',
    });
    this.cleared.emit({ previousValue });
  }
  toggleAll(event?: Event): void {
    event?.preventDefault();
    if (this.effectiveDisabled() || this.effectiveReadonly()) return;
    const previousValue = [...this.currentValue()];
    const visible = this.visibleOptions().filter((option) => !option.disabled);
    let next: readonly TValue[];
    if (this.allVisibleSelected()) {
      next = previousValue.filter(
        (value) =>
          !visible.some((option) => this.compareWith()(option.value, value)),
      );
    } else {
      const missing = visible.filter(
        (option) =>
          !previousValue.some((value) =>
            this.compareWith()(option.value, value),
          ),
      );
      const room =
        this.selectionLimit() > 0
          ? Math.max(0, this.selectionLimit() - previousValue.length)
          : missing.length;
      next = [
        ...previousValue,
        ...missing.slice(0, room).map((option) => option.value),
      ];
    }
    this.commitValue(next);
    this.selectionChange.emit({
      value: next,
      previousValue,
      option: null,
      source: event ? 'pointer' : 'api',
    });
    this.selectAllChange.emit({
      checked: this.allVisibleSelected(),
      value: next,
    });
  }
  activate(index: number): void {
    if (!this.visibleOptions()[index]?.disabled) this.activeIndex.set(index);
  }
  handleVirtualScroll(event: Event): void {
    if (!this.effectiveVirtualScroll()) return;
    this.virtualScrollTop.set((event.currentTarget as HTMLElement).scrollTop);
  }
  isSelected(
    option: NeuralResolvedMultiSelectOption<TValue, TOption>,
  ): boolean {
    return this.currentValue().some((value) =>
      this.compareWith()(option.value, value),
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
    option: NeuralResolvedMultiSelectOption<TValue, TOption>,
    index: number,
  ): string {
    return this.compose(
      'neural-multi-select-option-root',
      [
        'neural-multi-select-option-base',
        index === this.activeIndex()
          ? 'neural-multi-select-option-active-base'
          : '',
        this.isSelected(option)
          ? 'neural-multi-select-option-selected-base'
          : '',
        option.disabled ? 'neural-multi-select-option-disabled-base' : '',
      ].join(' '),
      this.classes().option,
      index === this.activeIndex() ? this.classes().activeOption : '',
      this.isSelected(option) ? this.classes().selectedOption : '',
      option.disabled ? this.classes().disabledOption : '',
    );
  }
  optionTemplateContext(
    option: NeuralResolvedMultiSelectOption<TValue, TOption>,
    index: number,
  ): NeuralMultiSelectOptionTemplateContext<TValue, TOption> {
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
  valueTemplateContext(): NeuralMultiSelectValueTemplateContext<TValue> {
    return {
      $implicit: this.currentValue(),
      value: this.currentValue(),
      labels: this.selectedLabels(),
    };
  }
  groupTemplateContext(group: string): NeuralMultiSelectGroupTemplateContext {
    return { $implicit: group, group };
  }
  replaceLabel(pattern: string, label: string): string {
    return pattern.replace('{label}', label);
  }
  iconClass(icon: string): string {
    return this.compose(`nt ${icon}`, '', this.classes().icon);
  }

  classFor(
    slot: keyof NeuralMultiSelectClasses,
    root: string,
    base: string,
  ): string {
    return this.compose(root, base, this.classes()[slot]);
  }

  private moveActive(direction: 1 | -1): void {
    this.setActiveIndex(this.nextEnabled(this.activeIndex(), direction));
  }
  private commitValue(value: readonly TValue[]): void {
    this.value.set(value);
  }
  private nextEnabled(start: number, direction: 1 | -1): number {
    return findNextEnabledOption(this.visibleOptions(), start, direction);
  }
  private resolveOption(
    option: TOption,
    index: number,
  ): NeuralResolvedMultiSelectOption<TValue, TOption> {
    return resolveNeuralOption<TValue, TOption>(option, index, {
      idPrefix: `${this.generatedId}-option`,
      labelPath: this.optionLabel(),
      valuePath: this.optionValue(),
      disabledPath: this.optionDisabled(),
      groupPath: this.optionGroup(),
    });
  }
  private setActiveIndex(index: number): void {
    this.activeIndex.set(index);
    if (!this.effectiveVirtualScroll() || index < 0) return;
    queueMicrotask(() => {
      const list = this.listElement()?.nativeElement;
      if (!list) return;
      const itemSize = Math.max(1, this.virtualItemSize());
      const top = index * itemSize;
      const bottom = top + itemSize;
      if (top < list.scrollTop) list.scrollTop = top;
      else if (bottom > list.scrollTop + list.clientHeight) {
        list.scrollTop = bottom - list.clientHeight;
      }
      this.virtualScrollTop.set(list.scrollTop);
    });
  }
  private resetVirtualScroll(): void {
    this.virtualScrollTop.set(0);
    const list = this.listElement()?.nativeElement;
    if (list) list.scrollTop = 0;
  }
  private cancelFilter(): void {
    if (this.filterTimer !== undefined) {
      clearTimeout(this.filterTimer);
      this.filterTimer = undefined;
    }
  }
  private compose(
    root: string,
    base: string,
    ...consumer: Array<string | undefined>
  ): string {
    return [root, this.effectiveUnstyled() ? '' : base, ...consumer]
      .filter(Boolean)
      .join(' ');
  }
}

/** @deprecated Import and use `NeuralMultiSelect` instead. */
export { NeuralMultiSelect as MultiSelectComponent };
