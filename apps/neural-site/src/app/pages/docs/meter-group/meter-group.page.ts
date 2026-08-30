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
  NeuralMeterGroup,
  type NeuralMeterGroupClasses,
  type NeuralMeterItem,
} from '@neural-ng/core/meter-group';
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

type MeterGroupDocView = 'component' | 'accessibility' | 'api' | 'tokens';

@Component({
  selector: 'app-meter-group-page',
  imports: [
    SiteOnThisPage,
    DesignTokenList,
    CodeView,
    NeuralButton,
    NeuralMeterGroup,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
  ],
  templateUrl: './meter-group.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeterGroupPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);
  readonly selectedView = signal<MeterGroupDocView>(
    resolveView(this.router.url),
  );
  readonly selectedViewIndex = computed(() =>
    ['component', 'accessibility', 'api', 'tokens'].indexOf(
      this.selectedView(),
    ),
  );
  readonly storage = signal<readonly NeuralMeterItem[]>([
    {
      label: 'Applications',
      value: 24,
      iconClass: 'nt nt-components',
      valueText: '24 gigabytes used by applications',
    },
    {
      label: 'Media',
      value: 36,
      iconClass: 'nt nt-photo',
      valueText: '36 gigabytes used by media',
    },
    {
      label: 'System',
      value: 18,
      iconClass: 'nt nt-settings',
      valueText: '18 gigabytes used by the system',
    },
  ]);
  readonly channels: readonly NeuralMeterItem[] = [
    { label: 'Web', value: 42, color: '#2563eb' },
    { label: 'Mobile', value: 28, color: '#7c3aed' },
    { label: 'API', value: 16, color: '#0891b2' },
  ];
  readonly resources: readonly NeuralMeterItem[] = [
    { label: 'CPU', value: 38, iconClass: 'nt nt-cpu', color: '#22d3ee' },
    {
      label: 'Memory',
      value: 31,
      iconClass: 'nt nt-components',
      color: '#818cf8',
    },
    { label: 'Queue', value: 19, iconClass: 'nt nt-inbox', color: '#c084fc' },
  ];
  readonly overflow: readonly NeuralMeterItem[] = [
    { label: 'Reserved', value: 72 },
    { label: 'Requested', value: 48 },
    { label: 'Burst', value: 20 },
  ];
  readonly headlessClasses: NeuralMeterGroupClasses = {
    root: 'gap-4',
    meters: 'h-5 w-full overflow-hidden rounded-full bg-slate-800 p-0.5',
    meter:
      'h-full [background:var(--neural-meter-group-item-color)] first:rounded-l-full last:rounded-r-full',
    labels: 'flex flex-wrap gap-3 text-sm text-slate-200',
    labelItem: 'flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2',
    marker:
      'size-2.5 rounded-full [background:var(--neural-meter-group-item-color)]',
    icon: '[color:var(--neural-meter-group-item-color)]',
    label: 'font-bold',
    value: 'font-mono text-xs text-slate-400',
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
    MeterGroupDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Basic', 'basic'],
      ['Dynamic values', 'dynamic'],
      ['Custom range', 'range'],
      ['Layout', 'layout'],
      ['Labels', 'labels'],
      ['Capacity clipping', 'capacity'],
      ['Unstyled', 'unstyled'],
      ['When to use', 'boundaries'],
    ],
    accessibility: [
      ['Meter semantics', 'meter-semantics'],
      ['Names and values', 'names-values'],
      ['Motion and RTL', 'motion-rtl'],
    ],
    api: [
      ['Inputs', 'inputs'],
      ['Item model', 'item-model'],
      ['Class slots', 'class-slots'],
    ],
    tokens: [['Design tokens', 'design-tokens']],
  };
  readonly importCode = `import { NeuralMeterGroup, type NeuralMeterItem } from '@neural-ng/core/meter-group';\n\n@Component({ imports: [NeuralMeterGroup] })`;
  readonly basicCode = `<neural-meter-group\n  [items]="storage()"\n  ariaLabel="Storage usage"\n  [valueFormatter]="gigabytes"\n/>`;
  readonly dynamicCode = `<neural-meter-group [items]="storage()" ariaLabel="Storage usage" />\n<neural-button label="Add media usage" (clicked)="addMediaUsage()" />`;
  readonly rangeCode = `<neural-meter-group [items]="channels" [min]="0" [max]="200" [valueFormatter]="gigabytes" ariaLabel="Traffic allocation" />`;
  readonly layoutCode = `<neural-meter-group\n  [items]="resources"\n  orientation="vertical"\n  labelPosition="start"\n  labelOrientation="vertical"\n  ariaLabel="Runtime resources"\n/>`;
  readonly labelsCode = `<neural-meter-group [items]="items" labelPosition="start" />\n<neural-meter-group [items]="items" [showValues]="false" />\n<neural-meter-group [items]="items" [showLabels]="false" ariaLabel="Compact allocation" />`;
  readonly overflowCode = `<neural-meter-group [items]="overflow" ariaLabel="Capacity request" />`;
  readonly unstyledCode = `<neural-meter-group unstyled [items]="items" [classes]="meterClasses" ariaLabel="Headless allocation" />`;
  readonly inputs = [
    [
      'items',
      'readonly NeuralMeterItem[]',
      '[]',
      'Immutable measurement definitions.',
    ],
    ['min', 'number', '0', 'Shared lower bound.'],
    [
      'max',
      'number',
      '100',
      'Shared upper bound; invalid bounds normalize safely.',
    ],
    ['orientation', `'horizontal' | 'vertical'`, `'horizontal'`, 'Meter axis.'],
    ['labelPosition', `'start' | 'end'`, `'end'`, 'Logical label placement.'],
    [
      'labelOrientation',
      `'horizontal' | 'vertical'`,
      `'horizontal'`,
      'Legend flow.',
    ],
    ['showLabels', 'boolean', 'true', 'Shows the visible legend.'],
    ['showValues', 'boolean', 'true', 'Shows formatted values in the legend.'],
    [
      'valueFormatter',
      'NeuralMeterValueFormatter | null',
      'null',
      'Formats visible values without changing ARIA values.',
    ],
    ['ariaLabel', 'string | null', 'null', 'Direct accessible group name.'],
    [
      'ariaLabelledBy',
      'string | null',
      'null',
      'References an external group label and takes precedence.',
    ],
    ['unstyled', 'boolean', 'false', 'Removes NeuralNg visual classes.'],
    ['meterGroupClass', 'string', `''`, 'Adds consumer root classes.'],
    ['classes', 'NeuralMeterGroupClasses', '{}', 'Typed class slots.'],
  ] as const;
  readonly itemFields = [
    ['label', 'string', 'Required visible and accessible name.'],
    ['value', 'number', 'Raw value normalized into the shared range.'],
    ['color', 'string', 'Optional CSS color overriding the palette.'],
    [
      'iconClass',
      'string',
      'Optional icon and utility classes for the legend.',
    ],
    ['valueText', 'string', 'Optional human-friendly aria-valuetext.'],
  ] as const;
  readonly classSlots = [
    'root',
    'meters',
    'meter',
    'labels',
    'labelItem',
    'marker',
    'icon',
    'label',
    'value',
  ] as const;
  readonly tokens = [
    '--neural-meter-group-track-background',
    '--neural-meter-group-track-border',
    '--neural-meter-group-radius',
    '--neural-meter-group-shadow',
    '--neural-meter-group-height',
    '--neural-meter-group-vertical-height',
    '--neural-meter-group-vertical-width',
    '--neural-meter-group-color-1',
    '--neural-meter-group-color-2',
    '--neural-meter-group-color-3',
    '--neural-meter-group-color-4',
    '--neural-meter-group-color-5',
    '--neural-meter-group-color-6',
    '--neural-meter-group-label-color',
    '--neural-meter-group-value-color',
    '--neural-meter-group-labels-gap',
    '--neural-meter-group-label-gap',
    '--neural-meter-group-label-item-gap',
    '--neural-meter-group-marker-size',
    '--neural-meter-group-marker-radius',
    '--neural-meter-group-icon-size',
    '--neural-meter-group-font-family',
    '--neural-meter-group-font-size',
    '--neural-meter-group-label-font-weight',
    '--neural-meter-group-value-font-weight',
    '--neural-meter-group-line-height',
    '--neural-meter-group-transition-duration',
    '--neural-meter-group-transition-easing',
  ] as const;
  readonly gigabytes = (value: number): string => `${value} GB`;

  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd)
        this.selectedView.set(resolveView(event.urlAfterRedirects));
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  addMediaUsage(): void {
    this.storage.update((items) =>
      items.map((item) => {
        if (item.label !== 'Media') return item;
        const value = item.value >= 52 ? 28 : item.value + 4;
        return {
          ...item,
          value,
          valueText: `${value} gigabytes used by media`,
        };
      }),
    );
  }

  selectView(value: NeuralTabValue | null): void {
    if (!isView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    void this.router.navigateByUrl(
      `/docs/components/meter-group${value === 'component' ? '' : `/${value}`}`,
    );
  }

  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}

function resolveView(url: string): MeterGroupDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}

function isView(value: NeuralTabValue | null): value is MeterGroupDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
