import { Component, PLATFORM_ID, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { provideNeuralNg } from '../src/neural-ng.config';
import { NeuralLocaleService, type NeuralLocale } from '../src/neural-locale';
import { NeuralOverlayPositioner } from '../overlay';
import { neuralTr } from '../locales/tr';
import { NeuralDatePicker } from './date-picker.component';
import {
  NeuralDatePickerDayTemplate,
  NeuralDatePickerFooterTemplate,
  NeuralDatePickerHeaderTemplate,
  NeuralDatePickerNextIconTemplate,
  NeuralDatePickerPreviousIconTemplate,
  NeuralDatePickerTriggerIconTemplate,
} from './date-picker-templates';
import type {
  NeuralDatePickerChange,
  NeuralDatePickerClasses,
  NeuralDatePickerClear,
  NeuralDatePickerFooterAction,
  NeuralDatePickerInvalidInput,
  NeuralDatePickerMonthChange,
  NeuralDatePickerViewChange,
  NeuralDatePickerYearChange,
  NeuralDateTimeParts,
  NeuralDateFilter,
  NeuralDateParts,
  NeuralDateRange,
  NeuralTimeParts,
} from './date-picker.types';

@Component({
  imports: [NeuralDatePicker],
  template: `
    <neural-date-picker
      datePickerId="delivery-date"
      placeholder="Choose delivery date"
      [today]="today"
      [minDate]="minDate()"
      [maxDate]="maxDate()"
      [disabledDates]="disabledDates()"
      [disabledDays]="disabledDays()"
      [firstDayOfWeek]="firstDayOfWeek()"
      [locale]="locale()"
      [clearable]="clearable()"
      [showOtherMonths]="showOtherMonths()"
      [selectOtherMonths]="selectOtherMonths()"
      [showWeekNumbers]="showWeekNumbers()"
      [disabled]="disabled()"
      [unstyled]="unstyled()"
      [classes]="classes"
      [(value)]="value"
      (selectionChange)="changes.push($event)"
      (selected)="selectedEvents.push($event)"
      (cleared)="clears.push($event)"
      (opened)="openedCount = openedCount + 1"
      (closed)="closedCount = closedCount + 1"
      (viewChanged)="viewEvents.push($event)"
      (monthChanged)="monthEvents.push($event)"
      (yearChanged)="yearEvents.push($event)"
      (invalidInput)="invalidEvents.push($event)"
    />
  `,
})
class DatePickerTestHost {
  readonly today = createDateParts(2026, 6, 15);
  readonly value = signal<NeuralDateParts | null>(null);
  readonly minDate = signal<NeuralDateParts | null>(null);
  readonly maxDate = signal<NeuralDateParts | null>(null);
  readonly disabledDates = signal<readonly NeuralDateParts[]>([]);
  readonly disabledDays = signal<readonly (0 | 1 | 2 | 3 | 4 | 5 | 6)[]>([]);
  readonly firstDayOfWeek = signal<0 | 1 | 2 | 3 | 4 | 5 | 6 | null>(null);
  readonly locale = signal<NeuralLocale | null>(null);
  readonly clearable = signal(false);
  readonly showOtherMonths = signal(true);
  readonly selectOtherMonths = signal(false);
  readonly showWeekNumbers = signal(false);
  readonly disabled = signal(false);
  readonly unstyled = signal(false);
  readonly changes: NeuralDatePickerChange[] = [];
  readonly selectedEvents: NeuralDatePickerChange[] = [];
  readonly clears: NeuralDatePickerClear[] = [];
  openedCount = 0;
  closedCount = 0;
  readonly viewEvents: NeuralDatePickerViewChange[] = [];
  readonly monthEvents: NeuralDatePickerMonthChange[] = [];
  readonly yearEvents: NeuralDatePickerYearChange[] = [];
  readonly invalidEvents: NeuralDatePickerInvalidInput[] = [];
  readonly classes: NeuralDatePickerClasses = {
    root: 'slot-root',
    input: 'slot-input',
    panel: 'slot-panel',
    monthGrid: 'slot-month-grid',
    month: 'slot-month',
    day: 'slot-day',
    selectedDay: 'slot-selected',
  };
}

@Component({
  imports: [NeuralDatePicker],
  template: `
    <neural-date-picker
      datePickerId="range-picker"
      selectionMode="range"
      [today]="today"
      [dateFilter]="dateFilter()"
      [closeOnSelect]="rangeCloseOnSelect()"
      [footerActions]="footerActions()"
      [showQuickActions]="showQuickActions()"
      [showApplyActions]="showApplyActions()"
      [(value)]="rangeValue"
      (selectionChange)="handleRangeChange($event)"
      (cleared)="rangeClears.push($event)"
    />
    <neural-date-picker
      datePickerId="multiple-picker"
      selectionMode="multiple"
      [today]="today"
      [(value)]="multipleValue"
      (selectionChange)="handleMultipleChange($event)"
    />
  `,
})
class DatePickerTypedSelectionHost {
  readonly today = createDateParts(2026, 6, 15);
  readonly rangeValue = signal<NeuralDateRange | null>(null);
  readonly multipleValue = signal<readonly NeuralDateParts[] | null>(null);
  readonly rangeCloseOnSelect = signal<boolean | null>(null);
  readonly footerActions = signal<readonly NeuralDatePickerFooterAction[]>([
    'today',
    'clear',
  ]);
  readonly showQuickActions = signal(true);
  readonly showApplyActions = signal(false);
  readonly dateFilter = signal<NeuralDateFilter | undefined>(undefined);
  readonly rangeChanges: NeuralDatePickerChange<'range'>[] = [];
  readonly multipleChanges: NeuralDatePickerChange<'multiple'>[] = [];
  readonly rangeClears: NeuralDatePickerClear<'range'>[] = [];

  handleRangeChange(event: NeuralDatePickerChange<'range'>): void {
    this.rangeChanges.push(event);
  }

  handleMultipleChange(event: NeuralDatePickerChange<'multiple'>): void {
    this.multipleChanges.push(event);
  }
}

@Component({
  imports: [NeuralDatePicker],
  template: `
    <neural-date-picker
      datePickerId="time-picker"
      pickerMode="time"
      [hourFormat]="hourFormat()"
      [showSeconds]="showSeconds()"
      [hourStep]="hourStep()"
      [minuteStep]="minuteStep()"
      [secondStep]="secondStep()"
      [minDateTime]="minDateTime()"
      [maxDateTime]="maxDateTime()"
      [unstyled]="unstyled()"
      [(value)]="timeValue"
    />
    <neural-date-picker
      datePickerId="datetime-picker"
      pickerMode="datetime"
      [today]="today"
      [minuteStep]="15"
      [minDateTime]="minDateTime()"
      [maxDateTime]="maxDateTime()"
      [unstyled]="unstyled()"
      [(value)]="dateTimeValue"
    />
  `,
})
class DatePickerTimeHost {
  readonly today = createDateParts(2026, 6, 15);
  readonly timeValue = signal<NeuralTimeParts | null>({
    hour: 13,
    minute: 30,
    second: 10,
    millisecond: 0,
  });
  readonly dateTimeValue = signal<NeuralDateTimeParts | null>({
    date: createDateParts(2026, 6, 15),
    time: { hour: 10, minute: 0, second: 0, millisecond: 0 },
  });
  readonly hourFormat = signal<12 | 24>(24);
  readonly showSeconds = signal(false);
  readonly hourStep = signal(1);
  readonly minuteStep = signal(15);
  readonly secondStep = signal(10);
  readonly minDateTime = signal<NeuralDateTimeParts | null>(null);
  readonly maxDateTime = signal<NeuralDateTimeParts | null>(null);
  readonly unstyled = signal(false);
}

@Component({
  imports: [
    NeuralDatePicker,
    NeuralDatePickerDayTemplate,
    NeuralDatePickerFooterTemplate,
    NeuralDatePickerHeaderTemplate,
    NeuralDatePickerNextIconTemplate,
    NeuralDatePickerPreviousIconTemplate,
    NeuralDatePickerTriggerIconTemplate,
  ],
  template: `
    <neural-date-picker
      datePickerId="template-picker"
      [today]="today"
      [footerActions]="['today']"
    >
      <ng-template
        neuralDatePickerDay
        let-day
        let-selected="selected"
        let-rangeMiddle="rangeMiddle"
      >
        <span class="custom-day">
          {{ day.date.day }}:{{ selected }}:{{ rangeMiddle }}
        </span>
      </ng-template>
      <ng-template neuralDatePickerTriggerIcon let-className="className">
        <i class="custom-trigger" [class]="className"></i>
      </ng-template>
      <ng-template neuralDatePickerPreviousIcon let-direction="direction">
        <i class="custom-previous">{{ direction }}</i>
      </ng-template>
      <ng-template neuralDatePickerNextIcon let-direction="direction">
        <i class="custom-next">{{ direction }}</i>
      </ng-template>
      <ng-template neuralDatePickerFooter let-actions="actions">
        <span class="custom-footer">{{ actions.join(',') }}</span>
      </ng-template>
    </neural-date-picker>

    <neural-date-picker datePickerId="header-template-picker" [today]="today">
      <ng-template neuralDatePickerHeader let-title="title" let-view="view">
        <span class="custom-header">{{ title }}:{{ view }}</span>
      </ng-template>
    </neural-date-picker>
  `,
})
class DatePickerTemplateHost {
  readonly today = createDateParts(2026, 6, 15);
}

@Component({
  imports: [NeuralDatePicker, FormsModule, ReactiveFormsModule, FormField],
  template: `
    <neural-date-picker
      datePickerId="reactive-picker"
      [today]="today"
      [formControl]="reactiveControl"
    />
    <neural-date-picker
      datePickerId="template-driven-picker"
      name="templateDate"
      [today]="today"
      [(ngModel)]="templateValue"
    />
    <neural-date-picker
      datePickerId="signal-picker"
      [today]="today"
      [formField]="signalForm.date"
    />
  `,
})
class DatePickerFormsHost {
  readonly today = createDateParts(2026, 6, 15);
  readonly reactiveControl = new FormControl<NeuralDateParts | null>(
    createDateParts(2026, 6, 10),
  );
  templateValue: NeuralDateParts | null = createDateParts(2026, 6, 11);
  readonly signalModel = signal({
    date: createDateParts(2026, 6, 12) as NeuralDateParts | null,
  });
  readonly signalForm = form(this.signalModel);
}

describe('NeuralDatePicker', () => {
  async function createHost(
    providers: ReturnType<typeof provideNeuralNg>[] = [],
  ) {
    await TestBed.configureTestingModule({
      imports: [DatePickerTestHost],
      providers,
    }).compileComponents();
    const fixture = TestBed.createComponent(DatePickerTestHost);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  function openCalendar(fixture: Awaited<ReturnType<typeof createHost>>): void {
    const input = fixture.nativeElement.querySelector(
      '#delivery-date',
    ) as HTMLInputElement;
    input.click();
    fixture.detectChanges();
  }

  it('renders typed day, header, footer, and icon templates', async () => {
    await TestBed.configureTestingModule({
      imports: [DatePickerTemplateHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(DatePickerTemplateHost);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('.custom-trigger'),
    ).not.toBeNull();

    (
      fixture.nativeElement.querySelector('#template-picker') as HTMLElement
    ).click();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector(
        '[data-date="2026-06-15"] .custom-day',
      )?.textContent,
    ).toContain('15:false:false');
    expect(
      fixture.nativeElement.querySelector('.custom-previous')?.textContent,
    ).toContain('previous');
    expect(
      fixture.nativeElement.querySelector('.custom-next')?.textContent,
    ).toContain('next');
    expect(
      fixture.nativeElement.querySelector('.custom-footer')?.textContent,
    ).toContain('today');

    (
      fixture.nativeElement.querySelector(
        '#header-template-picker',
      ) as HTMLElement
    ).click();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.custom-header')?.textContent,
    ).toContain('June 2026:days');
  });

  it('binds Reactive, template-driven, and Signal Forms through one value model', async () => {
    await TestBed.configureTestingModule({
      imports: [DatePickerFormsHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(DatePickerFormsHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const inputs = fixture.nativeElement.querySelectorAll(
      '.neural-date-picker-input-root',
    ) as NodeListOf<HTMLInputElement>;
    expect(inputs[0]?.value).toBe('06/10/2026');
    expect(inputs[1]?.value).toBe('06/11/2026');
    expect(inputs[2]?.value).toBe('06/12/2026');

    fixture.componentInstance.reactiveControl.setValue(
      createDateParts(2026, 6, 13),
    );
    fixture.componentInstance.signalModel.set({
      date: createDateParts(2026, 6, 15),
    });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(inputs[0]?.value).toBe('06/13/2026');
    expect(inputs[1]?.value).toBe('06/11/2026');
    expect(inputs[2]?.value).toBe('06/15/2026');

    inputs[0]?.click();
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector(
        '[data-date="2026-06-16"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.reactiveControl.value).toEqual(
      createDateParts(2026, 6, 16),
    );
    expect(fixture.componentInstance.reactiveControl.dirty).toBe(true);
    expect(fixture.componentInstance.reactiveControl.touched).toBe(true);
    fixture.detectChanges();
    const reactiveRoot = inputs[0]?.closest('.neural-date-picker-root');
    expect(reactiveRoot?.getAttribute('data-dirty')).toBe('true');
    expect(reactiveRoot?.getAttribute('data-touched')).toBe('true');

    inputs[1]?.click();
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector(
        '[data-date="2026-06-17"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.templateValue).toEqual(
      createDateParts(2026, 6, 17),
    );

    inputs[2]?.click();
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector(
        '[data-date="2026-06-18"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.signalModel().date).toEqual(
      createDateParts(2026, 6, 18),
    );

    fixture.componentInstance.reactiveControl.disable();
    fixture.detectChanges();
    expect(inputs[0]?.disabled).toBe(true);
  });

  it('opens a deterministic six-week calendar and formats the model', async () => {
    const fixture = await createHost();
    fixture.componentInstance.value.set(createDateParts(2026, 6, 15));
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector(
      '#delivery-date',
    ) as HTMLInputElement;
    expect(input.value).toBe('06/15/2026');
    expect(input.getAttribute('aria-haspopup')).toBe('dialog');
    expect(
      (
        fixture.nativeElement.querySelector(
          '.neural-date-picker-trigger-root',
        ) as HTMLButtonElement
      ).getAttribute('aria-label'),
    ).toBe('Change date, 06/15/2026');

    openCalendar(fixture);

    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(
      fixture.nativeElement.querySelectorAll('.neural-date-picker-day-root')
        .length,
    ).toBe(42);
    expect(
      fixture.nativeElement
        .querySelector('.neural-date-picker-title-root')
        .textContent.replace(/\s+/g, ' ')
        .trim(),
    ).toContain('June 2026');
    expect(
      fixture.nativeElement
        .querySelector('.neural-date-picker-announcement-root')
        .textContent.trim(),
    ).toBe('June 2026');
    expect(
      fixture.nativeElement
        .querySelector('.neural-date-picker-weekday-root')
        .getAttribute('aria-label'),
    ).toBe('Sunday');
    expect(
      fixture.nativeElement
        .querySelector('.neural-popover-root')
        .getAttribute('data-match-trigger-width'),
    ).toBe('true');
  });

  it('emits semantic lifecycle, selection, view, navigation, and invalid-input events', async () => {
    const fixture = await createHost();
    fixture.componentInstance.clearable.set(true);
    openCalendar(fixture);
    await fixture.whenStable();
    expect(fixture.componentInstance.openedCount).toBe(1);

    (
      fixture.nativeElement.querySelector(
        '.neural-date-picker-month-toggle-root',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(
      fixture.componentInstance.viewEvents[
        fixture.componentInstance.viewEvents.length - 1
      ],
    ).toEqual({
      view: 'months',
      previousView: 'days',
    });

    (
      fixture.nativeElement.querySelector(
        '.neural-date-picker-year-toggle-root',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(
      fixture.componentInstance.viewEvents[
        fixture.componentInstance.viewEvents.length - 1
      ]?.view,
    ).toBe('years');

    const yearInput = fixture.nativeElement.querySelector(
      '.neural-date-picker-year-input-root',
    ) as HTMLInputElement;
    yearInput.value = '0';
    yearInput.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(
      fixture.componentInstance.invalidEvents[
        fixture.componentInstance.invalidEvents.length - 1
      ],
    ).toEqual({
      field: 'year',
      input: '0',
      reason: 'range',
    });

    (
      fixture.nativeElement.querySelector(
        '.neural-date-picker-year-root:not(:disabled)',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.yearEvents.length).toBeGreaterThan(0);
    (
      fixture.nativeElement.querySelector(
        '.neural-date-picker-month-root:not(:disabled)',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    (
      fixture.nativeElement.querySelectorAll(
        '.neural-date-picker-navigation-root',
      )[1] as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.monthEvents.length).toBeGreaterThan(0);

    const selectableDay = fixture.nativeElement.querySelector(
      '.neural-date-picker-day-root:not(:disabled)',
    ) as HTMLButtonElement;
    selectableDay.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.selectedEvents).toHaveLength(1);
    expect(fixture.componentInstance.selectedEvents[0]).toEqual(
      fixture.componentInstance.changes[0],
    );
    expect(fixture.componentInstance.closedCount).toBe(1);

    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector(
        '.neural-date-picker-clear-root',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.clears).toHaveLength(1);
  });

  it('localizes weekdays and inherits the locale first day of week', async () => {
    const fixture = await createHost();
    fixture.componentInstance.locale.set(neuralTr);
    fixture.detectChanges();
    openCalendar(fixture);

    const weekdays = Array.from(
      fixture.nativeElement.querySelectorAll(
        '.neural-date-picker-weekday-root',
      ),
      (element) => (element as HTMLElement).textContent?.trim(),
    );
    expect(weekdays[0]?.toLocaleLowerCase('tr-TR')).toContain('pzt');

    fixture.componentInstance.firstDayOfWeek.set(2);
    fixture.detectChanges();
    const overridden = fixture.nativeElement.querySelector(
      '.neural-date-picker-weekday-root',
    ) as HTMLElement;
    expect(overridden.textContent?.toLocaleLowerCase('tr-TR')).toContain('sal');
  });

  it('reacts to application locale changes while the calendar is open', async () => {
    const fixture = await createHost();
    const localeService = TestBed.inject(NeuralLocaleService);
    openCalendar(fixture);

    localeService.use(neuralTr);
    fixture.detectChanges();

    const firstWeekday = fixture.nativeElement.querySelector(
      '.neural-date-picker-weekday-root',
    ) as HTMLElement;
    expect(firstWeekday.textContent?.toLocaleLowerCase('tr-TR')).toContain(
      'pzt',
    );
    expect(
      fixture.nativeElement.querySelector('[aria-label="Önceki ay"]'),
    ).not.toBeNull();

    localeService.use({
      code: 'ar-EG',
      direction: 'rtl',
      firstDayOfWeek: 6,
    });
    fixture.detectChanges();

    expect(
      fixture.nativeElement
        .querySelector('.neural-date-picker-calendar-root')
        .getAttribute('dir'),
    ).toBe('rtl');
    expect(
      fixture.nativeElement
        .querySelector('.neural-date-picker-weekday-root')
        .getAttribute('aria-label'),
    ).toBeTruthy();
  });

  it('applies a component-level RTL locale to layout, navigation icons and grid movement', async () => {
    const fixture = await createHost();
    fixture.componentInstance.value.set(createDateParts(2026, 6, 15));
    fixture.componentInstance.locale.set({
      code: 'ar-EG',
      direction: 'rtl',
      firstDayOfWeek: 6,
    });
    fixture.detectChanges();
    openCalendar(fixture);

    expect(
      fixture.nativeElement
        .querySelector('.neural-date-picker-root')
        .getAttribute('dir'),
    ).toBe('rtl');
    expect(
      fixture.nativeElement
        .querySelector('.neural-date-picker-calendar-root')
        .getAttribute('dir'),
    ).toBe('rtl');
    expect(
      fixture.nativeElement.querySelector('[aria-label="Previous month"] i')
        .classList,
    ).toContain('nt-chevron-right');

    const active = dayButton(fixture, '2026-06-15');
    active.focus();
    active.dispatchEvent(keydown('ArrowRight'));
    fixture.detectChanges();
    expect(
      (
        fixture.nativeElement.querySelector(
          '.neural-date-picker-day-root[tabindex="0"]',
        ) as HTMLButtonElement
      ).dataset['date'],
    ).toBe('2026-06-14');
  });

  it('selects a distant year, then a month, before showing its days', async () => {
    const fixture = await createHost();
    openCalendar(fixture);

    const yearToggle = fixture.nativeElement.querySelector(
      '[aria-label="Choose year"]',
    ) as HTMLButtonElement;
    yearToggle.click();
    fixture.detectChanges();

    const yearInput = fixture.nativeElement.querySelector(
      '[aria-label="Go to year"]',
    ) as HTMLInputElement;
    expect(yearInput).toBeTruthy();
    yearInput.value = '100';
    yearInput.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelectorAll('.neural-date-picker-month-root')
        .length,
    ).toBe(12);
    expect(
      fixture.nativeElement.querySelector('.neural-date-picker-month-grid-root')
        .classList,
    ).toContain('neural-date-picker-month-grid-base');
    expect(
      fixture.nativeElement.querySelector('[aria-label="March"]').classList,
    ).toContain('neural-date-picker-month-base');
    expect(
      fixture.nativeElement.querySelectorAll('.neural-date-picker-day-root')
        .length,
    ).toBe(0);

    const march = fixture.nativeElement.querySelector(
      '[aria-label="March"]',
    ) as HTMLButtonElement;
    march.click();
    fixture.detectChanges();

    expect(
      fixture.nativeElement
        .querySelector('.neural-date-picker-title-root')
        .textContent.replace(/\s+/g, ' ')
        .trim(),
    ).toContain('March 100');
    expect(
      fixture.nativeElement.querySelectorAll('.neural-date-picker-day-root')
        .length,
    ).toBe(42);
  });

  it('selects a day, emits one typed change and closes the panel', async () => {
    const fixture = await createHost();
    openCalendar(fixture);

    const target = fixture.nativeElement.querySelector(
      '[data-date="2026-06-18"]',
    ) as HTMLButtonElement;
    target.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toEqual(
      createDateParts(2026, 6, 18),
    );
    expect(fixture.componentInstance.changes).toEqual([
      {
        value: createDateParts(2026, 6, 18),
        previousValue: null,
        source: 'pointer',
        complete: true,
      },
    ]);
    expect(
      fixture.nativeElement
        .querySelector('#delivery-date')
        .getAttribute('aria-expanded'),
    ).toBe('false');
  });

  it('navigates months and supports the ARIA grid keyboard contract', async () => {
    const fixture = await createHost();
    openCalendar(fixture);

    const next = fixture.nativeElement.querySelector(
      '[aria-label="Next month"]',
    ) as HTMLButtonElement;
    next.click();
    fixture.detectChanges();
    expect(
      fixture.nativeElement
        .querySelector('.neural-date-picker-title-root')
        .textContent.replace(/\s+/g, ' ')
        .trim(),
    ).toContain('July 2026');

    const active = fixture.nativeElement.querySelector(
      '[tabindex="0"]',
    ) as HTMLButtonElement;
    const activeDate = active.dataset['date'];
    active.dispatchEvent(keydown('ArrowRight'));
    fixture.detectChanges();

    const nextActive = fixture.nativeElement.querySelector(
      '[tabindex="0"]',
    ) as HTMLButtonElement;
    expect(nextActive.dataset['date']).not.toBe(activeDate);
  });

  it('keeps focus in the grid during repeated Home, End, PageUp and PageDown navigation', async () => {
    const fixture = await createHost();
    openCalendar(fixture);

    dayButton(fixture, '2026-06-15').focus();

    for (const key of [
      'PageDown',
      'PageDown',
      'PageUp',
      'PageUp',
      'Home',
      'Home',
      'End',
      'End',
    ]) {
      const active = document.activeElement as HTMLButtonElement;
      const event = keydown(key);
      active.dispatchEvent(event);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(event.defaultPrevented).toBe(true);
      expect(document.activeElement).toBeInstanceOf(HTMLButtonElement);
      expect(
        (document.activeElement as HTMLButtonElement).dataset['date'],
      ).toBeTruthy();
    }
  });

  it('restores focus to the input when Escape closes the calendar', async () => {
    const fixture = await createHost();
    openCalendar(fixture);
    await fixture.whenStable();

    const activeDay = dayButton(fixture, '2026-06-15');
    activeDay.focus();
    activeDay.dispatchEvent(keydown('Escape'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(
      fixture.nativeElement
        .querySelector('#delivery-date')
        .getAttribute('aria-expanded'),
    ).toBe('false');
    expect(document.activeElement).toBe(
      fixture.nativeElement.querySelector('#delivery-date'),
    );
  });

  it('moves from the day header to month and year views', async () => {
    const fixture = await createHost();
    openCalendar(fixture);

    const monthToggle = fixture.nativeElement.querySelector(
      '[aria-label="Choose month"]',
    ) as HTMLButtonElement;
    monthToggle.click();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelectorAll('.neural-date-picker-month-root')
        .length,
    ).toBe(12);

    const yearToggle = fixture.nativeElement.querySelector(
      '[aria-label="Choose year"]',
    ) as HTMLButtonElement;
    yearToggle.click();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelectorAll('.neural-date-picker-year-root')
        .length,
    ).toBe(12);
  });

  it('controls other-month visibility and selection independently', async () => {
    const fixture = await createHost();
    openCalendar(fixture);

    const outside = fixture.nativeElement.querySelector(
      '[data-date="2026-05-31"]',
    ) as HTMLButtonElement;
    expect(outside).toBeTruthy();
    expect(outside.disabled).toBe(true);

    fixture.componentInstance.showOtherMonths.set(false);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[data-date="2026-05-31"]'),
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelectorAll(
        '.neural-date-picker-other-month-placeholder-root',
      ).length,
    ).toBeGreaterThan(0);

    fixture.componentInstance.showOtherMonths.set(true);
    fixture.componentInstance.selectOtherMonths.set(true);
    fixture.detectChanges();
    const selectableOutside = fixture.nativeElement.querySelector(
      '[data-date="2026-05-31"]',
    ) as HTMLButtonElement;
    expect(selectableOutside.disabled).toBe(false);
    selectableOutside.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toEqual({
      year: 2026,
      month: 5,
      day: 31,
    });
  });

  it('renders optional localized ISO week numbers', async () => {
    const fixture = await createHost();
    fixture.componentInstance.showWeekNumbers.set(true);
    fixture.detectChanges();
    openCalendar(fixture);

    expect(
      fixture.nativeElement.querySelector(
        '.neural-date-picker-week-number-header-root',
      ).textContent,
    ).toContain('Wk');
    expect(
      fixture.nativeElement.querySelectorAll(
        '.neural-date-picker-week-number-root',
      ).length,
    ).toBe(6);
    expect(
      fixture.nativeElement.querySelector(
        '.neural-date-picker-week-number-root',
      ).textContent,
    ).toContain('23');
    expect(
      fixture.nativeElement.querySelector('.neural-date-picker-week-root')
        .classList,
    ).toContain('neural-date-picker-row-week-numbers-base');
  });

  it('disables dates from bounds, explicit dates and weekdays', async () => {
    const fixture = await createHost();
    fixture.componentInstance.minDate.set(createDateParts(2026, 6, 10));
    fixture.componentInstance.maxDate.set(createDateParts(2026, 6, 20));
    fixture.componentInstance.disabledDates.set([createDateParts(2026, 6, 16)]);
    fixture.componentInstance.disabledDays.set([0]);
    fixture.detectChanges();
    openCalendar(fixture);

    expect(dayButton(fixture, '2026-06-09').disabled).toBe(true);
    expect(dayButton(fixture, '2026-06-16').disabled).toBe(true);
    expect(dayButton(fixture, '2026-06-21').disabled).toBe(true);
    expect(dayButton(fixture, '2026-06-17').disabled).toBe(false);
  });

  it('clears the model and reports the previous value', async () => {
    const fixture = await createHost();
    fixture.componentInstance.value.set(createDateParts(2026, 6, 15));
    fixture.componentInstance.clearable.set(true);
    fixture.detectChanges();

    const clear = fixture.nativeElement.querySelector(
      '[aria-label="Clear"]',
    ) as HTMLButtonElement;
    clear.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBeNull();
    expect(fixture.componentInstance.clears).toEqual([
      { previousValue: createDateParts(2026, 6, 15) },
    ]);
  });

  it('keeps structural hooks and consumer slots in unstyled mode', async () => {
    const fixture = await createHost();
    fixture.componentInstance.unstyled.set(true);
    fixture.detectChanges();
    openCalendar(fixture);

    const root = fixture.nativeElement.querySelector(
      '.neural-date-picker-root',
    ) as HTMLElement;
    const input = fixture.nativeElement.querySelector(
      '#delivery-date',
    ) as HTMLInputElement;
    const day = fixture.nativeElement.querySelector(
      '.neural-date-picker-day-root',
    ) as HTMLButtonElement;

    expect(root.classList).toContain('slot-root');
    expect(root.classList).not.toContain('neural-date-picker-base');
    expect(input.classList).toContain('slot-input');
    expect(input.classList).not.toContain('neural-date-picker-input-base');
    expect(day.classList).toContain('slot-day');
    expect(day.classList).not.toContain('neural-date-picker-day-base');

    const yearToggle = fixture.nativeElement.querySelector(
      '[aria-label="Choose year"]',
    ) as HTMLButtonElement;
    yearToggle.click();
    fixture.detectChanges();
    const yearInput = fixture.nativeElement.querySelector(
      '[aria-label="Go to year"]',
    ) as HTMLInputElement;
    yearInput.value = '100';
    yearInput.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();

    const monthGrid = fixture.nativeElement.querySelector(
      '.neural-date-picker-month-grid-root',
    ) as HTMLElement;
    const month = fixture.nativeElement.querySelector(
      '.neural-date-picker-month-root',
    ) as HTMLButtonElement;
    expect(monthGrid.classList).toContain('slot-month-grid');
    expect(monthGrid.classList).not.toContain(
      'neural-date-picker-month-grid-base',
    );
    expect(month.classList).toContain('slot-month');
    expect(month.classList).not.toContain('neural-date-picker-month-base');
  });

  it('inherits global unstyled mode and blocks interaction when disabled', async () => {
    const fixture = await createHost([provideNeuralNg({ unstyled: true })]);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector(
      '#delivery-date',
    ) as HTMLInputElement;
    input.click();
    fixture.detectChanges();

    expect(input.disabled).toBe(true);
    expect(
      fixture.nativeElement.querySelector('.neural-date-picker-base'),
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector('.neural-date-picker-day-root'),
    ).toBeNull();
  });

  it('keeps one structural DOM contract across light, dark and unstyled modes', async () => {
    document.documentElement.setAttribute('data-neural-theme', 'neutral');
    document.documentElement.setAttribute('data-neural-mode', 'light');
    const fixture = await createHost();

    const root = fixture.nativeElement.querySelector(
      '.neural-date-picker-root',
    ) as HTMLElement;
    expect(root.classList).toContain('neural-date-picker-base');

    document.documentElement.setAttribute('data-neural-mode', 'dark');
    document.documentElement.setAttribute('data-neural-theme', 'glass');
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.neural-date-picker-root'),
    ).toBe(root);
    expect(root.classList).toContain('neural-date-picker-base');

    fixture.componentInstance.unstyled.set(true);
    fixture.detectChanges();
    expect(root.classList).toContain('neural-date-picker-root');
    expect(root.classList).not.toContain('neural-date-picker-base');

    document.documentElement.removeAttribute('data-neural-theme');
    document.documentElement.removeAttribute('data-neural-mode');
  });

  it('uses the browser top layer and releases overlay resources on destroy', async () => {
    const showPopover = vi.fn();
    const hidePopover = vi.fn();
    const destroyPosition = vi.fn();
    const updatePosition = vi.fn();
    const connect = vi.fn(() => ({
      resolvedPlacement: signal<'bottom-start'>('bottom-start'),
      update: updatePosition,
      destroy: destroyPosition,
    }));
    Object.defineProperty(HTMLElement.prototype, 'showPopover', {
      configurable: true,
      value: showPopover,
    });
    Object.defineProperty(HTMLElement.prototype, 'hidePopover', {
      configurable: true,
      value: hidePopover,
    });

    try {
      await TestBed.configureTestingModule({
        imports: [DatePickerTestHost],
        providers: [
          { provide: NeuralOverlayPositioner, useValue: { connect } },
        ],
      }).compileComponents();
      const fixture = TestBed.createComponent(DatePickerTestHost);
      fixture.detectChanges();
      await fixture.whenStable();

      openCalendar(fixture);
      await fixture.whenStable();
      expect(showPopover).toHaveBeenCalledTimes(1);
      expect(connect).toHaveBeenCalledTimes(1);

      dayButton(fixture, '2026-06-15').dispatchEvent(keydown('Escape'));
      fixture.detectChanges();
      await fixture.whenStable();
      expect(hidePopover).toHaveBeenCalledTimes(1);

      fixture.destroy();
      expect(destroyPosition).toHaveBeenCalledTimes(1);
    } finally {
      Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
      Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover');
    }
  });

  it('renders an inert deterministic shell on the server', async () => {
    await TestBed.configureTestingModule({
      imports: [DatePickerTestHost],
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    }).compileComponents();
    const fixture = TestBed.createComponent(DatePickerTestHost);
    fixture.detectChanges();
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector(
      '#delivery-date',
    ) as HTMLInputElement;
    const panel = fixture.nativeElement.querySelector(
      '.neural-popover-root',
    ) as HTMLElement;
    expect(input.getAttribute('aria-controls')).toBe(panel.id);
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(panel.hidden).toBe(true);
    expect(panel.dataset['position']).toBeUndefined();
    expect(
      fixture.nativeElement.querySelector('.neural-date-picker-day-root'),
    ).toBeNull();
  });
});

describe('NeuralDatePicker typed selection modes', () => {
  async function createSelectionHost() {
    await TestBed.configureTestingModule({
      imports: [DatePickerTypedSelectionHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(DatePickerTypedSelectionHost);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  function openPicker(
    fixture: ComponentFixture<DatePickerTypedSelectionHost>,
    id: 'range-picker' | 'multiple-picker',
  ): void {
    (fixture.nativeElement.querySelector(`#${id}`) as HTMLInputElement).click();
    fixture.detectChanges();
  }

  function selectionDay(
    fixture: ComponentFixture<DatePickerTypedSelectionHost>,
    date: string,
  ): HTMLButtonElement {
    return fixture.nativeElement.querySelector(
      `.neural-popover-root [data-date="${date}"]`,
    ) as HTMLButtonElement;
  }

  it('type-checks range and multiple models and outputs in Angular templates', async () => {
    const fixture = await createSelectionHost();
    expect(fixture.componentInstance.rangeValue()).toBeNull();
    expect(fixture.componentInstance.multipleValue()).toBeNull();

    openPicker(fixture, 'range-picker');
    expect(
      fixture.nativeElement.querySelector(
        '.neural-date-picker-footer-action-today-base',
      ),
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector(
        '.neural-date-picker-footer-action-clear-base',
      ),
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector(
        '.neural-date-picker-footer-action-apply-base',
      ),
    ).toBeNull();
  });

  it('can hide Today and Clear independently from Apply and Cancel', async () => {
    const fixture = await createSelectionHost();
    fixture.componentInstance.showQuickActions.set(false);
    fixture.componentInstance.showApplyActions.set(true);
    fixture.detectChanges();
    openPicker(fixture, 'range-picker');

    expect(
      fixture.nativeElement.querySelector(
        '.neural-date-picker-footer-action-today-base',
      ),
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector(
        '.neural-date-picker-footer-action-clear-base',
      ),
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector(
        '.neural-date-picker-footer-action-cancel-base',
      ),
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector(
        '.neural-date-picker-footer-action-apply-base',
      ),
    ).toBeTruthy();
  });

  it('keeps an incomplete range open, previews hover and completes on the second date', async () => {
    const fixture = await createSelectionHost();
    openPicker(fixture, 'range-picker');

    selectionDay(fixture, '2026-06-10').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.rangeValue()).toEqual({
      start: createDateParts(2026, 6, 10),
      end: null,
    });
    expect(fixture.componentInstance.rangeChanges[0]?.complete).toBe(false);
    expect(
      fixture.nativeElement
        .querySelector('#range-picker')
        .getAttribute('aria-expanded'),
    ).toBe('true');

    selectionDay(fixture, '2026-06-14').dispatchEvent(
      new MouseEvent('mouseenter', { bubbles: true }),
    );
    fixture.detectChanges();
    expect(selectionDay(fixture, '2026-06-12').classList).toContain(
      'neural-date-picker-day-range-preview-base',
    );

    selectionDay(fixture, '2026-06-14').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.rangeValue()).toEqual({
      start: createDateParts(2026, 6, 10),
      end: createDateParts(2026, 6, 14),
    });
    expect(fixture.componentInstance.rangeChanges[1]?.complete).toBe(true);
    expect(
      fixture.nativeElement
        .querySelector('#range-picker')
        .getAttribute('aria-expanded'),
    ).toBe('false');
  });

  it('toggles multiple dates without closing the calendar', async () => {
    const fixture = await createSelectionHost();
    openPicker(fixture, 'multiple-picker');

    selectionDay(fixture, '2026-06-10').click();
    selectionDay(fixture, '2026-06-12').click();
    selectionDay(fixture, '2026-06-10').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.multipleValue()).toEqual([
      createDateParts(2026, 6, 12),
    ]);
    expect(fixture.componentInstance.multipleChanges).toHaveLength(3);
    expect(
      fixture.nativeElement
        .querySelector('#multiple-picker')
        .getAttribute('aria-expanded'),
    ).toBe('true');
  });

  it('honors an explicit closeOnSelect false for a completed range', async () => {
    const fixture = await createSelectionHost();
    fixture.componentInstance.rangeCloseOnSelect.set(false);
    fixture.detectChanges();
    openPicker(fixture, 'range-picker');

    selectionDay(fixture, '2026-06-10').click();
    selectionDay(fixture, '2026-06-12').click();
    fixture.detectChanges();

    expect(
      fixture.nativeElement
        .querySelector('#range-picker')
        .getAttribute('aria-expanded'),
    ).toBe('true');
  });

  it('composes dateFilter with disabled calendar days', async () => {
    const fixture = await createSelectionHost();
    fixture.componentInstance.dateFilter.set((date) => date.day % 2 === 1);
    fixture.detectChanges();
    openPicker(fixture, 'range-picker');

    expect(selectionDay(fixture, '2026-06-16').disabled).toBe(true);
    expect(selectionDay(fixture, '2026-06-17').disabled).toBe(false);
  });

  it('defers Apply, restores Cancel, and supports Today and Clear footer actions', async () => {
    const fixture = await createSelectionHost();
    fixture.componentInstance.showApplyActions.set(true);
    fixture.detectChanges();
    openPicker(fixture, 'range-picker');

    selectionDay(fixture, '2026-06-10').click();
    selectionDay(fixture, '2026-06-12').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.rangeValue()).toBeNull();

    (
      fixture.nativeElement.querySelector(
        '.neural-date-picker-footer-action-cancel-base',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.rangeValue()).toBeNull();

    openPicker(fixture, 'range-picker');
    selectionDay(fixture, '2026-06-10').click();
    selectionDay(fixture, '2026-06-12').click();
    (
      fixture.nativeElement.querySelector(
        '.neural-date-picker-footer-action-apply-base',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.rangeValue()).toEqual({
      start: createDateParts(2026, 6, 10),
      end: createDateParts(2026, 6, 12),
    });

    openPicker(fixture, 'range-picker');
    (
      fixture.nativeElement.querySelector(
        '.neural-date-picker-footer-action-clear-base',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.rangeValue()).toBeNull();
    expect(fixture.componentInstance.rangeClears).toHaveLength(1);

    openPicker(fixture, 'range-picker');
    (
      fixture.nativeElement.querySelector(
        '.neural-date-picker-footer-action-today-base',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.rangeValue()).toEqual({
      start: createDateParts(2026, 6, 15),
      end: createDateParts(2026, 6, 15),
    });
  });
});

describe('NeuralDatePicker time and datetime modes', () => {
  async function createTimeHost() {
    await TestBed.configureTestingModule({
      imports: [DatePickerTimeHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(DatePickerTimeHost);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  function openTimePicker(
    fixture: ComponentFixture<DatePickerTimeHost>,
    id: 'time-picker' | 'datetime-picker',
  ): void {
    (fixture.nativeElement.querySelector(`#${id}`) as HTMLInputElement).click();
    fixture.detectChanges();
  }

  function timeInput(
    fixture: ComponentFixture<DatePickerTimeHost>,
    label: 'Hour' | 'Minute' | 'Second',
  ): HTMLInputElement {
    return fixture.nativeElement.querySelector(
      `.neural-popover-root [aria-label="${label}"]`,
    ) as HTMLInputElement;
  }

  it('keeps time edits in a draft and applies minute steps with Arrow keys', async () => {
    const fixture = await createTimeHost();
    openTimePicker(fixture, 'time-picker');

    expect(
      fixture.nativeElement.querySelector('.neural-date-picker-day-root'),
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector(
        '.neural-date-picker-footer-action-cancel-base',
      ),
    ).toBeTruthy();

    const minute = timeInput(fixture, 'Minute');
    const increment = keydown('ArrowUp');
    minute.dispatchEvent(increment);
    fixture.detectChanges();

    expect(increment.defaultPrevented).toBe(true);
    expect(minute.getAttribute('aria-valuenow')).toBe('45');
    expect(fixture.componentInstance.timeValue()?.minute).toBe(30);

    (
      fixture.nativeElement.querySelector(
        '.neural-date-picker-footer-action-cancel-base',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.timeValue()?.minute).toBe(30);

    openTimePicker(fixture, 'time-picker');
    timeInput(fixture, 'Minute').dispatchEvent(keydown('ArrowUp'));
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector(
        '.neural-date-picker-footer-action-apply-base',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.timeValue()).toEqual({
      hour: 13,
      minute: 45,
      second: 10,
      millisecond: 0,
    });
  });

  it('supports numeric entry, seconds and a 12-hour period without accepting invalid hours', async () => {
    const fixture = await createTimeHost();
    fixture.componentInstance.hourFormat.set(12);
    fixture.componentInstance.showSeconds.set(true);
    fixture.detectChanges();
    openTimePicker(fixture, 'time-picker');

    const hour = timeInput(fixture, 'Hour');
    expect(hour.value).toBe('01');
    expect(
      (
        fixture.nativeElement.querySelector(
          '.neural-date-picker-period-root',
        ) as HTMLButtonElement
      ).textContent?.trim(),
    ).toBe('PM');

    hour.value = '11';
    hour.dispatchEvent(new Event('input', { bubbles: true }));
    hour.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();

    hour.value = '15';
    hour.dispatchEvent(new Event('input', { bubbles: true }));
    hour.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    expect(hour.value).toBe('11');
    expect(hour.getAttribute('aria-invalid')).toBe('true');

    timeInput(fixture, 'Second').dispatchEvent(keydown('ArrowUp'));
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector(
        '.neural-date-picker-footer-action-apply-base',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.timeValue()).toEqual({
      hour: 23,
      minute: 30,
      second: 20,
      millisecond: 0,
    });
  });

  it('combines a calendar date with constrained time in datetime mode', async () => {
    const fixture = await createTimeHost();
    fixture.componentInstance.minDateTime.set({
      date: createDateParts(2026, 6, 15),
      time: { hour: 9, minute: 0, second: 0, millisecond: 0 },
    });
    fixture.componentInstance.maxDateTime.set({
      date: createDateParts(2026, 6, 16),
      time: { hour: 17, minute: 0, second: 0, millisecond: 0 },
    });
    fixture.detectChanges();
    openTimePicker(fixture, 'datetime-picker');

    (
      fixture.nativeElement.querySelector(
        '[data-date="2026-06-16"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    const hour = timeInput(fixture, 'Hour');
    hour.value = '18';
    hour.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    expect(hour.value).toBe('10');

    hour.value = '16';
    hour.dispatchEvent(new Event('change', { bubbles: true }));
    timeInput(fixture, 'Minute').dispatchEvent(keydown('ArrowUp'));
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector(
        '.neural-date-picker-footer-action-apply-base',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.dateTimeValue()).toEqual({
      date: createDateParts(2026, 6, 16),
      time: { hour: 16, minute: 15, second: 0, millisecond: 0 },
    });
  });

  it('keeps time semantics and class slots while removing every neutral visual class', async () => {
    const fixture = await createTimeHost();
    fixture.componentInstance.unstyled.set(true);
    fixture.detectChanges();
    openTimePicker(fixture, 'time-picker');

    const group = fixture.nativeElement.querySelector(
      '.neural-date-picker-time-root',
    ) as HTMLElement;
    const input = timeInput(fixture, 'Hour');
    expect(group).toBeTruthy();
    expect(group.classList).not.toContain('neural-date-picker-time-base');
    expect(input.getAttribute('role')).toBe('spinbutton');
    expect(input.classList).toContain('neural-date-picker-time-input-root');
    expect(input.classList).not.toContain('neural-date-picker-time-input-base');
  });
});

function createDateParts(
  year: number,
  month: number,
  value: number,
): NeuralDateParts {
  return { year, month, day: value };
}

function dayButton(
  fixture: ComponentFixture<DatePickerTestHost>,
  value: string,
): HTMLButtonElement {
  return fixture.nativeElement.querySelector(
    `[data-date="${value}"]`,
  ) as HTMLButtonElement;
}

function keydown(key: string): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
  });
}
