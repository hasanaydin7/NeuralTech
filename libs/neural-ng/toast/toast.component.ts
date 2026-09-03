import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  DestroyRef,
  Injectable,
  ViewEncapsulation,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  isDevMode,
  numberAttribute,
  signal,
} from '@angular/core';
import { NEURAL_NG_CONFIG } from '@neural-ng/core';
import {
  NeuralMessageService,
  type NeuralMessageRecord,
} from '@neural-ng/core/message';
import { NEURAL_TOAST_CONFIG } from './toast.config';
import { NeuralToastTemplateDirective } from './toast-template.directive';
import type { NeuralToastTemplateContext } from './toast-template.types';
import { normalizeToastPosition } from './toast.providers';
import type { NeuralToastClasses, NeuralToastPosition } from './toast.types';

const DEFAULT_ICON_CLASSES: Readonly<
  Record<NeuralMessageRecord['severity'], string>
> = Object.freeze({
  primary: 'nt nt-settings',
  secondary: 'nt nt-bell',
  neutral: 'nt nt-bell',
  info: 'nt nt-info-circle',
  success: 'nt nt-circle-check',
  warning: 'nt nt-alert-triangle',
  error: 'nt nt-circle-times',
});

@Component({
  selector: 'neural-toast',
  standalone: true,
  imports: [NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      role="region"
      [class]="computedToastClass()"
      [attr.data-position]="effectivePosition()"
      [attr.data-channel]="effectiveChannel()"
      [attr.data-paused]="paused()"
      [attr.aria-label]="effectiveAriaLabel()"
      (pointerenter)="pause('pointer')"
      (pointerleave)="resume('pointer')"
      (focusin)="pause('focus')"
      (focusout)="onFocusOut($event)"
    >
      <span
        [class]="liveRegionClass()"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {{ politeAnnouncement() }}
      </span>
      <span
        [class]="liveRegionClass()"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        {{ assertiveAnnouncement() }}
      </span>

      @for (message of visibleMessages(); track message.id) {
        <div
          [class]="itemClass()"
          [animate.enter]="animationEnterClass()"
          [animate.leave]="animationLeaveClass()"
        >
          <article
            [class]="computedMessageClass(message)"
            [attr.data-severity]="message.severity"
            [attr.data-swiping]="isSwiping(message.id)"
            [attr.data-swipe-enabled]="effectiveSwipeToDismiss()"
            [style.--neural-toast-swipe-offset.px]="swipeOffset(message.id)"
            (pointerdown)="onPointerDown($event, message.id)"
            (pointermove)="onPointerMove($event)"
            (pointerup)="onPointerUp($event)"
            (pointercancel)="onPointerCancel($event)"
          >
            @if (toastTemplate(); as customTemplate) {
              <ng-container
                [ngTemplateOutlet]="customTemplate.templateRef"
                [ngTemplateOutletContext]="templateContext(message)"
              />
            } @else {
              @if (icon()) {
                <i [class]="computedIconClass(message)" aria-hidden="true"></i>
              }

              <span [class]="contentClass()">
                @if (message.title) {
                  <strong [class]="titleClass()">{{ message.title }}</strong>
                }
                <span [class]="detailClass()">{{ message.message }}</span>
              </span>

              @if (message.dismissible) {
                <button
                  type="button"
                  [class]="computedCloseClass()"
                  [attr.aria-label]="
                    effectiveCloseLabel() + ': ' + message.message
                  "
                  (click)="dismiss(message.id)"
                >
                  <span aria-hidden="true">×</span>
                </button>
              }
            }

            @if (effectiveShowProgress() && message.duration !== null) {
              <span [class]="progressTrackClass()" aria-hidden="true">
                <span
                  [class]="progressValueClass()"
                  [style.--neural-toast-progress-duration]="
                    message.duration + 'ms'
                  "
                ></span>
              </span>
            }
          </article>
        </div>
      }
    </div>
  `,
  styles: `
    :where(.neural-toast-root) {
      position: fixed;
      z-index: var(--neural-toast-z-index, 1000);
      display: grid;
      width: min(var(--neural-toast-width, 24rem), calc(100vw - 2rem));
      gap: var(--neural-toast-stack-gap, 0.75rem);
      pointer-events: none;
    }
    :where(.neural-toast-root[data-position^='top-']) {
      inset-block-start: max(
        var(--neural-toast-inset, 1rem),
        env(safe-area-inset-top)
      );
    }
    :where(.neural-toast-root[data-position^='middle-']) {
      inset-block-start: 50%;
      transform: translateY(-50%);
    }
    :where(.neural-toast-root[data-position^='bottom-']) {
      inset-block-end: max(
        var(--neural-toast-inset, 1rem),
        env(safe-area-inset-bottom)
      );
      --neural-toast-enter-offset: 0.5rem;
    }
    :where(.neural-toast-root[data-position$='-start']) {
      inset-inline-start: max(
        var(--neural-toast-inset, 1rem),
        env(safe-area-inset-left)
      );
      --neural-toast-leave-offset: -0.5rem;
    }
    :where(.neural-toast-root[data-position$='-center']) {
      inset-inline-start: 50%;
      transform: translateX(-50%);
      --neural-toast-leave-offset: 0;
    }
    :where(.neural-toast-root[data-position$='-end']) {
      inset-inline-end: max(
        var(--neural-toast-inset, 1rem),
        env(safe-area-inset-right)
      );
    }
    :where(.neural-toast-root[data-position='middle-center']) {
      transform: translate(-50%, -50%);
    }
    :where(.neural-toast-live-region) {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    :where(.neural-toast-item) {
      pointer-events: none;
    }
    :where(.neural-toast-message-root) {
      box-sizing: border-box;
      position: relative;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: start;
      pointer-events: auto;
      transform: translateX(var(--neural-toast-swipe-offset, 0));
      transition: transform var(--neural-toast-swipe-reset-duration, 160ms) ease;
    }
    :where(.neural-toast-message-root[data-swiping='true']) {
      transition: none;
    }
    :where(.neural-toast-message-root[data-swipe-enabled='true']) {
      touch-action: pan-y;
    }
    :where(.neural-toast-message-without-icon) {
      grid-template-columns: minmax(0, 1fr) auto;
    }
    :where(.neural-toast-message-base) {
      --neural-toast-severity-background: color-mix(
        in srgb,
        var(--neural-toast-accent, #64748b) 14%,
        var(--neural-toast-message-background, #fff)
      );
      --neural-toast-severity-border: color-mix(
        in srgb,
        var(--neural-toast-accent, #64748b) 42%,
        var(--neural-toast-message-border-color, #cbd5e1)
      );
      --neural-toast-severity-text: color-mix(
        in srgb,
        var(--neural-toast-accent, #64748b) 72%,
        var(--neural-toast-message-color, #0f172a)
      );
      --neural-toast-severity-detail: color-mix(
        in srgb,
        var(--neural-toast-accent, #64748b) 52%,
        var(--neural-toast-detail-color, #475569)
      );
      gap: var(--neural-toast-message-gap, 0.75rem);
      padding: var(--neural-toast-message-padding, 1rem);
      color: var(--neural-toast-severity-text);
      background: var(--neural-toast-severity-background);
      border: var(--neural-toast-message-border-width, 1px)
        var(--neural-toast-message-border-style, solid)
        var(--neural-toast-severity-border);
      border-inline-start-width: var(--neural-toast-accent-width, 0.25rem);
      border-inline-start-color: var(--neural-toast-accent, #64748b);
      border-radius: var(--neural-toast-message-radius, 0.75rem);
      box-shadow: var(
        --neural-toast-message-shadow,
        0 10px 30px rgb(15 23 42 / 0.16)
      );
      backdrop-filter: var(--neural-toast-message-backdrop-filter, none);
      font-family: var(--neural-toast-font-family, inherit);
      overflow: hidden;
    }
    :where(.neural-toast-message-info) {
      --neural-toast-accent: var(--neural-toast-info-color, #0284c7);
    }
    :where(.neural-toast-message-neutral) {
      --neural-toast-accent: var(
        --neural-toast-neutral-color,
        var(--neural-toast-secondary-color, #64748b)
      );
    }
    :where(.neural-toast-message-primary) {
      --neural-toast-accent: var(
        --neural-toast-primary-color,
        var(--neural-color-primary)
      );
    }
    :where(.neural-toast-message-secondary) {
      --neural-toast-accent: var(
        --neural-toast-secondary-color,
        var(--neural-color-text-muted)
      );
    }
    :where(.neural-toast-message-success) {
      --neural-toast-accent: var(--neural-toast-success-color, #16a34a);
    }
    :where(.neural-toast-message-warning) {
      --neural-toast-accent: var(--neural-toast-warning-color, #ca8a04);
    }
    :where(.neural-toast-message-error) {
      --neural-toast-accent: var(--neural-toast-error-color, #dc2626);
    }
    :where(.neural-toast-message-base .neural-toast-icon) {
      display: inline-block;
      width: var(--neural-toast-icon-size, 1.5rem);
      height: var(--neural-toast-icon-size, 1.5rem);
      color: var(--neural-toast-accent, #64748b);
      font-size: var(--neural-toast-icon-size, 1.5rem);
    }
    :where(.neural-toast-content) {
      display: grid;
      min-width: 0;
      gap: 0.25rem;
    }
    :where(.neural-toast-message-base .neural-toast-detail) {
      color: var(--neural-toast-severity-detail);
      font-size: 0.875rem;
      overflow-wrap: anywhere;
    }
    :where(.neural-toast-close-root) {
      align-self: start;
    }
    :where(.neural-toast-close-base) {
      display: grid;
      width: 1.75rem;
      height: 1.75rem;
      padding: 0;
      place-items: center;
      color: var(
        --neural-toast-severity-text,
        var(--neural-toast-close-color, #64748b)
      );
      background: var(--neural-toast-close-background, transparent);
      border: 0;
      border-radius: 0.375rem;
      font: inherit;
      font-size: 1.25rem;
      cursor: pointer;
    }
    :where(.neural-toast-close-base:focus-visible) {
      outline: var(--neural-toast-focus-ring, 2px solid #60a5fa);
      outline-offset: 2px;
    }
    :where(.neural-toast-message-base .neural-toast-progress) {
      position: absolute;
      inset-inline: 0;
      inset-block-end: 0;
      height: var(--neural-toast-progress-height, 0.1875rem);
      background: color-mix(
        in srgb,
        var(--neural-toast-accent, #64748b) 18%,
        var(--neural-toast-progress-track, transparent)
      );
      overflow: hidden;
    }
    :where(.neural-toast-message-base .neural-toast-progress-value) {
      display: block;
      width: 100%;
      height: 100%;
      background: var(--neural-toast-accent, #64748b);
      transform-origin: inline-start;
      animation: neural-toast-progress var(--neural-toast-progress-duration)
        linear forwards;
    }
    :where(
      .neural-toast-root[data-paused='true']
        .neural-toast-message-base
        .neural-toast-progress-value
    ) {
      animation-play-state: paused;
    }
    :where(.neural-toast-enter) {
      animation: neural-toast-enter var(--neural-toast-enter-duration, 180ms)
        ease-out;
    }
    :where(.neural-toast-leave) {
      animation: neural-toast-leave var(--neural-toast-leave-duration, 140ms)
        ease-in forwards;
    }
    @keyframes neural-toast-enter {
      from {
        opacity: 0;
        translate: 0 var(--neural-toast-enter-offset, -0.5rem);
        scale: 0.98;
      }
    }
    @keyframes neural-toast-leave {
      to {
        opacity: 0;
        translate: var(--neural-toast-leave-offset, 0.5rem) 0;
        scale: 0.98;
      }
    }
    @keyframes neural-toast-progress {
      to {
        transform: scaleX(0);
      }
    }
    @media (max-width: 40rem) {
      :where(.neural-toast-root) {
        width: calc(100vw - 1.5rem);
        --neural-toast-inset: 0.75rem;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      :where(.neural-toast-enter, .neural-toast-leave) {
        animation-duration: 0.01ms;
      }
      :where(.neural-toast-message-root) {
        transition-duration: 0.01ms;
      }
    }
  `,
})
export class NeuralToast {
  private readonly messageService = inject(NeuralMessageService);
  private readonly toastConfig = inject(NEURAL_TOAST_CONFIG);
  private readonly neuralConfig = inject(NEURAL_NG_CONFIG);
  private readonly outletRegistry = inject(ToastOutletRegistry);
  private readonly browserReady = signal(false);
  private readonly timers = new Map<string, ToastTimer>();
  private readonly pauseSources = new Set<PauseSource>();
  private readonly seenAnnouncementIds = new Set<string>();
  private readonly warnedMessageIds = new Set<string>();
  private readonly swipeOffsets = signal<Readonly<Record<string, number>>>({});
  private readonly instanceId = Symbol('neural-toast');
  private swipeState: SwipeState | null = null;
  private announcementSequence = 0;

  readonly channel = input<string | undefined, string | undefined>(undefined, {
    transform: normalizeOptionalChannel,
  });
  readonly position = input<
    NeuralToastPosition | undefined,
    NeuralToastPosition | string | undefined
  >(undefined, { transform: normalizeOptionalPosition });
  readonly ariaLabel = input<string | undefined, string | undefined>(
    undefined,
    { transform: (value) => normalizeOptionalLabel(value, 'ariaLabel') },
  );
  readonly closeLabel = input<string | undefined, string | undefined>(
    undefined,
    { transform: (value) => normalizeOptionalLabel(value, 'closeLabel') },
  );
  readonly toastClass = input('');
  readonly messageClass = input('');
  readonly icon = input(true, { transform: booleanAttribute });
  readonly iconClass = input('');
  readonly classes = input<NeuralToastClasses>({});
  readonly unstyled = input<boolean | undefined, unknown>(undefined, {
    transform: optionalBooleanAttribute,
  });
  readonly pauseOnInteraction = input<boolean | undefined, unknown>(undefined, {
    transform: optionalBooleanAttribute,
  });
  readonly showProgress = input<boolean | undefined, unknown>(undefined, {
    transform: optionalBooleanAttribute,
  });
  readonly swipeToDismiss = input<boolean | undefined, unknown>(undefined, {
    transform: optionalBooleanAttribute,
  });
  readonly swipeThreshold = input<number | undefined, unknown>(undefined, {
    transform: optionalPositiveNumber,
  });
  readonly animated = input<boolean | undefined, unknown>(undefined, {
    transform: optionalBooleanAttribute,
  });

  protected readonly toastTemplate = contentChild(NeuralToastTemplateDirective);
  protected readonly paused = signal(false);
  protected readonly politeAnnouncement = signal('');
  protected readonly assertiveAnnouncement = signal('');
  protected readonly effectiveChannel = computed(
    () => this.channel() ?? this.toastConfig.channel,
  );
  protected readonly effectivePosition = computed(
    () => this.position() ?? this.toastConfig.position,
  );
  protected readonly effectiveAriaLabel = computed(
    () => this.ariaLabel() ?? this.toastConfig.ariaLabel,
  );
  protected readonly effectiveCloseLabel = computed(
    () => this.closeLabel() ?? this.toastConfig.closeLabel,
  );
  protected readonly effectiveUnstyled = computed(
    () => this.unstyled() ?? this.neuralConfig.unstyled,
  );
  protected readonly effectivePauseOnInteraction = computed(
    () => this.pauseOnInteraction() ?? this.toastConfig.pauseOnInteraction,
  );
  protected readonly effectiveShowProgress = computed(
    () => this.showProgress() ?? this.toastConfig.showProgress,
  );
  protected readonly effectiveSwipeToDismiss = computed(
    () => this.swipeToDismiss() ?? this.toastConfig.swipeToDismiss,
  );
  protected readonly effectiveSwipeThreshold = computed(
    () => this.swipeThreshold() ?? this.toastConfig.swipeThreshold,
  );
  protected readonly effectiveAnimated = computed(
    () => this.animated() ?? this.toastConfig.animated,
  );
  protected readonly visibleMessages = computed(() =>
    this.messageService
      .messages()
      .filter((message) => message.channel === this.effectiveChannel()),
  );
  protected readonly computedToastClass = computed(() =>
    joinClasses(
      'neural-toast-root',
      `neural-toast-position-${this.effectivePosition()}`,
      this.toastClass(),
      this.classes().root,
    ),
  );
  protected readonly liveRegionClass = computed(() =>
    joinClasses('neural-toast-live-region', this.classes().liveRegion),
  );
  protected readonly itemClass = computed(() =>
    joinClasses('neural-toast-item', this.classes().item),
  );
  protected readonly contentClass = computed(() =>
    joinClasses('neural-toast-content', this.classes().content),
  );
  protected readonly titleClass = computed(() =>
    joinClasses('neural-toast-title', this.classes().title),
  );
  protected readonly detailClass = computed(() =>
    joinClasses('neural-toast-detail', this.classes().detail),
  );
  protected readonly progressTrackClass = computed(() =>
    joinClasses('neural-toast-progress', this.classes().progressTrack),
  );
  protected readonly progressValueClass = computed(() =>
    joinClasses('neural-toast-progress-value', this.classes().progressValue),
  );
  protected readonly animationEnterClass = computed(() =>
    this.effectiveAnimated() && !this.effectiveUnstyled()
      ? 'neural-toast-enter'
      : '',
  );
  protected readonly animationLeaveClass = computed(() =>
    this.effectiveAnimated() && !this.effectiveUnstyled()
      ? 'neural-toast-leave'
      : '',
  );

  constructor() {
    afterNextRender(() => this.browserReady.set(true));

    effect(() => {
      const messages = this.visibleMessages();
      this.updateAnnouncements(messages);
      this.warnForInaccessiblePersistence(messages);

      if (this.browserReady()) {
        this.syncTimers(messages);
      }
    });

    effect((onCleanup) => {
      if (!this.browserReady()) return;
      onCleanup(
        this.outletRegistry.register(this.effectiveChannel(), this.instanceId),
      );
    });

    effect(() => {
      if (!this.effectivePauseOnInteraction() && this.pauseSources.size > 0) {
        this.resumeAll();
      }
    });

    inject(DestroyRef).onDestroy(() => this.clearTimers());
  }

  protected computedMessageClass(message: NeuralMessageRecord): string {
    return joinClasses(
      'neural-toast-message-root',
      this.effectiveUnstyled() ? '' : 'neural-toast-message-base',
      `neural-toast-message-${message.severity}`,
      !this.toastTemplate() && !this.icon()
        ? 'neural-toast-message-without-icon'
        : '',
      this.messageClass(),
      this.classes().message,
    );
  }

  protected computedCloseClass(): string {
    return joinClasses(
      'neural-toast-close-root',
      this.effectiveUnstyled() ? '' : 'neural-toast-close-base',
      this.classes().closeButton,
    );
  }

  protected templateContext(
    message: NeuralMessageRecord,
  ): NeuralToastTemplateContext {
    return {
      $implicit: message,
      message,
      dismiss: () => this.dismiss(message.id),
      paused: this.paused(),
      remaining: this.remainingFor(message.id),
      progress: this.progressFor(message),
    };
  }

  protected dismiss(id: string): void {
    this.messageService.dismiss(id, 'user');
  }

  protected computedIconClass(message: NeuralMessageRecord): string {
    const customClass = this.iconClass().trim();
    return joinClasses(
      'neural-toast-icon',
      customClass
        ? normalizeIconClass(customClass)
        : DEFAULT_ICON_CLASSES[message.severity],
      this.classes().icon,
    );
  }

  protected pause(source: PauseSource): void {
    if (!this.effectivePauseOnInteraction() || this.pauseSources.has(source)) {
      return;
    }
    this.pauseSources.add(source);
    if (this.pauseSources.size > 1) return;

    const now = Date.now();
    for (const timer of this.timers.values()) {
      clearTimeout(timer.handle);
      timer.remaining = Math.max(0, timer.remaining - (now - timer.startedAt));
    }
    this.paused.set(true);
  }

  protected resume(source: PauseSource): void {
    if (!this.pauseSources.delete(source) || this.pauseSources.size > 0) return;
    this.resumeTimers();
  }

  protected onFocusOut(event: FocusEvent): void {
    const current = event.currentTarget;
    const next = event.relatedTarget;
    if (
      current instanceof Node &&
      next instanceof Node &&
      current.contains(next)
    ) {
      return;
    }
    this.resume('focus');
  }

  protected swipeOffset(id: string): number {
    return this.swipeOffsets()[id] ?? 0;
  }

  protected isSwiping(id: string): boolean {
    return this.swipeState?.id === id;
  }

  protected onPointerDown(event: PointerEvent, id: string): void {
    if (
      !this.effectiveSwipeToDismiss() ||
      event.pointerType === 'mouse' ||
      event.button !== 0 ||
      !this.visibleMessages().find((message) => message.id === id)
        ?.dismissible ||
      (event.target as Element).closest('button')
    ) {
      return;
    }

    const element = event.currentTarget as HTMLElement;
    try {
      element.setPointerCapture?.(event.pointerId);
    } catch {
      // Synthetic events and already-cancelled pointers cannot be captured.
    }
    this.swipeState = {
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      currentX: event.clientX,
    };
    this.pause('swipe');
  }

  protected onPointerMove(event: PointerEvent): void {
    const swipe = this.swipeState;
    if (!swipe || swipe.pointerId !== event.pointerId) return;

    swipe.currentX = event.clientX;
    const offset = event.clientX - swipe.startX;
    if (Math.abs(offset) > Math.abs(event.clientY - swipe.startY)) {
      event.preventDefault();
    }
    this.swipeOffsets.update((offsets) => ({ ...offsets, [swipe.id]: offset }));
  }

  protected onPointerUp(event: PointerEvent): void {
    if (this.swipeState?.pointerId !== event.pointerId) return;
    const { id, startX, currentX } = this.swipeState;
    const shouldDismiss =
      Math.abs(currentX - startX) >= this.effectiveSwipeThreshold();
    this.finishSwipe();
    if (shouldDismiss) this.dismiss(id);
  }

  protected onPointerCancel(event: PointerEvent): void {
    if (this.swipeState?.pointerId === event.pointerId) this.finishSwipe();
  }

  private finishSwipe(): void {
    const id = this.swipeState?.id;
    this.swipeState = null;
    if (id) {
      this.swipeOffsets.update((offsets) => ({ ...offsets, [id]: 0 }));
    }
    this.resume('swipe');
  }

  private syncTimers(messages: readonly NeuralMessageRecord[]): void {
    const activeIds = new Set(messages.map((message) => message.id));
    for (const [id, timer] of this.timers) {
      if (!activeIds.has(id)) {
        clearTimeout(timer.handle);
        this.timers.delete(id);
      }
    }
    for (const message of messages) {
      if (message.duration === null || this.timers.has(message.id)) continue;
      const timer: ToastTimer = {
        handle: undefined,
        remaining: message.duration,
        startedAt: Date.now(),
      };
      this.timers.set(message.id, timer);
      if (!this.paused()) this.startTimer(message.id, timer);
    }
  }

  private startTimer(id: string, timer: ToastTimer): void {
    clearTimeout(timer.handle);
    timer.startedAt = Date.now();
    timer.handle = setTimeout(() => {
      this.timers.delete(id);
      this.messageService.dismiss(id, 'timeout');
    }, timer.remaining);
  }

  private resumeTimers(): void {
    this.paused.set(false);
    for (const [id, timer] of this.timers) this.startTimer(id, timer);
  }

  private resumeAll(): void {
    this.pauseSources.clear();
    this.resumeTimers();
  }

  private remainingFor(id: string): number | null {
    const timer = this.timers.get(id);
    if (!timer) return null;
    return this.paused()
      ? timer.remaining
      : Math.max(0, timer.remaining - (Date.now() - timer.startedAt));
  }

  private progressFor(message: NeuralMessageRecord): number | null {
    if (message.duration === null) return null;
    return (
      (this.remainingFor(message.id) ?? message.duration) / message.duration
    );
  }

  private updateAnnouncements(messages: readonly NeuralMessageRecord[]): void {
    const added = messages.filter(
      (message) => !this.seenAnnouncementIds.has(message.id),
    );
    for (const message of added) this.seenAnnouncementIds.add(message.id);
    const suffix = '\u2060'.repeat((++this.announcementSequence % 3) + 1);
    const text = (message: NeuralMessageRecord) =>
      [message.title, message.message].filter(Boolean).join('. ');
    const polite = added.filter((message) => !isImportant(message)).map(text);
    const assertive = added.filter(isImportant).map(text);
    if (polite.length) this.politeAnnouncement.set(polite.join('. ') + suffix);
    if (assertive.length) {
      this.assertiveAnnouncement.set(assertive.join('. ') + suffix);
    }
  }

  private warnForInaccessiblePersistence(
    messages: readonly NeuralMessageRecord[],
  ): void {
    if (!isDevMode()) return;
    for (const message of messages) {
      if (
        message.duration === null &&
        !message.dismissible &&
        !this.warnedMessageIds.has(message.id)
      ) {
        this.warnedMessageIds.add(message.id);
        console.warn(
          `NeuralNg toast: persistent non-dismissible message "${message.id}" can only be cleared through the Message API.`,
        );
      }
    }
  }

  private clearTimers(): void {
    for (const timer of this.timers.values()) clearTimeout(timer.handle);
    this.timers.clear();
  }
}

@Injectable({ providedIn: 'root' })
class ToastOutletRegistry {
  private readonly outlets = new Map<string, Set<symbol>>();

  register(channel: string, id: symbol): () => void {
    const outlets = this.outlets.get(channel) ?? new Set<symbol>();
    outlets.add(id);
    this.outlets.set(channel, outlets);
    if (isDevMode() && outlets.size > 1) {
      console.warn(
        `NeuralNg toast: multiple outlets are rendering channel "${channel}". Use one outlet per channel.`,
      );
    }
    return () => {
      outlets.delete(id);
      if (outlets.size === 0) this.outlets.delete(channel);
    };
  }
}

type PauseSource = 'pointer' | 'focus' | 'swipe';

interface ToastTimer {
  handle: ReturnType<typeof setTimeout> | undefined;
  remaining: number;
  startedAt: number;
}

interface SwipeState {
  readonly id: string;
  readonly pointerId: number;
  readonly startX: number;
  readonly startY: number;
  currentX: number;
}

function isImportant(message: NeuralMessageRecord): boolean {
  return message.severity === 'warning' || message.severity === 'error';
}

function normalizeOptionalChannel(
  value: string | undefined,
): string | undefined {
  if (value === undefined) return undefined;
  const channel = value.trim();
  if (!channel) throw new Error('NeuralNg toast: channel cannot be empty.');
  return channel;
}

function normalizeOptionalPosition(
  value: NeuralToastPosition | string | undefined,
): NeuralToastPosition | undefined {
  return value === undefined ? undefined : normalizeToastPosition(value);
}

function optionalBooleanAttribute(value: unknown): boolean | undefined {
  return value === undefined ? undefined : booleanAttribute(value);
}

function optionalPositiveNumber(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  const parsed = numberAttribute(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error('NeuralNg toast: swipeThreshold must be positive.');
  }
  return parsed;
}

function normalizeOptionalLabel(
  value: string | undefined,
  property: 'ariaLabel' | 'closeLabel',
): string | undefined {
  if (value === undefined) return undefined;
  const label = value.trim();
  if (!label) throw new Error(`NeuralNg toast: ${property} cannot be empty.`);
  return label;
}

function normalizeIconClass(value: string): string {
  const classes = value.split(/\s+/);
  const usesNeuralIcon = classes.some((className) =>
    className.startsWith('nt-'),
  );
  const hasNeuralBase = classes.includes('nt');
  return usesNeuralIcon && !hasNeuralBase ? `nt ${value}` : value;
}

function joinClasses(...classes: (string | undefined)[]): string {
  return classes
    .map((value) => value?.trim() ?? '')
    .filter(Boolean)
    .join(' ');
}

/** @deprecated Import and use `NeuralToast` instead. */
export { NeuralToast as ToastComponent };
