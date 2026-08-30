import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NEURAL_NG_CONFIG, NeuralLocaleService } from '@neural-ng/core';
import {
  NeuralDialog,
  NeuralDialogBody,
  NeuralDialogFooter,
  NeuralDialogHeader,
  type NeuralDialogClasses,
  type NeuralDialogClose,
} from '@neural-ng/core/dialog';
import type {
  NeuralConfirmDialogActionError,
  NeuralConfirmDialogClasses,
  NeuralConfirmation,
  NeuralConfirmationClose,
  NeuralConfirmationCloseReason,
  NeuralConfirmationResult,
} from './confirm-dialog.types';
import { NeuralConfirmationService } from './confirmation.service';

let nextConfirmDialogId = 0;

@Component({
  selector: 'neural-confirm-dialog',
  standalone: true,
  imports: [
    NeuralDialog,
    NeuralDialogBody,
    NeuralDialogFooter,
    NeuralDialogHeader,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-confirm-dialog-host' },
  template: `
    <neural-dialog
      #dialog
      [open]="visible()"
      (openChange)="visible.set($event)"
      [closable]="effectiveClosable()"
      [closeOnEscape]="effectiveCloseOnEscape()"
      [dismissibleBackdrop]="effectiveDismissibleBackdrop()"
      [unstyled]="effectiveUnstyled()"
      [dialogClass]="rootClass()"
      [classes]="dialogClasses()"
      [ariaLabelledby]="titleId"
      [ariaDescribedby]="messageId"
      (opened)="focusDefaultAction()"
      (closed)="handleDialogClosed($event)"
    >
      @if (confirmation(); as current) {
        <neural-dialog-header [headerClass]="headerClass()">
          <div class="neural-confirm-dialog-heading-root">
            @if (current.icon !== false) {
              <i [class]="iconClass()" aria-hidden="true"></i>
            }
            <h2 [id]="titleId" [class]="titleClass()">
              {{ current.header || defaultHeader() }}
            </h2>
          </div>
        </neural-dialog-header>
        <neural-dialog-body [bodyClass]="bodyClass()">
          <p [id]="messageId" [class]="messageClass()">
            {{ current.message }}
          </p>
        </neural-dialog-body>
        <neural-dialog-footer [footerClass]="footerClass()">
          @if (current.rejectVisible !== false) {
            <button
              #rejectButton
              type="button"
              [class]="rejectButtonClass()"
              [disabled]="processing()"
              (click)="choose('reject')"
            >
              <i [class]="rejectIconClass()" aria-hidden="true"></i>
              <span>{{ current.rejectLabel || defaultRejectLabel() }}</span>
            </button>
          }
          @if (current.acceptVisible !== false) {
            <button
              #acceptButton
              type="button"
              [class]="acceptButtonClass()"
              [disabled]="processing()"
              [attr.aria-busy]="processing() ? 'true' : null"
              (click)="choose('accept')"
            >
              <i [class]="acceptIconClass()" aria-hidden="true"></i>
              <span>{{ current.acceptLabel || defaultAcceptLabel() }}</span>
            </button>
          }
        </neural-dialog-footer>
      }
    </neural-dialog>
  `,
  styles: `
    :where(.neural-confirm-dialog-host) {
      display: contents;
    }
    :where(.neural-confirm-dialog-heading-root) {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 0;
    }
    :where(.neural-confirm-dialog-icon-root),
    :where(.neural-confirm-dialog-button-icon-root) {
      display: inline-flex;
      flex: 0 0 auto;
      line-height: 1;
    }
    :where(.neural-confirm-dialog-button-root) {
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    :where(.neural-confirm-dialog-root-base) {
      --neural-dialog-width: var(
        --neural-confirm-dialog-width,
        min(28rem, calc(100vw - 2rem))
      );
      --neural-dialog-enter-duration: var(
        --neural-confirm-dialog-enter-duration,
        260ms
      );
      --neural-dialog-leave-duration: var(
        --neural-confirm-dialog-leave-duration,
        180ms
      );
      --neural-dialog-enter-distance: var(
        --neural-confirm-dialog-enter-distance,
        0.375rem
      );
      --neural-dialog-enter-scale: var(
        --neural-confirm-dialog-enter-scale,
        0.985
      );
      --neural-dialog-enter-easing: var(
        --neural-confirm-dialog-enter-easing,
        cubic-bezier(0.22, 1, 0.36, 1)
      );
      --neural-dialog-leave-easing: var(
        --neural-confirm-dialog-leave-easing,
        cubic-bezier(0.4, 0, 1, 1)
      );
    }
    :where(.neural-confirm-dialog-header-base) {
      --neural-dialog-header-padding: var(
        --neural-confirm-dialog-header-padding,
        1.25rem 3.5rem 0.75rem 1.25rem
      );
      --neural-dialog-header-border: 0;
    }
    :where(.neural-confirm-dialog-icon-base) {
      align-items: center;
      justify-content: center;
      width: var(--neural-confirm-dialog-icon-size, 2.5rem);
      height: var(--neural-confirm-dialog-icon-size, 2.5rem);
      color: var(
        --neural-confirm-dialog-icon-color,
        var(--neural-color-primary)
      );
      background: var(
        --neural-confirm-dialog-icon-background,
        var(--neural-color-primary-subtle)
      );
      border-radius: 999px;
      font-size: 1.25rem;
    }
    :where(.neural-confirm-dialog-title-base) {
      margin: 0;
      color: var(--neural-color-text-strong);
      font-size: var(--neural-confirm-dialog-title-size, 1.125rem);
      font-weight: 700;
      line-height: 1.35;
    }
    :where(.neural-confirm-dialog-body-base) {
      --neural-dialog-body-padding: var(
        --neural-confirm-dialog-body-padding,
        0.5rem 1.25rem 1.25rem
      );
    }
    :where(.neural-confirm-dialog-message-base) {
      margin: 0;
      color: var(--neural-color-text-muted);
      line-height: 1.6;
    }
    :where(.neural-confirm-dialog-footer-base) {
      --neural-dialog-footer-padding: var(
        --neural-confirm-dialog-footer-padding,
        1rem 1.25rem 1.25rem
      );
      --neural-dialog-footer-border: 1px solid var(--neural-color-border);
    }
    :where(.neural-confirm-dialog-button-base) {
      gap: 0.5rem;
      min-height: 2.5rem;
      padding: 0.625rem 1rem;
      border: 1px solid transparent;
      border-radius: 0.55rem;
      font: inherit;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition:
        background-color 160ms ease,
        border-color 160ms ease,
        color 160ms ease;
    }
    :where(.neural-confirm-dialog-button-base:focus-visible) {
      outline: 2px solid var(--neural-color-focus);
      outline-offset: 2px;
    }
    :where(.neural-confirm-dialog-button-base:disabled) {
      opacity: 0.6;
      cursor: progress;
    }
    :where(.neural-confirm-dialog-reject-base) {
      color: var(--neural-color-text);
      background: var(--neural-color-surface-active);
      border-color: var(--neural-color-border);
    }
    :where(.neural-confirm-dialog-reject-base:hover:not(:disabled)) {
      background: var(--neural-color-surface-hover);
      border-color: var(--neural-color-border-hover);
    }
    :where(.neural-confirm-dialog-accept-base) {
      color: var(--neural-color-primary-contrast);
      background: var(--neural-color-primary);
      border-color: var(--neural-color-primary);
    }
    :where(.neural-confirm-dialog-accept-base:hover:not(:disabled)) {
      background: var(--neural-color-primary-hover);
      border-color: var(--neural-color-primary-hover);
    }
  `,
})
export class NeuralConfirmDialog {
  private readonly service = inject(NeuralConfirmationService);
  private readonly config = inject(NEURAL_NG_CONFIG);
  private readonly locale = inject(NeuralLocaleService);
  private readonly dialog = viewChild.required(NeuralDialog);
  private readonly acceptButton =
    viewChild<ElementRef<HTMLButtonElement>>('acceptButton');
  private readonly rejectButton =
    viewChild<ElementRef<HTMLButtonElement>>('rejectButton');
  private pending:
    | {
        confirmation: NeuralConfirmation;
        result: NeuralConfirmationResult;
        reason: NeuralConfirmationCloseReason;
      }
    | undefined;

  readonly key = input('default');
  readonly closable = input(false, { transform: booleanAttribute });
  readonly closeOnEscape = input(true, { transform: booleanAttribute });
  readonly dismissibleBackdrop = input(false, { transform: booleanAttribute });
  readonly defaultFocus = input<'accept' | 'reject' | 'none'>('accept');
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly confirmDialogClass = input('');
  readonly classes = input<NeuralConfirmDialogClasses>({});

  readonly accepted = output<NeuralConfirmation>();
  readonly rejected = output<NeuralConfirmation>();
  readonly dismissed = output<NeuralConfirmationClose>();
  readonly closed = output<NeuralConfirmationClose>();
  readonly actionError = output<NeuralConfirmDialogActionError>();

  readonly instanceId = ++nextConfirmDialogId;
  readonly titleId = `neural-confirm-dialog-title-${this.instanceId}`;
  readonly messageId = `neural-confirm-dialog-message-${this.instanceId}`;
  readonly visible = signal(false);
  readonly processing = signal(false);
  readonly confirmation = computed(() =>
    this.service.confirmation(this.normalizedKey()),
  );
  readonly normalizedKey = computed(() => this.key().trim() || 'default');
  readonly effectiveUnstyled = computed(
    () => this.unstyled() || this.config.unstyled,
  );
  readonly defaultHeader = computed(
    () => this.locale.messages().confirmDialog.header,
  );
  readonly defaultAcceptLabel = computed(
    () => this.locale.messages().confirmDialog.accept,
  );
  readonly defaultRejectLabel = computed(
    () => this.locale.messages().confirmDialog.reject,
  );
  readonly effectiveClosable = computed(
    () => this.confirmation()?.closable ?? this.closable(),
  );
  readonly effectiveCloseOnEscape = computed(
    () => this.confirmation()?.closeOnEscape ?? this.closeOnEscape(),
  );
  readonly effectiveDismissibleBackdrop = computed(
    () =>
      this.confirmation()?.dismissibleBackdrop ?? this.dismissibleBackdrop(),
  );
  readonly dialogClasses = computed<NeuralDialogClasses>(() => ({}));
  readonly rootClass = computed(() =>
    this.compose(
      'neural-confirm-dialog-root',
      'neural-confirm-dialog-root-base',
      this.confirmDialogClass(),
      this.classes().root,
    ),
  );
  readonly headerClass = computed(() =>
    this.compose(
      'neural-confirm-dialog-header-root',
      'neural-confirm-dialog-header-base',
      this.classes().header,
    ),
  );
  readonly iconClass = computed(() =>
    this.compose(
      `neural-confirm-dialog-icon-root nt ${this.confirmation()?.iconClass || 'nt-alert-triangle'}`,
      'neural-confirm-dialog-icon-base',
      this.classes().icon,
    ),
  );
  readonly titleClass = computed(() =>
    this.compose(
      'neural-confirm-dialog-title-root',
      'neural-confirm-dialog-title-base',
      this.classes().title,
    ),
  );
  readonly bodyClass = computed(() =>
    this.compose(
      'neural-confirm-dialog-body-root',
      'neural-confirm-dialog-body-base',
      this.classes().body,
    ),
  );
  readonly messageClass = computed(() =>
    this.compose(
      'neural-confirm-dialog-message-root',
      'neural-confirm-dialog-message-base',
      this.classes().message,
    ),
  );
  readonly footerClass = computed(() =>
    this.compose(
      'neural-confirm-dialog-footer-root',
      'neural-confirm-dialog-footer-base',
      this.classes().footer,
    ),
  );
  readonly acceptButtonClass = computed(() =>
    this.compose(
      'neural-confirm-dialog-button-root neural-confirm-dialog-accept-root',
      'neural-confirm-dialog-button-base neural-confirm-dialog-accept-base',
      this.classes().acceptButton,
    ),
  );
  readonly rejectButtonClass = computed(() =>
    this.compose(
      'neural-confirm-dialog-button-root neural-confirm-dialog-reject-root',
      'neural-confirm-dialog-button-base neural-confirm-dialog-reject-base',
      this.classes().rejectButton,
    ),
  );
  readonly acceptIconClass = computed(() =>
    this.compose(
      `neural-confirm-dialog-button-icon-root nt ${this.confirmation()?.acceptIconClass || 'nt-check'}`,
      'neural-confirm-dialog-button-icon-base',
      this.classes().buttonIcon,
    ),
  );
  readonly rejectIconClass = computed(() =>
    this.compose(
      `neural-confirm-dialog-button-icon-root nt ${this.confirmation()?.rejectIconClass || 'nt-x'}`,
      'neural-confirm-dialog-button-icon-base',
      this.classes().buttonIcon,
    ),
  );

  constructor() {
    effect(() => {
      const confirmation = this.confirmation();
      if (confirmation) this.visible.set(true);
      else if (this.visible()) this.visible.set(false);
    });
  }

  focusDefaultAction(): void {
    queueMicrotask(() => {
      const target =
        this.defaultFocus() === 'reject'
          ? this.rejectButton()
          : this.defaultFocus() === 'accept'
            ? this.acceptButton()
            : undefined;
      target?.nativeElement.focus({ preventScroll: true });
    });
  }

  async choose(action: 'accept' | 'reject'): Promise<void> {
    const confirmation = this.confirmation();
    if (!confirmation || this.processing()) return;
    this.processing.set(true);
    try {
      if (!(await this.service.runAction(confirmation.id, action))) return;
      this.pending = {
        confirmation,
        result: action === 'accept' ? 'accepted' : 'rejected',
        reason: action,
      };
      this.dialog().close('api');
    } catch (error) {
      this.actionError.emit({ confirmation, action, error });
    } finally {
      this.processing.set(false);
    }
  }

  handleDialogClosed(event: NeuralDialogClose): void {
    const pending = this.pending;
    this.pending = undefined;
    const confirmation = pending?.confirmation ?? this.confirmation();
    if (!confirmation) return;
    const result = pending?.result ?? 'dismissed';
    const reason = pending?.reason ?? this.mapCloseReason(event.reason);
    this.service.complete(confirmation.id, result, reason);
    const closeEvent: NeuralConfirmationClose = {
      confirmation,
      result,
      reason,
    };
    if (result === 'accepted') this.accepted.emit(confirmation);
    else if (result === 'rejected') this.rejected.emit(confirmation);
    else this.dismissed.emit(closeEvent);
    this.closed.emit(closeEvent);
  }

  private mapCloseReason(
    reason: NeuralDialogClose['reason'],
  ): NeuralConfirmationCloseReason {
    return reason === 'native' ? 'api' : reason;
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

/** @deprecated Import and use `NeuralConfirmDialog` instead. */
export { NeuralConfirmDialog as ConfirmDialogComponent };
