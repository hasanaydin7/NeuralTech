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
  viewChild,
} from '@angular/core';
import { NEURAL_NG_CONFIG, NeuralLocaleService } from '@neural-ng/core';
import type {
  NeuralDrawerClasses,
  NeuralDrawerClose,
  NeuralDrawerCloseReason,
  NeuralDrawerPosition,
} from './drawer.types';

@Directive({ selector: '[neuralDrawerInitialFocus]', standalone: true })
export class NeuralDrawerInitialFocus {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);

  focus(): void {
    this.element.nativeElement.focus({ preventScroll: true });
  }
}

@Component({
  selector: 'neural-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-drawer-host' },
  template: `
    <!-- eslint-disable-next-line @angular-eslint/template/interactive-supports-focus -->
    <dialog
      #nativeDrawer
      [class]="rootClass()"
      [attr.data-position]="position()"
      [attr.aria-label]="normalizedAriaLabel()"
      [attr.aria-labelledby]="normalizedAriaLabelledby()"
      [attr.aria-describedby]="normalizedAriaDescribedby()"
      [attr.aria-modal]="modal() ? 'true' : null"
      [attr.popover]="modal() ? null : 'manual'"
      (cancel)="handleCancel($event)"
      (close)="handleNativeClose($event)"
      (click)="handleBackdropClick($event)"
      (keydown.escape)="handleNonModalEscape($event)"
    >
      @if (closable()) {
        <button
          type="button"
          [class]="closeButtonClass()"
          [attr.aria-label]="effectiveCloseLabel()"
          (click)="close('close-button', '', $event)"
        >
          <i [class]="closeIconClass()" aria-hidden="true"></i>
        </button>
      }
      <ng-content />
    </dialog>
  `,
  styles: `
    :where(.neural-drawer-host),
    :where(.neural-drawer-section-host) {
      display: contents;
    }
    :where(.neural-drawer-root) {
      position: fixed;
      box-sizing: border-box;
      grid-template-rows: auto minmax(0, 1fr) auto;
      max-width: 100vw;
      max-height: 100dvh;
      padding: 0;
      overflow: hidden;
    }
    :where(.neural-drawer-root:is([open], :popover-open)) {
      display: grid;
    }
    :where(.neural-drawer-root[data-position='start']) {
      inset: 0 auto 0 0;
      width: min(var(--neural-drawer-size, 24rem), 100vw);
      height: 100dvh;
      margin: 0;
    }
    :where(.neural-drawer-root[data-position='end']) {
      inset: 0 0 0 auto;
      width: min(var(--neural-drawer-size, 24rem), 100vw);
      height: 100dvh;
      margin: 0;
    }
    :where(.neural-drawer-root[data-position='top']) {
      inset: 0 0 auto;
      width: 100vw;
      height: min(var(--neural-drawer-size, 20rem), 100dvh);
      margin: 0;
    }
    :where(.neural-drawer-root[data-position='bottom']) {
      inset: auto 0 0;
      width: 100vw;
      height: min(var(--neural-drawer-size, 20rem), 100dvh);
      margin: 0;
    }
    :where(.neural-drawer-header-root),
    :where(.neural-drawer-footer-root) {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      min-width: 0;
    }
    :where(.neural-drawer-body-root) {
      box-sizing: border-box;
      min-width: 0;
      min-height: 0;
      overflow: auto;
      overscroll-behavior: contain;
    }
    :where(.neural-drawer-close-root) {
      position: absolute;
      z-index: 1;
      inset-block-start: var(--neural-drawer-close-inset, 0.875rem);
      inset-inline-end: var(--neural-drawer-close-inset, 0.875rem);
      box-sizing: border-box;
      display: inline-grid;
      place-items: center;
    }
    :where(.neural-drawer-base) {
      color: var(--neural-drawer-color, var(--neural-color-text));
      background: var(--neural-drawer-background, var(--neural-color-surface));
      border: 0;
      box-shadow: var(
        --neural-drawer-shadow,
        0 0 2.5rem rgb(var(--neural-color-shadow) / 0.2)
      );
      font-family: inherit;
      opacity: 0;
      transition:
        opacity var(--neural-drawer-duration, 180ms)
          var(--neural-drawer-easing, cubic-bezier(0.2, 0, 0, 1)),
        transform var(--neural-drawer-duration, 180ms)
          var(--neural-drawer-easing, cubic-bezier(0.2, 0, 0, 1)),
        overlay var(--neural-drawer-leave-duration, 140ms) allow-discrete,
        display var(--neural-drawer-leave-duration, 140ms) allow-discrete;
    }
    :where(.neural-drawer-base[data-position='start']) {
      transform: translateX(-100%);
      border-inline-end: 1px solid var(--neural-color-border);
    }
    :where(.neural-drawer-base[data-position='end']) {
      transform: translateX(100%);
      border-inline-start: 1px solid var(--neural-color-border);
    }
    :where(.neural-drawer-base[data-position='top']) {
      transform: translateY(-100%);
      border-block-end: 1px solid var(--neural-color-border);
    }
    :where(.neural-drawer-base[data-position='bottom']) {
      transform: translateY(100%);
      border-block-start: 1px solid var(--neural-color-border);
    }
    :where(.neural-drawer-base:dir(rtl)[data-position='start']) {
      inset: 0 0 0 auto;
      transform: translateX(100%);
    }
    :where(.neural-drawer-base:dir(rtl)[data-position='end']) {
      inset: 0 auto 0 0;
      transform: translateX(-100%);
    }
    :where(.neural-drawer-base:is([open], :popover-open)) {
      opacity: 1;
      transform: none;
    }
    @starting-style {
      :where(
        .neural-drawer-base:is([open], :popover-open)[data-position='start']
      ) {
        transform: translateX(-100%);
      }
      :where(
        .neural-drawer-base:is([open], :popover-open)[data-position='end']
      ) {
        transform: translateX(100%);
      }
      :where(
        .neural-drawer-base:dir(rtl):is(
            [open],
            :popover-open
          )[data-position='start']
      ) {
        transform: translateX(100%);
      }
      :where(
        .neural-drawer-base:dir(rtl):is(
            [open],
            :popover-open
          )[data-position='end']
      ) {
        transform: translateX(-100%);
      }
      :where(
        .neural-drawer-base:is([open], :popover-open)[data-position='top']
      ) {
        transform: translateY(-100%);
      }
      :where(
        .neural-drawer-base:is([open], :popover-open)[data-position='bottom']
      ) {
        transform: translateY(100%);
      }
    }
    :where(.neural-drawer-base::backdrop) {
      background: var(--neural-drawer-backdrop, rgb(15 23 42 / 0.5));
      backdrop-filter: var(--neural-drawer-backdrop-filter, blur(2px));
      opacity: 0;
      transition:
        opacity var(--neural-drawer-duration, 180ms) ease-out,
        overlay var(--neural-drawer-leave-duration, 140ms) allow-discrete,
        display var(--neural-drawer-leave-duration, 140ms) allow-discrete;
    }
    :where(.neural-drawer-base[open]::backdrop) {
      opacity: 1;
    }
    @starting-style {
      :where(.neural-drawer-base[open]::backdrop) {
        opacity: 0;
      }
    }
    :where(.neural-drawer-header-base) {
      justify-content: space-between;
      gap: 0.75rem;
      padding: var(--neural-drawer-header-padding, 1rem 3.5rem 0.45rem 1.25rem);
      border-bottom: var(--neural-drawer-header-border, 0);
    }
    :where(.neural-drawer-body-base) {
      padding: var(--neural-drawer-body-padding, 0.55rem 1.25rem 0.7rem);
    }
    :where(.neural-drawer-footer-base) {
      justify-content: flex-end;
      gap: 0.75rem;
      padding: var(--neural-drawer-footer-padding, 0.45rem 1.25rem 1rem);
      border-top: var(--neural-drawer-footer-border, 0);
    }
    :where(.neural-drawer-close-base) {
      width: 2.25rem;
      height: 2.25rem;
      padding: 0;
      color: var(--neural-color-text-muted);
      background: transparent;
      border: 0;
      border-radius: 0.55rem;
      cursor: pointer;
    }
    :where(.neural-drawer-close-base:hover) {
      color: var(--neural-color-text-strong);
      background: var(--neural-color-surface-hover);
    }
    :where(.neural-drawer-close-base:focus-visible) {
      outline: 2px solid var(--neural-color-focus);
      outline-offset: 2px;
    }
    @media (prefers-reduced-motion: reduce) {
      :where(.neural-drawer-base),
      :where(.neural-drawer-base::backdrop) {
        transition-duration: 0.01ms;
      }
    }
  `,
})
export class NeuralDrawer {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly config = inject(NEURAL_NG_CONFIG);
  private readonly locale = inject(NeuralLocaleService);
  private readonly nativeDrawer =
    viewChild<ElementRef<HTMLDialogElement>>('nativeDrawer');
  private readonly initialFocus = contentChild(NeuralDrawerInitialFocus, {
    descendants: true,
  });
  private opener: HTMLElement | null = null;
  private restoreFocusTimer: ReturnType<typeof setTimeout> | undefined;
  private openRequestId = 0;
  private pendingClose:
    | { readonly reason: NeuralDrawerCloseReason; readonly nativeEvent?: Event }
    | undefined;

  readonly open = model(false);
  readonly position = input<NeuralDrawerPosition>('end');
  readonly modal = input(true, { transform: booleanAttribute });
  readonly closable = input(true, { transform: booleanAttribute });
  readonly closeOnEscape = input(true, { transform: booleanAttribute });
  readonly dismissibleBackdrop = input(true, { transform: booleanAttribute });
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string | null>(null);
  readonly ariaLabelledby = input<string | null>(null);
  readonly ariaDescribedby = input<string | null>(null);
  readonly closeLabel = input<string | null>(null);
  readonly closeIcon = input('nt-x');
  readonly drawerClass = input('');
  readonly classes = input<NeuralDrawerClasses>({});

  readonly opened = output<void>();
  readonly closed = output<NeuralDrawerClose>();
  readonly effectiveUnstyled = computed(
    () => this.unstyled() || this.config.unstyled,
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
  readonly rootClass = computed(() =>
    this.compose(
      'neural-drawer-root',
      'neural-drawer-base',
      this.drawerClass(),
      this.classes().root,
    ),
  );
  readonly closeButtonClass = computed(() =>
    this.compose(
      'neural-drawer-close-root',
      'neural-drawer-close-base',
      this.classes().closeButton,
    ),
  );
  readonly closeIconClass = computed(() =>
    this.compose(
      `neural-drawer-close-icon-root nt ${this.closeIcon()}`,
      'neural-drawer-close-icon-base',
      this.classes().closeIcon,
    ),
  );

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.openRequestId += 1;
      if (this.restoreFocusTimer !== undefined)
        clearTimeout(this.restoreFocusTimer);
    });
    effect(() => {
      const drawer = this.nativeDrawer()?.nativeElement;
      const shouldOpen = this.open();
      const modal = this.modal();
      const position = this.position();
      if (!isPlatformBrowser(this.platformId) || !drawer) return;
      const renderedOpen = this.isRenderedOpen(drawer);
      if (shouldOpen && !renderedOpen) {
        const requestId = ++this.openRequestId;
        queueMicrotask(() => {
          if (
            requestId !== this.openRequestId ||
            !this.open() ||
            this.isRenderedOpen(drawer)
          ) {
            return;
          }
          drawer.dataset['position'] = position;
          if (this.restoreFocusTimer !== undefined) {
            clearTimeout(this.restoreFocusTimer);
            this.restoreFocusTimer = undefined;
          }
          this.opener =
            this.document.activeElement instanceof HTMLElement
              ? this.document.activeElement
              : null;
          this.showNative(drawer, modal);
          this.opened.emit();
          this.initialFocus()?.focus();
        });
      } else if (!shouldOpen && renderedOpen) {
        this.openRequestId += 1;
        this.pendingClose ??= { reason: 'api' };
        this.closeNative(drawer);
      } else if (!shouldOpen) {
        this.openRequestId += 1;
      }
    });
  }

  show(): void {
    this.open.set(true);
  }
  toggle(): void {
    this.open.update((value) => !value);
  }
  close(
    reason: NeuralDrawerCloseReason = 'api',
    returnValue = '',
    nativeEvent?: Event,
  ): void {
    const drawer = this.nativeDrawer()?.nativeElement;
    if (!drawer || !this.isRenderedOpen(drawer)) {
      this.open.set(false);
      return;
    }
    this.pendingClose = { reason, nativeEvent };
    this.closeNative(drawer, returnValue);
  }
  handleCancel(event: Event): void {
    event.preventDefault();
    if (this.closeOnEscape()) this.close('escape', '', event);
  }
  handleNonModalEscape(event: Event): void {
    if (this.modal()) return;
    event.preventDefault();
    if (this.closeOnEscape()) this.close('escape', '', event);
  }
  handleBackdropClick(event: MouseEvent): void {
    const drawer = this.nativeDrawer()?.nativeElement;
    if (
      !drawer ||
      event.target !== drawer ||
      !this.modal() ||
      !this.dismissibleBackdrop()
    )
      return;
    const bounds = drawer.getBoundingClientRect();
    const outside =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;
    if (outside) this.close('backdrop', '', event);
  }
  handleNativeClose(event: Event): void {
    const drawer = event.target as HTMLDialogElement;
    this.finalizeClose(drawer, event);
  }
  private finalizeClose(drawer: HTMLDialogElement, event: Event): void {
    const pending = this.pendingClose;
    this.pendingClose = undefined;
    this.open.set(false);
    this.closed.emit({
      reason: pending?.reason ?? 'native',
      returnValue: drawer.returnValue,
      nativeEvent: pending?.nativeEvent ?? event,
    });
    const opener = this.opener;
    this.opener = null;
    this.restoreFocusTimer = setTimeout(() => {
      this.restoreFocusTimer = undefined;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    });
  }
  private showNative(drawer: HTMLDialogElement, modal: boolean): void {
    if (modal) {
      drawer.showModal();
      return;
    }
    try {
      drawer.showPopover();
      drawer.dataset['neuralPopoverOpen'] = 'true';
    } catch {
      drawer.show();
    }
  }
  private closeNative(drawer: HTMLDialogElement, returnValue = ''): void {
    if (drawer.dataset['neuralPopoverOpen'] === 'true') {
      drawer.returnValue = returnValue;
      try {
        drawer.hidePopover();
      } finally {
        delete drawer.dataset['neuralPopoverOpen'];
        this.finalizeClose(drawer, new Event('close'));
      }
      return;
    }
    drawer.close(returnValue);
  }
  private isRenderedOpen(drawer: HTMLDialogElement): boolean {
    return drawer.open || drawer.dataset['neuralPopoverOpen'] === 'true';
  }
  composeSlotClass(
    slot: 'header' | 'body' | 'footer',
    structural: string,
    visual: string,
    localClass: string,
  ): string {
    return this.compose(structural, visual, this.classes()[slot], localClass);
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

@Component({
  selector: 'neural-drawer-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-drawer-section-host' },
  template: `<header [class]="computedClass()"><ng-content /></header>`,
})
export class NeuralDrawerHeader {
  private readonly drawer = inject(NeuralDrawer, { host: true });
  readonly headerClass = input('');
  readonly computedClass = computed(() =>
    this.drawer.composeSlotClass(
      'header',
      'neural-drawer-header-root',
      'neural-drawer-header-base',
      this.headerClass(),
    ),
  );
}

@Component({
  selector: 'neural-drawer-body',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-drawer-section-host' },
  template: `<div [class]="computedClass()"><ng-content /></div>`,
})
export class NeuralDrawerBody {
  private readonly drawer = inject(NeuralDrawer, { host: true });
  readonly bodyClass = input('');
  readonly computedClass = computed(() =>
    this.drawer.composeSlotClass(
      'body',
      'neural-drawer-body-root',
      'neural-drawer-body-base',
      this.bodyClass(),
    ),
  );
}

@Component({
  selector: 'neural-drawer-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-drawer-section-host' },
  template: `<footer [class]="computedClass()"><ng-content /></footer>`,
})
export class NeuralDrawerFooter {
  private readonly drawer = inject(NeuralDrawer, { host: true });
  readonly footerClass = input('');
  readonly computedClass = computed(() =>
    this.drawer.composeSlotClass(
      'footer',
      'neural-drawer-footer-root',
      'neural-drawer-footer-base',
      this.footerClass(),
    ),
  );
}

/** @deprecated Use `NeuralDrawer`. */
export { NeuralDrawer as DrawerComponent };
/** @deprecated Use `NeuralDrawerHeader`. */
export { NeuralDrawerHeader as DrawerHeaderComponent };
/** @deprecated Use `NeuralDrawerBody`. */
export { NeuralDrawerBody as DrawerBodyComponent };
/** @deprecated Use `NeuralDrawerFooter`. */
export { NeuralDrawerFooter as DrawerFooterComponent };
/** @deprecated Use `NeuralDrawerInitialFocus`. */
export { NeuralDrawerInitialFocus as DrawerInitialFocusDirective };
