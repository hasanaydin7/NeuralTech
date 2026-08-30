# NeuralNg DatePicker

Status: **Beta**. The canonical standalone export is `NeuralDatePicker`;
`DatePickerComponent` is retained as a deprecated compatibility alias.

Timezone-safe, localized and headless-ready date, range, multiple, time and
datetime selection for Angular 22+.

## Import

```ts
import { NeuralDatePicker, type NeuralDateParts, type NeuralDateRange, type NeuralDateTimeParts, type NeuralTimeParts } from '@neural-ng/core/date-picker';
```

Add `NeuralDatePicker` to the consuming standalone component's `imports`.

## Value model

DatePicker uses serializable plain objects instead of JavaScript `Date`
instances. This avoids implicit timezone conversion during SSR, hydration and
API serialization.

```ts
const date: NeuralDateParts = { year: 2026, month: 8, day: 12 };
const time: NeuralTimeParts = {
  hour: 14,
  minute: 30,
  second: 0,
  millisecond: 0,
};
```

```html
<neural-date-picker [(value)]="deliveryDate" />
<neural-date-picker selectionMode="range" [(value)]="period" />
<neural-date-picker selectionMode="multiple" [(value)]="days" />
<neural-date-picker pickerMode="time" [(value)]="meetingTime" />
<neural-date-picker pickerMode="datetime" [(value)]="releaseDateTime" />
```

## Selection and constraints

- `selectionMode`: `single`, `range`, or `multiple` for calendar modes.
- `pickerMode`: `date`, `month`, `year`, `time`, or `datetime`.
- `minDate`, `maxDate`, `disabledDates`, `disabledDays`, `dateFilter`, and
  `isDateDisabled` compose into one availability decision.
- `showOtherMonths` controls rendering adjacent dates;
  `selectOtherMonths` controls whether they can be selected.
- `firstDayOfWeek` overrides the active locale when required.
- `showWeekNumbers` enables localized ISO week numbers.

Today and Clear commit immediately by default. Set `showApplyActions` to keep a
draft until Apply or Cancel. `showQuickActions` independently controls Today
and Clear.

## Time

`hourFormat`, `hourStep`, `minuteStep`, `secondStep`, and `showSeconds` control
the time editor. Time and datetime modes always use a draft with Apply and
Cancel. `minDateTime` and `maxDateTime` constrain the complete datetime value.

## Forms

DatePicker implements Angular 22's `FormValueControl`. One value model supports
Reactive Forms, template-driven forms and Signal Forms:

```html
<neural-date-picker [formControl]="dateControl" />
<neural-date-picker name="delivery" [(ngModel)]="deliveryDate" />
<neural-date-picker [formField]="checkoutForm.delivery" />
```

Disabled, readonly, required, invalid, touched and dirty state flow through the
form contract. Do not add a second ControlValueAccessor around DatePicker.

## Events

- `valueChange`: model synchronization, including `[(value)]`.
- `selectionChange` and `selected`: typed user-selection payloads.
- `cleared`: explicit clear with the previous value.
- `opened` and `closed`: rendered panel lifecycle.
- `viewChanged`: day, month and year view transitions.
- `monthChanged` and `yearChanged`: visible calendar navigation.
- `invalidInput`: deterministic parse/range failure details.

Programmatic value changes do not emit semantic selection events.

## Localization and RTL

The active `NeuralLocaleService` controls messages, display format, weekday and
month names, week start and direction. Pass `[locale]` for a component-level
override. `Intl.DateTimeFormat` is used only for display; use
`parseNeuralLocaleDate` for strict locale-aware parsing.

## Overlay and accessibility

The panel uses NeuralNg Popover and the browser top layer. It is not clipped by
overflow containers and does not require legacy `appendTo="body"` DOM
reparenting. Escape and committed actions restore focus to the input. Destroying
the component releases overlay listeners and timers.

The input exposes `aria-haspopup="dialog"`; the calendar uses a native ARIA
grid with roving tabindex. Arrow keys navigate days and weeks, Home/End move to
week edges, Page Up/Down changes month, Shift + Page Up/Down changes year, and
Enter/Space selects.

## Headless styling

`unstyled` removes NeuralNg visual classes while retaining structural `*-root`
hooks, semantics and behavior. Global `provideNeuralNg({ unstyled: true })` and
Field-owned unstyled mode are inherited. Use `NeuralDatePickerClasses` for
typed consumer slots.

The cascade is structural hooks -> component tokens -> theme tokens ->
consumer classes. Neutral is stable; Glass, Mist, and Futuristic are experimental
token-only presets.

Typed templates are available through `neuralDatePickerDay`,
`neuralDatePickerHeader`, `neuralDatePickerFooter`,
`neuralDatePickerTriggerIcon`, `neuralDatePickerPreviousIcon`, and
`neuralDatePickerNextIcon`.

## SSR

The server renders a closed deterministic shell with stable control/panel
relationships. Browser-only positioning starts after hydration.
