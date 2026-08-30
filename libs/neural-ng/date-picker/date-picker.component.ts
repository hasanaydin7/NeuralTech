import { NgTemplateOutlet } from '@angular/common';
import {
  APP_ID,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injectable,
  Injector,
  ViewEncapsulation,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import {
  NEURAL_FIELD_CONTEXT,
  NEURAL_NG_CONFIG,
  NeuralLocaleService,
  resolveNeuralLocale,
  type NeuralLocale,
} from '@neural-ng/core';
import { PopoverComponent } from '@neural-ng/core/popover';
import type {
  NeuralCalendarDay,
  NeuralDateDisabledPredicate,
  NeuralDateFilter,
  NeuralDateParts,
  NeuralDatePickerAnyValue,
  NeuralDatePickerChange,
  NeuralDatePickerClasses,
  NeuralDatePickerClear,
  NeuralDatePickerFooterAction,
  NeuralDatePickerInteractionSource,
  NeuralDatePickerInvalidInput,
  NeuralDatePickerMode,
  NeuralDatePickerMonthChange,
  NeuralDatePickerValue,
  NeuralDatePickerView,
  NeuralDatePickerViewChange,
  NeuralDatePickerYearChange,
  NeuralDateRange,
  NeuralDateSelectionMode,
  NeuralDateSelectionValue,
  NeuralDateTimeParts,
  NeuralDayOfWeek,
  NeuralTimeParts,
} from './date-picker.types';
import {
  NeuralDatePickerDayTemplate,
  NeuralDatePickerFooterTemplate,
  NeuralDatePickerHeaderTemplate,
  NeuralDatePickerNextIconTemplate,
  NeuralDatePickerPreviousIconTemplate,
  NeuralDatePickerTriggerIconTemplate,
  type NeuralDatePickerDayTemplateContext,
  type NeuralDatePickerFooterTemplateContext,
  type NeuralDatePickerHeaderTemplateContext,
  type NeuralDatePickerIconTemplateContext,
} from './date-picker-templates';
import {
  addNeuralDays,
  addNeuralMinutes,
  addNeuralMonths,
  addNeuralSeconds,
  buildNeuralCalendarMonth,
  compareNeuralDates,
  compareNeuralDateTimes,
  compareNeuralTimes,
  createNeuralDate,
  createNeuralDateTime,
  createNeuralTime,
  formatNeuralLocaleDate,
  fromNativeDate,
  getNeuralDayOfWeek,
  getNeuralDaysInMonth,
  getNeuralIsoWeekNumber,
  isSameNeuralDate,
  normalizeNeuralDateRange,
  toNativeDate,
  toNeuralIsoDate,
} from './date-picker.utils';

@Injectable({ providedIn: 'root' })
class NeuralDatePickerIdGenerator {
  private readonly appId = inject(APP_ID);
  private nextId = 0;

  next(): string {
    return `${this.appId}-neural-date-picker-${this.nextId++}`;
  }
}

@Component({
  selector: 'neural-date-picker',
  exportAs: 'neuralDatePicker',
  standalone: true,
  imports: [NgTemplateOutlet, PopoverComponent],
  templateUrl: './date-picker.component.html',
  styleUrl: './date-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neural-date-picker-host',
    '[class.neural-date-picker-host-fluid]': 'effectiveFluid()',
  },
})
export class NeuralDatePicker<
  TMode extends NeuralDateSelectionMode = 'single',
  TPickerMode extends NeuralDatePickerMode = 'date',
> implements FormValueControl<NeuralDatePickerValue<TMode, TPickerMode>>
{
  private readonly injector = inject(Injector);
  private readonly neuralConfig = inject(NEURAL_NG_CONFIG);
  private readonly localeService = inject(NeuralLocaleService);
  protected readonly field = inject(NEURAL_FIELD_CONTEXT, { optional: true });
  private readonly generatedId = inject(NeuralDatePickerIdGenerator).next();
  private readonly popover =
    viewChild.required<PopoverComponent>('calendarPopover');
  private readonly anchor =
    viewChild.required<ElementRef<HTMLElement>>('anchor');
  private readonly dateInput =
    viewChild.required<ElementRef<HTMLInputElement>>('dateInput');
  private readonly dayButtons =
    viewChildren<ElementRef<HTMLButtonElement>>('dayButton');
  private readonly monthButtons =
    viewChildren<ElementRef<HTMLButtonElement>>('monthButton');
  private readonly timeInputs =
    viewChildren<ElementRef<HTMLInputElement>>('timeInput');
  private readonly yearInputElement =
    viewChild<ElementRef<HTMLInputElement>>('yearInput');
  readonly dayTemplate = contentChild(NeuralDatePickerDayTemplate);
  readonly headerTemplate = contentChild(NeuralDatePickerHeaderTemplate);
  readonly footerTemplate = contentChild(NeuralDatePickerFooterTemplate);
  readonly triggerIconTemplate = contentChild(
    NeuralDatePickerTriggerIconTemplate,
  );
  readonly previousIconTemplate = contentChild(
    NeuralDatePickerPreviousIconTemplate,
  );
  readonly nextIconTemplate = contentChild(NeuralDatePickerNextIconTemplate);

  readonly selectionMode = input<TMode>('single' as TMode);
  readonly pickerMode = input<TPickerMode>('date' as TPickerMode);
  readonly value = model<NeuralDatePickerValue<TMode, TPickerMode>>(null);
  readonly minDate = input<NeuralDateParts | null>(null);
  readonly maxDate = input<NeuralDateParts | null>(null);
  readonly minDateTime = input<NeuralDateTimeParts | null>(null);
  readonly maxDateTime = input<NeuralDateTimeParts | null>(null);
  readonly disabledDates = input<readonly NeuralDateParts[]>([]);
  readonly disabledDays = input<readonly NeuralDayOfWeek[]>([]);
  readonly isDateDisabled = input<NeuralDateDisabledPredicate | undefined>(
    undefined,
  );
  readonly dateFilter = input<NeuralDateFilter | undefined>(undefined);
  readonly firstDayOfWeek = input<NeuralDayOfWeek | null>(null);
  readonly locale = input<NeuralLocale | null>(null);
  readonly today = input<NeuralDateParts | null>(null);
  readonly placeholder = input('');
  readonly ariaLabel = input('');
  readonly datePickerId = input('');
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly showOtherMonths = input(true, { transform: booleanAttribute });
  readonly selectOtherMonths = input(false, { transform: booleanAttribute });
  readonly showWeekNumbers = input(false, { transform: booleanAttribute });
  readonly showSeconds = input(false, { transform: booleanAttribute });
  readonly hourFormat = input<12 | 24, number | string>(24, {
    transform: (value) => (Number(value) === 12 ? 12 : 24),
  });
  readonly hourStep = input(1, { transform: numberAttribute });
  readonly minuteStep = input(1, { transform: numberAttribute });
  readonly secondStep = input(1, { transform: numberAttribute });
  readonly closeOnSelect = input<
    boolean | null,
    boolean | string | null | undefined
  >(null, {
    transform: (value) => (value == null ? null : booleanAttribute(value)),
  });
  readonly footerActions = input<readonly NeuralDatePickerFooterAction[]>([
    'today',
    'clear',
  ]);
  readonly showQuickActions = input(true, { transform: booleanAttribute });
  readonly showApplyActions = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly pending = input(false, { transform: booleanAttribute });
  readonly touched = input(false, { transform: booleanAttribute });
  readonly dirty = input(false, { transform: booleanAttribute });
  readonly name = input('');
  readonly fluid = input(false, { transform: booleanAttribute });
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly datePickerClass = input('');
  readonly iconClass = input('');
  readonly clearIconClassName = input('nt-x');
  readonly previousIconClass = input('nt-chevron-left');
  readonly nextIconClass = input('nt-chevron-right');
  readonly classes = input<NeuralDatePickerClasses>({});

  readonly selectionChange =
    output<NeuralDatePickerChange<TMode, TPickerMode>>();
  readonly selected = output<NeuralDatePickerChange<TMode, TPickerMode>>();
  readonly cleared = output<NeuralDatePickerClear<TMode, TPickerMode>>();
  readonly openChange = output<boolean>();
  readonly opened = output<void>();
  readonly closed = output<void>();
  readonly viewChanged = output<NeuralDatePickerViewChange>();
  readonly monthChanged = output<NeuralDatePickerMonthChange>();
  readonly yearChanged = output<NeuralDatePickerYearChange>();
  readonly invalidInput = output<NeuralDatePickerInvalidInput>();
  readonly touch = output<void>();

  readonly open = signal(false);
  readonly calendarView = signal<NeuralDatePickerView>('days');
  readonly viewDate = signal<NeuralDateParts>(createNeuralDate(2000, 1, 1));
  readonly activeDate = signal<NeuralDateParts>(createNeuralDate(2000, 1, 1));
  readonly draftValue = signal<NeuralDatePickerAnyValue>(null);
  readonly draftTime = signal<NeuralTimeParts>(createNeuralTime(0, 0, 0));
  readonly hoverDate = signal<NeuralDateParts | null>(null);
  readonly panelId = `${this.generatedId}-panel`;
  readonly hasCalendar = computed(() => this.pickerMode() !== 'time');
  readonly hasTime = computed(
    () => this.pickerMode() === 'time' || this.pickerMode() === 'datetime',
  );
  readonly resolvedHourStep = computed(() =>
    normalizeStep(this.hourStep(), 23),
  );
  readonly resolvedMinuteStep = computed(() =>
    normalizeStep(this.minuteStep(), 59),
  );
  readonly resolvedSecondStep = computed(() =>
    normalizeStep(this.secondStep(), 59),
  );

  readonly effectiveUnstyled = computed(
    () =>
      this.unstyled() ||
      this.field?.effectiveUnstyled() ||
      this.neuralConfig.unstyled,
  );
  readonly effectiveFluid = computed(() => this.fluid() || this.field?.fluid());
  readonly effectiveDisabled = computed(
    () => this.disabled() || (this.field?.disabled() ?? false),
  );
  readonly effectiveReadonly = computed(
    () => this.readonly() || (this.field?.readonly() ?? false),
  );
  readonly interactionBlocked = computed(
    () => this.effectiveDisabled() || this.effectiveReadonly(),
  );
  readonly effectiveRequired = computed(
    () => this.required() || (this.field?.required() ?? false),
  );
  readonly effectiveInvalid = computed(
    () => this.invalid() || (this.field?.invalid() ?? false),
  );
  readonly controlId = computed(
    () => this.field?.controlId() || this.datePickerId() || this.generatedId,
  );
  readonly resolvedToday = computed(
    () => this.today() ?? fromNativeDate(new Date(), 'local'),
  );
  readonly resolvedLocale = computed(() =>
    resolveNeuralLocale(this.locale() ?? this.localeService.locale()),
  );
  readonly resolvedFirstDayOfWeek = computed<NeuralDayOfWeek>(
    () => this.firstDayOfWeek() ?? this.resolvedLocale().firstDayOfWeek,
  );
  readonly calendarMinDate = computed(() =>
    laterDate(this.minDate(), this.minDateTime()?.date ?? null),
  );
  readonly calendarMaxDate = computed(() =>
    earlierDate(this.maxDate(), this.maxDateTime()?.date ?? null),
  );
  readonly calendar = computed(() => {
    const view = this.viewDate();
    return buildNeuralCalendarMonth(view.year, view.month, {
      firstDayOfWeek: this.resolvedFirstDayOfWeek(),
      fixedWeeks: true,
      today: this.resolvedToday(),
      minDate: this.calendarMinDate(),
      maxDate: this.calendarMaxDate(),
      disabledDates: this.disabledDates(),
      disabledDays: this.disabledDays(),
      isDateDisabled: (date) => this.isDateUnavailable(date),
    });
  });
  readonly effectiveSelection = computed<NeuralDatePickerAnyValue>(() =>
    this.open() ? this.draftValue() : this.value(),
  );
  readonly resolvedFooterActions = computed<
    readonly NeuralDatePickerFooterAction[]
  >(() => {
    const immediateActions = this.showQuickActions()
      ? this.footerActions().filter(
          (action) => action === 'today' || action === 'clear',
        )
      : [];
    return this.showApplyActions() || this.hasTime()
      ? [...immediateActions, 'cancel', 'apply']
      : immediateActions;
  });
  readonly deferredSelection = computed(
    () => this.showApplyActions() || this.hasTime(),
  );
  readonly effectiveCloseOnSelect = computed(
    () =>
      this.closeOnSelect() ??
      (!this.hasTime() &&
        (this.selectionMode() === 'single' ||
          this.selectionMode() === 'range')),
  );
  readonly canApply = computed(() => {
    const value = this.draftValue();
    return (
      (!this.hasTime() || value !== null) &&
      (this.selectionMode() !== 'range' || !isIncompleteRange(value)) &&
      this.isValueAvailable(value)
    );
  });
  readonly todayDisabled = computed(() => {
    if (this.pickerMode() === 'time') {
      return !this.isTimeAvailable(this.currentTime(), this.resolvedToday());
    }
    if (this.pickerMode() === 'datetime') {
      return !this.isDateTimeAvailable(
        createNeuralDateTime(this.resolvedToday(), this.currentTime()),
      );
    }
    return this.isDateUnavailable(this.resolvedToday());
  });
  readonly displayValue = computed(() => {
    const value = this.value();
    return value ? this.formatSelection(value) : '';
  });
  readonly triggerLabel = computed(() => {
    const value = this.displayValue();
    if (!value) return this.chooseValueLabel();
    const template =
      this.pickerMode() === 'time'
        ? this.resolvedLocale().messages.datePicker.changeTime
        : this.pickerMode() === 'datetime'
          ? this.resolvedLocale().messages.datePicker.changeDateTime
          : this.resolvedLocale().messages.datePicker.changeDate;
    return template.replace('{value}', value);
  });
  readonly monthTitle = computed(() => {
    const view = this.viewDate();
    return new Intl.DateTimeFormat(this.resolvedLocale().code, {
      month: 'long',
      year: 'numeric',
      calendar: 'gregory',
      timeZone: 'UTC',
    }).format(toNativeDate(createNeuralDate(view.year, view.month, 1), 'utc'));
  });
  readonly monthLabel = computed(() => {
    const view = this.viewDate();
    return new Intl.DateTimeFormat(this.resolvedLocale().code, {
      month: 'long',
      calendar: 'gregory',
      timeZone: 'UTC',
    }).format(toNativeDate(createNeuralDate(view.year, view.month, 1), 'utc'));
  });
  readonly weekdayLabels = computed(() => {
    const formatterShort = new Intl.DateTimeFormat(this.resolvedLocale().code, {
      weekday: 'short',
      calendar: 'gregory',
      timeZone: 'UTC',
    });
    const formatterLong = new Intl.DateTimeFormat(this.resolvedLocale().code, {
      weekday: 'long',
      calendar: 'gregory',
      timeZone: 'UTC',
    });
    const first = this.resolvedFirstDayOfWeek();
    return Array.from({ length: 7 }, (_, index) => {
      const day = (first + index) % 7;
      const reference = new Date(Date.UTC(2024, 0, 7 + day));
      return Object.freeze({
        short: formatterShort.format(reference),
        long: formatterLong.format(reference),
      });
    });
  });
  readonly monthLabels = computed(() => {
    const shortFormatter = new Intl.DateTimeFormat(this.resolvedLocale().code, {
      month: 'short',
      calendar: 'gregory',
      timeZone: 'UTC',
    });
    const longFormatter = new Intl.DateTimeFormat(this.resolvedLocale().code, {
      month: 'long',
      calendar: 'gregory',
      timeZone: 'UTC',
    });
    return Array.from({ length: 12 }, (_, index) => {
      const date = toNativeDate(
        createNeuralDate(this.viewDate().year, index + 1, 1),
        'utc',
      );
      return Object.freeze({
        value: index + 1,
        short: shortFormatter.format(date),
        long: longFormatter.format(date),
      });
    });
  });
  readonly previousMonthDisabled = computed(() => {
    const min = this.calendarMinDate();
    if (!min) return false;
    const previous = addNeuralMonths(this.viewDate(), -1);
    const previousEnd = createNeuralDate(
      previous.year,
      previous.month,
      getNeuralDaysInMonth(previous.year, previous.month),
    );
    return compareNeuralDates(previousEnd, min) < 0;
  });
  readonly nextMonthDisabled = computed(() => {
    const max = this.calendarMaxDate();
    if (!max) return false;
    const next = addNeuralMonths(this.viewDate(), 1);
    return (
      compareNeuralDates(createNeuralDate(next.year, next.month, 1), max) > 0
    );
  });
  readonly yearPageStart = computed(
    () => Math.floor(this.viewDate().year / 12) * 12,
  );
  readonly visibleYears = computed(() =>
    Array.from({ length: 12 }, (_, index) => this.yearPageStart() + index),
  );
  readonly previousYearsDisabled = computed(() => {
    const min = this.calendarMinDate();
    return this.yearPageStart() <= (min?.year ?? 1);
  });
  readonly nextYearsDisabled = computed(() => {
    const max = this.calendarMaxDate();
    return this.yearPageStart() + 11 >= (max?.year ?? 9999);
  });
  readonly previousYearDisabled = computed(() => {
    const min = this.calendarMinDate();
    return this.viewDate().year <= (min?.year ?? 1);
  });
  readonly nextYearDisabled = computed(() => {
    const max = this.calendarMaxDate();
    return this.viewDate().year >= (max?.year ?? 9999);
  });
  readonly viewAnnouncement = computed(() => {
    if (!this.hasCalendar()) return this.chooseTimeLabel();
    if (this.calendarView() === 'days') return this.monthTitle();
    if (this.calendarView() === 'months') return String(this.viewDate().year);
    const years = this.visibleYears();
    return `${years[0] ?? this.viewDate().year}–${
      years[years.length - 1] ?? this.viewDate().year
    }`;
  });

  readonly chooseDateLabel = computed(
    () => this.resolvedLocale().messages.datePicker.chooseDate,
  );
  readonly chooseTimeLabel = computed(
    () => this.resolvedLocale().messages.datePicker.chooseTime,
  );
  readonly chooseValueLabel = computed(() =>
    this.pickerMode() === 'time'
      ? this.chooseTimeLabel()
      : this.chooseDateLabel(),
  );
  readonly previousMonthLabel = computed(
    () => this.resolvedLocale().messages.datePicker.previousMonth,
  );
  readonly nextMonthLabel = computed(
    () => this.resolvedLocale().messages.datePicker.nextMonth,
  );
  readonly chooseMonthLabel = computed(
    () => this.resolvedLocale().messages.datePicker.chooseMonth,
  );
  readonly previousYearLabel = computed(
    () => this.resolvedLocale().messages.datePicker.previousYear,
  );
  readonly nextYearLabel = computed(
    () => this.resolvedLocale().messages.datePicker.nextYear,
  );
  readonly calendarLabel = computed(
    () => this.resolvedLocale().messages.datePicker.calendar,
  );
  readonly chooseYearLabel = computed(
    () => this.resolvedLocale().messages.datePicker.chooseYear,
  );
  readonly previousYearsLabel = computed(
    () => this.resolvedLocale().messages.datePicker.previousYears,
  );
  readonly nextYearsLabel = computed(
    () => this.resolvedLocale().messages.datePicker.nextYears,
  );
  readonly yearInputLabel = computed(
    () => this.resolvedLocale().messages.datePicker.yearInput,
  );
  readonly clearLabel = computed(
    () => this.resolvedLocale().messages.common.clear,
  );
  readonly todayLabel = computed(() =>
    this.pickerMode() === 'time'
      ? this.resolvedLocale().messages.datePicker.now
      : this.resolvedLocale().messages.datePicker.today,
  );
  readonly hourLabel = computed(
    () => this.resolvedLocale().messages.datePicker.hour,
  );
  readonly minuteLabel = computed(
    () => this.resolvedLocale().messages.datePicker.minute,
  );
  readonly secondLabel = computed(
    () => this.resolvedLocale().messages.datePicker.second,
  );
  readonly periodLabel = computed(
    () => this.resolvedLocale().messages.datePicker.period,
  );
  readonly applyLabel = computed(
    () => this.resolvedLocale().messages.datePicker.apply,
  );
  readonly cancelLabel = computed(
    () => this.resolvedLocale().messages.datePicker.cancel,
  );

  readonly rootClass = computed(() =>
    this.compose(
      'neural-date-picker-root',
      `neural-date-picker-base ${this.effectiveFluid() ? 'neural-date-picker-fluid-base' : ''}`,
      this.datePickerClass(),
      this.classes().root,
    ),
  );
  readonly inputGroupClass = computed(() =>
    this.compose(
      'neural-date-picker-input-group-root',
      'neural-date-picker-input-group-base',
      this.classes().inputGroup,
    ),
  );
  readonly inputClass = computed(() =>
    this.compose(
      'neural-date-picker-input-root',
      'neural-date-picker-input-base',
      this.classes().input,
    ),
  );
  readonly triggerButtonClass = computed(() =>
    this.compose(
      'neural-date-picker-trigger-root',
      'neural-date-picker-trigger-base',
      this.classes().trigger,
      this.classes().triggerButton,
    ),
  );
  readonly triggerIconClass = computed(() =>
    this.compose(
      normalizeIconClass(
        this.iconClass() ||
          (this.pickerMode() === 'time' ? 'nt-clock' : 'nt-calendar'),
      ),
      '',
      this.classes().triggerIcon,
    ),
  );
  readonly clearButtonClass = computed(() =>
    this.compose(
      'neural-date-picker-clear-root',
      'neural-date-picker-clear-base',
      this.classes().clearButton,
    ),
  );
  readonly clearIconClass = computed(() =>
    this.compose(
      normalizeIconClass(this.clearIconClassName()),
      '',
      this.classes().clearIcon,
    ),
  );
  readonly panelClass = computed(() =>
    this.compose(
      'neural-date-picker-panel-root',
      'neural-date-picker-panel-base',
      this.classes().panel,
    ),
  );
  readonly calendarClass = computed(() =>
    this.compose(
      'neural-date-picker-calendar-root',
      'neural-date-picker-calendar-base',
      this.classes().calendar,
    ),
  );
  readonly announcementClass = computed(() =>
    this.compose(
      'neural-date-picker-announcement-root',
      'neural-date-picker-announcement-base',
      this.classes().announcement,
    ),
  );
  readonly headerClass = computed(() =>
    this.compose(
      'neural-date-picker-header-root',
      'neural-date-picker-header-base',
      this.classes().header,
    ),
  );
  readonly titleClass = computed(() =>
    this.compose(
      'neural-date-picker-title-root',
      'neural-date-picker-title-base',
      this.classes().title,
    ),
  );
  readonly monthLabelClass = computed(() =>
    this.compose(
      'neural-date-picker-month-label-root',
      'neural-date-picker-month-label-base',
      this.classes().monthLabel,
    ),
  );
  readonly yearToggleClass = computed(() =>
    this.compose(
      'neural-date-picker-year-toggle-root',
      'neural-date-picker-year-toggle-base',
      this.classes().yearToggle,
    ),
  );
  readonly monthToggleClass = computed(() =>
    this.compose(
      'neural-date-picker-month-toggle-root',
      'neural-date-picker-month-toggle-base',
      this.classes().monthLabel,
      this.classes().monthToggle,
    ),
  );
  readonly navigationButtonClass = computed(() =>
    this.compose(
      'neural-date-picker-navigation-root',
      'neural-date-picker-navigation-base',
      this.classes().navigationButton,
    ),
  );
  readonly weekdaysClass = computed(() =>
    this.compose(
      'neural-date-picker-weekdays-root',
      `neural-date-picker-weekdays-base ${
        this.showWeekNumbers() ? 'neural-date-picker-row-week-numbers-base' : ''
      }`,
      this.classes().weekdays,
    ),
  );
  readonly weekdayClass = computed(() =>
    this.compose(
      'neural-date-picker-weekday-root',
      'neural-date-picker-weekday-base',
      this.classes().weekday,
    ),
  );
  readonly gridClass = computed(() =>
    this.compose(
      'neural-date-picker-grid-root',
      'neural-date-picker-grid-base',
      this.classes().grid,
    ),
  );
  readonly monthViewClass = computed(() =>
    this.compose(
      'neural-date-picker-month-view-root',
      'neural-date-picker-month-view-base',
      this.classes().monthView,
    ),
  );
  readonly monthGridClass = computed(() =>
    this.compose(
      'neural-date-picker-month-grid-root',
      'neural-date-picker-month-grid-base',
      this.classes().monthGrid,
    ),
  );
  readonly yearViewClass = computed(() =>
    this.compose(
      'neural-date-picker-year-view-root',
      'neural-date-picker-year-view-base',
      this.classes().yearView,
    ),
  );
  readonly yearInputClass = computed(() =>
    this.compose(
      'neural-date-picker-year-input-root',
      'neural-date-picker-year-input-base',
      this.classes().yearInput,
    ),
  );
  readonly yearGridClass = computed(() =>
    this.compose(
      'neural-date-picker-year-grid-root',
      'neural-date-picker-year-grid-base',
      this.classes().yearGrid,
    ),
  );
  readonly weekClass = computed(() =>
    this.compose(
      'neural-date-picker-week-root',
      `neural-date-picker-week-base ${
        this.showWeekNumbers() ? 'neural-date-picker-row-week-numbers-base' : ''
      }`,
      this.classes().week,
    ),
  );
  readonly weekNumberHeaderClass = computed(() =>
    this.compose(
      'neural-date-picker-week-number-header-root',
      'neural-date-picker-week-number-header-base',
      this.classes().weekNumberHeader,
    ),
  );
  readonly weekNumberClass = computed(() =>
    this.compose(
      'neural-date-picker-week-number-root',
      'neural-date-picker-week-number-base',
      this.classes().weekNumber,
    ),
  );
  readonly otherMonthPlaceholderClass = computed(() =>
    this.compose(
      'neural-date-picker-other-month-placeholder-root',
      'neural-date-picker-other-month-placeholder-base',
      this.classes().otherMonthPlaceholder,
    ),
  );
  readonly timePickerClass = computed(() =>
    this.compose(
      'neural-date-picker-time-root',
      'neural-date-picker-time-base',
      this.classes().timePicker,
    ),
  );
  readonly timeGroupClass = computed(() =>
    this.compose(
      'neural-date-picker-time-group-root',
      'neural-date-picker-time-group-base',
      this.classes().timeGroup,
    ),
  );
  readonly timeSeparatorClass = computed(() =>
    this.compose(
      'neural-date-picker-time-separator-root',
      'neural-date-picker-time-separator-base',
      this.classes().timeSeparator,
    ),
  );
  readonly periodButtonClass = computed(() =>
    this.compose(
      'neural-date-picker-period-root',
      'neural-date-picker-period-base',
      this.classes().periodButton,
    ),
  );

  timeFieldClass(field: NeuralTimeField): string {
    return this.compose(
      `neural-date-picker-time-field-root neural-date-picker-time-field-${field}-root`,
      'neural-date-picker-time-field-base',
      this.classes().timeField,
    );
  }

  timeLabelClass(): string {
    return this.compose(
      'neural-date-picker-time-label-root',
      'neural-date-picker-time-label-base',
      this.classes().timeLabel,
    );
  }

  timeInputClass(): string {
    return this.compose(
      'neural-date-picker-time-input-root',
      'neural-date-picker-time-input-base',
      this.classes().timeInput,
    );
  }
  readonly footerClass = computed(() =>
    this.compose(
      'neural-date-picker-footer-root',
      'neural-date-picker-footer-base',
      this.classes().footer,
    ),
  );

  footerActionClass(action: NeuralDatePickerFooterAction): string {
    const actionClass = {
      today: this.classes().todayAction,
      clear: this.classes().clearAction,
      cancel: this.classes().cancelAction,
      apply: this.classes().applyAction,
    }[action];
    return this.compose(
      'neural-date-picker-footer-action-root',
      `neural-date-picker-footer-action-base neural-date-picker-footer-action-${action}-base`,
      this.classes().footerAction,
      actionClass,
    );
  }

  constructor() {
    let initialized = false;
    effect(() => {
      const isOpen = this.open();
      if (!initialized) {
        initialized = true;
        return;
      }
      this.openChange.emit(isOpen);
    });
    effect(() => {
      if (this.interactionBlocked() && this.open()) this.hide();
    });
  }

  show(): void {
    if (this.interactionBlocked() || this.open()) return;
    this.prepareCalendar();
    this.popover().showFor(this.anchor().nativeElement);
  }

  toggle(event?: Event): void {
    event?.stopPropagation();
    if (this.interactionBlocked()) return;
    if (!this.open()) this.prepareCalendar();
    this.popover().toggleFor(this.anchor().nativeElement, {}, event);
  }

  hide(): void {
    this.popover().hide('api', false);
  }

  focus(options?: FocusOptions): void {
    this.dateInput().nativeElement.focus(options);
  }

  reset(): void {
    this.value.set(null);
    this.draftValue.set(null);
    this.hoverDate.set(null);
    this.hide();
  }

  handleOpened(): void {
    this.opened.emit();
    this.focusCurrentView();
  }

  clear(event?: Event): void {
    event?.stopPropagation();
    const previousValue = this.value();
    if (!previousValue || this.interactionBlocked()) return;
    this.value.set(null);
    this.draftValue.set(null);
    this.hoverDate.set(null);
    this.cleared.emit({
      previousValue: previousValue as NeuralDateSelectionValue<
        TMode,
        TPickerMode
      >,
    });
    this.hide();
    this.dateInput().nativeElement.focus({ preventScroll: true });
  }

  clearFromFooter(event?: Event): void {
    event?.stopPropagation();
    if (this.interactionBlocked()) return;
    const previousValue = this.value();
    this.value.set(null);
    this.draftValue.set(null);
    this.hoverDate.set(null);
    if (previousValue !== null) {
      this.cleared.emit({
        previousValue: previousValue as NeuralDateSelectionValue<
          TMode,
          TPickerMode
        >,
      });
    }
    this.hideAndRestoreFocus();
  }

  selectToday(): void {
    if (this.interactionBlocked()) return;
    const today = this.resolvedToday();
    const now = this.currentTime();
    if (this.pickerMode() === 'time') {
      if (!this.isTimeAvailable(now, today)) return;
      this.draftTime.set(now);
      this.draftValue.set(now);
      this.commitSelection(now, 'pointer');
      this.hideAndRestoreFocus();
      return;
    }
    if (this.pickerMode() === 'datetime') {
      const dateTime = createNeuralDateTime(today, now);
      if (!this.isDateTimeAvailable(dateTime)) return;
      this.draftTime.set(now);
      this.draftValue.set(dateTime);
      this.activeDate.set(today);
      this.commitSelection(dateTime, 'pointer');
      this.hideAndRestoreFocus();
      return;
    }
    if (this.isDateUnavailable(today)) return;
    const current = this.effectiveSelection();
    const next: Exclude<NeuralDatePickerAnyValue, null> =
      this.selectionMode() === 'range'
        ? Object.freeze({ start: today, end: today })
        : this.selectionMode() === 'multiple'
          ? Array.isArray(current) &&
            current.some((date) => isSameNeuralDate(date, today))
            ? current
            : [...(Array.isArray(current) ? current : []), today]
          : today;
    this.draftValue.set(clonePickerValue(next));
    this.hoverDate.set(null);
    this.activeDate.set(today);
    this.commitSelection(next, 'pointer');
    this.hideAndRestoreFocus();
  }

  applySelection(source: NeuralDatePickerInteractionSource = 'pointer'): void {
    if (!this.canApply() || this.interactionBlocked()) return;
    const next = clonePickerValue(this.draftValue());
    const previous = this.value();
    if (next === null) {
      if (previous !== null) {
        this.value.set(null);
        this.cleared.emit({
          previousValue: previous as NeuralDateSelectionValue<
            TMode,
            TPickerMode
          >,
        });
      }
    } else {
      this.commitSelection(next, source);
    }
    this.hideAndRestoreFocus();
  }

  cancelSelection(): void {
    this.draftValue.set(clonePickerValue(this.value()));
    this.hoverDate.set(null);
    this.hideAndRestoreFocus();
  }

  navigateMonth(offset: -1 | 1): void {
    if (
      (offset < 0 && this.previousMonthDisabled()) ||
      (offset > 0 && this.nextMonthDisabled())
    ) {
      return;
    }
    const next = addNeuralMonths(this.viewDate(), offset);
    const date = createNeuralDate(next.year, next.month, 1);
    this.updateVisibleDate(date);
    this.activeDate.set(this.firstEnabledDateInView(date));
    this.focusActiveDay();
  }

  navigateHeader(offset: -1 | 1): void {
    const view = this.calendarView();
    if (view === 'years') {
      this.navigateYearPage(offset);
      return;
    }
    if (view === 'months') {
      this.navigateYear(offset);
      return;
    }
    this.navigateMonth(offset);
  }

  toggleYearView(): void {
    this.setCalendarView('years');
    this.focusYearInput();
  }

  toggleMonthView(): void {
    this.setCalendarView('months');
    this.focusActiveMonth();
  }

  navigateYearPage(offset: -1 | 1): void {
    if (
      (offset < 0 && this.previousYearsDisabled()) ||
      (offset > 0 && this.nextYearsDisabled())
    ) {
      return;
    }
    this.setViewYear(this.viewDate().year + offset * 12, 'years');
    this.focusYearInput();
  }

  selectYear(year: number): void {
    if (this.isYearDisabled(year)) return;
    this.setViewYear(year, 'months');
  }

  navigateYear(offset: -1 | 1): void {
    if (
      (offset < 0 && this.previousYearDisabled()) ||
      (offset > 0 && this.nextYearDisabled())
    ) {
      return;
    }
    this.setViewYear(this.viewDate().year + offset, 'months');
  }

  handleYearInput(event: Event): void {
    const input = event.currentTarget as HTMLInputElement;
    const year = Number(input.value);
    if (!Number.isInteger(year) || year < 1 || year > 9999) {
      this.invalidInput.emit({
        field: 'year',
        input: input.value,
        reason: Number.isFinite(year) ? 'range' : 'format',
      });
      input.value = String(this.viewDate().year);
      return;
    }
    this.selectYear(year);
  }

  handleYearInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.setCalendarView('months');
      this.focusActiveMonth();
      return;
    }
    if (event.key !== 'Enter') return;
    event.preventDefault();
    this.handleYearInput(event);
  }

  isYearDisabled(year: number): boolean {
    const min = this.calendarMinDate();
    const max = this.calendarMaxDate();
    return (
      year < 1 ||
      year > 9999 ||
      (min !== null && year < min.year) ||
      (max !== null && year > max.year)
    );
  }

  selectMonth(month: number): void {
    if (this.isMonthDisabled(month)) return;
    const current = this.viewDate();
    const day = Math.min(
      this.activeDate().day,
      getNeuralDaysInMonth(current.year, month),
    );
    this.updateVisibleDate(createNeuralDate(current.year, month, 1));
    this.activeDate.set(createNeuralDate(current.year, month, day));
    this.setCalendarView('days');
    this.focusActiveDay();
  }

  handleMonthKeydown(event: KeyboardEvent, month: number): void {
    let next = month;
    switch (event.key) {
      case 'ArrowLeft':
        next -= 1;
        break;
      case 'ArrowRight':
        next += 1;
        break;
      case 'ArrowUp':
        next -= 3;
        break;
      case 'ArrowDown':
        next += 3;
        break;
      case 'Home':
        next = 1;
        break;
      case 'End':
        next = 12;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.selectMonth(month);
        return;
      case 'Escape':
        event.preventDefault();
        this.setCalendarView('days');
        this.focusActiveDay();
        return;
      default:
        return;
    }
    event.preventDefault();
    next = Math.max(1, Math.min(12, next));
    if (this.isMonthDisabled(next)) return;
    const view = this.viewDate();
    this.updateVisibleDate(createNeuralDate(view.year, next, 1));
    this.focusActiveMonth();
  }

  isMonthDisabled(month: number): boolean {
    const year = this.viewDate().year;
    const min = this.calendarMinDate();
    const max = this.calendarMaxDate();
    return (
      month < 1 ||
      month > 12 ||
      (min !== null &&
        (year < min.year || (year === min.year && month < min.month))) ||
      (max !== null &&
        (year > max.year || (year === max.year && month > max.month)))
    );
  }

  monthClass(month: number): string {
    return this.compose(
      'neural-date-picker-month-root',
      [
        'neural-date-picker-month-base',
        month === this.viewDate().month
          ? 'neural-date-picker-month-selected-base'
          : '',
        this.isMonthDisabled(month)
          ? 'neural-date-picker-month-disabled-base'
          : '',
      ].join(' '),
      this.classes().month,
      month === this.viewDate().month ? this.classes().selectedMonth : '',
      this.isMonthDisabled(month) ? this.classes().disabledMonth : '',
    );
  }

  yearClass(year: number): string {
    return this.compose(
      'neural-date-picker-year-root',
      [
        'neural-date-picker-year-base',
        year === this.viewDate().year
          ? 'neural-date-picker-year-selected-base'
          : '',
        this.isYearDisabled(year)
          ? 'neural-date-picker-year-disabled-base'
          : '',
      ].join(' '),
      this.classes().year,
      year === this.viewDate().year ? this.classes().selectedYear : '',
      this.isYearDisabled(year) ? this.classes().disabledYear : '',
    );
  }

  selectDay(
    day: NeuralCalendarDay,
    source: NeuralDatePickerInteractionSource,
  ): void {
    if (this.isDayUnavailable(day) || this.interactionBlocked()) return;
    this.selectDate(day.date, source);
  }

  handleInputKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.show();
        return;
      case 'Escape':
        if (!this.open()) return;
        event.preventDefault();
        this.hide();
    }
  }

  handleDayKeydown(event: KeyboardEvent, day: NeuralCalendarDay): void {
    const rtl = this.resolvedLocale().direction === 'rtl';
    let next: NeuralDateParts | null = null;

    switch (event.key) {
      case 'ArrowLeft':
        next = addNeuralDays(day.date, rtl ? 1 : -1);
        break;
      case 'ArrowRight':
        next = addNeuralDays(day.date, rtl ? -1 : 1);
        break;
      case 'ArrowUp':
        next = addNeuralDays(day.date, -7);
        break;
      case 'ArrowDown':
        next = addNeuralDays(day.date, 7);
        break;
      case 'Home':
        next = addNeuralDays(
          day.date,
          -((day.dayOfWeek - this.resolvedFirstDayOfWeek() + 7) % 7),
        );
        break;
      case 'End':
        next = addNeuralDays(
          day.date,
          6 - ((day.dayOfWeek - this.resolvedFirstDayOfWeek() + 7) % 7),
        );
        break;
      case 'PageUp':
        next = addNeuralMonths(day.date, event.shiftKey ? -12 : -1);
        break;
      case 'PageDown':
        next = addNeuralMonths(day.date, event.shiftKey ? 12 : 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.selectDay(day, 'keyboard');
        return;
      case 'Escape':
        event.preventDefault();
        this.hide();
        this.dateInput().nativeElement.focus({ preventScroll: true });
        return;
      default:
        return;
    }

    event.preventDefault();
    this.moveActiveDate(next);
  }

  focusActiveDay(): void {
    if (this.calendarView() !== 'days') return;
    afterNextRender(
      () => {
        const key = toNeuralIsoDate(this.activeDate());
        this.dayButtons()
          .find((button) => button.nativeElement.dataset['date'] === key)
          ?.nativeElement.focus({ preventScroll: true });
      },
      { injector: this.injector },
    );
  }

  focusActiveMonth(): void {
    if (this.calendarView() !== 'months') return;
    afterNextRender(
      () => {
        const month = String(this.viewDate().month);
        this.monthButtons()
          .find((button) => button.nativeElement.dataset['month'] === month)
          ?.nativeElement.focus({ preventScroll: true });
      },
      { injector: this.injector },
    );
  }

  focusCurrentView(): void {
    if (!this.hasCalendar()) this.focusTimeInput();
    else if (this.calendarView() === 'years') this.focusYearInput();
    else if (this.calendarView() === 'months') this.focusActiveMonth();
    else this.focusActiveDay();
  }

  handleClosed(): void {
    this.open.set(false);
    this.hoverDate.set(null);
    this.draftValue.set(clonePickerValue(this.value()));
    this.closed.emit();
    this.touch.emit();
  }

  handleFocusOut(event: FocusEvent): void {
    if (this.open()) return;
    const next = event.relatedTarget;
    if (next instanceof Node && this.anchor().nativeElement.contains(next)) {
      return;
    }
    this.touch.emit();
  }

  isSelected(day: NeuralCalendarDay): boolean {
    const value = this.effectiveSelection();
    if (isDateParts(value)) return isSameNeuralDate(day.date, value);
    if (isDateTimeParts(value)) return isSameNeuralDate(day.date, value.date);
    if (Array.isArray(value)) {
      return value.some((date) => isSameNeuralDate(day.date, date));
    }
    if (isDateRange(value)) {
      return (
        isSameNeuralDate(day.date, value.start) ||
        isSameNeuralDate(day.date, value.end)
      );
    }
    return false;
  }

  isRangeStart(day: NeuralCalendarDay): boolean {
    const range = this.visibleRange();
    return range?.start ? isSameNeuralDate(day.date, range.start) : false;
  }

  isRangeEnd(day: NeuralCalendarDay): boolean {
    const range = this.visibleRange();
    return range?.end ? isSameNeuralDate(day.date, range.end) : false;
  }

  isInRange(day: NeuralCalendarDay): boolean {
    const range = this.visibleRange();
    return range?.start && range.end
      ? compareNeuralDates(day.date, range.start) >= 0 &&
          compareNeuralDates(day.date, range.end) <= 0
      : false;
  }

  isRangeMiddle(day: NeuralCalendarDay): boolean {
    return (
      this.isInRange(day) && !this.isRangeStart(day) && !this.isRangeEnd(day)
    );
  }

  isRangePreview(day: NeuralCalendarDay): boolean {
    return (
      this.selectionMode() === 'range' &&
      isIncompleteRange(this.effectiveSelection()) &&
      this.hoverDate() !== null &&
      this.isInRange(day)
    );
  }

  previewRange(day: NeuralCalendarDay): void {
    if (
      this.selectionMode() !== 'range' ||
      !isIncompleteRange(this.effectiveSelection()) ||
      this.isDayUnavailable(day)
    ) {
      return;
    }
    this.hoverDate.set(day.date);
  }

  clearRangePreview(): void {
    this.hoverDate.set(null);
  }

  shouldRenderDay(day: NeuralCalendarDay): boolean {
    return !day.outsideMonth || this.showOtherMonths();
  }

  isDayUnavailable(day: NeuralCalendarDay): boolean {
    return day.disabled || (day.outsideMonth && !this.selectOtherMonths());
  }

  weekNumber(week: readonly NeuralCalendarDay[]): number {
    const date = week[Math.floor(week.length / 2)]?.date;
    return date ? getNeuralIsoWeekNumber(date) : 0;
  }

  weekNumberAriaLabel(week: readonly NeuralCalendarDay[]): string {
    return this.resolvedLocale().messages.datePicker.weekNumber.replace(
      '{week}',
      String(this.weekNumber(week)),
    );
  }

  readonly weekNumberHeaderLabel = computed(
    () => this.resolvedLocale().messages.datePicker.weekNumberHeader,
  );

  isActive(day: NeuralCalendarDay): boolean {
    return isSameNeuralDate(day.date, this.activeDate());
  }

  dayClass(day: NeuralCalendarDay): string {
    const unavailable = this.isDayUnavailable(day);
    return this.compose(
      'neural-date-picker-day-root',
      [
        'neural-date-picker-day-base',
        day.outsideMonth ? 'neural-date-picker-day-outside-base' : '',
        day.today ? 'neural-date-picker-day-today-base' : '',
        this.isInRange(day) ? 'neural-date-picker-day-range-base' : '',
        this.isRangeStart(day) ? 'neural-date-picker-day-range-start-base' : '',
        this.isRangeEnd(day) ? 'neural-date-picker-day-range-end-base' : '',
        this.isRangePreview(day)
          ? 'neural-date-picker-day-range-preview-base'
          : '',
        this.isSelected(day) ? 'neural-date-picker-day-selected-base' : '',
        unavailable ? 'neural-date-picker-day-disabled-base' : '',
      ].join(' '),
      this.classes().day,
      day.outsideMonth ? this.classes().outsideDay : '',
      day.today ? this.classes().today : '',
      this.isInRange(day) ? this.classes().rangeDay : '',
      this.isRangeMiddle(day) ? this.classes().rangeMiddle : '',
      this.isRangeStart(day) ? this.classes().rangeStartDay : '',
      this.isRangeStart(day) ? this.classes().rangeStart : '',
      this.isRangeEnd(day) ? this.classes().rangeEndDay : '',
      this.isRangeEnd(day) ? this.classes().rangeEnd : '',
      this.isRangePreview(day) ? this.classes().rangePreviewDay : '',
      this.isSelected(day) ? this.classes().selectedDay : '',
      unavailable ? this.classes().disabledDay : '',
    );
  }

  navigationIconClass(direction: 'previous' | 'next'): string {
    const isRtl = this.resolvedLocale().direction === 'rtl';
    const icon =
      direction === 'previous'
        ? isRtl
          ? this.nextIconClass()
          : this.previousIconClass()
        : isRtl
          ? this.previousIconClass()
          : this.nextIconClass();
    return this.compose(
      normalizeIconClass(icon),
      '',
      this.classes().navigationIcon,
    );
  }

  iconTemplateContext(
    direction?: 'previous' | 'next',
  ): NeuralDatePickerIconTemplateContext {
    const className = direction
      ? this.navigationIconClass(direction)
      : this.triggerIconClass();
    return { $implicit: className, className, direction };
  }

  dayTemplateContext(
    day: NeuralCalendarDay,
  ): NeuralDatePickerDayTemplateContext {
    return {
      $implicit: day,
      day,
      selected: this.isSelected(day),
      active: this.isActive(day),
      disabled: this.isDayUnavailable(day),
      rangeStart: this.isRangeStart(day),
      rangeMiddle: this.isRangeMiddle(day),
      rangeEnd: this.isRangeEnd(day),
      rangePreview: this.isRangePreview(day),
      ariaLabel: this.dayAriaLabel(day),
    };
  }

  headerTemplateContext(): NeuralDatePickerHeaderTemplateContext {
    return {
      $implicit: this.viewDate(),
      viewDate: this.viewDate(),
      view: this.calendarView(),
      title: this.viewAnnouncement(),
      previousDisabled: this.headerNavigationDisabled('previous'),
      nextDisabled: this.headerNavigationDisabled('next'),
      navigate: (amount) => this.navigateHeader(amount),
      showDays: () => this.setCalendarView('days'),
      showMonths: () => this.toggleMonthView(),
      showYears: () => this.toggleYearView(),
    };
  }

  footerTemplateContext(): NeuralDatePickerFooterTemplateContext {
    return {
      $implicit: this.resolvedFooterActions(),
      actions: this.resolvedFooterActions(),
      canApply: this.canApply(),
      todayDisabled: this.todayDisabled(),
      selectToday: () => this.selectToday(),
      clear: () => this.clearFromFooter(),
      apply: () => this.applySelection(),
      cancel: () => this.cancelSelection(),
    };
  }

  private headerNavigationDisabled(direction: 'previous' | 'next'): boolean {
    if (this.calendarView() === 'days') {
      return direction === 'previous'
        ? this.previousMonthDisabled()
        : this.nextMonthDisabled();
    }
    if (this.calendarView() === 'months') {
      return direction === 'previous'
        ? this.previousYearDisabled()
        : this.nextYearDisabled();
    }
    return direction === 'previous'
      ? this.previousYearsDisabled()
      : this.nextYearsDisabled();
  }

  dayAriaLabel(day: NeuralCalendarDay): string {
    return new Intl.DateTimeFormat(this.resolvedLocale().code, {
      dateStyle: 'full',
      calendar: 'gregory',
      timeZone: 'UTC',
    }).format(toNativeDate(day.date, 'utc'));
  }

  timePartValue(field: NeuralTimeField): string {
    const time = this.draftTime();
    const value =
      field === 'hour'
        ? this.hourFormat() === 12
          ? time.hour % 12 || 12
          : time.hour
        : time[field];
    return String(value).padStart(2, '0');
  }

  timePartLabel(field: NeuralTimeField): string {
    return {
      hour: this.hourLabel(),
      minute: this.minuteLabel(),
      second: this.secondLabel(),
    }[field];
  }

  timePeriod(): 'AM' | 'PM' {
    return this.draftTime().hour < 12 ? 'AM' : 'PM';
  }

  handleTimeInput(event: Event, field: NeuralTimeField): void {
    if (this.interactionBlocked()) return;
    const input = event.currentTarget as HTMLInputElement;
    const rawInput = input.value;
    const sanitized = rawInput.replace(/\D/g, '').slice(0, 2);
    if (rawInput !== sanitized) {
      this.invalidInput.emit({ field, input: rawInput, reason: 'format' });
    }
    input.value = sanitized;
    if (sanitized === '') return;
    const value = Number(sanitized);
    if (this.isValidTimePart(field, value)) {
      this.setTimePart(field, value, 'keyboard');
    }
  }

  commitTimeInput(event: Event, field: NeuralTimeField): void {
    if (this.interactionBlocked()) return;
    const input = event.currentTarget as HTMLInputElement;
    const value = Number(input.value);
    if (!this.isValidTimePart(field, value)) {
      this.invalidInput.emit({
        field,
        input: input.value,
        reason: Number.isFinite(value) ? 'range' : 'format',
      });
      input.value = this.timePartValue(field);
      input.setAttribute('aria-invalid', 'true');
      return;
    }
    input.removeAttribute('aria-invalid');
    this.setTimePart(field, value, 'keyboard');
    input.value = this.timePartValue(field);
  }

  handleTimeKeydown(event: KeyboardEvent, field: NeuralTimeField): void {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.adjustTime(field, event.key === 'ArrowUp' ? 1 : -1);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const input = event.currentTarget as HTMLInputElement;
      const value = Number(input.value);
      if (!this.isValidTimePart(field, value)) {
        this.commitTimeInput(event, field);
        return;
      }
      this.setTimePart(field, value, 'keyboard');
      if (this.canApply()) this.applySelection('keyboard');
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelSelection();
      return;
    }
    if (
      event.key.length === 1 &&
      !/\d/.test(event.key) &&
      !event.ctrlKey &&
      !event.metaKey
    ) {
      event.preventDefault();
    }
  }

  adjustTime(field: NeuralTimeField, direction: -1 | 1): void {
    const time = this.draftTime();
    const result =
      field === 'hour'
        ? addNeuralMinutes(time, direction * this.resolvedHourStep() * 60)
        : field === 'minute'
          ? addNeuralMinutes(time, direction * this.resolvedMinuteStep())
          : addNeuralSeconds(time, direction * this.resolvedSecondStep());
    this.updateDraftTime(result.time, 'keyboard');
  }

  togglePeriod(): void {
    const time = this.draftTime();
    const hour = time.hour < 12 ? time.hour + 12 : time.hour - 12;
    this.updateDraftTime(
      createNeuralTime(hour, time.minute, time.second, time.millisecond),
      'pointer',
    );
  }

  private selectDate(
    date: NeuralDateParts,
    source: NeuralDatePickerInteractionSource,
  ): void {
    if (this.pickerMode() === 'datetime') {
      const time = this.clampTimeForDate(date, this.draftTime());
      const next = createNeuralDateTime(date, time);
      if (!this.isDateTimeAvailable(next)) return;
      this.draftTime.set(time);
      this.draftValue.set(next);
      this.hoverDate.set(null);
      this.activeDate.set(date);
      this.focusTimeInput();
      return;
    }
    const next = this.nextSelection(date);
    if (next === null) return;
    const complete = isCompleteSelection(next);
    this.draftValue.set(clonePickerValue(next));
    this.hoverDate.set(null);
    this.activeDate.set(date);

    if (!this.deferredSelection()) {
      this.commitSelection(next, source);
    }

    if (
      complete &&
      this.effectiveCloseOnSelect() &&
      !this.deferredSelection()
    ) {
      this.hideAndRestoreFocus();
    }
  }

  private nextSelection(date: NeuralDateParts): NeuralDatePickerAnyValue {
    const current = this.effectiveSelection();
    if (this.selectionMode() === 'multiple') {
      const selected = Array.isArray(current) ? current : [];
      const exists = selected.some((item) => isSameNeuralDate(item, date));
      return exists
        ? selected.filter((item) => !isSameNeuralDate(item, date))
        : [...selected, date];
    }

    if (this.selectionMode() === 'range') {
      if (isDateRange(current) && current.start && !current.end) {
        return normalizeNeuralDateRange(current.start, date);
      }
      return Object.freeze({ start: date, end: null });
    }

    return date;
  }

  private commitSelection(
    next: Exclude<NeuralDatePickerAnyValue, null>,
    source: NeuralDatePickerInteractionSource,
  ): void {
    const previousValue = this.value();
    const typedValue = clonePickerValue(next) as NeuralDateSelectionValue<
      TMode,
      TPickerMode
    >;
    this.value.set(typedValue);
    const event = {
      value: typedValue,
      previousValue,
      source,
      complete: isCompleteSelection(next),
    } as NeuralDatePickerChange<TMode, TPickerMode>;
    this.selectionChange.emit(event);
    this.selected.emit(event);
  }

  private visibleRange(): NeuralDateRange | null {
    const value = this.effectiveSelection();
    if (!isDateRange(value)) return null;
    const hover = this.hoverDate();
    if (value.start && !value.end && hover) {
      return normalizeNeuralDateRange(value.start, hover);
    }
    return value;
  }

  private isDateUnavailable(date: NeuralDateParts): boolean {
    const min = this.calendarMinDate();
    const max = this.calendarMaxDate();
    const minDateTime = this.minDateTime();
    const maxDateTime = this.maxDateTime();
    return (
      (min !== null && compareNeuralDates(date, min) < 0) ||
      (max !== null && compareNeuralDates(date, max) > 0) ||
      (minDateTime !== null &&
        compareNeuralDates(date, minDateTime.date) < 0) ||
      (maxDateTime !== null &&
        compareNeuralDates(date, maxDateTime.date) > 0) ||
      this.disabledDates().some((item) => isSameNeuralDate(item, date)) ||
      this.disabledDays().includes(getNeuralDayOfWeek(date)) ||
      (this.isDateDisabled()?.(date) ?? false) ||
      !(this.dateFilter()?.(date) ?? true)
    );
  }

  private isValidTimePart(field: NeuralTimeField, value: number): boolean {
    if (!Number.isInteger(value)) return false;
    if (field === 'hour') {
      return this.hourFormat() === 12
        ? value >= 1 && value <= 12
        : value >= 0 && value <= 23;
    }
    return value >= 0 && value <= 59;
  }

  private setTimePart(
    field: NeuralTimeField,
    value: number,
    source: NeuralDatePickerInteractionSource,
  ): void {
    if (!this.isValidTimePart(field, value)) return;
    const current = this.draftTime();
    let hour = current.hour;
    let minute = current.minute;
    let second = current.second;
    if (field === 'hour') {
      hour =
        this.hourFormat() === 12
          ? (value % 12) + (current.hour >= 12 ? 12 : 0)
          : value;
    } else if (field === 'minute') {
      minute = value;
    } else {
      second = value;
    }
    this.updateDraftTime(
      createNeuralTime(hour, minute, second, current.millisecond),
      source,
    );
  }

  private updateDraftTime(
    time: NeuralTimeParts,
    source: NeuralDatePickerInteractionSource,
  ): void {
    if (this.pickerMode() === 'time') {
      if (!this.isTimeAvailable(time, this.resolvedToday())) return;
      this.draftTime.set(time);
      this.draftValue.set(time);
      return;
    }
    const date =
      selectionSeed(this.draftValue()) ??
      selectionSeed(this.value()) ??
      this.activeDate();
    const next = createNeuralDateTime(date, time);
    if (!this.isDateTimeAvailable(next)) return;
    this.draftTime.set(time);
    this.draftValue.set(next);
    if (!this.deferredSelection()) this.commitSelection(next, source);
  }

  private isTimeAvailable(
    time: NeuralTimeParts,
    date: NeuralDateParts,
  ): boolean {
    if (this.pickerMode() === 'datetime') {
      return this.isDateTimeAvailable(createNeuralDateTime(date, time));
    }
    const min = this.minDateTime();
    const max = this.maxDateTime();
    return (
      (min === null || compareNeuralTimes(time, min.time) >= 0) &&
      (max === null || compareNeuralTimes(time, max.time) <= 0)
    );
  }

  private isDateTimeAvailable(value: NeuralDateTimeParts): boolean {
    const min = this.minDateTime();
    const max = this.maxDateTime();
    return (
      !this.isDateUnavailable(value.date) &&
      (min === null || compareNeuralDateTimes(value, min) >= 0) &&
      (max === null || compareNeuralDateTimes(value, max) <= 0)
    );
  }

  private clampTimeForDate(
    date: NeuralDateParts,
    time: NeuralTimeParts,
  ): NeuralTimeParts {
    const min = this.minDateTime();
    const max = this.maxDateTime();
    if (
      min &&
      compareNeuralDates(date, min.date) === 0 &&
      compareNeuralTimes(time, min.time) < 0
    ) {
      return min.time;
    }
    if (
      max &&
      compareNeuralDates(date, max.date) === 0 &&
      compareNeuralTimes(time, max.time) > 0
    ) {
      return max.time;
    }
    return time;
  }

  private isValueAvailable(value: NeuralDatePickerAnyValue): boolean {
    if (isTimeParts(value)) {
      return this.isTimeAvailable(value, this.resolvedToday());
    }
    if (isDateTimeParts(value)) return this.isDateTimeAvailable(value);
    if (isDateParts(value)) return !this.isDateUnavailable(value);
    return true;
  }

  private currentTime(): NeuralTimeParts {
    const now = new Date();
    return createNeuralTime(
      now.getHours(),
      now.getMinutes(),
      this.showSeconds() ? now.getSeconds() : 0,
    );
  }

  private formatSelection(value: NeuralDatePickerAnyValue): string {
    if (isDateParts(value)) return this.formatDate(value);
    if (isTimeParts(value)) return this.formatTime(value);
    if (isDateTimeParts(value)) {
      return `${this.formatDate(value.date)} ${this.formatTime(value.time)}`;
    }
    if (Array.isArray(value)) {
      return value.map((date) => this.formatDate(date)).join(', ');
    }
    if (isDateRange(value)) {
      const start = value.start ? this.formatDate(value.start) : '';
      const end = value.end ? this.formatDate(value.end) : '…';
      return start ? `${start} – ${end}` : '';
    }
    return '';
  }

  private formatDate(value: NeuralDateParts): string {
    return formatNeuralLocaleDate(value, this.resolvedLocale().code);
  }

  private formatTime(value: NeuralTimeParts): string {
    const reference = new Date(
      Date.UTC(2024, 0, 1, value.hour, value.minute, value.second),
    );
    return new Intl.DateTimeFormat(this.resolvedLocale().code, {
      hour: '2-digit',
      minute: '2-digit',
      second: this.showSeconds() ? '2-digit' : undefined,
      hour12: this.hourFormat() === 12,
      timeZone: 'UTC',
    }).format(reference);
  }

  private prepareCalendar(): void {
    const current = clonePickerValue(this.value());
    const seed = selectionSeed(current) ?? this.resolvedToday();
    this.draftTime.set(selectionTime(current) ?? this.currentTime());
    this.draftValue.set(current);
    this.hoverDate.set(null);
    this.calendarView.set('days');
    this.viewDate.set(createNeuralDate(seed.year, seed.month, 1));
    this.activeDate.set(seed);
  }

  private hideAndRestoreFocus(): void {
    this.hide();
    this.dateInput().nativeElement.focus({ preventScroll: true });
  }

  private setViewYear(
    year: number,
    targetView: 'days' | 'months' | 'years',
  ): void {
    const current = this.viewDate();
    const min = this.calendarMinDate();
    const max = this.calendarMaxDate();
    const month =
      min && year === min.year && current.month < min.month
        ? min.month
        : max && year === max.year && current.month > max.month
          ? max.month
          : current.month;
    const day = Math.min(
      this.activeDate().day,
      getNeuralDaysInMonth(year, month),
    );
    this.updateVisibleDate(createNeuralDate(year, month, 1));
    this.activeDate.set(createNeuralDate(year, month, day));
    this.setCalendarView(targetView);
    if (targetView === 'months') this.focusActiveMonth();
    else if (targetView === 'years') this.focusYearInput();
    else this.focusActiveDay();
  }

  private focusYearInput(): void {
    afterNextRender(
      () => {
        const input = this.yearInputElement()?.nativeElement;
        input?.focus({ preventScroll: true });
        input?.select();
      },
      { injector: this.injector },
    );
  }

  private focusTimeInput(): void {
    afterNextRender(
      () => this.timeInputs()[0]?.nativeElement.focus({ preventScroll: true }),
      { injector: this.injector },
    );
  }

  private moveActiveDate(next: NeuralDateParts): void {
    const min = this.calendarMinDate();
    const max = this.calendarMaxDate();
    if (min && compareNeuralDates(next, min) < 0) return;
    if (max && compareNeuralDates(next, max) > 0) return;
    this.activeDate.set(next);
    const view = this.viewDate();
    if (next.year !== view.year || next.month !== view.month) {
      this.updateVisibleDate(createNeuralDate(next.year, next.month, 1));
    }
    this.focusActiveDay();
  }

  private firstEnabledDateInView(view: NeuralDateParts): NeuralDateParts {
    return (
      this.calendar().days.find(
        (day) =>
          !day.disabled &&
          day.date.year === view.year &&
          day.date.month === view.month,
      )?.date ?? view
    );
  }

  private setCalendarView(view: NeuralDatePickerView): void {
    const previousView = this.calendarView();
    if (view === previousView) return;
    this.calendarView.set(view);
    this.viewChanged.emit({ view, previousView });
  }

  private updateVisibleDate(date: NeuralDateParts): void {
    const previous = this.viewDate();
    if (isSameNeuralDate(previous, date)) return;
    this.viewDate.set(date);
    if (previous.year !== date.year) {
      this.yearChanged.emit({ year: date.year, previousYear: previous.year });
    }
    if (previous.year !== date.year || previous.month !== date.month) {
      this.monthChanged.emit({
        month: date.month,
        year: date.year,
        previousMonth: previous.month,
        previousYear: previous.year,
      });
    }
  }

  private compose(
    structural: string,
    base: string,
    ...custom: unknown[]
  ): string {
    return [structural, this.effectiveUnstyled() ? '' : base, ...custom]
      .filter((part): part is string => typeof part === 'string')
      .flatMap((part) => part.split(/\s+/))
      .filter(Boolean)
      .filter((part, index, list) => list.indexOf(part) === index)
      .join(' ');
  }
}

/** @deprecated Import and use `NeuralDatePicker` instead. */
export { NeuralDatePicker as DatePickerComponent };

function normalizeIconClass(iconClass: string): string {
  const normalized = iconClass.trim();
  if (!normalized) return '';
  return normalized.split(/\s+/).includes('nt')
    ? normalized
    : `nt ${normalized}`;
}

type NeuralTimeField = 'hour' | 'minute' | 'second';

function normalizeStep(value: number, maximum: number): number {
  return Number.isInteger(value) && value > 0 ? Math.min(value, maximum) : 1;
}

function laterDate(
  left: NeuralDateParts | null,
  right: NeuralDateParts | null,
): NeuralDateParts | null {
  if (!left) return right;
  if (!right) return left;
  return compareNeuralDates(left, right) >= 0 ? left : right;
}

function earlierDate(
  left: NeuralDateParts | null,
  right: NeuralDateParts | null,
): NeuralDateParts | null {
  if (!left) return right;
  if (!right) return left;
  return compareNeuralDates(left, right) <= 0 ? left : right;
}

function isDateParts(value: unknown): value is NeuralDateParts {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    'year' in value &&
    'month' in value &&
    'day' in value
  );
}

function isTimeParts(value: unknown): value is NeuralTimeParts {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    'hour' in value &&
    'minute' in value &&
    'second' in value &&
    'millisecond' in value
  );
}

function isDateTimeParts(value: unknown): value is NeuralDateTimeParts {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    'date' in value &&
    'time' in value &&
    isDateParts(value.date) &&
    isTimeParts(value.time)
  );
}

function isDateRange(value: unknown): value is NeuralDateRange {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    'start' in value &&
    'end' in value
  );
}

function isIncompleteRange(value: unknown): value is NeuralDateRange {
  return isDateRange(value) && value.start !== null && value.end === null;
}

function isCompleteSelection(value: NeuralDatePickerAnyValue): boolean {
  return !isIncompleteRange(value);
}

function selectionSeed(
  value: NeuralDatePickerAnyValue,
): NeuralDateParts | null {
  if (isDateParts(value)) return value;
  if (isDateTimeParts(value)) return value.date;
  if (Array.isArray(value)) return value[value.length - 1] ?? null;
  if (isDateRange(value)) return value.end ?? value.start;
  return null;
}

function selectionTime(
  value: NeuralDatePickerAnyValue,
): NeuralTimeParts | null {
  if (isTimeParts(value)) return value;
  if (isDateTimeParts(value)) return value.time;
  return null;
}

function clonePickerValue<TValue extends NeuralDatePickerAnyValue>(
  value: TValue,
): TValue {
  if (isDateTimeParts(value)) {
    return createNeuralDateTime(value.date, value.time) as TValue;
  }
  if (isTimeParts(value)) {
    return createNeuralTime(
      value.hour,
      value.minute,
      value.second,
      value.millisecond,
    ) as TValue;
  }
  if (isDateParts(value)) {
    return createNeuralDate(value.year, value.month, value.day) as TValue;
  }
  if (Array.isArray(value)) {
    return Object.freeze(
      value.map((date) => createNeuralDate(date.year, date.month, date.day)),
    ) as TValue;
  }
  if (isDateRange(value)) {
    return Object.freeze({
      start: value.start
        ? createNeuralDate(value.start.year, value.start.month, value.start.day)
        : null,
      end: value.end
        ? createNeuralDate(value.end.year, value.end.month, value.end.day)
        : null,
    }) as TValue;
  }
  return value;
}
