# NeuralNg Card

Card Beta is a composable, headless-capable content container. It uses native
`article`, `header`, and `footer` elements while keeping visual ownership in CSS
classes and design tokens.

## Import

```ts
import { NeuralCard, NeuralCardBody, NeuralCardFooter, NeuralCardHeader } from '@neural-ng/core/card';
```

## Basic composition

```html
<neural-card ariaLabelledby="profile-card-title">
  <neural-card-header>
    <h2 id="profile-card-title">Profile</h2>
  </neural-card-header>

  <neural-card-body>
    <p>Manage the public details shown on your account.</p>
  </neural-card-body>

  <neural-card-footer>
    <neural-button>Save</neural-button>
  </neural-card-footer>
</neural-card>
```

The root renders a native `<article>`. Use `role="region"` only when the card is
important enough to be a named landmark and provide `ariaLabel` or
`ariaLabelledby`. Ordinary cards normally need no explicit role or accessible
name.

Header, body, and footer are independent standalone components. They must be
placed inside `neural-card`; omit any section that is not needed. Project real
heading elements instead of relying on presentational title inputs.

## Inputs

### `neural-card`

| Input            | Type                                         | Default | Purpose                                      |
| ---------------- | -------------------------------------------- | ------- | -------------------------------------------- |
| `role`           | `article \| region \| group \| presentation` | `null`  | Optional explicit role on the native article |
| `ariaLabel`      | `string \| null`                             | `null`  | Accessible name                              |
| `ariaLabelledby` | `string \| null`                             | `null`  | ID reference for the accessible name         |
| `cardClass`      | `string`                                     | `''`    | Class applied to the native article          |
| `classes`        | `NeuralCardClasses`                          | `{}`    | Typed root/header/body/footer class slots    |
| `unstyled`       | `boolean`                                    | `false` | Remove NeuralNg visual classes               |

Section components accept `headerClass`, `bodyClass`, and `footerClass`
respectively. Local section classes are additive to the matching `classes`
slot.

## Headless usage

```html
<neural-card
  unstyled
  cardClass="rounded-xl border border-slate-700 bg-slate-950"
  [classes]="{
    header: 'p-5 border-b border-slate-700',
    body: 'p-5 text-slate-300',
    footer: 'flex gap-3 p-5'
  }"
>
  <neural-card-header><h2>Custom card</h2></neural-card-header>
  <neural-card-body>Owned entirely by consumer classes.</neural-card-body>
</neural-card>
```

`unstyled` removes only `*-base` visual classes. Structural hooks, projected
content, native semantics, ARIA attributes, and consumer classes remain.
`provideNeuralNg({ unstyled: true })` enables the same behavior globally.

## Design tokens

The stable neutral theme defines `--neural-card-*` tokens for background,
border, radius, shadow, typography, section padding, alignment, gaps, and
optional section borders. Glass, Mist, and Futuristic override only token values.
Consumers can override tokens on any ancestor or use `unstyled` for full class
ownership.

Card contains no browser-only APIs and is safe for SSR and hydration.

## Compatibility aliases

`CardComponent`, `CardHeaderComponent`, `CardBodyComponent`, and
`CardFooterComponent` remain deprecated compatibility aliases. New code and AI
generated code must use the canonical `NeuralCard*` symbols.
