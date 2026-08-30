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
  NeuralCard,
  NeuralCardBody,
  NeuralCardFooter,
  NeuralCardHeader,
  type NeuralCardClasses,
} from '@neural-ng/core/card';
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

type CardDocView = 'component' | 'accessibility' | 'api' | 'tokens';

@Component({
  selector: 'app-card-page',
  imports: [
    SiteOnThisPage,
    DesignTokenList,
    CodeView,
    NeuralButton,
    NeuralCard,
    NeuralCardBody,
    NeuralCardFooter,
    NeuralCardHeader,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
  ],
  templateUrl: './card.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);
  readonly selectedView = signal<CardDocView>(resolveView(this.router.url));
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
  readonly headlessClasses: NeuralCardClasses = {
    root: 'w-full overflow-hidden rounded-[1.75rem] border border-violet-300/30 bg-slate-950 text-violet-50 shadow-[0_24px_70px_rgba(139,92,246,.18)]',
    header: 'items-center border-b border-violet-300/15 p-5',
    body: 'p-5 text-violet-100/75',
    footer: 'items-center justify-end gap-3 border-t border-violet-300/15 p-5',
  };
  readonly pageLinks: Record<
    CardDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Basic composition', 'basic'],
      ['Optional sections', 'optional'],
      ['Semantic roles', 'roles'],
      ['Rich content', 'rich'],
      ['Card grids', 'grids'],
      ['Class ownership', 'classes'],
      ['Unstyled', 'unstyled'],
      ['Boundaries', 'boundaries'],
    ],
    accessibility: [
      ['Native structure', 'native-structure'],
      ['Headings', 'headings'],
      ['Landmarks', 'landmarks'],
      ['Interaction', 'interaction'],
      ['Presentation role', 'presentation'],
    ],
    api: [
      ['Card inputs', 'card-inputs'],
      ['Section inputs', 'section-inputs'],
      ['Class slots', 'class-slots'],
      ['Types', 'types'],
    ],
    tokens: [
      ['Root tokens', 'root-tokens'],
      ['Header tokens', 'header-tokens'],
      ['Body tokens', 'body-tokens'],
      ['Footer tokens', 'footer-tokens'],
    ],
  };
  readonly importCode = `import { NeuralCard, NeuralCardHeader, NeuralCardBody,
  NeuralCardFooter } from '@neural-ng/core/card';

@Component({
  imports: [NeuralCard, NeuralCardHeader, NeuralCardBody, NeuralCardFooter],
})`;
  readonly basicCode = `<neural-card ariaLabelledby="workspace-title">
  <neural-card-header><h2 id="workspace-title">Agent workspace</h2></neural-card-header>
  <neural-card-body>Build and monitor your autonomous workflow.</neural-card-body>
  <neural-card-footer><neural-button label="Open workspace" severity="primary" /></neural-card-footer>
</neural-card>`;
  readonly optionalCode = `<neural-card ariaLabel="Usage summary" role="region">
  <neural-card-body><strong>78%</strong><span>Monthly capacity</span></neural-card-body>
</neural-card>`;
  readonly rolesCode = `<neural-card>Ordinary article</neural-card>
<neural-card role="region" ariaLabelledby="critical-title">...</neural-card>
<neural-card role="group" ariaLabel="Related metrics">...</neural-card>
<neural-card role="presentation">...</neural-card>`;
  readonly richCode = `<neural-card ariaLabelledby="agent-title">
  <div class="media">...</div>
  <neural-card-header><h2 id="agent-title">Research agent</h2></neural-card-header>
  <neural-card-body>Rich projected content remains application-owned.</neural-card-body>
</neural-card>`;
  readonly gridCode = `<div class="grid gap-4 md:grid-cols-3">
  @for (metric of metrics; track metric.label) {
    <neural-card><neural-card-body>...</neural-card-body></neural-card>
  }
</div>`;
  readonly classesCode = `<neural-card cardClass="max-w-lg" [classes]="{ body: 'leading-7' }">
  <neural-card-header headerClass="items-center">...</neural-card-header>
  <neural-card-body bodyClass="text-sm">...</neural-card-body>
  <neural-card-footer footerClass="justify-end">...</neural-card-footer>
</neural-card>`;
  readonly unstyledCode = `<neural-card unstyled [classes]="classes">
  <neural-card-header>Consumer header</neural-card-header>
  <neural-card-body>Consumer body</neural-card-body>
  <neural-card-footer>Consumer footer</neural-card-footer>
</neural-card>`;
  readonly cardInputs = [
    [
      'role',
      'article | region | group | presentation | null',
      'null',
      'Optional explicit role on the native article.',
    ],
    ['ariaLabel', 'string | null', 'null', 'Direct accessible name.'],
    [
      'ariaLabelledby',
      'string | null',
      'null',
      'Heading ID reference for the accessible name.',
    ],
    ['unstyled', 'boolean', 'false', 'Removes NeuralNg visual classes.'],
    ['cardClass', 'string', "''", 'Additive class on the native article.'],
    ['classes', 'NeuralCardClasses', '{}', 'Typed additive section slots.'],
  ] as const;
  readonly sectionInputs = [
    ['headerClass', 'string', "''", 'Additive native header class.'],
    ['bodyClass', 'string', "''", 'Additive body wrapper class.'],
    ['footerClass', 'string', "''", 'Additive native footer class.'],
  ] as const;
  readonly classSlots = ['root', 'header', 'body', 'footer'] as const;
  readonly publicTypes = [
    ['NeuralCardRole', 'article | region | group | presentation'],
    ['NeuralCardClasses', '{ root?, header?, body?, footer? }'],
  ] as const;
  readonly rootTokens = [
    '--neural-card-width',
    '--neural-card-color',
    '--neural-card-background',
    '--neural-card-border',
    '--neural-card-radius',
    '--neural-card-shadow',
    '--neural-card-backdrop-filter',
    '--neural-card-font-family',
  ] as const;
  readonly headerTokens = [
    '--neural-card-header-align',
    '--neural-card-header-justify',
    '--neural-card-header-gap',
    '--neural-card-header-padding',
    '--neural-card-header-border',
  ] as const;
  readonly bodyTokens = [
    '--neural-card-body-padding',
    '--neural-card-body-color',
  ] as const;
  readonly footerTokens = [
    '--neural-card-footer-align',
    '--neural-card-footer-justify',
    '--neural-card-footer-gap',
    '--neural-card-footer-padding',
    '--neural-card-footer-border',
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
      `/docs/components/card${value === 'component' ? '' : `/${value}`}`,
    );
  }
  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}
function resolveView(url: string): CardDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}
function isView(value: NeuralTabValue | null): value is CardDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
