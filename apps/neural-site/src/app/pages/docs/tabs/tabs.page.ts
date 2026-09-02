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

type TabsDocView = 'component' | 'accessibility' | 'api' | 'tokens';

@Component({
  selector: 'app-tabs-page',
  imports: [
    SiteOnThisPage,
    CodeView,
    DesignTokenList,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
  ],
  templateUrl: './tabs.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);
  readonly activeTab = signal<NeuralTabValue | null>('overview');
  readonly manualTab = signal<NeuralTabValue | null>('activity');
  readonly overflowTab = signal<NeuralTabValue | null>('overview');
  readonly headlessTab = signal<NeuralTabValue | null>('markup');
  readonly selectedView = signal<TabsDocView>(resolveView(this.router.url));
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
  readonly headlessClasses: NeuralTabsClasses = {
    root: 'grid gap-4 rounded-2xl border border-cyan-400/25 bg-slate-950 p-4 text-cyan-50',
    list: 'flex gap-2 overflow-x-auto rounded-xl bg-cyan-950/60 p-1',
    tab: 'cursor-pointer rounded-lg border border-transparent px-4 py-2 text-sm font-bold text-cyan-100/65 outline-none transition focus:ring-4 focus:ring-cyan-400/20',
    activeTab: 'border-cyan-300/40 bg-cyan-300 text-slate-950',
    disabledTab: 'cursor-not-allowed opacity-40',
    panels: 'min-w-0',
    panel:
      'rounded-xl border border-cyan-400/20 bg-cyan-950/35 p-4 text-sm leading-6 text-cyan-50/80',
  };
  readonly pageLinks: Record<
    TabsDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Basic and icons', 'basic'],
      ['Manual and vertical', 'manual'],
      ['Disabled and fallback', 'disabled'],
      ['Overflow', 'overflow'],
      ['Unstyled', 'unstyled'],
      ['Boundaries', 'boundaries'],
    ],
    accessibility: [
      ['Semantics', 'semantics'],
      ['Keyboard', 'keyboard'],
      ['Focus', 'focus'],
      ['RTL and motion', 'rtl-motion'],
    ],
    api: [
      ['Tabs inputs', 'inputs'],
      ['Output', 'outputs'],
      ['Child API', 'child-api'],
      ['Class slots', 'class-slots'],
    ],
    tokens: [['Design tokens', 'tokens']],
  };
  readonly importCode = `import {
  NeuralTabs,
  NeuralTabList,
  NeuralTab,
  NeuralTabPanels,
  NeuralTabPanel,
} from '@neural-ng/core/tabs';

@Component({
  imports: [NeuralTabs, NeuralTabList, NeuralTab, NeuralTabPanels, NeuralTabPanel],
})`;
  readonly basicCode = `<neural-tabs tabsId="account" [(value)]="activeTab">
  <neural-tab-list ariaLabel="Account sections">
    <neural-tab value="overview" iconClass="nt-home">Overview</neural-tab>
    <neural-tab value="profile" iconClass="nt-user">Profile</neural-tab>
    <neural-tab value="billing" iconClass="nt-credit-card">Billing</neural-tab>
  </neural-tab-list>
  <neural-tab-panels>
    <neural-tab-panel value="overview">Overview content</neural-tab-panel>
    <neural-tab-panel value="profile">Profile content</neural-tab-panel>
    <neural-tab-panel value="billing">Billing content</neural-tab-panel>
  </neural-tab-panels>
</neural-tabs>`;
  readonly manualCode = `<neural-tabs orientation="vertical" activationMode="manual" [(value)]="activeTab">
  <!-- Up/Down moves focus; Enter or Space activates -->
</neural-tabs>`;
  readonly disabledCode = `<neural-tab value="locked" disabled>Locked</neural-tab>
<!-- Invalid, removed or disabled value falls back to the first enabled tab. -->`;
  readonly overflowCode = `<div class="max-w-md">
  <neural-tabs [(value)]="activeTab">...</neural-tabs>
</div>`;
  readonly unstyledCode = `<neural-tabs unstyled [classes]="tabClasses" [(value)]="activeTab">
  <!-- Native semantics and keyboard behavior remain. -->
</neural-tabs>`;
  readonly inputs = [
    ['value', 'NeuralTabValue | null', 'null', 'Controlled active tab model.'],
    [
      'orientation',
      "'horizontal' | 'vertical'",
      "'horizontal'",
      'Visual orientation and arrow-key axis.',
    ],
    [
      'activationMode',
      "'automatic' | 'manual'",
      "'automatic'",
      'Select on focus or require activation.',
    ],
    ['tabsId', 'string', 'generated', 'Stable SSR-safe ARIA id prefix.'],
    ['unstyled', 'boolean', 'false', 'Removes NeuralNg visual classes.'],
    ['tabsClass', 'string', "''", 'Additive root class.'],
    ['classes', 'NeuralTabsClasses', '{}', 'Typed shared and state classes.'],
  ] as const;
  readonly outputs = [
    [
      'valueChange',
      'NeuralTabValue | null',
      'Generated model output for pointer, keyboard, focus and programmatic changes.',
    ],
  ] as const;
  readonly childInputs = [
    [
      'NeuralTabList.ariaLabel',
      'string',
      "'Tabs'",
      'Accessible name when ariaLabelledby is absent.',
    ],
    [
      'NeuralTabList.ariaLabelledby',
      'string | null',
      'null',
      'ID of an external visible label.',
    ],
    ['NeuralTabList.listClass', 'string', "''", 'Additive list class.'],
    [
      'NeuralTab.value',
      'NeuralTabValue',
      'required',
      'Unique tab and panel identity.',
    ],
    [
      'NeuralTab.disabled',
      'boolean',
      'false',
      'Native disabled state; navigation skips it.',
    ],
    ['NeuralTab.iconClass', 'string', "''", 'Optional class-based icon.'],
    ['NeuralTab.tabClass', 'string', "''", 'Additive native button class.'],
    [
      'NeuralTabPanels.panelsClass',
      'string',
      "''",
      'Additive panels container class.',
    ],
    [
      'NeuralTabPanel.value',
      'NeuralTabValue',
      'required',
      'Matching tab identity.',
    ],
    [
      'NeuralTabPanel.focusable',
      'boolean',
      'true',
      'Makes the active panel a tab stop.',
    ],
    ['NeuralTabPanel.panelClass', 'string', "''", 'Additive panel class.'],
  ] as const;
  readonly tokens = [
    '--neural-tabs-gap',
    '--neural-tabs-vertical-gap',
    '--neural-tabs-color',
    '--neural-tabs-font-family',
    '--neural-tabs-list-gap',
    '--neural-tabs-list-padding',
    '--neural-tabs-list-border',
    '--neural-tabs-scrollbar-color',
    '--neural-tabs-scrollbar-width',
    '--neural-tab-gap',
    '--neural-tab-padding',
    '--neural-tab-color',
    '--neural-tab-background',
    '--neural-tab-border',
    '--neural-tab-radius',
    '--neural-tab-font-size',
    '--neural-tab-font-weight',
    '--neural-tab-line-height',
    '--neural-tab-color-hover',
    '--neural-tab-background-hover',
    '--neural-tab-border-color-hover',
    '--neural-tab-active-color',
    '--neural-tab-active-background',
    '--neural-tab-active-border-color',
    '--neural-tab-focus-ring',
    '--neural-tab-focus-ring-offset',
    '--neural-tab-disabled-opacity',
    '--neural-tab-indicator-color',
    '--neural-tab-indicator-size',
    '--neural-tab-indicator-inset',
    '--neural-tab-indicator-offset',
    '--neural-tab-indicator-radius',
    '--neural-tab-indicator-duration',
    '--neural-tab-indicator-easing',
    '--neural-tab-panel-padding',
    '--neural-tab-panel-color',
    '--neural-tab-panel-enter-duration',
    '--neural-tab-panel-enter-easing',
    '--neural-tab-panel-enter-distance',
    '--neural-tab-transition',
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
  selectView(value: NeuralTabValue | null): void {
    if (!isView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    void this.router.navigateByUrl(
      `/docs/components/tabs${value === 'component' ? '' : `/${value}`}`,
    );
  }
  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}

function resolveView(url: string): TabsDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}
function isView(value: NeuralTabValue | null): value is TabsDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
