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
  NeuralMessageService,
  type NeuralMessageSeverity,
} from '@neural-ng/core/message';
import {
  TabComponent,
  TabListComponent,
  TabPanelComponent,
  TabPanelsComponent,
  TabsComponent,
  type NeuralTabsClasses,
  type NeuralTabValue,
} from '@neural-ng/core/tabs';
import {
  NeuralToast,
  NeuralToastTemplateDirective,
  type NeuralToastPosition,
} from '@neural-ng/core/toast';
import { NeuralSelect } from '@neural-ng/core/select';
import { CodeView } from '../../../shared/code-view';
import { DesignTokenList } from '../../../shared/design-token-list';
import { SiteAppearanceService } from '../../../core/site-appearance.service';

type ToastDocView = 'component' | 'accessibility' | 'api' | 'tokens';

@Component({
  selector: 'app-toast-page',
  imports: [
    SiteOnThisPage,
    DesignTokenList,
    NeuralButton,
    NeuralSelect,
    NeuralToast,
    NeuralToastTemplateDirective,
    CodeView,
    TabComponent,
    TabListComponent,
    TabPanelComponent,
    TabPanelsComponent,
    TabsComponent,
  ],
  templateUrl: './toast.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly messages = inject(NeuralMessageService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);

  readonly selectedView = signal<ToastDocView>(
    resolveToastDocView(this.router.url),
  );
  readonly selectedViewIndex = computed(() =>
    ['component', 'accessibility', 'api', 'tokens'].indexOf(
      this.selectedView(),
    ),
  );
  readonly position = signal<NeuralToastPosition>('top-end');
  readonly lastEvent = signal('Waiting for a notification');
  readonly severities: readonly NeuralMessageSeverity[] = [
    'primary',
    'secondary',
    'neutral',
    'success',
    'info',
    'warning',
    'error',
  ];
  readonly positions: readonly NeuralToastPosition[] = [
    'top-start',
    'top-center',
    'top-end',
    'middle-start',
    'middle-center',
    'middle-end',
    'bottom-start',
    'bottom-center',
    'bottom-end',
  ];
  readonly docTabClasses: NeuralTabsClasses = {
    root: 'min-w-0',
    list: 'relative isolate gap-1 overflow-x-auto rounded-[1.35rem] border border-white/20 bg-[color-mix(in_srgb,var(--site-surface)_76%,transparent)] p-1.5 shadow-[inset_0_1px_rgba(255,255,255,.28),0_12px_35px_rgba(15,23,42,.10)] backdrop-blur-[30px] backdrop-saturate-150',
    tab: 'relative z-10 !flex-1 gap-2 rounded-[1rem] px-3 py-2.5 text-xs font-bold text-[var(--site-text-muted)] transition-[color,transform] duration-300 hover:text-[var(--site-text)] active:scale-[.97] sm:px-4 sm:text-sm',
    activeTab: 'text-[var(--site-text)]',
    panels: 'min-w-0',
    panel:
      'min-w-0 !p-0 animate-[neural-doc-panel-soft-in_200ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none',
  };
  readonly pageLinks: Record<
    ToastDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Basic', 'basic'],
      ['Severity', 'severity'],
      ['Positions', 'positions'],
      ['Lifetime', 'lifetime'],
      ['Show progress', 'show-progress'],
      ['Icons', 'icons'],
      ['Channels', 'channels'],
      ['Unstyled', 'unstyled'],
    ],
    accessibility: [
      ['Live regions', 'live-regions'],
      ['Interaction', 'interaction'],
      ['Motion', 'motion'],
    ],
    api: [
      ['Toast inputs', 'inputs'],
      ['Message API', 'message-api'],
      ['Positions', 'position-api'],
    ],
    tokens: [['Design tokens', 'tokens']],
  };

  readonly importCode = `import { provideNeuralMessages } from '@neural-ng/core/message';
import { provideNeuralToast, NeuralToast } from '@neural-ng/core/toast';

export const appConfig: ApplicationConfig = {
  providers: [provideNeuralMessages(), provideNeuralToast()],
};

@Component({ imports: [NeuralToast] })`;
  readonly basicCode = `<neural-toast />

readonly messages = inject(NeuralMessageService);

save(): void {
  this.messages.notify({
    severity: 'success',
    title: 'Saved',
    message: 'Your changes are ready.',
  });
}`;
  readonly severityCode = `messages.notify({
  severity: 'success', // primary | secondary | neutral | info | warning | error
  title: 'Deployment complete',
  message: 'Version 0.1.0 is live.',
});`;
  readonly positionCode = `<neural-toast position="bottom-start" />`;
  readonly lifetimeCode = `<neural-toast showProgress [pauseOnInteraction]="true" />

messages.notify({ message: 'Auto dismiss', duration: 5000 });
messages.notify({ message: 'Persistent', duration: null });`;
  readonly progressCode = `<neural-toast showProgress />

messages.notify({
  severity: 'info',
  title: 'Uploading assets',
  message: 'The remaining lifetime is visible.',
  duration: 7000,
});`;
  readonly iconCode = `<neural-toast [icon]="false" />
<neural-toast iconClass="nt nt-sparkles text-violet-500" />`;
  readonly channelCode = `<neural-toast channel="billing" position="top-end" />

messages.notify({
  channel: 'billing',
  severity: 'warning',
  message: 'Payment method expires soon.',
});`;
  readonly unstyledCode = `<neural-toast
  unstyled
  channel="product-events"
  position="bottom-start"
  messageClass="grid grid-cols-[auto_1fr_auto] gap-3 rounded-2xl bg-slate-950 p-4 text-white"
>
  <ng-template neuralToastTemplate let-message let-dismiss="dismiss">
    <i class="nt nt-sparkles" aria-hidden="true"></i>
    <div>
      <strong>{{ message.title }}</strong>
      <p>{{ message.message }}</p>
    </div>
    <neural-button text icon="nt nt-x" ariaLabel="Dismiss" (clicked)="dismiss()" />
  </ng-template>
</neural-toast>`;

  readonly inputs = [
    ['channel', 'string', "'global'", 'Selects the Message API stream.'],
    [
      'position',
      'NeuralToastPosition',
      "'top-end'",
      'Logical viewport placement.',
    ],
    ['icon', 'boolean', 'true', 'Shows the decorative severity icon.'],
    ['iconClass', 'string', "''", 'Overrides the automatic severity icon.'],
    ['showProgress', 'boolean', 'false', 'Shows finite lifetime progress.'],
    ['pauseOnInteraction', 'boolean', 'true', 'Pauses on hover and focus.'],
    ['swipeToDismiss', 'boolean', 'true', 'Enables pointer swipe dismissal.'],
    ['swipeThreshold', 'number', '72', 'Dismissal distance in pixels.'],
    ['animated', 'boolean', 'true', 'Enables enter and leave motion.'],
    ['unstyled', 'boolean', 'false', 'Removes NeuralNg visual classes.'],
    ['toastClass', 'string', "''", 'Adds classes to the outlet.'],
    ['messageClass', 'string', "''", 'Adds classes to every message.'],
  ] as const;
  readonly tokens = [
    '--neural-toast-width',
    '--neural-toast-inset',
    '--neural-toast-stack-gap',
    '--neural-toast-message-padding',
    '--neural-toast-message-background',
    '--neural-toast-message-border-color',
    '--neural-toast-message-radius',
    '--neural-toast-message-shadow',
    '--neural-toast-primary-color',
    '--neural-toast-secondary-color',
    '--neural-toast-info-color',
    '--neural-toast-success-color',
    '--neural-toast-warning-color',
    '--neural-toast-error-color',
    '--neural-toast-progress-height',
    '--neural-toast-enter-duration',
    '--neural-toast-leave-duration',
  ] as const;

  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.selectedView.set(resolveToastDocView(event.urlAfterRedirects));
      }
    });
    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();
      this.messages.clear('site-toast-docs');
      this.messages.clear('billing-docs');
      this.messages.clear('unstyled-docs');
    });
  }

  show(severity: NeuralMessageSeverity, persistent = false): void {
    const label = severity[0].toUpperCase() + severity.slice(1);
    const ref = this.messages.notify({
      channel: 'site-toast-docs',
      severity,
      title: `${label} notification`,
      message: 'Severity now colors the complete notification surface.',
      duration: persistent ? null : 5000,
    });
    this.lastEvent.set(`Created ${ref.id}`);
  }

  showIconDemo(): void {
    this.messages.notify({
      channel: 'site-toast-docs',
      severity: 'primary',
      title: 'Agent ready',
      message: 'The icon can be disabled or replaced with iconClass.',
      duration: 5000,
    });
  }

  showChannel(): void {
    this.messages.notify({
      channel: 'billing-docs',
      severity: 'warning',
      title: 'Billing channel',
      message: 'This message was routed to an independent outlet.',
      duration: 5000,
    });
  }

  showUnstyled(): void {
    this.messages.notify({
      channel: 'unstyled-docs',
      severity: 'primary',
      title: 'Consumer-owned UI',
      message: 'NeuralNg owns behavior; Tailwind owns every visible style.',
      duration: 5000,
    });
  }

  clear(): void {
    this.messages.clear('site-toast-docs');
    this.messages.clear('billing-docs');
    this.messages.clear('unstyled-docs');
    this.lastEvent.set('Channel cleared');
  }

  setPosition(position: NeuralToastPosition | null): void {
    if (position) this.position.set(position);
  }

  selectView(value: NeuralTabValue | null): void {
    if (!isToastDocView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    const suffix = value === 'component' ? '' : `/${value}`;
    void this.router.navigateByUrl(`/docs/components/toast${suffix}`);
  }

  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}

function resolveToastDocView(url: string): ToastDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}

function isToastDocView(value: NeuralTabValue | null): value is ToastDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
