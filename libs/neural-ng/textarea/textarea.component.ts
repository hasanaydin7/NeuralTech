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
import type { NeuralTextareaResizeMode } from './textarea.types';

export interface NeuralTextareaClasses {
  /** The native textarea element enhanced by the `neuralTextarea` directive. */
  readonly root?: string;
}

@Component({
  // A custom element would lose native textarea and form behavior.
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'textarea[neuralTextarea]',
  exportAs: 'neuralTextarea',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: '',
  host: {
    class: 'neural-textarea-root',
    '[class]': 'classes().root ?? ""',
    '[class.neural-textarea-base]': '!effectiveUnstyled()',
    '[class.neural-textarea-fluid-base]':
      'effectiveFluid() && !effectiveUnstyled()',
    '[class.neural-textarea-auto-resize-base]':
      'autoResize() && !effectiveUnstyled()',
    '[class.neural-textarea-resize-vertical-base]':
      "!autoResize() && resizeMode() === 'vertical' && !effectiveUnstyled()",
    '[class.neural-textarea-resize-horizontal-base]':
      "!autoResize() && resizeMode() === 'horizontal' && !effectiveUnstyled()",
    '[class.neural-textarea-resize-both-base]':
      "!autoResize() && resizeMode() === 'both' && !effectiveUnstyled()",
    '[class.neural-textarea-resize-none-base]':
      "!autoResize() && resizeMode() === 'none' && !effectiveUnstyled()",
    '[attr.data-auto-resize]': "autoResize() ? 'true' : null",
    '[attr.data-resize-mode]': 'effectiveResizeMode()',
  },
  styles: `
    :where(.neural-textarea-root) {
      box-sizing: border-box;
      min-width: 0;
      max-width: 100%;
    }

    :where(.neural-textarea-base) {
      display: block;
      width: var(--neural-textarea-width, auto);
      min-height: var(--neural-textarea-min-height, 6rem);
      padding: var(--neural-textarea-padding, 0.625rem 0.75rem);
      color: var(--neural-textarea-color, inherit);
      caret-color: var(--neural-textarea-caret-color, currentColor);
      background: var(--neural-textarea-background, transparent);
      border: var(--neural-textarea-border, 1px solid currentColor);
      border-radius: var(--neural-textarea-radius, 0.5rem);
      box-shadow: var(--neural-textarea-shadow, none);
      backdrop-filter: var(--neural-textarea-backdrop-filter, none);
      font-family: var(--neural-textarea-font-family, inherit);
      font-size: var(--neural-textarea-font-size, 0.875rem);
      font-weight: var(--neural-textarea-font-weight, 400);
      line-height: var(--neural-textarea-line-height, 1.5);
      outline: none;
      transition: var(--neural-textarea-transition, none);
    }

    :where(.neural-textarea-fluid-base) {
      width: 100%;
    }

    :where(.neural-textarea-auto-resize-base) {
      min-block-size: var(--neural-textarea-auto-min-block-size, 6rem);
      max-block-size: var(--neural-textarea-auto-max-block-size, 24rem);
      overflow-y: auto;
      field-sizing: content;
      resize: none;
    }

    :where(.neural-textarea-resize-vertical-base) {
      resize: vertical;
    }

    :where(.neural-textarea-resize-horizontal-base) {
      resize: horizontal;
    }

    :where(.neural-textarea-resize-both-base) {
      resize: both;
    }

    :where(.neural-textarea-resize-none-base) {
      resize: none;
    }

    :where(.neural-textarea-base::placeholder) {
      color: var(--neural-textarea-placeholder-color, currentColor);
      opacity: var(--neural-textarea-placeholder-opacity, 1);
    }

    :where(.neural-textarea-base:hover:not(:disabled):not([readonly])) {
      color: var(
        --neural-textarea-color-hover,
        var(--neural-textarea-color, inherit)
      );
      background: var(
        --neural-textarea-background-hover,
        var(--neural-textarea-background, transparent)
      );
      border-color: var(--neural-textarea-border-color-hover, currentColor);
      box-shadow: var(
        --neural-textarea-shadow-hover,
        var(--neural-textarea-shadow, none)
      );
    }

    :where(.neural-textarea-base:focus-visible) {
      color: var(
        --neural-textarea-color-focus,
        var(--neural-textarea-color, inherit)
      );
      background: var(
        --neural-textarea-background-focus,
        var(--neural-textarea-background, transparent)
      );
      border-color: var(--neural-textarea-border-color-focus, currentColor);
      box-shadow: var(--neural-textarea-shadow-focus, none);
      outline: var(--neural-textarea-focus-ring, 2px solid currentColor);
      outline-offset: var(--neural-textarea-focus-ring-offset, 2px);
    }

    :where(.neural-textarea-base[aria-invalid='true']) {
      color: var(
        --neural-textarea-color-invalid,
        var(--neural-textarea-color, inherit)
      );
      border-color: var(--neural-textarea-border-color-invalid, currentColor);
      box-shadow: var(--neural-textarea-shadow-invalid, none);
    }

    :where(.neural-textarea-base[aria-invalid='true']:focus-visible) {
      outline-color: var(--neural-textarea-focus-color-invalid, currentColor);
    }

    :where(.neural-textarea-base[readonly]) {
      color: var(
        --neural-textarea-color-readonly,
        var(--neural-textarea-color, inherit)
      );
      background: var(
        --neural-textarea-background-readonly,
        var(--neural-textarea-background, transparent)
      );
      cursor: var(--neural-textarea-readonly-cursor, default);
    }

    :where(.neural-textarea-base:disabled) {
      opacity: var(--neural-textarea-disabled-opacity, 0.5);
      cursor: not-allowed;
    }

    @media (prefers-reduced-motion: reduce) {
      :where(.neural-textarea-base) {
        transition-duration: 0.01ms !important;
      }
    }
  `,
})
export class NeuralTextarea {
  private readonly neuralConfig = inject(NEURAL_NG_CONFIG);
  private readonly field = inject(NEURAL_FIELD_CONTEXT, { optional: true });
  private readonly elementRef =
    inject<ElementRef<HTMLTextAreaElement>>(ElementRef);

  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly fluid = input(false, { transform: booleanAttribute });
  readonly autoResize = input(false, { transform: booleanAttribute });
  readonly resizeMode = input<NeuralTextareaResizeMode>('vertical');
  readonly classes = input<NeuralTextareaClasses>({});
  readonly effectiveUnstyled = computed(
    () =>
      this.unstyled() ||
      this.field?.effectiveUnstyled() ||
      this.neuralConfig.unstyled,
  );
  readonly effectiveFluid = computed(() => this.fluid() || this.field?.fluid());
  readonly effectiveResizeMode = computed<NeuralTextareaResizeMode>(() =>
    this.autoResize() ? 'none' : this.resizeMode(),
  );

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

/** @deprecated Use NeuralTextarea. */
export { NeuralTextarea as TextareaComponent };

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
