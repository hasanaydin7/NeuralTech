import { NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
import {
  APP_ID,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  Injectable,
  PLATFORM_ID,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  isDevMode,
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
  NeuralTypeaheadController,
  findNextEnabledOption,
  resolveNeuralOption,
  resolveNeuralVirtualRange,
} from '@neural-ng/core';
import {
  NeuralOverlayPositioner,
  type NeuralOverlayPositionRef,
} from '@neural-ng/core/overlay';
import { OptionComponent } from './option.component';
import type {
  NeuralResolvedSelectOption,
  NeuralSelectAppendTo,
  NeuralSelectChange,
  NeuralSelectClasses,
  NeuralSelectClear,
  NeuralSelectInteractionSource,
} from './select.types';

type PopoverElement = HTMLElement & {
  showPopover?: () => void;
  hidePopover?: () => void;
};

@Injectable({ providedIn: 'root' })
class NeuralSelectIdGenerator {
  private readonly appId = inject(APP_ID);
  private nextId = 0;

  next(): string {
    return `${this.appId}-neural-select-${this.nextId++}`;
  }
}

@Component({
  selector: 'neural-select',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neural-select-host',
    '[class.neural-select-host-fluid]': 'effectiveFluid()',
  },
  template: `
    <div
      [class]="rootClass()"
      [attr.data-open]="open() ? 'true' : null"
      [attr.data-disabled]="effectiveDisabled() ? 'true' : null"
      [attr.data-readonly]="effectiveReadonly() ? 'true' : null"
      [attr.data-invalid]="effectiveInvalid() ? 'true' : null"
      [attr.data-loading]="loading() ? 'true' : null"
    >
      <button
        #trigger
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        [id]="controlId()"
        [class]="triggerClass()"
        [disabled]="effectiveDisabled() || loading()"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-expanded]="open()"
        [attr.aria-controls]="listboxId"
        [attr.aria-activedescendant]="activeDescendant()"
        [attr.aria-describedby]="field?.controlDescribedBy()"
        [attr.aria-invalid]="effectiveInvalid() ? 'true' : null"
        [attr.aria-required]="effectiveRequired() ? 'true' : null"
        [attr.aria-readonly]="effectiveReadonly() ? 'true' : null"
        [attr.aria-busy]="
          loading() || pending() || field?.pending() ? 'true' : null
        "
        (click)="toggle()"
        (blur)="handleBlur()"
        (keydown)="handleKeydown($event)"
      >
        @if (loading()) {
          <span [class]="loadingMessageClass()">{{ loadingLabel() }}</span>
        } @else if (selectedOption(); as selected) {
          <span [class]="valueClass()">
            @if (selected.iconClass) {
              <i [class]="optionIconClass(selected)" aria-hidden="true"></i>
            }
            <span>{{ selected.label }}</span>
          </span>
        } @else {
          <span [class]="placeholderClass()">{{ placeholder() }}</span>
        }

        @if (loading()) {
          <i
            class="neural-select-spinner"
            [class]="loadingIconClass()"
            aria-hidden="true"
          ></i>
        } @else {
          <i
            class="neural-select-dropdown-icon"
            [class]="dropdownIconClass()"
            aria-hidden="true"
          ></i>
        }
      </button>

      @if (
        clearable() &&
        selectedOption() &&
        !effectiveDisabled() &&
        !effectiveReadonly() &&
        !loading()
      ) {
        <button
          type="button"
          [class]="clearButtonClass()"
          [attr.aria-label]="clearLabel()"
          (click)="clear($event)"
        >
          <i class="nt nt-x" aria-hidden="true"></i>
        </button>
      }

      @if (open()) {
        <div
          #panel
          [class]="panelClass()"
          [attr.popover]="appendTo() === 'body' ? 'manual' : null"
          [attr.data-neural-append-to]="appendTo()"
        >
          @if (loading()) {
            <div role="status" [class]="loadingMessageClass()">
              {{ loadingLabel() }}
            </div>
          } @else if (resolvedOptions().length === 0) {
            <div [class]="emptyMessageClass()">{{ emptyLabel() }}</div>
          } @else {
            <div
              #list
              role="listbox"
              [id]="listboxId"
              [class]="listClass()"
              [attr.aria-label]="ariaLabel() || null"
              [style.height.px]="virtualScroll() ? virtualScrollHeight() : null"
              (scroll)="handleVirtualScroll($event)"
            >
              @if (effectiveVirtualScroll()) {
                <div
                  class="neural-select-virtual-spacer"
                  [style.height.px]="virtualRange().offsetBefore"
                  aria-hidden="true"
                ></div>
              }
              @for (row of renderedOptions(); track row.option.id) {
                @let option = row.option;
                @let index = row.index;
                <div
                  role="option"
                  [id]="option.id"
                  [class]="optionClass(option, index)"
                  [style.height.px]="
                    effectiveVirtualScroll() ? virtualItemSize() : null
                  "
                  [style.min-height.px]="
                    effectiveVirtualScroll() ? virtualItemSize() : null
                  "
                  tabindex="-1"
                  [attr.aria-selected]="isSelected(option)"
                  [attr.aria-disabled]="option.disabled ? 'true' : null"
                  [attr.aria-posinset]="index + 1"
                  [attr.aria-setsize]="resolvedOptions().length"
                  (pointerenter)="activate(index)"
                  (pointerdown)="$event.preventDefault()"
                  (click)="select(option, 'pointer')"
                  (keydown.enter)="select(option, 'keyboard')"
                  (keydown.space)="select(option, 'keyboard')"
                >
                  @if (option.iconClass) {
                    <i [class]="optionIconClass(option)" aria-hidden="true"></i>
                  }
                  @if (option.template) {
                    <ng-container [ngTemplateOutlet]="option.template" />
                  } @else {
                    <span>{{ option.label }}</span>
                  }
                </div>
              }
              @if (effectiveVirtualScroll()) {
                <div
                  class="neural-select-virtual-spacer"
                  [style.height.px]="virtualRange().offsetAfter"
                  aria-hidden="true"
                ></div>
              }
            </div>
          }
        </div>
      }

      <ng-content />
    </div>
  `,
  styles: `
    :where(.neural-select-host) {
      display: inline-block;
      min-width: 0;
      max-width: 100%;
    }

    :where(.neural-select-host-fluid) {
      display: block;
      width: 100%;
    }

    :where(.neural-select-root) {
      position: relative;
      box-sizing: border-box;
      min-width: 0;
      max-width: 100%;
    }

    :where(.neural-select-trigger-root) {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      min-width: 0;
      text-align: start;
    }

    :where(.neural-select-value-root),
    :where(.neural-select-placeholder-root) {
      display: inline-flex;
      align-items: center;
      min-width: 0;
    }

    :where(.neural-select-panel-root) {
      position: absolute;
      z-index: var(--neural-select-z-index, 100);
      inset-block-start: calc(
        100% + var(--neural-select-panel-offset, 0.25rem)
      );
      inset-inline: 0;
      box-sizing: border-box;
      min-width: 100%;
    }

    :where(.neural-select-panel-root[popover]) {
      inset: auto;
      width: auto;
      max-width: calc(100vw - 1rem);
      margin: 0;
      padding: 0;
      overflow: visible;
      border: 0;
    }

    :where(.neural-select-list-root) {
      box-sizing: border-box;
      max-height: var(--neural-select-panel-max-height, 16rem);
      margin: 0;
      padding: 0;
      overflow-y: auto;
      overscroll-behavior: contain;
    }

    :where(.neural-select-option-root) {
      box-sizing: border-box;
      display: flex;
      align-items: center;
    }

    :where(.neural-select-base) {
      width: var(--neural-select-width, auto);
      color: var(--neural-select-color, inherit);
      font-family: var(--neural-select-font-family, inherit);
    }

    :where(.neural-select-fluid-base) {
      width: 100%;
    }

    :where(.neural-select-trigger-base) {
      gap: var(--neural-select-trigger-gap, 0.5rem);
      min-height: var(--neural-select-min-height, 2.5rem);
      padding: var(--neural-select-padding, 0.625rem 0.75rem);
      padding-inline-end: var(--neural-select-trigger-end-padding, 2.5rem);
      color: var(--neural-select-color, inherit);
      background: var(--neural-select-background, transparent);
      border: var(--neural-select-border, 1px solid currentColor);
      border-radius: var(--neural-select-radius, 0.5rem);
      box-shadow: var(--neural-select-shadow, none);
      font: inherit;
      font-size: var(--neural-select-font-size, 0.875rem);
      line-height: var(--neural-select-line-height, 1.25);
      transition: var(--neural-select-transition, none);
      cursor: pointer;
    }

    :where(.neural-select-trigger-base:hover:not(:disabled)) {
      background: var(
        --neural-select-background-hover,
        var(--neural-select-background, transparent)
      );
      border-color: var(--neural-select-border-color-hover, currentColor);
    }

    :where(.neural-select-trigger-base:focus-visible) {
      border-color: var(--neural-select-border-color-focus, currentColor);
      box-shadow: var(--neural-select-shadow-focus, none);
      outline: var(--neural-select-focus-ring, 2px solid currentColor);
      outline-offset: var(--neural-select-focus-ring-offset, 2px);
    }

    :where(
      .neural-select-root[data-invalid='true'] .neural-select-trigger-base
    ) {
      border-color: var(--neural-select-border-color-invalid, currentColor);
    }

    :where(.neural-select-trigger-base:disabled) {
      opacity: var(--neural-select-disabled-opacity, 0.5);
      cursor: not-allowed;
    }

    :where(
      .neural-select-root[data-readonly='true'] .neural-select-trigger-base
    ) {
      cursor: default;
    }

    :where(.neural-select-value-base) {
      gap: var(--neural-select-value-gap, 0.5rem);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    :where(.neural-select-placeholder-base) {
      color: var(--neural-select-placeholder-color, currentColor);
    }

    :where(.neural-select-dropdown-icon),
    :where(.neural-select-spinner) {
      position: absolute;
      inset-inline-end: 0.75rem;
      flex: 0 0 auto;
      pointer-events: none;
    }

    :where(.neural-select-clear-root) {
      position: absolute;
      inset-block-start: 50%;
      inset-inline-end: 2rem;
      display: inline-grid;
      place-items: center;
      transform: translateY(-50%);
    }

    :where(.neural-select-clear-base) {
      width: 1.5rem;
      height: 1.5rem;
      padding: 0;
      color: var(--neural-select-clear-color, inherit);
      background: var(--neural-select-clear-background, transparent);
      border: 0;
      border-radius: 50%;
      font: inherit;
      cursor: pointer;
    }

    :where(.neural-select-clear-base:focus-visible) {
      outline: var(--neural-select-focus-ring, 2px solid currentColor);
      outline-offset: 1px;
    }

    :where(.neural-select-panel-base) {
      padding: var(--neural-select-panel-padding, 0.25rem);
      color: var(--neural-select-panel-color, inherit);
      background: var(--neural-select-panel-background, Canvas);
      border: var(--neural-select-panel-border, 1px solid currentColor);
      border-radius: var(--neural-select-panel-radius, 0.5rem);
      box-shadow: var(--neural-select-panel-shadow, none);
    }

    :where(.neural-select-option-base) {
      gap: var(--neural-select-option-gap, 0.5rem);
      padding: var(--neural-select-option-padding, 0.625rem 0.75rem);
      color: var(--neural-select-option-color, inherit);
      background: var(--neural-select-option-background, transparent);
      border-radius: var(--neural-select-option-radius, 0.375rem);
      cursor: pointer;
    }

    :where(.neural-select-option-active-base) {
      color: var(--neural-select-option-color-active, inherit);
      background: var(--neural-select-option-background-active, transparent);
    }

    :where(.neural-select-option-selected-base) {
      color: var(--neural-select-option-color-selected, inherit);
      background: var(--neural-select-option-background-selected, transparent);
      font-weight: var(--neural-select-option-font-weight-selected, 600);
    }

    :where(.neural-select-option-disabled-base) {
      opacity: var(--neural-select-option-disabled-opacity, 0.5);
      cursor: not-allowed;
    }

    :where(
      .neural-select-root[data-readonly='true']
        .neural-select-option-root:not(.neural-select-option-disabled-base)
    ) {
      cursor: default;
    }

    :where(.neural-select-empty-base),
    :where(.neural-select-loading-base) {
      padding: var(--neural-select-message-padding, 0.75rem);
      color: var(--neural-select-message-color, inherit);
      text-align: center;
    }

    :where(.neural-select-virtual-spacer) {
      width: 1px;
      flex: 0 0 auto;
      pointer-events: none;
    }

    @media (prefers-reduced-motion: reduce) {
      :where(.neural-select-trigger-base) {
        transition-duration: 0.01ms !important;
      }
    }
  `,
})
export class NeuralSelect<TOption = unknown, TValue = unknown>
  implements FormValueControl<TValue | null>
{
  private readonly neuralConfig = inject(NEURAL_NG_CONFIG);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly generatedId = inject(NeuralSelectIdGenerator).next();
  private readonly platformId = inject(PLATFORM_ID);
  private readonly positioner = inject(NeuralOverlayPositioner);
  private positionRef: NeuralOverlayPositionRef | undefined;
  private readonly typeahead = new NeuralTypeaheadController(500);
  private warnedAboutMixedSources = false;

  protected readonly field = inject(NEURAL_FIELD_CONTEXT, { optional: true });
  protected readonly trigger =
    viewChild<ElementRef<HTMLButtonElement>>('trigger');
  protected readonly panel = viewChild<ElementRef<PopoverElement>>('panel');
  protected readonly list = viewChild<ElementRef<HTMLElement>>('list');

  readonly options = input<readonly TOption[]>([]);
  readonly optionLabel = input('label');
  readonly optionValue = input('value');
  readonly optionDisabled = input('disabled');
  readonly optionIcon = input('iconClass');
  readonly projectedOptions = contentChildren(OptionComponent);
  readonly value = model<TValue | null>(null);
  readonly compareWith = input<
    (first: TValue, second: TValue | null) => boolean
  >(Object.is);
  readonly placeholder = input('Select an option');
  readonly emptyLabel = input('No options available');
  readonly loadingLabel = input('Loading options');
  readonly clearLabel = input('Clear selection');
  readonly ariaLabel = input('');
  readonly selectId = input('');
  readonly iconClass = input('nt-chevron-down');
  readonly loadingIcon = input('nt-loader-3 nt-spin');
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly pending = input(false, { transform: booleanAttribute });
  readonly touched = input(false, { transform: booleanAttribute });
  readonly dirty = input(false, { transform: booleanAttribute });
  readonly name = input('');
  readonly loading = input(false, { transform: booleanAttribute });
  readonly virtualScroll = input(false, { transform: booleanAttribute });
  readonly virtualItemSize = input(42, { transform: numberAttribute });
  readonly virtualScrollHeight = input(256, { transform: numberAttribute });
  readonly virtualOverscan = input(3, { transform: numberAttribute });
  readonly fluid = input(false, { transform: booleanAttribute });
  readonly appendTo = input<NeuralSelectAppendTo>('self');
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly selectClass = input('');
  readonly classes = input<NeuralSelectClasses>({});

  readonly selectionChange = output<NeuralSelectChange<TValue, TOption>>();
  readonly cleared = output<NeuralSelectClear<TValue>>();
  readonly openChange = output<boolean>();
  readonly touch = output<void>();
  readonly open = signal(false);
  readonly activeIndex = signal(-1);
  readonly virtualScrollTop = signal(0);
  readonly listboxId = `${this.generatedId}-listbox`;

  readonly effectiveUnstyled = computed(
    () =>
      this.unstyled() ||
      this.field?.effectiveUnstyled() ||
      this.neuralConfig.unstyled,
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
    () => this.field?.controlId() || this.selectId() || this.generatedId,
  );
  readonly resolvedOptions = computed<
    readonly NeuralResolvedSelectOption<TValue, TOption>[]
  >(() => {
    const dataOptions = this.options();
    const projected = this.projectedOptions();

    if (dataOptions.length > 0 && projected.length > 0) {
      this.warnAboutMixedSources();
    }

    if (dataOptions.length > 0) {
      return dataOptions.map((option, index) =>
        this.resolveDataOption(option, index),
      );
    }

    return projected.map((option, index) => ({
      id: `${this.listboxId}-option-${index}`,
      label: option.label(),
      value: option.value() as TValue,
      disabled: option.disabled(),
      iconClass: option.iconClass(),
      source: option as TOption,
      template: option.content(),
    }));
  });
  readonly selectedOption = computed(
    () =>
      this.resolvedOptions().find((option) =>
        this.compareWith()(option.value, this.value()),
      ) ?? null,
  );
  readonly effectiveVirtualScroll = computed(
    () => this.virtualScroll() && this.resolvedOptions().length > 0,
  );
  readonly virtualRange = computed(() =>
    resolveNeuralVirtualRange({
      itemCount: this.resolvedOptions().length,
      itemSize: this.virtualItemSize(),
      viewportSize: this.virtualScrollHeight(),
      scrollOffset: this.virtualScrollTop(),
      overscan: this.virtualOverscan(),
    }),
  );
  readonly renderedOptions = computed(() => {
    const options = this.resolvedOptions();
    if (!this.effectiveVirtualScroll()) {
      return options.map((option, index) => ({ option, index }));
    }
    const range = this.virtualRange();
    return options
      .slice(range.start, range.end)
      .map((option, offset) => ({ option, index: range.start + offset }));
  });
  readonly activeDescendant = computed(() => {
    if (!this.open()) return null;
    return this.resolvedOptions()[this.activeIndex()]?.id ?? null;
  });

  readonly rootClass = computed(() =>
    this.composeClass(
      'neural-select-root',
      `neural-select-base ${this.effectiveFluid() ? 'neural-select-fluid-base' : ''}`,
      this.selectClass(),
      this.classes().root,
    ),
  );
  readonly triggerClass = computed(() =>
    this.composeClass(
      'neural-select-trigger-root',
      'neural-select-trigger-base',
      this.classes().trigger,
    ),
  );
  readonly valueClass = computed(() =>
    this.composeClass(
      'neural-select-value-root',
      'neural-select-value-base',
      this.classes().value,
    ),
  );
  readonly placeholderClass = computed(() =>
    this.composeClass(
      'neural-select-placeholder-root',
      'neural-select-placeholder-base',
      this.classes().placeholder,
    ),
  );
  readonly dropdownIconClass = computed(() =>
    this.composeClass(
      normalizeIconClass(this.iconClass()),
      '',
      this.classes().dropdownIcon,
    ),
  );
  readonly loadingIconClass = computed(() =>
    this.composeClass(
      normalizeIconClass(this.loadingIcon()),
      '',
      this.classes().dropdownIcon,
    ),
  );
  readonly clearButtonClass = computed(() =>
    this.composeClass(
      'neural-select-clear-root',
      'neural-select-clear-base',
      this.classes().clearButton,
    ),
  );
  readonly panelClass = computed(() =>
    this.composeClass(
      'neural-select-panel-root',
      'neural-select-panel-base',
      this.classes().panel,
    ),
  );
  readonly listClass = computed(() =>
    this.composeClass(
      'neural-select-list-root',
      'neural-select-list-base',
      this.classes().list,
    ),
  );
  readonly emptyMessageClass = computed(() =>
    this.composeClass(
      'neural-select-empty-root',
      'neural-select-empty-base',
      this.classes().emptyMessage,
    ),
  );
  readonly loadingMessageClass = computed(() =>
    this.composeClass(
      'neural-select-loading-root',
      'neural-select-loading-base',
      this.classes().loadingMessage,
    ),
  );

  constructor() {
    effect(() => {
      const open = this.open();
      const appendTo = this.appendTo();
      const panel = this.panel()?.nativeElement;
      if (!isPlatformBrowser(this.platformId)) return;
      if (!panel) {
        if (!open) this.disconnectPanel();
        return;
      }
      queueMicrotask(() => this.syncPanel(open, appendTo));
    });

    inject(DestroyRef).onDestroy(() => {
      this.typeahead.destroy();
      this.positionRef?.destroy();
      this.positionRef = undefined;
    });
  }

  toggle(): void {
    if (this.effectiveDisabled()) return;
    this.setOpen(!this.open());
  }

  select(
    option: NeuralResolvedSelectOption<TValue, TOption>,
    source: NeuralSelectInteractionSource,
  ): void {
    if (
      this.effectiveDisabled() ||
      this.effectiveReadonly() ||
      this.loading() ||
      option.disabled
    ) {
      return;
    }

    const previousValue = this.value();
    if (this.compareWith()(option.value, previousValue)) {
      this.setOpen(false);
      this.trigger()?.nativeElement.focus();
      return;
    }
    this.value.set(option.value);
    this.selectionChange.emit({
      value: option.value,
      previousValue,
      option: option.source,
      source,
    });
    this.setOpen(false);
    this.trigger()?.nativeElement.focus();
  }

  clear(event?: Event): void {
    event?.stopPropagation();
    if (
      this.effectiveDisabled() ||
      this.effectiveReadonly() ||
      this.loading() ||
      this.value() === null
    ) {
      return;
    }

    const previousValue = this.value();
    this.value.set(null);
    this.cleared.emit({ previousValue });
    this.setOpen(false);
    this.trigger()?.nativeElement.focus();
  }

  activate(index: number): void {
    if (!this.resolvedOptions()[index]?.disabled) {
      this.activeIndex.set(index);
    }
  }

  handleVirtualScroll(event: Event): void {
    if (!this.effectiveVirtualScroll()) return;
    this.virtualScrollTop.set((event.currentTarget as HTMLElement).scrollTop);
  }

  handleBlur(): void {
    if (!this.open()) this.touch.emit();
  }

  focus(options?: FocusOptions): void {
    this.trigger()?.nativeElement.focus(options);
  }

  reset(): void {
    this.setOpen(false);
    this.value.set(null);
  }

  handleKeydown(event: KeyboardEvent): void {
    if (this.effectiveDisabled()) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.openAndMove(1);
        return;
      case 'ArrowUp':
        event.preventDefault();
        this.openAndMove(-1);
        return;
      case 'Home':
        if (!this.open()) return;
        event.preventDefault();
        this.moveToEdge(1);
        return;
      case 'End':
        if (!this.open()) return;
        event.preventDefault();
        this.moveToEdge(-1);
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!this.open()) {
          this.setOpen(true);
          return;
        }
        this.selectActive('keyboard');
        return;
      case 'Escape':
        if (!this.open()) return;
        event.preventDefault();
        this.setOpen(false);
        return;
      case 'Tab':
        this.setOpen(false);
        return;
      default:
        if (
          event.key.length === 1 &&
          !event.altKey &&
          !event.ctrlKey &&
          !event.metaKey
        ) {
          this.handleTypeahead(event.key);
        }
    }
  }

  optionClass(
    option: NeuralResolvedSelectOption<TValue, TOption>,
    index: number,
  ): string {
    return this.composeClass(
      'neural-select-option-root',
      [
        'neural-select-option-base',
        index === this.activeIndex() ? 'neural-select-option-active-base' : '',
        this.isSelected(option) ? 'neural-select-option-selected-base' : '',
        option.disabled ? 'neural-select-option-disabled-base' : '',
      ].join(' '),
      this.classes().option,
      index === this.activeIndex() ? this.classes().activeOption : '',
      this.isSelected(option) ? this.classes().selectedOption : '',
      option.disabled ? this.classes().disabledOption : '',
    );
  }

  optionIconClass(option: NeuralResolvedSelectOption<TValue, TOption>): string {
    return this.composeClass(
      `neural-select-option-icon ${normalizeIconClass(option.iconClass)}`,
      'neural-select-option-icon-base',
      this.classes().optionIcon,
    );
  }

  isSelected(option: NeuralResolvedSelectOption<TValue, TOption>): boolean {
    return this.compareWith()(option.value, this.value());
  }

  @HostListener('document:pointerdown', ['$event'])
  protected handleDocumentPointerDown(event: PointerEvent): void {
    if (
      this.open() &&
      !this.host.nativeElement.contains(event.target as Node)
    ) {
      this.setOpen(false);
    }
  }

  private setOpen(nextOpen: boolean): void {
    const resolvedOpen =
      nextOpen && !this.effectiveDisabled() && !this.loading();
    if (resolvedOpen === this.open()) return;

    if (!resolvedOpen) this.disconnectPanel();
    this.open.set(resolvedOpen);
    if (resolvedOpen) {
      const selectedIndex = this.resolvedOptions().findIndex((option) =>
        this.isSelected(option),
      );
      this.setActiveIndex(
        selectedIndex >= 0 ? selectedIndex : this.nextEnabled(-1, 1),
      );
    } else {
      this.activeIndex.set(-1);
      this.typeahead.reset();
    }
    this.openChange.emit(resolvedOpen);
  }

  private openAndMove(direction: 1 | -1): void {
    if (!this.open()) {
      const hasSelection = this.selectedOption() !== null;
      this.setOpen(true);
      if (direction === -1 && !hasSelection) {
        this.moveToEdge(-1);
      }
      return;
    }
    this.setActiveIndex(this.nextEnabled(this.activeIndex(), direction));
  }

  private moveToEdge(direction: 1 | -1): void {
    const start = direction === 1 ? -1 : this.resolvedOptions().length;
    this.setActiveIndex(this.nextEnabled(start, direction, false));
  }

  private nextEnabled(
    currentIndex: number,
    direction: 1 | -1,
    wrap = true,
  ): number {
    return findNextEnabledOption(
      this.resolvedOptions(),
      currentIndex,
      direction,
      wrap,
    );
  }

  private selectActive(source: NeuralSelectInteractionSource): void {
    const option = this.resolvedOptions()[this.activeIndex()];
    if (option) this.select(option, source);
  }

  private handleTypeahead(key: string): void {
    const index = this.typeahead.push(key, this.resolvedOptions());
    if (index < 0) return;

    if (!this.open()) this.setOpen(true);
    this.setActiveIndex(index);
  }

  private syncPanel(open: boolean, appendTo: NeuralSelectAppendTo): void {
    const panel = this.panel()?.nativeElement;
    const trigger = this.trigger()?.nativeElement;
    if (!panel) return;

    if (!open || appendTo !== 'body') {
      this.disconnectPanel(panel);
      return;
    }

    if (!trigger) return;
    panel.style.setProperty(
      'min-width',
      `${Math.ceil(trigger.getBoundingClientRect().width)}px`,
    );
    try {
      panel.showPopover?.();
    } catch {
      // The positioned inline fallback remains usable.
    }
    this.positionRef?.destroy();
    this.positionRef = this.positioner.connect(trigger, panel, {
      placement: 'bottom-start',
      offset: 4,
    });
  }

  private disconnectPanel(panel = this.panel()?.nativeElement): void {
    this.positionRef?.destroy();
    this.positionRef = undefined;
    if (!panel) return;
    panel.style.removeProperty('min-width');
    try {
      panel.hidePopover?.();
    } catch {
      // The inline panel remains authoritative when Popover is unavailable.
    }
  }

  private resolveDataOption(
    option: unknown,
    index: number,
  ): NeuralResolvedSelectOption<TValue, TOption> {
    return resolveNeuralOption<TValue, TOption>(option as TOption, index, {
      idPrefix: `${this.listboxId}-option`,
      labelPath: this.optionLabel(),
      valuePath: this.optionValue(),
      disabledPath: this.optionDisabled(),
      iconPath: this.optionIcon(),
    });
  }

  private setActiveIndex(index: number): void {
    this.activeIndex.set(index);
    if (!this.effectiveVirtualScroll() || index < 0) return;
    queueMicrotask(() => {
      const list = this.list()?.nativeElement;
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

  private warnAboutMixedSources(): void {
    if (
      !isDevMode() ||
      this.warnedAboutMixedSources ||
      typeof console === 'undefined'
    ) {
      return;
    }
    this.warnedAboutMixedSources = true;
    console.warn(
      'NeuralNg Select: use either [options] or neural-option children. When both are present, [options] is used.',
    );
  }

  private composeClass(
    structural: string,
    visual: string,
    ...consumerClasses: Array<string | undefined>
  ): string {
    return [
      structural,
      this.effectiveUnstyled() ? '' : visual,
      ...consumerClasses,
    ]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(' ');
  }
}

function normalizeIconClass(value: string): string {
  const normalized = value.trim();
  if (!normalized) return '';
  const classes = normalized.split(/\s+/);
  const usesNeuralIcon = classes.some((className) =>
    className.startsWith('nt-'),
  );
  return usesNeuralIcon && !classes.includes('nt')
    ? `nt ${normalized}`
    : normalized;
}

/** @deprecated Import and use `NeuralSelect` instead. */
export { NeuralSelect as SelectComponent };
