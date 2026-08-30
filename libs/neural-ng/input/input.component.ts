import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { NEURAL_FIELD_CONTEXT, NEURAL_NG_CONFIG } from '@neural-ng/core';
import type { NeuralInputSize, NeuralInputVariant } from './input.types';

@Component({
  // A custom element would lose native form behavior.
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'input[neuralInput]',
  exportAs: 'neuralInput',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: '',
  host: {
    class: 'neural-input-root',
    '[class.neural-input-base]': '!effectiveUnstyled()',
    '[class.neural-input-small-base]':
      "inputSize() === 'small' && !effectiveUnstyled()",
    '[class.neural-input-large-base]':
      "inputSize() === 'large' && !effectiveUnstyled()",
    '[class.neural-input-filled-base]':
      "variant() === 'filled' && !effectiveUnstyled()",
    '[class.neural-input-fluid-base]':
      'effectiveFluid() && !effectiveUnstyled()',
    '[attr.data-size]': 'inputSize()',
    '[attr.data-variant]': 'variant()',
  },
  styles: `
    :where(.neural-input-root) {
      box-sizing: border-box;
      min-width: 0;
      max-width: 100%;
    }

    :where(.neural-input-base) {
      width: var(--neural-input-width, auto);
      min-height: var(--neural-input-min-height, 2.5rem);
      padding: var(--neural-input-padding, 0.625rem 0.75rem);
      color: var(--neural-input-color, inherit);
      caret-color: var(--neural-input-caret-color, currentColor);
      background: var(--neural-input-background, transparent);
      border: var(--neural-input-border, 1px solid currentColor);
      border-radius: var(--neural-input-radius, 0.5rem);
      box-shadow: var(--neural-input-shadow, none);
      backdrop-filter: var(--neural-input-backdrop-filter, none);
      font-family: var(--neural-input-font-family, inherit);
      font-size: var(--neural-input-font-size, 0.875rem);
      font-weight: var(--neural-input-font-weight, 400);
      line-height: var(--neural-input-line-height, 1.25);
      outline: none;
      transition: var(--neural-input-transition, none);
    }

    :where(.neural-input-fluid-base) {
      width: 100%;
    }

    :where(.neural-input-small-base) {
      min-height: var(--neural-input-small-min-height, 2rem);
      padding: var(--neural-input-small-padding, 0.375rem 0.625rem);
      font-size: var(--neural-input-small-font-size, 0.8125rem);
    }

    :where(.neural-input-large-base) {
      min-height: var(--neural-input-large-min-height, 3rem);
      padding: var(--neural-input-large-padding, 0.75rem 1rem);
      font-size: var(--neural-input-large-font-size, 1rem);
    }

    :where(.neural-input-filled-base) {
      background: var(
        --neural-input-filled-background,
        var(--neural-input-background, transparent)
      );
      border-color: var(--neural-input-filled-border-color, transparent);
    }

    :where(.neural-input-filled-base:hover:not(:disabled):not([readonly])) {
      background: var(
        --neural-input-filled-background-hover,
        var(--neural-input-background-hover, transparent)
      );
      border-color: var(--neural-input-filled-border-color-hover, transparent);
    }

    :where(.neural-input-filled-base:focus-visible) {
      background: var(
        --neural-input-filled-background-focus,
        var(--neural-input-background-focus, transparent)
      );
      border-color: var(
        --neural-input-filled-border-color-focus,
        var(--neural-input-border-color-focus, currentColor)
      );
    }

    :where(.neural-input-base::placeholder) {
      color: var(--neural-input-placeholder-color, currentColor);
      opacity: var(--neural-input-placeholder-opacity, 1);
    }

    :where(.neural-input-base:hover:not(:disabled):not([readonly])) {
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

    :where(.neural-input-base:focus-visible) {
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

    :where(.neural-input-base[aria-invalid='true']) {
      color: var(
        --neural-input-color-invalid,
        var(--neural-input-color, inherit)
      );
      border-color: var(--neural-input-border-color-invalid, currentColor);
      box-shadow: var(--neural-input-shadow-invalid, none);
    }

    :where(.neural-input-base[aria-invalid='true']:focus-visible) {
      outline-color: var(--neural-input-focus-color-invalid, currentColor);
    }

    :where(.neural-input-base[readonly]) {
      color: var(
        --neural-input-color-readonly,
        var(--neural-input-color, inherit)
      );
      background: var(
        --neural-input-background-readonly,
        var(--neural-input-background, transparent)
      );
      cursor: var(--neural-input-readonly-cursor, default);
    }

    :where(.neural-input-base:disabled) {
      opacity: var(--neural-input-disabled-opacity, 0.5);
      cursor: not-allowed;
    }

    :where(.neural-input-root[type='search'])::-webkit-search-cancel-button {
      cursor: pointer !important;
    }

    @media (prefers-reduced-motion: reduce) {
      :where(.neural-input-base) {
        transition-duration: 0.01ms !important;
      }
    }
  `,
})
export class NeuralInput {
  private readonly neuralConfig = inject(NEURAL_NG_CONFIG);
  private readonly field = inject(NEURAL_FIELD_CONTEXT, { optional: true });
  private readonly elementRef =
    inject<ElementRef<HTMLInputElement>>(ElementRef);

  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly fluid = input(false, { transform: booleanAttribute });
  readonly inputSize = input<NeuralInputSize, NeuralInputSize | string>(
    'medium',
    { transform: normalizeInputSize },
  );
  readonly variant = input<NeuralInputVariant, NeuralInputVariant | string>(
    'outlined',
    { transform: normalizeInputVariant },
  );
  readonly effectiveUnstyled = computed(
    () =>
      this.unstyled() ||
      this.field?.effectiveUnstyled() ||
      this.neuralConfig.unstyled,
  );
  readonly effectiveFluid = computed(() => this.fluid() || this.field?.fluid());

  constructor() {
    if (!this.field) return;

    effect(() => {
      const element = this.elementRef.nativeElement;
      element.id = this.field?.controlId() ?? '';
      element.required = this.field?.required() ?? false;
      element.disabled = this.field?.disabled() ?? false;
      element.readOnly = this.field?.readonly() ?? false;
      syncAttribute(
        element,
        'aria-describedby',
        this.field?.controlDescribedBy() ?? null,
      );
      syncBooleanAttribute(
        element,
        'aria-invalid',
        this.field?.invalid() ?? false,
      );
      syncBooleanAttribute(
        element,
        'aria-busy',
        this.field?.pending() ?? false,
      );
      syncBooleanAttribute(
        element,
        'aria-required',
        this.field?.required() ?? false,
      );
    });
  }

  focus(options?: FocusOptions): void {
    this.elementRef.nativeElement.focus(options);
  }

  select(): void {
    this.elementRef.nativeElement.select();
  }
}

function normalizeInputSize(value: NeuralInputSize | string): NeuralInputSize {
  if (value === 'small' || value === 'medium' || value === 'large') {
    return value;
  }

  throw new Error(
    `NeuralInput inputSize must be small, medium, or large; received "${value}".`,
  );
}

function normalizeInputVariant(
  value: NeuralInputVariant | string,
): NeuralInputVariant {
  if (value === 'outlined' || value === 'filled') return value;

  throw new Error(
    `NeuralInput variant must be outlined or filled; received "${value}".`,
  );
}

function syncAttribute(
  element: HTMLElement,
  name: string,
  value: string | null,
): void {
  if (value === null) {
    element.removeAttribute(name);
    return;
  }

  element.setAttribute(name, value);
}

function syncBooleanAttribute(
  element: HTMLElement,
  name: string,
  value: boolean,
): void {
  syncAttribute(element, name, value ? 'true' : null);
}
