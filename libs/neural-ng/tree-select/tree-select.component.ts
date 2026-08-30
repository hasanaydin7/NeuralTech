import { NgTemplateOutlet } from '@angular/common';
import {
  APP_ID,
  ChangeDetectionStrategy,
  Component,
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
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import {
  NEURAL_FIELD_CONTEXT,
  NEURAL_NG_CONFIG,
  readNeuralOptionPath,
} from '@neural-ng/core';
import { PopoverComponent } from '@neural-ng/core/popover';
import {
  NeuralTree,
  NeuralTreeNodeTemplate,
  mapNeuralTreeOptions,
  type NeuralTreeKey,
  type NeuralTreeNode,
  type NeuralTreeSelectionEvent,
  type NeuralTreeSelectionMode,
} from '@neural-ng/core/tree';
import {
  NeuralTreeSelectNodeTemplate,
  NeuralTreeSelectValueTemplate,
} from './tree-select-templates';
import type {
  NeuralTreeSelectChange,
  NeuralTreeSelectClasses,
  NeuralTreeSelectClear,
  NeuralTreeSelectFilterEvent,
  NeuralTreeSelectValue,
} from './tree-select.types';

@Injectable({ providedIn: 'root' })
class NeuralTreeSelectIdGenerator {
  private readonly appId = inject(APP_ID);
  private nextId = 0;
  next(): string {
    return `${this.appId}-neural-tree-select-${this.nextId++}`;
  }
}

@Component({
  selector: 'neural-tree-select',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    PopoverComponent,
    NeuralTree,
    NeuralTreeNodeTemplate,
  ],
  templateUrl: './tree-select.component.html',
  styleUrl: './tree-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neural-tree-select-host',
    '[class.neural-tree-select-host-fluid]': 'effectiveFluid()',
  },
})
export class NeuralTreeSelect<TOption = unknown, TValue = unknown>
  implements FormValueControl<NeuralTreeSelectValue<TValue>>
{
  private readonly config = inject(NEURAL_NG_CONFIG);
  protected readonly field = inject(NEURAL_FIELD_CONTEXT, { optional: true });
  private readonly generatedId = inject(NeuralTreeSelectIdGenerator).next();
  private readonly popover =
    viewChild.required<PopoverComponent>('treePopover');
  private readonly anchor =
    viewChild.required<ElementRef<HTMLElement>>('anchor');
  private readonly filterElement =
    viewChild<ElementRef<HTMLInputElement>>('filterElement');

  readonly nodeTemplate = contentChild(NeuralTreeSelectNodeTemplate<TOption>);
  readonly valueTemplate = contentChild(NeuralTreeSelectValueTemplate<TValue>);
  readonly options = input<readonly TOption[]>([]);
  readonly optionLabel = input('label');
  readonly optionValue = input('value');
  readonly optionKey = input('');
  readonly optionChildren = input('children');
  readonly optionDisabled = input('disabled');
  readonly optionIcon = input('iconClass');
  readonly value = model<NeuralTreeSelectValue<TValue>>(null);
  readonly expandedKeys = model<ReadonlySet<NeuralTreeKey>>(new Set());
  readonly filterValue = model('');
  readonly selectionMode = input<NeuralTreeSelectionMode>('single');
  readonly filter = input(true, { transform: booleanAttribute });
  readonly clearable = input(true, { transform: booleanAttribute });
  readonly closeOnSelect = input(true, { transform: booleanAttribute });
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
  readonly virtualScroll = input(false, { transform: booleanAttribute });
  readonly placeholder = input('Select an item');
  readonly filterPlaceholder = input('Filter nodes');
  readonly emptyLabel = input('No results found');
  readonly loadingLabel = input('Loading');
  readonly clearLabel = input('Clear selection');
  readonly dropdownLabel = input('Toggle tree');
  readonly ariaLabel = input('');
  readonly treeSelectId = input('');
  readonly treeSelectClass = input('');
  readonly classes = input<NeuralTreeSelectClasses>({});
  readonly compareWith = input<(first: TValue, second: TValue) => boolean>(
    Object.is,
  );

  readonly selectionChange = output<NeuralTreeSelectChange<TValue, TOption>>();
  readonly selected = output<NeuralTreeSelectChange<TValue, TOption>>();
  readonly unselected = output<NeuralTreeSelectChange<TValue, TOption>>();
  readonly cleared = output<NeuralTreeSelectClear<TValue>>();
  readonly filterChange = output<NeuralTreeSelectFilterEvent>();
  readonly opened = output<void>();
  readonly closed = output<void>();
  readonly touch = output<void>();
  readonly open = signal(false);
  readonly selectionKeys = signal<ReadonlySet<NeuralTreeKey>>(new Set());
  readonly panelId = `${this.generatedId}-panel`;
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
      this.field?.controlId() || this.treeSelectId().trim() || this.generatedId,
  );
  readonly nodes = computed<readonly NeuralTreeNode<TOption>[]>(() =>
    mapNeuralTreeOptions(this.options(), {
      optionLabel: this.optionLabel(),
      optionValue: this.optionValue(),
      optionKey: this.optionKey().trim() || this.optionValue(),
      optionChildren: this.optionChildren(),
      optionDisabled: this.optionDisabled(),
      optionIcon: this.optionIcon(),
    }),
  );
  readonly entries = computed(() => {
    const result: Array<{
      key: NeuralTreeKey;
      value: TValue;
      option: TOption;
      label: string;
    }> = [];
    const visit = (
      options: readonly TOption[],
      nodes: readonly NeuralTreeNode<TOption>[],
    ): void =>
      options.forEach((option, index) => {
        const node = nodes[index];
        result.push({
          key: node.key,
          value: readNeuralOptionPath(option, this.optionValue()) as TValue,
          option,
          label: node.label,
        });
        const children = readNeuralOptionPath(option, this.optionChildren());
        if (Array.isArray(children) && node.children)
          visit(children as readonly TOption[], node.children);
      });
    visit(this.options(), this.nodes());
    return result;
  });
  readonly selectedEntries = computed(() => {
    const values = this.valueArray();
    return this.entries().filter((entry) =>
      values.some((value) => this.compareWith()(entry.value, value)),
    );
  });
  readonly selectedLabels = computed(() =>
    this.selectedEntries().map((entry) => entry.label),
  );
  readonly hasValue = computed(() => this.selectedEntries().length > 0);
  readonly summaryLabel = computed(() => this.selectedLabels().join(', '));
  readonly rootClass = computed(() =>
    this.compose(
      'neural-tree-select-root',
      'neural-tree-select-base',
      this.treeSelectClass(),
      this.classes().root,
    ),
  );
  readonly triggerClass = computed(() =>
    this.compose(
      'neural-tree-select-trigger-root',
      'neural-tree-select-trigger-base',
      this.classes().trigger,
    ),
  );
  readonly blockTreeSelection = () => false;
  readonly panelClass = computed(() =>
    this.compose(
      'neural-tree-select-panel-root',
      'neural-tree-select-panel-base',
      this.classes().panel,
    ),
  );

  constructor() {
    effect(() =>
      this.selectionKeys.set(
        new Set(this.selectedEntries().map((entry) => entry.key)),
      ),
    );
    effect(() => {
      if (this.effectiveDisabled() && this.open()) this.closePanel(false);
    });
  }
  togglePanel(event?: Event): void {
    event?.preventDefault();
    if (this.effectiveDisabled()) return;
    if (this.open()) this.closePanel();
    else this.popover().showFor(this.anchor().nativeElement);
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
    this.commitValue(this.selectionMode() === 'single' ? null : []);
  }
  handleTriggerKeydown(event: KeyboardEvent): void {
    if (this.effectiveDisabled()) return;
    if (
      (event.key === 'Enter' ||
        event.key === ' ' ||
        event.key === 'ArrowDown') &&
      !this.open()
    ) {
      event.preventDefault();
      this.togglePanel();
    } else if (event.key === 'Escape' && this.open()) {
      event.preventDefault();
      this.closePanel();
    }
  }
  updateFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filterValue.set(value);
    this.filterChange.emit({ value });
  }
  handleTreeSelection(event: NeuralTreeSelectionEvent<TOption>): void {
    if (this.effectiveDisabled() || this.effectiveReadonly()) {
      this.syncSelectionKeys();
      return;
    }
    const previousValue = this.value();
    const entry = this.entries().find((item) => item.key === event.key);
    if (!entry) return;
    const selectedEntries = this.entries().filter((item) =>
      event.selectionKeys.has(item.key),
    );
    const nextValue: NeuralTreeSelectValue<TValue> =
      this.selectionMode() === 'single'
        ? event.selected
          ? entry.value
          : null
        : selectedEntries.map((item) => item.value);
    if (this.valuesEqual(previousValue, nextValue)) {
      this.syncSelectionKeys();
      if (
        this.selectionMode() === 'single' &&
        this.closeOnSelect() &&
        event.selected
      )
        this.closePanel();
      return;
    }
    this.commitValue(nextValue);
    const change: NeuralTreeSelectChange<TValue, TOption> = {
      value: nextValue,
      previousValue,
      option: entry.option,
      key: entry.key,
      selected: event.selected,
      mode: this.selectionMode(),
      source: event.nativeEvent.type.startsWith('key') ? 'keyboard' : 'pointer',
    };
    this.selectionChange.emit(change);
    if (event.selected) this.selected.emit(change);
    else this.unselected.emit(change);
    if (
      this.selectionMode() === 'single' &&
      this.closeOnSelect() &&
      event.selected
    )
      this.closePanel();
  }
  clear(event?: Event): void {
    event?.stopPropagation();
    if (
      this.effectiveDisabled() ||
      this.effectiveReadonly() ||
      !this.hasValue()
    )
      return;
    const previousValue = this.value();
    const nextValue = this.selectionMode() === 'single' ? null : [];
    this.commitValue(nextValue as NeuralTreeSelectValue<TValue>);
    this.cleared.emit({ previousValue });
  }
  remove(entryKey: NeuralTreeKey, event: Event): void {
    event.stopPropagation();
    if (this.effectiveDisabled() || this.effectiveReadonly()) return;
    const entry = this.entries().find((item) => item.key === entryKey);
    if (!entry || !this.selectionKeys().has(entryKey)) return;
    const previousValue = this.value();
    const nextValue = this.entries()
      .filter(
        (item) => this.selectionKeys().has(item.key) && item.key !== entryKey,
      )
      .map((item) => item.value);
    this.commitValue(nextValue);
    const change: NeuralTreeSelectChange<TValue, TOption> = {
      value: nextValue,
      previousValue,
      option: entry.option,
      key: entry.key,
      selected: false,
      mode: this.selectionMode(),
      source: 'pointer',
    };
    this.selectionChange.emit(change);
    this.unselected.emit(change);
  }
  valueTemplateContext() {
    return {
      $implicit: this.value(),
      value: this.value(),
      labels: this.selectedLabels(),
    };
  }
  classFor(
    slot: keyof NeuralTreeSelectClasses,
    root: string,
    base: string,
  ): string {
    return this.compose(root, base, this.classes()[slot]);
  }
  private valueArray(): readonly TValue[] {
    const value = this.value();
    if (value === null) return [];
    return Array.isArray(value)
      ? (value as readonly TValue[])
      : [value as TValue];
  }
  private commitValue(value: NeuralTreeSelectValue<TValue>): void {
    this.value.set(value);
  }
  private syncSelectionKeys(): void {
    this.selectionKeys.set(
      new Set(this.selectedEntries().map((entry) => entry.key)),
    );
  }
  private valuesEqual(
    first: NeuralTreeSelectValue<TValue>,
    second: NeuralTreeSelectValue<TValue>,
  ): boolean {
    if (this.selectionMode() === 'single') {
      if (first === null || second === null) return first === second;
      return this.compareWith()(first as TValue, second as TValue);
    }
    const firstValues = Array.isArray(first)
      ? (first as readonly TValue[])
      : [];
    const secondValues = Array.isArray(second)
      ? (second as readonly TValue[])
      : [];
    return (
      firstValues.length === secondValues.length &&
      firstValues.every((value, index) =>
        this.compareWith()(value, secondValues[index]!),
      )
    );
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

/** @deprecated Import `NeuralTreeSelect` instead. */
export { NeuralTreeSelect as TreeSelectComponent };
