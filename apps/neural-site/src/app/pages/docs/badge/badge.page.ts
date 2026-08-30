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
import {
  NeuralBadge,
  NeuralBadgeDirective,
  type NeuralBadgeClasses,
} from '@neural-ng/core/badge';
import { NeuralButton } from '@neural-ng/core/button';
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

type BadgeDocView = 'component' | 'accessibility' | 'api' | 'tokens';

@Component({
  selector: 'app-badge-page',
  imports: [
    SiteOnThisPage,
    DesignTokenList,
    CodeView,
    NeuralBadge,
    NeuralBadgeDirective,
    NeuralButton,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
  ],
  templateUrl: './badge.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgePage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);
  readonly notifications = signal(98);
  readonly directiveValue = signal<number | null>(8);
  readonly selectedView = signal<BadgeDocView>(resolveView(this.router.url));
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
  readonly headlessClasses: NeuralBadgeClasses = {
    root: 'inline-flex min-w-7 items-center justify-center gap-1 rounded-lg border border-fuchsia-300/40 bg-slate-950 px-2 py-1 text-xs font-black text-fuchsia-200 shadow-[0_8px_24px_rgba(217,70,239,.2)]',
    value: 'tracking-wide',
    content: 'inline-flex items-center gap-1',
  };
  readonly pageLinks: Record<
    BadgeDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Values and caps', 'values'],
      ['Severities', 'severities'],
      ['Sizes and content', 'sizes'],
      ['Live counter', 'live'],
      ['Directive anchors', 'directive'],
      ['Positions', 'positions'],
      ['Button integration', 'button'],
      ['Visibility', 'visibility'],
      ['Unstyled', 'unstyled'],
      ['Boundaries', 'boundaries'],
    ],
    accessibility: [
      ['Labels and caps', 'labels'],
      ['Dots', 'dots'],
      ['Live regions', 'live-regions'],
      ['Anchors', 'anchors'],
      ['RTL', 'rtl'],
    ],
    api: [
      ['Badge inputs', 'badge-inputs'],
      ['Directive inputs', 'directive-inputs'],
      ['Class slots', 'class-slots'],
      ['Types', 'types'],
    ],
    tokens: [
      ['Base tokens', 'base-tokens'],
      ['Severity tokens', 'severity-tokens'],
      ['Anchor tokens', 'anchor-tokens'],
    ],
  };

  readonly importCode = `import {
  NeuralBadge,
  NeuralBadgeDirective,
} from '@neural-ng/core/badge';

@Component({ imports: [NeuralBadge, NeuralBadgeDirective] })`;
  readonly valuesCode = `<neural-badge value="New" />
<neural-badge [value]="8" severity="info" />
<neural-badge [value]="128" [max]="99" severity="error" />
<neural-badge [value]="0" />
<neural-badge [value]="-2" severity="warning" />`;
  readonly severityCode = `<neural-badge value="Primary" severity="primary" />
<neural-badge value="Secondary" severity="secondary" />
<neural-badge value="Neutral" severity="neutral" />
<neural-badge value="Info" severity="info" />
<neural-badge value="Success" severity="success" />
<neural-badge value="Warning" severity="warning" />
<neural-badge value="Error" severity="error" />`;
  readonly sizesCode = `<neural-badge value="SM" size="small" />
<neural-badge value="MD" />
<neural-badge value="LG" size="large" [rounded]="false" />
<neural-badge dot severity="success" ariaLabel="Service online" />
<neural-badge severity="success"><i class="nt nt-check"></i> Verified</neural-badge>`;
  readonly liveCode = `<neural-button label="Add notification" (clicked)="increment()" />
<neural-badge [value]="notifications()" [max]="99"
  severity="info" ariaLive="polite" />`;
  readonly directiveCode = `<button type="button" aria-label="Notifications, 8 unread"
  [neuralBadge]="8" neuralBadgePosition="top-end"
  neuralBadgeSeverity="error">
  <i class="nt nt-bell" aria-hidden="true"></i>
</button>

<span neuralBadge="" neuralBadgeDot neuralBadgePosition="bottom-end"
  neuralBadgeSeverity="success" neuralBadgeAriaLabel="Online">NN</span>`;
  readonly positionsCode = `<span [neuralBadge]="3" neuralBadgePosition="start">Start</span>
<span [neuralBadge]="3" neuralBadgePosition="end">End</span>
<button [neuralBadge]="3" neuralBadgePosition="top-start">Top start</button>
<button [neuralBadge]="3" neuralBadgePosition="top-end">Top end</button>
<button [neuralBadge]="3" neuralBadgePosition="bottom-start">Bottom start</button>
<button [neuralBadge]="3" neuralBadgePosition="bottom-end">Bottom end</button>`;
  readonly buttonCode = `<neural-button label="Inbox" icon="nt nt-inbox"
  [badge]="12" badgePosition="end" badgeSeverity="error" />

<neural-button ariaLabel="Notifications" icon="nt nt-bell"
  badge="" badgeDot badgePosition="top-end" badgeSeverity="success" />`;
  readonly visibilityCode = `<neural-badge [value]="0" /> <!-- visible -->
<neural-badge [value]="null" /> <!-- projected content or empty -->
<neural-badge value="Hidden" badgeHidden />

<button [neuralBadge]="value()">Notifications</button>
<!-- null/undefined removes the directive host; zero remains visible. -->`;
  readonly unstyledCode = `<neural-badge value="AI" unstyled [classes]="classes" />

<button [neuralBadge]="7" neuralBadgeUnstyled
  neuralBadgeClass="consumer-badge" neuralBadgeHostClass="consumer-host">
  Messages
</button>`;

  readonly badgeInputs = [
    [
      'value',
      'string | number | null | undefined',
      'null',
      'Visible value; absence projects content.',
    ],
    ['max', 'number | null', 'null', 'Finite non-negative numeric visual cap.'],
    [
      'severity',
      'NeuralBadgeSeverity',
      "'neutral'",
      'Semantic color treatment.',
    ],
    [
      'size',
      'small | medium | large',
      "'medium'",
      'Preset dimensions and type scale.',
    ],
    ['rounded', 'boolean', 'true', 'Uses pill radius when enabled.'],
    ['dot', 'boolean', 'false', 'Renders a visual dot without value text.'],
    ['badgeHidden', 'boolean', 'false', 'Explicitly hides the component host.'],
    [
      'ariaLabel',
      'string | null',
      'null/capped value',
      'Accessible label override.',
    ],
    [
      'ariaLive',
      'off | polite | assertive',
      "'off'",
      'Live-region announcement mode.',
    ],
    ['unstyled', 'boolean', 'false', 'Removes NeuralNg visual classes.'],
    ['badgeClass', 'string', "''", 'Additive root class.'],
    ['classes', 'NeuralBadgeClasses', '{}', 'Typed additive class slots.'],
  ] as const;
  readonly directiveInputs = [
    [
      'neuralBadge',
      'string | number | null | undefined',
      'null',
      'Generated Badge value.',
    ],
    [
      'neuralBadgePosition',
      'NeuralBadgePosition',
      "'top-end'",
      'Inline or logical-corner placement.',
    ],
    [
      'neuralBadgeSeverity',
      'NeuralBadgeSeverity',
      "'neutral'",
      'Generated Badge severity.',
    ],
    ['neuralBadgeSize', 'NeuralBadgeSize', "'small'", 'Generated Badge size.'],
    ['neuralBadgeMax', 'number | null', 'null', 'Numeric visual cap.'],
    [
      'neuralBadgeAriaLabel',
      'string | null',
      'null',
      'Accessible Badge label.',
    ],
    [
      'neuralBadgeAriaLive',
      'NeuralBadgeAriaLive',
      "'off'",
      'Live-region behavior.',
    ],
    ['neuralBadgeClass', 'string', "''", 'Class for generated Badge root.'],
    [
      'neuralBadgeHostClass',
      'string',
      "''",
      'Class for generated host element.',
    ],
    ['neuralBadgeRounded', 'boolean', 'true', 'Rounded generated Badge.'],
    ['neuralBadgeDot', 'boolean', 'false', 'Dot generated Badge.'],
    [
      'neuralBadgeHidden',
      'boolean',
      'false',
      'Explicitly removes generated host.',
    ],
    [
      'neuralBadgeUnstyled',
      'boolean',
      'false',
      'Removes generated visual classes.',
    ],
  ] as const;
  readonly classSlots = ['root', 'value', 'content'] as const;
  readonly publicTypes = [
    [
      'NeuralBadgeSeverity',
      'primary | secondary | neutral | info | success | warning | error',
    ],
    ['NeuralBadgeSize', 'small | medium | large'],
    ['NeuralBadgeAriaLive', 'off | polite | assertive'],
    [
      'NeuralBadgePosition',
      'start | end | top-start | top-end | bottom-start | bottom-end',
    ],
  ] as const;
  readonly baseTokens = [
    '--neural-badge-min-width',
    '--neural-badge-height',
    '--neural-badge-padding',
    '--neural-badge-color',
    '--neural-badge-background',
    '--neural-badge-border',
    '--neural-badge-radius',
    '--neural-badge-rounded-radius',
    '--neural-badge-shadow',
    '--neural-badge-font-family',
    '--neural-badge-font-size',
    '--neural-badge-font-weight',
    '--neural-badge-line-height',
    '--neural-badge-small-min-width',
    '--neural-badge-small-height',
    '--neural-badge-small-padding',
    '--neural-badge-small-font-size',
    '--neural-badge-large-min-width',
    '--neural-badge-large-height',
    '--neural-badge-large-padding',
    '--neural-badge-large-font-size',
    '--neural-badge-dot-size',
    '--neural-badge-dot-small-size',
    '--neural-badge-dot-large-size',
    '--neural-badge-content-gap',
  ] as const;
  readonly severityTokens = [
    '--neural-badge-primary-color',
    '--neural-badge-primary-background',
    '--neural-badge-primary-border-color',
    '--neural-badge-secondary-color',
    '--neural-badge-secondary-background',
    '--neural-badge-secondary-border-color',
    '--neural-badge-neutral-color',
    '--neural-badge-neutral-background',
    '--neural-badge-neutral-border-color',
    '--neural-badge-info-color',
    '--neural-badge-info-background',
    '--neural-badge-info-border-color',
    '--neural-badge-success-color',
    '--neural-badge-success-background',
    '--neural-badge-success-border-color',
    '--neural-badge-warning-color',
    '--neural-badge-warning-background',
    '--neural-badge-warning-border-color',
    '--neural-badge-error-color',
    '--neural-badge-error-background',
    '--neural-badge-error-border-color',
  ] as const;
  readonly anchorTokens = [
    '--neural-badge-anchor-offset',
    '--neural-badge-anchor-z-index',
  ] as const;

  constructor() {
    const subscription = this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
      )
      .subscribe((event) =>
        this.selectedView.set(resolveView(event.urlAfterRedirects)),
      );
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }
  increment(): void {
    this.notifications.update((value) => value + 1);
  }
  toggleDirective(): void {
    this.directiveValue.update((value) => (value === null ? 0 : null));
  }
  selectView(value: NeuralTabValue | null): void {
    if (!isView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    void this.router.navigateByUrl(
      `/docs/components/badge${value === 'component' ? '' : `/${value}`}`,
    );
  }
  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}

function resolveView(url: string): BadgeDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}
function isView(value: NeuralTabValue | null): value is BadgeDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
