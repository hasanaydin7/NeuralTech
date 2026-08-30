import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  APP_ID,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  Injectable,
  PLATFORM_ID,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NEURAL_NG_CONFIG } from '@neural-ng/core';
import {
  NeuralOverlayPositioner,
  type NeuralOverlayPositionRef,
} from '@neural-ng/core/overlay';
import type {
  NeuralPopoverClasses,
  NeuralPopoverCloseEvent,
  NeuralPopoverCloseReason,
  NeuralPopoverFocusOnOpen,
  NeuralPopoverOpenEvent,
  NeuralPopoverPosition,
  NeuralPopoverRole,
  NeuralPopoverShowOptions,
} from './popover.types';

type PopoverElement = HTMLElement & {
  showPopover?: () => void;
  hidePopover?: () => void;
};

interface PendingClose {
  readonly reason: NeuralPopoverCloseReason;
  readonly restoreFocus: boolean;
  readonly originalEvent?: Event;
}

@Directive({
  selector: '[neuralPopoverInitialFocus]',
  standalone: true,
})
export class PopoverInitialFocusDirective {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);

  focus(): void {
    this.element.nativeElement.focus({ preventScroll: true });
  }
}

@Injectable({ providedIn: 'root' })
class NeuralPopoverStack {
  private readonly stack: PopoverComponent[] = [];

  activate(popover: PopoverComponent): void {
    this.deactivate(popover);
    this.stack.push(popover);
  }

  deactivate(popover: PopoverComponent): void {
    const index = this.stack.indexOf(popover);
    if (index >= 0) this.stack.splice(index, 1);
  }

  isTopmost(popover: PopoverComponent): boolean {
    return this.stack[this.stack.length - 1] === popover;
  }
}

@Injectable({ providedIn: 'root' })
class NeuralPopoverIdGenerator {
  private readonly appId = inject(APP_ID);
  private nextId = 0;

  next(): string {
    return `${this.appId}-neural-popover-${this.nextId++}`;
  }
}

@Component({
  selector: 'neural-popover',
  exportAs: 'neuralPopover',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neural-popover-host',
    '(document:pointerdown)': 'handleDocumentPointerDown($event)',
    '(document:keydown.escape)': 'handleDocumentEscape($event)',
  },
  template: `
    <div
      #popoverRoot
      [id]="normalizedId()"
      [class]="rootClass()"
      [hidden]="!supportsNativePopover && !open()"
      popover="manual"
      [attr.role]="role()"
      [attr.aria-label]="normalizedAriaLabel()"
      [attr.aria-labelledby]="normalizedAriaLabelledby()"
      [attr.aria-describedby]="normalizedAriaDescribedby()"
      [attr.data-open]="open() ? 'true' : 'false'"
      [attr.data-match-trigger-width]="matchTriggerWidth() ? 'true' : null"
    >
      @if (showArrow()) {
        <span [class]="arrowClass()" aria-hidden="true"></span>
      }
      <div [class]="contentClass()">
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    :where(.neural-popover-host) {
      display: contents;
    }

    :where(.neural-popover-root) {
      position: fixed;
      inset: auto;
      z-index: var(--neural-popover-z-index, 1100);
      box-sizing: border-box;
      min-width: 0;
      margin: 0;
    }

    /* Keep attribute specificity outside :where so the explicit width contract
     * wins over the later themeable max-content default. */
    .neural-popover-root[data-match-trigger-width='true'] {
      width: var(--neural-popover-trigger-width);
      max-width: calc(100vw - 1rem);
    }

    :where(.neural-popover-content-root) {
      box-sizing: border-box;
      min-width: 0;
    }

    :where(.neural-popover-base) {
      width: var(--neural-popover-width, max-content);
      min-width: var(--neural-popover-min-width, 12rem);
      max-width: min(
        var(--neural-popover-max-width, 24rem),
        calc(100vw - 1rem)
      );
      max-height: min(
        var(--neural-popover-max-height, 32rem),
        calc(100dvh - 1rem)
      );
      overflow: visible;
      color: var(--neural-popover-color, inherit);
      background: var(--neural-popover-background, Canvas);
      border: var(--neural-popover-border, 1px solid currentColor);
      border-radius: var(--neural-popover-radius, 0.75rem);
      box-shadow: var(--neural-popover-shadow, none);
      font-family: var(--neural-popover-font-family, inherit);
      opacity: 0;
      transform: translateY(var(--neural-popover-enter-distance, -0.25rem))
        scale(var(--neural-popover-enter-scale, 0.98));
      transition:
        opacity var(--neural-popover-leave-duration, 110ms)
          var(--neural-popover-easing, ease-out),
        transform var(--neural-popover-leave-duration, 110ms)
          var(--neural-popover-easing, ease-out),
        overlay var(--neural-popover-leave-duration, 110ms) allow-discrete,
        display var(--neural-popover-leave-duration, 110ms) allow-discrete;
    }

    :where(
      .neural-popover-base:popover-open,
      .neural-popover-base[data-open='true']
    ) {
      opacity: 1;
      transform: none;
      transition-duration:
        var(--neural-popover-enter-duration, 150ms),
        var(--neural-popover-enter-duration, 150ms),
        var(--neural-popover-enter-duration, 150ms),
        var(--neural-popover-enter-duration, 150ms);
    }

    @starting-style {
      :where(.neural-popover-base:popover-open) {
        opacity: 0;
        transform: translateY(var(--neural-popover-enter-distance, -0.25rem))
          scale(var(--neural-popover-enter-scale, 0.98));
      }
    }

    :where(.neural-popover-base[data-position^='top']) {
      --neural-popover-enter-distance: 0.25rem;
      transform-origin: bottom;
    }

    :where(.neural-popover-base[data-position^='bottom']) {
      --neural-popover-enter-distance: -0.25rem;
      transform-origin: top;
    }

    :where(.neural-popover-base[data-position='left']) {
      --neural-popover-enter-distance: 0;
      transform-origin: right;
    }

    :where(.neural-popover-base[data-position='right']) {
      --neural-popover-enter-distance: 0;
      transform-origin: left;
    }

    :where(.neural-popover-content-base) {
      max-height: inherit;
      overflow: auto;
      padding: var(--neural-popover-padding, 1rem);
      border-radius: inherit;
    }

    :where(.neural-popover-arrow-root) {
      position: absolute;
      z-index: -1;
      box-sizing: border-box;
      width: var(--neural-popover-arrow-size, 0.75rem);
      height: var(--neural-popover-arrow-size, 0.75rem);
      background: var(--neural-popover-arrow-background, inherit);
      border: var(--neural-popover-arrow-border, inherit);
      transform: rotate(45deg);
      pointer-events: none;
    }

    :where(.neural-popover-arrow-root) {
      inset-inline-start: calc(
        50% - var(--neural-popover-arrow-size, 0.75rem) / 2
      );
    }

    :where(.neural-popover-root[data-position$='-start'])
      > .neural-popover-arrow-root {
      inset-inline-start: var(--neural-popover-arrow-offset, 1rem);
    }

    :where(.neural-popover-root[data-position$='-end'])
      > .neural-popover-arrow-root {
      inset-inline-start: auto;
      inset-inline-end: var(--neural-popover-arrow-offset, 1rem);
    }

    :where(.neural-popover-root[data-position^='bottom'])
      > .neural-popover-arrow-root {
      inset-block-start: calc(var(--neural-popover-arrow-size, 0.75rem) / -2);
      border-inline-end: 0;
      border-block-end: 0;
    }

    :where(.neural-popover-root[data-position^='top'])
      > .neural-popover-arrow-root {
      inset-block-end: calc(var(--neural-popover-arrow-size, 0.75rem) / -2);
      border-inline-start: 0;
      border-block-start: 0;
    }

    :where(.neural-popover-root[data-position='left'])
      > .neural-popover-arrow-root,
    :where(.neural-popover-root[data-position='right'])
      > .neural-popover-arrow-root {
      inset-block-start: calc(
        50% - var(--neural-popover-arrow-size, 0.75rem) / 2
      );
      inset-inline-start: auto;
    }

    :where(.neural-popover-root[data-position='left'])
      > .neural-popover-arrow-root {
      inset-inline-end: calc(var(--neural-popover-arrow-size, 0.75rem) / -2);
      border-inline-start: 0;
      border-block-end: 0;
    }

    :where(.neural-popover-root[data-position='right'])
      > .neural-popover-arrow-root {
      inset-inline-start: calc(var(--neural-popover-arrow-size, 0.75rem) / -2);
      border-inline-end: 0;
      border-block-start: 0;
    }

    @media (prefers-reduced-motion: reduce) {
      :where(.neural-popover-base) {
        transition-duration: 0.01ms !important;
      }
    }
  `,
})
export class PopoverComponent {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly positioner = inject(NeuralOverlayPositioner);
  private readonly config = inject(NEURAL_NG_CONFIG);
  private readonly stack = inject(NeuralPopoverStack);
  private readonly generatedId = inject(NeuralPopoverIdGenerator).next();
  private readonly root = viewChild<ElementRef<PopoverElement>>('popoverRoot');
  private readonly initialFocus = contentChild(PopoverInitialFocusDirective, {
    descendants: true,
  });
  private readonly activeTrigger = signal<HTMLElement | null>(null);
  private readonly defaultTrigger = signal<HTMLElement | null>(null);
  private readonly showOptions = signal<NeuralPopoverShowOptions>({});
  private positionRef: NeuralOverlayPositionRef | undefined;
  private pendingClose: PendingClose | undefined;
  private renderedOpen = false;
  private restoreFocusTimer: ReturnType<typeof setTimeout> | undefined;
  private positionCleanupTimer: ReturnType<typeof setTimeout> | undefined;

  readonly supportsNativePopover =
    isPlatformBrowser(this.platformId) &&
    typeof HTMLElement !== 'undefined' &&
    typeof HTMLElement.prototype.showPopover === 'function';

  readonly open = model(false);
  readonly position = input<NeuralPopoverPosition>('bottom-start');
  readonly offset = input(8, { transform: numberAttribute });
  readonly viewportPadding = input(8, { transform: numberAttribute });
  readonly focusOnOpen = input<NeuralPopoverFocusOnOpen>('none');
  readonly dismissible = input(true, { transform: booleanAttribute });
  readonly closeOnEscape = input(true, { transform: booleanAttribute });
  readonly restoreFocus = input(true, { transform: booleanAttribute });
  readonly matchTriggerWidth = input(false, { transform: booleanAttribute });
  readonly showArrow = input(false, { transform: booleanAttribute });
  readonly role = input<NeuralPopoverRole>(null);
  readonly popoverId = input(this.generatedId);
  readonly ariaLabel = input<string | null>(null);
  readonly ariaLabelledby = input<string | null>(null);
  readonly ariaDescribedby = input<string | null>(null);
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly popoverClass = input('');
  readonly classes = input<NeuralPopoverClasses>({});

  readonly opened = output<NeuralPopoverOpenEvent>();
  readonly closed = output<NeuralPopoverCloseEvent>();

  readonly effectiveUnstyled = computed(
    () => this.unstyled() || this.config.unstyled,
  );
  readonly normalizedId = computed(
    () => this.popoverId().trim() || this.generatedId,
  );
  readonly normalizedAriaLabelledby = computed(
    () => this.ariaLabelledby()?.trim() || null,
  );
  readonly normalizedAriaLabel = computed(() =>
    this.normalizedAriaLabelledby() ? null : this.ariaLabel()?.trim() || null,
  );
  readonly normalizedAriaDescribedby = computed(
    () => this.ariaDescribedby()?.trim() || null,
  );
  readonly rootClass = computed(() =>
    this.compose(
      'neural-popover-root',
      'neural-popover-base',
      this.popoverClass(),
      this.classes().root,
    ),
  );
  readonly contentClass = computed(() =>
    this.compose(
      'neural-popover-content-root',
      'neural-popover-content-base',
      this.classes().content,
    ),
  );
  readonly arrowClass = computed(() =>
    this.compose(
      'neural-popover-arrow-root',
      'neural-popover-arrow-base',
      this.classes().arrow,
    ),
  );

  constructor() {
    effect(() => {
      const shouldOpen = this.open();
      this.position();
      this.offset();
      this.viewportPadding();
      this.focusOnOpen();
      queueMicrotask(() => this.syncPopover(shouldOpen));
    });

    inject(DestroyRef).onDestroy(() => {
      if (this.restoreFocusTimer !== undefined) {
        clearTimeout(this.restoreFocusTimer);
      }
      this.cancelPositionCleanup();
      this.positionRef?.destroy();
      this.stack.deactivate(this);
    });
  }

  showFor(trigger: HTMLElement, options: NeuralPopoverShowOptions = {}): void {
    this.activeTrigger.set(trigger);
    this.showOptions.set(options);
    if (this.open()) {
      queueMicrotask(() => this.syncPopover(true));
      return;
    }
    this.open.set(true);
  }

  toggleFor(
    trigger: HTMLElement,
    options: NeuralPopoverShowOptions = {},
    originalEvent?: Event,
  ): void {
    if (this.isTriggerOpen(trigger)) {
      this.hide('trigger', true, originalEvent);
      return;
    }
    this.showFor(trigger, options);
  }

  hide(
    reason: NeuralPopoverCloseReason = 'api',
    restoreFocus = this.restoreFocus() && reason !== 'outside',
    originalEvent?: Event,
  ): void {
    if (!this.open() && !this.renderedOpen) return;
    this.pendingClose = { reason, restoreFocus, originalEvent };
    this.open.set(false);
  }

  isTriggerOpen(trigger: HTMLElement): boolean {
    return this.open() && this.activeTrigger() === trigger;
  }

  registerTrigger(trigger: HTMLElement): void {
    if (!this.defaultTrigger()) this.defaultTrigger.set(trigger);
    if (this.open() && !this.activeTrigger()) {
      this.activeTrigger.set(trigger);
      queueMicrotask(() => this.syncPopover(true));
    }
  }

  unregisterTrigger(trigger: HTMLElement): void {
    if (this.defaultTrigger() === trigger) this.defaultTrigger.set(null);
    if (this.activeTrigger() === trigger) {
      if (this.open()) this.hide('native', false);
      this.activeTrigger.set(null);
    }
  }

  handleDocumentPointerDown(event: PointerEvent): void {
    if (!this.open() || !this.dismissible() || !this.stack.isTopmost(this)) {
      return;
    }
    const target = event.target;
    const root = this.root()?.nativeElement;
    const trigger = this.activeTrigger();
    if (
      !(target instanceof Node) ||
      root?.contains(target) ||
      trigger?.contains(target)
    ) {
      return;
    }
    this.hide('outside', false, event);
  }

  handleDocumentEscape(event: Event): void {
    if (
      !this.open() ||
      !this.closeOnEscape() ||
      !this.stack.isTopmost(this) ||
      event.defaultPrevented
    ) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.hide('escape', true, event);
  }

  private syncPopover(shouldOpen: boolean): void {
    const root = this.root()?.nativeElement;
    if (!root || !isPlatformBrowser(this.platformId)) return;

    if (!shouldOpen) {
      this.closeRenderedPopover(root);
      return;
    }

    const trigger = this.activeTrigger() ?? this.defaultTrigger();
    if (!trigger?.isConnected) return;
    this.activeTrigger.set(trigger);

    if (!this.renderedOpen) {
      this.cancelPositionCleanup();
      root.hidden = false;
      root.style.visibility = 'hidden';
      try {
        root.showPopover?.();
      } catch {
        // The data-open and hidden fallback remains authoritative.
      }
      this.renderedOpen = true;
      this.stack.activate(this);
    }

    this.connectPosition(trigger, root);
    root.style.removeProperty('visibility');

    if (this.matchTriggerWidth()) {
      root.style.setProperty(
        '--neural-popover-trigger-width',
        `${trigger.getBoundingClientRect().width}px`,
      );
    } else {
      root.style.removeProperty('--neural-popover-trigger-width');
    }

    if (!root.dataset['opened']) {
      root.dataset['opened'] = 'true';
      const options = this.showOptions();
      this.opened.emit({
        trigger,
        position: options.position ?? this.position(),
      });
      if ((options.focusOnOpen ?? this.focusOnOpen()) === 'first') {
        queueMicrotask(() => this.focusFirst(root));
      }
    }
  }

  private closeRenderedPopover(root: PopoverElement): void {
    if (!this.renderedOpen) return;
    const trigger = this.activeTrigger();
    const pending = this.pendingClose ?? {
      reason: 'api' as const,
      restoreFocus: this.restoreFocus(),
    };
    this.pendingClose = undefined;
    this.renderedOpen = false;
    this.stack.deactivate(this);
    root.removeAttribute('data-opened');
    try {
      root.hidePopover?.();
    } catch {
      root.hidden = true;
    }
    if (this.supportsNativePopover) {
      this.schedulePositionCleanup(root);
    } else {
      root.hidden = true;
      this.releasePosition(root);
    }

    this.closed.emit({
      reason: pending.reason,
      trigger,
      originalEvent: pending.originalEvent,
    });

    if (pending.restoreFocus && trigger?.isConnected) {
      this.restoreFocusTimer = setTimeout(() => {
        this.restoreFocusTimer = undefined;
        trigger.focus({ preventScroll: true });
      }, 0);
    }
  }

  private connectPosition(trigger: HTMLElement, root: HTMLElement): void {
    this.cancelPositionCleanup();
    const options = this.showOptions();
    this.positionRef?.destroy();
    this.positionRef = this.positioner.connect(trigger, root, {
      placement: options.position ?? this.position(),
      offset: options.offset ?? this.offset(),
      viewportPadding: options.viewportPadding ?? this.viewportPadding(),
    });
    this.positionRef.update();
  }

  private schedulePositionCleanup(root: HTMLElement): void {
    this.cancelPositionCleanup();
    const styles = getComputedStyle(root);
    const durations = this.toMilliseconds(styles.transitionDuration);
    const delays = this.toMilliseconds(styles.transitionDelay);
    const count = Math.max(durations.length, delays.length, 1);
    let longestTransition = 0;

    for (let index = 0; index < count; index += 1) {
      const duration = durations[index % Math.max(durations.length, 1)] ?? 0;
      const delay = delays[index % Math.max(delays.length, 1)] ?? 0;
      longestTransition = Math.max(longestTransition, duration + delay);
    }

    this.positionCleanupTimer = setTimeout(() => {
      this.positionCleanupTimer = undefined;
      if (!this.renderedOpen) this.releasePosition(root);
    }, longestTransition + 34);
  }

  private cancelPositionCleanup(): void {
    if (this.positionCleanupTimer === undefined) return;
    clearTimeout(this.positionCleanupTimer);
    this.positionCleanupTimer = undefined;
  }

  private releasePosition(root: HTMLElement): void {
    this.positionRef?.destroy();
    this.positionRef = undefined;
    root.style.removeProperty('--neural-popover-trigger-width');
  }

  private toMilliseconds(value: string): number[] {
    return value.split(',').map((part) => {
      const normalized = part.trim();
      const amount = Number.parseFloat(normalized);
      if (!Number.isFinite(amount)) return 0;
      return normalized.endsWith('ms') ? amount : amount * 1000;
    });
  }

  private focusFirst(root: HTMLElement): void {
    if (this.initialFocus()) {
      this.initialFocus()?.focus();
      return;
    }
    root
      .querySelector<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      ?.focus({ preventScroll: true });
  }

  private compose(
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

@Directive({
  selector: '[neuralPopoverClose]',
  standalone: true,
  host: {
    '(click)': 'handleClick($event)',
  },
})
export class PopoverCloseDirective {
  private readonly popover = inject(PopoverComponent);

  handleClick(event: MouseEvent): void {
    this.popover.hide('close-directive', true, event);
  }
}
