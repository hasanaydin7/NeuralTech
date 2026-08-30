import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { NeuralColorModeService } from '@neural-ng/core/color-mode';
import {
  NeuralDatePicker,
  NeuralDatePickerDayTemplate,
  NeuralDatePickerFooterTemplate,
  NeuralDatePickerHeaderTemplate,
  NeuralDatePickerNextIconTemplate,
  NeuralDatePickerPreviousIconTemplate,
  NeuralDatePickerTriggerIconTemplate,
  formatNeuralLocaleDate,
  parseNeuralLocaleDate,
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
import { CodeView } from '../../../shared/code-view';

@Component({
  selector: 'app-date-picker-page',
  imports: [
    CodeView,
    NeuralDatePicker,
    NeuralDatePickerDayTemplate,
    NeuralDatePickerFooterTemplate,
    NeuralDatePickerHeaderTemplate,
    NeuralDatePickerNextIconTemplate,
    NeuralDatePickerPreviousIconTemplate,
    NeuralDatePickerTriggerIconTemplate,
    FormsModule,
    ReactiveFormsModule,
    FormField,
  ],
  templateUrl: './date-picker.page.html',
  styleUrls: ['../shared-doc-page.scss', './date-picker.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatePickerPage {
  readonly resolvedMode = inject(NeuralColorModeService).resolvedMode;
  readonly today: NeuralDateParts = { year: 2026, month: 7, day: 30 };
  readonly qualityChecks = [
    'Leap years and month boundaries',
    'Single, range and multiple selection',
    'Min, max, disabled dates and predicates',
    'ARIA grid keyboard navigation',
    'Focus restoration',
    'Runtime locale and RTL changes',
    'Native top-layer overlay',
    'SSR and hydration-safe shell',
    'Reactive, template-driven and Signal Forms',
    'Light, dark and unstyled structure',
  ] as const;
  readonly deliveryDate = signal<NeuralDateParts | null>({
    year: 2026,
    month: 8,
    day: 12,
  });
  readonly appointmentDate = signal<NeuralDateParts | null>(null);
  readonly calendarFeaturesDate = signal<NeuralDateParts | null>({
    year: 2026,
    month: 8,
    day: 12,
  });
  readonly currentMonthDate = signal<NeuralDateParts | null>({
    year: 2026,
    month: 8,
    day: 12,
  });
  readonly rangeDate = signal<NeuralDateRange | null>(null);
  readonly multipleDates = signal<readonly NeuralDateParts[] | null>([
    { year: 2026, month: 8, day: 5 },
    { year: 2026, month: 8, day: 12 },
  ]);
  readonly approvalRange = signal<NeuralDateRange | null>(null);
  readonly meetingTime = signal<NeuralTimeParts | null>({
    hour: 14,
    minute: 30,
    second: 0,
    millisecond: 0,
  });
  readonly releaseDateTime = signal<NeuralDateTimeParts | null>({
    date: { year: 2026, month: 8, day: 12 },
    time: { hour: 10, minute: 30, second: 0, millisecond: 0 },
  });
  readonly minReleaseDateTime: NeuralDateTimeParts = {
    date: { year: 2026, month: 8, day: 10 },
    time: { hour: 9, minute: 0, second: 0, millisecond: 0 },
  };
  readonly maxReleaseDateTime: NeuralDateTimeParts = {
    date: { year: 2026, month: 8, day: 20 },
    time: { hour: 18, minute: 0, second: 0, millisecond: 0 },
  };
  readonly bookingDateFilter: NeuralDateFilter = (date) =>
    date.day !== 13 && date.day !== 21;
  readonly headlessDate = signal<NeuralDateParts | null>(this.today);
  readonly templatedDate = signal<NeuralDateParts | null>(this.today);
  readonly eventDate = signal<NeuralDateParts | null>(null);
  readonly reactiveDate = new FormControl<NeuralDateParts | null>({
    year: 2026,
    month: 8,
    day: 14,
  });
  templateDate: NeuralDateParts | null = {
    year: 2026,
    month: 8,
    day: 15,
  };
  readonly signalFormModel = signal({
    delivery: {
      year: 2026,
      month: 8,
      day: 16,
    } as NeuralDateParts | null,
  });
  readonly signalDateForm = form(this.signalFormModel);
  readonly lastSemanticEvent = signal('No event yet.');
  readonly englishDate = signal<NeuralDateParts | null>(this.today);
  readonly turkishDate = signal<NeuralDateParts | null>(this.today);
  readonly parserText = signal('31.07.2026');
  readonly parsedTurkishDate = computed(() =>
    parseNeuralLocaleDate(this.parserText(), 'tr-TR'),
  );
  readonly neuralEn = neuralEn;
  readonly neuralTr = neuralTr;
  readonly lastEvent = signal('No selection yet.');
  readonly minDate: NeuralDateParts = { year: 2026, month: 7, day: 25 };
  readonly maxDate: NeuralDateParts = { year: 2026, month: 9, day: 15 };
  readonly blockedDates: readonly NeuralDateParts[] = [
    { year: 2026, month: 8, day: 17 },
    { year: 2026, month: 8, day: 18 },
    { year: 2026, month: 8, day: 19 },
  ];
  readonly headlessClasses: NeuralDatePickerClasses = {
    root: 'headless-date-picker',
    inputGroup: 'headless-date-picker__group',
    input: 'headless-date-picker__input',
    triggerButton: 'headless-date-picker__trigger',
    triggerIcon: 'headless-date-picker__icon',
    clearButton: 'headless-date-picker__clear',
    clearIcon: 'headless-date-picker__icon',
    panel: 'headless-date-picker__panel',
    calendar: 'headless-date-picker__calendar',
    header: 'headless-date-picker__header',
    title: 'headless-date-picker__title',
    monthLabel: 'headless-date-picker__month',
    monthToggle: 'headless-date-picker__month-toggle',
    yearToggle: 'headless-date-picker__year-toggle',
    navigationButton: 'headless-date-picker__navigation',
    navigationIcon: 'headless-date-picker__icon',
    monthView: 'headless-date-picker__month-view',
    monthGrid: 'headless-date-picker__month-grid',
    month: 'headless-date-picker__month-option',
    selectedMonth: 'headless-date-picker__month-option--selected',
    disabledMonth: 'headless-date-picker__month-option--disabled',
    yearView: 'headless-date-picker__year-view',
    yearInput: 'headless-date-picker__year-input',
    yearGrid: 'headless-date-picker__year-grid',
    year: 'headless-date-picker__year',
    selectedYear: 'headless-date-picker__year--selected',
    disabledYear: 'headless-date-picker__year--disabled',
    grid: 'headless-date-picker__grid',
    weekdays: 'headless-date-picker__weekdays',
    weekday: 'headless-date-picker__weekday',
    week: 'headless-date-picker__week',
    weekNumberHeader: 'headless-date-picker__week-number',
    weekNumber: 'headless-date-picker__week-number',
    otherMonthPlaceholder: 'headless-date-picker__placeholder',
    day: 'headless-date-picker__day',
    outsideDay: 'headless-date-picker__day--outside',
    today: 'headless-date-picker__day--today',
    selectedDay: 'headless-date-picker__day--selected',
    disabledDay: 'headless-date-picker__day--disabled',
  };

  readonly importCode = `import { NeuralDatePicker } from '@neural-ng/core/date-picker';

@Component({
  imports: [NeuralDatePicker]
})
export class AppComponent {}`;

  readonly basicCode = `<neural-date-picker
  [(value)]="deliveryDate"
  placeholder="Choose delivery date"
  clearable
/>`;

  readonly modelCode = `import { signal } from '@angular/core';
import {
  NeuralDatePicker,
  type NeuralDateParts
} from '@neural-ng/core/date-picker';

readonly deliveryDate = signal<NeuralDateParts | null>({
  year: 2026,
  month: 8,
  day: 12
});`;

  readonly constraintsCode = `<neural-date-picker
  [(value)]="appointmentDate"
  [minDate]="minDate"
  [maxDate]="maxDate"
  [disabledDays]="[0, 6]"
  [disabledDates]="blockedDates"
/>`;

  readonly headlessCode = `<neural-date-picker
  [(value)]="date"
  unstyled
  [classes]="{
    input: 'my-input',
    panel: 'my-panel',
    day: 'my-day',
    selectedDay: 'my-day-selected'
  }"
/>`;

  readonly templatesCode = `<neural-date-picker
  [(value)]="date"
  showApplyActions
>
  <ng-template
    neuralDatePickerDay
    let-day
    let-selected="selected"
    let-rangeMiddle="rangeMiddle"
  >
    <span [class.is-selected]="selected">
      {{ day.date.day }}
    </span>
  </ng-template>

  <ng-template neuralDatePickerTriggerIcon let-className="className">
    <i [class]="className + ' custom-icon'"></i>
  </ng-template>
  <ng-template neuralDatePickerPreviousIcon let-className="className">
    <i [class]="className"></i>
  </ng-template>
  <ng-template neuralDatePickerNextIcon let-className="className">
    <i [class]="className"></i>
  </ng-template>

  <ng-template
    neuralDatePickerFooter
    let-apply="apply"
    let-cancel="cancel"
  >
    <button type="button" (click)="cancel()">Cancel</button>
    <button type="button" (click)="apply()">Apply</button>
  </ng-template>
</neural-date-picker>

<!-- Header can be replaced independently. -->
<ng-template
  neuralDatePickerHeader
  let-title="title"
  let-navigate="navigate"
>
  <button type="button" (click)="navigate(-1)">Previous</button>
  <strong>{{ title }}</strong>
  <button type="button" (click)="navigate(1)">Next</button>
</ng-template>`;

  readonly localeCode = `<neural-date-picker
  [locale]="neuralEn"
  [(value)]="englishDate"
/>

<neural-date-picker
  [locale]="neuralTr"
  [(value)]="turkishDate"
/>

<!-- Explicitly override the locale's week start when needed. -->
<neural-date-picker [firstDayOfWeek]="2" />`;

  readonly localeParserCode = `import {
  formatNeuralLocaleDate,
  parseNeuralLocaleDate
} from '@neural-ng/core/date-picker';

const parsed = parseNeuralLocaleDate('31.07.2026', 'tr-TR');
// { year: 2026, month: 7, day: 31 }

formatNeuralLocaleDate(parsed!, 'en-US');
// "07/31/2026"

parseNeuralLocaleDate('02/31/2026', 'en-US');
// null — invalid dates never roll into another month`;

  readonly calendarViewsCode = `<neural-date-picker
  [(value)]="date"
  [firstDayOfWeek]="1"
  showWeekNumbers
  showOtherMonths
  selectOtherMonths
/>

<neural-date-picker
  [(value)]="currentMonthDate"
  [showOtherMonths]="false"
/>`;

  readonly selectionModesCode = `<!-- Single is the default. -->
<neural-date-picker [(value)]="singleDate" />

<neural-date-picker
  selectionMode="range"
  [(value)]="rangeDate"
  [dateFilter]="bookingDateFilter"
/>

<neural-date-picker
  selectionMode="multiple"
  [(value)]="multipleDates"
  [closeOnSelect]="false"
/>`;

  readonly footerCode = `<neural-date-picker
  selectionMode="range"
  [(value)]="approvalRange"
  showApplyActions
  [showQuickActions]="false"
/>

<!-- Omit showQuickActions=false to keep Today and Clear. -->`;

  readonly timePickerCode = `<neural-date-picker
  pickerMode="time"
  [(value)]="meetingTime"
  [hourFormat]="12"
  [minuteStep]="15"
  showSeconds
/>

<neural-date-picker
  pickerMode="datetime"
  [(value)]="releaseDateTime"
  [minuteStep]="15"
  [minDateTime]="minReleaseDateTime"
  [maxDateTime]="maxReleaseDateTime"
/>`;

  readonly formsCode = `<neural-date-picker [formControl]="reactiveDate" />
<neural-date-picker name="date" [(ngModel)]="templateDate" />
<neural-date-picker [formField]="signalForm.delivery" />`;

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

  handleSelection(event: NeuralDatePickerChange): void {
    this.lastEvent.set(
      `${toNeuralIsoDate(event.value)} selected by ${event.source}.`,
    );
  }

  handleParserInput(event: Event): void {
    this.parserText.set((event.currentTarget as HTMLInputElement).value);
  }

  recordSemanticEvent(name: string, event?: unknown): void {
    this.lastSemanticEvent.set(
      event === undefined ? name : `${name}: ${JSON.stringify(event)}`,
    );
  }

  formatValue(value: NeuralDateParts | null): string {
    return value ? toNeuralIsoDate(value) : 'null';
  }

  formatRange(value: NeuralDateRange | null): string {
    if (!value?.start) return 'null';
    return `${toNeuralIsoDate(value.start)} → ${
      value.end ? toNeuralIsoDate(value.end) : '…'
    }`;
  }

  formatDates(value: readonly NeuralDateParts[] | null): string {
    return value?.length
      ? value.map((date) => toNeuralIsoDate(date)).join(', ')
      : '[]';
  }

  formatTime(value: NeuralTimeParts | null): string {
    if (!value) return 'null';
    return [value.hour, value.minute, value.second]
      .map((part) => String(part).padStart(2, '0'))
      .join(':');
  }

  formatDateTime(value: NeuralDateTimeParts | null): string {
    return value
      ? `${toNeuralIsoDate(value.date)} ${this.formatTime(value.time)}`
      : 'null';
  }

  formatLocaleDate(value: NeuralDateParts | null): string {
    return value ? formatNeuralLocaleDate(value, 'en-US') : 'Invalid date';
  }
}
