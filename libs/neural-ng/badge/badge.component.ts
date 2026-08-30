import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  isDevMode,
  numberAttribute,
} from '@angular/core';
import { NEURAL_NG_CONFIG } from '@neural-ng/core';
import type {
  NeuralBadgeAriaLive,
  NeuralBadgeClasses,
  NeuralBadgeSeverity,
  NeuralBadgeSize,
} from './badge.types';

@Component({
  selector: 'neural-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-badge-host' },
  template: `
    <span
      [class]="rootClass()"
      [hidden]="badgeHidden()"
      [attr.data-severity]="severity()"
      [attr.data-size]="size()"
      [attr.data-dot]="dot() ? 'true' : null"
      [attr.data-rounded]="rounded() ? 'true' : null"
      [attr.aria-label]="computedAriaLabel()"
      [attr.aria-live]="ariaLive() === 'off' ? null : ariaLive()"
      [attr.aria-atomic]="ariaLive() === 'off' ? null : 'true'"
    >
      @if (!dot()) {
        @if (displayValue() !== null) {
          <span [class]="valueClass()">{{ displayValue() }}</span>
        } @else {
          <span [class]="contentClass()"><ng-content /></span>
        }
      }
    </span>
  `,
  styles: `
    :where(.neural-badge-host) {
      display: inline-flex;
      vertical-align: middle;
    }

    :where(.neural-badge-root),
    :where(.neural-badge-value-root),
    :where(.neural-badge-content-root) {
      box-sizing: border-box;
    }

    :where(.neural-badge-root) {
      display: inline-flex;
      flex: 0 0 auto;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
    }

    :where(.neural-badge-base) {
      min-width: var(--neural-badge-min-width, 1.5rem);
      min-height: var(--neural-badge-height, 1.5rem);
      padding: var(--neural-badge-padding, 0.125rem 0.5rem);
      color: var(--neural-badge-color, Canvas);
      background: var(--neural-badge-background, CanvasText);
      border: var(--neural-badge-border, 0 solid transparent);
      border-radius: var(--neural-badge-radius, 0.375rem);
      box-shadow: var(--neural-badge-shadow, none);
      font-family: var(--neural-badge-font-family, inherit);
      font-size: var(--neural-badge-font-size, 0.75rem);
      font-weight: var(--neural-badge-font-weight, 700);
      line-height: var(--neural-badge-line-height, 1);
    }

    :where(.neural-badge-rounded-base) {
      border-radius: var(--neural-badge-rounded-radius, 999px);
    }

    :where(.neural-badge-small-base) {
      min-width: var(--neural-badge-small-min-width, 1.125rem);
      min-height: var(--neural-badge-small-height, 1.125rem);
      padding: var(--neural-badge-small-padding, 0.0625rem 0.3125rem);
      font-size: var(--neural-badge-small-font-size, 0.625rem);
    }

    :where(.neural-badge-large-base) {
      min-width: var(--neural-badge-large-min-width, 1.875rem);
      min-height: var(--neural-badge-large-height, 1.875rem);
      padding: var(--neural-badge-large-padding, 0.1875rem 0.625rem);
      font-size: var(--neural-badge-large-font-size, 0.875rem);
    }

    :where(.neural-badge-neutral-base) {
      color: var(
        --neural-badge-neutral-color,
        var(--neural-badge-color, Canvas)
      );
      background: var(
        --neural-badge-neutral-background,
        var(--neural-badge-background, CanvasText)
      );
      border-color: var(--neural-badge-neutral-border-color, transparent);
    }

    :where(.neural-badge-primary-base) {
      color: var(
        --neural-badge-primary-color,
        var(--neural-color-primary-contrast)
      );
      background: var(
        --neural-badge-primary-background,
        var(--neural-color-primary)
      );
      border-color: var(--neural-badge-primary-border-color, transparent);
    }

    :where(.neural-badge-secondary-base) {
      color: var(--neural-badge-secondary-color, var(--neural-color-text));
      background: var(
        --neural-badge-secondary-background,
        var(--neural-color-surface-active)
      );
      border-color: var(
        --neural-badge-secondary-border-color,
        var(--neural-color-border)
      );
    }

    :where(.neural-badge-info-base) {
      color: var(--neural-badge-info-color, inherit);
      background: var(--neural-badge-info-background, currentColor);
      border-color: var(--neural-badge-info-border-color, transparent);
    }

    :where(.neural-badge-success-base) {
      color: var(--neural-badge-success-color, inherit);
      background: var(--neural-badge-success-background, currentColor);
      border-color: var(--neural-badge-success-border-color, transparent);
    }

    :where(.neural-badge-warning-base) {
      color: var(--neural-badge-warning-color, inherit);
      background: var(--neural-badge-warning-background, currentColor);
      border-color: var(--neural-badge-warning-border-color, transparent);
    }

    :where(.neural-badge-error-base) {
      color: var(--neural-badge-error-color, inherit);
      background: var(--neural-badge-error-background, currentColor);
      border-color: var(--neural-badge-error-border-color, transparent);
    }

    :where(.neural-badge-dot-base) {
      width: var(--neural-badge-dot-size, 0.625rem);
      min-width: var(--neural-badge-dot-size, 0.625rem);
      min-height: var(--neural-badge-dot-size, 0.625rem);
      padding: 0;
    }

    :where(.neural-badge-dot-base.neural-badge-small-base) {
      width: var(--neural-badge-dot-small-size, 0.5rem);
      min-width: var(--neural-badge-dot-small-size, 0.5rem);
      min-height: var(--neural-badge-dot-small-size, 0.5rem);
    }

    :where(.neural-badge-dot-base.neural-badge-large-base) {
      width: var(--neural-badge-dot-large-size, 0.75rem);
      min-width: var(--neural-badge-dot-large-size, 0.75rem);
      min-height: var(--neural-badge-dot-large-size, 0.75rem);
    }

    :where(.neural-badge-content-root) {
      display: inline-flex;
      align-items: center;
      gap: var(--neural-badge-content-gap, 0.25rem);
    }

    :where(.neural-badge-anchor) {
      position: relative;
    }

    :where(.neural-badge-anchor-badge) {
      flex: 0 0 auto;
      pointer-events: none;
    }

    :where(.neural-badge-anchor-badge-overlay) {
      position: absolute;
      z-index: var(--neural-badge-anchor-z-index, 1);
    }

    :where(.neural-badge-anchor-badge-top-start) {
      inset-block-start: var(--neural-badge-anchor-offset, -0.5rem);
      inset-inline-start: var(--neural-badge-anchor-offset, -0.5rem);
    }

    :where(.neural-badge-anchor-badge-top-end) {
      inset-block-start: var(--neural-badge-anchor-offset, -0.5rem);
      inset-inline-end: var(--neural-badge-anchor-offset, -0.5rem);
    }

    :where(.neural-badge-anchor-badge-bottom-start) {
      inset-block-end: var(--neural-badge-anchor-offset, -0.5rem);
      inset-inline-start: var(--neural-badge-anchor-offset, -0.5rem);
    }

    :where(.neural-badge-anchor-badge-bottom-end) {
      inset-block-end: var(--neural-badge-anchor-offset, -0.5rem);
      inset-inline-end: var(--neural-badge-anchor-offset, -0.5rem);
    }
  `,
})
export class NeuralBadge {
  private readonly config = inject(NEURAL_NG_CONFIG);
  private warnedDotLabel = false;

  readonly value = input<string | number | null | undefined>(null);
  readonly max = input<number | null>(null, { transform: numberAttribute });
  readonly severity = input<NeuralBadgeSeverity>('neutral');
  readonly size = input<NeuralBadgeSize>('medium');
  readonly rounded = input(true, { transform: booleanAttribute });
  readonly dot = input(false, { transform: booleanAttribute });
  readonly badgeHidden = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string | null>(null);
  readonly ariaLive = input<NeuralBadgeAriaLive>('off');
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly badgeClass = input('');
  readonly classes = input<NeuralBadgeClasses>({});

  readonly effectiveUnstyled = computed(
    () => this.unstyled() || this.config.unstyled,
  );
  readonly displayValue = computed<string | number | null>(() => {
    const value = this.value();
    if (value === null || value === undefined) return null;
    const max = this.max();
    if (
      typeof value === 'number' &&
      max !== null &&
      Number.isFinite(max) &&
      max >= 0 &&
      value > max
    ) {
      return `${max}+`;
    }
    return value;
  });
  readonly computedAriaLabel = computed(() => {
    const explicit = this.ariaLabel()?.trim();
    if (explicit) return explicit;
    const value = this.value();
    return typeof value === 'number' && this.displayValue() !== value
      ? String(value)
      : null;
  });
  readonly rootClass = computed(() =>
    [
      this.compose(
        'neural-badge-root',
        'neural-badge-base',
        this.badgeClass(),
        this.classes().root,
      ),
      this.visualClass(`neural-badge-${this.severity()}-base`),
      this.size() === 'medium'
        ? ''
        : this.visualClass(`neural-badge-${this.size()}-base`),
      this.rounded() ? this.visualClass('neural-badge-rounded-base') : '',
      this.dot() ? this.visualClass('neural-badge-dot-base') : '',
    ]
      .filter(Boolean)
      .join(' '),
  );
  readonly valueClass = computed(() =>
    this.compose(
      'neural-badge-value-root',
      'neural-badge-value-base',
      this.classes().value,
    ),
  );
  readonly contentClass = computed(() =>
    this.compose(
      'neural-badge-content-root',
      'neural-badge-content-base',
      this.classes().content,
    ),
  );

  constructor() {
    effect(() => {
      if (
        !isDevMode() ||
        !this.dot() ||
        this.computedAriaLabel() ||
        this.warnedDotLabel
      ) {
        return;
      }
      this.warnedDotLabel = true;
      console.warn(
        'NeuralNg Badge: dot badges should provide ariaLabel when they convey information.',
      );
    });
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

/** @deprecated Import and use `NeuralBadge` instead. */
export { NeuralBadge as BadgeComponent };
