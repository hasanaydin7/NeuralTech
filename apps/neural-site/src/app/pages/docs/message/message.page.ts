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
  NeuralMessage,
  type NeuralMessageClasses,
  type NeuralMessageSeverity,
} from '@neural-ng/core/message';
import {
  NeuralTab,
  NeuralTabList,
  NeuralTabPanel,
  NeuralTabPanels,
  NeuralTabs,
  type NeuralTabsClasses,
  type NeuralTabValue,
} from '@neural-ng/core/tabs';
import { SiteAppearanceService } from '../../../core/site-appearance.service';
import { CodeView } from '../../../shared/code-view';
import { DesignTokenList } from '../../../shared/design-token-list';

type MessageDocView = 'component' | 'accessibility' | 'api' | 'tokens';

@Component({
  selector: 'app-message-page',
  imports: [
    SiteOnThisPage,
    DesignTokenList,
    CodeView,
    NeuralButton,
    NeuralMessage,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
  ],
  templateUrl: './message.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessagePage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);
  readonly selectedView = signal<MessageDocView>(resolveView(this.router.url));
  readonly selectedViewIndex = computed(() =>
    ['component', 'accessibility', 'api', 'tokens'].indexOf(
      this.selectedView(),
    ),
  );
  readonly noticeVisible = signal(true);
  readonly severities: readonly NeuralMessageSeverity[] = [
    'primary',
    'secondary',
    'neutral',
    'info',
    'success',
    'warning',
    'error',
  ];
  readonly headlessClasses: NeuralMessageClasses = {
    root: 'rounded-2xl border border-violet-400/30 bg-slate-950 p-4 text-white shadow-xl',
    icon: 'text-xl text-violet-300',
    content: 'gap-1',
    title: 'font-black text-white',
    detail: 'text-sm text-slate-300',
    close: 'text-white hover:bg-white/10',
  };
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
    MessageDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Basic', 'basic'],
      ['Severities', 'severities'],
      ['Variants', 'variants'],
      ['Sizes and icons', 'sizes'],
      ['Closable', 'closable'],
      ['Rich content', 'content'],
      ['Unstyled', 'unstyled'],
      ['Message vs Toast', 'boundaries'],
    ],
    accessibility: [
      ['Live semantics', 'live-semantics'],
      ['Dismissal', 'dismissal'],
      ['Motion', 'motion'],
    ],
    api: [
      ['Inputs', 'inputs'],
      ['Models and events', 'events'],
      ['Class slots', 'class-slots'],
      ['Store types', 'store-types'],
    ],
    tokens: [['Design tokens', 'design-tokens']],
  };
  readonly importCode = `import { NeuralMessage } from '@neural-ng/core/message';\n\n@Component({ imports: [NeuralMessage] })`;
  readonly basicCode = `<neural-message severity="info" title="Workspace updated" message="Your settings are available to every team member." />`;
  readonly severityCode = `<neural-message severity="success" message="Changes saved." />\n<neural-message severity="warning" message="Your session expires soon." />\n<neural-message severity="error" message="The request could not be completed." />`;
  readonly variantCode = `<neural-message variant="filled" severity="primary" message="Filled" />\n<neural-message variant="outlined" severity="success" message="Outlined" />\n<neural-message variant="simple" severity="error" message="Simple" />`;
  readonly sizeCode = `<neural-message size="small" message="Compact helper message" />\n<neural-message iconClass="nt nt-lock text-violet-500" title="Secure" message="Custom icon classes inherit normal CSS." />\n<neural-message [icon]="false" size="large" message="Large message without an icon" />`;
  readonly closeCode = `<neural-message closable [(visible)]="noticeVisible" title="Draft restored" message="The local draft was recovered." (closed)="onClosed()" />`;
  readonly contentCode = `<neural-message severity="primary" title="New version available">\n  Review the changelog before upgrading.\n  <neural-button message-actions label="Review" size="small" text />\n</neural-message>`;
  readonly unstyledCode = `<neural-message unstyled closable iconClass="nt nt-sparkles" title="Fully headless" message="Structural hooks and behavior remain." [classes]="messageClasses" />`;
  readonly inputs = [
    [
      'severity',
      'NeuralMessageSeverity',
      `'info'`,
      'Semantic color and announcement intent.',
    ],
    ['title', 'string | null', 'null', 'Optional concise heading.'],
    [
      'message',
      'string | null',
      'null',
      'Inline detail; projected content is also supported.',
    ],
    [
      'variant',
      `'filled' | 'outlined' | 'simple'`,
      `'filled'`,
      'Visual treatment.',
    ],
    ['size', `'small' | 'medium' | 'large'`, `'medium'`, 'Density preset.'],
    ['icon', 'boolean', 'true', 'Shows the automatic severity icon.'],
    [
      'iconClass',
      'string | null',
      'null',
      'Overrides the icon and accepts utility classes.',
    ],
    [
      'closable',
      'boolean',
      'false',
      'Provides a keyboard-accessible close button.',
    ],
    [
      'closeLabel',
      'string',
      `'Close message'`,
      'Accessible close button name.',
    ],
    [
      'ariaLive',
      `'auto' | 'off' | 'polite' | 'assertive'`,
      `'auto'`,
      'Live-region override.',
    ],
    ['unstyled', 'boolean', 'false', 'Removes every NeuralNg visual class.'],
    ['messageClass', 'string', `''`, 'Adds consumer classes to the root.'],
    ['classes', 'NeuralMessageClasses', '{}', 'Typed class slots.'],
  ] as const;
  readonly events = [
    [
      'visible',
      'model<boolean>',
      'true',
      'Controlled rendered state with visibleChange.',
    ],
    ['closed', 'void', '—', 'Emitted after an explicit user close.'],
  ] as const;
  readonly classSlots = [
    'root',
    'icon',
    'content',
    'title',
    'detail',
    'actions',
    'close',
  ] as const;
  readonly tokens = [
    '--neural-message-gap',
    '--neural-message-padding',
    '--neural-message-content-gap',
    '--neural-message-icon-size',
    '--neural-message-color',
    '--neural-message-background',
    '--neural-message-border-width',
    '--neural-message-border-color',
    '--neural-message-radius',
    '--neural-message-shadow',
    '--neural-message-font-family',
    '--neural-message-primary-color',
    '--neural-message-secondary-color',
    '--neural-message-neutral-color',
    '--neural-message-info-color',
    '--neural-message-success-color',
    '--neural-message-warning-color',
    '--neural-message-error-color',
    '--neural-message-focus-ring',
    '--neural-message-enter-duration',
    '--neural-message-leave-duration',
  ] as const;

  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd)
        this.selectedView.set(resolveView(event.urlAfterRedirects));
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }
  showNotice(): void {
    this.noticeVisible.set(true);
  }
  selectView(value: NeuralTabValue | null): void {
    if (!isView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    void this.router.navigateByUrl(
      `/docs/components/message${value === 'component' ? '' : `/${value}`}`,
    );
  }
  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}

function resolveView(url: string): MessageDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}
function isView(value: NeuralTabValue | null): value is MessageDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
