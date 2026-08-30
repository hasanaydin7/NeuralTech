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
  NeuralSkeletonAnimation,
  NeuralSkeletonClasses,
  NeuralSkeletonShape,
} from './skeleton.types';

@Component({
  selector: 'neural-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-skeleton-host' },
  template: `
    <span
      [class]="rootClass()"
      aria-hidden="true"
      [attr.data-shape]="shape()"
      [attr.data-animation]="animation()"
      [style.width]="resolvedWidth()"
      [style.height]="resolvedHeight()"
      [style.border-radius]="normalizedBorderRadius()"
    >
      <span [class]="effectClass()"></span>
    </span>
  `,
  styles: `
    :where(.neural-skeleton-host) {
      display: block;
    }

    :where(.neural-skeleton-root, .neural-skeleton-effect-root) {
      box-sizing: border-box;
    }

    :where(.neural-skeleton-root) {
      position: relative;
      display: block;
      overflow: hidden;
    }

    :where(.neural-skeleton-effect-root) {
      position: absolute;
      inset: 0;
      display: block;
      pointer-events: none;
    }

    :where(.neural-skeleton-base) {
      background: var(--neural-skeleton-background, rgb(148 163 184 / 0.24));
      border-radius: var(--neural-skeleton-rectangle-radius, 0.25rem);
    }

    :where(.neural-skeleton-rounded-base) {
      border-radius: var(--neural-skeleton-rounded-radius, 0.75rem);
    }

    :where(.neural-skeleton-circle-base) {
      border-radius: 50%;
    }

    :where(.neural-skeleton-pulse-base) {
      animation: neural-skeleton-pulse
        var(--neural-skeleton-pulse-duration, 1.5s)
        var(--neural-skeleton-pulse-easing, ease-in-out) infinite;
    }

    :where(.neural-skeleton-wave-effect-base) {
      inset: 0 auto 0 0;
      width: var(--neural-skeleton-wave-width, 65%);
      background: var(
        --neural-skeleton-wave-background,
        linear-gradient(
          90deg,
          transparent,
          rgb(255 255 255 / 0.48),
          transparent
        )
      );
      transform: translateX(-120%);
      animation: neural-skeleton-wave var(--neural-skeleton-wave-duration, 1.6s)
        var(--neural-skeleton-wave-easing, ease-in-out) infinite;
    }

    @keyframes neural-skeleton-pulse {
      0%,
      100% {
        opacity: var(--neural-skeleton-pulse-min-opacity, 0.52);
      }
      50% {
        opacity: var(--neural-skeleton-pulse-max-opacity, 1);
      }
    }

    @keyframes neural-skeleton-wave {
      to {
        transform: translateX(255%);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      :where(.neural-skeleton-pulse-root),
      :where(.neural-skeleton-wave-effect-root) {
        animation: none;
      }
    }
  `,
})
export class NeuralSkeleton {
  private readonly config = inject(NEURAL_NG_CONFIG);

  readonly shape = input<NeuralSkeletonShape>('rounded');
  readonly animation = input<NeuralSkeletonAnimation>('pulse');
  readonly width = input('100%');
  readonly height = input('1rem');
  readonly size = input('2.5rem');
  readonly borderRadius = input<string | null>(null);
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly skeletonClass = input('');
  readonly classes = input<NeuralSkeletonClasses>({});

  readonly effectiveUnstyled = computed(
    () => this.unstyled() || this.config.unstyled,
  );
  readonly resolvedWidth = computed(() =>
    this.shape() === 'circle'
      ? this.normalizeLength(this.size(), '2.5rem')
      : this.normalizeLength(this.width(), '100%'),
  );
  readonly resolvedHeight = computed(() =>
    this.shape() === 'circle'
      ? this.normalizeLength(this.size(), '2.5rem')
      : this.normalizeLength(this.height(), '1rem'),
  );
  readonly normalizedBorderRadius = computed(
    () => this.borderRadius()?.trim() || null,
  );
  readonly rootClass = computed(() =>
    [
      this.compose(
        'neural-skeleton-root',
        'neural-skeleton-base',
        this.skeletonClass(),
        this.classes().root,
      ),
      this.visualClass(`neural-skeleton-${this.shape()}-base`),
      this.animation() === 'pulse'
        ? [
            'neural-skeleton-pulse-root',
            this.visualClass('neural-skeleton-pulse-base'),
          ]
            .filter(Boolean)
            .join(' ')
        : '',
    ]
      .filter(Boolean)
      .join(' '),
  );
  readonly effectClass = computed(() =>
    [
      this.compose(
        'neural-skeleton-effect-root',
        'neural-skeleton-effect-base',
        this.classes().effect,
      ),
      this.animation() === 'wave'
        ? [
            'neural-skeleton-wave-effect-root',
            this.visualClass('neural-skeleton-wave-effect-base'),
          ]
            .filter(Boolean)
            .join(' ')
        : '',
    ]
      .filter(Boolean)
      .join(' '),
  );

  private normalizeLength(value: string, fallback: string): string {
    return value.trim() || fallback;
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

/** @deprecated Use `NeuralSkeleton` instead. */
export { NeuralSkeleton as SkeletonComponent };
