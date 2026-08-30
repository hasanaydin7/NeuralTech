import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChildren,
  forwardRef,
  inject,
  input,
} from '@angular/core';
import {
  NEURAL_FIELD_CONTEXT,
  NEURAL_NG_CONFIG,
  type NeuralFieldContext,
} from '@neural-ng/core';

@Directive({
  selector: 'label[neuralFieldLabel]',
  standalone: true,
  host: {
    class: 'neural-field__label',
    '[class.neural-field-label-base]': '!field.effectiveUnstyled()',
    '[class.neural-field__label--required]': 'field.required()',
    '[attr.for]': 'field.controlId()',
  },
})
export class NeuralFieldLabel {
  readonly field = inject(NEURAL_FIELD_CONTEXT, { host: true });
}

@Directive({
  selector: '[neuralFieldHint]',
  standalone: true,
  host: {
    class: 'neural-field__hint',
    '[class.neural-field-hint-base]': '!field.effectiveUnstyled()',
    '[id]': 'id()',
  },
})
export class NeuralFieldHint {
  readonly field = inject(NEURAL_FIELD_CONTEXT, { host: true });
  readonly id = computed(() => this.field.hintId(this));
}

@Directive({
  selector: '[neuralFieldError]',
  standalone: true,
  host: {
    class: 'neural-field__error',
    '[class.neural-field-error-base]': '!field.effectiveUnstyled()',
    '[id]': 'id()',
    '[attr.aria-live]': 'live()',
  },
})
export class NeuralFieldError {
  readonly field = inject(NEURAL_FIELD_CONTEXT, { host: true });
  readonly live = input<'off' | 'polite' | 'assertive'>('polite');
  readonly id = computed(() => this.field.errorId(this));
}

@Directive({
  selector: '[neuralFieldControl]',
  standalone: true,
  host: {
    class: 'neural-field__control',
    '[id]': 'field.controlId()',
    '[attr.aria-describedby]': 'field.controlDescribedBy()',
    '[attr.aria-invalid]': "field.invalid() ? 'true' : null",
    '[attr.aria-busy]': "field.pending() ? 'true' : null",
    '[attr.aria-required]': "field.required() ? 'true' : null",
    '[attr.required]': "field.required() ? '' : null",
    '[attr.disabled]': "field.disabled() ? '' : null",
    '[attr.readonly]': "field.readonly() ? '' : null",
  },
})
export class NeuralFieldControl {
  readonly field = inject(NEURAL_FIELD_CONTEXT, { host: true });
}

@Component({
  selector: 'neural-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NEURAL_FIELD_CONTEXT,
      useExisting: forwardRef(() => NeuralField),
    },
  ],
  template: `<ng-content />`,
  host: {
    class: 'neural-field-root',
    '[class.neural-field-base]': '!effectiveUnstyled()',
    '[class.neural-field-fluid-base]': 'fluid() && !effectiveUnstyled()',
    '[class.neural-field--invalid]': 'invalid()',
    '[class.neural-field--required]': 'required()',
    '[class.neural-field--disabled]': 'disabled()',
    '[class.neural-field--readonly]': 'readonly()',
    '[class.neural-field--pending]': 'pending()',
    '[attr.data-invalid]': "invalid() ? 'true' : null",
    '[attr.data-required]': "required() ? 'true' : null",
    '[attr.data-disabled]': "disabled() ? 'true' : null",
    '[attr.data-readonly]': "readonly() ? 'true' : null",
    '[attr.data-pending]': "pending() ? 'true' : null",
  },
  styles: `
    :where(.neural-field-root) {
      box-sizing: border-box;
      display: block;
      min-width: 0;
      max-width: 100%;
    }

    :where(.neural-field-base) {
      display: grid;
      gap: var(--neural-field-gap, 0.375rem);
      width: var(--neural-field-width, auto);
      color: var(--neural-field-color, inherit);
      font-family: var(--neural-field-font-family, inherit);
    }

    :where(.neural-field-fluid-base) {
      width: 100%;
    }

    :where(.neural-field-label-base) {
      display: inline-flex;
      gap: var(--neural-field-label-gap, 0.25rem);
      align-items: baseline;
      width: fit-content;
      color: var(--neural-field-label-color, inherit);
      font-size: var(--neural-field-label-font-size, 0.875rem);
      font-weight: var(--neural-field-label-font-weight, 600);
      line-height: var(--neural-field-label-line-height, 1.25);
    }

    :where(.neural-field-label-base.neural-field__label--required)::after {
      color: var(--neural-field-required-color, currentColor);
      content: var(--neural-field-required-content, '*');
    }

    :where(.neural-field-hint-base),
    :where(.neural-field-error-base) {
      margin: 0;
      font-size: var(--neural-field-message-font-size, 0.75rem);
      line-height: var(--neural-field-message-line-height, 1.4);
    }

    :where(.neural-field-hint-base) {
      color: var(--neural-field-hint-color, inherit);
    }

    :where(.neural-field-error-base) {
      color: var(--neural-field-error-color, currentColor);
      font-weight: var(--neural-field-error-font-weight, 500);
    }

    :where(.neural-field-base.neural-field--disabled) {
      opacity: var(--neural-field-disabled-opacity, 0.55);
    }

    :where(.neural-field-base.neural-field--pending) {
      cursor: var(--neural-field-pending-cursor, progress);
    }
  `,
})
export class NeuralField implements NeuralFieldContext {
  private readonly neuralConfig = inject(NEURAL_NG_CONFIG);

  readonly controlId = input.required<string, string>({
    transform: normalizeControlId,
  });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly pending = input(false, { transform: booleanAttribute });
  readonly fluid = input(false, { transform: booleanAttribute });
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly describedBy = input('');

  readonly hints = contentChildren(NeuralFieldHint, { descendants: true });
  readonly errors = contentChildren(NeuralFieldError, {
    descendants: true,
  });
  readonly effectiveUnstyled = computed(
    () => this.unstyled() || this.neuralConfig.unstyled,
  );
  readonly controlDescribedBy = computed(() => {
    const ids = [
      ...splitIds(this.describedBy()),
      ...this.hints().map((hint) => hint.id()),
      ...this.errors().map((error) => error.id()),
    ];
    const uniqueIds = [...new Set(ids)];
    return uniqueIds.length > 0 ? uniqueIds.join(' ') : null;
  });

  hintId(slot: object): string {
    return this.slotId('hint', this.hints().indexOf(slot as NeuralFieldHint));
  }

  errorId(slot: object): string {
    return this.slotId(
      'error',
      this.errors().indexOf(slot as NeuralFieldError),
    );
  }

  private slotId(kind: 'hint' | 'error', index: number): string {
    return `${this.controlId()}-${kind}${index > 0 ? `-${index + 1}` : ''}`;
  }
}

/** @deprecated Use `NeuralField`. */
export { NeuralField as FieldComponent };
/** @deprecated Use `NeuralFieldLabel`. */
export { NeuralFieldLabel as FieldLabelDirective };
/** @deprecated Use `NeuralFieldHint`. */
export { NeuralFieldHint as FieldHintDirective };
/** @deprecated Use `NeuralFieldError`. */
export { NeuralFieldError as FieldErrorDirective };
/** @deprecated Use `NeuralFieldControl`. */
export { NeuralFieldControl as FieldControlDirective };

function normalizeControlId(value: string): string {
  return value.trim().replace(/\s+/g, '-');
}

function splitIds(value: string): readonly string[] {
  return value.trim().split(/\s+/).filter(Boolean);
}
