import { SiteOnThisPage } from '../../../shared/on-this-page';
import { ViewportScroller } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { NeuralButton } from '@neural-ng/core/button';
import {
  NeuralConfirmDialog,
  NeuralConfirmationService,
  type NeuralConfirmDialogActionError,
  type NeuralConfirmDialogClasses,
  type NeuralConfirmationClose,
} from '@neural-ng/core/confirm-dialog';
import {
  NeuralTab,
  NeuralTabList,
  NeuralTabPanel,
  NeuralTabPanels,
  NeuralTabs,
  type NeuralTabsClasses,
  type NeuralTabValue,
} from '@neural-ng/core/tabs';
import { filter } from 'rxjs';
import { SiteAppearanceService } from '../../../core/site-appearance.service';
import { CodeView } from '../../../shared/code-view';
import { DesignTokenList } from '../../../shared/design-token-list';

type ConfirmDialogDocView = 'component' | 'accessibility' | 'api' | 'tokens';

@Component({
  selector: 'app-confirm-dialog-page',
  imports: [
    SiteOnThisPage,
    DesignTokenList,
    CodeView,
    NeuralButton,
    NeuralConfirmDialog,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
  ],
  templateUrl: './confirm-dialog.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  private readonly confirmation = inject(NeuralConfirmationService);
  readonly appearance = inject(SiteAppearanceService);

  readonly lastResult = signal('No confirmation completed yet.');
  readonly publishStatus = signal('Ready');
  readonly replacementStatus = signal('No request replaced yet.');
  readonly errorStatus = signal('No action error.');
  private publishAttempt = 0;

  readonly selectedView = signal<ConfirmDialogDocView>(
    resolveConfirmDialogDocView(this.router.url),
  );
  readonly selectedViewIndex = computed(() =>
    ['component', 'accessibility', 'api', 'tokens'].indexOf(
      this.selectedView(),
    ),
  );
  readonly docTabClasses: NeuralTabsClasses = {
    root: 'min-w-0',
    list: 'relative isolate gap-1 overflow-x-auto rounded-[1.35rem] border border-white/20 bg-[color-mix(in_srgb,var(--site-surface)_76%,transparent)] p-1.5 shadow-[inset_0_1px_rgba(255,255,255,.28),0_12px_35px_rgba(15,23,42,.10)] backdrop-blur-[30px] backdrop-saturate-150',
    tab: 'relative z-10 !flex-1 gap-2 rounded-[1rem] px-3 py-2.5 text-xs font-bold text-[var(--site-text-muted)] transition-[color,transform] duration-300 hover:text-[var(--site-text)] active:scale-[.97] sm:px-4 sm:text-sm',
    activeTab: 'text-[var(--site-text)]',
    panels: 'min-w-0',
    panel:
      'min-w-0 !p-0 animate-[neural-doc-panel-soft-in_200ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none',
  };
  readonly headlessClasses: NeuralConfirmDialogClasses = {
    root: 'w-[min(30rem,calc(100vw-2rem))] overflow-hidden rounded-[1.75rem] border border-violet-300/25 bg-slate-950 p-0 text-violet-50 shadow-[0_32px_100px_rgba(15,23,42,.65)] backdrop:bg-slate-950/65 backdrop:backdrop-blur-sm',
    header: 'border-b border-violet-300/15 p-6',
    icon: 'grid size-11 place-items-center rounded-full bg-violet-400/15 text-xl text-violet-300',
    title: 'm-0 text-lg font-black',
    body: 'p-6',
    message: 'm-0 leading-7 text-violet-100/70',
    footer: 'flex justify-end gap-3 border-t border-violet-300/15 p-5',
    rejectButton:
      'inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-violet-200/20 px-4 text-sm font-bold text-violet-100 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300',
    acceptButton:
      'inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-violet-400 px-4 text-sm font-black text-slate-950 transition hover:bg-violet-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300',
    buttonIcon: 'text-base',
  };
  readonly pageLinks: Record<
    ConfirmDialogDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Service driven', 'service-driven'],
      ['Async guard', 'async-guard'],
      ['Keyed hosts', 'keyed-hosts'],
      ['Replacement', 'replacement'],
      ['Options', 'options'],
      ['Action errors', 'action-errors'],
      ['Unstyled', 'unstyled'],
      ['Boundaries', 'boundaries'],
    ],
    accessibility: [
      ['Native modal', 'native-modal'],
      ['Naming', 'naming'],
      ['Focus', 'focus'],
      ['Keyboard', 'keyboard'],
      ['Busy actions', 'busy-actions'],
      ['Dismiss policy', 'dismiss-policy'],
    ],
    api: [
      ['Component inputs', 'component-inputs'],
      ['Component outputs', 'component-outputs'],
      ['Confirmation input', 'confirmation-input'],
      ['Service', 'service-api'],
      ['Reference', 'reference'],
      ['Results and reasons', 'results'],
      ['Class slots', 'class-slots'],
      ['Types', 'types'],
    ],
    tokens: [
      ['Component tokens', 'component-tokens'],
      ['Inherited Dialog tokens', 'dialog-tokens'],
    ],
  };

  readonly importCode = `import {
  NeuralConfirmDialog,
  NeuralConfirmationService,
} from '@neural-ng/core/confirm-dialog';

@Component({ imports: [NeuralConfirmDialog] })
export class WorkspacePage {
  private readonly confirmation = inject(NeuralConfirmationService);
}`;
  readonly basicCode = `<neural-confirm-dialog />

this.confirmation.confirm({
  header: 'Delete workspace?',
  message: 'This action cannot be undone.',
  accept: () => this.workspace.remove(),
});`;
  readonly asyncCode = `this.confirmation.confirm({
  key: 'publish',
  message: 'Publish the current release?',
  accept: async () => {
    const valid = await validateRelease();
    return valid; // false keeps the dialog open
  },
});`;
  readonly keyedCode = `<neural-confirm-dialog />
<neural-confirm-dialog key="publish" defaultFocus="reject" />

confirmation.confirm({ message: 'Default host' });
confirmation.confirm({ key: 'publish', message: 'Publish host' });`;
  readonly replacementCode = `const first = confirmation.confirm({
  key: 'workspace',
  message: 'First request',
});

confirmation.confirm({ key: 'workspace', message: 'Latest request' });
first.closeReason(); // 'replaced'`;
  readonly optionsCode = `confirmation.confirm({
  header: 'Archive project?',
  message: 'You can restore it later.',
  icon: true,
  iconClass: 'nt-folders',
  acceptLabel: 'Archive',
  rejectLabel: 'Keep project',
  acceptIconClass: 'nt-check',
  rejectIconClass: 'nt-x',
  closable: true,
  closeOnEscape: true,
  dismissibleBackdrop: true,
});`;
  readonly errorCode = `confirmation.confirm({
  key: 'errors',
  message: 'Run the protected action?',
  closable: true,
  accept: async () => {
    throw new Error('The server rejected this action.');
  },
});

<neural-confirm-dialog
  key="errors"
  (actionError)="handleError($event)"
/>`;
  readonly unstyledCode = `<neural-confirm-dialog
  key="headless"
  unstyled
  [classes]="classes"
/>`;

  readonly componentInputs = [
    ['key', 'string', "'default'", 'Connects this host to a service channel.'],
    ['closable', 'boolean', 'false', 'Shows the inherited close button.'],
    ['closeOnEscape', 'boolean', 'true', 'Allows Escape dismissal.'],
    ['dismissibleBackdrop', 'boolean', 'false', 'Allows backdrop dismissal.'],
    [
      'defaultFocus',
      "'accept' | 'reject' | 'none'",
      "'accept'",
      'Focus target after opening.',
    ],
    [
      'unstyled',
      'boolean',
      'false',
      'Removes ConfirmDialog and Dialog visuals.',
    ],
    [
      'confirmDialogClass',
      'string',
      "''",
      'Additive class on the native dialog.',
    ],
    [
      'classes',
      'NeuralConfirmDialogClasses',
      '{}',
      'Typed additive class slots.',
    ],
  ] as const;
  readonly componentOutputs = [
    ['accepted', 'NeuralConfirmation', 'Accept action completed.'],
    ['rejected', 'NeuralConfirmation', 'Reject action completed.'],
    [
      'dismissed',
      'NeuralConfirmationClose',
      'Closed without accepting or rejecting.',
    ],
    ['closed', 'NeuralConfirmationClose', 'Every completed dialog close.'],
    [
      'actionError',
      'NeuralConfirmDialogActionError',
      'Async accept or reject action threw.',
    ],
  ] as const;
  readonly confirmationInputs = [
    ['key', 'string', 'default', 'Target host channel.'],
    ['header', 'string', 'localized', 'Dialog heading.'],
    ['message', 'string', 'required', 'Non-empty confirmation message.'],
    ['icon', 'boolean', 'true', 'Shows the leading icon.'],
    ['iconClass', 'string', 'nt-alert-triangle', 'Leading Neural Icon class.'],
    ['acceptLabel / rejectLabel', 'string', 'localized', 'Action labels.'],
    [
      'acceptIconClass / rejectIconClass',
      'string',
      'nt-check / nt-x',
      'Action Neural Icons.',
    ],
    ['acceptVisible / rejectVisible', 'boolean', 'true', 'Action visibility.'],
    ['closable', 'boolean', 'host value', 'Per-request close button override.'],
    ['closeOnEscape', 'boolean', 'host value', 'Per-request Escape override.'],
    [
      'dismissibleBackdrop',
      'boolean',
      'host value',
      'Per-request backdrop override.',
    ],
    [
      'accept / reject',
      'NeuralConfirmationAction',
      'undefined',
      'Sync or async guarded action.',
    ],
    [
      'onClose',
      '(event) => void',
      'undefined',
      'Request-local completion callback.',
    ],
    [
      'data',
      'unknown',
      'undefined',
      'Consumer metadata retained on the request.',
    ],
  ] as const;
  readonly serviceMethods = [
    [
      'confirm',
      '(input) => NeuralConfirmationRef',
      'Creates or replaces a keyed request.',
    ],
    [
      'confirmation',
      '(key?) => NeuralConfirmation | null',
      'Reads the active request for a key.',
    ],
    [
      'close',
      '(key?) => boolean',
      'Dismisses the active keyed request through the API.',
    ],
    [
      'confirmations',
      'Signal<readonly NeuralConfirmation[]>',
      'Readonly active request collection.',
    ],
  ] as const;
  readonly refMembers = [
    ['id', 'string', 'Stable request identifier.'],
    ['closed', 'Signal<boolean>', 'Whether the request has completed.'],
    [
      'result',
      'Signal<accepted | rejected | dismissed | null>',
      'Final result.',
    ],
    [
      'closeReason',
      'Signal<NeuralConfirmationCloseReason | null>',
      'Exact close reason.',
    ],
    ['dismiss', '() => void', 'Dismisses this request through the API.'],
  ] as const;
  readonly results = ['accepted', 'rejected', 'dismissed'] as const;
  readonly closeReasons = [
    'accept',
    'reject',
    'escape',
    'backdrop',
    'close-button',
    'api',
    'replaced',
  ] as const;
  readonly publicTypes = [
    ['NeuralConfirmationInput', 'Configuration accepted by confirm().'],
    ['NeuralConfirmation', 'Normalized immutable active request.'],
    ['NeuralConfirmationRef', 'Signal-backed request reference.'],
    ['NeuralConfirmationClose', '{ confirmation, result, reason }'],
    [
      'NeuralConfirmationAction',
      '() => boolean | void | Promise<boolean | void>',
    ],
    ['NeuralConfirmDialogActionError', '{ confirmation, action, error }'],
  ] as const;
  readonly componentTokens = [
    '--neural-confirm-dialog-width',
    '--neural-confirm-dialog-header-padding',
    '--neural-confirm-dialog-body-padding',
    '--neural-confirm-dialog-footer-padding',
    '--neural-confirm-dialog-icon-size',
    '--neural-confirm-dialog-title-size',
    '--neural-confirm-dialog-icon-color',
    '--neural-confirm-dialog-icon-background',
    '--neural-confirm-dialog-enter-duration',
    '--neural-confirm-dialog-leave-duration',
    '--neural-confirm-dialog-enter-distance',
    '--neural-confirm-dialog-enter-scale',
    '--neural-confirm-dialog-enter-easing',
    '--neural-confirm-dialog-leave-easing',
  ] as const;
  readonly dialogTokens = [
    '--neural-dialog-color',
    '--neural-dialog-background',
    '--neural-dialog-border',
    '--neural-dialog-radius',
    '--neural-dialog-shadow',
    '--neural-dialog-backdrop',
    '--neural-dialog-backdrop-filter',
  ] as const;

  constructor() {
    const subscription = this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
      )
      .subscribe((event) =>
        this.selectedView.set(
          resolveConfirmDialogDocView(event.urlAfterRedirects),
        ),
      );
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  confirmDelete(): void {
    this.confirmation.confirm({
      header: 'Delete workspace?',
      message: 'Members will immediately lose access. This cannot be undone.',
      iconClass: 'nt-trash',
      acceptLabel: 'Delete workspace',
      accept: () => undefined,
    });
  }

  confirmPublish(): void {
    this.publishAttempt = 0;
    this.publishStatus.set('Waiting for confirmation');
    this.confirmation.confirm({
      key: 'publish',
      header: 'Publish release?',
      message: 'The first validation attempt stays open. The second succeeds.',
      iconClass: 'nt-sparkles',
      acceptLabel: 'Validate and publish',
      accept: async () => {
        this.publishStatus.set('Validating…');
        await new Promise((resolve) => setTimeout(resolve, 350));
        this.publishAttempt += 1;
        if (this.publishAttempt === 1) {
          this.publishStatus.set('Validation failed · try once more');
          return false;
        }
        this.publishStatus.set('Release published');
        return true;
      },
      reject: () => this.publishStatus.set('Publishing cancelled'),
    });
  }

  confirmKeyed(key: 'default' | 'secondary'): void {
    this.confirmation.confirm({
      key: key === 'default' ? undefined : key,
      header: key === 'default' ? 'Default channel' : 'Secondary channel',
      message: `This request belongs only to the ${key} host.`,
    });
  }

  demonstrateReplacement(): void {
    const first = this.confirmation.confirm({
      key: 'replacement',
      message: 'This request will be replaced immediately.',
    });
    this.confirmation.confirm({
      key: 'replacement',
      header: 'Latest request wins',
      message: 'The previous same-key reference completed deterministically.',
    });
    this.replacementStatus.set(
      `First ref: ${first.result()} · ${first.closeReason()}`,
    );
  }

  confirmOptions(): void {
    this.confirmation.confirm({
      key: 'options',
      header: 'Archive project?',
      message: 'You can restore this project from settings later.',
      iconClass: 'nt-folders',
      acceptLabel: 'Archive',
      rejectLabel: 'Keep project',
      closable: true,
      dismissibleBackdrop: true,
    });
  }

  confirmError(): void {
    this.errorStatus.set('Waiting for action');
    this.confirmation.confirm({
      key: 'errors',
      header: 'Protected action',
      message: 'This demo intentionally throws from the accept action.',
      closable: true,
      accept: async () => {
        await Promise.resolve();
        throw new Error('The server rejected this action.');
      },
    });
  }

  handleActionError(event: NeuralConfirmDialogActionError): void {
    this.errorStatus.set(
      `${event.action}: ${event.error instanceof Error ? event.error.message : 'Unknown error'}`,
    );
  }

  confirmHeadless(): void {
    this.confirmation.confirm({
      key: 'headless',
      header: 'Agent authorization',
      message: 'Allow the agent to apply generated workspace changes?',
      iconClass: 'nt-sparkles',
      acceptLabel: 'Authorize',
    });
  }

  recordClose(event: NeuralConfirmationClose): void {
    this.lastResult.set(`${event.result} · ${event.reason}`);
  }

  selectView(value: NeuralTabValue | null): void {
    if (!isConfirmDialogDocView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    void this.router.navigateByUrl(
      `/docs/components/confirm-dialog${value === 'component' ? '' : `/${value}`}`,
    );
  }

  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}

function resolveConfirmDialogDocView(url: string): ConfirmDialogDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}

function isConfirmDialogDocView(
  value: NeuralTabValue | null,
): value is ConfirmDialogDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
