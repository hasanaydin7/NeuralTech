import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ApplicationRef,
  ComponentRef,
  DestroyRef,
  Directive,
  ElementRef,
  EnvironmentInjector,
  PLATFORM_ID,
  booleanAttribute,
  createComponent,
  effect,
  inject,
  input,
  numberAttribute,
  signal,
} from '@angular/core';
import { NEURAL_NG_CONFIG } from '@neural-ng/core';
import {
  NeuralOverlayPositioner,
  type NeuralOverlayPositionRef,
} from '@neural-ng/core/overlay';
import { TooltipRendererComponent } from './tooltip-renderer.component';
import type {
  NeuralTooltipClasses,
  NeuralTooltipPosition,
} from './tooltip.types';

type PopoverHost = HTMLElement & {
  showPopover?: () => void;
  hidePopover?: () => void;
};

const INTERACTIVE_SELECTOR = [
  'button:not(:disabled):not([aria-disabled="true"])',
  'a[href]:not([aria-disabled="true"])',
  'input:not(:disabled):not([aria-disabled="true"])',
  'select:not(:disabled):not([aria-disabled="true"])',
  'textarea:not(:disabled):not([aria-disabled="true"])',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

let nextTooltipId = 0;

@Directive({
  selector: '[neuralTooltip]',
  standalone: true,
  exportAs: 'neuralTooltip',
  host: {
    '(pointerenter)': 'handlePointerEnter()',
    '(pointerleave)': 'handlePointerLeave()',
    '(pointerdown)': 'handleActivation()',
    '(focusin)': 'handleFocusIn()',
    '(focusout)': 'handleFocusOut()',
    '(keydown.enter)': 'handleActivation()',
    '(keydown.space)': 'handleActivation()',
    '(keydown.escape)': 'handleEscape($event)',
  },
})
export class NeuralTooltip {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly applicationRef = inject(ApplicationRef);
  private readonly environmentInjector = inject(EnvironmentInjector);
  private readonly positioner = inject(NeuralOverlayPositioner);
  private readonly neuralConfig = inject(NEURAL_NG_CONFIG);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly generatedId = `neural-tooltip-${++nextTooltipId}`;
  private componentRef: ComponentRef<TooltipRendererComponent> | undefined;
  private positionRef: NeuralOverlayPositionRef | undefined;
  private showTimer: ReturnType<typeof setTimeout> | undefined;
  private hideTimer: ReturnType<typeof setTimeout> | undefined;
  private teardownTimer: ReturnType<typeof setTimeout> | undefined;
  private describedById: string | undefined;
  private describedByElement: HTMLElement | undefined;
  private pointerInside = false;
  private focusInside = false;
  private activationSuppressed = false;
  private readonly visibleState = signal(false);

  readonly neuralTooltip = input('');
  readonly tooltipPosition = input<NeuralTooltipPosition>('top');
  readonly tooltipDisabled = input(false, { transform: booleanAttribute });
  readonly showDelay = input(300, { transform: numberAttribute });
  readonly hideDelay = input(80, { transform: numberAttribute });
  readonly tooltipId = input<string | null>(null);
  readonly tooltipClass = input('');
  readonly classes = input<NeuralTooltipClasses>({});
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly visible = this.visibleState.asReadonly();

  constructor() {
    effect(() => {
      const content = this.neuralTooltip().trim();
      const disabled = this.tooltipDisabled();
      const position = this.tooltipPosition();
      const id = this.effectiveId();
      const unstyled = this.unstyled() || this.neuralConfig.unstyled;
      const tooltipClass = this.tooltipClass();
      const classes = this.classes();

      if (disabled || !content) {
        if (this.visible()) this.hide(true);
        return;
      }

      const componentRef = this.componentRef;
      if (!componentRef) return;
      componentRef.setInput('content', content);
      componentRef.setInput('position', position);
      componentRef.setInput('unstyled', unstyled);
      componentRef.setInput('tooltipClass', tooltipClass);
      componentRef.setInput('classes', classes);
      componentRef.location.nativeElement.id = id;

      if (this.visible()) {
        this.syncDescribedBy(id);
        this.positionRef?.destroy();
        this.positionRef = this.positioner.connect(
          this.anchorElement(),
          componentRef.location.nativeElement,
          { placement: position },
        );
      }
    });

    this.destroyRef.onDestroy(() => {
      this.clearTimers();
      this.removeDescribedBy();
      this.destroyRenderer();
    });
  }

  show(): void {
    if (
      !isPlatformBrowser(this.platformId) ||
      this.tooltipDisabled() ||
      !this.neuralTooltip().trim()
    ) {
      return;
    }

    this.clearTimer('hide');
    this.clearTimer('teardown');
    if (this.visible()) return;
    this.clearTimer('show');
    this.showTimer = setTimeout(
      () => this.showNow(),
      Math.max(0, this.showDelay()),
    );
  }

  hide(immediate = false): void {
    this.clearTimer('show');
    this.clearTimer('hide');
    if (!this.visible() && !this.componentRef) return;

    const perform = (): void => {
      this.visibleState.set(false);
      this.removeDescribedBy();
      const host = this.componentRef?.location.nativeElement as
        | PopoverHost
        | undefined;
      this.componentRef?.setInput('open', false);
      try {
        host?.hidePopover?.();
      } catch {
        // The fallback data state remains authoritative.
      }

      if (immediate) this.destroyRenderer();
      else {
        this.teardownTimer = setTimeout(
          () => this.destroyRenderer(),
          this.leaveDuration(),
        );
      }
    };

    if (immediate) perform();
    else {
      this.hideTimer = setTimeout(perform, Math.max(0, this.hideDelay()));
    }
  }

  handlePointerEnter(): void {
    this.activationSuppressed = false;
    this.pointerInside = true;
    this.show();
  }

  handlePointerLeave(): void {
    this.pointerInside = false;
    this.activationSuppressed = false;
    if (!this.focusInside) this.hide();
  }

  handleFocusIn(): void {
    this.focusInside = true;
    if (!this.activationSuppressed) this.show();
  }

  handleFocusOut(): void {
    this.focusInside = false;
    this.activationSuppressed = false;
    if (!this.pointerInside) this.hide();
  }

  handleActivation(): void {
    this.activationSuppressed = true;
    this.hide(true);
  }

  handleEscape(event: Event): void {
    if (!this.visible()) return;
    event.stopPropagation();
    this.pointerInside = false;
    this.focusInside = false;
    this.hide(true);
  }

  private showNow(): void {
    this.showTimer = undefined;
    if (this.tooltipDisabled() || !this.neuralTooltip().trim()) {
      return;
    }

    const componentRef = this.createRenderer();
    const host = componentRef.location.nativeElement as PopoverHost;
    const id = this.effectiveId();
    componentRef.setInput('content', this.neuralTooltip().trim());
    componentRef.setInput('position', this.tooltipPosition());
    componentRef.setInput(
      'unstyled',
      this.unstyled() || this.neuralConfig.unstyled,
    );
    componentRef.setInput('tooltipClass', this.tooltipClass());
    componentRef.setInput('classes', this.classes());
    componentRef.setInput('open', true);
    host.id = id;
    host.setAttribute('popover', 'manual');
    this.syncDescribedBy(id);
    this.visibleState.set(true);

    try {
      host.showPopover?.();
    } catch {
      // Browsers without Popover API use the fixed-position fallback.
    }

    componentRef.changeDetectorRef.detectChanges();
    this.positionRef = this.positioner.connect(this.anchorElement(), host, {
      placement: this.tooltipPosition(),
    });
  }

  private createRenderer(): ComponentRef<TooltipRendererComponent> {
    if (this.componentRef) return this.componentRef;
    const host = this.document.createElement('neural-tooltip-renderer');
    this.document.body.append(host);
    this.componentRef = createComponent(TooltipRendererComponent, {
      environmentInjector: this.environmentInjector,
      hostElement: host,
    });
    this.applicationRef.attachView(this.componentRef.hostView);
    return this.componentRef;
  }

  private destroyRenderer(): void {
    this.clearTimer('teardown');
    this.positionRef?.destroy();
    this.positionRef = undefined;
    if (!this.componentRef) return;
    const host = this.componentRef.location.nativeElement as HTMLElement;
    this.applicationRef.detachView(this.componentRef.hostView);
    this.componentRef.destroy();
    host.remove();
    this.componentRef = undefined;
  }

  private effectiveId(): string {
    return this.tooltipId()?.trim() || this.generatedId;
  }

  private syncDescribedBy(id: string): void {
    if (this.describedById === id) return;
    this.removeDescribedBy();
    const trigger = this.anchorElement();
    const tokens = new Set(
      (trigger.getAttribute('aria-describedby') ?? '')
        .split(/\s+/)
        .filter(Boolean),
    );
    tokens.add(id);
    trigger.setAttribute('aria-describedby', [...tokens].join(' '));
    this.describedById = id;
    this.describedByElement = trigger;
  }

  private removeDescribedBy(): void {
    if (!this.describedById) return;
    const trigger = this.describedByElement ?? this.anchorElement();
    const tokens = (trigger.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .filter((token) => token && token !== this.describedById);
    if (tokens.length)
      trigger.setAttribute('aria-describedby', tokens.join(' '));
    else trigger.removeAttribute('aria-describedby');
    this.describedById = undefined;
    this.describedByElement = undefined;
  }

  private anchorElement(): HTMLElement {
    const host = this.element.nativeElement;
    if (host.matches(INTERACTIVE_SELECTOR)) return host;
    return host.querySelector<HTMLElement>(INTERACTIVE_SELECTOR) ?? host;
  }

  private leaveDuration(): number {
    return this.unstyled() || this.neuralConfig.unstyled ? 0 : 100;
  }

  private clearTimers(): void {
    this.clearTimer('show');
    this.clearTimer('hide');
    this.clearTimer('teardown');
  }

  private clearTimer(kind: 'show' | 'hide' | 'teardown'): void {
    const timer =
      kind === 'show'
        ? this.showTimer
        : kind === 'hide'
          ? this.hideTimer
          : this.teardownTimer;
    if (timer !== undefined) clearTimeout(timer);
    if (kind === 'show') this.showTimer = undefined;
    else if (kind === 'hide') this.hideTimer = undefined;
    else this.teardownTimer = undefined;
  }
}

/** @deprecated Use NeuralTooltip. */
export { NeuralTooltip as TooltipDirective };
