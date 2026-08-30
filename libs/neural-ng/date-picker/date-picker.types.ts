export type NeuralDatePickerMode =
  | 'date'
  | 'month'
  | 'year'
  | 'time'
  | 'datetime';

export type NeuralDateSelectionMode = 'single' | 'range' | 'multiple';

export type NeuralDatePickerUnitValue<
  TPickerMode extends NeuralDatePickerMode = 'date',
> = TPickerMode extends 'time'
  ? NeuralTimeParts
  : TPickerMode extends 'datetime'
    ? NeuralDateTimeParts
    : NeuralDateParts;

export type NeuralDateSelectionValue<
  TMode extends NeuralDateSelectionMode = 'single',
  TPickerMode extends NeuralDatePickerMode = 'date',
> = TPickerMode extends 'time' | 'datetime'
  ? NeuralDatePickerUnitValue<TPickerMode>
  : TMode extends 'range'
    ? NeuralDateRange<NeuralDateParts>
    : TMode extends 'multiple'
      ? readonly NeuralDateParts[]
      : NeuralDateParts;

export type NeuralDatePickerValue<
  TMode extends NeuralDateSelectionMode = 'single',
  TPickerMode extends NeuralDatePickerMode = 'date',
> = NeuralDateSelectionValue<TMode, TPickerMode> | null;

export type NeuralDatePickerAnyValue =
  | NeuralDateParts
  | NeuralTimeParts
  | NeuralDateTimeParts
  | NeuralDateRange
  | readonly NeuralDateParts[]
  | null;

export type NeuralDatePickerFooterAction =
  | 'today'
  | 'clear'
  | 'cancel'
  | 'apply';

export type NeuralDayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type NeuralNativeDateZone = 'local' | 'utc';

export interface NeuralDateParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

export interface NeuralTimeParts {
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
  readonly millisecond: number;
}

export interface NeuralDateTimeParts {
  readonly date: NeuralDateParts;
  readonly time: NeuralTimeParts;
}

export interface NeuralDateRange<TDate = NeuralDateParts> {
  readonly start: TDate | null;
  readonly end: TDate | null;
}

export interface NeuralCalendarDay {
  readonly date: NeuralDateParts;
  readonly key: string;
  readonly dayOfWeek: NeuralDayOfWeek;
  readonly outsideMonth: boolean;
  readonly today: boolean;
  readonly disabled: boolean;
}

export interface NeuralCalendarMonth {
  readonly year: number;
  readonly month: number;
  readonly days: readonly NeuralCalendarDay[];
  readonly weeks: readonly (readonly NeuralCalendarDay[])[];
}

export type NeuralDateDisabledPredicate = (date: NeuralDateParts) => boolean;

export type NeuralDateFilter = (date: NeuralDateParts) => boolean;

export interface NeuralCalendarMonthOptions {
  readonly firstDayOfWeek?: NeuralDayOfWeek;
  readonly fixedWeeks?: boolean;
  readonly today?: NeuralDateParts | null;
  readonly minDate?: NeuralDateParts | null;
  readonly maxDate?: NeuralDateParts | null;
  readonly disabledDates?: readonly NeuralDateParts[];
  readonly disabledDays?: readonly NeuralDayOfWeek[];
  readonly isDateDisabled?: NeuralDateDisabledPredicate;
}

export interface NeuralTimeStepResult {
  readonly time: NeuralTimeParts;
  readonly dayOffset: number;
}

export type NeuralDatePickerInteractionSource = 'keyboard' | 'pointer';

export type NeuralDatePickerView = 'days' | 'months' | 'years';

export interface NeuralDatePickerChange<
  TMode extends NeuralDateSelectionMode = 'single',
  TPickerMode extends NeuralDatePickerMode = 'date',
> {
  readonly value: NeuralDateSelectionValue<TMode, TPickerMode>;
  readonly previousValue: NeuralDatePickerValue<TMode, TPickerMode>;
  readonly source: NeuralDatePickerInteractionSource;
  readonly complete: boolean;
}

export interface NeuralDatePickerClear<
  TMode extends NeuralDateSelectionMode = 'single',
  TPickerMode extends NeuralDatePickerMode = 'date',
> {
  readonly previousValue: NeuralDateSelectionValue<TMode, TPickerMode>;
}

export interface NeuralDatePickerViewChange {
  readonly view: NeuralDatePickerView;
  readonly previousView: NeuralDatePickerView;
}

export interface NeuralDatePickerMonthChange {
  readonly month: number;
  readonly year: number;
  readonly previousMonth: number;
  readonly previousYear: number;
}

export interface NeuralDatePickerYearChange {
  readonly year: number;
  readonly previousYear: number;
}

export type NeuralDatePickerInvalidField =
  | 'date'
  | 'year'
  | 'hour'
  | 'minute'
  | 'second';

export interface NeuralDatePickerInvalidInput {
  readonly field: NeuralDatePickerInvalidField;
  readonly input: string;
  readonly reason: 'format' | 'range';
}

export interface NeuralDatePickerClasses {
  readonly root?: string;
  readonly inputGroup?: string;
  readonly input?: string;
  /** Alias for triggerButton. Both are merged when provided. */
  readonly trigger?: string;
  readonly triggerButton?: string;
  readonly triggerIcon?: string;
  readonly clearButton?: string;
  readonly clearIcon?: string;
  readonly panel?: string;
  readonly calendar?: string;
  readonly announcement?: string;
  readonly header?: string;
  readonly title?: string;
  readonly monthLabel?: string;
  readonly yearToggle?: string;
  readonly monthToggle?: string;
  readonly navigationButton?: string;
  readonly navigationIcon?: string;
  readonly monthView?: string;
  readonly monthGrid?: string;
  readonly month?: string;
  readonly selectedMonth?: string;
  readonly disabledMonth?: string;
  readonly yearView?: string;
  readonly yearInput?: string;
  readonly yearGrid?: string;
  readonly year?: string;
  readonly selectedYear?: string;
  readonly disabledYear?: string;
  readonly weekdays?: string;
  readonly weekday?: string;
  readonly grid?: string;
  readonly week?: string;
  readonly weekNumberHeader?: string;
  readonly weekNumber?: string;
  readonly otherMonthPlaceholder?: string;
  readonly day?: string;
  readonly outsideDay?: string;
  readonly today?: string;
  readonly selectedDay?: string;
  readonly disabledDay?: string;
  readonly rangeStartDay?: string;
  readonly rangeEndDay?: string;
  readonly rangeDay?: string;
  /** Short aliases retained alongside the explicit day slot names. */
  readonly rangeStart?: string;
  readonly rangeMiddle?: string;
  readonly rangeEnd?: string;
  readonly rangePreviewDay?: string;
  readonly timePicker?: string;
  readonly timeGroup?: string;
  readonly timeField?: string;
  readonly timeLabel?: string;
  readonly timeInput?: string;
  readonly timeSeparator?: string;
  readonly periodButton?: string;
  readonly footer?: string;
  readonly footerAction?: string;
  readonly todayAction?: string;
  readonly clearAction?: string;
  readonly cancelAction?: string;
  readonly applyAction?: string;
}
