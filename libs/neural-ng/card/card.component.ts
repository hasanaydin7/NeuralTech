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
import type { NeuralCardClasses, NeuralCardRole } from './card.types';

@Component({
  selector: 'neural-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-card-host' },
  template: `
    <article
      [class]="rootClass()"
      [attr.role]="role()"
      [attr.aria-label]="normalizedAriaLabel()"
      [attr.aria-labelledby]="normalizedAriaLabelledby()"
    >
      <ng-content></ng-content>
    </article>
  `,
  styles: `
    :where(.neural-card-host),
    :where(.neural-card-section-host) {
      display: contents;
    }

    :where(.neural-card-root) {
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    :where(.neural-card-header-root) {
      box-sizing: border-box;
      display: flex;
      min-width: 0;
    }

    :where(.neural-card-body-root) {
      box-sizing: border-box;
      min-width: 0;
    }

    :where(.neural-card-footer-root) {
      box-sizing: border-box;
      display: flex;
      min-width: 0;
    }

    :where(.neural-card-base) {
      width: var(--neural-card-width, auto);
      color: var(--neural-card-color, inherit);
      background: var(--neural-card-background, transparent);
      border: var(--neural-card-border, 1px solid transparent);
      border-radius: var(--neural-card-radius, 0.75rem);
      box-shadow: var(--neural-card-shadow, none);
      backdrop-filter: var(--neural-card-backdrop-filter, none);
      font-family: var(--neural-card-font-family, inherit);
    }

    :where(.neural-card-header-base) {
      align-items: var(--neural-card-header-align, flex-start);
      justify-content: var(--neural-card-header-justify, space-between);
      gap: var(--neural-card-header-gap, 0.75rem);
      padding: var(--neural-card-header-padding, 1.25rem 1.25rem 0);
      border-bottom: var(--neural-card-header-border, 0 solid transparent);
    }

    :where(.neural-card-body-base) {
      padding: var(--neural-card-body-padding, 1.25rem);
      color: var(--neural-card-body-color, inherit);
    }

    :where(.neural-card-footer-base) {
      align-items: var(--neural-card-footer-align, center);
      justify-content: var(--neural-card-footer-justify, flex-start);
      gap: var(--neural-card-footer-gap, 0.75rem);
      padding: var(--neural-card-footer-padding, 0 1.25rem 1.25rem);
      border-top: var(--neural-card-footer-border, 0 solid transparent);
    }
  `,
})
export class NeuralCard {
  private readonly neuralConfig = inject(NEURAL_NG_CONFIG);

  readonly role = input<NeuralCardRole | null>(null);
  readonly ariaLabel = input<string | null>(null);
  readonly ariaLabelledby = input<string | null>(null);
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly cardClass = input('');
  readonly classes = input<NeuralCardClasses>({});

  readonly effectiveUnstyled = computed(
    () => this.unstyled() || this.neuralConfig.unstyled,
  );
  readonly normalizedAriaLabel = computed(
    () => this.ariaLabel()?.trim() || null,
  );
  readonly normalizedAriaLabelledby = computed(
    () => this.ariaLabelledby()?.trim() || null,
  );
  readonly rootClass = computed(() =>
    this.composeClass(
      'neural-card-root',
      'neural-card-base',
      this.cardClass(),
      this.classes().root,
    ),
  );

  composeSlotClass(
    slot: Exclude<keyof NeuralCardClasses, 'root'>,
    structural: string,
    visual: string,
    localClass: string,
  ): string {
    return this.composeClass(
      structural,
      visual,
      this.classes()[slot],
      localClass,
    );
  }

  private composeClass(
    structural: string,
    visual: string,
    ...consumerClasses: Array<string | undefined>
  ): string {
    return [
      structural,
      this.effectiveUnstyled() ? '' : visual,
      ...consumerClasses,
    ]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(' ');
  }
}

@Component({
  selector: 'neural-card-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-card-section-host' },
  template: `<header [class]="computedClass()"><ng-content /></header>`,
})
export class NeuralCardHeader {
  private readonly card = inject(NeuralCard, { host: true });
  readonly headerClass = input('');
  readonly computedClass = computed(() =>
    this.card.composeSlotClass(
      'header',
      'neural-card-header-root',
      'neural-card-header-base',
      this.headerClass(),
    ),
  );
}

@Component({
  selector: 'neural-card-body',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-card-section-host' },
  template: `<div [class]="computedClass()"><ng-content /></div>`,
})
export class NeuralCardBody {
  private readonly card = inject(NeuralCard, { host: true });
  readonly bodyClass = input('');
  readonly computedClass = computed(() =>
    this.card.composeSlotClass(
      'body',
      'neural-card-body-root',
      'neural-card-body-base',
      this.bodyClass(),
    ),
  );
}

@Component({
  selector: 'neural-card-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-card-section-host' },
  template: `<footer [class]="computedClass()"><ng-content /></footer>`,
})
export class NeuralCardFooter {
  private readonly card = inject(NeuralCard, { host: true });
  readonly footerClass = input('');
  readonly computedClass = computed(() =>
    this.card.composeSlotClass(
      'footer',
      'neural-card-footer-root',
      'neural-card-footer-base',
      this.footerClass(),
    ),
  );
}

/** @deprecated Import and use `NeuralCard` instead. */
export { NeuralCard as CardComponent };
/** @deprecated Import and use `NeuralCardHeader` instead. */
export { NeuralCardHeader as CardHeaderComponent };
/** @deprecated Import and use `NeuralCardBody` instead. */
export { NeuralCardBody as CardBodyComponent };
/** @deprecated Import and use `NeuralCardFooter` instead. */
export { NeuralCardFooter as CardFooterComponent };
