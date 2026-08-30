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
  numberAttribute,
  output,
  viewChildren,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import { NEURAL_FIELD_CONTEXT, NEURAL_NG_CONFIG } from '@neural-ng/core';
import type {
  NeuralSliderClasses,
  NeuralSliderEvent,
  NeuralSliderOrientation,
  NeuralSliderRangeValue,
  NeuralSliderThumb,
  NeuralSliderValue,
} from './slider.types';

@Injectable({ providedIn: 'root' })
class NeuralSliderIdGenerator {
  private readonly appId = inject(APP_ID);
  private nextId = 0;
  next(): string {
    return `${this.appId}-neural-slider-${this.nextId++}`;
  }
}

@Component({
  selector: 'neural-slider',
  standalone: true,
  template: `
    <div
      [class]="rootClass()"
      [attr.data-orientation]="orientation()"
      [attr.data-range]="range() ? 'true' : null"
      [attr.data-disabled]="effectiveDisabled() ? 'true' : null"
      [attr.data-readonly]="effectiveReadonly() ? 'true' : null"
      [attr.data-invalid]="effectiveInvalid() ? 'true' : null"
    >
      @if (range()) {
        <div
          [class]="rangeClass()"
          [style.--neural-slider-range-start.%]="rangeStartPercentage()"
          [style.--neural-slider-range-end.%]="rangeEndPercentage()"
          (pointerdown)="handleRangeTrackPointerDown($event)"
        >
          <span [class]="trackClass()">
            <span [class]="fillClass()"></span>
          </span>

          <input
            #sliderInput
            type="range"
            data-thumb="start"
            [id]="controlId() + '-start'"
            [class]="rangeInputClassName()"
            [name]="name() ? name() + '-start' : ''"
            [min]="effectiveMin()"
            [max]="effectiveMax()"
            [step]="effectiveStep()"
            [value]="rangeValue()[0]"
            [disabled]="effectiveDisabled()"
            [attr.aria-label]="
              rangeStartAriaLabel() || ariaLabel() || 'Minimum value'
            "
            [attr.aria-labelledby]="ariaLabelledBy() || null"
            [attr.aria-describedby]="describedBy()"
            [attr.aria-orientation]="orientation()"
            [attr.aria-valuetext]="rangeStartAriaValueText() || null"
            [attr.aria-invalid]="effectiveInvalid() ? 'true' : null"
            [attr.aria-readonly]="effectiveReadonly() ? 'true' : null"
            (input)="handleRangeInput($event, 'start')"
            (change)="handleCommit($event, 'start')"
            (pointerdown)="handlePointerDown($event, 'start')"
            (pointerup)="handlePointerUp($event, 'start')"
            (keydown)="handleKeydown($event)"
            (blur)="touch.emit()"
          />

          <input
            #sliderInput
            type="range"
            data-thumb="end"
            [id]="controlId() + '-end'"
            [class]="rangeInputClassName()"
            [name]="name() ? name() + '-end' : ''"
            [min]="effectiveMin()"
            [max]="effectiveMax()"
            [step]="effectiveStep()"
            [value]="rangeValue()[1]"
            [disabled]="effectiveDisabled()"
            [attr.aria-label]="
              rangeEndAriaLabel() || ariaLabel() || 'Maximum value'
            "
            [attr.aria-labelledby]="ariaLabelledBy() || null"
            [attr.aria-describedby]="describedBy()"
            [attr.aria-orientation]="orientation()"
            [attr.aria-valuetext]="rangeEndAriaValueText() || null"
            [attr.aria-invalid]="effectiveInvalid() ? 'true' : null"
            [attr.aria-readonly]="effectiveReadonly() ? 'true' : null"
            (input)="handleRangeInput($event, 'end')"
            (change)="handleCommit($event, 'end')"
            (pointerdown)="handlePointerDown($event, 'end')"
            (pointerup)="handlePointerUp($event, 'end')"
            (keydown)="handleKeydown($event)"
            (blur)="touch.emit()"
          />
        </div>
      } @else {
        <input
          #sliderInput
          type="range"
          [id]="controlId()"
          [class]="inputClassName()"
          [name]="name()"
          [min]="effectiveMin()"
          [max]="effectiveMax()"
          [step]="effectiveStep()"
          [value]="singleValue()"
          [disabled]="effectiveDisabled()"
          [attr.aria-label]="ariaLabel() || null"
          [attr.aria-labelledby]="ariaLabelledBy() || null"
          [attr.aria-describedby]="describedBy()"
          [attr.aria-orientation]="orientation()"
          [attr.aria-valuetext]="ariaValueText() || null"
          [attr.aria-invalid]="effectiveInvalid() ? 'true' : null"
          [attr.aria-readonly]="effectiveReadonly() ? 'true' : null"
          [style.--neural-slider-percentage.%]="percentage()"
          (input)="handleInput($event)"
          (change)="handleCommit($event)"
          (pointerdown)="handlePointerDown($event)"
          (pointerup)="handlePointerUp($event)"
          (keydown)="handleKeydown($event)"
          (blur)="touch.emit()"
        />
      }

      @if (showValue()) {
        <output
          [class]="valueClass()"
          [attr.dir]="valueLabel() ? null : 'ltr'"
          [attr.for]="
            range()
              ? controlId() + '-start ' + controlId() + '-end'
              : controlId()
          "
        >
          {{ displayValue() }}
        </output>
      }
    </div>
  `,
  styles: `
    :where(.neural-slider-host) {
      display: inline-block;
      min-width: 0;
      max-width: 100%;
    }
    :where(.neural-slider-host-fluid) {
      display: block;
      width: 100%;
    }
    :where(.neural-slider-root) {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      min-width: 0;
    }
    :where(.neural-slider-base) {
      width: var(--neural-slider-width, 12rem);
      gap: var(--neural-slider-gap, 0.75rem);
      color: var(--neural-slider-color, inherit);
      font: var(--neural-slider-font, inherit);
    }
    :where(.neural-slider-fluid-base) {
      width: 100%;
    }
    :where(.neural-slider-root[data-orientation='vertical']) {
      flex-direction: column;
      width: max-content;
      height: var(--neural-slider-vertical-height, 12rem);
    }
    :where(.neural-slider-input-root) {
      box-sizing: border-box;
      min-width: 0;
    }
    :where(.neural-slider-input-base) {
      flex: 1 1 auto;
      width: 100%;
      height: var(--neural-slider-thumb-size, 1.125rem);
      margin: 0;
      appearance: none;
      background: transparent;
      cursor: pointer;
      outline: 0;
    }
    :where(
      .neural-slider-root[data-orientation='vertical'] .neural-slider-input-base
    ) {
      width: var(--neural-slider-thumb-size, 1.125rem);
      height: 100%;
      writing-mode: vertical-lr;
      direction: rtl;
    }
    :where(.neural-slider-input-base)::-webkit-slider-runnable-track {
      height: var(--neural-slider-track-size, 0.375rem);
      border-radius: var(--neural-slider-track-radius, 999px);
      background: linear-gradient(
        to right,
        var(--neural-slider-fill-background, currentColor) 0
          var(--neural-slider-percentage),
        var(--neural-slider-track-background, transparent)
          var(--neural-slider-percentage) 100%
      );
    }
    :where(
      .neural-slider-root[data-orientation='vertical'] .neural-slider-input-base
    )::-webkit-slider-runnable-track {
      width: var(--neural-slider-track-size, 0.375rem);
      height: 100%;
      background: linear-gradient(
        to top,
        var(--neural-slider-fill-background, currentColor) 0
          var(--neural-slider-percentage),
        var(--neural-slider-track-background, transparent)
          var(--neural-slider-percentage) 100%
      );
    }
    :where(.neural-slider-input-base)::-moz-range-track {
      height: var(--neural-slider-track-size, 0.375rem);
      border-radius: var(--neural-slider-track-radius, 999px);
      background: var(--neural-slider-track-background, transparent);
    }
    :where(.neural-slider-input-base)::-moz-range-progress {
      height: var(--neural-slider-track-size, 0.375rem);
      border-radius: var(--neural-slider-track-radius, 999px);
      background: var(--neural-slider-fill-background, currentColor);
    }
    :where(.neural-slider-input-base)::-webkit-slider-thumb {
      width: var(--neural-slider-thumb-size, 1.125rem);
      height: var(--neural-slider-thumb-size, 1.125rem);
      margin-top: calc(
        (
            var(--neural-slider-track-size, 0.375rem) - var(
                --neural-slider-thumb-size,
                1.125rem
              )
          ) /
          2
      );
      appearance: none;
      background: var(--neural-slider-thumb-background, currentColor);
      border: var(--neural-slider-thumb-border, 0);
      border-radius: var(--neural-slider-thumb-radius, 50%);
      box-shadow: var(--neural-slider-thumb-shadow, none);
    }
    :where(
      .neural-slider-root[data-orientation='vertical'] .neural-slider-input-base
    )::-webkit-slider-thumb {
      margin-top: 0;

      margin-left: calc(
        (
            var(--neural-slider-track-size, 0.375rem) - var(
                --neural-slider-thumb-size,
                1.125rem
              )
          ) /
          2
      );
    }
    :where(.neural-slider-input-base)::-moz-range-thumb {
      width: var(--neural-slider-thumb-size, 1.125rem);
      height: var(--neural-slider-thumb-size, 1.125rem);
      background: var(--neural-slider-thumb-background, currentColor);
      border: var(--neural-slider-thumb-border, 0);
      border-radius: var(--neural-slider-thumb-radius, 50%);
      box-shadow: var(--neural-slider-thumb-shadow, none);
    }
    :where(.neural-slider-input-base:focus-visible) {
      outline: var(--neural-slider-focus-ring, 2px solid currentColor);
      outline-offset: var(--neural-slider-focus-ring-offset, 3px);
      border-radius: var(--neural-slider-track-radius, 999px);
    }
    :where(
      .neural-slider-root:not([data-readonly='true']):not([data-invalid='true'])
        .neural-slider-input-base:hover:not(:disabled)
    ) {
      --neural-slider-thumb-background: var(
        --neural-slider-thumb-background-hover,
        currentColor
      );
    }
    :where(.neural-slider-root[data-invalid='true']) {
      --neural-slider-fill-background: var(
        --neural-slider-fill-background-invalid,
        currentColor
      );
      --neural-slider-thumb-background: var(
        --neural-slider-thumb-background-invalid,
        currentColor
      );
    }
    :where(.neural-slider-root[data-disabled='true']) {
      opacity: var(--neural-slider-disabled-opacity, 0.5);
    }
    :where(
      .neural-slider-root[data-readonly='true'] .neural-slider-input-root
    ) {
      cursor: default;
    }
    :where(.neural-slider-value-root) {
      flex: 0 0 auto;
    }
    :where(.neural-slider-value-base) {
      min-width: 3ch;
      color: var(--neural-slider-value-color, inherit);
      font-size: var(--neural-slider-value-font-size, 0.8125rem);
      font-variant-numeric: tabular-nums;
      text-align: end;
    }
    :where(.neural-slider-range-root) {
      position: relative;
      flex: 1 1 auto;
      width: 100%;
      height: var(--neural-slider-thumb-size, 1.125rem);
      min-width: 0;
    }

    :where(
      .neural-slider-root[data-orientation='vertical'] .neural-slider-range-root
    ) {
      width: var(--neural-slider-thumb-size, 1.125rem);
      height: 100%;
      min-height: 0;
    }

    :where(.neural-slider-range-track-root) {
      position: absolute;
      pointer-events: none;
    }

    :where(.neural-slider-range-track-base) {
      top: 50%;
      right: 0;
      left: 0;
      height: var(--neural-slider-track-size, 0.375rem);
      overflow: hidden;
      border-radius: var(--neural-slider-track-radius, 999px);
      background: var(--neural-slider-track-background, transparent);
      transform: translateY(-50%);
    }

    :where(.neural-slider-range-fill-root) {
      position: absolute;
    }

    :where(.neural-slider-range-fill-base) {
      top: 0;
      bottom: 0;
      left: var(--neural-slider-range-start, 0%);
      right: calc(100% - var(--neural-slider-range-end, 100%));
      background: var(--neural-slider-fill-background, currentColor);
    }

    :where(
      .neural-slider-root[data-orientation='horizontal']:dir(rtl)
        .neural-slider-range-fill-base
    ) {
      left: calc(100% - var(--neural-slider-range-end, 100%));
      right: var(--neural-slider-range-start, 0%);
    }

    :where(
      .neural-slider-root[data-orientation='vertical']
        .neural-slider-range-track-base
    ) {
      top: 0;
      bottom: 0;
      left: 50%;
      right: auto;
      width: var(--neural-slider-track-size, 0.375rem);
      height: auto;
      transform: translateX(-50%);
    }

    :where(
      .neural-slider-root[data-orientation='vertical']
        .neural-slider-range-fill-base
    ) {
      top: calc(100% - var(--neural-slider-range-end, 100%));
      right: 0;
      bottom: var(--neural-slider-range-start, 0%);
      left: 0;
    }

    :where(.neural-slider-range-input-root) {
      position: absolute;
      inset: 0;
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      margin: 0;
    }

    :where(.neural-slider-range-input-base) {
      appearance: none;
      background: transparent;
      outline: 0;
      pointer-events: none;
    }

    :where(.neural-slider-range-input-base)::-webkit-slider-runnable-track {
      width: 100%;
      height: var(--neural-slider-track-size, 0.375rem);
      border: 0;
      background: transparent;
    }

    :where(.neural-slider-range-input-base)::-webkit-slider-thumb {
      width: var(--neural-slider-thumb-size, 1.125rem);
      height: var(--neural-slider-thumb-size, 1.125rem);
      margin-top: calc(
        (
            var(--neural-slider-track-size, 0.375rem) - var(
                --neural-slider-thumb-size,
                1.125rem
              )
          ) /
          2
      );
      appearance: none;
      pointer-events: auto;
      cursor: pointer;
      background: var(--neural-slider-thumb-background, currentColor);
      border: var(--neural-slider-thumb-border, 0);
      border-radius: var(--neural-slider-thumb-radius, 50%);
      box-shadow: var(--neural-slider-thumb-shadow, none);
    }

    :where(.neural-slider-range-input-base)::-moz-range-track {
      width: 100%;
      height: var(--neural-slider-track-size, 0.375rem);
      border: 0;
      background: transparent;
    }

    :where(.neural-slider-range-input-base)::-moz-range-progress {
      background: transparent;
    }

    :where(.neural-slider-range-input-base)::-moz-range-thumb {
      width: var(--neural-slider-thumb-size, 1.125rem);
      height: var(--neural-slider-thumb-size, 1.125rem);
      pointer-events: auto;
      cursor: pointer;
      background: var(--neural-slider-thumb-background, currentColor);
      border: var(--neural-slider-thumb-border, 0);
      border-radius: var(--neural-slider-thumb-radius, 50%);
      box-shadow: var(--neural-slider-thumb-shadow, none);
    }

    :where(
      .neural-slider-root[data-orientation='vertical']
        .neural-slider-range-input-base
    ) {
      width: 100%;
      height: 100%;
      writing-mode: vertical-lr;
      direction: rtl;
    }

    :where(
      .neural-slider-root[data-orientation='vertical']
        .neural-slider-range-input-base
    )::-webkit-slider-runnable-track {
      width: var(--neural-slider-track-size, 0.375rem);
      height: 100%;
    }

    :where(
      .neural-slider-root[data-orientation='vertical']
        .neural-slider-range-input-base
    )::-webkit-slider-thumb {
      margin-top: 0;
      margin-left: calc(
        (
            var(--neural-slider-track-size, 0.375rem) - var(
                --neural-slider-thumb-size,
                1.125rem
              )
          ) /
          2
      );
    }

    :where(.neural-slider-range-input-base:focus-visible) {
      outline: var(--neural-slider-focus-ring, 2px solid currentColor);
      outline-offset: var(--neural-slider-focus-ring-offset, 3px);
      border-radius: var(--neural-slider-track-radius, 999px);
    }

    :where(
      .neural-slider-root:not([data-readonly='true']):not([data-invalid='true'])
        .neural-slider-range-input-base:hover:not(:disabled)
    ) {
      --neural-slider-thumb-background: var(
        --neural-slider-thumb-background-hover,
        currentColor
      );
    }
    :where(.neural-slider-range-input-base[data-thumb='start']) {
      z-index: 2;
    }

    :where(.neural-slider-range-input-base[data-thumb='end']) {
      z-index: 3;
    }

    :where(.neural-slider-range-input-base:focus) {
      z-index: 4;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neural-slider-host',
    '[class.neural-slider-host-fluid]': 'effectiveFluid()',
  },
})
export class NeuralSlider implements FormValueControl<NeuralSliderValue> {
  private readonly config = inject(NEURAL_NG_CONFIG);
  private readonly field = inject(NEURAL_FIELD_CONTEXT, { optional: true });
  private readonly generatedId = inject(NeuralSliderIdGenerator).next();
  private readonly sliderInputs =
    viewChildren<ElementRef<HTMLInputElement>>('sliderInput');

  readonly value = model<NeuralSliderValue>(0);

  readonly range = input(false, {
    transform: booleanAttribute,
  });

  readonly rangeStartAriaLabel = input('');
  readonly rangeEndAriaLabel = input('');
  readonly rangeStartAriaValueText = input('');
  readonly rangeEndAriaValueText = input('');

  readonly sliderMin = input<number | undefined, unknown>(undefined, {
    // FormValueControl reserves `min`; keep the public [min] API on a distinct member.
    // eslint-disable-next-line @angular-eslint/no-input-rename
    alias: 'min',
    transform: optionalNumberAttribute,
  });

  readonly sliderMax = input<number | undefined, unknown>(undefined, {
    // FormValueControl reserves `max`; keep the public [max] API on a distinct member.
    // eslint-disable-next-line @angular-eslint/no-input-rename
    alias: 'max',
    transform: optionalNumberAttribute,
  });
  readonly step = input(1, { transform: numberAttribute });
  readonly orientation = input<NeuralSliderOrientation>('horizontal');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly touched = input(false, { transform: booleanAttribute });
  readonly dirty = input(false, { transform: booleanAttribute });
  readonly showValue = input(false, { transform: booleanAttribute });
  readonly valueLabel = input('');
  readonly name = input('');
  readonly sliderId = input('');
  readonly ariaLabel = input('');
  readonly ariaLabelledBy = input('');
  readonly ariaValueText = input('');
  readonly fluid = input(false, { transform: booleanAttribute });
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly sliderClass = input('');
  readonly inputClass = input('');
  readonly classes = input<NeuralSliderClasses>({});

  readonly slideStart = output<NeuralSliderEvent>();
  readonly slideEnd = output<NeuralSliderEvent>();
  readonly valueCommit = output<NeuralSliderEvent>();
  readonly touch = output<void>();

  readonly effectiveMin = computed(() =>
    Math.min(this.sliderMin() ?? 0, this.sliderMax() ?? 100),
  );

  readonly effectiveMax = computed(() =>
    Math.max(this.sliderMin() ?? 0, this.sliderMax() ?? 100),
  );
  readonly effectiveStep = computed(() =>
    Math.max(Number.EPSILON, Math.abs(this.step()) || 1),
  );
  readonly singleValue = computed(() => {
    const currentValue = this.value();

    const numericValue = Array.isArray(currentValue)
      ? currentValue[0]
      : currentValue;

    return clamp(
      toFiniteNumber(numericValue, this.effectiveMin()),
      this.effectiveMin(),
      this.effectiveMax(),
    );
  });

  readonly rangeValue = computed<NeuralSliderRangeValue>(() => {
    const currentValue = this.value();

    if (!Array.isArray(currentValue)) {
      return [this.effectiveMin(), this.effectiveMax()];
    }

    const firstValue = clamp(
      toFiniteNumber(currentValue[0], this.effectiveMin()),
      this.effectiveMin(),
      this.effectiveMax(),
    );

    const secondValue = clamp(
      toFiniteNumber(currentValue[1], this.effectiveMax()),
      this.effectiveMin(),
      this.effectiveMax(),
    );

    return firstValue <= secondValue
      ? [firstValue, secondValue]
      : [secondValue, firstValue];
  });

  readonly normalizedValue = computed<NeuralSliderValue>(() =>
    this.range() ? this.rangeValue() : this.singleValue(),
  );

  readonly percentage = computed(() =>
    this.calculatePercentage(this.singleValue()),
  );

  readonly rangeStartPercentage = computed(() =>
    this.calculatePercentage(this.rangeValue()[0]),
  );

  readonly rangeEndPercentage = computed(() =>
    this.calculatePercentage(this.rangeValue()[1]),
  );

  readonly displayValue = computed(() => {
    if (this.valueLabel()) {
      return this.valueLabel();
    }

    if (this.range()) {
      const [start, end] = this.rangeValue();
      return `${start} – ${end}`;
    }

    return String(this.singleValue());
  });

  readonly rangeClass = computed(() =>
    this.compose(
      'neural-slider-range-root',
      'neural-slider-range-base',
      this.classes().range,
    ),
  );

  readonly rangeInputClassName = computed(() =>
    this.compose(
      'neural-slider-range-input-root',
      'neural-slider-range-input-base',
      this.inputClass(),
      this.classes().input,
    ),
  );

  readonly trackClass = computed(() =>
    this.compose(
      'neural-slider-range-track-root',
      'neural-slider-range-track-base',
      this.classes().track,
    ),
  );

  readonly fillClass = computed(() =>
    this.compose(
      'neural-slider-range-fill-root',
      'neural-slider-range-fill-base',
      this.classes().fill,
    ),
  );

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
  readonly effectiveInvalid = computed(
    () => this.invalid() || (this.field?.invalid() ?? false),
  );
  readonly controlId = computed(
    () => this.field?.controlId() || this.sliderId() || this.generatedId,
  );
  readonly describedBy = computed(
    () => this.field?.controlDescribedBy() || null,
  );
  readonly rootClass = computed(() =>
    this.compose(
      'neural-slider-root',
      `neural-slider-base ${this.effectiveFluid() ? 'neural-slider-fluid-base' : ''}`,
      this.sliderClass(),
      this.classes().root,
    ),
  );
  readonly inputClassName = computed(() =>
    this.compose(
      'neural-slider-input-root',
      'neural-slider-input-base',
      this.inputClass(),
      this.classes().input,
    ),
  );
  readonly valueClass = computed(() =>
    this.compose(
      'neural-slider-value-root',
      'neural-slider-value-base',
      this.classes().value,
    ),
  );

  handleInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;

    if (this.effectiveReadonly()) {
      inputElement.value = String(this.singleValue());
      return;
    }

    this.value.set(inputElement.valueAsNumber);
  }

  handleRangeInput(event: Event, thumb: NeuralSliderThumb): void {
    const inputElement = event.target as HTMLInputElement;

    if (this.effectiveReadonly()) {
      const currentValue =
        thumb === 'start' ? this.rangeValue()[0] : this.rangeValue()[1];

      inputElement.value = String(currentValue);
      return;
    }

    const requestedValue = clamp(
      inputElement.valueAsNumber,
      this.effectiveMin(),
      this.effectiveMax(),
    );

    const [currentStart, currentEnd] = this.rangeValue();

    let nextValue: NeuralSliderRangeValue;

    if (thumb === 'start') {
      const nextStart = Math.min(requestedValue, currentEnd);
      nextValue = [nextStart, currentEnd];
      inputElement.value = String(nextStart);
    } else {
      const nextEnd = Math.max(requestedValue, currentStart);
      nextValue = [currentStart, nextEnd];
      inputElement.value = String(nextEnd);
    }

    this.value.set(nextValue);
  }

  handleRangeTrackPointerDown(event: PointerEvent): void {
    if (
      !event.isPrimary ||
      event.button !== 0 ||
      this.effectiveDisabled() ||
      this.effectiveReadonly() ||
      event.target instanceof HTMLInputElement
    ) {
      return;
    }

    const element = event.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();

    let position: number;

    if (this.orientation() === 'vertical') {
      position = (rect.bottom - event.clientY) / rect.height;
    } else {
      position = (event.clientX - rect.left) / rect.width;
      const direction =
        element.closest('[dir]')?.getAttribute('dir') ??
        element.ownerDocument.defaultView?.getComputedStyle(element).direction;
      if (direction === 'rtl') position = 1 - position;
    }

    position = clamp(position, 0, 1);

    const rawValue =
      this.effectiveMin() +
      position * (this.effectiveMax() - this.effectiveMin());

    const clickedValue = this.alignToStep(rawValue);

    const [start, end] = this.rangeValue();

    const startDistance = Math.abs(clickedValue - start);
    const endDistance = Math.abs(clickedValue - end);

    const thumb: NeuralSliderThumb =
      startDistance <= endDistance ? 'start' : 'end';

    const nextValue: NeuralSliderRangeValue =
      thumb === 'start'
        ? [Math.min(clickedValue, end), end]
        : [start, Math.max(clickedValue, start)];

    this.value.set(nextValue);

    const inputIndex = thumb === 'start' ? 0 : 1;
    this.sliderInputs()[inputIndex]?.nativeElement.focus();

    this.valueCommit.emit(this.eventValue(event, thumb));
  }

  handleCommit(event: Event, thumb?: NeuralSliderThumb): void {
    if (!this.effectiveReadonly()) {
      this.valueCommit.emit(this.eventValue(event, thumb));
    }
  }

  handlePointerDown(event: PointerEvent, thumb?: NeuralSliderThumb): void {
    if (this.effectiveReadonly()) {
      event.preventDefault();
      return;
    }

    this.slideStart.emit(this.eventValue(event, thumb));
  }

  handlePointerUp(event: PointerEvent, thumb?: NeuralSliderThumb): void {
    if (!this.effectiveReadonly()) {
      this.slideEnd.emit(this.eventValue(event, thumb));
    }
  }

  handleKeydown(event: KeyboardEvent): void {
    if (this.effectiveReadonly()) {
      event.preventDefault();
    }
  }

  focus(options?: FocusOptions): void {
    this.sliderInputs()[0]?.nativeElement.focus(options);
  }

  reset(): void {
    if (this.range()) {
      this.value.set([this.effectiveMin(), this.effectiveMax()]);
      return;
    }

    this.value.set(this.effectiveMin());
  }

  private eventValue(
    originalEvent: Event,
    thumb?: NeuralSliderThumb,
  ): NeuralSliderEvent {
    return {
      value: this.normalizedValue(),
      originalEvent,
      thumb,
    };
  }

  private calculatePercentage(value: number): number {
    const span = this.effectiveMax() - this.effectiveMin();

    if (span === 0) {
      return 0;
    }

    return ((value - this.effectiveMin()) / span) * 100;
  }

  private alignToStep(value: number): number {
    const min = this.effectiveMin();
    const step = this.effectiveStep();

    const aligned = min + Math.round((value - min) / step) * step;

    return clamp(
      Number(aligned.toFixed(10)),
      this.effectiveMin(),
      this.effectiveMax(),
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

/** @deprecated Use `NeuralSlider` instead. */
export { NeuralSlider as SliderComponent };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function optionalNumberAttribute(value: unknown): number | undefined {
  return value === undefined || value === null
    ? undefined
    : numberAttribute(value);
}

function toFiniteNumber(value: unknown, fallback: number): number {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : fallback;
}
