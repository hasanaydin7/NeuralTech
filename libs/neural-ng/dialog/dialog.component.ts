import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  PLATFORM_ID,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { NEURAL_NG_CONFIG, NeuralLocaleService } from '@neural-ng/core';
import type {
  NeuralDialogClasses,
  NeuralDialogClose,
  NeuralDialogCloseReason,
} from './dialog.types';

@Directive({
  selector: '[neuralDialogInitialFocus]',
  standalone: true,
})
export class NeuralDialogInitialFocus {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);

  focus(): void {
    this.element.nativeElement.focus({ preventScroll: true });
  }
}

@Component({
  selector: 'neural-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neural-dialog-host',
    '[class.neural-dialog-host-fluid]': 'fluid()',
    '[class.neural-dialog-host-full]': 'effectiveFull()',
  },
  template: `
    <!-- eslint-disable-next-line @angular-eslint/template/interactive-supports-focus -->
    <dialog
      #nativeDialog
      [class]="rootClass()"
      [attr.aria-label]="normalizedAriaLabel()"
      [attr.aria-labelledby]="normalizedAriaLabelledby()"
      [attr.aria-describedby]="normalizedAriaDescribedby()"
      [attr.aria-modal]="modal() ? 'true' : null"
      [attr.data-fluid]="fluid() ? 'true' : null"
      (cancel)="handleCancel($event)"
      (close)="handleNativeClose($event)"
      (click)="handleBackdropClick($event)"
      (keydown.escape)="handleNonModalEscape($event)"
    >
      @if (showFullScreenButton()) {
        <button
          type="button"
          [class]="fullScreenButtonClass()"
          [attr.aria-label]="effectiveFullScreenLabel()"
          [attr.aria-pressed]="effectiveFull() ? 'true' : 'false'"
          (click)="toggleFullScreen($event)"
        >
          <span [class]="fullScreenIconClass()" aria-hidden="true"></span>
        </button>
      }
      @if (closable()) {
        <button
          type="button"
          [class]="closeButtonClass()"
          [attr.aria-label]="effectiveCloseLabel()"
          (click)="close('close-button', '', $event)"
        >
          <span [class]="closeIconClass()" aria-hidden="true"></span>
        </button>
      }
      <ng-content />
    </dialog>
  `,
  styles: `
    :where(.neural-dialog-host),
    :where(.neural-dialog-section-host) {
      display: contents;
    }

    :where(.neural-dialog-root) {
      position: fixed;
      inset: 0;
      box-sizing: border-box;
      min-width: 0;
      max-width: calc(100vw - 2rem);
      max-height: calc(100dvh - 2rem);
      margin: auto;
      overflow: auto;
    }

    :where(.neural-dialog-header-root) {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      min-width: 0;
    }

    :where(.neural-dialog-body-root) {
      box-sizing: border-box;
      min-width: 0;
    }

    :where(.neural-dialog-footer-root) {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      min-width: 0;
    }

    :where(.neural-dialog-close-root) {
      position: absolute;
      z-index: 1;
      inset-block-start: var(--neural-dialog-close-inset, 0.75rem);
      inset-inline-end: var(--neural-dialog-close-inset, 0.75rem);
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    :where(.neural-dialog-full-screen-root) {
      position: absolute;
      z-index: 1;
      inset-block-start: var(--neural-dialog-close-inset, 0.75rem);
      inset-inline-end: var(--neural-dialog-close-inset, 0.75rem);
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    :where(
      .neural-dialog-root:has(.neural-dialog-close-root)
        .neural-dialog-full-screen-root
    ) {
      inset-inline-end: calc(
        var(--neural-dialog-close-inset, 0.75rem) +
          var(--neural-dialog-close-size, 2rem) + 0.375rem
      );
    }

    :where(.neural-dialog-base) {
      width: var(--neural-dialog-width, min(32rem, calc(100vw - 2rem)));
      padding: 0;
      color: var(--neural-dialog-color, inherit);
      background: var(--neural-dialog-background, Canvas);
      border: var(--neural-dialog-border, 1px solid currentColor);
      border-radius: var(--neural-dialog-radius, 0.75rem);
      box-shadow: var(--neural-dialog-shadow, none);
      font-family: var(--neural-dialog-font-family, inherit);
      opacity: 0;
      transform: translateY(var(--neural-dialog-enter-distance, 0.5rem))
        scale(var(--neural-dialog-enter-scale, 0.98));
      transition:
        opacity var(--neural-dialog-leave-duration, 120ms)
          var(--neural-dialog-leave-easing, ease-in),
        transform var(--neural-dialog-leave-duration, 120ms)
          var(--neural-dialog-leave-easing, ease-in),
        overlay var(--neural-dialog-leave-duration, 120ms) allow-discrete,
        display var(--neural-dialog-leave-duration, 120ms) allow-discrete;
    }

    :where(.neural-dialog-base[open]) {
      opacity: 1;
      transform: none;
      transition:
        opacity var(--neural-dialog-enter-duration, 160ms)
          var(--neural-dialog-enter-easing, ease-out),
        transform var(--neural-dialog-enter-duration, 160ms)
          var(--neural-dialog-enter-easing, ease-out),
        overlay var(--neural-dialog-enter-duration, 160ms) allow-discrete,
        display var(--neural-dialog-enter-duration, 160ms) allow-discrete;
    }

    @starting-style {
      :where(.neural-dialog-base[open]) {
        opacity: 0;
        transform: translateY(var(--neural-dialog-enter-distance, 0.5rem))
          scale(var(--neural-dialog-enter-scale, 0.98));
      }
    }

    :where(.neural-dialog-base::backdrop) {
      background: var(--neural-dialog-backdrop, rgb(15 23 42 / 0.5));
      backdrop-filter: var(--neural-dialog-backdrop-filter, none);
      opacity: 0;
      transition:
        opacity var(--neural-dialog-leave-duration, 120ms)
          var(--neural-dialog-leave-easing, ease-in),
        overlay var(--neural-dialog-leave-duration, 120ms) allow-discrete,
        display var(--neural-dialog-leave-duration, 120ms) allow-discrete;
    }

    :where(.neural-dialog-base[open]::backdrop) {
      opacity: 1;
      transition:
        opacity var(--neural-dialog-enter-duration, 160ms)
          var(--neural-dialog-enter-easing, ease-out),
        overlay var(--neural-dialog-enter-duration, 160ms) allow-discrete,
        display var(--neural-dialog-enter-duration, 160ms) allow-discrete;
    }

    @starting-style {
      :where(.neural-dialog-base[open]::backdrop) {
        opacity: 0;
      }
    }

    :where(.neural-dialog-fluid-base) {
      width: calc(100vw - 2rem);
    }

    :where(.neural-dialog-full-base) {
      inset: 0;
      width: 100vw;
      max-width: none;
      height: 100dvh;
      max-height: none;
      margin: 0;
      border: var(--neural-dialog-full-border, 0);
      border-radius: var(--neural-dialog-full-radius, 0);
      box-shadow: var(--neural-dialog-full-shadow, none);
    }

    :where(.neural-dialog-header-base) {
      justify-content: space-between;
      gap: var(--neural-dialog-header-gap, 0.75rem);
      padding: var(--neural-dialog-header-padding, 1rem 3.5rem 0.45rem 1.25rem);
      border-bottom: var(--neural-dialog-header-border, 0);
    }

    :where(.neural-dialog-body-base) {
      padding: var(--neural-dialog-body-padding, 0.55rem 1.25rem 0.7rem);
      color: var(--neural-dialog-body-color, inherit);
    }

    :where(
      .neural-dialog-root:not(:has(.neural-dialog-header-root))
        .neural-dialog-body-root
    ) {
      padding-block-start: 1.25rem;
    }

    :where(
      .neural-dialog-root:has(.neural-dialog-close-root):not(
          :has(.neural-dialog-header-root)
        )
        .neural-dialog-body-root
    ) {
      padding-inline-end: 3.5rem;
    }

    :where(.neural-dialog-footer-base) {
      justify-content: var(--neural-dialog-footer-justify, flex-end);
      gap: var(--neural-dialog-footer-gap, 0.75rem);
      padding: var(--neural-dialog-footer-padding, 0.45rem 1.25rem 1rem);
      border-top: var(--neural-dialog-footer-border, 0);
    }

    :where(.neural-dialog-close-base, .neural-dialog-full-screen-base) {
      width: var(--neural-dialog-close-size, 2rem);
      height: var(--neural-dialog-close-size, 2rem);
      padding: 0;
      color: var(--neural-dialog-close-color, inherit);
      background: var(--neural-dialog-close-background, transparent);
      border: var(--neural-dialog-close-border, 0);
      border-radius: var(--neural-dialog-close-radius, 999px);
      cursor: pointer;
      transition: var(--neural-dialog-transition, none);
    }

    :where(
      .neural-dialog-close-base:hover,
      .neural-dialog-full-screen-base:hover
    ) {
      color: var(--neural-dialog-close-color-hover, inherit);
      background: var(--neural-dialog-close-background-hover, transparent);
    }

    :where(
      .neural-dialog-close-base:focus-visible,
      .neural-dialog-full-screen-base:focus-visible
    ) {
      outline: var(--neural-dialog-focus-ring, 2px solid currentColor);
      outline-offset: var(--neural-dialog-focus-ring-offset, 2px);
    }

    :where(
      .neural-dialog-close-icon-base,
      .neural-dialog-full-screen-icon-base
    ) {
      font-size: var(--neural-dialog-close-icon-size, 1.25rem);
      line-height: 1;
    }

    @media (prefers-reduced-motion: reduce) {
      :where(.neural-dialog-base),
      :where(.neural-dialog-base::backdrop) {
        transition-duration: 0.01ms;
      }
    }
  `,
})
export class NeuralDialog {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly neuralConfig = inject(NEURAL_NG_CONFIG);
  private readonly locale = inject(NeuralLocaleService);
  private readonly nativeDialog =
    viewChild<ElementRef<HTMLDialogElement>>('nativeDialog');
  private readonly initialFocus = contentChild(NeuralDialogInitialFocus, {
    descendants: true,
  });
  private opener: HTMLElement | null = null;
  private restoreFocusTimer: ReturnType<typeof setTimeout> | undefined;
  private pendingClose:
    | {
        readonly reason: NeuralDialogCloseReason;
        readonly nativeEvent?: Event;
      }
    | undefined;

  readonly open = model(false);
  readonly modal = input(true, { transform: booleanAttribute });
  readonly closable = input(true, { transform: booleanAttribute });
  readonly closeOnEscape = input(true, { transform: booleanAttribute });
  readonly dismissibleBackdrop = input(true, { transform: booleanAttribute });
  readonly fluid = input(false, { transform: booleanAttribute });
  readonly full = input(false, { transform: booleanAttribute });
  readonly showFullScreenButton = input(false, {
    transform: booleanAttribute,
  });
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string | null>(null);
  readonly ariaLabelledby = input<string | null>(null);
  readonly ariaDescribedby = input<string | null>(null);
  readonly closeLabel = input<string | null>(null);
  readonly enterFullScreenLabel = input<string | null>(null);
  readonly exitFullScreenLabel = input<string | null>(null);
  readonly dialogClass = input('');
  readonly classes = input<NeuralDialogClasses>({});

  readonly opened = output<void>();
  readonly closed = output<NeuralDialogClose>();
  readonly fullChange = output<boolean>();
  private readonly interactiveFull = signal(false);

  readonly effectiveUnstyled = computed(
    () => this.unstyled() || this.neuralConfig.unstyled,
  );
  readonly normalizedAriaLabel = computed(
    () => this.ariaLabel()?.trim() || null,
  );
  readonly normalizedAriaLabelledby = computed(
    () => this.ariaLabelledby()?.trim() || null,
  );
  readonly normalizedAriaDescribedby = computed(
    () => this.ariaDescribedby()?.trim() || null,
  );
  readonly effectiveCloseLabel = computed(
    () => this.closeLabel()?.trim() || this.locale.messages().common.close,
  );
  readonly effectiveFull = computed(() => this.interactiveFull());
  readonly effectiveFullScreenLabel = computed(() =>
    this.effectiveFull()
      ? this.exitFullScreenLabel()?.trim() ||
        this.locale.messages().common.exitFullscreen
      : this.enterFullScreenLabel()?.trim() ||
        this.locale.messages().common.enterFullscreen,
  );
  readonly rootClass = computed(() =>
    this.composeClass(
      'neural-dialog-root',
      [
        'neural-dialog-base',
        this.fluid() ? 'neural-dialog-fluid-base' : '',
        this.effectiveFull() ? 'neural-dialog-full-base' : '',
      ].join(' '),
      this.dialogClass(),
      this.classes().root,
    ),
  );
  readonly closeButtonClass = computed(() =>
    this.composeClass(
      'neural-dialog-close-root',
      'neural-dialog-close-base',
      this.classes().closeButton,
    ),
  );
  readonly closeIconClass = computed(() =>
    this.composeClass(
      'neural-dialog-close-icon-root',
      'neural-dialog-close-icon-base nt nt-x',
      this.classes().closeIcon,
    ),
  );
  readonly fullScreenButtonClass = computed(() =>
    this.composeClass(
      'neural-dialog-full-screen-root',
      'neural-dialog-full-screen-base',
      this.classes().fullScreenButton,
    ),
  );
  readonly fullScreenIconClass = computed(() =>
    this.composeClass(
      'neural-dialog-full-screen-icon-root',
      `neural-dialog-full-screen-icon-base nt nt-${this.effectiveFull() ? 'minimize' : 'maximize'}`,
      this.classes().fullScreenIcon,
    ),
  );

  constructor() {
    effect(() => {
      const full = this.full();
      untracked(() => this.interactiveFull.set(full));
    });

    this.destroyRef.onDestroy(() => {
      if (this.restoreFocusTimer !== undefined) {
        clearTimeout(this.restoreFocusTimer);
      }
    });

    effect(() => {
      const dialog = this.nativeDialog()?.nativeElement;
      const shouldOpen = this.open();
      const modal = this.modal();
      if (!isPlatformBrowser(this.platformId) || !dialog) return;

      if (shouldOpen && !dialog.open) {
        if (this.restoreFocusTimer !== undefined) {
          clearTimeout(this.restoreFocusTimer);
          this.restoreFocusTimer = undefined;
        }
        this.opener =
          this.document.activeElement instanceof HTMLElement
            ? this.document.activeElement
            : null;
        if (modal) dialog.showModal();
        else dialog.show();
        this.opened.emit();
        queueMicrotask(() => {
          if (dialog.open) this.initialFocus()?.focus();
        });
        return;
      }

      if (!shouldOpen && dialog.open) {
        this.pendingClose ??= { reason: 'api' };
        dialog.close();
      }
    });
  }

  show(): void {
    this.open.set(true);
  }

  toggleFullScreen(nativeEvent?: Event): void {
    nativeEvent?.stopPropagation();
    const full = !this.effectiveFull();
    this.interactiveFull.set(full);
    this.fullChange.emit(full);
  }

  close(
    reason: NeuralDialogCloseReason = 'api',
    returnValue = '',
    nativeEvent?: Event,
  ): void {
    const dialog = this.nativeDialog()?.nativeElement;
    if (!dialog?.open) {
      this.open.set(false);
      return;
    }
    this.pendingClose = { reason, nativeEvent };
    dialog.close(returnValue);
  }

  handleCancel(event: Event): void {
    event.preventDefault();
    if (!this.closeOnEscape()) return;
    this.close('escape', '', event);
  }

  handleNonModalEscape(event: Event): void {
    if (this.modal()) return;
    event.preventDefault();
    if (this.closeOnEscape()) this.close('escape', '', event);
  }

  handleBackdropClick(event: MouseEvent): void {
    const dialog = this.nativeDialog()?.nativeElement;
    if (
      !dialog ||
      event.target !== dialog ||
      !this.modal() ||
      !this.dismissibleBackdrop()
    ) {
      return;
    }

    const bounds = dialog.getBoundingClientRect();
    const outside =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;
    if (outside) this.close('backdrop', '', event);
  }

  handleNativeClose(event: Event): void {
    const dialog = event.target as HTMLDialogElement;
    const pending = this.pendingClose;
    this.pendingClose = undefined;
    this.open.set(false);
    this.closed.emit({
      reason: pending?.reason ?? 'native',
      returnValue: dialog.returnValue,
      nativeEvent: pending?.nativeEvent ?? event,
    });

    const opener = this.opener;
    this.opener = null;
    this.restoreFocusTimer = setTimeout(() => {
      this.restoreFocusTimer = undefined;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    }, 0);
  }

  composeSlotClass(
    slot: 'header' | 'body' | 'footer',
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
  selector: 'neural-dialog-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-dialog-section-host' },
  template: `<header [class]="computedClass()"><ng-content /></header>`,
})
export class NeuralDialogHeader {
  private readonly dialog = inject(NeuralDialog, { host: true });
  readonly headerClass = input('');
  readonly computedClass = computed(() =>
    this.dialog.composeSlotClass(
      'header',
      'neural-dialog-header-root',
      'neural-dialog-header-base',
      this.headerClass(),
    ),
  );
}

@Component({
  selector: 'neural-dialog-body',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-dialog-section-host' },
  template: `<div [class]="computedClass()"><ng-content /></div>`,
})
export class NeuralDialogBody {
  private readonly dialog = inject(NeuralDialog, { host: true });
  readonly bodyClass = input('');
  readonly computedClass = computed(() =>
    this.dialog.composeSlotClass(
      'body',
      'neural-dialog-body-root',
      'neural-dialog-body-base',
      this.bodyClass(),
    ),
  );
}

@Component({
  selector: 'neural-dialog-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-dialog-section-host' },
  template: `<footer [class]="computedClass()"><ng-content /></footer>`,
})
export class NeuralDialogFooter {
  private readonly dialog = inject(NeuralDialog, { host: true });
  readonly footerClass = input('');
  readonly computedClass = computed(() =>
    this.dialog.composeSlotClass(
      'footer',
      'neural-dialog-footer-root',
      'neural-dialog-footer-base',
      this.footerClass(),
    ),
  );
}

/** @deprecated Use `NeuralDialog`. */
export { NeuralDialog as DialogComponent };
/** @deprecated Use `NeuralDialogHeader`. */
export { NeuralDialogHeader as DialogHeaderComponent };
/** @deprecated Use `NeuralDialogBody`. */
export { NeuralDialogBody as DialogBodyComponent };
/** @deprecated Use `NeuralDialogFooter`. */
export { NeuralDialogFooter as DialogFooterComponent };
/** @deprecated Use `NeuralDialogInitialFocus`. */
export { NeuralDialogInitialFocus as DialogInitialFocusDirective };
