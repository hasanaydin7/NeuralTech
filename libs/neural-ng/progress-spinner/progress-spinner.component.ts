import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
  numberAttribute,
} from '@angular/core';
import { NEURAL_NG_CONFIG, NeuralLocaleService } from '@neural-ng/core';
import type {
  NeuralProgressSpinnerClasses,
  NeuralProgressSpinnerSeverity,
  NeuralProgressSpinnerSize,
  NeuralProgressSpinnerVariant,
} from './progress-spinner.types';

@Component({
  selector: 'neural-progress-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-progress-spinner-host' },
  template: `
    <span
      [class]="rootClass()"
      role="progressbar"
      [attr.data-size]="size()"
      [attr.data-severity]="severity()"
      [attr.data-variant]="variant()"
      [attr.data-dynamic-stroke]="dynamicStroke()"
      [attr.data-dual]="dual()"
      [attr.data-reverse]="reverse()"
      [attr.data-sync-dual-color]="syncDualColor()"
      [attr.aria-label]="resolvedAriaLabel()"
      [attr.aria-labelledby]="normalizedAriaLabelledBy()"
      [attr.aria-valuetext]="normalizedAriaValueText()"
      [style.--neural-progress-spinner-duration]="durationStyle()"
    >
      <svg
        [class]="svgClass()"
        viewBox="0 0 48 48"
        aria-hidden="true"
        focusable="false"
      >
        <circle
          [class]="trackClass()"
          cx="24"
          cy="24"
          r="20"
          [attr.stroke-width]="normalizedStrokeWidth()"
        />
        <circle
          [class]="indicatorClass()"
          cx="24"
          cy="24"
          r="20"
          [attr.stroke-width]="normalizedStrokeWidth()"
        />
        @if (dual()) {
          <g [class]="innerClass()">
            <circle
              [class]="innerTrackClass()"
              cx="24"
              cy="24"
              r="20"
              [attr.stroke-width]="normalizedStrokeWidth()"
            />
            <circle
              [class]="innerIndicatorClass()"
              cx="24"
              cy="24"
              r="20"
              [attr.stroke-width]="normalizedStrokeWidth()"
            />
          </g>
        }
      </svg>

      @if (shouldShowLabel()) {
        <span [class]="labelClass()">{{ normalizedLabel() }}</span>
      }
    </span>
  `,
  styles: `
    :where(.neural-progress-spinner-host) {
      display: inline-flex;
      line-height: 1;
      vertical-align: middle;
    }

    :where(
      .neural-progress-spinner-root,
      .neural-progress-spinner-svg-root,
      .neural-progress-spinner-track-root,
      .neural-progress-spinner-indicator-root,
      .neural-progress-spinner-inner-root,
      .neural-progress-spinner-inner-track-root,
      .neural-progress-spinner-inner-indicator-root,
      .neural-progress-spinner-label-root
    ) {
      box-sizing: border-box;
    }

    :where(.neural-progress-spinner-root) {
      display: inline-flex;
      align-items: center;
    }

    :where(.neural-progress-spinner-base) {
      --neural-progress-spinner-current-size: var(
        --neural-progress-spinner-medium-size,
        2rem
      );
      gap: var(--neural-progress-spinner-gap, 0.625rem);
      color: var(--neural-progress-spinner-label-color, CanvasText);
      font-family: var(--neural-progress-spinner-font-family, inherit);
    }

    :where(.neural-progress-spinner-small-base) {
      --neural-progress-spinner-current-size: var(
        --neural-progress-spinner-small-size,
        1.25rem
      );
    }

    :where(.neural-progress-spinner-large-base) {
      --neural-progress-spinner-current-size: var(
        --neural-progress-spinner-large-size,
        3rem
      );
    }

    :where(.neural-progress-spinner-svg-root) {
      display: block;
      flex: 0 0 auto;
    }

    :where(.neural-progress-spinner-svg-base) {
      width: var(--neural-progress-spinner-current-size, 2rem);
      height: var(--neural-progress-spinner-current-size, 2rem);
      overflow: visible;
      filter: var(--neural-progress-spinner-filter, none);
    }

    :where(.neural-progress-spinner-track-root),
    :where(.neural-progress-spinner-indicator-root),
    :where(.neural-progress-spinner-inner-track-root),
    :where(.neural-progress-spinner-inner-indicator-root) {
      fill: none;
    }

    :where(.neural-progress-spinner-track-base) {
      stroke: var(--neural-progress-spinner-track-color, rgb(0 0 0 / 0.14));
    }

    :where(.neural-progress-spinner-indicator-base) {
      stroke: var(--neural-progress-spinner-indicator-color, currentColor);
      stroke-linecap: var(--neural-progress-spinner-linecap, round);
      stroke-dasharray: var(--neural-progress-spinner-dasharray, 88 38);
      transform-origin: center;
      animation: neural-progress-spinner-rotate
        var(--neural-progress-spinner-duration, 900ms)
        var(--neural-progress-spinner-easing, linear) infinite;
    }

    :where(.neural-progress-spinner-multicolor-base) {
      animation:
        neural-progress-spinner-rotate
          var(--neural-progress-spinner-duration, 900ms)
          var(--neural-progress-spinner-easing, linear) infinite,
        neural-progress-spinner-color
          var(--neural-progress-spinner-color-duration, 4.5s) ease-in-out
          infinite;
    }

    :where(.neural-progress-spinner-dynamic-stroke-base) {
      animation:
        neural-progress-spinner-rotate
          var(--neural-progress-spinner-duration, 900ms)
          var(--neural-progress-spinner-easing, linear) infinite,
        neural-progress-spinner-dash
          var(--neural-progress-spinner-dynamic-stroke-duration, 1.5s)
          ease-in-out infinite;
    }

    :where(.neural-progress-spinner-multicolor-dynamic-stroke-base) {
      animation:
        neural-progress-spinner-rotate
          var(--neural-progress-spinner-duration, 900ms)
          var(--neural-progress-spinner-easing, linear) infinite,
        neural-progress-spinner-dash
          var(--neural-progress-spinner-dynamic-stroke-duration, 1.5s)
          ease-in-out infinite,
        neural-progress-spinner-color
          var(--neural-progress-spinner-color-duration, 4.5s) ease-in-out
          infinite;
    }

    :where(.neural-progress-spinner-reverse-all-base) {
      animation-direction: reverse;
    }

    :where(
      .neural-progress-spinner-multicolor-base.neural-progress-spinner-reverse-motion-base
    ) {
      animation-direction: reverse, normal;
    }

    :where(
      .neural-progress-spinner-multicolor-dynamic-stroke-base.neural-progress-spinner-reverse-motion-base
    ) {
      animation-direction: reverse, reverse, normal;
    }

    :where(.neural-progress-spinner-inner-base) {
      transform: scale(var(--neural-progress-spinner-dual-scale, 0.625));
      transform-box: fill-box;
      transform-origin: center;
    }

    :where(.neural-progress-spinner-inner-track-base) {
      opacity: var(--neural-progress-spinner-dual-track-opacity, 0.65);
    }

    :where(.neural-progress-spinner-inner-indicator-base) {
      opacity: var(--neural-progress-spinner-dual-indicator-opacity, 0.92);
    }

    :where(.neural-progress-spinner-neutral-base) {
      stroke: var(
        --neural-progress-spinner-neutral-color,
        var(--neural-progress-spinner-indicator-color, currentColor)
      );
    }

    :where(.neural-progress-spinner-primary-base) {
      stroke: var(
        --neural-progress-spinner-primary-color,
        var(--neural-color-primary)
      );
    }

    :where(.neural-progress-spinner-secondary-base) {
      stroke: var(
        --neural-progress-spinner-secondary-color,
        var(--neural-color-text-muted)
      );
    }

    :where(.neural-progress-spinner-info-base) {
      stroke: var(
        --neural-progress-spinner-info-color,
        var(--neural-progress-spinner-indicator-color, currentColor)
      );
    }

    :where(.neural-progress-spinner-success-base) {
      stroke: var(
        --neural-progress-spinner-success-color,
        var(--neural-progress-spinner-indicator-color, currentColor)
      );
    }

    :where(.neural-progress-spinner-warning-base) {
      stroke: var(
        --neural-progress-spinner-warning-color,
        var(--neural-progress-spinner-indicator-color, currentColor)
      );
    }

    :where(.neural-progress-spinner-error-base) {
      stroke: var(
        --neural-progress-spinner-error-color,
        var(--neural-progress-spinner-indicator-color, currentColor)
      );
    }

    :where(.neural-progress-spinner-label-base) {
      color: var(--neural-progress-spinner-label-color, CanvasText);
      font-size: var(--neural-progress-spinner-label-font-size, 0.875rem);
      font-weight: var(--neural-progress-spinner-label-font-weight, 600);
      line-height: var(--neural-progress-spinner-label-line-height, 1.35);
    }

    @keyframes neural-progress-spinner-rotate {
      from {
        transform: rotate(-90deg);
      }
      to {
        transform: rotate(270deg);
      }
    }

    @keyframes neural-progress-spinner-color {
      0%,
      100% {
        stroke: var(
          --neural-progress-spinner-color-1,
          var(--neural-color-primary)
        );
      }
      20% {
        stroke: var(
          --neural-progress-spinner-color-2,
          var(--neural-color-info)
        );
      }
      40% {
        stroke: var(
          --neural-progress-spinner-color-3,
          var(--neural-color-success)
        );
      }
      60% {
        stroke: var(
          --neural-progress-spinner-color-4,
          var(--neural-color-warning)
        );
      }
      80% {
        stroke: var(
          --neural-progress-spinner-color-5,
          var(--neural-color-error)
        );
      }
    }

    @keyframes neural-progress-spinner-dash {
      0% {
        stroke-dasharray: 1 125;
        stroke-dashoffset: 0;
      }
      50% {
        stroke-dasharray: 90 36;
        stroke-dashoffset: -35;
      }
      100% {
        stroke-dasharray: 1 125;
        stroke-dashoffset: -124;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      :where(.neural-progress-spinner-indicator-root) {
        transform: rotate(-45deg);
        animation: none;
      }
    }
  `,
})
export class NeuralProgressSpinner {
  private readonly config = inject(NEURAL_NG_CONFIG);
  private readonly locale = inject(NeuralLocaleService);

  readonly size = input<NeuralProgressSpinnerSize>('medium');
  readonly variant = input<NeuralProgressSpinnerVariant>('solid');
  readonly dynamicStroke = input(false, { transform: booleanAttribute });
  readonly dual = input(false, { transform: booleanAttribute });
  readonly reverse = input(false, { transform: booleanAttribute });
  readonly syncDualColor = input(true, { transform: booleanAttribute });
  readonly severity = input<NeuralProgressSpinnerSeverity>('info');
  readonly strokeWidth = input(4, { transform: numberAttribute });
  readonly speed = input(900, { transform: numberAttribute });
  readonly label = input<string | null>(null);
  readonly showLabel = input(true, { transform: booleanAttribute });
  readonly ariaLabel = input<string | null>(null);
  readonly ariaLabelledBy = input<string | null>(null);
  readonly ariaValueText = input<string | null>(null);
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly spinnerClass = input('');
  readonly classes = input<NeuralProgressSpinnerClasses>({});

  readonly effectiveUnstyled = computed(
    () => this.unstyled() || this.config.unstyled,
  );
  readonly normalizedStrokeWidth = computed(() => {
    const value = Number.isFinite(this.strokeWidth()) ? this.strokeWidth() : 4;
    return Math.min(12, Math.max(1, value));
  });
  readonly normalizedSpeed = computed(() => {
    const value = Number.isFinite(this.speed()) ? this.speed() : 900;
    return Math.min(10_000, Math.max(200, value));
  });
  readonly durationStyle = computed(() => `${this.normalizedSpeed()}ms`);
  readonly normalizedLabel = computed(() => this.label()?.trim() || null);
  readonly shouldShowLabel = computed(
    () => this.showLabel() && this.normalizedLabel() !== null,
  );
  readonly normalizedAriaLabelledBy = computed(
    () => this.ariaLabelledBy()?.trim() || null,
  );
  readonly resolvedAriaLabel = computed(() => {
    if (this.normalizedAriaLabelledBy()) return null;
    return (
      this.ariaLabel()?.trim() ||
      this.normalizedLabel() ||
      this.locale.messages().common.loading
    );
  });
  readonly normalizedAriaValueText = computed(
    () => this.ariaValueText()?.trim() || null,
  );
  readonly rootClass = computed(() =>
    [
      this.compose(
        'neural-progress-spinner-root',
        'neural-progress-spinner-base',
        this.spinnerClass(),
        this.classes().root,
      ),
      this.size() === 'medium'
        ? ''
        : this.visualClass(`neural-progress-spinner-${this.size()}-base`),
    ]
      .filter(Boolean)
      .join(' '),
  );
  readonly svgClass = computed(() =>
    this.compose(
      'neural-progress-spinner-svg-root',
      'neural-progress-spinner-svg-base',
      this.classes().svg,
    ),
  );
  readonly trackClass = computed(() =>
    this.compose(
      'neural-progress-spinner-track-root',
      'neural-progress-spinner-track-base',
      this.classes().track,
    ),
  );
  readonly indicatorClass = computed(() =>
    [
      this.compose(
        'neural-progress-spinner-indicator-root',
        'neural-progress-spinner-indicator-base',
        this.classes().indicator,
      ),
      this.visualClass(`neural-progress-spinner-${this.severity()}-base`),
      this.motionClass(),
      this.directionClass(false),
    ]
      .filter(Boolean)
      .join(' '),
  );
  readonly labelClass = computed(() =>
    this.compose(
      'neural-progress-spinner-label-root',
      'neural-progress-spinner-label-base',
      this.classes().label,
    ),
  );
  readonly innerClass = computed(() =>
    this.compose(
      'neural-progress-spinner-inner-root',
      'neural-progress-spinner-inner-base',
      this.classes().inner,
    ),
  );
  readonly innerTrackClass = computed(() =>
    this.compose(
      'neural-progress-spinner-track-root neural-progress-spinner-inner-track-root',
      'neural-progress-spinner-track-base neural-progress-spinner-inner-track-base',
      this.classes().innerTrack,
    ),
  );
  readonly innerIndicatorClass = computed(() =>
    [
      this.compose(
        'neural-progress-spinner-indicator-root neural-progress-spinner-inner-indicator-root',
        'neural-progress-spinner-indicator-base neural-progress-spinner-inner-indicator-base',
        this.classes().innerIndicator,
      ),
      this.visualClass(`neural-progress-spinner-${this.severity()}-base`),
      this.motionClass(),
      this.directionClass(true),
    ]
      .filter(Boolean)
      .join(' '),
  );

  private motionClass(): string {
    if (this.variant() === 'multicolor' && this.dynamicStroke()) {
      return this.visualClass(
        'neural-progress-spinner-multicolor-dynamic-stroke-base',
      );
    }
    if (this.dynamicStroke()) {
      return this.visualClass('neural-progress-spinner-dynamic-stroke-base');
    }
    if (this.variant() === 'multicolor') {
      return this.visualClass('neural-progress-spinner-multicolor-base');
    }
    return '';
  }

  private directionClass(inner: boolean): string {
    const reverseMotion = inner ? !this.reverse() : this.reverse();
    if (!reverseMotion) return '';
    if (
      this.dual() &&
      this.syncDualColor() &&
      this.variant() === 'multicolor'
    ) {
      return this.visualClass('neural-progress-spinner-reverse-motion-base');
    }
    return this.visualClass('neural-progress-spinner-reverse-all-base');
  }

  private visualClass(value: string): string {
    return this.effectiveUnstyled() ? '' : value;
  }

  private compose(
    structural: string,
    visual: string,
    ...consumer: Array<string | undefined>
  ): string {
    return [structural, this.visualClass(visual), ...consumer]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(' ');
  }
}

/** @deprecated Use `NeuralProgressSpinner` instead. */
export { NeuralProgressSpinner as ProgressSpinnerComponent };
