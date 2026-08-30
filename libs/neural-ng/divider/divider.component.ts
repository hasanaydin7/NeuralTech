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
import type {
  NeuralDividerAlign,
  NeuralDividerClasses,
  NeuralDividerOrientation,
  NeuralDividerType,
} from './divider.types';

@Component({
  selector: 'neural-divider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-divider-host' },
  template: `
    <div
      [class]="rootClass()"
      role="separator"
      [attr.aria-orientation]="orientation()"
      [attr.aria-label]="resolvedAriaLabel()"
      [attr.aria-labelledby]="normalizedAriaLabelledBy()"
      [attr.data-orientation]="orientation()"
      [attr.data-align]="align()"
      [attr.data-type]="type()"
    >
      <span [class]="beforeClass()" aria-hidden="true"></span>
      @if (normalizedLabel() !== null) {
        <span [class]="contentClass()">{{ normalizedLabel() }}</span>
      } @else {
        <span [class]="contentClass()"><ng-content /></span>
      }
      <span [class]="afterClass()" aria-hidden="true"></span>
    </div>
  `,
  styles: `
    :where(.neural-divider-host) {
      display: block;
    }

    :where(
      .neural-divider-root,
      .neural-divider-before-root,
      .neural-divider-content-root,
      .neural-divider-after-root
    ) {
      box-sizing: border-box;
    }

    :where(.neural-divider-root) {
      display: flex;
      flex: 0 0 auto;
      align-items: center;
    }

    :where(.neural-divider-horizontal-root) {
      width: 100%;
    }

    :where(.neural-divider-vertical-root) {
      flex-direction: column;
      align-self: stretch;
      height: 100%;
      min-height: var(--neural-divider-vertical-min-height, 2rem);
    }

    :where(.neural-divider-before-root),
    :where(.neural-divider-after-root) {
      flex: 1 1 auto;
      min-width: 0;
      min-height: 0;
    }

    :where(.neural-divider-horizontal-root)
      > :where(.neural-divider-before-root),
    :where(.neural-divider-horizontal-root)
      > :where(.neural-divider-after-root) {
      border-block-start-width: var(--neural-divider-width, 1px);
      border-block-start-color: var(
        --neural-divider-color,
        rgb(148 163 184 / 0.5)
      );
    }

    :where(.neural-divider-vertical-root) > :where(.neural-divider-before-root),
    :where(.neural-divider-vertical-root) > :where(.neural-divider-after-root) {
      border-inline-start-width: var(--neural-divider-width, 1px);
      border-inline-start-color: var(
        --neural-divider-color,
        rgb(148 163 184 / 0.5)
      );
    }

    :where(.neural-divider-solid-base) {
      border-style: solid;
    }

    :where(.neural-divider-dashed-base) {
      border-style: dashed;
    }

    :where(.neural-divider-dotted-base) {
      border-style: dotted;
    }

    :where(.neural-divider-content-root) {
      flex: 0 0 auto;
    }

    :where(.neural-divider-content-root:empty) {
      display: none;
    }

    :where(.neural-divider-content-base) {
      color: var(--neural-divider-content-color, CanvasText);
      font-family: var(--neural-divider-font-family, inherit);
      font-size: var(--neural-divider-font-size, 0.75rem);
      font-weight: var(--neural-divider-font-weight, 650);
      line-height: var(--neural-divider-line-height, 1.25);
    }

    :where(.neural-divider-horizontal-root)
      > :where(.neural-divider-content-base) {
      padding-inline: var(--neural-divider-content-gap, 0.75rem);
    }

    :where(.neural-divider-vertical-root)
      > :where(.neural-divider-content-base) {
      padding-block: var(--neural-divider-content-gap, 0.75rem);
      writing-mode: var(--neural-divider-vertical-writing-mode, vertical-rl);
    }

    :where(.neural-divider-root[data-align='start'])
      > :where(.neural-divider-before-root),
    :where(.neural-divider-root[data-align='end'])
      > :where(.neural-divider-after-root) {
      flex-grow: 0;
      flex-basis: var(--neural-divider-edge-size, 1.5rem);
    }

    :where(.neural-divider-base) {
      margin-block: var(--neural-divider-margin-block, 1rem);
    }

    :where(.neural-divider-vertical-base) {
      margin-block: 0;
      margin-inline: var(--neural-divider-margin-inline, 1rem);
    }
  `,
})
export class NeuralDivider {
  private readonly config = inject(NEURAL_NG_CONFIG);

  readonly orientation = input<NeuralDividerOrientation>('horizontal');
  readonly align = input<NeuralDividerAlign>('center');
  readonly type = input<NeuralDividerType>('solid');
  readonly label = input<string | null>(null);
  readonly ariaLabel = input<string | null>(null);
  readonly ariaLabelledBy = input<string | null>(null);
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly dividerClass = input('');
  readonly classes = input<NeuralDividerClasses>({});

  readonly effectiveUnstyled = computed(
    () => this.unstyled() || this.config.unstyled,
  );
  readonly normalizedLabel = computed(() => this.label()?.trim() || null);
  readonly normalizedAriaLabelledBy = computed(
    () => this.ariaLabelledBy()?.trim() || null,
  );
  readonly resolvedAriaLabel = computed(() =>
    this.normalizedAriaLabelledBy() ? null : this.ariaLabel()?.trim() || null,
  );
  readonly rootClass = computed(() =>
    [
      this.compose(
        'neural-divider-root',
        'neural-divider-base',
        this.dividerClass(),
        this.classes().root,
      ),
      `neural-divider-${this.orientation()}-root`,
      this.visualClass(`neural-divider-${this.orientation()}-base`),
    ]
      .filter(Boolean)
      .join(' '),
  );
  readonly beforeClass = computed(() => this.lineClass('before'));
  readonly afterClass = computed(() => this.lineClass('after'));
  readonly contentClass = computed(() =>
    this.compose(
      'neural-divider-content-root',
      'neural-divider-content-base',
      this.classes().content,
    ),
  );

  private lineClass(slot: 'before' | 'after'): string {
    return [
      this.compose(
        `neural-divider-${slot}-root`,
        'neural-divider-line-base',
        this.classes()[slot],
      ),
      this.visualClass(`neural-divider-${this.type()}-base`),
    ]
      .filter(Boolean)
      .join(' ');
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

/** @deprecated Use `NeuralDivider`. */
export { NeuralDivider as DividerComponent };
