import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { NEURAL_NG_CONFIG } from '@neural-ng/core';
import type {
  NeuralTagClasses,
  NeuralTagRemove,
  NeuralTagSeverity,
  NeuralTagSize,
} from './tag.types';

@Component({
  selector: 'neural-tag',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-tag-host' },
  template: `
    <span
      [class]="rootClass()"
      [attr.data-severity]="severity()"
      [attr.data-size]="size()"
      [attr.data-rounded]="rounded() ? 'true' : null"
      [attr.data-removable]="removable() ? 'true' : null"
      [attr.aria-disabled]="disabled() ? 'true' : null"
    >
      @if (normalizedIconClass()) {
        <i
          [class]="iconClassName()"
          [attr.aria-hidden]="iconAriaLabel() ? null : 'true'"
          [attr.aria-label]="iconAriaLabel()"
        ></i>
      }

      @if (normalizedValue() !== null) {
        <span [class]="labelClass()">{{ normalizedValue() }}</span>
      } @else {
        <span [class]="contentClass()"><ng-content /></span>
      }

      @if (removable()) {
        <button
          type="button"
          [class]="removeButtonClass()"
          [disabled]="disabled()"
          [attr.aria-label]="computedRemoveLabel()"
          (click)="remove($event)"
        >
          <i [class]="removeIconClassName()" aria-hidden="true"></i>
        </button>
      }
    </span>
  `,
  styles: `
    :where(.neural-tag-host) {
      display: inline-flex;
      vertical-align: middle;
    }

    :where(
      .neural-tag-root,
      .neural-tag-icon-root,
      .neural-tag-label-root,
      .neural-tag-content-root,
      .neural-tag-remove-root,
      .neural-tag-remove-icon-root
    ) {
      box-sizing: border-box;
    }

    :where(.neural-tag-root) {
      display: inline-flex;
      flex: 0 0 auto;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
    }

    :where(.neural-tag-base) {
      min-height: var(--neural-tag-height, 1.75rem);
      gap: var(--neural-tag-gap, 0.375rem);
      padding: var(--neural-tag-padding, 0.25rem 0.625rem);
      color: var(--neural-tag-color, CanvasText);
      background: var(--neural-tag-background, Canvas);
      border: var(--neural-tag-border, 1px solid currentColor);
      border-radius: var(--neural-tag-radius, 0.375rem);
      box-shadow: var(--neural-tag-shadow, none);
      font-family: var(--neural-tag-font-family, inherit);
      font-size: var(--neural-tag-font-size, 0.75rem);
      font-weight: var(--neural-tag-font-weight, 650);
      line-height: var(--neural-tag-line-height, 1.2);
    }

    :where(.neural-tag-rounded-base) {
      border-radius: var(--neural-tag-rounded-radius, 999px);
    }

    :where(.neural-tag-small-base) {
      min-height: var(--neural-tag-small-height, 1.375rem);
      gap: var(--neural-tag-small-gap, 0.25rem);
      padding: var(--neural-tag-small-padding, 0.125rem 0.4375rem);
      font-size: var(--neural-tag-small-font-size, 0.6875rem);
    }

    :where(.neural-tag-large-base) {
      min-height: var(--neural-tag-large-height, 2.125rem);
      gap: var(--neural-tag-large-gap, 0.5rem);
      padding: var(--neural-tag-large-padding, 0.375rem 0.75rem);
      font-size: var(--neural-tag-large-font-size, 0.875rem);
    }

    :where(.neural-tag-neutral-base) {
      color: var(
        --neural-tag-neutral-color,
        var(--neural-tag-color, CanvasText)
      );
      background: var(
        --neural-tag-neutral-background,
        var(--neural-tag-background, Canvas)
      );
      border-color: var(--neural-tag-neutral-border-color, currentColor);
    }

    :where(.neural-tag-primary-base) {
      color: var(
        --neural-tag-primary-color,
        var(--neural-color-primary-contrast)
      );
      background: var(
        --neural-tag-primary-background,
        var(--neural-color-primary)
      );
      border-color: var(
        --neural-tag-primary-border-color,
        var(--neural-color-primary)
      );
    }

    :where(.neural-tag-secondary-base) {
      color: var(--neural-tag-secondary-color, var(--neural-color-text));
      background: var(
        --neural-tag-secondary-background,
        var(--neural-color-surface-active)
      );
      border-color: var(
        --neural-tag-secondary-border-color,
        var(--neural-color-border)
      );
    }

    :where(.neural-tag-info-base) {
      color: var(--neural-tag-info-color, inherit);
      background: var(--neural-tag-info-background, transparent);
      border-color: var(--neural-tag-info-border-color, currentColor);
    }

    :where(.neural-tag-success-base) {
      color: var(--neural-tag-success-color, inherit);
      background: var(--neural-tag-success-background, transparent);
      border-color: var(--neural-tag-success-border-color, currentColor);
    }

    :where(.neural-tag-warning-base) {
      color: var(--neural-tag-warning-color, inherit);
      background: var(--neural-tag-warning-background, transparent);
      border-color: var(--neural-tag-warning-border-color, currentColor);
    }

    :where(.neural-tag-error-base) {
      color: var(--neural-tag-error-color, inherit);
      background: var(--neural-tag-error-background, transparent);
      border-color: var(--neural-tag-error-border-color, currentColor);
    }

    :where(.neural-tag-icon-root) {
      flex: 0 0 auto;
      color: var(--neural-tag-icon-color, currentColor);
      font-size: var(--neural-tag-icon-size, 1em);
    }

    :where(.neural-tag-content-root) {
      display: inline-flex;
      align-items: center;
      gap: var(--neural-tag-content-gap, 0.25rem);
    }

    :where(.neural-tag-remove-root) {
      display: inline-flex;
      flex: 0 0 auto;
      align-items: center;
      justify-content: center;
      width: var(--neural-tag-remove-size, 1.125rem);
      height: var(--neural-tag-remove-size, 1.125rem);
      margin: var(--neural-tag-remove-margin, 0 -0.25rem 0 0);
      padding: 0;
      color: var(--neural-tag-remove-color, currentColor);
      background: var(--neural-tag-remove-background, transparent);
      border: 0;
      border-radius: var(--neural-tag-remove-radius, 999px);
      cursor: pointer;
    }

    :where(.neural-tag-remove-base:hover:not(:disabled)) {
      color: var(--neural-tag-remove-color-hover, currentColor);
      background: var(--neural-tag-remove-background-hover, rgb(0 0 0 / 0.1));
    }

    :where(.neural-tag-remove-base:focus-visible) {
      outline: var(--neural-tag-focus-ring, 2px solid currentColor);
      outline-offset: var(--neural-tag-focus-ring-offset, 1px);
    }

    :where(.neural-tag-remove-base:disabled) {
      cursor: not-allowed;
    }

    :where(.neural-tag-root[aria-disabled='true']) {
      opacity: var(--neural-tag-disabled-opacity, 0.5);
    }

    :where(.neural-tag-remove-icon-root) {
      font-size: var(--neural-tag-remove-icon-size, 0.875rem);
    }
  `,
})
export class NeuralTag {
  private readonly config = inject(NEURAL_NG_CONFIG);

  readonly value = input<string | null | undefined>(null);
  readonly severity = input<NeuralTagSeverity>('neutral');
  readonly size = input<NeuralTagSize>('medium');
  readonly rounded = input(true, { transform: booleanAttribute });
  readonly iconClass = input<string | null>(null);
  readonly iconAriaLabel = input<string | null>(null);
  readonly removable = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly removeLabel = input<string | null>(null);
  readonly removeIconClass = input('nt nt-x');
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly tagClass = input('');
  readonly classes = input<NeuralTagClasses>({});

  readonly removed = output<NeuralTagRemove>();

  readonly effectiveUnstyled = computed(
    () => this.unstyled() || this.config.unstyled,
  );
  readonly normalizedValue = computed(() => {
    const value = this.value();
    return value === null || value === undefined ? null : value;
  });
  readonly normalizedIconClass = computed(
    () => this.iconClass()?.trim() || null,
  );
  readonly computedRemoveLabel = computed(() => {
    const explicit = this.removeLabel()?.trim();
    if (explicit) return explicit;
    const value = this.normalizedValue()?.trim();
    return value ? `Remove ${value}` : 'Remove tag';
  });
  readonly rootClass = computed(() =>
    [
      this.compose(
        'neural-tag-root',
        'neural-tag-base',
        this.tagClass(),
        this.classes().root,
      ),
      this.visualClass(`neural-tag-${this.severity()}-base`),
      this.size() === 'medium'
        ? ''
        : this.visualClass(`neural-tag-${this.size()}-base`),
      this.rounded() ? this.visualClass('neural-tag-rounded-base') : '',
    ]
      .filter(Boolean)
      .join(' '),
  );
  readonly iconClassName = computed(() =>
    this.compose(
      'neural-tag-icon-root',
      'neural-tag-icon-base',
      this.normalizedIconClass() ?? '',
      this.classes().icon,
    ),
  );
  readonly labelClass = computed(() =>
    this.compose(
      'neural-tag-label-root',
      'neural-tag-label-base',
      this.classes().label,
    ),
  );
  readonly contentClass = computed(() =>
    this.compose(
      'neural-tag-content-root',
      'neural-tag-content-base',
      this.classes().content,
    ),
  );
  readonly removeButtonClass = computed(() =>
    this.compose(
      'neural-tag-remove-root',
      'neural-tag-remove-base',
      this.classes().removeButton,
    ),
  );
  readonly removeIconClassName = computed(() =>
    this.compose(
      'neural-tag-remove-icon-root',
      'neural-tag-remove-icon-base',
      this.removeIconClass(),
      this.classes().removeIcon,
    ),
  );

  protected remove(event: MouseEvent): void {
    event.stopPropagation();
    if (this.disabled()) return;
    this.removed.emit({
      value: this.normalizedValue(),
      originalEvent: event,
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

/** @deprecated Use NeuralTag. */
export { NeuralTag as TagComponent };
