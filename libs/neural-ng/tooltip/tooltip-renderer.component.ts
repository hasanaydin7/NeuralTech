import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';
import type {
  NeuralTooltipClasses,
  NeuralTooltipPosition,
} from './tooltip.types';

@Component({
  selector: 'neural-tooltip-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'rootClass()',
    '[attr.data-position]': 'position()',
    '[attr.data-open]': 'open() ? "true" : null',
    role: 'tooltip',
  },
  template: `
    <span [class]="contentClass()">{{ content() }}</span>
    <span [class]="arrowClass()" aria-hidden="true"></span>
  `,
  styles: `
    :where(.neural-tooltip-root) {
      position: fixed;
      inset: unset;
      z-index: var(--neural-tooltip-z-index, 1100);
      box-sizing: border-box;
      width: max-content;
      max-width: min(
        var(--neural-tooltip-max-width, 18rem),
        calc(100vw - 1rem)
      );
      margin: 0;
      padding: 0;
      overflow: visible;
      pointer-events: none;
      border: 0;
      background: transparent;
    }

    :where(.neural-tooltip-content-root) {
      box-sizing: border-box;
      display: block;
    }

    :where(.neural-tooltip-arrow-root) {
      position: absolute;
      box-sizing: border-box;
      width: var(--neural-tooltip-arrow-size, 0.5rem);
      height: var(--neural-tooltip-arrow-size, 0.5rem);
      pointer-events: none;
    }

    :where(.neural-tooltip-base) {
      color: var(--neural-tooltip-color, Canvas);
      font-family: var(--neural-tooltip-font-family, inherit);
      font-size: var(--neural-tooltip-font-size, 0.75rem);
      line-height: var(--neural-tooltip-line-height, 1.4);
      opacity: 0;
      transform: scale(var(--neural-tooltip-enter-scale, 0.96));
      transition:
        opacity var(--neural-tooltip-enter-duration, 120ms)
          var(--neural-tooltip-enter-easing, ease-out),
        transform var(--neural-tooltip-enter-duration, 120ms)
          var(--neural-tooltip-enter-easing, ease-out),
        overlay var(--neural-tooltip-leave-duration, 90ms) allow-discrete,
        display var(--neural-tooltip-leave-duration, 90ms) allow-discrete;
    }

    :where(.neural-tooltip-base[data-open='true']),
    :where(.neural-tooltip-base:popover-open) {
      opacity: 1;
      transform: none;
    }

    @starting-style {
      :where(.neural-tooltip-base[data-open='true']),
      :where(.neural-tooltip-base:popover-open) {
        opacity: 0;
        transform: scale(var(--neural-tooltip-enter-scale, 0.96));
      }
    }

    :where(.neural-tooltip-content-base) {
      padding: var(--neural-tooltip-padding, 0.45rem 0.65rem);
      color: var(--neural-tooltip-color, #f8fafc);
      background: var(--neural-tooltip-background, #172033);
      border: var(--neural-tooltip-border, 1px solid transparent);
      border-radius: var(--neural-tooltip-radius, 0.45rem);
      box-shadow: var(--neural-tooltip-shadow, 0 8px 24px rgb(15 23 42 / 0.2));
      font-weight: var(--neural-tooltip-font-weight, 600);
      overflow-wrap: anywhere;
    }

    :where(.neural-tooltip-arrow-base) {
      background: var(--neural-tooltip-background, #172033);
      transform: rotate(45deg);
    }

    :where(.neural-tooltip-root[data-position^='top'])
      .neural-tooltip-arrow-root {
      inset-block-end: calc(var(--neural-tooltip-arrow-size, 0.5rem) / -2);
      inset-inline-start: calc(
        50% - var(--neural-tooltip-arrow-size, 0.5rem) / 2
      );
    }

    :where(.neural-tooltip-root[data-position^='bottom'])
      .neural-tooltip-arrow-root {
      inset-block-start: calc(var(--neural-tooltip-arrow-size, 0.5rem) / -2);
      inset-inline-start: calc(
        50% - var(--neural-tooltip-arrow-size, 0.5rem) / 2
      );
    }

    :where(.neural-tooltip-root[data-position$='-start'])
      .neural-tooltip-arrow-root {
      inset-inline-start: var(--neural-tooltip-arrow-corner-offset, 0.875rem);
    }

    :where(.neural-tooltip-root[data-position$='-end'])
      .neural-tooltip-arrow-root {
      inset-inline-start: auto;
      inset-inline-end: var(--neural-tooltip-arrow-corner-offset, 0.875rem);
    }

    :where(.neural-tooltip-root[data-position='left'])
      .neural-tooltip-arrow-root {
      inset-block-start: calc(
        50% - var(--neural-tooltip-arrow-size, 0.5rem) / 2
      );
      inset-inline-end: calc(var(--neural-tooltip-arrow-size, 0.5rem) / -2);
    }

    :where(.neural-tooltip-root[data-position='right'])
      .neural-tooltip-arrow-root {
      inset-block-start: calc(
        50% - var(--neural-tooltip-arrow-size, 0.5rem) / 2
      );
      inset-inline-start: calc(var(--neural-tooltip-arrow-size, 0.5rem) / -2);
    }

    @media (prefers-reduced-motion: reduce) {
      :where(.neural-tooltip-base) {
        transition-duration: 0.01ms;
      }
    }
  `,
})
export class TooltipRendererComponent {
  readonly content = input('');
  readonly position = input<NeuralTooltipPosition>('top');
  readonly open = input(false, { transform: booleanAttribute });
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly tooltipClass = input('');
  readonly classes = input<NeuralTooltipClasses>({});

  readonly rootClass = computed(() =>
    this.compose(
      'neural-tooltip-root',
      'neural-tooltip-base',
      this.tooltipClass(),
      this.classes().root,
    ),
  );
  readonly contentClass = computed(() =>
    this.compose(
      'neural-tooltip-content-root',
      'neural-tooltip-content-base',
      this.classes().content,
    ),
  );
  readonly arrowClass = computed(() =>
    this.compose(
      'neural-tooltip-arrow-root',
      'neural-tooltip-arrow-base',
      this.classes().arrow,
    ),
  );

  private compose(
    structural: string,
    visual: string,
    ...consumerClasses: Array<string | undefined>
  ): string {
    return [structural, this.unstyled() ? '' : visual, ...consumerClasses]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(' ');
  }
}
