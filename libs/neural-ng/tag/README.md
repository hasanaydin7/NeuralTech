# NeuralNg Tag

Text-first classification and status labels for Angular 22+.

**Beta status:** the documented contract is ready for application-level
validation. Beta consumers should still pin an exact version until stable.

```ts
import { NeuralTag, type NeuralTagRemove } from '@neural-ng/core/tag';
```

```html
<neural-tag value="Angular" iconClass="nt nt-brand-angular" />
<neural-tag value="In progress" severity="warning" />
<neural-tag value="Frontend" removable (removed)="removeFilter($event)" />
```

Tag describes or classifies an item; Badge is intended for compact contextual
counts and indicators. Semantic severities are `primary`, `secondary`,
`neutral`, `info`, `success`, `warning`, and `error`. Sizes are `small`, `medium`, and
`large`; `rounded` defaults to `true`.

When `value` is absent, projected content is rendered. `iconClass` prepends an
icon and `iconAriaLabel` can make that icon meaningful; decorative icons are
hidden from assistive technology.

`removable` renders a native button. It emits `removed` with
`{ value, originalEvent }` and does not mutate application state itself.
`disabled` disables that button. `removeLabel` overrides the generated
accessible name and `removeIconClass` defaults to `nt nt-x`.

`unstyled` removes NeuralNg visual classes while preserving structural hooks.
Typed slots are `root`, `icon`, `label`, `content`, `removeButton`, and
`removeIcon`.

`TagComponent` remains as a deprecated compatibility alias. New code should
import `NeuralTag`.
