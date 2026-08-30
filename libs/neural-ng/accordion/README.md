# NeuralNg Accordion v0.1 Beta

Signals-first accessible disclosure groups for Angular 22+. Accordion supports
either concise data items or fully projected panel composition.

Current component maturity: `beta`.

## Import

```ts
import { NeuralAccordion, NeuralAccordionPanel, NeuralAccordionHeader, NeuralAccordionContent } from '@neural-ng/core/accordion';
```

## Data-driven usage

```html
<neural-accordion [items]="faqs" itemLabel="question" itemValue="id" itemContent="answer" itemDisabled="disabled" [(value)]="openFaq" />
```

`itemValue` must resolve to a unique string or number. When it is missing or
invalid, the stable render index is used. Data content is rendered as text, not
HTML. Duplicate values produce a development warning because panel identity
must remain deterministic.

## Projected composition

```html
<neural-accordion accordionId="settings" [(value)]="openPanel">
  <neural-accordion-panel value="profile">
    <neural-accordion-header>Profile</neural-accordion-header>
    <neural-accordion-content> Custom Angular content </neural-accordion-content>
  </neural-accordion-panel>
</neural-accordion>
```

Do not combine `items` and projected panels. In development, NeuralNg warns and
uses `items` if both sources are present.

Programmatic `value` writes update expansion state without emitting the
user-only `panelChange` event.

## State

`value` is a model input. In single mode it contains a string, number, or null.
With `multiple`, it contains an array of open values.

- `multiple`: allows several expanded panels. Default `false`.
- `collapsible`: allows the active single panel to close. Default `true`.
  It only changes single-mode behavior.
- `disabled`: disables every panel.
- `panelChange`: optional detailed user event with `panelValue`, `expanded`,
  previous/next model values, and `keyboard` or `pointer` source.

Normal `[(value)]` binding does not require importing
`NeuralAccordionPanelChange`.

## Accessibility and keyboard behavior

Every header is a native button. It owns `aria-expanded` and `aria-controls`;
each content region references its header with `aria-labelledby`. Collapsed
content is `aria-hidden` and inert.

- Enter or Space toggles the focused header through native button behavior.
- Arrow Down and Arrow Up move between enabled headers and wrap.
- Home and End focus the first and last enabled headers.
- Disabled headers are skipped.

IDs are deterministic and SSR-safe. Set `accordionId` when tests or external
relationships need a stable explicit prefix.

## Headless classes

`unstyled` removes NeuralNg visual classes while retaining structural behavior.
Application-wide `provideNeuralNg({ unstyled: true })` is also respected.

```ts
const classes: NeuralAccordionClasses = {
  root: 'faq',
  panel: 'faq__panel',
  expandedPanel: 'faq__panel--open',
  disabledPanel: 'faq__panel--disabled',
  header: 'faq__header',
  trigger: 'faq__trigger',
  label: 'faq__label',
  icon: 'faq__icon',
  content: 'faq__content',
  contentInner: 'faq__content-inner',
};
```

Projected sections additionally accept `panelClass`, `headerClass`,
`triggerClass`, and `contentClass`.

The default chevron uses CSS and does not require Neural Icons.

## Beta boundary

The Beta API does not create lazy content, fetch remote data, reorder panels,
or coordinate loading state. Put application-owned loading and error states
inside projected content. True lazy instantiation needs a separate template
contract and will be designed independently.
