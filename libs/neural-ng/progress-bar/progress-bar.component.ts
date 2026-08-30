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
import { NEURAL_NG_CONFIG } from '@neural-ng/core';
import type {
  NeuralProgressBarClasses,
  NeuralProgressBarMode,
  NeuralProgressBarSeverity,
  NeuralProgressBarSize,
} from './progress-bar.types';

@Component({
  selector: 'neural-progress-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-progress-bar-host' },
  template: `
    <div
      [class]="rootClass()"
      role="progressbar"
      [attr.data-mode]="mode()"
      [attr.data-size]="size()"
      [attr.data-severity]="severity()"
      [attr.data-rounded]="rounded() ? 'true' : null"
      [attr.data-striped]="striped() ? 'true' : null"
      [attr.data-animated]="animated() ? 'true' : null"
      [attr.aria-label]="normalizedAriaLabel()"
      [attr.aria-labelledby]="normalizedAriaLabelledBy()"
      [attr.aria-valuemin]="isDeterminate() ? safeMin() : null"
      [attr.aria-valuemax]="isDeterminate() ? safeMax() : null"
      [attr.aria-valuenow]="isDeterminate() ? normalizedValue() : null"
      [attr.aria-valuetext]="normalizedAriaValueText()"
    >
      <div [class]="trackClass()">
        @if (isDeterminate() && bufferPercentage() !== null) {
          <span
            [class]="bufferClass()"
            [style.inline-size.%]="bufferPercentage()"
            aria-hidden="true"
          ></span>
        }

        <span
          [class]="valueClass()"
          [style.inline-size.%]="isDeterminate() ? percentage() : null"
          aria-hidden="true"
        ></span>

        @if (showValue()) {
          <span [class]="labelClass()" aria-hidden="true">
            {{ computedLabel() }}
          </span>
        }
      </div>
    </div>
  `,
  styles: `
    :where(.neural-progress-bar-host) {
      display: block;
      width: 100%;
    }

    :where(
      .neural-progress-bar-root,
      .neural-progress-bar-track-root,
      .neural-progress-bar-buffer-root,
      .neural-progress-bar-value-root,
      .neural-progress-bar-label-root
    ) {
      box-sizing: border-box;
    }

    :where(.neural-progress-bar-root),
    :where(.neural-progress-bar-track-root) {
      position: relative;
      display: block;
      width: 100%;
    }

    :where(.neural-progress-bar-track-root) {
      overflow: hidden;
      min-height: var(--neural-progress-bar-current-height, 1rem);
    }

    :where(.neural-progress-bar-buffer-root),
    :where(.neural-progress-bar-value-root) {
      position: absolute;
      inset-block: 0;
      inset-inline-start: 0;
      display: block;
    }

    :where(.neural-progress-bar-root) {
      --neural-progress-bar-current-height: var(
        --neural-progress-bar-medium-height,
        1rem
      );
      --neural-progress-bar-current-font-size: var(
        --neural-progress-bar-medium-font-size,
        0.6875rem
      );
    }

    :where(.neural-progress-bar-small-base) {
      --neural-progress-bar-current-height: var(
        --neural-progress-bar-small-height,
        0.5rem
      );
      --neural-progress-bar-current-font-size: var(
        --neural-progress-bar-small-font-size,
        0.625rem
      );
    }

    :where(.neural-progress-bar-large-base) {
      --neural-progress-bar-current-height: var(
        --neural-progress-bar-large-height,
        1.5rem
      );
      --neural-progress-bar-current-font-size: var(
        --neural-progress-bar-large-font-size,
        0.75rem
      );
    }

    :where(.neural-progress-bar-track-base) {
      color: var(--neural-progress-bar-label-color, CanvasText);
      background: var(--neural-progress-bar-track-background, Canvas);
      border: var(--neural-progress-bar-track-border, 0 solid transparent);
      border-radius: var(--neural-progress-bar-radius, 0.5rem);
      box-shadow: var(--neural-progress-bar-shadow, none);
    }

    :where(.neural-progress-bar-root:not([data-rounded='true']))
      > .neural-progress-bar-track-root {
      border-radius: 0;
    }

    :where(.neural-progress-bar-buffer-base) {
      background: var(
        --neural-progress-bar-buffer-background,
        rgb(0 0 0 / 0.12)
      );
      transition: var(
        --neural-progress-bar-transition,
        inline-size 180ms ease-out
      );
    }

    :where(.neural-progress-bar-value-base) {
      background: var(--neural-progress-bar-value-background, currentColor);
      transition: var(
        --neural-progress-bar-transition,
        inline-size 180ms ease-out
      );
    }

    :where(.neural-progress-bar-neutral-base) {
      background: var(
        --neural-progress-bar-neutral-background,
        var(--neural-progress-bar-value-background, currentColor)
      );
    }

    :where(.neural-progress-bar-primary-base) {
      background: var(
        --neural-progress-bar-primary-background,
        var(--neural-color-primary)
      );
    }

    :where(.neural-progress-bar-secondary-base) {
      background: var(
        --neural-progress-bar-secondary-background,
        var(--neural-color-text-muted)
      );
    }

    :where(.neural-progress-bar-info-base) {
      background: var(
        --neural-progress-bar-info-background,
        var(--neural-progress-bar-value-background, currentColor)
      );
    }

    :where(.neural-progress-bar-success-base) {
      background: var(
        --neural-progress-bar-success-background,
        var(--neural-progress-bar-value-background, currentColor)
      );
    }

    :where(.neural-progress-bar-warning-base) {
      background: var(
        --neural-progress-bar-warning-background,
        var(--neural-progress-bar-value-background, currentColor)
      );
    }

    :where(.neural-progress-bar-error-base) {
      background: var(
        --neural-progress-bar-error-background,
        var(--neural-progress-bar-value-background, currentColor)
      );
    }

    :where(.neural-progress-bar-striped-base) {
      background-image: linear-gradient(
        45deg,
        var(--neural-progress-bar-stripe-color, rgb(255 255 255 / 0.18)) 25%,
        transparent 25%,
        transparent 50%,
        var(--neural-progress-bar-stripe-color, rgb(255 255 255 / 0.18)) 50%,
        var(--neural-progress-bar-stripe-color, rgb(255 255 255 / 0.18)) 75%,
        transparent 75%,
        transparent
      );
      background-size: var(--neural-progress-bar-stripe-size, 1rem) 1rem;
    }

    :where(
      .neural-progress-bar-striped-base.neural-progress-bar-animated-root
    ) {
      animation: neural-progress-bar-stripes
        var(--neural-progress-bar-stripe-duration, 1s) linear infinite;
    }

    :where(
      .neural-progress-bar-indeterminate-root .neural-progress-bar-value-root
    ) {
      inline-size: var(--neural-progress-bar-indeterminate-width, 40%);
      animation: neural-progress-bar-indeterminate
        var(--neural-progress-bar-indeterminate-duration, 1.5s)
        var(--neural-progress-bar-indeterminate-easing, ease-in-out) infinite;
    }

    :where(.neural-progress-bar-label-root) {
      position: absolute;
      inset: 0;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }

    :where(.neural-progress-bar-label-base) {
      color: var(--neural-progress-bar-label-color, CanvasText);
      font-family: var(--neural-progress-bar-label-font-family, inherit);
      font-size: var(
        --neural-progress-bar-current-font-size,
        var(--neural-progress-bar-font-size, 0.6875rem)
      );
      font-weight: var(--neural-progress-bar-label-font-weight, 700);
      line-height: var(--neural-progress-bar-label-line-height, 1);
      text-shadow: var(--neural-progress-bar-label-shadow, none);
    }

    @keyframes neural-progress-bar-indeterminate {
      from {
        inset-inline-start: -40%;
      }
      to {
        inset-inline-start: 100%;
      }
    }

    @keyframes neural-progress-bar-stripes {
      from {
        background-position: 0 0;
      }
      to {
        background-position: var(--neural-progress-bar-stripe-size, 1rem) 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      :where(
        .neural-progress-bar-indeterminate-root .neural-progress-bar-value-root
      ) {
        inset-inline-start: 30%;
        animation: none;
      }

      :where(
        .neural-progress-bar-striped-base.neural-progress-bar-animated-root
      ) {
        animation: none;
      }

      :where(.neural-progress-bar-buffer-root),
      :where(.neural-progress-bar-value-root) {
        transition: none;
      }
    }
  `,
})
export class NeuralProgressBar {
  private readonly config = inject(NEURAL_NG_CONFIG);

  readonly value = input(0, { transform: numberAttribute });
  readonly min = input(0, { transform: numberAttribute });
  readonly max = input(100, { transform: numberAttribute });
  readonly bufferValue = input<number | null>(null, {
    transform: numberAttribute,
  });
  readonly mode = input<NeuralProgressBarMode>('determinate');
  readonly size = input<NeuralProgressBarSize>('medium');
  readonly severity = input<NeuralProgressBarSeverity>('info');
  readonly rounded = input(true, { transform: booleanAttribute });
  readonly striped = input(false, { transform: booleanAttribute });
  readonly animated = input(false, { transform: booleanAttribute });
  readonly showValue = input(true, { transform: booleanAttribute });
  readonly label = input<string | null>(null);
  readonly ariaLabel = input<string | null>(null);
  readonly ariaLabelledBy = input<string | null>(null);
  readonly ariaValueText = input<string | null>(null);
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly progressClass = input('');
  readonly classes = input<NeuralProgressBarClasses>({});

  readonly effectiveUnstyled = computed(
    () => this.unstyled() || this.config.unstyled,
  );
  readonly isDeterminate = computed(() => this.mode() === 'determinate');
  readonly safeMin = computed(() =>
    Number.isFinite(this.min()) ? this.min() : 0,
  );
  readonly safeMax = computed(() => {
    const min = this.safeMin();
    const max = this.max();
    return Number.isFinite(max) && max > min ? max : min + 1;
  });
  readonly normalizedValue = computed(() => {
    const value = Number.isFinite(this.value()) ? this.value() : this.safeMin();
    return this.clamp(value);
  });
  readonly percentage = computed(
    () =>
      ((this.normalizedValue() - this.safeMin()) /
        (this.safeMax() - this.safeMin())) *
      100,
  );
  readonly bufferPercentage = computed(() => {
    const bufferValue = this.bufferValue();
    if (bufferValue === null || !Number.isFinite(bufferValue)) return null;
    const buffer =
      ((this.clamp(bufferValue) - this.safeMin()) /
        (this.safeMax() - this.safeMin())) *
      100;
    return Math.max(this.percentage(), buffer);
  });
  readonly normalizedAriaLabel = computed(
    () => this.ariaLabel()?.trim() || null,
  );
  readonly normalizedAriaLabelledBy = computed(
    () => this.ariaLabelledBy()?.trim() || null,
  );
  readonly normalizedAriaValueText = computed(() => {
    const explicit = this.ariaValueText()?.trim();
    if (explicit) return explicit;
    return this.isDeterminate() ? this.computedLabel() : null;
  });
  readonly computedLabel = computed(() => {
    const explicit = this.label()?.trim();
    if (explicit) return explicit;
    return this.isDeterminate() ? `${Math.round(this.percentage())}%` : '';
  });
  readonly rootClass = computed(() =>
    [
      this.compose(
        'neural-progress-bar-root',
        'neural-progress-bar-base',
        this.progressClass(),
        this.classes().root,
      ),
      this.size() === 'medium'
        ? ''
        : this.visualClass(`neural-progress-bar-${this.size()}-base`),
      this.isDeterminate() ? '' : 'neural-progress-bar-indeterminate-root',
    ]
      .filter(Boolean)
      .join(' '),
  );
  readonly trackClass = computed(() =>
    this.compose(
      'neural-progress-bar-track-root',
      'neural-progress-bar-track-base',
      this.classes().track,
    ),
  );
  readonly bufferClass = computed(() =>
    this.compose(
      'neural-progress-bar-buffer-root',
      'neural-progress-bar-buffer-base',
      this.classes().buffer,
    ),
  );
  readonly valueClass = computed(() =>
    [
      this.compose(
        'neural-progress-bar-value-root',
        'neural-progress-bar-value-base',
        this.classes().value,
      ),
      this.visualClass(`neural-progress-bar-${this.severity()}-base`),
      this.striped()
        ? this.visualClass('neural-progress-bar-striped-base')
        : '',
      this.animated() ? 'neural-progress-bar-animated-root' : '',
    ]
      .filter(Boolean)
      .join(' '),
  );
  readonly labelClass = computed(() =>
    this.compose(
      'neural-progress-bar-label-root',
      'neural-progress-bar-label-base',
      this.classes().label,
    ),
  );

  private clamp(value: number): number {
    return Math.min(this.safeMax(), Math.max(this.safeMin(), value));
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

/** @deprecated Use `NeuralProgressBar`. */
export { NeuralProgressBar as ProgressBarComponent };
