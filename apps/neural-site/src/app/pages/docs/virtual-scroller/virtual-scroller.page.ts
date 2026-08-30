import { SiteOnThisPage } from '../../../shared/on-this-page';
import { ViewportScroller } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
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
import {
  NeuralVirtualScroller,
  NeuralVirtualScrollerEmptyTemplate,
  NeuralVirtualScrollerItemTemplate,
  NeuralVirtualScrollerLoadingTemplate,
  type NeuralVirtualScrollerClasses,
  type NeuralVirtualScrollerRangeEvent,
} from '@neural-ng/core/virtual-scroller';
import { SiteAppearanceService } from '../../../core/site-appearance.service';
import { CodeView } from '../../../shared/code-view';
import { DesignTokenList } from '../../../shared/design-token-list';

type DocView = 'component' | 'accessibility' | 'api' | 'tokens';
interface AgentTask {
  readonly id: number;
  readonly name: string;
  readonly team: string;
  readonly state: 'Ready' | 'Running' | 'Queued';
}

@Component({
  selector: 'app-virtual-scroller-page',
  imports: [
    SiteOnThisPage,
    CodeView,
    DesignTokenList,
    NeuralButton,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
    NeuralVirtualScroller,
    NeuralVirtualScrollerEmptyTemplate,
    NeuralVirtualScrollerItemTemplate,
    NeuralVirtualScrollerLoadingTemplate,
  ],
  templateUrl: './virtual-scroller.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VirtualScrollerPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewport = inject(ViewportScroller);
  private readonly destroyRef = inject(DestroyRef);
  readonly appearance = inject(SiteAppearanceService);
  readonly selectedView = signal<DocView>(resolveView(this.router.url));
  readonly selectedViewIndex = computed(() =>
    ['component', 'accessibility', 'api', 'tokens'].indexOf(
      this.selectedView(),
    ),
  );
  readonly scroller = viewChild<NeuralVirtualScroller<AgentTask>>('scroller');
  readonly tasks: readonly AgentTask[] = Array.from(
    { length: 10_000 },
    (_, index) => ({
      id: index + 1,
      name: `Agent task ${String(index + 1).padStart(5, '0')}`,
      team: ['Research', 'Build', 'Review'][index % 3],
      state: ['Ready', 'Running', 'Queued'][index % 3] as AgentTask['state'],
    }),
  );
  readonly cards = this.tasks.slice(0, 30);
  readonly first = signal(0);
  readonly controlledFirst = signal(0);
  readonly loading = signal(false);
  readonly rangeStatus = signal('Visible 1–6 · rendered 1–9');
  readonly lazyStatus = signal('No range requested yet.');
  readonly docTabClasses: NeuralTabsClasses = {
    root: 'min-w-0',
    list: 'relative isolate gap-1 overflow-x-auto rounded-[1.35rem] border border-white/20 bg-[color-mix(in_srgb,var(--site-surface)_76%,transparent)] p-1.5 shadow-[inset_0_1px_rgba(255,255,255,.28),0_12px_35px_rgba(15,23,42,.10)] backdrop-blur-[30px] backdrop-saturate-150',
    tab: 'relative z-10 !flex-1 gap-2 rounded-[1rem] px-3 py-2.5 text-xs font-bold text-[var(--site-text-muted)] transition-[color,transform] duration-300 hover:text-[var(--site-text)] active:scale-[.97] sm:px-4 sm:text-sm',
    activeTab: 'text-[var(--site-text)]',
    panels: 'min-w-0',
    panel:
      'min-w-0 !p-0 animate-[neural-doc-panel-soft-in_200ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none',
  };
  readonly headlessClasses: NeuralVirtualScrollerClasses = {
    root: 'overflow-hidden rounded-2xl border border-cyan-400/25 bg-slate-950 text-slate-100',
    viewport: 'outline-none focus:ring-2 focus:ring-cyan-400',
    items: 'divide-y divide-white/10',
    item: 'flex items-center gap-3 px-4 hover:bg-cyan-400/10',
    loading: 'bg-slate-950/80 text-cyan-200 backdrop-blur-sm',
    empty: 'grid place-items-center text-slate-400',
  };
  readonly trackTask = (task: AgentTask): number => task.id;
  readonly componentLinks = [
    ['Import', 'import'],
    ['10,000 records', 'basic'],
    ['Horizontal', 'horizontal'],
    ['Controlled position', 'controlled'],
    ['Lazy and loading', 'lazy'],
    ['State templates', 'templates'],
    ['Unstyled', 'unstyled'],
  ] as const;
  readonly accessibilityLinks = [
    ['List semantics', 'semantics'],
    ['Keyboard and focus', 'keyboard'],
    ['Position metadata', 'position'],
    ['Reduced motion', 'motion'],
    ['SSR and scope', 'ssr'],
  ] as const;
  readonly apiLinks = [
    ['Component', 'component-api'],
    ['Inputs and model', 'inputs'],
    ['Events', 'events'],
    ['Methods', 'methods'],
    ['Templates and slots', 'templates-api'],
    ['Types', 'types'],
  ] as const;
  readonly tokenLinks = [['Component tokens', 'component-tokens']] as const;
  readonly pageLinks = computed(
    () =>
      ({
        component: this.componentLinks,
        accessibility: this.accessibilityLinks,
        api: this.apiLinks,
        tokens: this.tokenLinks,
      })[this.selectedView()],
  );
  readonly inputs = [
    ['items', 'readonly T[]', '[]', 'Immutable source collection.'],
    ['itemSize', 'number', '48', 'Fixed item size on the scroll axis.'],
    ['viewportSize', 'number', '320', 'Viewport size on the scroll axis.'],
    ['overscan', 'number', '3', 'Extra rendered items around the viewport.'],
    ['orientation', `'vertical' | 'horizontal'`, `'vertical'`, 'Scroll axis.'],
    ['first', 'model<number>', '0', 'First visible item index.'],
    ['lazy', 'boolean', 'false', 'Emits lazyLoad for each new range.'],
    ['loading', 'boolean', 'false', 'Displays the loading layer.'],
    ['emptyMessage', 'string', `'No items found'`, 'Empty-state label.'],
    ['loadingMessage', 'string', `'Loading items'`, 'Loading-state label.'],
    ['ariaLabel', 'string', `'Virtual list'`, 'Region and list name.'],
    ['tabindex', 'number', '0', 'Native viewport tab order.'],
    [
      'trackBy',
      'NeuralVirtualScrollerTrackBy<T> | null',
      'null',
      'Stable item identity.',
    ],
    ['unstyled', 'boolean', 'false', 'Removes NeuralNg visual classes.'],
    ['virtualScrollerClass', 'string', `''`, 'Additive root class.'],
    ['classes', 'NeuralVirtualScrollerClasses', '{}', 'Typed class slots.'],
  ] as const;
  readonly events = [
    [
      'rangeChange',
      'NeuralVirtualScrollerRangeEvent',
      'Rendered or visible window changed.',
    ],
    [
      'lazyLoad',
      'NeuralVirtualScrollerRangeEvent',
      'New lazy range requested.',
    ],
    [
      'scrolled',
      'NeuralVirtualScrollerScrollEvent',
      'Native scroll with offset and range.',
    ],
    ['firstChange', 'number', 'Generated model output.'],
  ] as const;
  readonly methods = [
    ['scrollToIndex(index, behavior?)', 'Scrolls to a clamped item index.'],
    [
      'scrollToOffset(offset, behavior?)',
      'Scrolls to a non-negative pixel offset.',
    ],
  ] as const;
  readonly slots = [
    'root',
    'viewport',
    'content',
    'spacerBefore',
    'items',
    'item',
    'spacerAfter',
    'empty',
    'loading',
  ] as const;
  readonly types = [
    'NeuralVirtualScrollerOrientation',
    'NeuralVirtualScrollerScrollBehavior',
    'NeuralVirtualScrollerRangeEvent',
    'NeuralVirtualScrollerScrollEvent',
    'NeuralVirtualScrollerTrackBy<T>',
    'NeuralVirtualScrollerItemContext<T>',
    'NeuralVirtualScrollerStateContext',
    'NeuralVirtualScrollerClasses',
  ] as const;
  readonly tokens = [
    '--neural-virtual-scroller-color',
    '--neural-virtual-scroller-background',
    '--neural-virtual-scroller-border',
    '--neural-virtual-scroller-radius',
    '--neural-virtual-scroller-shadow',
    '--neural-virtual-scroller-item-padding',
  ] as const;
  readonly importCode = `import {
  NeuralVirtualScroller,
  NeuralVirtualScrollerItemTemplate,
  NeuralVirtualScrollerEmptyTemplate,
  NeuralVirtualScrollerLoadingTemplate,
} from '@neural-ng/core/virtual-scroller';

@Component({
  imports: [
    NeuralVirtualScroller,
    NeuralVirtualScrollerItemTemplate,
    NeuralVirtualScrollerEmptyTemplate,
    NeuralVirtualScrollerLoadingTemplate,
  ],
})`;
  readonly basicCode = `<neural-virtual-scroller #scroller [items]="tasks" [itemSize]="52" [viewportSize]="312" [(first)]="first">\n  <ng-template [neuralVirtualScrollerItem]="tasks" let-task let-index="index">\n    {{ index + 1 }}. {{ task.name }}\n  </ng-template>\n</neural-virtual-scroller>`;
  readonly horizontalCode = `<neural-virtual-scroller
  [items]="cards"
  orientation="horizontal"
  [itemSize]="224"
  [viewportSize]="896"
>
  <ng-template [neuralVirtualScrollerItem]="cards" let-task>
    {{ task.name }}
  </ng-template>
</neural-virtual-scroller>`;
  readonly controlledCode = `<neural-button
  label="Jump to 5,001"
  (clicked)="scroller.scrollToIndex(5000, 'smooth')"
/>
<neural-virtual-scroller
  #scroller
  [items]="tasks"
  [itemSize]="42"
  [viewportSize]="126"
  [(first)]="first"
>
  <ng-template [neuralVirtualScrollerItem]="tasks" let-task>
    {{ task.name }}
  </ng-template>
</neural-virtual-scroller>`;
  readonly lazyCode = `<neural-virtual-scroller
  [items]="tasks"
  [itemSize]="44"
  [viewportSize]="220"
  lazy
  [loading]="loading"
  (lazyLoad)="loadRange($event)"
>
  <ng-template [neuralVirtualScrollerItem]="tasks" let-task>
    {{ task.name }}
  </ng-template>
</neural-virtual-scroller>`;
  readonly templatesCode = `<neural-virtual-scroller [items]="[]" emptyMessage="No queued work">
  <ng-template neuralVirtualScrollerEmpty let-label>
    {{ label }}
  </ng-template>
</neural-virtual-scroller>

<neural-virtual-scroller [items]="tasks" loading>
  <ng-template neuralVirtualScrollerLoading let-label>
    {{ label }}
  </ng-template>
</neural-virtual-scroller>`;
  readonly unstyledCode = `<neural-virtual-scroller
  unstyled
  [classes]="classes"
  [items]="tasks"
  [itemSize]="46"
  [viewportSize]="184"
>
  <ng-template [neuralVirtualScrollerItem]="tasks" let-task>
    {{ task.name }}
  </ng-template>
</neural-virtual-scroller>`;

  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd)
        this.selectedView.set(resolveView(event.urlAfterRedirects));
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }
  selectView(value: NeuralTabValue | null): void {
    if (!isView(value)) return;
    void this.router.navigate(value === 'component' ? ['./'] : [value], {
      relativeTo: this.route,
    });
  }
  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewport.scrollToAnchor(fragment));
  }
  updateRange(range: NeuralVirtualScrollerRangeEvent): void {
    this.rangeStatus.set(
      `Visible ${range.visibleStart + 1}–${range.visibleEnd} · rendered ${range.start + 1}–${range.end}`,
    );
  }
  requestRange(range: NeuralVirtualScrollerRangeEvent): void {
    this.lazyStatus.set(
      `Requested [${range.start}, ${range.end}) · visible [${range.visibleStart}, ${range.visibleEnd})`,
    );
  }
  toggleLoading(): void {
    this.loading.update((value) => !value);
  }
  jumpTo(index: number): void {
    this.scroller()?.scrollToIndex(index, 'smooth');
  }
}

function resolveView(url: string): DocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}
function isView(value: NeuralTabValue | null): value is DocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
