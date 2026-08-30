import {
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { NEURAL_NG_CONFIG } from '@neural-ng/core';
import {
  NeuralBadgeDirective,
  type NeuralBadgeSeverity,
  type NeuralBadgeSize,
} from '@neural-ng/core/badge';
import type {
  NeuralButtonBadgePosition,
  NeuralButtonIconPosition,
  NeuralButtonIconSize,
  NeuralButtonSeverity,
  NeuralButtonSize,
} from './button.types';

@Component({
  selector: 'neural-button',
  standalone: true,
  imports: [NeuralBadgeDirective],
  encapsulation: ViewEncapsulation.None,
  template: `
    <button
      [type]="type()"
      [disabled]="disabled()"
      [attr.aria-disabled]="disabled() || loading() ? 'true' : null"
      [attr.aria-busy]="loading() ? 'true' : null"
      [attr.aria-label]="computedAriaLabel()"
      [attr.aria-expanded]="effectiveAriaExpanded()"
      [attr.aria-controls]="effectiveAriaControls()"
      [attr.aria-keyshortcuts]="ariaKeyShortcuts()"
      [attr.title]="title() || null"
      [attr.data-severity]="severity()"
      [attr.data-variant]="variantName()"
      [attr.data-raised]="raised() ? 'true' : null"
      [attr.data-rounded]="rounded() ? 'true' : null"
      [class]="computedClass()"
      [neuralBadge]="loading() ? null : badge()"
      [neuralBadgePosition]="badgePosition()"
      [neuralBadgeSeverity]="badgeSeverity()"
      [neuralBadgeSize]="badgeSize()"
      [neuralBadgeMax]="badgeMax()"
      [neuralBadgeAriaLabel]="badgeAriaLabel()"
      [neuralBadgeClass]="badgeClass()"
      [neuralBadgeHostClass]="badgeHostClass()"
      [neuralBadgeUnstyled]="effectiveUnstyled()"
      (click)="onClick($event)"
      (keydown)="keyDown.emit($event)"
      (pointerdown)="pointerDown.emit($event)"
      (pointermove)="pointerMove.emit($event)"
      (pointerup)="pointerUp.emit($event)"
      (pointercancel)="pointerCancel.emit($event)"
    >
      @if (loading()) {
        <span
          class="neural-btn-spinner nt nt-loader-3 nt-spin-dual"
          aria-hidden="true"
        ></span>
        <span class="neural-btn-loading-label">{{ loadingLabel() }}</span>
      } @else {
        @if (icon() && iconPosition() === 'start') {
          <i [class]="iconClass()" aria-hidden="true"></i>
        }
        @if (label()?.trim()) {
          <span class="neural-btn-label">{{ label() }}</span>
        } @else {
          <span class="neural-btn-content"><ng-content></ng-content></span>
        }
        @if (icon() && iconPosition() === 'end') {
          <i [class]="iconClass()" aria-hidden="true"></i>
        }
      }
    </button>
  `,
  styles: `
    :where(.neural-btn-root) {
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    :where(.neural-btn-base) {
      gap: var(--neural-button-gap, 0.5rem);
      padding: var(--neural-button-padding, 0.625rem 1.25rem);
      color: var(--neural-button-color, #ffffff);
      background: var(--neural-button-background, #3b82f6);
      border-width: var(--neural-button-border-width, 1px);
      border-style: var(--neural-button-border-style, solid);
      border-color: var(--neural-button-border-color, transparent);
      border-radius: var(--neural-button-radius, 8px);
      box-shadow: var(--neural-button-shadow, none);
      backdrop-filter: var(--neural-button-backdrop-filter, none);
      font-family: var(--neural-button-font-family, inherit);
      font-size: var(--neural-button-font-size, 0.875rem);
      font-weight: var(--neural-button-font-weight, 500);
      line-height: var(--neural-button-line-height, 1.25);
      transition: var(--neural-button-transition, all 0.2s);
      cursor: pointer;
    }

    :where(.neural-btn-small-base) {
      padding: var(--neural-button-small-padding, 0.375rem 0.625rem);
      font-size: var(--neural-button-small-font-size, 0.8125rem);
    }

    :where(.neural-btn-large-base) {
      padding: var(--neural-button-large-padding, 0.6875rem 1.125rem);
      font-size: var(--neural-button-large-font-size, 1rem);
    }

    :where(.neural-btn-icon) {
      display: inline-block;
      flex: 0 0 auto;
      font-size: var(--neural-button-icon-size, 1rem);
      line-height: 1;
    }

    :where(.neural-btn-icon-small-base) {
      font-size: var(--neural-button-small-icon-size, 0.875rem);
    }

    :where(.neural-btn-icon-medium-base) {
      font-size: var(--neural-button-icon-size, 1rem);
    }

    :where(.neural-btn-icon-large-base) {
      font-size: var(--neural-button-large-icon-size, 1.125rem);
    }

    :where(.neural-btn-label) {
      min-width: 0;
    }

    :where(.neural-btn-content:empty) {
      display: none;
    }

    :where(
      .neural-btn-base:has(> .neural-btn-icon):has(> .neural-btn-content:empty)
    ) {
      inline-size: var(--neural-button-icon-only-size, 2.5rem);
      min-inline-size: var(--neural-button-icon-only-size, 2.5rem);
      block-size: var(--neural-button-icon-only-size, 2.5rem);
      min-block-size: var(--neural-button-icon-only-size, 2.5rem);
      padding: 0;
    }

    :where(
      .neural-btn-small-base:has(> .neural-btn-icon):has(
          > .neural-btn-content:empty
        )
    ) {
      --neural-button-icon-only-size: var(
        --neural-button-small-icon-only-size,
        2rem
      );
    }

    :where(
      .neural-btn-large-base:has(> .neural-btn-icon):has(
          > .neural-btn-content:empty
        )
    ) {
      --neural-button-icon-only-size: var(
        --neural-button-large-icon-only-size,
        3rem
      );
    }

    :where(.neural-btn-base:focus-visible) {
      outline: var(--neural-button-focus-ring, 2px solid #2563eb);
      outline-offset: var(--neural-button-focus-ring-offset, 2px);
    }

    :where(.neural-btn-base:hover:not(:disabled):not([aria-disabled='true'])) {
      color: var(
        --neural-button-color-hover,
        var(--neural-button-color, #ffffff)
      );
      background: var(
        --neural-button-background-hover,
        var(--neural-button-background, #3b82f6)
      );
      border-color: var(
        --neural-button-border-color-hover,
        var(--neural-button-border-color, transparent)
      );
      box-shadow: var(
        --neural-button-shadow-hover,
        var(--neural-button-shadow, none)
      );
    }

    :where(.neural-btn-base:active:not(:disabled):not([aria-disabled='true'])) {
      color: var(
        --neural-button-color-active,
        var(--neural-button-color, #ffffff)
      );
      background: var(
        --neural-button-background-active,
        var(--neural-button-background, #3b82f6)
      );
      border-color: var(
        --neural-button-border-color-active,
        var(--neural-button-border-color, transparent)
      );
      box-shadow: var(
        --neural-button-shadow-active,
        var(--neural-button-shadow, none)
      );
    }

    :where(.neural-btn-base:disabled) {
      opacity: var(--neural-button-disabled-opacity, 0.6);
      cursor: not-allowed;
    }

    :where(.neural-btn-base[aria-busy='true']) {
      cursor: progress;
    }

    :where(.neural-btn-outlined-base) {
      color: var(
        --neural-button-outlined-color,
        var(--neural-button-accent, var(--neural-button-color))
      );
      background: var(--neural-button-outlined-background, transparent);
      border-color: var(
        --neural-button-outlined-border-color,
        var(--neural-button-accent, var(--neural-button-border-color))
      );
      box-shadow: var(--neural-button-outlined-shadow, none);
    }

    :where(
      .neural-btn-outlined-base:hover:not(:disabled):not([aria-disabled='true'])
    ) {
      color: var(
        --neural-button-outlined-color-hover,
        var(--neural-button-accent-hover, var(--neural-button-accent))
      );
      background: var(
        --neural-button-outlined-background-hover,
        color-mix(
          in srgb,
          var(--neural-button-accent, currentColor) 10%,
          transparent
        )
      );
      border-color: var(
        --neural-button-outlined-border-color-hover,
        var(--neural-button-accent-hover, var(--neural-button-accent))
      );
    }

    :where(.neural-btn-text-base) {
      color: var(
        --neural-button-text-color,
        var(--neural-button-accent, var(--neural-button-color))
      );
      background: var(--neural-button-text-background, transparent);
      border-color: transparent;
      box-shadow: var(--neural-button-text-shadow, none);
    }

    :where(
      .neural-btn-text-base:hover:not(:disabled):not([aria-disabled='true'])
    ) {
      color: var(
        --neural-button-text-color-hover,
        var(--neural-button-accent-hover, var(--neural-button-accent))
      );
      background: var(
        --neural-button-text-background-hover,
        color-mix(
          in srgb,
          var(--neural-button-accent, currentColor) 10%,
          transparent
        )
      );
      border-color: transparent;
    }

    :where(.neural-btn-raised-base) {
      box-shadow: var(
        --neural-button-raised-shadow,
        0 8px 18px rgb(15 23 42 / 0.16)
      );
    }

    :where(
      .neural-btn-raised-base:hover:not(:disabled):not([aria-disabled='true'])
    ) {
      box-shadow: var(
        --neural-button-raised-shadow-hover,
        0 12px 24px rgb(15 23 42 / 0.2)
      );
    }

    :where(.neural-btn-rounded-base) {
      border-radius: var(--neural-button-rounded-radius, 999px);
    }

    :where(.neural-btn-primary-base) {
      --neural-button-accent: var(--neural-color-primary);
      --neural-button-accent-hover: var(--neural-color-primary-hover);
      --neural-button-color: var(
        --neural-button-primary-color,
        var(--neural-color-primary-contrast)
      );
      --neural-button-color-hover: var(
        --neural-button-primary-color-hover,
        var(--neural-color-primary-contrast)
      );
      --neural-button-color-active: var(
        --neural-button-primary-color-active,
        var(--neural-color-primary-contrast)
      );
      --neural-button-background: var(
        --neural-button-primary-background,
        var(--neural-color-primary)
      );
      --neural-button-background-hover: var(
        --neural-button-primary-background-hover,
        var(--neural-color-primary-hover)
      );
      --neural-button-background-active: var(
        --neural-button-primary-background-active,
        var(--neural-color-primary-active)
      );
      --neural-button-border-color: var(
        --neural-button-primary-border-color,
        var(--neural-color-primary)
      );
      --neural-button-border-color-hover: var(
        --neural-button-primary-border-color-hover,
        var(--neural-color-primary-hover)
      );
      --neural-button-border-color-active: var(
        --neural-button-primary-border-color-active,
        var(--neural-color-primary-active)
      );
    }

    :where(.neural-btn-secondary-base) {
      --neural-button-accent: var(--neural-color-text);
      --neural-button-accent-hover: var(--neural-color-text-strong);
      --neural-button-color: var(
        --neural-button-secondary-color,
        var(--neural-color-text)
      );
      --neural-button-color-hover: var(
        --neural-button-secondary-color-hover,
        var(--neural-color-text-strong)
      );
      --neural-button-color-active: var(
        --neural-button-secondary-color-active,
        var(--neural-color-text-strong)
      );
      --neural-button-background: var(
        --neural-button-secondary-background,
        var(--neural-color-surface-active)
      );
      --neural-button-background-hover: var(
        --neural-button-secondary-background-hover,
        var(--neural-color-surface-hover)
      );
      --neural-button-background-active: var(
        --neural-button-secondary-background-active,
        var(--neural-color-surface-active)
      );
      --neural-button-border-color: var(
        --neural-button-secondary-border-color,
        var(--neural-color-border)
      );
      --neural-button-border-color-hover: var(
        --neural-button-secondary-border-color-hover,
        var(--neural-color-border-hover)
      );
      --neural-button-border-color-active: var(
        --neural-button-secondary-border-color-active,
        var(--neural-color-border-active)
      );
    }

    :where(.neural-btn-neutral-base) {
      --neural-button-accent: var(--neural-color-text-strong);
      --neural-button-accent-hover: color-mix(
        in srgb,
        var(--neural-color-text-strong) 86%,
        var(--neural-color-surface)
      );
      --neural-button-color: var(--neural-color-surface);
      --neural-button-color-hover: var(--neural-color-surface);
      --neural-button-color-active: var(--neural-color-surface);
      --neural-button-background: var(--neural-color-text-strong);
      --neural-button-background-hover: color-mix(
        in srgb,
        var(--neural-color-text-strong) 86%,
        var(--neural-color-surface)
      );
      --neural-button-background-active: color-mix(
        in srgb,
        var(--neural-color-text-strong) 74%,
        var(--neural-color-surface)
      );
      --neural-button-border-color: transparent;
      --neural-button-border-color-hover: transparent;
      --neural-button-border-color-active: transparent;
    }

    :where(.neural-btn-info-base) {
      --neural-button-accent: var(--neural-color-info);
      --neural-button-accent-hover: color-mix(
        in srgb,
        var(--neural-color-info) 86%,
        black
      );
      --neural-button-background: var(
        --neural-button-info-background,
        var(--neural-color-info)
      );
      --neural-button-background-hover: var(
        --neural-button-info-background-hover,
        color-mix(in srgb, var(--neural-color-info) 86%, black)
      );
      --neural-button-background-active: var(
        --neural-button-info-background-active,
        color-mix(in srgb, var(--neural-color-info) 72%, black)
      );
      --neural-button-color: var(--neural-button-info-color, white);
      --neural-button-color-hover: var(--neural-button-info-color, white);
      --neural-button-color-active: var(--neural-button-info-color, white);
      --neural-button-border-color: transparent;
      --neural-button-border-color-hover: transparent;
      --neural-button-border-color-active: transparent;
    }

    :where(.neural-btn-success-base) {
      --neural-button-accent: var(--neural-color-success);
      --neural-button-accent-hover: color-mix(
        in srgb,
        var(--neural-color-success) 86%,
        black
      );
      --neural-button-background: var(
        --neural-button-success-background,
        var(--neural-color-success)
      );
      --neural-button-background-hover: var(
        --neural-button-success-background-hover,
        color-mix(in srgb, var(--neural-color-success) 86%, black)
      );
      --neural-button-background-active: var(
        --neural-button-success-background-active,
        color-mix(in srgb, var(--neural-color-success) 72%, black)
      );
      --neural-button-color: var(--neural-button-success-color, white);
      --neural-button-color-hover: var(--neural-button-success-color, white);
      --neural-button-color-active: var(--neural-button-success-color, white);
      --neural-button-border-color: transparent;
      --neural-button-border-color-hover: transparent;
      --neural-button-border-color-active: transparent;
    }

    :where(.neural-btn-warning-base) {
      --neural-button-accent: var(--neural-color-warning);
      --neural-button-accent-hover: color-mix(
        in srgb,
        var(--neural-color-warning) 88%,
        black
      );
      --neural-button-background: var(
        --neural-button-warning-background,
        var(--neural-color-warning)
      );
      --neural-button-background-hover: var(
        --neural-button-warning-background-hover,
        color-mix(in srgb, var(--neural-color-warning) 88%, black)
      );
      --neural-button-background-active: var(
        --neural-button-warning-background-active,
        color-mix(in srgb, var(--neural-color-warning) 74%, black)
      );
      --neural-button-color: var(--neural-button-warning-color, #422006);
      --neural-button-color-hover: var(--neural-button-warning-color, #422006);
      --neural-button-color-active: var(--neural-button-warning-color, #422006);
      --neural-button-border-color: transparent;
      --neural-button-border-color-hover: transparent;
      --neural-button-border-color-active: transparent;
    }

    :where(.neural-btn-error-base) {
      --neural-button-accent: var(--neural-color-error);
      --neural-button-accent-hover: color-mix(
        in srgb,
        var(--neural-color-error) 86%,
        black
      );
      --neural-button-background: var(
        --neural-button-error-background,
        var(--neural-color-error)
      );
      --neural-button-background-hover: var(
        --neural-button-error-background-hover,
        color-mix(in srgb, var(--neural-color-error) 86%, black)
      );
      --neural-button-background-active: var(
        --neural-button-error-background-active,
        color-mix(in srgb, var(--neural-color-error) 72%, black)
      );
      --neural-button-color: var(--neural-button-error-color, white);
      --neural-button-color-hover: var(--neural-button-error-color, white);
      --neural-button-color-active: var(--neural-button-error-color, white);
      --neural-button-border-color: transparent;
      --neural-button-border-color-hover: transparent;
      --neural-button-border-color-active: transparent;
    }
  `,
})
export class NeuralButton {
  private readonly neuralConfig = inject(NEURAL_NG_CONFIG);
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly loadingLabel = input<string>('Loading');
  readonly ariaLabel = input<string | null>(null);
  readonly ariaExpanded = input<'true' | 'false' | null>(null);
  readonly ariaControls = input<string | null>(null);
  readonly ariaKeyShortcuts = input<string | null>(null);
  readonly title = input<string>('');
  readonly label = input<string | null>(null);
  readonly icon = input<string | null>(null);
  readonly iconPosition = input<NeuralButtonIconPosition>('start');
  readonly size = input<NeuralButtonSize>('medium');
  readonly iconSize = input<NeuralButtonIconSize | null>(null);
  readonly severity = input<NeuralButtonSeverity>('neutral');
  readonly outlined = input(false, { transform: booleanAttribute });
  readonly raised = input(false, { transform: booleanAttribute });
  readonly text = input(false, { transform: booleanAttribute });
  readonly rounded = input(false, { transform: booleanAttribute });
  readonly badge = input<string | number | null | undefined>(null);
  readonly badgePosition = input<NeuralButtonBadgePosition>('end');
  readonly badgeSeverity = input<NeuralBadgeSeverity>('neutral');
  readonly badgeSize = input<NeuralBadgeSize>('small');
  readonly badgeMax = input<number | null>(null, {
    transform: numberAttribute,
  });
  readonly badgeAriaLabel = input<string | null>(null);
  readonly badgeClass = input('');

  // Applies consumer classes to the native <button>, not the component host.
  readonly buttonClass = input<string>('');

  // Removes the library's visual class while preserving button behavior.
  readonly unstyled = input<boolean>(false);

  readonly clicked = output<MouseEvent>();
  readonly keyDown = output<KeyboardEvent>();
  readonly pointerDown = output<PointerEvent>();
  readonly pointerMove = output<PointerEvent>();
  readonly pointerUp = output<PointerEvent>();
  readonly pointerCancel = output<PointerEvent>();
  private readonly ariaExpandedOverride = signal<'true' | 'false' | null>(null);
  private readonly ariaControlsOverride = signal<string | null>(null);
  protected readonly effectiveAriaExpanded = computed(
    () => this.ariaExpandedOverride() ?? this.ariaExpanded(),
  );
  protected readonly effectiveAriaControls = computed(
    () => this.ariaControlsOverride() ?? this.ariaControls(),
  );
  protected readonly effectiveUnstyled = computed(
    () => this.unstyled() || this.neuralConfig.unstyled,
  );
  protected readonly badgeHostClass = computed(() => {
    const position = this.badgePosition();
    const overlay =
      position === 'start' || position === 'end'
        ? ''
        : 'neural-btn-badge-overlay';
    return ['neural-btn-badge-host', overlay, `neural-btn-badge-${position}`]
      .filter(Boolean)
      .join(' ');
  });

  protected readonly computedAriaLabel = computed(() => {
    const ariaLabel = this.ariaLabel()?.trim();
    const loadingLabel = this.loadingLabel().trim();

    if (!ariaLabel) {
      return null;
    }

    return this.loading() && loadingLabel ? loadingLabel : ariaLabel;
  });

  protected readonly iconClass = computed(() => {
    const icon = this.icon()?.trim();
    if (!icon) return '';
    const visualSize = this.effectiveUnstyled()
      ? ''
      : `neural-btn-icon-${this.iconSize() ?? this.size()}-base`;
    return ['neural-btn-icon', visualSize, icon].filter(Boolean).join(' ');
  });

  protected readonly variantName = computed(() =>
    this.text() ? 'text' : this.outlined() ? 'outlined' : 'solid',
  );

  protected readonly computedClass = computed(() => {
    const classes = [
      'neural-btn-root',
      this.effectiveUnstyled() ? '' : 'neural-btn-base',
      this.effectiveUnstyled() || this.size() === 'medium'
        ? ''
        : `neural-btn-${this.size()}-base`,
      this.effectiveUnstyled() ? '' : `neural-btn-${this.severity()}-base`,
      this.effectiveUnstyled() || this.variantName() === 'solid'
        ? ''
        : `neural-btn-${this.variantName()}-base`,
      this.effectiveUnstyled() || !this.raised()
        ? ''
        : 'neural-btn-raised-base',
      this.effectiveUnstyled() || !this.rounded()
        ? ''
        : 'neural-btn-rounded-base',
      this.buttonClass().trim(),
    ];

    return classes.filter(Boolean).join(' ');
  });

  protected onClick(event: MouseEvent): void {
    if (this.disabled() || this.loading()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    this.clicked.emit(event);
  }

  setManagedAria(expanded: boolean, controls: string): void {
    this.ariaExpandedOverride.set(expanded ? 'true' : 'false');
    this.ariaControlsOverride.set(controls);
  }
}
