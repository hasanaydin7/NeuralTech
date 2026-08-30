import { DOCUMENT, NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  PLATFORM_ID,
  TemplateRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NEURAL_NG_CONFIG, NeuralLocaleService } from '@neural-ng/core';
import {
  NeuralProgressSpinner,
  type NeuralProgressSpinnerSeverity,
  type NeuralProgressSpinnerSize,
} from '@neural-ng/core/progress-spinner';
import type {
  NeuralLoadingOverlayClasses,
  NeuralLoadingOverlayScope,
} from './loading-overlay.types';

interface LoadingOverlayScrollLock {
  count: number;
  readonly previousOverflow: string;
}

const loadingOverlayScrollLocks = new WeakMap<
  Document,
  LoadingOverlayScrollLock
>();

@Directive({
  selector: 'ng-template[neuralLoadingIndicator]',
  standalone: true,
})
export class NeuralLoadingIndicator {
  readonly template = inject<TemplateRef<void>>(TemplateRef);
}

@Component({
  selector: 'neural-loading-overlay',
  standalone: true,
  imports: [NgTemplateOutlet, NeuralProgressSpinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-loading-overlay-host' },
  template: `
    <div
      [class]="rootClass()"
      [attr.data-scope]="scope()"
      [attr.data-active]="active() ? 'true' : null"
      [attr.data-visible]="rendered() ? 'true' : null"
    >
      <div
        [class]="contentClass()"
        [attr.aria-busy]="active() ? 'true' : null"
        [attr.inert]="contentIsInert() ? '' : null"
      >
        <ng-content />
      </div>

      @if (rendered() && scope() === 'container') {
        <div
          class="neural-loading-overlay-layer-root"
          [attr.data-block-interaction]="blockInteraction() ? 'true' : 'false'"
        >
          @if (backdrop()) {
            <span [class]="backdropClass()" aria-hidden="true"></span>
          }
          <div
            #containerPanel
            [class]="panelClass()"
            [attr.role]="hasCustomIndicator() ? 'status' : null"
            [attr.aria-live]="hasCustomIndicator() ? 'polite' : null"
            [attr.aria-label]="hasCustomIndicator() ? effectiveLabel() : null"
            [attr.tabindex]="blockInteraction() ? -1 : null"
          >
            <ng-container [ngTemplateOutlet]="indicatorContent" />
          </div>
        </div>
      }

      @if (rendered() && scope() === 'viewport') {
        <dialog
          #viewportDialog
          [class]="viewportClass()"
          [attr.aria-label]="effectiveLabel()"
          [attr.data-block-interaction]="blockInteraction() ? 'true' : 'false'"
          tabindex="-1"
          (cancel)="preventCancel($event)"
        >
          @if (backdrop()) {
            <span [class]="backdropClass()" aria-hidden="true"></span>
          }
          <div
            [class]="panelClass()"
            [attr.role]="hasCustomIndicator() ? 'status' : null"
            [attr.aria-live]="hasCustomIndicator() ? 'polite' : null"
          >
            <ng-container [ngTemplateOutlet]="indicatorContent" />
          </div>
        </dialog>
      }
    </div>

    <ng-template #indicatorContent>
      <span [class]="indicatorClass()">
        @if (indicatorTemplate(); as customIndicator) {
          <ng-container [ngTemplateOutlet]="customIndicator.template" />
        } @else {
          <neural-progress-spinner
            [size]="spinnerSize()"
            [severity]="spinnerSeverity()"
            [ariaLabel]="effectiveLabel()"
            [showLabel]="false"
          />
        }
      </span>
      @if (showLabel()) {
        <span [class]="labelClass()">{{ effectiveLabel() }}</span>
      }
    </ng-template>
  `,
  styles: `
    :where(.neural-loading-overlay-host) {
      display: block;
    }

    :where(
      .neural-loading-overlay-root,
      .neural-loading-overlay-content-root,
      .neural-loading-overlay-layer-root,
      .neural-loading-overlay-backdrop-root,
      .neural-loading-overlay-panel-root,
      .neural-loading-overlay-indicator-root,
      .neural-loading-overlay-label-root,
      .neural-loading-overlay-viewport-root
    ) {
      box-sizing: border-box;
    }

    :where(.neural-loading-overlay-root) {
      position: relative;
      display: block;
      min-width: 0;
    }

    :where(.neural-loading-overlay-content-root) {
      min-width: 0;
    }

    :where(.neural-loading-overlay-layer-root) {
      position: absolute;
      z-index: var(--neural-loading-overlay-z-index, 900);
      inset: 0;
      display: grid;
      place-items: center;
      overflow: hidden;
    }

    :where(.neural-loading-overlay-layer-root[data-block-interaction='false']) {
      pointer-events: none;
    }

    :where(.neural-loading-overlay-backdrop-root) {
      position: absolute;
      inset: 0;
    }

    :where(.neural-loading-overlay-panel-root) {
      position: relative;
      z-index: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    :where(.neural-loading-overlay-viewport-root) {
      position: fixed;
      z-index: var(--neural-loading-overlay-viewport-z-index, 1200);
      inset: 0;
      width: 100vw;
      max-width: none;
      height: 100dvh;
      max-height: none;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: transparent;
      border: 0;
    }

    :where(.neural-loading-overlay-viewport-root[open]) {
      display: grid;
      place-items: center;
    }

    :where(.neural-loading-overlay-viewport-root::backdrop) {
      background: transparent;
    }

    :where(
      .neural-loading-overlay-viewport-root[data-block-interaction='false']
    ) {
      pointer-events: none;
    }

    :where(.neural-loading-overlay-viewport-root)
      > .neural-loading-overlay-backdrop-root {
      position: fixed;
    }

    :where(.neural-loading-overlay-backdrop-base) {
      background: var(--neural-loading-overlay-backdrop, rgb(15 23 42 / 0.46));
      backdrop-filter: var(--neural-loading-overlay-backdrop-filter, none);
      animation: neural-loading-overlay-fade
        var(--neural-loading-overlay-enter-duration, 160ms) ease-out;
    }

    :where(.neural-loading-overlay-panel-base) {
      flex-direction: column;
      gap: var(--neural-loading-overlay-panel-gap, 0.75rem);
      min-width: var(--neural-loading-overlay-panel-min-width, 8rem);
      padding: var(--neural-loading-overlay-panel-padding, 1.25rem 1.5rem);
      color: var(--neural-loading-overlay-panel-color, CanvasText);
      background: var(--neural-loading-overlay-panel-background, Canvas);
      border: var(--neural-loading-overlay-panel-border, 1px solid transparent);
      border-radius: var(--neural-loading-overlay-panel-radius, 0.75rem);
      box-shadow: var(--neural-loading-overlay-panel-shadow, none);
      font-family: var(--neural-loading-overlay-font-family, inherit);
      animation: neural-loading-overlay-panel-enter
        var(--neural-loading-overlay-enter-duration, 160ms) ease-out;
    }

    :where(.neural-loading-overlay-indicator-root) {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    :where(.neural-loading-overlay-label-base) {
      color: var(--neural-loading-overlay-label-color, inherit);
      font-size: var(--neural-loading-overlay-label-font-size, 0.875rem);
      font-weight: var(--neural-loading-overlay-label-font-weight, 650);
      line-height: var(--neural-loading-overlay-label-line-height, 1.35);
      text-align: center;
    }

    @keyframes neural-loading-overlay-fade {
      from {
        opacity: 0;
      }
    }

    @keyframes neural-loading-overlay-panel-enter {
      from {
        opacity: 0;
        transform: translateY(
            var(--neural-loading-overlay-enter-distance, 0.25rem)
          )
          scale(var(--neural-loading-overlay-enter-scale, 0.98));
      }
    }

    @media (prefers-reduced-motion: reduce) {
      :where(.neural-loading-overlay-backdrop-root),
      :where(.neural-loading-overlay-panel-root) {
        animation-duration: 0.01ms;
      }
    }
  `,
})
export class NeuralLoadingOverlay {
  private readonly config = inject(NEURAL_NG_CONFIG);
  private readonly locale = inject(NeuralLocaleService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly indicator = contentChild(NeuralLoadingIndicator);
  private readonly containerPanel =
    viewChild<ElementRef<HTMLElement>>('containerPanel');
  private readonly viewportDialog =
    viewChild<ElementRef<HTMLDialogElement>>('viewportDialog');
  private readonly renderedState = signal(false);
  private showTimer: ReturnType<typeof setTimeout> | undefined;
  private hideTimer: ReturnType<typeof setTimeout> | undefined;
  private restoreFocusTimer: ReturnType<typeof setTimeout> | undefined;
  private visibleSince = 0;
  private opener: HTMLElement | null = null;
  private scrollLockRelease: (() => void) | undefined;

  readonly active = input(false, { transform: booleanAttribute });
  readonly scope = input<NeuralLoadingOverlayScope>('container');
  readonly label = input<string | null>(null);
  readonly showLabel = input(true, { transform: booleanAttribute });
  readonly backdrop = input(true, { transform: booleanAttribute });
  readonly blockInteraction = input(true, { transform: booleanAttribute });
  readonly lockScroll = input(true, { transform: booleanAttribute });
  readonly delay = input(150, { transform: numberAttribute });
  readonly minimumDuration = input(300, { transform: numberAttribute });
  readonly spinnerSize = input<NeuralProgressSpinnerSize>('large');
  readonly spinnerSeverity = input<NeuralProgressSpinnerSeverity>('info');
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly overlayClass = input('');
  readonly classes = input<NeuralLoadingOverlayClasses>({});

  readonly shown = output<void>();
  readonly hidden = output<void>();

  readonly rendered = this.renderedState.asReadonly();
  readonly indicatorTemplate = computed(() => this.indicator());
  readonly hasCustomIndicator = computed(
    () => this.indicatorTemplate() !== undefined,
  );
  readonly effectiveUnstyled = computed(
    () => this.unstyled() || this.config.unstyled,
  );
  readonly effectiveLabel = computed(
    () => this.label()?.trim() || this.locale.messages().common.loading,
  );
  readonly normalizedDelay = computed(() =>
    this.clampDuration(this.delay(), 150),
  );
  readonly normalizedMinimumDuration = computed(() =>
    this.clampDuration(this.minimumDuration(), 300),
  );
  readonly contentIsInert = computed(
    () => this.active() && this.blockInteraction(),
  );
  readonly rootClass = computed(() =>
    this.compose(
      'neural-loading-overlay-root',
      'neural-loading-overlay-base',
      this.overlayClass(),
      this.classes().root,
    ),
  );
  readonly contentClass = computed(() =>
    this.compose(
      'neural-loading-overlay-content-root',
      'neural-loading-overlay-content-base',
      this.classes().content,
    ),
  );
  readonly backdropClass = computed(() =>
    this.compose(
      'neural-loading-overlay-backdrop-root',
      'neural-loading-overlay-backdrop-base',
      this.classes().backdrop,
    ),
  );
  readonly panelClass = computed(() =>
    this.compose(
      'neural-loading-overlay-panel-root',
      'neural-loading-overlay-panel-base',
      this.classes().panel,
    ),
  );
  readonly indicatorClass = computed(() =>
    this.compose(
      'neural-loading-overlay-indicator-root',
      'neural-loading-overlay-indicator-base',
      this.classes().indicator,
    ),
  );
  readonly labelClass = computed(() =>
    this.compose(
      'neural-loading-overlay-label-root',
      'neural-loading-overlay-label-base',
      this.classes().label,
    ),
  );
  readonly viewportClass = computed(() =>
    [
      'neural-loading-overlay-viewport-root',
      this.effectiveUnstyled() ? '' : 'neural-loading-overlay-viewport-base',
    ]
      .filter(Boolean)
      .join(' '),
  );

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.clearTimers();
      this.releaseScrollLock();
    });

    effect(() => {
      const active = this.active();
      const delay = this.normalizedDelay();
      const minimumDuration = this.normalizedMinimumDuration();
      if (!isPlatformBrowser(this.platformId)) return;

      if (active) {
        this.clearHideTimer();
        if (this.renderedState() || this.showTimer !== undefined) return;
        this.opener =
          this.document.activeElement instanceof HTMLElement
            ? this.document.activeElement
            : null;
        if (delay === 0) {
          this.showNow();
          return;
        }
        this.showTimer = setTimeout(() => {
          this.showTimer = undefined;
          if (this.active()) this.showNow();
        }, delay);
        return;
      }

      this.clearShowTimer();
      if (!this.renderedState()) {
        this.opener = null;
        return;
      }
      const elapsed = Date.now() - this.visibleSince;
      const remaining = Math.max(0, minimumDuration - elapsed);
      if (remaining === 0) {
        this.hideNow();
        return;
      }
      if (this.hideTimer !== undefined) return;
      this.hideTimer = setTimeout(() => {
        this.hideTimer = undefined;
        if (!this.active()) this.hideNow();
      }, remaining);
    });

    effect(() => {
      const dialog = this.viewportDialog()?.nativeElement;
      if (!isPlatformBrowser(this.platformId) || !dialog) return;
      if (!dialog.open) {
        if (this.blockInteraction()) dialog.showModal();
        else dialog.show();
      }
      if (this.blockInteraction()) {
        dialog.focus({ preventScroll: true });
      }
    });

    effect(() => {
      const panel = this.containerPanel()?.nativeElement;
      if (
        !isPlatformBrowser(this.platformId) ||
        !panel ||
        !this.blockInteraction()
      ) {
        return;
      }
      panel.focus({ preventScroll: true });
    });

    effect(() => {
      const shouldLock =
        this.renderedState() &&
        this.scope() === 'viewport' &&
        this.blockInteraction() &&
        this.lockScroll();
      if (!isPlatformBrowser(this.platformId)) return;
      if (shouldLock) this.acquireScrollLock();
      else this.releaseScrollLock();
    });
  }

  preventCancel(event: Event): void {
    event.preventDefault();
  }

  private showNow(): void {
    if (this.renderedState()) return;
    this.visibleSince = Date.now();
    this.renderedState.set(true);
    this.shown.emit();
  }

  private hideNow(): void {
    if (!this.renderedState()) return;
    const dialog = this.viewportDialog()?.nativeElement;
    if (dialog?.open) dialog.close();
    this.renderedState.set(false);
    this.releaseScrollLock();
    this.hidden.emit();
    const opener = this.opener;
    this.opener = null;
    this.restoreFocusTimer = setTimeout(() => {
      this.restoreFocusTimer = undefined;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    }, 0);
  }

  private acquireScrollLock(): void {
    if (this.scrollLockRelease) return;
    const existing = loadingOverlayScrollLocks.get(this.document);
    if (existing) {
      existing.count += 1;
    } else {
      loadingOverlayScrollLocks.set(this.document, {
        count: 1,
        previousOverflow: this.document.documentElement.style.overflow,
      });
      this.document.documentElement.style.overflow = 'hidden';
    }
    let released = false;
    this.scrollLockRelease = () => {
      if (released) return;
      released = true;
      const state = loadingOverlayScrollLocks.get(this.document);
      if (!state) return;
      state.count -= 1;
      if (state.count > 0) return;
      this.document.documentElement.style.overflow = state.previousOverflow;
      loadingOverlayScrollLocks.delete(this.document);
    };
  }

  private releaseScrollLock(): void {
    this.scrollLockRelease?.();
    this.scrollLockRelease = undefined;
  }

  private clearTimers(): void {
    this.clearShowTimer();
    this.clearHideTimer();
    if (this.restoreFocusTimer !== undefined) {
      clearTimeout(this.restoreFocusTimer);
      this.restoreFocusTimer = undefined;
    }
  }

  private clearShowTimer(): void {
    if (this.showTimer === undefined) return;
    clearTimeout(this.showTimer);
    this.showTimer = undefined;
  }

  private clearHideTimer(): void {
    if (this.hideTimer === undefined) return;
    clearTimeout(this.hideTimer);
    this.hideTimer = undefined;
  }

  private clampDuration(value: number, fallback: number): number {
    const normalized = Number.isFinite(value) ? value : fallback;
    return Math.min(60_000, Math.max(0, normalized));
  }

  private compose(
    structural: string,
    visual: string,
    ...consumer: Array<string | undefined>
  ): string {
    return [structural, this.effectiveUnstyled() ? '' : visual, ...consumer]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(' ');
  }
}

/** @deprecated Use NeuralLoadingIndicator. */
export { NeuralLoadingIndicator as LoadingIndicatorDirective };
/** @deprecated Use NeuralLoadingOverlay. */
export { NeuralLoadingOverlay as LoadingOverlayComponent };
