import {
  addNeuralDays,
  addNeuralMinutes,
  addNeuralMonths,
  addNeuralSeconds,
  addNeuralYears,
  buildNeuralCalendarMonth,
  clampNeuralDate,
  clampNeuralTime,
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
  isNeuralDateInRange,
  isNeuralLeapYear,
  isValidNeuralDate,
  isValidNeuralTime,
  normalizeNeuralDateRange,
  parseNeuralIsoDate,
  parseNeuralLocaleDate,
  toNativeDate,
  toNeuralIsoDate,
} from './date-picker.utils';

describe('DatePicker calendar engine', () => {
  it('validates immutable plain date and time values', () => {
    const date = createNeuralDate(2024, 2, 29);
    const time = createNeuralTime(23, 59, 58, 999);

    expect(isValidNeuralDate(date)).toBe(true);
    expect(isValidNeuralTime(time)).toBe(true);
    expect(Object.isFrozen(date)).toBe(true);
    expect(Object.isFrozen(time)).toBe(true);
    expect(isValidNeuralDate({ year: 2023, month: 2, day: 29 })).toBe(false);
    expect(
      isValidNeuralTime({
        hour: 24,
        minute: 0,
        second: 0,
        millisecond: 0,
      }),
    ).toBe(false);
    expect(() => createNeuralDate(2023, 2, 29)).toThrowError(RangeError);
    expect(() => createNeuralTime(12, 60)).toThrowError(RangeError);
  });

  it('strictly parses locale date order, separators, digits and Gregorian validity', () => {
    const leapDay = createNeuralDate(2024, 2, 29);

    expect(formatNeuralLocaleDate(leapDay, 'en-US')).toBe('02/29/2024');
    expect(parseNeuralLocaleDate('02/29/2024', 'en-US')).toEqual(leapDay);
    expect(parseNeuralLocaleDate('29.02.2024', 'tr-TR')).toEqual(leapDay);
    expect(parseNeuralLocaleDate('29/02/2024', 'en-GB')).toEqual(leapDay);
    expect(parseNeuralLocaleDate('29/02/2024', 'en-US')).toBeNull();
    expect(parseNeuralLocaleDate('02/30/2024', 'en-US')).toBeNull();
    expect(parseNeuralLocaleDate('2024-02-29', 'en-US')).toBeNull();

    const arabic = formatNeuralLocaleDate(leapDay, 'ar-EG');
    expect(parseNeuralLocaleDate(arabic, 'ar-EG')).toEqual(leapDay);
  });

  it('implements Gregorian leap-year and month-length rules', () => {
    expect(isNeuralLeapYear(2000)).toBe(true);
    expect(isNeuralLeapYear(1900)).toBe(false);
    expect(isNeuralLeapYear(2024)).toBe(true);
    expect(isNeuralLeapYear(2023)).toBe(false);
    expect(getNeuralDaysInMonth(2024, 2)).toBe(29);
    expect(getNeuralDaysInMonth(2023, 2)).toBe(28);
    expect(getNeuralDaysInMonth(2024, 4)).toBe(30);
    expect(getNeuralDaysInMonth(2024, 12)).toBe(31);
    expect(isNeuralLeapYear(2100)).toBe(false);
    expect(isNeuralLeapYear(2400)).toBe(true);
    expect(getNeuralDaysInMonth(2100, 2)).toBe(28);
    expect(getNeuralDaysInMonth(2400, 2)).toBe(29);
  });

  it('navigates days, months, and years without timezone arithmetic', () => {
    expect(addNeuralDays(createNeuralDate(2024, 2, 28), 2)).toEqual({
      year: 2024,
      month: 3,
      day: 1,
    });
    expect(addNeuralDays(createNeuralDate(2024, 1, 1), -1)).toEqual({
      year: 2023,
      month: 12,
      day: 31,
    });
    expect(addNeuralMonths(createNeuralDate(2024, 1, 31), 1)).toEqual({
      year: 2024,
      month: 2,
      day: 29,
    });
    expect(addNeuralMonths(createNeuralDate(2024, 1, 31), -2)).toEqual({
      year: 2023,
      month: 11,
      day: 30,
    });
    expect(addNeuralYears(createNeuralDate(2024, 2, 29), 1)).toEqual({
      year: 2025,
      month: 2,
      day: 28,
    });
    expect(addNeuralDays(createNeuralDate(2024, 12, 31), 1)).toEqual({
      year: 2025,
      month: 1,
      day: 1,
    });
    expect(addNeuralDays(createNeuralDate(2100, 2, 28), 1)).toEqual({
      year: 2100,
      month: 3,
      day: 1,
    });
  });

  it('compares, clamps, and normalizes date ranges', () => {
    const early = createNeuralDate(2024, 3, 2);
    const middle = createNeuralDate(2024, 3, 12);
    const late = createNeuralDate(2024, 3, 20);

    expect(compareNeuralDates(early, middle)).toBe(-1);
    expect(compareNeuralDates(middle, middle)).toBe(0);
    expect(compareNeuralDates(late, middle)).toBe(1);
    expect(clampNeuralDate(early, middle, late)).toEqual(middle);
    expect(
      clampNeuralDate(createNeuralDate(2024, 3, 30), middle, late),
    ).toEqual(late);

    const range = normalizeNeuralDateRange(late, early);
    expect(range).toEqual({ start: early, end: late });
    expect(isNeuralDateInRange(middle, range)).toBe(true);
    expect(isNeuralDateInRange(early, range, false)).toBe(false);
    expect(isNeuralDateInRange(middle, { start: early, end: null })).toBe(
      false,
    );
    expect(() => clampNeuralDate(middle, late, early)).toThrowError(
      'Minimum date cannot be after maximum date.',
    );
  });

  it('round-trips strict ISO calendar dates', () => {
    const date = createNeuralDate(42, 3, 7);

    expect(toNeuralIsoDate(date)).toBe('0042-03-07');
    expect(parseNeuralIsoDate('0042-03-07')).toEqual(date);
    expect(parseNeuralIsoDate('2024-2-09')).toBeNull();
    expect(parseNeuralIsoDate('2024-02-30')).toBeNull();
    expect(parseNeuralIsoDate('not-a-date')).toBeNull();
  });

  it('converts at the native Date boundary with an explicit zone', () => {
    const utcDate = new Date(Date.UTC(2024, 2, 10, 23, 45));
    const localDate = new Date(2024, 2, 10, 23, 45);

    expect(fromNativeDate(utcDate, 'utc')).toEqual({
      year: 2024,
      month: 3,
      day: 10,
    });
    expect(fromNativeDate(localDate, 'local')).toEqual({
      year: 2024,
      month: 3,
      day: 10,
    });
    expect(
      toNativeDate(createNeuralDate(2024, 3, 10), 'utc').toISOString(),
    ).toBe('2024-03-10T00:00:00.000Z');
    expect(() => fromNativeDate(new Date(Number.NaN))).toThrowError(RangeError);
  });

  it('builds deterministic Sunday-first and Monday-first month grids', () => {
    const sundayFirst = buildNeuralCalendarMonth(2024, 3);
    const mondayFirst = buildNeuralCalendarMonth(2024, 3, {
      firstDayOfWeek: 1,
    });
    const naturalWeeks = buildNeuralCalendarMonth(2024, 3, {
      firstDayOfWeek: 1,
      fixedWeeks: false,
    });

    expect(sundayFirst.days).toHaveLength(42);
    expect(sundayFirst.weeks).toHaveLength(6);
    expect(sundayFirst.days[0]?.key).toBe('2024-02-25');
    expect(mondayFirst.days[0]?.key).toBe('2024-02-26');
    expect(naturalWeeks.days).toHaveLength(35);
    expect(naturalWeeks.weeks).toHaveLength(5);
    expect(Object.isFrozen(sundayFirst.days)).toBe(true);
    expect(Object.isFrozen(sundayFirst.weeks[0])).toBe(true);
  });

  it('marks today, outside days, and every disabled-date source', () => {
    const month = buildNeuralCalendarMonth(2024, 3, {
      today: createNeuralDate(2024, 3, 8),
      minDate: createNeuralDate(2024, 3, 5),
      maxDate: createNeuralDate(2024, 3, 25),
      disabledDates: [createNeuralDate(2024, 3, 9)],
      disabledDays: [0],
      isDateDisabled: (date) => date.day === 13,
    });
    const byKey = new Map(month.days.map((day) => [day.key, day]));

    expect(byKey.get('2024-03-08')).toMatchObject({
      today: true,
      disabled: false,
      outsideMonth: false,
    });
    expect(byKey.get('2024-02-29')).toMatchObject({
      disabled: true,
      outsideMonth: true,
    });
    expect(byKey.get('2024-03-09')?.disabled).toBe(true);
    expect(byKey.get('2024-03-10')?.disabled).toBe(true);
    expect(byKey.get('2024-03-13')?.disabled).toBe(true);
    expect(byKey.get('2024-03-26')?.disabled).toBe(true);
  });

  it('uses Gregorian weekday values independent of the host timezone', () => {
    expect(getNeuralDayOfWeek(createNeuralDate(2024, 3, 10))).toBe(0);
    expect(getNeuralDayOfWeek(createNeuralDate(2024, 3, 11))).toBe(1);
  });

  it('calculates ISO week numbers across year boundaries', () => {
    expect(getNeuralIsoWeekNumber(createNeuralDate(2026, 1, 1))).toBe(1);
    expect(getNeuralIsoWeekNumber(createNeuralDate(2021, 1, 1))).toBe(53);
    expect(getNeuralIsoWeekNumber(createNeuralDate(2024, 12, 30))).toBe(1);
  });

  it('steps and clamps times while reporting midnight rollover', () => {
    const forward = addNeuralMinutes(createNeuralTime(23, 50, 12, 50), 20);
    const backward = addNeuralMinutes(createNeuralTime(0, 10), -20);

    expect(forward).toEqual({
      time: { hour: 0, minute: 10, second: 12, millisecond: 50 },
      dayOffset: 1,
    });
    expect(backward).toEqual({
      time: { hour: 23, minute: 50, second: 0, millisecond: 0 },
      dayOffset: -1,
    });
    expect(
      compareNeuralTimes(createNeuralTime(9, 30), createNeuralTime(10, 0)),
    ).toBe(-1);
    expect(
      clampNeuralTime(
        createNeuralTime(8, 0),
        createNeuralTime(9, 0),
        createNeuralTime(17, 0),
      ),
    ).toEqual(createNeuralTime(9, 0));
    expect(() =>
      clampNeuralTime(
        createNeuralTime(12, 0),
        createNeuralTime(17, 0),
        createNeuralTime(9, 0),
      ),
    ).toThrowError('Minimum time cannot be after maximum time.');

    expect(addNeuralSeconds(createNeuralTime(23, 59, 55), 10)).toEqual({
      time: { hour: 0, minute: 0, second: 5, millisecond: 0 },
      dayOffset: 1,
    });
    expect(
      compareNeuralDateTimes(
        createNeuralDateTime(
          createNeuralDate(2026, 6, 15),
          createNeuralTime(17, 0),
        ),
        createNeuralDateTime(
          createNeuralDate(2026, 6, 16),
          createNeuralTime(9, 0),
        ),
      ),
    ).toBe(-1);
  });
});
