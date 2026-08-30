import {
  APP_ID,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injectable,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import type { FormCheckboxControl } from '@angular/forms/signals';
import { NEURAL_FIELD_CONTEXT, NEURAL_NG_CONFIG } from '@neural-ng/core';
import type { NeuralSwitchChange, NeuralSwitchClasses } from './switch.types';

@Injectable({ providedIn: 'root' })
class NeuralSwitchIdGenerator {
  private readonly appId = inject(APP_ID);
  private nextId = 0;

  next(): string {
    return `${this.appId}-neural-switch-${this.nextId++}`;
  }
}

@Component({
  selector: 'neural-switch',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neural-switch-host',
    '[class.neural-switch-host-fluid]': 'effectiveFluid()',
  },
  template: `
    <label
      [class]="rootClass()"
      [attr.data-state]="checked() ? 'checked' : 'unchecked'"
      [attr.data-disabled]="effectiveDisabled() ? 'true' : null"
      [attr.data-readonly]="effectiveReadonly() ? 'true' : null"
      [attr.data-invalid]="effectiveInvalid() ? 'true' : null"
    >
      <input
        #nativeInput
        type="checkbox"
        role="switch"
        [id]="controlId()"
        [class]="inputClassName()"
        [name]="name()"
        [value]="inputValue()"
        [checked]="checked()"
        [disabled]="effectiveDisabled()"
        [required]="effectiveRequired()"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-checked]="checked()"
        [attr.aria-readonly]="effectiveReadonly() ? 'true' : null"
        [attr.aria-describedby]="field?.controlDescribedBy()"
        [attr.aria-invalid]="effectiveInvalid() ? 'true' : null"
        [attr.aria-required]="effectiveRequired() ? 'true' : null"
        [attr.aria-busy]="pending() || field?.pending() ? 'true' : null"
        (click)="handleClick($event)"
        (change)="handleChange($event)"
        (blur)="touch.emit()"
      />
      <span [class]="trackClass()" aria-hidden="true">
        @if (onLabel()) {
          <span [class]="onLabelClass()">{{ onLabel() }}</span>
        }
        @if (offLabel()) {
          <span [class]="offLabelClass()">{{ offLabel() }}</span>
        }
        <span [class]="thumbClass()"></span>
      </span>
      <span [class]="labelClassName()"><ng-content /></span>
    </label>
  `,
  styles: `
    :where(.neural-switch-host) {
      display: inline-block;
      min-width: 0;
      max-width: 100%;
    }

    :where(.neural-switch-host-fluid) {
      display: block;
      width: 100%;
    }

    :where(.neural-switch-root) {
      box-sizing: border-box;
      min-width: 0;
      max-width: 100%;
    }

    :where(.neural-switch-base) {
      display: inline-flex;
      align-items: center;
      gap: var(--neural-switch-gap, 0.625rem);
      width: var(--neural-switch-width, auto);
      color: var(--neural-switch-label-color, inherit);
      font-family: var(--neural-switch-font-family, inherit);
      font-size: var(--neural-switch-font-size, 0.875rem);
      line-height: var(--neural-switch-line-height, 1.4);
      cursor: pointer;
    }

    :where(.neural-switch-fluid-base) {
      width: 100%;
    }

    :where(.neural-switch-input-base) {
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

    :where(.neural-switch-track-root) {
      box-sizing: border-box;
      display: inline-flex;
      flex: 0 0 auto;
      align-items: center;
    }

    :where(.neural-switch-track-base) {
      position: relative;
      justify-content: space-between;
      width: var(--neural-switch-track-width, 2.75rem);
      height: var(--neural-switch-track-height, 1.5rem);
      padding: var(--neural-switch-track-padding, 0.1875rem);
      color: var(--neural-switch-track-color, inherit);
      background: var(--neural-switch-track-background, transparent);
      border: var(--neural-switch-track-border, 1px solid currentColor);
      border-radius: var(--neural-switch-track-radius, 999px);
      box-shadow: var(--neural-switch-track-shadow, none);
      transition: var(--neural-switch-transition, none);
    }

    :where(.neural-switch-track-checked-base) {
      color: var(--neural-switch-track-color-checked, inherit);
      background: var(--neural-switch-track-background-checked, currentColor);
      border-color: var(
        --neural-switch-track-border-color-checked,
        currentColor
      );
    }

    :where(.neural-switch-thumb-root) {
      box-sizing: border-box;
      display: block;
      flex: 0 0 auto;
    }

    :where(.neural-switch-thumb-base) {
      position: absolute;
      inset-block-start: 50%;
      inset-inline-start: var(--neural-switch-track-padding, 0.1875rem);
      width: var(--neural-switch-thumb-size, 1rem);
      height: var(--neural-switch-thumb-size, 1rem);
      background: var(--neural-switch-thumb-background, currentColor);
      border-radius: var(--neural-switch-thumb-radius, 50%);
      box-shadow: var(--neural-switch-thumb-shadow, none);
      transform: translateY(-50%);
      transition: var(--neural-switch-thumb-transition, none);
    }

    :where(.neural-switch-track-checked-base .neural-switch-thumb-base) {
      background: var(--neural-switch-thumb-background-checked, currentColor);
      transform: translate(
          var(
            --neural-switch-thumb-translate,
            calc(
              var(--neural-switch-track-width, 2.75rem) - var(
                  --neural-switch-thumb-size,
                  1rem
                ) -
                2 * var(--neural-switch-track-padding, 0.1875rem) - 2px
            )
          )
        )
        translateY(-50%);
    }

    :where(
      .neural-switch-track-checked-base:dir(rtl) .neural-switch-thumb-base
    ) {
      transform: translate(
          calc(
            0px - var(
                --neural-switch-thumb-translate,
                calc(
                  var(--neural-switch-track-width, 2.75rem) - var(
                      --neural-switch-thumb-size,
                      1rem
                    ) -
                    2 * var(--neural-switch-track-padding, 0.1875rem) - 2px
                )
              )
          )
        )
        translateY(-50%);
    }

    :where(
      .neural-switch-base:hover:not([data-disabled='true']):not(
          [data-readonly='true']
        )
        .neural-switch-track-base
    ) {
      background: var(
        --neural-switch-track-background-hover,
        var(--neural-switch-track-background, transparent)
      );
      border-color: var(--neural-switch-track-border-color-hover, currentColor);
    }

    :where(
      .neural-switch-base[data-state='checked']:hover:not(
          [data-disabled='true']
        ):not([data-readonly='true'])
        .neural-switch-track-base
    ) {
      background: var(
        --neural-switch-track-background-checked-hover,
        var(--neural-switch-track-background-checked, currentColor)
      );
    }

    :where(
      .neural-switch-input-base:focus-visible + .neural-switch-track-base
    ) {
      border-color: var(--neural-switch-track-border-color-focus, currentColor);
      box-shadow: var(--neural-switch-track-shadow-focus, none);
      outline: var(--neural-switch-focus-ring, 2px solid currentColor);
      outline-offset: var(--neural-switch-focus-ring-offset, 2px);
    }

    :where(.neural-switch-root[data-invalid='true'] .neural-switch-track-base) {
      border-color: var(
        --neural-switch-track-border-color-invalid,
        currentColor
      );
    }

    :where(.neural-switch-root[data-disabled='true']) {
      opacity: var(--neural-switch-disabled-opacity, 0.5);
      cursor: not-allowed;
    }

    :where(.neural-switch-root[data-readonly='true']) {
      cursor: default;
    }

    :where(.neural-switch-label-root) {
      min-width: 0;
    }

    :where(.neural-switch-label-base) {
      color: var(--neural-switch-label-color, inherit);
    }

    :where(.neural-switch-on-label-base),
    :where(.neural-switch-off-label-base) {
      position: relative;
      z-index: 1;
      font-size: var(--neural-switch-state-label-font-size, 0.625rem);
      font-weight: var(--neural-switch-state-label-font-weight, 700);
      line-height: 1;
    }

    :where(.neural-switch-on-label-base) {
      opacity: 0;
    }

    :where(.neural-switch-off-label-base) {
      opacity: 1;
    }

    :where(.neural-switch-track-checked-base .neural-switch-on-label-base) {
      opacity: 1;
    }

    :where(.neural-switch-track-checked-base .neural-switch-off-label-base) {
      opacity: 0;
    }

    @media (prefers-reduced-motion: reduce) {
      :where(.neural-switch-track-base),
      :where(.neural-switch-thumb-base) {
        transition-duration: 0.01ms !important;
      }
    }
  `,
})
export class NeuralSwitch implements FormCheckboxControl {
  private readonly neuralConfig = inject(NEURAL_NG_CONFIG);
  private readonly generatedId = inject(NeuralSwitchIdGenerator).next();
  protected readonly field = inject(NEURAL_FIELD_CONTEXT, { optional: true });
  private readonly nativeInput =
    viewChild<ElementRef<HTMLInputElement>>('nativeInput');

  readonly checked = model(false);
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
  readonly onLabel = input('');
  readonly offLabel = input('');
  readonly switchClass = input('');
  readonly inputClass = input('');
  readonly labelClass = input('');
  readonly classes = input<NeuralSwitchClasses>({});
  readonly stateChange = output<NeuralSwitchChange>();
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
    this.composeClass(
      'neural-switch-root',
      `neural-switch-base ${this.effectiveFluid() ? 'neural-switch-fluid-base' : ''}`,
      this.switchClass(),
      this.classes().root,
    ),
  );
  readonly inputClassName = computed(() =>
    this.composeClass(
      'neural-switch-input-root',
      'neural-switch-input-base',
      this.inputClass(),
      this.classes().input,
    ),
  );
  readonly trackClass = computed(() =>
    this.composeClass(
      'neural-switch-track-root',
      `neural-switch-track-base ${this.checked() ? 'neural-switch-track-checked-base' : ''}`,
      this.classes().track,
      this.checked() ? this.classes().checkedTrack : '',
    ),
  );
  readonly thumbClass = computed(() =>
    this.composeClass(
      'neural-switch-thumb-root',
      'neural-switch-thumb-base',
      this.classes().thumb,
    ),
  );
  readonly labelClassName = computed(() =>
    this.composeClass(
      'neural-switch-label-root',
      'neural-switch-label-base',
      this.labelClass(),
      this.classes().label,
    ),
  );
  readonly onLabelClass = computed(() =>
    this.composeClass(
      'neural-switch-on-label-root',
      'neural-switch-on-label-base',
      this.classes().onLabel,
    ),
  );
  readonly offLabelClass = computed(() =>
    this.composeClass(
      'neural-switch-off-label-root',
      'neural-switch-off-label-base',
      this.classes().offLabel,
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
    if (previousChecked === checked) return;
    this.checked.set(checked);
    this.stateChange.emit({ checked, previousChecked, nativeEvent });
  }

  focus(options?: FocusOptions): void {
    this.nativeInput()?.nativeElement.focus(options);
  }

  reset(): void {
    this.checked.set(false);
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

/** @deprecated Use NeuralSwitch. */
export { NeuralSwitch as SwitchComponent };
