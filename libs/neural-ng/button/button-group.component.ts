import {
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';
import { NEURAL_NG_CONFIG } from '@neural-ng/core';
import type { NeuralButtonGroupOrientation } from './button.types';

export interface NeuralButtonGroupClasses {
  /** The group container that owns the projected buttons and group semantics. */
  readonly root?: string;
}

@Component({
  selector: 'neural-button-group',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      role="group"
      [attr.aria-label]="ariaLabel()"
      [attr.data-orientation]="orientation()"
      [class]="computedClass()"
    >
      <ng-content></ng-content>
    </div>
  `,
  styles: `
    :where(.neural-button-group-root) {
      box-sizing: border-box;
      display: inline-flex;
      align-items: stretch;
    }

    :where(.neural-button-group-vertical-root) {
      flex-direction: column;
    }

    :where(.neural-button-group-base > neural-button) {
      display: inline-flex;
    }

    :where(.neural-button-group-base > neural-button > .neural-btn-root) {
      width: 100%;
      border-radius: 0;
    }

    :where(
      .neural-button-group-horizontal-root
        > neural-button:first-child
        > .neural-btn-root
    ) {
      border-start-start-radius: var(
        --neural-button-group-radius,
        var(--neural-button-radius)
      );
      border-end-start-radius: var(
        --neural-button-group-radius,
        var(--neural-button-radius)
      );
    }

    :where(
      .neural-button-group-horizontal-root
        > neural-button:last-child
        > .neural-btn-root
    ) {
      border-start-end-radius: var(
        --neural-button-group-radius,
        var(--neural-button-radius)
      );
      border-end-end-radius: var(
        --neural-button-group-radius,
        var(--neural-button-radius)
      );
    }

    :where(
      .neural-button-group-horizontal-root > neural-button + neural-button
    ) {
      margin-inline-start: calc(var(--neural-button-border-width, 1px) * -1);
    }

    :where(
      .neural-button-group-vertical-root
        > neural-button:first-child
        > .neural-btn-root
    ) {
      border-start-start-radius: var(
        --neural-button-group-radius,
        var(--neural-button-radius)
      );
      border-start-end-radius: var(
        --neural-button-group-radius,
        var(--neural-button-radius)
      );
    }

    :where(
      .neural-button-group-vertical-root
        > neural-button:last-child
        > .neural-btn-root
    ) {
      border-end-start-radius: var(
        --neural-button-group-radius,
        var(--neural-button-radius)
      );
      border-end-end-radius: var(
        --neural-button-group-radius,
        var(--neural-button-radius)
      );
    }

    :where(.neural-button-group-vertical-root > neural-button + neural-button) {
      margin-block-start: calc(var(--neural-button-border-width, 1px) * -1);
    }

    :where(.neural-button-group-base > neural-button:focus-within) {
      position: relative;
      z-index: 1;
    }
  `,
})
export class NeuralButtonGroup {
  private readonly neuralConfig = inject(NEURAL_NG_CONFIG);

  readonly orientation = input<NeuralButtonGroupOrientation>('horizontal');
  readonly ariaLabel = input<string | null>(null);
  readonly groupClass = input('');
  readonly classes = input<NeuralButtonGroupClasses>({});
  readonly unstyled = input(false, { transform: booleanAttribute });

  protected readonly effectiveUnstyled = computed(
    () => this.unstyled() || this.neuralConfig.unstyled,
  );

  protected readonly computedClass = computed(() =>
    [
      'neural-button-group-root',
      `neural-button-group-${this.orientation()}-root`,
      this.effectiveUnstyled() ? '' : 'neural-button-group-base',
      this.groupClass().trim(),
      this.classes().root,
    ]
      .filter(Boolean)
      .join(' '),
  );
}
