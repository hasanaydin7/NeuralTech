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
import { NeuralInput } from '@neural-ng/core/input';
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
  NeuralToolbar,
  NeuralToolbarCenter,
  NeuralToolbarEnd,
  NeuralToolbarSeparator,
  NeuralToolbarStart,
  type NeuralToolbarClasses,
  type NeuralToolbarFocusChange,
} from '@neural-ng/core/toolbar';
import { SiteAppearanceService } from '../../../core/site-appearance.service';
import { CodeView } from '../../../shared/code-view';
import { DesignTokenList } from '../../../shared/design-token-list';

type ToolbarDocView = 'component' | 'accessibility' | 'api' | 'tokens';

@Component({
  selector: 'app-toolbar-page',
  imports: [
    SiteOnThisPage,
    CodeView,
    DesignTokenList,
    NeuralButton,
    NeuralInput,
    NeuralToolbar,
    NeuralToolbarCenter,
    NeuralToolbarEnd,
    NeuralToolbarSeparator,
    NeuralToolbarStart,
    TabComponent,
    TabListComponent,
    TabPanelComponent,
    TabPanelsComponent,
    TabsComponent,
  ],
  templateUrl: './toolbar.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);

  readonly lastAction = signal('Ready');
  readonly focusedAction = signal('none');
  readonly selectedView = signal<ToolbarDocView>(
    resolveToolbarDocView(this.router.url),
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
  readonly headlessClasses: NeuralToolbarClasses = {
    root: 'w-full gap-3 rounded-2xl border border-cyan-400/30 bg-slate-950 p-3 text-cyan-50 shadow-[0_18px_50px_rgba(8,145,178,.14)]',
    start: 'gap-2',
    center: 'gap-2 text-sm font-semibold text-cyan-200',
    end: 'gap-2',
    separator: 'bg-cyan-400/35',
  };

  readonly pageLinks: Record<
    ToolbarDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Composition', 'composition'],
      ['Responsive wrap', 'responsive'],
      ['Vertical', 'vertical'],
      ['Focus policies', 'focus-policies'],
      ['Unstyled', 'unstyled'],
    ],
    accessibility: [
      ['Role and name', 'role-name'],
      ['Keyboard', 'keyboard'],
      ['Disabled controls', 'disabled-controls'],
      ['Editable controls', 'editable-controls'],
      ['RTL and lifecycle', 'rtl-lifecycle'],
    ],
    api: [
      ['Components', 'components'],
      ['Toolbar inputs', 'inputs'],
      ['Section inputs', 'section-inputs'],
      ['Events', 'events'],
      ['Class slots', 'class-slots'],
      ['Public types', 'public-types'],
    ],
    tokens: [['Design tokens', 'tokens']],
  };

  readonly importCode = `import {
  NeuralToolbar,
  NeuralToolbarStart,
  NeuralToolbarCenter,
  NeuralToolbarEnd,
  NeuralToolbarSeparator,
} from '@neural-ng/core/toolbar';

@Component({
  imports: [
    NeuralToolbar,
    NeuralToolbarStart,
    NeuralToolbarCenter,
    NeuralToolbarEnd,
    NeuralToolbarSeparator,
  ],
})
export class DocumentActions {}`;

  readonly compositionCode = `<neural-toolbar
  ariaLabel="Document actions"
  (focusChanged)="handleFocus($event)"
>
  <neural-toolbar-start>...</neural-toolbar-start>
  <neural-toolbar-separator />
  <neural-toolbar-center>...</neural-toolbar-center>
  <neural-toolbar-end>...</neural-toolbar-end>
</neural-toolbar>`;

  readonly responsiveCode = `<neural-toolbar ariaLabel="Responsive actions" wrap>
  <neural-toolbar-start>...</neural-toolbar-start>
  <neural-toolbar-end>...</neural-toolbar-end>
</neural-toolbar>`;

  readonly verticalCode = `<neural-toolbar
  orientation="vertical"
  ariaLabel="Formatting actions"
>
  <neural-toolbar-start>...</neural-toolbar-start>
  <neural-toolbar-separator />
  <neural-toolbar-end>...</neural-toolbar-end>
</neural-toolbar>`;

  readonly focusPolicyCode = `<!-- Stop at the logical edges instead of looping. -->
<neural-toolbar [loop]="false" ariaLabel="Bounded actions">...</neural-toolbar>

<!-- Let an embedded composite widget own its internal keyboard model. -->
<neural-toolbar [rovingFocus]="false" ariaLabel="Custom focus model">
  ...
</neural-toolbar>`;

  readonly unstyledCode = `<neural-toolbar
  unstyled
  ariaLabel="Agent actions"
  [classes]="toolbarClasses"
>
  <neural-toolbar-start>...</neural-toolbar-start>
  <neural-toolbar-separator />
  <neural-toolbar-center>2 tasks ready</neural-toolbar-center>
  <neural-toolbar-end>...</neural-toolbar-end>
</neural-toolbar>`;

  readonly components = [
    ['NeuralToolbar', 'neural-toolbar', 'Owns semantics and focus movement.'],
    ['NeuralToolbarStart', 'neural-toolbar-start', 'Logical starting actions.'],
    [
      'NeuralToolbarCenter',
      'neural-toolbar-center',
      'Flexible centered content.',
    ],
    ['NeuralToolbarEnd', 'neural-toolbar-end', 'Logical ending actions.'],
    [
      'NeuralToolbarSeparator',
      'neural-toolbar-separator',
      'Orientation-aware semantic separator.',
    ],
  ] as const;

  readonly inputs = [
    [
      'orientation',
      'NeuralToolbarOrientation',
      `'horizontal'`,
      'Controls layout, separator direction and arrow keys.',
    ],
    ['wrap', 'boolean', 'true', 'Allows horizontal content to wrap.'],
    ['loop', 'boolean', 'true', 'Wraps roving focus between logical edges.'],
    [
      'rovingFocus',
      'boolean',
      'true',
      'Maintains one tab stop and handles directional navigation.',
    ],
    [
      'ariaLabel',
      'string | null',
      `'Toolbar'`,
      'Accessible name when ariaLabelledby is absent.',
    ],
    [
      'ariaLabelledby',
      'string | null',
      'null',
      'References visible naming content and takes precedence.',
    ],
    [
      'toolbarClass',
      'string',
      `''`,
      'Adds classes to the internal role=toolbar element.',
    ],
    ['classes', 'NeuralToolbarClasses', '{}', 'Typed classes for every slot.'],
    ['unstyled', 'boolean', 'false', 'Removes NeuralNg visual classes.'],
  ] as const;

  readonly sectionInputs = [
    [
      'sectionClass',
      'string',
      `''`,
      'Additional class for start, center or end section roots.',
    ],
    [
      'separatorClass',
      'string',
      `''`,
      'Additional class for the separator element.',
    ],
  ] as const;

  readonly classSlots = [
    ['root', 'Toolbar role and visual surface.'],
    ['start', 'Logical starting section.'],
    ['center', 'Flexible centered section.'],
    ['end', 'Logical ending section.'],
    ['separator', 'Semantic separator line.'],
  ] as const;

  readonly tokens = [
    '--neural-toolbar-gap',
    '--neural-toolbar-padding',
    '--neural-toolbar-color',
    '--neural-toolbar-background',
    '--neural-toolbar-border',
    '--neural-toolbar-radius',
    '--neural-toolbar-shadow',
    '--neural-toolbar-backdrop-filter',
    '--neural-toolbar-section-gap',
    '--neural-toolbar-separator-color',
    '--neural-toolbar-separator-length',
  ] as const;

  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.selectedView.set(resolveToolbarDocView(event.urlAfterRedirects));
      }
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  run(action: string): void {
    this.lastAction.set(action);
  }

  handleFocus(event: NeuralToolbarFocusChange): void {
    this.focusedAction.set(event.element.textContent?.trim() || 'control');
  }

  selectView(value: NeuralTabValue | null): void {
    if (!isToolbarDocView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    const suffix = value === 'component' ? '' : `/${value}`;
    void this.router.navigateByUrl(`/docs/components/toolbar${suffix}`);
  }

  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}

function resolveToolbarDocView(url: string): ToolbarDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}

function isToolbarDocView(
  value: NeuralTabValue | null,
): value is ToolbarDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
