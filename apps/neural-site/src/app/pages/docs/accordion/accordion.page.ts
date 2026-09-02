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
  NeuralAccordion,
  NeuralAccordionContent,
  NeuralAccordionHeader,
  NeuralAccordionPanel,
  type NeuralAccordionClasses,
  type NeuralAccordionModelValue,
  type NeuralAccordionPanelChange,
} from '@neural-ng/core/accordion';
import {
  TabComponent,
  TabListComponent,
  TabPanelComponent,
  TabPanelsComponent,
  TabsComponent,
  type NeuralTabsClasses,
  type NeuralTabValue,
} from '@neural-ng/core/tabs';
import { filter } from 'rxjs';
import { SiteAppearanceService } from '../../../core/site-appearance.service';
import { CodeView } from '../../../shared/code-view';
import { DesignTokenList } from '../../../shared/design-token-list';

type AccordionDocView = 'component' | 'accessibility' | 'api' | 'tokens';
interface Faq {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
  readonly disabled?: boolean;
}

@Component({
  selector: 'app-accordion-page',
  imports: [
    SiteOnThisPage,
    CodeView,
    DesignTokenList,
    NeuralAccordion,
    NeuralAccordionContent,
    NeuralAccordionHeader,
    NeuralAccordionPanel,
    TabComponent,
    TabListComponent,
    TabPanelComponent,
    TabPanelsComponent,
    TabsComponent,
  ],
  templateUrl: './accordion.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccordionPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);

  readonly openFaq = signal<NeuralAccordionModelValue>('signals');
  readonly nonCollapsibleValue = signal<NeuralAccordionModelValue>('required');
  readonly openSections = signal<NeuralAccordionModelValue>(['architecture']);
  readonly headlessValue = signal<NeuralAccordionModelValue>('semantic');
  readonly lastEvent = signal('No panel event yet.');
  readonly faqs: readonly Faq[] = [
    {
      id: 'signals',
      question: 'Why does Accordion use Signals?',
      answer:
        'The controlled value remains deterministic for humans, agents and SSR.',
    },
    {
      id: 'headless',
      question: 'Can every visual class be removed?',
      answer: 'Yes. Unstyled mode preserves behavior and structural hooks.',
    },
    {
      id: 'disabled',
      question: 'Can a panel stay visible but unavailable?',
      answer:
        'Disabled panels remain discoverable and are skipped by keyboard navigation.',
      disabled: true,
    },
  ];
  readonly selectedView = signal<AccordionDocView>(
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
  readonly headlessClasses: NeuralAccordionClasses = {
    root: 'grid gap-2',
    panel:
      'overflow-hidden rounded-xl border border-cyan-400/25 bg-slate-950 text-cyan-50',
    expandedPanel: 'border-cyan-300 shadow-[0_0_0_1px_rgba(103,232,249,.15)]',
    disabledPanel: 'opacity-45',
    header: 'm-0',
    trigger:
      'group flex w-full cursor-pointer items-center justify-between gap-3 bg-transparent px-4 py-3 text-left font-bold text-inherit outline-none focus:ring-4 focus:ring-cyan-400/15 disabled:cursor-not-allowed',
    label: 'min-w-0',
    icon: 'size-2.5 rotate-45 border-b-2 border-r-2 border-cyan-300 transition-transform group-aria-expanded:-rotate-135',
    content: 'grid transition-[grid-template-rows] duration-300',
    contentInner: 'px-4 pb-4 text-sm leading-6 text-cyan-100/75',
  };
  readonly pageLinks: Record<
    AccordionDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Data-driven', 'data-driven'],
      ['Composition', 'composition'],
      ['Multiple', 'multiple'],
      ['Collapsible', 'collapsible'],
      ['Disabled', 'disabled'],
      ['Events', 'events'],
      ['Unstyled', 'unstyled'],
      ['Boundaries', 'boundaries'],
    ],
    accessibility: [
      ['Semantics', 'semantics'],
      ['Keyboard', 'keyboard'],
      ['Focus', 'focus'],
      ['Motion', 'motion'],
    ],
    api: [
      ['Accordion inputs', 'inputs'],
      ['Outputs', 'outputs'],
      ['Panel API', 'panel-api'],
      ['Header and content', 'child-api'],
      ['Class slots', 'class-slots'],
    ],
    tokens: [['Design tokens', 'tokens']],
  };

  readonly importCode = `import {\n  NeuralAccordion,\n  NeuralAccordionPanel,\n  NeuralAccordionHeader,\n  NeuralAccordionContent,\n} from '@neural-ng/core/accordion';\n\n@Component({\n  imports: [\n    NeuralAccordion,\n    NeuralAccordionPanel,\n    NeuralAccordionHeader,\n    NeuralAccordionContent,\n  ],\n})`;
  readonly dataCode = `<neural-accordion\n  [items]="faqs"\n  itemLabel="question"\n  itemValue="id"\n  itemContent="answer"\n  itemDisabled="disabled"\n  [(value)]="openFaq"\n  (panelChange)="panelChanged($event)"\n/>`;
  readonly compositionCode = `<neural-accordion [(value)]="openPanel">\n  <neural-accordion-panel value="profile">\n    <neural-accordion-header>Profile</neural-accordion-header>\n    <neural-accordion-content>\n      <app-profile-settings />\n    </neural-accordion-content>\n  </neural-accordion-panel>\n</neural-accordion>`;
  readonly multipleCode = `<neural-accordion multiple [(value)]="openPanels">\n  <!-- projected panels -->\n</neural-accordion>`;
  readonly collapsibleCode = `<neural-accordion [collapsible]="false" [(value)]="requiredPanel">\n  <!-- one panel always remains open in single mode -->\n</neural-accordion>`;
  readonly disabledCode = `<neural-accordion disabled />\n<neural-accordion-panel value="billing" disabled>...</neural-accordion-panel>`;
  readonly eventsCode = `panelChanged(event: NeuralAccordionPanelChange): void {\n  console.log(event.panelValue, event.expanded);\n  console.log(event.previousValue, event.value, event.source);\n}`;
  readonly unstyledCode = `<neural-accordion unstyled [classes]="accordionClasses">\n  <!-- semantics and keyboard behavior remain -->\n</neural-accordion>`;
  readonly inputs = [
    ['items', 'readonly TItem[]', '[]', 'Data-driven panel source.'],
    ['itemLabel', 'string', "'label'", 'Header text property.'],
    ['itemValue', 'string', "'value'", 'Unique string/number value property.'],
    ['itemContent', 'string', "'content'", 'Plain-text body property.'],
    ['itemDisabled', 'string', "'disabled'", 'Per-item disabled property.'],
    [
      'value',
      'NeuralAccordionModelValue',
      'null',
      'Controlled single or multiple model.',
    ],
    ['multiple', 'boolean', 'false', 'Allows several expanded panels.'],
    [
      'collapsible',
      'boolean',
      'true',
      'Allows the active single panel to close.',
    ],
    ['disabled', 'boolean', 'false', 'Disables the whole group.'],
    ['accordionId', 'string', 'generated', 'Stable ARIA id prefix.'],
    ['unstyled', 'boolean', 'false', 'Removes NeuralNg visual classes.'],
    ['accordionClass', 'string', "''", 'Additive root class.'],
    ['classes', 'NeuralAccordionClasses', '{}', 'Typed visual slot classes.'],
  ] as const;
  readonly outputs = [
    ['valueChange', 'NeuralAccordionModelValue', 'Generated model output.'],
    [
      'panelChange',
      'NeuralAccordionPanelChange',
      'User-only expanded/collapsed event with source and previous state.',
    ],
  ] as const;
  readonly panelInputs = [
    ['value', 'NeuralAccordionValue', 'required', 'Panel identity.'],
    ['disabled', 'boolean', 'false', 'Disables one projected panel.'],
    ['panelClass', 'string', "''", 'Additive projected panel class.'],
  ] as const;
  readonly childInputs = [
    ['NeuralAccordionHeader.headerClass', 'string', "''"],
    ['NeuralAccordionHeader.triggerClass', 'string', "''"],
    ['NeuralAccordionContent.contentClass', 'string', "''"],
  ] as const;
  readonly tokens = [
    '--neural-accordion-gap',
    '--neural-accordion-color',
    '--neural-accordion-font-family',
    '--neural-accordion-panel-background',
    '--neural-accordion-panel-background-expanded',
    '--neural-accordion-panel-border',
    '--neural-accordion-panel-border-color-expanded',
    '--neural-accordion-panel-radius',
    '--neural-accordion-panel-shadow',
    '--neural-accordion-panel-shadow-expanded',
    '--neural-accordion-panel-transition',
    '--neural-accordion-trigger-padding',
    '--neural-accordion-trigger-gap',
    '--neural-accordion-trigger-color',
    '--neural-accordion-trigger-color-hover',
    '--neural-accordion-trigger-color-expanded',
    '--neural-accordion-trigger-background',
    '--neural-accordion-trigger-background-hover',
    '--neural-accordion-trigger-background-expanded',
    '--neural-accordion-trigger-font-size',
    '--neural-accordion-trigger-font-weight',
    '--neural-accordion-trigger-line-height',
    '--neural-accordion-trigger-transition',
    '--neural-accordion-content-padding',
    '--neural-accordion-content-color',
    '--neural-accordion-content-font-size',
    '--neural-accordion-content-line-height',
    '--neural-accordion-content-duration',
    '--neural-accordion-content-easing',
    '--neural-accordion-icon-size',
    '--neural-accordion-icon-color',
    '--neural-accordion-icon-color-expanded',
    '--neural-accordion-icon-duration',
    '--neural-accordion-icon-easing',
    '--neural-accordion-focus-ring',
    '--neural-accordion-focus-ring-offset',
    '--neural-accordion-disabled-opacity',
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
  panelChanged(event: NeuralAccordionPanelChange): void {
    this.lastEvent.set(
      `${event.panelValue} ${event.expanded ? 'expanded' : 'collapsed'} by ${event.source}.`,
    );
  }
  selectView(value: NeuralTabValue | null): void {
    if (!isView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    void this.router.navigateByUrl(
      `/docs/components/accordion${value === 'component' ? '' : `/${value}`}`,
    );
  }
  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}

function resolveView(url: string): AccordionDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}
function isView(value: NeuralTabValue | null): value is AccordionDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
