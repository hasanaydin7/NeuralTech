import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';
import { NEURAL_NG_CONFIG } from '@neural-ng/core';

export interface NeuralInputGroupClasses {
  /** The outer container that owns the icons and projected input. */
  readonly root?: string;
  /** The icon rendered before the projected input. */
  readonly startIcon?: string;
  /** The icon rendered after the projected input. */
  readonly endIcon?: string;
}

@Component({
  selector: 'neural-input-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-input-group-host' },
  template: `
    <span [class]="computedClass()">
      @if (startIcon()) {
        <i [class]="startIconClass()" aria-hidden="true"></i>
      }
      <ng-content />
      @if (endIcon()) {
        <i [class]="endIconClass()" aria-hidden="true"></i>
      }
    </span>
  `,
  styles: `
    :where(.neural-input-group-host) {
      display: contents;
    }

    :where(.neural-input-group-root) {
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      min-width: 0;
      max-width: 100%;
    }

    :where(.neural-input-group-base) {
      width: var(--neural-input-group-width, auto);
      min-height: var(--neural-input-min-height, 2.5rem);
      color: var(--neural-input-color, inherit);
      background: var(--neural-input-background, transparent);
      border: var(--neural-input-border, 1px solid currentColor);
      border-radius: var(--neural-input-radius, 0.5rem);
      box-shadow: var(--neural-input-shadow, none);
      backdrop-filter: var(--neural-input-backdrop-filter, none);
      transition: var(--neural-input-transition, none);
    }

    :where(.neural-input-group-fluid-base) {
      width: 100%;
    }

    :where(.neural-input-group-icon-root) {
      display: inline-flex;
      flex: 0 0 auto;
      align-items: center;
      justify-content: center;
      color: var(--neural-input-icon-color, currentColor);
      font-size: var(--neural-input-icon-size, 1rem);
      line-height: 1;
      pointer-events: none;
    }

    :where(.neural-input-group-start-icon-root) {
      margin-inline-start: var(--neural-input-icon-offset, 0.75rem);
    }

    :where(.neural-input-group-end-icon-root) {
      margin-inline-end: var(--neural-input-icon-offset, 0.75rem);
    }

    .neural-input-group-root > .neural-input-root {
      flex: 1 1 auto;
      width: 100%;
      min-width: 0;
      background: transparent;
      border: 0;
      border-radius: 0;
      box-shadow: none;
      outline: none;
    }

    :where(.neural-input-group-base:hover:not(:has(input:disabled))) {
      color: var(
        --neural-input-color-hover,
        var(--neural-input-color, inherit)
      );
      background: var(
        --neural-input-background-hover,
        var(--neural-input-background, transparent)
      );
      border-color: var(--neural-input-border-color-hover, currentColor);
      box-shadow: var(
        --neural-input-shadow-hover,
        var(--neural-input-shadow, none)
      );
    }

    :where(.neural-input-group-base:has(input:focus-visible)) {
      color: var(
        --neural-input-color-focus,
        var(--neural-input-color, inherit)
      );
      background: var(
        --neural-input-background-focus,
        var(--neural-input-background, transparent)
      );
      border-color: var(--neural-input-border-color-focus, currentColor);
      box-shadow: var(--neural-input-shadow-focus, none);
      outline: var(--neural-input-focus-ring, 2px solid currentColor);
      outline-offset: var(--neural-input-focus-ring-offset, 2px);
    }

    :where(.neural-input-group-base:has(input[aria-invalid='true'])) {
      color: var(
        --neural-input-color-invalid,
        var(--neural-input-color, inherit)
      );
      border-color: var(--neural-input-border-color-invalid, currentColor);
      box-shadow: var(--neural-input-shadow-invalid, none);
    }

    :where(.neural-input-group-base:has(input:disabled)) {
      opacity: var(--neural-input-disabled-opacity, 0.5);
      cursor: not-allowed;
    }

    @media (prefers-reduced-motion: reduce) {
      :where(.neural-input-group-base) {
        transition-duration: 0.01ms !important;
      }
    }
  `,
})
export class NeuralInputGroup {
  private readonly neuralConfig = inject(NEURAL_NG_CONFIG);

  readonly startIcon = input<string | null>(null);
  readonly endIcon = input<string | null>(null);
  readonly fluid = input(false, { transform: booleanAttribute });
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly inputGroupClass = input('');
  readonly iconClass = input('');
  readonly classes = input<NeuralInputGroupClasses>({});

  protected readonly effectiveUnstyled = computed(
    () => this.unstyled() || this.neuralConfig.unstyled,
  );
  protected readonly computedClass = computed(() =>
    [
      'neural-input-group-root',
      this.effectiveUnstyled() ? '' : 'neural-input-group-base',
      this.effectiveUnstyled() || !this.fluid()
        ? ''
        : 'neural-input-group-fluid-base',
      this.inputGroupClass().trim(),
      this.classes().root,
    ]
      .filter(Boolean)
      .join(' '),
  );
  protected readonly startIconClass = computed(() =>
    this.composeIconClass(
      this.startIcon(),
      'neural-input-group-start-icon-root',
      this.classes().startIcon,
    ),
  );
  protected readonly endIconClass = computed(() =>
    this.composeIconClass(
      this.endIcon(),
      'neural-input-group-end-icon-root',
      this.classes().endIcon,
    ),
  );

  private composeIconClass(
    icon: string | null,
    positionClass: string,
    slotClass: string | undefined,
  ): string {
    return [
      'neural-input-group-icon-root',
      positionClass,
      this.effectiveUnstyled() ? '' : 'neural-input-group-icon-base',
      icon?.trim(),
      this.iconClass().trim(),
      slotClass,
    ]
      .filter(Boolean)
      .join(' ');
  }
}
