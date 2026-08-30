import type {
  NeuralCalendarDay,
  NeuralCalendarMonth,
  NeuralCalendarMonthOptions,
  NeuralDateParts,
  NeuralDateRange,
  NeuralDateTimeParts,
  NeuralDayOfWeek,
  NeuralNativeDateZone,
  NeuralTimeParts,
  NeuralTimeStepResult,
} from './date-picker.types';

const MIN_YEAR = 1;
const MAX_YEAR = 9999;
const DAYS_PER_WEEK = 7;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const FIXED_CALENDAR_DAYS = 42;
const MINUTES_PER_DAY = 24 * 60;

export function createNeuralDate(
  year: number,
  month: number,
  day: number,
): NeuralDateParts {
  const date = { year, month, day };
  assertNeuralDate(date);
  return Object.freeze(date);
}

export function createNeuralTime(
  hour: number,
  minute = 0,
  second = 0,
  millisecond = 0,
): NeuralTimeParts {
  const time = { hour, minute, second, millisecond };
  assertNeuralTime(time);
  return Object.freeze(time);
}

export function createNeuralDateTime(
  date: NeuralDateParts,
  time: NeuralTimeParts,
): NeuralDateTimeParts {
  assertNeuralDate(date);
  assertNeuralTime(time);
  return Object.freeze({
    date: copyDate(date),
    time: copyTime(time),
  });
}

export function isValidNeuralDate(
  date: NeuralDateParts | null | undefined,
): date is NeuralDateParts {
  return (
    date != null &&
    isIntegerInRange(date.year, MIN_YEAR, MAX_YEAR) &&
    isIntegerInRange(date.month, 1, 12) &&
    isIntegerInRange(date.day, 1, daysInMonthUnchecked(date.year, date.month))
  );
}

export function isValidNeuralTime(
  time: NeuralTimeParts | null | undefined,
): time is NeuralTimeParts {
  return (
    time != null &&
    isIntegerInRange(time.hour, 0, 23) &&
    isIntegerInRange(time.minute, 0, 59) &&
    isIntegerInRange(time.second, 0, 59) &&
    isIntegerInRange(time.millisecond, 0, 999)
  );
}

export function isNeuralLeapYear(year: number): boolean {
  assertYear(year);
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function getNeuralDaysInMonth(year: number, month: number): number {
  assertYear(year);
  assertMonth(month);
  return daysInMonthUnchecked(year, month);
}

export function getNeuralDayOfWeek(date: NeuralDateParts): NeuralDayOfWeek {
  assertNeuralDate(date);
  return createUtcDate(date).getUTCDay() as NeuralDayOfWeek;
}

export function getNeuralIsoWeekNumber(date: NeuralDateParts): number {
  assertNeuralDate(date);
  const dayOfWeek = getNeuralDayOfWeek(date) || 7;
  const thursday = addNeuralDays(date, 4 - dayOfWeek);
  const firstDayOfIsoYear = createNeuralDate(thursday.year, 1, 1);
  return (
    Math.floor(
      (toDateOrdinal(thursday) - toDateOrdinal(firstDayOfIsoYear)) /
        (DAYS_PER_WEEK * MILLISECONDS_PER_DAY),
    ) + 1
  );
}

export function compareNeuralDates(
  left: NeuralDateParts,
  right: NeuralDateParts,
): -1 | 0 | 1 {
  assertNeuralDate(left);
  assertNeuralDate(right);
  const leftOrdinal = toDateOrdinal(left);
  const rightOrdinal = toDateOrdinal(right);
  return leftOrdinal === rightOrdinal ? 0 : leftOrdinal < rightOrdinal ? -1 : 1;
}

export function compareNeuralTimes(
  left: NeuralTimeParts,
  right: NeuralTimeParts,
): -1 | 0 | 1 {
  assertNeuralTime(left);
  assertNeuralTime(right);
  const leftMilliseconds = toTimeMilliseconds(left);
  const rightMilliseconds = toTimeMilliseconds(right);
  return leftMilliseconds === rightMilliseconds
    ? 0
    : leftMilliseconds < rightMilliseconds
      ? -1
      : 1;
}

export function compareNeuralDateTimes(
  left: NeuralDateTimeParts,
  right: NeuralDateTimeParts,
): -1 | 0 | 1 {
  const dateComparison = compareNeuralDates(left.date, right.date);
  return dateComparison === 0
    ? compareNeuralTimes(left.time, right.time)
    : dateComparison;
}

export function isSameNeuralDate(
  left: NeuralDateParts | null | undefined,
  right: NeuralDateParts | null | undefined,
): boolean {
  return (
    left != null &&
    right != null &&
    left.year === right.year &&
    left.month === right.month &&
    left.day === right.day
  );
}

export function addNeuralDays(
  date: NeuralDateParts,
  amount: number,
): NeuralDateParts {
  assertNeuralDate(date);
  assertInteger(amount, 'Day amount');
  const nativeDate = createUtcDate(date);
  nativeDate.setUTCDate(nativeDate.getUTCDate() + amount);
  return fromUtcDate(nativeDate);
}

export function addNeuralMonths(
  date: NeuralDateParts,
  amount: number,
): NeuralDateParts {
  assertNeuralDate(date);
  assertInteger(amount, 'Month amount');
  const absoluteMonth = date.year * 12 + date.month - 1 + amount;
  const year = Math.floor(absoluteMonth / 12);
  const month = positiveModulo(absoluteMonth, 12) + 1;
  assertYear(year);
  return createNeuralDate(
    year,
    month,
    Math.min(date.day, getNeuralDaysInMonth(year, month)),
  );
}

export function addNeuralYears(
  date: NeuralDateParts,
  amount: number,
): NeuralDateParts {
  assertNeuralDate(date);
  assertInteger(amount, 'Year amount');
  const year = date.year + amount;
  assertYear(year);
  return createNeuralDate(
    year,
    date.month,
    Math.min(date.day, getNeuralDaysInMonth(year, date.month)),
  );
}

export function addNeuralMinutes(
  time: NeuralTimeParts,
  amount: number,
): NeuralTimeStepResult {
  assertNeuralTime(time);
  assertInteger(amount, 'Minute amount');
  const totalMinutes = time.hour * 60 + time.minute + amount;
  const dayOffset = Math.floor(totalMinutes / MINUTES_PER_DAY);
  const minuteOfDay = positiveModulo(totalMinutes, MINUTES_PER_DAY);
  return Object.freeze({
    time: createNeuralTime(
      Math.floor(minuteOfDay / 60),
      minuteOfDay % 60,
      time.second,
      time.millisecond,
    ),
    dayOffset,
  });
}

export function addNeuralSeconds(
  time: NeuralTimeParts,
  amount: number,
): NeuralTimeStepResult {
  assertNeuralTime(time);
  assertInteger(amount, 'Second amount');
  const secondsPerDay = 24 * 60 * 60;
  const totalSeconds =
    time.hour * 60 * 60 + time.minute * 60 + time.second + amount;
  const dayOffset = Math.floor(totalSeconds / secondsPerDay);
  const secondOfDay = positiveModulo(totalSeconds, secondsPerDay);
  return Object.freeze({
    time: createNeuralTime(
      Math.floor(secondOfDay / 3600),
      Math.floor((secondOfDay % 3600) / 60),
      secondOfDay % 60,
      time.millisecond,
    ),
    dayOffset,
  });
}

export function clampNeuralDate(
  date: NeuralDateParts,
  minDate: NeuralDateParts | null = null,
  maxDate: NeuralDateParts | null = null,
): NeuralDateParts {
  assertNeuralDate(date);
  assertOrderedBounds(minDate, maxDate);
  if (minDate && compareNeuralDates(date, minDate) < 0) {
    return copyDate(minDate);
  }
  if (maxDate && compareNeuralDates(date, maxDate) > 0) {
    return copyDate(maxDate);
  }
  return copyDate(date);
}

export function clampNeuralTime(
  time: NeuralTimeParts,
  minTime: NeuralTimeParts | null = null,
  maxTime: NeuralTimeParts | null = null,
): NeuralTimeParts {
  assertNeuralTime(time);
  if (minTime) assertNeuralTime(minTime);
  if (maxTime) assertNeuralTime(maxTime);
  if (minTime && maxTime && compareNeuralTimes(minTime, maxTime) > 0) {
    throw new RangeError('Minimum time cannot be after maximum time.');
  }
  if (minTime && compareNeuralTimes(time, minTime) < 0) {
    return copyTime(minTime);
  }
  if (maxTime && compareNeuralTimes(time, maxTime) > 0) {
    return copyTime(maxTime);
  }
  return copyTime(time);
}

export function normalizeNeuralDateRange(
  start: NeuralDateParts | null,
  end: NeuralDateParts | null,
): NeuralDateRange {
  if (start) assertNeuralDate(start);
  if (end) assertNeuralDate(end);
  if (start && end && compareNeuralDates(start, end) > 0) {
    return Object.freeze({ start: copyDate(end), end: copyDate(start) });
  }
  return Object.freeze({
    start: start ? copyDate(start) : null,
    end: end ? copyDate(end) : null,
  });
}

export function isNeuralDateInRange(
  date: NeuralDateParts,
  range: NeuralDateRange,
  inclusive = true,
): boolean {
  assertNeuralDate(date);
  if (!range.start || !range.end) return false;
  const normalized = normalizeNeuralDateRange(range.start, range.end);
  const { start, end } = normalized;
  if (!start || !end) return false;
  const startComparison = compareNeuralDates(date, start);
  const endComparison = compareNeuralDates(date, end);
  return inclusive
    ? startComparison >= 0 && endComparison <= 0
    : startComparison > 0 && endComparison < 0;
}

export function toNeuralIsoDate(date: NeuralDateParts): string {
  assertNeuralDate(date);
  return `${pad(date.year, 4)}-${pad(date.month, 2)}-${pad(date.day, 2)}`;
}

export function parseNeuralIsoDate(value: string): NeuralDateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const date = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
  return isValidNeuralDate(date) ? Object.freeze(date) : null;
}

export function formatNeuralLocaleDate(
  date: NeuralDateParts,
  locale: string | readonly string[],
): string {
  assertNeuralDate(date);
  return createLocaleDateFormatter(locale).format(toNativeDate(date, 'utc'));
}

export function parseNeuralLocaleDate(
  value: string,
  locale: string | readonly string[],
): NeuralDateParts | null {
  const input = stripDirectionMarks(value.trim());
  if (!input) return null;

  const formatter = createLocaleDateFormatter(locale);
  const reference = toNativeDate(createNeuralDate(2006, 11, 22), 'utc');
  const fields: Array<'year' | 'month' | 'day'> = [];
  const digitMap = createLocaleDigitMap(locale);
  const localizedDigits = [...digitMap.keys()].filter(
    (digit) => !/^[0-9]$/.test(digit),
  );
  const digitPattern = localizedDigits.length
    ? `[0-9${localizedDigits.map(escapeCharacterClass).join('')}]`
    : '[0-9]';
  const pattern = formatter
    .formatToParts(reference)
    .map((part) => {
      if (
        part.type === 'year' ||
        part.type === 'month' ||
        part.type === 'day'
      ) {
        fields.push(part.type);
        return `(${digitPattern}{1,${part.type === 'year' ? 4 : 2}})`;
      }
      return escapeRegularExpression(stripDirectionMarks(part.value));
    })
    .join('');
  const match = new RegExp(`^${pattern}$`, 'u').exec(input);
  if (!match || fields.length !== 3) return null;

  const parsed: Partial<Record<'year' | 'month' | 'day', number>> = {};
  fields.forEach((field, index) => {
    parsed[field] = Number(toAsciiDigits(match[index + 1] ?? '', digitMap));
  });
  const date = {
    year: parsed.year ?? 0,
    month: parsed.month ?? 0,
    day: parsed.day ?? 0,
  };
  return isValidNeuralDate(date)
    ? createNeuralDate(date.year, date.month, date.day)
    : null;
}

export function fromNativeDate(
  date: Date,
  zone: NeuralNativeDateZone = 'local',
): NeuralDateParts {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError('Native Date must be valid.');
  }
  return zone === 'utc'
    ? createNeuralDate(
        date.getUTCFullYear(),
        date.getUTCMonth() + 1,
        date.getUTCDate(),
      )
    : createNeuralDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

function createLocaleDateFormatter(
  locale: string | readonly string[],
): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(locale as string | string[], {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    calendar: 'gregory',
    timeZone: 'UTC',
  });
}

function createLocaleDigitMap(
  locale: string | readonly string[],
): ReadonlyMap<string, string> {
  const formatter = new Intl.NumberFormat(locale as string | string[], {
    useGrouping: false,
  });
  return new Map(
    Array.from({ length: 10 }, (_, digit) => [
      stripDirectionMarks(formatter.format(digit)),
      String(digit),
    ]),
  );
}

function toAsciiDigits(
  value: string,
  digitMap: ReadonlyMap<string, string>,
): string {
  return Array.from(value, (digit) => digitMap.get(digit) ?? digit).join('');
}

function stripDirectionMarks(value: string): string {
  return value.replace(/[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/gu, '');
}

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeCharacterClass(value: string): string {
  return value.replace(/[\\\]^-]/g, '\\$&');
}

export function toNativeDate(
  date: NeuralDateParts,
  zone: NeuralNativeDateZone = 'local',
): Date {
  assertNeuralDate(date);
  if (zone === 'utc') return createUtcDate(date);
  const nativeDate = new Date(0);
  nativeDate.setHours(0, 0, 0, 0);
  nativeDate.setFullYear(date.year, date.month - 1, date.day);
  return nativeDate;
}

export function buildNeuralCalendarMonth(
  year: number,
  month: number,
  options: NeuralCalendarMonthOptions = {},
): NeuralCalendarMonth {
  assertYear(year);
  assertMonth(month);
  const firstDayOfWeek = options.firstDayOfWeek ?? 0;
  assertDayOfWeek(firstDayOfWeek);
  assertOrderedBounds(options.minDate ?? null, options.maxDate ?? null);

  const firstOfMonth = createNeuralDate(year, month, 1);
  const leadingDays = positiveModulo(
    getNeuralDayOfWeek(firstOfMonth) - firstDayOfWeek,
    DAYS_PER_WEEK,
  );
  const minimumCellCount = leadingDays + getNeuralDaysInMonth(year, month);
  const cellCount =
    options.fixedWeeks === false
      ? Math.ceil(minimumCellCount / DAYS_PER_WEEK) * DAYS_PER_WEEK
      : FIXED_CALENDAR_DAYS;
  const gridStart = addNeuralDays(firstOfMonth, -leadingDays);
  const disabledDateKeys = new Set(
    (options.disabledDates ?? []).map(toNeuralIsoDate),
  );
  const disabledDays = new Set(options.disabledDays ?? []);

  const days = Object.freeze(
    Array.from({ length: cellCount }, (_, index) => {
      const date = addNeuralDays(gridStart, index);
      const dayOfWeek = getNeuralDayOfWeek(date);
      const disabled =
        (options.minDate != null &&
          compareNeuralDates(date, options.minDate) < 0) ||
        (options.maxDate != null &&
          compareNeuralDates(date, options.maxDate) > 0) ||
        disabledDateKeys.has(toNeuralIsoDate(date)) ||
        disabledDays.has(dayOfWeek) ||
        (options.isDateDisabled?.(date) ?? false);
      return Object.freeze<NeuralCalendarDay>({
        date,
        key: toNeuralIsoDate(date),
        dayOfWeek,
        outsideMonth: date.year !== year || date.month !== month,
        today: isSameNeuralDate(date, options.today),
        disabled,
      });
    }),
  );
  const weeks = Object.freeze(
    Array.from({ length: days.length / DAYS_PER_WEEK }, (_, index) =>
      Object.freeze(
        days.slice(
          index * DAYS_PER_WEEK,
          index * DAYS_PER_WEEK + DAYS_PER_WEEK,
        ),
      ),
    ),
  );

  return Object.freeze({ year, month, days, weeks });
}

function assertNeuralDate(date: NeuralDateParts): void {
  const { year, month, day } = date;
  if (!isValidNeuralDate(date)) {
    throw new RangeError(`Invalid calendar date: ${year}-${month}-${day}.`);
  }
}

function assertNeuralTime(time: NeuralTimeParts): void {
  const { hour, minute, second, millisecond } = time;
  if (!isValidNeuralTime(time)) {
    throw new RangeError(
      `Invalid clock time: ${hour}:${minute}:${second}.${millisecond}.`,
    );
  }
}

function assertOrderedBounds(
  minDate: NeuralDateParts | null,
  maxDate: NeuralDateParts | null,
): void {
  if (minDate) assertNeuralDate(minDate);
  if (maxDate) assertNeuralDate(maxDate);
  if (minDate && maxDate && compareNeuralDates(minDate, maxDate) > 0) {
    throw new RangeError('Minimum date cannot be after maximum date.');
  }
}

function assertYear(year: number): void {
  if (!isIntegerInRange(year, MIN_YEAR, MAX_YEAR)) {
    throw new RangeError(
      `Year must be an integer from ${MIN_YEAR} to ${MAX_YEAR}.`,
    );
  }
}

function assertMonth(month: number): void {
  if (!isIntegerInRange(month, 1, 12)) {
    throw new RangeError('Month must be an integer from 1 to 12.');
  }
}

function assertDayOfWeek(
  dayOfWeek: number,
): asserts dayOfWeek is NeuralDayOfWeek {
  if (!isIntegerInRange(dayOfWeek, 0, 6)) {
    throw new RangeError('First day of week must be an integer from 0 to 6.');
  }
}

function assertInteger(value: number, label: string): void {
  if (!Number.isInteger(value)) {
    throw new RangeError(`${label} must be an integer.`);
  }
}

function daysInMonthUnchecked(year: number, month: number): number {
  return month === 2
    ? year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
      ? 29
      : 28
    : month === 4 || month === 6 || month === 9 || month === 11
      ? 30
      : 31;
}

function createUtcDate(date: NeuralDateParts): Date {
  const nativeDate = new Date(0);
  nativeDate.setUTCHours(0, 0, 0, 0);
  nativeDate.setUTCFullYear(date.year, date.month - 1, date.day);
  return nativeDate;
}

function fromUtcDate(date: Date): NeuralDateParts {
  return createNeuralDate(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
  );
}

function toDateOrdinal(date: NeuralDateParts): number {
  return createUtcDate(date).getTime();
}

function toTimeMilliseconds(time: NeuralTimeParts): number {
  return (
    ((time.hour * 60 + time.minute) * 60 + time.second) * 1000 +
    time.millisecond
  );
}

function copyDate(date: NeuralDateParts): NeuralDateParts {
  return createNeuralDate(date.year, date.month, date.day);
}

function copyTime(time: NeuralTimeParts): NeuralTimeParts {
  return createNeuralTime(
    time.hour,
    time.minute,
    time.second,
    time.millisecond,
  );
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function isIntegerInRange(
  value: number,
  minimum: number,
  maximum: number,
): boolean {
  return Number.isInteger(value) && value >= minimum && value <= maximum;
}

function pad(value: number, length: number): string {
  return String(value).padStart(length, '0');
}
