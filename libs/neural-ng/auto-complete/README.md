# NeuralNg AutoComplete

Editable, accessible and headless-ready suggestions for Angular 22+.

## Import

```ts
import { NeuralAutoComplete, NeuralAutoCompleteOptionTemplate } from '@neural-ng/core/auto-complete';

@Component({ imports: [NeuralAutoComplete, NeuralAutoCompleteOptionTemplate] })
export class Example {}
```

## Local data

```html
<neural-auto-complete [options]="cities" optionLabel="name" optionValue="id" optionDisabled="disabled" filterBy="name,country,code" [(value)]="cityId" [(query)]="cityQuery" clearable showDropdown />
```

`value` is the committed form value. `query` is the editable input text. Keep
them separate in controlled flows. `valueMode="text"` makes the committed value
follow free text; the default `option` mode commits `optionValue` and
`forceSelection` commits an exact label match or removes unmatched text on blur.

## Angular Forms

AutoComplete implements `FormValueControl<TValue | string | null>`. The same
committed `value` model works with direct signal binding and all Angular Forms
adapters:

```html
<neural-auto-complete [(value)]="city" [options]="cities" />
<neural-auto-complete [formField]="profileForm.city" [options]="cities" />
<neural-auto-complete [formControl]="cityControl" [options]="cities" />
<neural-auto-complete name="city" [(ngModel)]="city" [options]="cities" />
```

Programmatic writes, form synchronization, and `reset()` do not emit
`selected`. A changed pointer, keyboard, or exact-label input selection emits
one `selected` event with the previous committed value.

Readonly is distinct from disabled. A readonly combobox remains enabled,
focusable, and exposes `aria-readonly="true"`. Its dropdown may open so options
can be inspected, but input, option, clear, and force-selection blur mutations
are blocked. Programmatic form writes and `reset()` remain available.

## Remote data

Use `dataMode="remote"` with `search`. The component never filters remote
results. Every event includes an increasing `requestId`; only apply a response
when its ID is still current.

```html
<neural-auto-complete dataMode="remote" [options]="results()" [loading]="loading()" [delay]="300" [minLength]="2" (search)="load($event)" />
```

## Accessibility

AutoComplete participates in Neural Field disabled, readonly, required,
invalid, pending, touch, and described-by state. DOM focus stays on the
`role="combobox"` input; `aria-activedescendant` points at the active
`role="option"`. Arrow Up/Down, Enter, Escape, and Tab follow the WAI-ARIA
editable combobox pattern. IME input does not emit partial searches.

## Headless API

Set `unstyled` locally or `provideNeuralNg({ unstyled: true })` globally.
Structural classes, semantics, Popover top-layer positioning, and behavior stay
active. `NeuralAutoCompleteClasses` exposes typed slots for every visual part.
The loading icon owns a dedicated `loadingIndicator` slot so it remains
centered independently from clear and dropdown actions.

Typed projected templates include `neuralAutoCompleteOption`,
`neuralAutoCompleteGroup`, `neuralAutoCompleteEmpty`,
`neuralAutoCompleteLoading`, `neuralAutoCompleteDropdownIcon`, and
`neuralAutoCompleteClearIcon`.

`AutoCompleteComponent` remains as a deprecated compatibility alias. New code
should use `NeuralAutoComplete`.

## Beta boundary

Beta includes single option/text values, local and remote data, groups, nested
paths, typed templates, localization, every Angular Forms API, and headless
ownership. Use MultiSelect for chips/multiple values and Select virtual
scrolling for very large fixed option sets. Grid popups and inline option
creation are outside this Beta contract.
