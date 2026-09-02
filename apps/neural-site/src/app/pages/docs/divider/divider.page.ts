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
  NeuralDivider,
  type NeuralDividerClasses,
} from '@neural-ng/core/divider';
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

type DividerDocView = 'component' | 'accessibility' | 'api' | 'tokens';

@Component({
  selector: 'app-divider-page',
  imports: [
    SiteOnThisPage,
    DesignTokenList,
    CodeView,
    NeuralDivider,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
  ],
  templateUrl: './divider.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DividerPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);

  readonly selectedView = signal<DividerDocView>(resolveView(this.router.url));
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
  readonly headlessClasses: NeuralDividerClasses = {
    root: 'my-5 flex w-full items-center',
    before: 'h-px flex-1 bg-gradient-to-r from-transparent to-cyan-400',
    content:
      'mx-4 rounded-full border border-cyan-300/30 bg-slate-950 px-3 py-1 text-xs font-black tracking-[.14em] text-cyan-200',
    after: 'h-px flex-1 bg-gradient-to-r from-cyan-400 to-transparent',
  };
  readonly pageLinks: Record<
    DividerDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Basic', 'basic'],
      ['Content and alignment', 'content'],
      ['Line types', 'types'],
      ['Vertical', 'vertical'],
      ['Rich projection', 'projection'],
      ['Unstyled', 'unstyled'],
      ['Boundaries', 'boundaries'],
    ],
    accessibility: [
      ['Separator semantics', 'semantics'],
      ['Orientation', 'aria-orientation'],
      ['Accessible names', 'accessible-name'],
      ['Keyboard', 'keyboard'],
      ['RTL', 'rtl'],
    ],
    api: [
      ['Inputs', 'inputs'],
      ['Class slots', 'class-slots'],
      ['Types', 'public-types'],
      ['Deprecated alias', 'deprecated-alias'],
    ],
    tokens: [
      ['Line tokens', 'line-tokens'],
      ['Content tokens', 'content-tokens'],
      ['Layout tokens', 'layout-tokens'],
    ],
  };

  readonly importCode = `import { NeuralDivider } from '@neural-ng/core/divider';

@Component({ imports: [NeuralDivider] })`;
  readonly basicCode = `<p>Workspace overview</p>
<neural-divider />
<p>Agent activity</p>`;
  readonly contentCode = `<neural-divider label="START" align="start" />
<neural-divider label="CENTER" />
<neural-divider label="END" align="end" />`;
  readonly typesCode = `<neural-divider label="SOLID" />
<neural-divider label="DASHED" type="dashed" />
<neural-divider label="DOTTED" type="dotted" />`;
  readonly verticalCode = `<div class="flex h-32 items-stretch">
  <span>Build</span>
  <neural-divider orientation="vertical" ariaLabel="Build and deploy" />
  <span>Deploy</span>
</div>`;
  readonly projectionCode = `<neural-divider ariaLabel="Advanced tools">
  <span><i class="nt nt-sparkles"></i> Advanced tools</span>
</neural-divider>`;
  readonly unstyledCode = `<neural-divider
  unstyled
  label="HEADLESS"
  [classes]="classes"
/>`;

  readonly inputs = [
    [
      'orientation',
      "'horizontal' | 'vertical'",
      "'horizontal'",
      'Logical layout and ARIA orientation.',
    ],
    [
      'align',
      "'start' | 'center' | 'end'",
      "'center'",
      'Positions content using logical edges.',
    ],
    ['type', "'solid' | 'dashed' | 'dotted'", "'solid'", 'Visual line style.'],
    ['label', 'string | null', 'null', 'Plain text; overrides projection.'],
    ['ariaLabel', 'string | null', 'null', 'Direct accessible name.'],
    [
      'ariaLabelledBy',
      'string | null',
      'null',
      'ID reference; takes precedence over ariaLabel.',
    ],
    ['unstyled', 'boolean', 'false', 'Removes NeuralNg visual classes.'],
    ['dividerClass', 'string', "''", 'Additive class on the separator root.'],
    ['classes', 'NeuralDividerClasses', '{}', 'Typed additive class slots.'],
  ] as const;
  readonly publicTypes = [
    ['NeuralDividerOrientation', "'horizontal' | 'vertical'"],
    ['NeuralDividerAlign', "'start' | 'center' | 'end'"],
    ['NeuralDividerType', "'solid' | 'dashed' | 'dotted'"],
    ['NeuralDividerClasses', '{ root?, before?, content?, after? }'],
  ] as const;
  readonly lineTokens = [
    '--neural-divider-color',
    '--neural-divider-width',
  ] as const;
  readonly contentTokens = [
    '--neural-divider-content-color',
    '--neural-divider-font-family',
    '--neural-divider-font-size',
    '--neural-divider-font-weight',
    '--neural-divider-line-height',
    '--neural-divider-content-gap',
  ] as const;
  readonly layoutTokens = [
    '--neural-divider-margin-block',
    '--neural-divider-margin-inline',
    '--neural-divider-edge-size',
    '--neural-divider-vertical-min-height',
    '--neural-divider-vertical-writing-mode',
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
      `/docs/components/divider${value === 'component' ? '' : `/${value}`}`,
    );
  }

  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}

function resolveView(url: string): DividerDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}

function isView(value: NeuralTabValue | null): value is DividerDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
