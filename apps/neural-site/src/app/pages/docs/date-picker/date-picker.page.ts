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
import {
  NeuralDatePicker,
  NeuralDatePickerDayTemplate,
  NeuralDatePickerTriggerIconTemplate,
  toNeuralIsoDate,
  type NeuralDateFilter,
  type NeuralDateParts,
  type NeuralDatePickerChange,
  type NeuralDatePickerClasses,
  type NeuralDateRange,
  type NeuralDateTimeParts,
  type NeuralTimeParts,
} from '@neural-ng/core/date-picker';
import { neuralEn } from '@neural-ng/core/locales/en';
import { neuralTr } from '@neural-ng/core/locales/tr';
import { NeuralSelect } from '@neural-ng/core/select';
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

type DatePickerDocView = 'component' | 'accessibility' | 'api' | 'tokens';

@Component({
  selector: 'app-date-picker-page',
  imports: [
    SiteOnThisPage,
    DesignTokenList,
    CodeView,
    FormField,
    FormsModule,
    NeuralDatePicker,
    NeuralDatePickerDayTemplate,
    NeuralDatePickerTriggerIconTemplate,
    NeuralSelect,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
    ReactiveFormsModule,
  ],
  templateUrl: './date-picker.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatePickerPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);
  readonly selectedView = signal<DatePickerDocView>(
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
    DatePickerDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Basic', 'basic'],
      ['Calendar views', 'calendar-views'],
      ['Selection', 'selection'],
      ['Constraints', 'constraints'],
      ['Footer actions', 'footer-actions'],
      ['Time and datetime', 'time'],
      ['Localization', 'localization'],
      ['Angular Forms', 'forms'],
      ['Templates', 'templates'],
      ['Events', 'events'],
      ['Unstyled', 'unstyled'],
    ],
    accessibility: [
      ['Semantic model', 'semantic-model'],
      ['Keyboard', 'keyboard'],
      ['Focus and overlay', 'focus-overlay'],
      ['Locale and RTL', 'locale-rtl'],
    ],
    api: [
      ['Models', 'models'],
      ['Inputs', 'inputs'],
      ['Outputs', 'outputs'],
      ['Templates', 'template-api'],
      ['Utilities', 'utilities'],
      ['Forms', 'forms-api'],
    ],
    tokens: [
      ['Design tokens', 'tokens'],
      ['Class slots', 'class-slots'],
      ['Cascade', 'cascade'],
    ],
  };

  readonly today: NeuralDateParts = { year: 2026, month: 8, day: 9 };
  readonly deliveryDate = signal<NeuralDateParts | null>({
    year: 2026,
    month: 8,
    day: 18,
  });
  readonly calendarDate = signal<NeuralDateParts | null>(this.today);
  readonly monthValue = signal<NeuralDateParts | null>(this.today);
  readonly yearValue = signal<NeuralDateParts | null>(this.today);
  readonly rangeValue = signal<NeuralDateRange | null>(null);
  readonly multipleValue = signal<readonly NeuralDateParts[] | null>([
    { year: 2026, month: 8, day: 11 },
    { year: 2026, month: 8, day: 18 },
  ]);
  readonly constrainedDate = signal<NeuralDateParts | null>(null);
  readonly approvalRange = signal<NeuralDateRange | null>(null);
  readonly timeValue = signal<NeuralTimeParts | null>({
    hour: 14,
    minute: 30,
    second: 0,
    millisecond: 0,
  });
  readonly dateTimeValue = signal<NeuralDateTimeParts | null>({
    date: { year: 2026, month: 8, day: 18 },
    time: { hour: 10, minute: 30, second: 0, millisecond: 0 },
  });
  readonly englishDate = signal<NeuralDateParts | null>(this.today);
  readonly turkishDate = signal<NeuralDateParts | null>(this.today);
  readonly localizedDate = signal<NeuralDateParts | null>(this.today);
  readonly localeChoice = signal<'en' | 'tr'>('en');
  readonly weekStartChoice = signal<'locale' | 'sunday' | 'monday'>('locale');
  readonly localeOptions = [
    { label: 'English (United States)', value: 'en' as const },
    { label: 'Türkçe (Türkiye)', value: 'tr' as const },
  ];
  readonly weekStartOptions = [
    { label: 'Locale default', value: 'locale' as const },
    { label: 'Sunday', value: 'sunday' as const },
    { label: 'Monday', value: 'monday' as const },
  ];
  readonly activeLocale = computed(() =>
    this.localeChoice() === 'tr' ? neuralTr : neuralEn,
  );
  readonly firstDayOverride = computed<0 | 1 | null>(() => {
    const choice = this.weekStartChoice();
    return choice === 'locale' ? null : choice === 'monday' ? 1 : 0;
  });
  readonly effectiveFirstDayLabel = computed(() => {
    const day = this.firstDayOverride() ?? this.activeLocale().firstDayOfWeek;
    return day === 1 ? 'Monday' : day === 0 ? 'Sunday' : `day ${day}`;
  });
  readonly templatedDate = signal<NeuralDateParts | null>(this.today);
  readonly eventDate = signal<NeuralDateParts | null>(null);
  readonly headlessDate = signal<NeuralDateParts | null>(this.today);
  readonly minDate: NeuralDateParts = { year: 2026, month: 8, day: 5 };
  readonly maxDate: NeuralDateParts = { year: 2026, month: 9, day: 15 };
  readonly blockedDates: readonly NeuralDateParts[] = [
    { year: 2026, month: 8, day: 17 },
    { year: 2026, month: 8, day: 18 },
  ];
  readonly bookingFilter: NeuralDateFilter = (date) =>
    date.day !== 13 && date.day !== 21;
  readonly minDateTime: NeuralDateTimeParts = {
    date: { year: 2026, month: 8, day: 10 },
    time: { hour: 9, minute: 0, second: 0, millisecond: 0 },
  };
  readonly maxDateTime: NeuralDateTimeParts = {
    date: { year: 2026, month: 8, day: 25 },
    time: { hour: 18, minute: 0, second: 0, millisecond: 0 },
  };
  readonly neuralEn = neuralEn;
  readonly neuralTr = neuralTr;
  readonly lastEvent = signal('No semantic event yet.');
  readonly reactiveDate = new FormControl<NeuralDateParts | null>({
    year: 2026,
    month: 8,
    day: 20,
  });
  templateDate: NeuralDateParts | null = {
    year: 2026,
    month: 8,
    day: 21,
  };
  readonly signalFormModel = signal({
    delivery: {
      year: 2026,
      month: 8,
      day: 22,
    } as NeuralDateParts | null,
  });
  readonly dateForm = form(this.signalFormModel);
  readonly headlessClasses: NeuralDatePickerClasses = {
    root: 'w-full font-sans text-slate-100',
    inputGroup:
      'flex min-h-11 overflow-hidden rounded-xl border border-cyan-400/40 bg-slate-950 shadow-[0_14px_35px_rgba(8,145,178,.16)]',
    input:
      'min-w-0 flex-1 bg-transparent px-3.5 text-sm text-slate-100 outline-none placeholder:text-slate-500',
    clearButton:
      'grid w-10 place-items-center text-slate-400 hover:text-cyan-300',
    triggerButton:
      'grid w-11 place-items-center border-l border-cyan-400/25 text-cyan-300 hover:bg-cyan-400/10',
    panel:
      'rounded-2xl border border-cyan-400/30 bg-slate-950 p-3 text-slate-100 shadow-2xl',
    header: 'mb-3 grid grid-cols-[2.25rem_1fr_2.25rem] items-center gap-2',
    title: 'flex justify-center gap-1 font-bold',
    navigationButton:
      'grid size-9 place-items-center rounded-lg hover:bg-cyan-400/10',
    weekdays: 'grid grid-cols-7 text-center text-xs text-slate-400',
    grid: 'grid gap-1',
    week: 'grid grid-cols-7 gap-1',
    day: 'grid size-9 place-items-center rounded-lg text-sm hover:bg-cyan-400/10',
    selectedDay: '!bg-cyan-400 !text-slate-950',
    today: 'ring-1 ring-cyan-400',
    footer: 'mt-3 flex justify-between border-t border-slate-800 pt-3',
    footerAction:
      'rounded-lg px-3 py-2 text-sm font-bold text-cyan-300 hover:bg-cyan-400/10',
  };

  readonly importCode = `import { NeuralDatePicker } from '@neural-ng/core/date-picker';

@Component({
  imports: [NeuralDatePicker]
})
export class Checkout {}`;
  readonly basicCode = `<neural-date-picker
  [(value)]="deliveryDate"
  placeholder="Choose delivery date"
  ariaLabel="Delivery date"
  clearable
  fluid
/>`;
  readonly viewsCode = `<neural-date-picker [(value)]="date" showWeekNumbers />
<neural-date-picker pickerMode="month" [(value)]="month" />
<neural-date-picker pickerMode="year" [(value)]="year" />`;
  readonly selectionCode = `<neural-date-picker selectionMode="range" [(value)]="range" />
<neural-date-picker
  selectionMode="multiple"
  [(value)]="dates"
  [closeOnSelect]="false"
/>`;
  readonly constraintsCode = `<neural-date-picker
  [(value)]="appointment"
  [minDate]="minDate"
  [maxDate]="maxDate"
  [disabledDays]="[0, 6]"
  [disabledDates]="blockedDates"
  [dateFilter]="bookingFilter"
  showOtherMonths
  selectOtherMonths
/>`;
  readonly footerCode = `<neural-date-picker
  selectionMode="range"
  [(value)]="period"
  showApplyActions
  [showQuickActions]="false"
/>`;
  readonly timeCode = `<neural-date-picker
  pickerMode="time"
  [(value)]="meetingTime"
  [hourFormat]="12"
  [minuteStep]="15"
  showSeconds
/>

<neural-date-picker
  pickerMode="datetime"
  [(value)]="release"
  [minDateTime]="minDateTime"
  [maxDateTime]="maxDateTime"
  [minuteStep]="15"
/>`;
  readonly localeCode = `<neural-select
  [options]="localeOptions"
  optionLabel="label"
  optionValue="value"
  [(value)]="localeChoice"
/>

<neural-date-picker
  [(value)]="date"
  [locale]="activeLocale()"
  [firstDayOfWeek]="firstDayOverride()"
/>

// Application default:
provideNeuralNg({ locale: neuralTr });`;
  readonly formsCode = `<neural-date-picker [formControl]="reactiveDate" />
<neural-date-picker name="delivery" [(ngModel)]="templateDate" />
<neural-date-picker [formField]="dateForm.delivery" />`;
  readonly templatesCode = `<neural-date-picker [(value)]="date">
  <ng-template neuralDatePickerDay let-day let-selected="selected">
    <span>{{ day.date.day }}</span>
    @if (selected) { <i class="nt nt-check"></i> }
  </ng-template>
  <ng-template neuralDatePickerTriggerIcon let-className="className">
    <i [class]="className + ' nt-calendar-event'"></i>
  </ng-template>
</neural-date-picker>`;
  readonly eventsCode = `<neural-date-picker
  [(value)]="date"
  (opened)="track('opened')"
  (closed)="track('closed')"
  (selected)="track('selected', $event)"
  (cleared)="track('cleared', $event)"
  (viewChanged)="track('viewChanged', $event)"
  (monthChanged)="track('monthChanged', $event)"
  (yearChanged)="track('yearChanged', $event)"
  (invalidInput)="track('invalidInput', $event)"
/>`;
  readonly unstyledCode = `<neural-date-picker
  [(value)]="date"
  unstyled
  [classes]="headlessClasses"
/>`;

  constructor() {
    const subscription = this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
      )
      .subscribe(() => this.selectedView.set(resolveView(this.router.url)));
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  selectView(value: NeuralTabValue | null): void {
    if (!isView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    void this.router.navigateByUrl(
      `/docs/components/date-picker${value === 'component' ? '' : `/${value}`}`,
    );
  }

  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }

  track(name: string, event?: unknown): void {
    this.lastEvent.set(
      event === undefined ? name : `${name}: ${JSON.stringify(event)}`,
    );
  }

  selectionLabel(event: NeuralDatePickerChange): void {
    this.lastEvent.set(
      `${toNeuralIsoDate(event.value)} selected by ${event.source}`,
    );
  }

  formatDate(value: NeuralDateParts | null): string {
    return value ? toNeuralIsoDate(value) : 'null';
  }

  formatRange(value: NeuralDateRange | null): string {
    if (!value?.start) return 'Choose a start date';
    return `${toNeuralIsoDate(value.start)} → ${value.end ? toNeuralIsoDate(value.end) : '…'}`;
  }

  formatTime(value: NeuralTimeParts | null): string {
    if (!value) return 'null';
    return [value.hour, value.minute, value.second]
      .map((part) => String(part).padStart(2, '0'))
      .join(':');
  }
}

function resolveView(url: string): DatePickerDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}

function isView(value: NeuralTabValue | null): value is DatePickerDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
