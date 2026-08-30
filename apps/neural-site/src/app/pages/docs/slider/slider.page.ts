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
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { NeuralField } from '@neural-ng/core/field';
import {
  NeuralSlider,
  type NeuralSliderClasses,
  type NeuralSliderEvent,
  type NeuralSliderRangeValue,
} from '@neural-ng/core/slider';
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

type SliderDocView = 'component' | 'accessibility' | 'api' | 'tokens';
@Component({
  selector: 'app-slider-page',
  imports: [
    SiteOnThisPage,
    CodeView,
    DesignTokenList,
    FormField,
    FormsModule,
    NeuralField,
    NeuralSlider,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
    ReactiveFormsModule,
  ],
  templateUrl: './slider.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SliderPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);
  readonly selectedView = signal<SliderDocView>(resolveView(this.router.url));
  readonly selectedViewIndex = computed(() =>
    ['component', 'accessibility', 'api', 'tokens'].indexOf(
      this.selectedView(),
    ),
  );
  readonly volume = signal(45);
  readonly temperature = signal(22);
  readonly vertical = signal(63);
  readonly budget = signal<NeuralSliderRangeValue>([1200, 3600]);
  readonly readonlyValue = signal(36);
  readonly headless = signal(68);
  readonly eventStatus = signal('No committed interaction yet.');
  readonly formsModel = signal({ level: 35 });
  readonly signalForm = form(this.formsModel);
  readonly reactiveLevel = new FormControl(55, { nonNullable: true });
  templateLevel = 70;
  readonly docTabClasses: NeuralTabsClasses = {
    root: 'min-w-0',
    list: 'relative isolate gap-1 overflow-x-auto rounded-[1.35rem] border border-white/20 bg-[color-mix(in_srgb,var(--site-surface)_76%,transparent)] p-1.5 shadow-[inset_0_1px_rgba(255,255,255,.28),0_12px_35px_rgba(15,23,42,.10)] backdrop-blur-[30px] backdrop-saturate-150',
    tab: 'relative z-10 !flex-1 gap-2 rounded-[1rem] px-3 py-2.5 text-xs font-bold text-[var(--site-text-muted)] transition-[color,transform] duration-300 hover:text-[var(--site-text)] active:scale-[.97] sm:px-4 sm:text-sm',
    activeTab: 'text-[var(--site-text)]',
    panels: 'min-w-0',
    panel:
      'min-w-0 !p-0 animate-[neural-doc-panel-soft-in_200ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none',
  };
  readonly headlessClasses: NeuralSliderClasses = {
    root: 'flex w-full items-center gap-4 rounded-2xl bg-slate-950 p-5 text-cyan-200',
    input:
      'h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-cyan-400',
    value: 'min-w-10 font-mono text-sm font-bold',
    range: 'relative h-6 w-full',
    track:
      'absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-slate-700',
    fill: 'absolute inset-y-0 rounded-full bg-cyan-400',
  };
  readonly pageLinks: Record<
    SliderDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Single value', 'single'],
      ['Bounds and steps', 'bounds'],
      ['Range', 'range'],
      ['Orientation', 'orientation'],
      ['Forms', 'forms'],
      ['States and Field', 'states'],
      ['Events', 'events-demo'],
      ['RTL', 'rtl'],
      ['Unstyled', 'unstyled'],
    ],
    accessibility: [
      ['Native semantics', 'native'],
      ['Keyboard', 'keyboard'],
      ['Range names', 'range-names'],
      ['Value text', 'value-text'],
      ['Readonly and disabled', 'readonly-disabled'],
      ['Field state', 'field-state'],
    ],
    api: [
      ['Inputs and model', 'inputs'],
      ['Outputs', 'outputs'],
      ['Methods', 'methods'],
      ['Class slots', 'class-slots'],
      ['Public types', 'types'],
      ['Legacy alias', 'alias'],
    ],
    tokens: [
      ['Layout', 'layout-tokens'],
      ['Track and fill', 'track-tokens'],
      ['Thumb and state', 'thumb-tokens'],
      ['Value', 'value-tokens'],
    ],
  };
  readonly importCode = `import { NeuralSlider } from '@neural-ng/core/slider';\n\n@Component({ imports: [NeuralSlider] })`;
  readonly singleCode = `<neural-slider\n  ariaLabel="Volume"\n  [(value)]="volume"\n  showValue\n  fluid\n/>`;
  readonly boundsCode = `<neural-slider [(value)]="temperature" [min]="16" [max]="30" [step]="0.5" valueLabel="22 °C" showValue />`;
  readonly rangeCode = `<neural-slider\n  range\n  [(value)]="budget"\n  [min]="0"\n  [max]="5000"\n  [step]="100"\n  rangeStartAriaLabel="Minimum budget"\n  rangeEndAriaLabel="Maximum budget"\n  showValue\n  fluid\n/>`;
  readonly orientationCode = `<neural-slider orientation="horizontal" [(value)]="volume" />\n<neural-slider orientation="vertical" [(value)]="level" showValue />`;
  readonly formsCode = `<!-- Signal Forms -->\n<neural-slider [formField]="signalForm.level" />\n<!-- Reactive Forms -->\n<neural-slider [formControl]="levelControl" />\n<!-- Template-driven Forms -->\n<neural-slider name="level" [(ngModel)]="level" />`;
  readonly statesCode = `<neural-slider [value]="35" disabled />\n<neural-slider [value]="35" readonly />\n<neural-field controlId="invalid-threshold" label="Invalid threshold" invalid fluid>\n  <neural-slider [value]="80" />\n</neural-field>`;
  readonly unstyledCode = `<neural-slider unstyled fluid showValue [(value)]="value" [classes]="sliderClasses" />`;
  readonly inputs = [
    [
      'value',
      'model<number | [number, number]>',
      '0',
      'Single value or ordered range tuple.',
    ],
    ['range', 'boolean', 'false', 'Renders two native range thumbs.'],
    ['min / max', 'number', '0 / 100', 'Normalized inclusive numeric bounds.'],
    ['step', 'number', '1', 'Positive interaction increment.'],
    [
      'orientation',
      "'horizontal' | 'vertical'",
      "'horizontal'",
      'Visual and ARIA orientation.',
    ],
    [
      'showValue',
      'boolean',
      'false',
      'Displays the normalized value beside the control.',
    ],
    ['valueLabel', 'string', "''", 'Overrides visible output text.'],
    [
      'rangeStartAriaLabel / rangeEndAriaLabel',
      'string',
      "''",
      'Distinct accessible names for range thumbs.',
    ],
    [
      'rangeStartAriaValueText / rangeEndAriaValueText',
      'string',
      "''",
      'Human-readable range thumb values.',
    ],
    [
      'disabled / readonly / invalid',
      'boolean',
      'false',
      'Interaction and validation states.',
    ],
    ['touched / dirty', 'boolean', 'false', 'Forms state parity inputs.'],
    ['name / sliderId', 'string', "''", 'Native name and deterministic id.'],
    [
      'ariaLabel / ariaLabelledBy / ariaValueText',
      'string',
      "''",
      'Single-thumb accessible naming and value description.',
    ],
    ['fluid', 'boolean', 'false', 'Fills available inline size.'],
    ['unstyled', 'boolean', 'false', 'Removes NeuralNg visual classes.'],
    [
      'sliderClass / inputClass',
      'string',
      "''",
      'Additive root and native input classes.',
    ],
    [
      'classes',
      'NeuralSliderClasses',
      '{}',
      'Typed root, input, output and range-layer slots.',
    ],
  ] as const;
  readonly outputs = [
    [
      'valueChange',
      'NeuralSliderValue',
      'Generated model output for every value update.',
    ],
    ['slideStart', 'NeuralSliderEvent', 'Pointer interaction begins.'],
    ['slideEnd', 'NeuralSliderEvent', 'Pointer interaction ends.'],
    [
      'valueCommit',
      'NeuralSliderEvent',
      'Native change or range-track selection commits.',
    ],
    ['touch', 'void', 'A native thumb loses focus.'],
  ] as const;
  readonly methods = [
    ['focus(options?)', 'void', 'Focuses the first native thumb.'],
    ['reset()', 'void', 'Restores min, or [min,max] in range mode.'],
  ] as const;
  readonly classSlots = [
    ['root', 'Complete control and optional output layout.'],
    ['input', 'Single input or both native range inputs.'],
    ['value', 'Visible value output.'],
    ['range', 'Two-thumb positioning surface.'],
    ['track', 'Range track.'],
    ['fill', 'Selected interval between thumbs.'],
  ] as const;
  readonly publicTypes = [
    ['NeuralSliderValue', 'number | NeuralSliderRangeValue'],
    ['NeuralSliderRangeValue', '[number, number]'],
    ['NeuralSliderThumb', "'start' | 'end'"],
    ['NeuralSliderOrientation', "'horizontal' | 'vertical'"],
    ['NeuralSliderEvent', '{ value; originalEvent; thumb? }'],
    [
      'NeuralSliderClasses',
      'Typed root, input, value, range, track and fill slots.',
    ],
  ] as const;
  readonly layoutTokens = [
    '--neural-slider-width',
    '--neural-slider-gap',
    '--neural-slider-vertical-height',
    '--neural-slider-font',
  ];
  readonly trackTokens = [
    '--neural-slider-track-size',
    '--neural-slider-track-radius',
    '--neural-slider-track-background',
    '--neural-slider-fill-background',
    '--neural-slider-fill-background-invalid',
  ];
  readonly thumbTokens = [
    '--neural-slider-thumb-size',
    '--neural-slider-thumb-background',
    '--neural-slider-thumb-background-hover',
    '--neural-slider-thumb-background-invalid',
    '--neural-slider-thumb-border',
    '--neural-slider-thumb-radius',
    '--neural-slider-thumb-shadow',
    '--neural-slider-focus-ring',
    '--neural-slider-focus-ring-offset',
    '--neural-slider-disabled-opacity',
  ];
  readonly valueTokens = [
    '--neural-slider-color',
    '--neural-slider-value-color',
    '--neural-slider-value-font-size',
  ];
  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd)
        this.selectedView.set(resolveView(event.urlAfterRedirects));
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }
  committed(event: NeuralSliderEvent): void {
    this.eventStatus.set(
      `${Array.isArray(event.value) ? event.value.join('–') : event.value}${event.thumb ? ` · ${event.thumb} thumb` : ''}`,
    );
  }
  selectView(value: NeuralTabValue | null): void {
    if (!isView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    void this.router.navigateByUrl(
      `/docs/components/slider${value === 'component' ? '' : `/${value}`}`,
    );
  }
  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}
function resolveView(url: string): SliderDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}
function isView(value: NeuralTabValue | null): value is SliderDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
