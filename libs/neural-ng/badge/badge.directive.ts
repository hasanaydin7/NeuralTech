import {
  ApplicationRef,
  ComponentRef,
  Directive,
  DestroyRef,
  ElementRef,
  EnvironmentInjector,
  OnChanges,
  Renderer2,
  afterNextRender,
  booleanAttribute,
  createComponent,
  inject,
  input,
  numberAttribute,
} from '@angular/core';
import { NeuralBadge } from './badge.component';
import type {
  NeuralBadgeAriaLive,
  NeuralBadgePosition,
  NeuralBadgeSeverity,
  NeuralBadgeSize,
} from './badge.types';

@Directive({
  selector: '[neuralBadge], [neuralBadgeDot]',
  standalone: true,
  host: {
    class: 'neural-badge-anchor',
  },
})
export class NeuralBadgeDirective implements OnChanges {
  private readonly applicationRef = inject(ApplicationRef);
  private readonly environmentInjector = inject(EnvironmentInjector);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private badgeHost: HTMLElement | null = null;
  private badgeRef: ComponentRef<NeuralBadge> | null = null;
  private appliedHostClasses: string[] = [];

  readonly neuralBadge = input<string | number | null | undefined>(null);
  readonly neuralBadgePosition = input<NeuralBadgePosition>('top-end');
  readonly neuralBadgeSeverity = input<NeuralBadgeSeverity>('neutral');
  readonly neuralBadgeSize = input<NeuralBadgeSize>('small');
  readonly neuralBadgeMax = input<number | null>(null, {
    transform: numberAttribute,
  });
  readonly neuralBadgeAriaLabel = input<string | null>(null);
  readonly neuralBadgeAriaLive = input<NeuralBadgeAriaLive>('off');
  readonly neuralBadgeClass = input('');
  readonly neuralBadgeHostClass = input('');
  readonly neuralBadgeRounded = input(true, { transform: booleanAttribute });
  readonly neuralBadgeDot = input(false, { transform: booleanAttribute });
  readonly neuralBadgeHidden = input(false, { transform: booleanAttribute });
  readonly neuralBadgeUnstyled = input(false, {
    transform: booleanAttribute,
  });

  constructor() {
    afterNextRender(() => {
      this.createBadge();
      this.syncBadge();
    });

    inject(DestroyRef).onDestroy(() => this.destroyBadge());
  }

  ngOnChanges(): void {
    this.syncBadge();
  }

  private createBadge(): void {
    if (this.badgeRef) return;
    this.badgeHost = this.renderer.createElement('neural-badge') as HTMLElement;
    this.renderer.addClass(this.badgeHost, 'neural-badge-anchor-badge');
    this.renderer.appendChild(this.elementRef.nativeElement, this.badgeHost);
    this.badgeRef = createComponent(NeuralBadge, {
      environmentInjector: this.environmentInjector,
      hostElement: this.badgeHost,
    });
    this.applicationRef.attachView(this.badgeRef.hostView);
  }

  private syncBadge(): void {
    const badgeRef = this.badgeRef;
    const badgeHost = this.badgeHost;
    if (!badgeRef || !badgeHost) return;

    const value = this.neuralBadge();
    const position = this.neuralBadgePosition();
    const dot = this.neuralBadgeDot();
    const hidden =
      this.neuralBadgeHidden() ||
      (!dot && (value === null || value === undefined));

    badgeRef.setInput('value', value);
    badgeRef.setInput('max', this.neuralBadgeMax());
    badgeRef.setInput('severity', this.neuralBadgeSeverity());
    badgeRef.setInput('size', this.neuralBadgeSize());
    badgeRef.setInput('ariaLabel', this.neuralBadgeAriaLabel());
    badgeRef.setInput('ariaLive', this.neuralBadgeAriaLive());
    badgeRef.setInput('badgeClass', this.neuralBadgeClass());
    badgeRef.setInput('rounded', this.neuralBadgeRounded());
    badgeRef.setInput('dot', dot);
    badgeRef.setInput('badgeHidden', hidden);
    badgeRef.setInput('unstyled', this.neuralBadgeUnstyled());

    this.applyPosition(position);
    this.applyHostClasses(this.neuralBadgeHostClass());
    if (hidden && this.renderer.parentNode(badgeHost)) {
      this.renderer.removeChild(this.elementRef.nativeElement, badgeHost);
    }
    badgeRef.changeDetectorRef.detectChanges();
  }

  private applyPosition(position: NeuralBadgePosition): void {
    const badgeHost = this.badgeHost;
    if (!badgeHost) return;
    const positions: NeuralBadgePosition[] = [
      'start',
      'end',
      'top-start',
      'top-end',
      'bottom-start',
      'bottom-end',
    ];
    for (const candidate of positions) {
      this.renderer.removeClass(
        badgeHost,
        `neural-badge-anchor-badge-${candidate}`,
      );
    }
    this.renderer.removeClass(badgeHost, 'neural-badge-anchor-badge-overlay');
    this.renderer.addClass(badgeHost, `neural-badge-anchor-badge-${position}`);

    if (position !== 'start' && position !== 'end') {
      this.renderer.addClass(badgeHost, 'neural-badge-anchor-badge-overlay');
    }

    const anchor = this.elementRef.nativeElement;
    if (position === 'start') {
      const firstContent = Array.from(anchor.childNodes).find(
        (node) => node !== badgeHost,
      );
      this.renderer.insertBefore(anchor, badgeHost, firstContent ?? null);
      return;
    }
    this.renderer.appendChild(anchor, badgeHost);
  }

  private applyHostClasses(value: string): void {
    const badgeHost = this.badgeHost;
    if (!badgeHost) return;
    for (const className of this.appliedHostClasses) {
      this.renderer.removeClass(badgeHost, className);
    }
    this.appliedHostClasses = value.trim().split(/\s+/).filter(Boolean);
    for (const className of this.appliedHostClasses) {
      this.renderer.addClass(badgeHost, className);
    }
  }

  private destroyBadge(): void {
    const badgeRef = this.badgeRef;
    if (!badgeRef || badgeRef.hostView.destroyed) return;
    this.applicationRef.detachView(badgeRef.hostView);
    badgeRef.destroy();
  }
}

/** @deprecated Import and use `NeuralBadgeDirective` instead. */
export { NeuralBadgeDirective as BadgeDirective };
