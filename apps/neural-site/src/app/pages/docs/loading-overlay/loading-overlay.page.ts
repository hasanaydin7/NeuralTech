import { SiteOnThisPage } from '../../../shared/on-this-page';
import { ViewportScroller } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
  type WritableSignal,
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { NeuralButton } from '@neural-ng/core/button';
import {
  NeuralLoadingIndicator,
  NeuralLoadingOverlay,
  type NeuralLoadingOverlayClasses,
} from '@neural-ng/core/loading-overlay';
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

type LoadingOverlayDocView = 'component' | 'accessibility' | 'api' | 'tokens';

@Component({
  selector: 'app-loading-overlay-page',
  imports: [
    SiteOnThisPage,
    DesignTokenList,
    CodeView,
    NeuralButton,
    NeuralLoadingIndicator,
    NeuralLoadingOverlay,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
  ],
  templateUrl: './loading-overlay.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingOverlayPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();
  readonly appearance = inject(SiteAppearanceService);
  readonly containerLoading = signal(false);
  readonly viewportLoading = signal(false);
  readonly customLoading = signal(false);
  readonly backgroundLoading = signal(false);
  readonly headlessLoading = signal(true);
  readonly lastEvent = signal('Waiting for a rendered lifecycle event.');
  readonly selectedView = signal<LoadingOverlayDocView>(
    resolveView(this.router.url),
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
  readonly pageLinks: Record<
    LoadingOverlayDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Container', 'container'],
      ['Viewport', 'viewport'],
      ['Custom indicator', 'custom'],
      ['Non-blocking', 'non-blocking'],
      ['Timing', 'timing'],
      ['Unstyled', 'unstyled'],
    ],
    accessibility: [
      ['Busy and inert', 'busy'],
      ['Focus and scroll', 'focus'],
      ['Announcements', 'announcements'],
      ['Dismissal', 'dismissal'],
    ],
    api: [
      ['Inputs', 'inputs'],
      ['Events', 'events'],
      ['Template', 'template'],
      ['Class slots', 'class-slots'],
      ['Scope contract', 'scope-contract'],
    ],
    tokens: [['Design tokens', 'design-tokens']],
  };
  readonly headlessClasses: NeuralLoadingOverlayClasses = {
    root: 'overflow-hidden rounded-2xl',
    content: 'min-h-48 bg-slate-950 p-6 text-slate-200',
    backdrop: 'absolute inset-0 bg-cyan-950/75 backdrop-blur-sm',
    panel:
      'relative z-10 flex flex-col items-center gap-3 rounded-2xl border border-cyan-400/30 bg-slate-950/90 px-7 py-5 text-cyan-100 shadow-2xl',
    indicator:
      'grid size-10 place-items-center rounded-full border-2 border-cyan-300 border-r-transparent animate-spin',
    label: 'font-mono text-sm font-bold text-cyan-200',
  };
  readonly importCode = `import {\n  NeuralLoadingIndicator,\n  NeuralLoadingOverlay,\n} from '@neural-ng/core/loading-overlay';\n\n@Component({ imports: [NeuralLoadingOverlay] })`;
  readonly containerCode = `<neural-loading-overlay [active]="loading()" label="Loading products">\n  <product-list />\n</neural-loading-overlay>`;
  readonly viewportCode = `<neural-loading-overlay [active]="saving()" scope="viewport" label="Saving changes" lockScroll />`;
  readonly customCode = `<neural-loading-overlay [active]="thinking()" label="AI is thinking">\n  <workspace-view />\n  <ng-template neuralLoadingIndicator><span class="agent-loader"></span></ng-template>\n</neural-loading-overlay>`;
  readonly backgroundCode = `<neural-loading-overlay [active]="refreshing()" [blockInteraction]="false" label="Refreshing preview">\n  <live-preview />\n</neural-loading-overlay>`;
  readonly timingCode = `<neural-loading-overlay [active]="loading()" [delay]="150" [minimumDuration]="300" (shown)="onShown()" (hidden)="onHidden()" />`;
  readonly unstyledCode = `<neural-loading-overlay unstyled [active]="loading()" [delay]="0" [classes]="loaderClasses" label="Compiling NeuralNg">\n  <build-surface />\n  <ng-template neuralLoadingIndicator><span class="custom-pulse"></span></ng-template>\n</neural-loading-overlay>`;
  readonly inputs = [
    ['active', 'boolean', 'false', 'Immediate application busy state.'],
    ['scope', `'container' | 'viewport'`, `'container'`, 'Blocking boundary.'],
    [
      'label',
      'string | null',
      'null',
      'Task label; localized Loading fallback.',
    ],
    ['showLabel', 'boolean', 'true', 'Shows the task label visually.'],
    ['backdrop', 'boolean', 'true', 'Renders the visual backdrop.'],
    [
      'blockInteraction',
      'boolean',
      'true',
      'Makes content inert and captures interaction.',
    ],
    [
      'lockScroll',
      'boolean',
      'true',
      'Reference-counted viewport scroll lock.',
    ],
    ['delay', 'number', '150', 'Defers visual rendering to avoid flashes.'],
    ['minimumDuration', 'number', '300', 'Minimum visible time once rendered.'],
    [
      'spinnerSize',
      'ProgressSpinner size',
      `'large'`,
      'Built-in indicator size.',
    ],
    [
      'spinnerSeverity',
      'ProgressSpinner severity',
      `'info'`,
      'Built-in indicator color.',
    ],
    ['unstyled', 'boolean', 'false', 'Removes NeuralNg visual classes.'],
    ['overlayClass', 'string', `''`, 'Consumer root class.'],
    ['classes', 'NeuralLoadingOverlayClasses', '{}', 'Typed visual slots.'],
  ] as const;
  readonly events = [
    ['shown', 'void', 'The delayed visual layer rendered.'],
    ['hidden', 'void', 'The minimum-duration layer was removed.'],
  ] as const;
  readonly tokens = [
    '--neural-loading-overlay-z-index',
    '--neural-loading-overlay-viewport-z-index',
    '--neural-loading-overlay-backdrop',
    '--neural-loading-overlay-backdrop-filter',
    '--neural-loading-overlay-panel-gap',
    '--neural-loading-overlay-panel-min-width',
    '--neural-loading-overlay-panel-padding',
    '--neural-loading-overlay-panel-color',
    '--neural-loading-overlay-panel-background',
    '--neural-loading-overlay-panel-border',
    '--neural-loading-overlay-panel-radius',
    '--neural-loading-overlay-panel-shadow',
    '--neural-loading-overlay-label-color',
    '--neural-loading-overlay-label-font-size',
    '--neural-loading-overlay-enter-duration',
    '--neural-loading-overlay-enter-distance',
    '--neural-loading-overlay-enter-scale',
  ] as const;
  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd)
        this.selectedView.set(resolveView(event.urlAfterRedirects));
    });
    this.destroyRef.onDestroy(() => {
      subscription.unsubscribe();
      for (const timer of this.timers) clearTimeout(timer);
    });
  }
  run(target: WritableSignal<boolean>, duration = 1400): void {
    target.set(true);
    const timer = setTimeout(() => {
      target.set(false);
      this.timers.delete(timer);
    }, duration);
    this.timers.add(timer);
  }
  toggleHeadless(): void {
    this.headlessLoading.update((value) => !value);
  }
  selectView(value: NeuralTabValue | null): void {
    if (!isView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    void this.router.navigateByUrl(
      `/docs/components/loading-overlay${value === 'component' ? '' : `/${value}`}`,
    );
  }
  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}
function resolveView(url: string): LoadingOverlayDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}
function isView(value: NeuralTabValue | null): value is LoadingOverlayDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
