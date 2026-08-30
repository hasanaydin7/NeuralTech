import {
  APP_ID,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injectable,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import type {
  FormCheckboxControl,
  FormValueControl,
} from '@angular/forms/signals';
import { NEURAL_FIELD_CONTEXT, NEURAL_NG_CONFIG } from '@neural-ng/core';
import type {
  NeuralCheckboxChange,
  NeuralCheckboxClasses,
  NeuralTriStateCheckboxChange,
  NeuralTriStateCheckboxClasses,
  NeuralTriStateCheckboxValue,
} from './checkbox.types';

@Injectable({ providedIn: 'root' })
class NeuralCheckboxIdGenerator {
  private readonly appId = inject(APP_ID);
  private nextId = 0;

  next(): string {
    return `${this.appId}-neural-checkbox-${this.nextId++}`;
  }
}

const NEURAL_CHECKBOX_STYLES = `
    :where(.neural-checkbox-host) {
      display: inline-block;
      min-width: 0;
      max-width: 100%;
    }

    :where(.neural-checkbox-host-fluid) {
      display: block;
      width: 100%;
    }

    :where(.neural-tri-state-checkbox-host) {
      display: inline-flex;
      align-items: flex-start;
      vertical-align: top;
    }

    :where(.neural-tri-state-checkbox-host-fluid) {
      display: flex;
    }

    :where(.neural-checkbox-root) {
      box-sizing: border-box;
      min-width: 0;
      max-width: 100%;
    }

    :where(.neural-checkbox-base) {
      display: inline-flex;
      align-items: flex-start;
      gap: var(--neural-checkbox-gap, 0.625rem);
      width: var(--neural-checkbox-width, auto);
      color: var(--neural-checkbox-label-color, inherit);
      font-family: var(--neural-checkbox-font-family, inherit);
      font-size: var(--neural-checkbox-font-size, 0.875rem);
      line-height: var(--neural-checkbox-line-height, 1.4);
      cursor: pointer;
    }

    :where(.neural-checkbox-fluid-base) {
      width: 100%;
    }

    :where(.neural-checkbox-input-base) {
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

    :where(.neural-checkbox-control-root) {
      box-sizing: border-box;
      display: inline-grid;
      flex: 0 0 auto;
      place-items: center;
    }

    :where(.neural-checkbox-control-base) {
      width: var(--neural-checkbox-size, 1.25rem);
      height: var(--neural-checkbox-size, 1.25rem);
      margin-block-start: var(--neural-checkbox-control-offset, 0);
      color: var(--neural-checkbox-control-color, transparent);
      background: var(--neural-checkbox-background, transparent);
      border: var(--neural-checkbox-border, 1px solid currentColor);
      border-radius: var(--neural-checkbox-radius, 0.25rem);
      box-shadow: var(--neural-checkbox-shadow, none);
      transition: var(--neural-checkbox-transition, none);
    }

    :where(.neural-checkbox-control-base)::after {
      box-sizing: border-box;
      width: 0.35rem;
      height: 0.65rem;
      border: solid currentColor;
      border-width: 0 0.125rem 0.125rem 0;
      content: '';
      opacity: 0;
      transform: translateY(-0.08rem) rotate(45deg) scale(0.6);
      transition: var(--neural-checkbox-mark-transition, none);
    }

    :where(
      .neural-checkbox-base:hover:not([data-disabled='true']):not(
          [data-readonly='true']
        )
        .neural-checkbox-control-base
    ) {
      background: var(
        --neural-checkbox-background-hover,
        var(--neural-checkbox-background, transparent)
      );
      border-color: var(--neural-checkbox-border-color-hover, currentColor);
    }

    :where(
      .neural-checkbox-input-base:focus-visible + .neural-checkbox-control-base
    ) {
      border-color: var(--neural-checkbox-border-color-focus, currentColor);
      box-shadow: var(--neural-checkbox-shadow-focus, none);
      outline: var(--neural-checkbox-focus-ring, 2px solid currentColor);
      outline-offset: var(--neural-checkbox-focus-ring-offset, 2px);
    }

    :where(.neural-checkbox-control-checked-base),
    :where(.neural-checkbox-control-mixed-base) {
      color: var(--neural-checkbox-mark-color, Canvas);
      background: var(--neural-checkbox-background-checked, currentColor);
      border-color: var(--neural-checkbox-border-color-checked, currentColor);
    }

    :where(.neural-checkbox-control-checked-base)::after {
      opacity: 1;
      transform: translateY(-0.08rem) rotate(45deg) scale(1);
    }

    :where(.neural-checkbox-control-mixed-base)::after {
      width: 0.65rem;
      height: 0;
      border-width: 0 0 0.125rem;
      opacity: 1;
      transform: none;
    }

    :where(
      .neural-checkbox-root[data-invalid='true'] .neural-checkbox-control-base
    ) {
      border-color: var(--neural-checkbox-border-color-invalid, currentColor);
    }

    :where(.neural-checkbox-root[data-disabled='true']) {
      opacity: var(--neural-checkbox-disabled-opacity, 0.5);
      cursor: not-allowed;
    }

    :where(.neural-checkbox-root[data-readonly='true']) {
      cursor: default;
    }

    :where(.neural-checkbox-label-root) {
      min-width: 0;
    }

    :where(.neural-checkbox-label-base) {
      color: var(--neural-checkbox-label-color, inherit);
    }

    @media (prefers-reduced-motion: reduce) {
      :where(.neural-checkbox-control-base),
      :where(.neural-checkbox-control-base)::after {
        transition-duration: 0.01ms !important;
      }
    }
  `;

@Component({
  selector: 'neural-checkbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neural-checkbox-host',
    '[class.neural-checkbox-host-fluid]': 'effectiveFluid()',
  },
  template: `
    <label
      [class]="rootClass()"
      [attr.data-state]="
        indeterminate() ? 'mixed' : checked() ? 'checked' : 'unchecked'
      "
      [attr.data-disabled]="effectiveDisabled() ? 'true' : null"
      [attr.data-readonly]="effectiveReadonly() ? 'true' : null"
      [attr.data-invalid]="effectiveInvalid() ? 'true' : null"
    >
      <input
        #nativeInput
        type="checkbox"
        [id]="controlId()"
        [class]="inputClassName()"
        [name]="name()"
        [value]="inputValue()"
        [checked]="checked()"
        [disabled]="effectiveDisabled()"
        [required]="effectiveRequired()"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-checked]="indeterminate() ? 'mixed' : checked()"
        [attr.aria-readonly]="effectiveReadonly() ? 'true' : null"
        [attr.aria-describedby]="field?.controlDescribedBy()"
        [attr.aria-invalid]="effectiveInvalid() ? 'true' : null"
        [attr.aria-required]="effectiveRequired() ? 'true' : null"
        [attr.aria-busy]="pending() || field?.pending() ? 'true' : null"
        (click)="handleClick($event)"
        (change)="handleChange($event)"
        (blur)="touch.emit()"
      />
      <span [class]="controlClass()" aria-hidden="true"></span>
      <span [class]="labelClassName()"><ng-content /></span>
    </label>
  `,
  styles: NEURAL_CHECKBOX_STYLES,
})
export class NeuralCheckbox implements FormCheckboxControl {
  private readonly neuralConfig = inject(NEURAL_NG_CONFIG);
  private readonly generatedId = inject(NeuralCheckboxIdGenerator).next();
  protected readonly field = inject(NEURAL_FIELD_CONTEXT, { optional: true });
  private readonly nativeInput =
    viewChild<ElementRef<HTMLInputElement>>('nativeInput');

  readonly checked = model(false);
  readonly indeterminate = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly pending = input(false, { transform: booleanAttribute });
  readonly touched = input(false, { transform: booleanAttribute });
  readonly dirty = input(false, { transform: booleanAttribute });
  readonly fluid = input(false, { transform: booleanAttribute });
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly inputId = input('');
  readonly name = input('');
  readonly inputValue = input('on');
  readonly ariaLabel = input('');
  readonly checkboxClass = input('');
  readonly inputClass = input('');
  readonly labelClass = input('');
  readonly classes = input<NeuralCheckboxClasses>({});
  readonly stateChange = output<NeuralCheckboxChange>();
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
  readonly effectiveFluid = computed(() => this.fluid() || this.field?.fluid());
  readonly effectiveInvalid = computed(
    () => this.invalid() || (this.field?.invalid() ?? false),
  );
  readonly controlId = computed(
    () => this.field?.controlId() || this.inputId() || this.generatedId,
  );

  readonly rootClass = computed(() =>
    composeCheckboxClass(
      this.effectiveUnstyled(),
      'neural-checkbox-root',
      `neural-checkbox-base ${this.effectiveFluid() ? 'neural-checkbox-fluid-base' : ''}`,
      this.checkboxClass(),
      this.classes().root,
    ),
  );
  readonly inputClassName = computed(() =>
    composeCheckboxClass(
      this.effectiveUnstyled(),
      'neural-checkbox-input-root',
      'neural-checkbox-input-base',
      this.inputClass(),
      this.classes().input,
    ),
  );
  readonly controlClass = computed(() =>
    composeCheckboxClass(
      this.effectiveUnstyled(),
      'neural-checkbox-control-root',
      `neural-checkbox-control-base ${
        this.indeterminate()
          ? 'neural-checkbox-control-mixed-base'
          : this.checked()
            ? 'neural-checkbox-control-checked-base'
            : ''
      }`,
      this.classes().control,
      this.checked() || this.indeterminate()
        ? this.classes().checkedControl
        : '',
    ),
  );

  constructor() {
    effect(() => {
      const inputElement = this.nativeInput()?.nativeElement;
      if (inputElement) inputElement.indeterminate = this.indeterminate();
    });
  }
  readonly labelClassName = computed(() =>
    composeCheckboxClass(
      this.effectiveUnstyled(),
      'neural-checkbox-label-root',
      'neural-checkbox-label-base',
      this.labelClass(),
      this.classes().label,
    ),
  );

  handleClick(nativeEvent: MouseEvent): void {
    if (!this.effectiveReadonly()) return;
    nativeEvent.preventDefault();
  }

  handleChange(nativeEvent: Event): void {
    const inputElement = nativeEvent.target as HTMLInputElement;
    if (this.effectiveDisabled() || this.effectiveReadonly()) {
      inputElement.checked = this.checked();
      return;
    }

    const previousChecked = this.checked();
    const checked = inputElement.checked;
    if (checked === previousChecked) return;

    this.checked.set(checked);
    this.stateChange.emit({ checked, previousChecked, nativeEvent });
  }

  focus(options?: FocusOptions): void {
    this.nativeInput()?.nativeElement.focus(options);
  }

  reset(): void {
    this.checked.set(false);
  }
}

@Component({
  selector: 'neural-tri-state-checkbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neural-checkbox-host neural-tri-state-checkbox-host',
    '[class.neural-checkbox-host-fluid]': 'effectiveFluid()',
    '[class.neural-tri-state-checkbox-host-fluid]': 'effectiveFluid()',
  },
  template: `
    <label
      [class]="rootClass()"
      [attr.data-state]="stateName()"
      [attr.data-disabled]="effectiveDisabled() ? 'true' : null"
      [attr.data-readonly]="effectiveReadonly() ? 'true' : null"
      [attr.data-invalid]="effectiveInvalid() ? 'true' : null"
    >
      <input
        #nativeInput
        type="checkbox"
        [id]="controlId()"
        [class]="inputClassName()"
        [name]="name()"
        [value]="inputValue()"
        [checked]="effectiveValue() === true"
        [disabled]="effectiveDisabled()"
        [required]="effectiveRequired()"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-checked]="isMixed() ? 'mixed' : effectiveValue()"
        [attr.aria-readonly]="effectiveReadonly() ? 'true' : null"
        [attr.aria-describedby]="field?.controlDescribedBy()"
        [attr.aria-invalid]="effectiveInvalid() ? 'true' : null"
        [attr.aria-required]="effectiveRequired() ? 'true' : null"
        [attr.aria-busy]="pending() || field?.pending() ? 'true' : null"
        (click)="handleClick($event)"
        (change)="handleChange($event)"
        (blur)="touch.emit()"
      />
      <span [class]="controlClass()" aria-hidden="true"></span>
      <span [class]="labelClassName()"><ng-content /></span>
    </label>
  `,
  styles: NEURAL_CHECKBOX_STYLES,
})
export class NeuralTriStateCheckbox
  implements FormValueControl<NeuralTriStateCheckboxValue>
{
  private readonly neuralConfig = inject(NEURAL_NG_CONFIG);
  private readonly generatedId = inject(NeuralCheckboxIdGenerator).next();
  protected readonly field = inject(NEURAL_FIELD_CONTEXT, { optional: true });
  private readonly nativeInput =
    viewChild<ElementRef<HTMLInputElement>>('nativeInput');

  readonly value = model<NeuralTriStateCheckboxValue>(false);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly pending = input(false, { transform: booleanAttribute });
  readonly touched = input(false, { transform: booleanAttribute });
  readonly dirty = input(false, { transform: booleanAttribute });
  readonly fluid = input(false, { transform: booleanAttribute });
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly inputId = input('');
  readonly name = input('');
  readonly inputValue = input('on');
  readonly ariaLabel = input('');
  readonly checkboxClass = input('');
  readonly inputClass = input('');
  readonly labelClass = input('');
  readonly classes = input<NeuralTriStateCheckboxClasses>({});
  readonly stateChange = output<NeuralTriStateCheckboxChange>();
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
  readonly effectiveFluid = computed(() => this.fluid() || this.field?.fluid());
  readonly effectiveInvalid = computed(
    () => this.invalid() || (this.field?.invalid() ?? false),
  );
  readonly effectiveValue = computed<NeuralTriStateCheckboxValue>(() => {
    const currentValue = this.value();
    return currentValue === true || currentValue === null
      ? currentValue
      : false;
  });
  readonly isMixed = computed(() => this.effectiveValue() === null);
  readonly stateName = computed(() =>
    this.isMixed() ? 'mixed' : this.effectiveValue() ? 'checked' : 'unchecked',
  );
  readonly controlId = computed(
    () => this.field?.controlId() || this.inputId() || this.generatedId,
  );

  readonly rootClass = computed(() =>
    composeCheckboxClass(
      this.effectiveUnstyled(),
      'neural-checkbox-root neural-tri-state-checkbox-root',
      `neural-checkbox-base ${this.effectiveFluid() ? 'neural-checkbox-fluid-base' : ''}`,
      this.checkboxClass(),
      this.classes().root,
    ),
  );
  readonly inputClassName = computed(() =>
    composeCheckboxClass(
      this.effectiveUnstyled(),
      'neural-checkbox-input-root neural-tri-state-checkbox-input-root',
      'neural-checkbox-input-base',
      this.inputClass(),
      this.classes().input,
    ),
  );
  readonly controlClass = computed(() =>
    composeCheckboxClass(
      this.effectiveUnstyled(),
      'neural-checkbox-control-root neural-tri-state-checkbox-control-root',
      [
        'neural-checkbox-control-base',
        this.effectiveValue() === true
          ? 'neural-checkbox-control-checked-base'
          : '',
        this.isMixed() ? 'neural-checkbox-control-mixed-base' : '',
      ].join(' '),
      this.classes().control,
      this.effectiveValue() === true ? this.classes().checkedControl : '',
      this.isMixed() ? this.classes().mixedControl : '',
    ),
  );
  readonly labelClassName = computed(() =>
    composeCheckboxClass(
      this.effectiveUnstyled(),
      'neural-checkbox-label-root neural-tri-state-checkbox-label-root',
      'neural-checkbox-label-base',
      this.labelClass(),
      this.classes().label,
    ),
  );

  constructor() {
    effect(() => {
      const inputElement = this.nativeInput()?.nativeElement;
      if (!inputElement) return;

      inputElement.checked = this.effectiveValue() === true;
      inputElement.indeterminate = this.isMixed();
    });
  }

  handleClick(nativeEvent: MouseEvent): void {
    if (!this.effectiveReadonly()) return;
    nativeEvent.preventDefault();
  }

  handleChange(nativeEvent: Event): void {
    const inputElement = nativeEvent.target as HTMLInputElement;
    if (this.effectiveDisabled() || this.effectiveReadonly()) {
      inputElement.checked = this.effectiveValue() === true;
      inputElement.indeterminate = this.isMixed();
      return;
    }

    const previousValue = this.effectiveValue();
    const value = nextTriStateCheckboxValue(previousValue);
    this.value.set(value);
    this.stateChange.emit({ value, previousValue, nativeEvent });
  }

  focus(options?: FocusOptions): void {
    this.nativeInput()?.nativeElement.focus(options);
  }

  reset(): void {
    this.value.set(false);
  }
}

/** @deprecated Import and use `NeuralCheckbox` instead. */
export { NeuralCheckbox as CheckboxComponent };
/** @deprecated Import and use `NeuralTriStateCheckbox` instead. */
export { NeuralTriStateCheckbox as TriStateCheckboxComponent };

function composeCheckboxClass(
  unstyled: boolean,
  structural: string,
  visual: string,
  ...consumerClasses: Array<string | undefined>
): string {
  return [structural, unstyled ? '' : visual, ...consumerClasses]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' ');
}

function nextTriStateCheckboxValue(
  value: NeuralTriStateCheckboxValue,
): NeuralTriStateCheckboxValue {
  if (value === false) return true;
  if (value === true) return null;
  return false;
}
