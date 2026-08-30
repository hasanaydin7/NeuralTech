import {
  APP_ID,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injectable,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChildren,
  forwardRef,
  inject,
  input,
  isDevMode,
  model,
  output,
  viewChild,
  viewChildren,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import { NEURAL_FIELD_CONTEXT, NEURAL_NG_CONFIG } from '@neural-ng/core';
import type {
  NeuralRadioClasses,
  NeuralRadioInteractionSource,
  NeuralRadioOrientation,
  NeuralRadioSelectionChange,
} from './radio.types';

interface ResolvedRadioOption<TValue, TOption> {
  readonly value: TValue;
  readonly label: string;
  readonly disabled: boolean;
  readonly iconClass: string;
  readonly source: TOption;
}

@Injectable({ providedIn: 'root' })
class NeuralRadioIdGenerator {
  private readonly appId = inject(APP_ID);
  private nextId = 0;

  next(): string {
    return `${this.appId}-neural-radio-${this.nextId++}`;
  }
}

@Component({
  selector: 'neural-radio-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neural-radio-group-host',
    '[class.neural-radio-group-host-fluid]': 'effectiveFluid()',
  },
  template: `
    <div
      role="radiogroup"
      [id]="groupId()"
      [class]="rootClass()"
      [attr.aria-label]="ariaLabel() || null"
      [attr.aria-labelledby]="ariaLabelledby() || null"
      [attr.aria-describedby]="field?.controlDescribedBy()"
      [attr.aria-required]="effectiveRequired() ? 'true' : null"
      [attr.aria-invalid]="effectiveInvalid() ? 'true' : null"
      [attr.aria-disabled]="effectiveDisabled() ? 'true' : null"
      [attr.aria-readonly]="effectiveReadonly() ? 'true' : null"
      [attr.aria-busy]="pending() || field?.pending() ? 'true' : null"
      [attr.aria-orientation]="orientation()"
      [attr.data-orientation]="orientation()"
      [attr.data-disabled]="effectiveDisabled() ? 'true' : null"
      [attr.data-readonly]="effectiveReadonly() ? 'true' : null"
      (focusout)="handleFocusOut($event)"
    >
      @if (dataOptions().length > 0) {
        @for (option of dataOptions(); track option.value; let index = $index) {
          <label [class]="optionClass(option)">
            <input
              #dataInput
              type="radio"
              [id]="optionId(index)"
              [class]="inputClassName()"
              [name]="effectiveName()"
              [value]="stringValue(option.value)"
              [checked]="isSelected(option.value)"
              [disabled]="effectiveDisabled() || option.disabled"
              [required]="effectiveRequired()"
              [tabIndex]="tabIndexFor(index)"
              [attr.aria-label]="option.label || ariaLabel() || null"
              [attr.aria-invalid]="effectiveInvalid() ? 'true' : null"
              (click)="handleInputClick($event)"
              (change)="selectDataOption(option, 'pointer')"
              (keydown)="handleKeydown($event, index)"
            />
            <span
              [class]="controlClass(option.value)"
              aria-hidden="true"
            ></span>
            @if (option.iconClass) {
              <i
                [class]="optionIconClass(option.iconClass)"
                aria-hidden="true"
              ></i>
            }
            <span [class]="labelClassName()">{{ option.label }}</span>
          </label>
        }
      } @else {
        <ng-content />
      }
    </div>
  `,
  styles: `
    :where(.neural-radio-group-host) {
      display: block;
      min-width: 0;
      max-width: 100%;
    }

    :where(.neural-radio-group-root) {
      box-sizing: border-box;
      display: flex;
      min-width: 0;
      max-width: 100%;
    }

    :where(.neural-radio-group-root[data-orientation='vertical']) {
      flex-direction: column;
    }

    :where(.neural-radio-group-base) {
      gap: var(--neural-radio-group-gap, 0.75rem);
      width: var(--neural-radio-group-width, auto);
      color: var(--neural-radio-label-color, inherit);
      font-family: var(--neural-radio-font-family, inherit);
    }

    :where(.neural-radio-group-fluid-base) {
      width: 100%;
    }

    :where(.neural-radio-option-root) {
      box-sizing: border-box;
      min-width: 0;
    }

    :where(.neural-radio-option-base) {
      display: inline-flex;
      align-items: flex-start;
      gap: var(--neural-radio-gap, 0.625rem);
      color: var(--neural-radio-label-color, inherit);
      font-size: var(--neural-radio-font-size, 0.875rem);
      line-height: var(--neural-radio-line-height, 1.4);
      cursor: pointer;
    }

    :where(.neural-radio-input-base) {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      white-space: nowrap;
      border: 0;
      clip: rect(0 0 0 0);
      clip-path: inset(50%);
    }

    :where(.neural-radio-control-root) {
      box-sizing: border-box;
      display: inline-grid;
      flex: 0 0 auto;
      place-items: center;
    }

    :where(.neural-radio-control-base) {
      width: var(--neural-radio-size, 1.25rem);
      height: var(--neural-radio-size, 1.25rem);
      margin-block-start: var(--neural-radio-control-offset, 0);
      background: var(--neural-radio-background, transparent);
      border: var(--neural-radio-border, 1px solid currentColor);
      border-radius: 50%;
      box-shadow: var(--neural-radio-shadow, none);
      transition: var(--neural-radio-transition, none);
    }

    :where(.neural-radio-control-base)::after {
      width: var(--neural-radio-mark-size, 0.625rem);
      height: var(--neural-radio-mark-size, 0.625rem);
      background: var(--neural-radio-mark-color, currentColor);
      border-radius: 50%;
      content: '';
      opacity: 0;
      transform: scale(0.5);
      transition: var(--neural-radio-mark-transition, none);
    }

    :where(
      .neural-radio-group-root:not([data-disabled='true']):not(
          [data-readonly='true']
        )
        .neural-radio-option-base:hover:not(.neural-radio-option-disabled-base)
        .neural-radio-control-base
    ) {
      background: var(
        --neural-radio-background-hover,
        var(--neural-radio-background, transparent)
      );
      border-color: var(--neural-radio-border-color-hover, currentColor);
    }

    :where(
      .neural-radio-input-base:focus-visible + .neural-radio-control-base
    ) {
      border-color: var(--neural-radio-border-color-focus, currentColor);
      box-shadow: var(--neural-radio-shadow-focus, none);
      outline: var(--neural-radio-focus-ring, 2px solid currentColor);
      outline-offset: var(--neural-radio-focus-ring-offset, 2px);
    }

    :where(.neural-radio-control-selected-base) {
      color: var(--neural-radio-color-selected, currentColor);
      border-color: var(--neural-radio-border-color-selected, currentColor);
    }

    :where(.neural-radio-control-selected-base)::after {
      opacity: 1;
      transform: scale(1);
    }

    :where(.neural-radio-option-disabled-base) {
      opacity: var(--neural-radio-disabled-opacity, 0.5);
      cursor: not-allowed;
    }

    :where(
      .neural-radio-group-root[data-readonly='true']
        .neural-radio-option-base:not(.neural-radio-option-disabled-base)
    ) {
      cursor: default;
    }

    :where(
      .neural-radio-group-root[aria-invalid='true'] .neural-radio-control-base
    ) {
      border-color: var(--neural-radio-border-color-invalid, currentColor);
    }

    :where(.neural-radio-label-root) {
      min-width: 0;
    }

    :where(.neural-radio-option-icon) {
      flex: 0 0 auto;
    }

    @media (prefers-reduced-motion: reduce) {
      :where(.neural-radio-control-base),
      :where(.neural-radio-control-base)::after {
        transition-duration: 0.01ms !important;
      }
    }
  `,
})
export class NeuralRadioGroup<TOption = unknown, TValue = unknown>
  implements FormValueControl<TValue | null>
{
  private readonly neuralConfig = inject(NEURAL_NG_CONFIG);
  private readonly generatedId = inject(NeuralRadioIdGenerator).next();
  private warnedAboutMixedSources = false;
  protected readonly field = inject(NEURAL_FIELD_CONTEXT, { optional: true });
  private readonly dataInputs =
    viewChildren<ElementRef<HTMLInputElement>>('dataInput');

  readonly options = input<readonly TOption[]>([]);
  readonly optionLabel = input('label');
  readonly optionValue = input('value');
  readonly optionDisabled = input('disabled');
  readonly optionIcon = input('iconClass');
  readonly value = model<TValue | null>(null);
  readonly orientation = input<NeuralRadioOrientation>('vertical');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly pending = input(false, { transform: booleanAttribute });
  readonly touched = input(false, { transform: booleanAttribute });
  readonly dirty = input(false, { transform: booleanAttribute });
  readonly fluid = input(false, { transform: booleanAttribute });
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly radioGroupId = input('');
  readonly radioName = input('');
  readonly name = input('');
  readonly ariaLabel = input('');
  readonly ariaLabelledby = input('');
  readonly radioGroupClass = input('');
  readonly classes = input<NeuralRadioClasses>({});
  readonly radios = contentChildren<NeuralRadio<TValue>>(
    forwardRef(() => NeuralRadio),
  );
  readonly selectionChange =
    output<NeuralRadioSelectionChange<TValue, TOption>>();
  readonly touch = output<void>();

  readonly effectiveUnstyled = computed(
    () =>
      this.unstyled() ||
      this.field?.effectiveUnstyled() ||
      this.neuralConfig.unstyled,
  );
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
  readonly effectiveFluid = computed(() => this.fluid() || this.field?.fluid());
  readonly groupId = computed(
    () => this.radioGroupId() || this.field?.controlId() || this.generatedId,
  );
  readonly effectiveName = computed(
    () => this.name() || this.radioName() || `${this.groupId()}-name`,
  );
  readonly dataOptions = computed<
    readonly ResolvedRadioOption<TValue, TOption>[]
  >(() => {
    const options = this.options();
    if (options.length > 0 && this.radios().length > 0) {
      this.warnAboutMixedSources();
    }
    return options.map((option) => ({
      value: (readProperty(option, this.optionValue()) ?? option) as TValue,
      label: String(readProperty(option, this.optionLabel()) ?? option),
      disabled: Boolean(readProperty(option, this.optionDisabled()) ?? false),
      iconClass: String(readProperty(option, this.optionIcon()) ?? ''),
      source: option,
    }));
  });
  readonly enabledCount = computed(
    () => this.optionCountList().filter((option) => !option.disabled).length,
  );
  readonly selectedIndex = computed(() =>
    this.optionCountList().findIndex((option) =>
      Object.is(option.value, this.value()),
    ),
  );
  readonly rovingIndex = computed(() => {
    const selected = this.selectedIndex();
    if (selected >= 0 && !this.optionCountList()[selected]?.disabled) {
      return selected;
    }
    return this.optionCountList().findIndex((option) => !option.disabled);
  });

  readonly rootClass = computed(() =>
    this.compose(
      'neural-radio-group-root',
      `neural-radio-group-base ${this.effectiveFluid() ? 'neural-radio-group-fluid-base' : ''}`,
      this.radioGroupClass(),
      this.classes().root,
    ),
  );
  readonly inputClassName = computed(() =>
    this.compose(
      'neural-radio-input-root',
      'neural-radio-input-base',
      this.classes().input,
    ),
  );
  readonly labelClassName = computed(() =>
    this.compose(
      'neural-radio-label-root',
      'neural-radio-label-base',
      this.classes().label,
    ),
  );

  selectDataOption(
    option: ResolvedRadioOption<TValue, TOption>,
    source: NeuralRadioInteractionSource,
  ): void {
    if (
      this.effectiveDisabled() ||
      this.effectiveReadonly() ||
      option.disabled
    ) {
      return;
    }
    this.commit(option.value, option.source, source);
  }

  selectProjected(
    radio: NeuralRadio<TValue>,
    source: NeuralRadioInteractionSource,
  ): void {
    if (
      this.effectiveDisabled() ||
      this.effectiveReadonly() ||
      radio.disabled()
    ) {
      return;
    }
    this.commit(radio.value() as TValue, radio as unknown as TOption, source);
  }

  handleInputClick(event: MouseEvent): void {
    if (this.effectiveReadonly()) {
      event.preventDefault();
    }
  }

  handleKeydown(event: KeyboardEvent, index: number): void {
    if (this.effectiveDisabled()) return;
    if (this.effectiveReadonly()) {
      if (
        event.key === 'ArrowDown' ||
        event.key === 'ArrowRight' ||
        event.key === 'ArrowUp' ||
        event.key === 'ArrowLeft' ||
        event.key === 'Home' ||
        event.key === 'End' ||
        event.key === ' '
      ) {
        event.preventDefault();
      }
      return;
    }
    let target: number | null = null;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      target = this.nextEnabled(index, 1);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      target = this.nextEnabled(index, -1);
    } else if (event.key === 'Home') {
      target = this.nextEnabled(-1, 1, false);
    } else if (event.key === 'End') {
      target = this.nextEnabled(this.optionCountList().length, -1, false);
    } else if (event.key === ' ') {
      event.preventDefault();
      this.selectAt(index, 'keyboard');
      return;
    }
    if (target === null || target < 0) return;
    event.preventDefault();
    this.selectAt(target, 'keyboard');
    this.focusAt(target);
  }

  isSelected(value: unknown): boolean {
    return Object.is(value, this.value());
  }

  tabIndexFor(index: number): number {
    return index === this.rovingIndex() ? 0 : -1;
  }

  handleFocusOut(event: FocusEvent): void {
    const group = event.currentTarget as HTMLElement;
    if (!group.contains(event.relatedTarget as Node | null)) this.touch.emit();
  }

  focus(options?: FocusOptions): void {
    const index = this.rovingIndex();
    if (index < 0) return;
    const dataInput = this.dataInputs()[index];
    if (dataInput) dataInput.nativeElement.focus(options);
    else this.radios()[index - this.dataOptions().length]?.focus(options);
  }

  reset(): void {
    this.value.set(null);
  }

  optionId(index: number): string {
    return `${this.groupId()}-option-${index}`;
  }

  stringValue(value: unknown): string {
    return String(value);
  }

  optionClass(option: ResolvedRadioOption<TValue, TOption>): string {
    return this.radioOptionClass(this.effectiveDisabled() || option.disabled);
  }

  radioOptionClass(disabled: boolean, consumerClass = ''): string {
    return this.compose(
      'neural-radio-option-root',
      `neural-radio-option-base ${disabled ? 'neural-radio-option-disabled-base' : ''}`,
      consumerClass,
      this.classes().option,
      disabled ? this.classes().disabledOption : '',
    );
  }

  controlClass(value: unknown): string {
    return this.compose(
      'neural-radio-control-root',
      `neural-radio-control-base ${this.isSelected(value) ? 'neural-radio-control-selected-base' : ''}`,
      this.classes().control,
      this.isSelected(value) ? this.classes().selectedControl : '',
    );
  }

  optionIconClass(iconClass: string): string {
    return this.compose(
      `neural-radio-option-icon ${normalizeIconClass(iconClass)}`,
      'neural-radio-option-icon-base',
      this.classes().optionIcon,
    );
  }

  projectedIndex(radio: NeuralRadio<TValue>): number {
    return this.dataOptions().length + this.radios().indexOf(radio);
  }

  private commit(
    nextValue: TValue,
    option: TOption,
    source: NeuralRadioInteractionSource,
  ): void {
    const previousValue = this.value();
    if (Object.is(previousValue, nextValue)) return;
    this.value.set(nextValue);
    this.selectionChange.emit({
      value: nextValue,
      previousValue,
      option,
      source,
    });
  }

  private optionCountList(): readonly {
    value: unknown;
    disabled: boolean;
  }[] {
    if (this.dataOptions().length > 0) return this.dataOptions();
    return this.radios().map((radio) => ({
      value: radio.value(),
      disabled: radio.disabled(),
    }));
  }

  private selectAt(index: number, source: NeuralRadioInteractionSource): void {
    const data = this.dataOptions()[index];
    if (data) {
      this.selectDataOption(data, source);
      return;
    }
    const radio = this.radios()[index - this.dataOptions().length];
    if (radio) this.selectProjected(radio, source);
  }

  private focusAt(index: number): void {
    const dataInput = this.dataInputs()[index];
    if (dataInput) {
      dataInput.nativeElement.focus();
      return;
    }
    this.radios()[index - this.dataOptions().length]?.focus();
  }

  private nextEnabled(current: number, direction: 1 | -1, wrap = true): number {
    const options = this.optionCountList();
    if (options.length === 0) return -1;
    let index = current;
    for (let count = 0; count < options.length; count += 1) {
      index += direction;
      if (wrap) index = (index + options.length) % options.length;
      else if (index < 0 || index >= options.length) return -1;
      if (!options[index]?.disabled) return index;
    }
    return -1;
  }

  private warnAboutMixedSources(): void {
    if (!isDevMode() || this.warnedAboutMixedSources) return;
    this.warnedAboutMixedSources = true;
    console.warn(
      'NeuralNg RadioGroup: use either [options] or neural-radio children. [options] is used when both are present.',
    );
  }

  private compose(
    structural: string,
    visual: string,
    ...consumer: Array<string | undefined>
  ): string {
    return [structural, this.effectiveUnstyled() ? '' : visual, ...consumer]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(' ');
  }
}

@Component({
  selector: 'neural-radio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-radio-host' },
  template: `
    <label [class]="optionClass()">
      <input
        #nativeInput
        type="radio"
        [id]="inputId()"
        [class]="group.inputClassName()"
        [name]="group.effectiveName()"
        [value]="group.stringValue(value())"
        [checked]="group.isSelected(value())"
        [disabled]="group.effectiveDisabled() || disabled()"
        [required]="group.effectiveRequired()"
        [tabIndex]="group.tabIndexFor(index())"
        (click)="group.handleInputClick($event)"
        (change)="group.selectProjected(this, 'pointer')"
        (keydown)="group.handleKeydown($event, index())"
      />
      <span [class]="group.controlClass(value())" aria-hidden="true"></span>
      @if (iconClass().trim()) {
        <i [class]="group.optionIconClass(iconClass())" aria-hidden="true"></i>
      }
      <span [class]="group.labelClassName()"><ng-content /></span>
    </label>
  `,
})
export class NeuralRadio<TValue = unknown> {
  protected readonly group = inject<NeuralRadioGroup<unknown, TValue>>(
    NeuralRadioGroup,
    { host: true },
  );
  private readonly nativeInput =
    viewChild.required<ElementRef<HTMLInputElement>>('nativeInput');

  readonly value = input.required<TValue>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly iconClass = input('');
  readonly radioClass = input('');
  readonly index = computed(() => this.group.projectedIndex(this));
  readonly inputId = computed(() => this.group.optionId(this.index()));
  readonly optionClass = computed(() =>
    this.group.radioOptionClass(
      this.disabled() || this.group.effectiveDisabled(),
      this.radioClass(),
    ),
  );

  focus(options?: FocusOptions): void {
    this.nativeInput().nativeElement.focus(options);
  }
}

/** @deprecated Use `NeuralRadioGroup` instead. */
export { NeuralRadioGroup as RadioGroupComponent };

/** @deprecated Use `NeuralRadio` instead. */
export { NeuralRadio as RadioComponent };

function readProperty(option: unknown, property: string): unknown {
  if (typeof option !== 'object' || option === null || !(property in option)) {
    return undefined;
  }
  return (option as Record<string, unknown>)[property];
}

function normalizeIconClass(value: string): string {
  const normalized = value.trim();
  if (!normalized) return '';
  const classes = normalized.split(/\s+/);
  return classes.some((name) => name.startsWith('nt-')) &&
    !classes.includes('nt')
    ? `nt ${normalized}`
    : normalized;
}
