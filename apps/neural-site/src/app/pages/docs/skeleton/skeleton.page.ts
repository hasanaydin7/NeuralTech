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
  NeuralSkeleton,
  type NeuralSkeletonClasses,
} from '@neural-ng/core/skeleton';
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

type SkeletonDocView = 'component' | 'accessibility' | 'api' | 'tokens';

@Component({
  selector: 'app-skeleton-page',
  imports: [
    SiteOnThisPage,
    CodeView,
    DesignTokenList,
    NeuralSkeleton,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
  ],
  templateUrl: './skeleton.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);
  readonly selectedView = signal<SkeletonDocView>(resolveView(this.router.url));
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
  readonly headlessClasses: NeuralSkeletonClasses = {
    root: 'relative block animate-pulse overflow-hidden rounded-2xl bg-slate-800',
    effect:
      'absolute inset-0 bg-gradient-to-r from-transparent via-cyan-300/20 to-transparent',
  };
  readonly pageLinks: Record<
    SkeletonDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Basic lines', 'basic'],
      ['Shapes and dimensions', 'shapes'],
      ['Motion', 'motion'],
      ['Content composition', 'composition'],
      ['Static placeholders', 'static'],
      ['Unstyled', 'unstyled'],
      ['Boundaries', 'boundaries'],
    ],
    accessibility: [
      ['Decorative semantics', 'decorative'],
      ['Busy regions', 'busy-region'],
      ['Stable announcements', 'announcements'],
      ['Reduced motion', 'reduced-motion'],
      ['SSR', 'ssr'],
    ],
    api: [
      ['Inputs', 'inputs'],
      ['Class slots', 'class-slots'],
      ['Public types', 'types'],
      ['Legacy alias', 'alias'],
    ],
    tokens: [
      ['Surface and shape', 'surface-tokens'],
      ['Pulse', 'pulse-tokens'],
      ['Wave', 'wave-tokens'],
    ],
  };
  readonly importCode = `import { NeuralSkeleton } from '@neural-ng/core/skeleton';\n\n@Component({ imports: [NeuralSkeleton] })`;
  readonly basicCode = `<neural-skeleton />\n<neural-skeleton width="72%" />\n<neural-skeleton width="45%" height="0.75rem" />`;
  readonly shapesCode = `<neural-skeleton shape="circle" size="3rem" />\n<neural-skeleton shape="rounded" width="10rem" height="4rem" />\n<neural-skeleton shape="rectangle" width="10rem" height="4rem" />\n<neural-skeleton borderRadius="1.5rem" height="4rem" />`;
  readonly motionCode = `<neural-skeleton animation="pulse" />\n<neural-skeleton animation="wave" />\n<neural-skeleton animation="none" />`;
  readonly compositionCode = `<article [attr.aria-busy]="loading()" aria-label="Loading profile">\n  <neural-skeleton shape="circle" size="3rem" animation="wave" />\n  <neural-skeleton width="9rem" />\n  <neural-skeleton width="6rem" height="0.75rem" />\n  <neural-skeleton shape="rectangle" height="9rem" animation="wave" />\n</article>`;
  readonly unstyledCode = `<neural-skeleton\n  unstyled\n  width="18rem"\n  height="5rem"\n  skeletonClass="my-skeleton"\n  [classes]="skeletonClasses"\n/>`;
  readonly inputs = [
    [
      'shape',
      "'rectangle' | 'rounded' | 'circle'",
      "'rounded'",
      'Selects geometry; circle resolves both dimensions from size.',
    ],
    [
      'animation',
      "'pulse' | 'wave' | 'none'",
      "'pulse'",
      'Selects the visual loading effect.',
    ],
    [
      'width',
      'string',
      "'100%'",
      'CSS inline size for rectangle and rounded shapes.',
    ],
    [
      'height',
      'string',
      "'1rem'",
      'CSS block size for rectangle and rounded shapes.',
    ],
    [
      'size',
      'string',
      "'2.5rem'",
      'CSS width and height used by circle shape.',
    ],
    [
      'borderRadius',
      'string | null',
      'null',
      'Inline radius override applied after shape styles.',
    ],
    ['unstyled', 'boolean', 'false', 'Removes all NeuralNg visual classes.'],
    ['skeletonClass', 'string', "''", 'Additive consumer classes on the root.'],
    [
      'classes',
      'NeuralSkeletonClasses',
      '{}',
      'Typed root and effect class slots.',
    ],
  ] as const;
  readonly publicTypes = [
    ['NeuralSkeletonShape', "'rectangle' | 'rounded' | 'circle'"],
    ['NeuralSkeletonAnimation', "'pulse' | 'wave' | 'none'"],
    ['NeuralSkeletonClasses', '{ root?: string; effect?: string }'],
  ] as const;
  readonly surfaceTokens = [
    '--neural-skeleton-background',
    '--neural-skeleton-rectangle-radius',
    '--neural-skeleton-rounded-radius',
  ];
  readonly pulseTokens = [
    '--neural-skeleton-pulse-duration',
    '--neural-skeleton-pulse-easing',
    '--neural-skeleton-pulse-min-opacity',
    '--neural-skeleton-pulse-max-opacity',
  ];
  readonly waveTokens = [
    '--neural-skeleton-wave-width',
    '--neural-skeleton-wave-background',
    '--neural-skeleton-wave-duration',
    '--neural-skeleton-wave-easing',
  ];
  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd)
        this.selectedView.set(resolveView(event.urlAfterRedirects));
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }
  selectView(value: NeuralTabValue | null): void {
    if (!isView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    void this.router.navigateByUrl(
      `/docs/components/skeleton${value === 'component' ? '' : `/${value}`}`,
    );
  }
  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}
function resolveView(url: string): SkeletonDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}
function isView(value: NeuralTabValue | null): value is SkeletonDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
