# Divider

`NeuralDivider` separates related content with native separator semantics,
logical orientation, optional content, and a fully headless visual contract.

```ts
import { NeuralDivider, type NeuralDividerClasses } from '@neural-ng/core/divider';
```

```html
<neural-divider />
<neural-divider label="OR" align="center" type="dashed" />
<neural-divider orientation="vertical" ariaLabel="Primary and secondary actions" />
```

Use projected content when the divider needs richer markup:

```html
<neural-divider>
  <span class="section-label">Advanced</span>
</neural-divider>
```

## API

- `orientation`: `horizontal | vertical`; default `horizontal`.
- `align`: `start | center | end`; default `center`.
- `type`: `solid | dashed | dotted`; default `solid`.
- `label`: optional plain-text content; takes precedence over projection.
- `ariaLabel`, `ariaLabelledBy`: optional accessible naming. `ariaLabelledBy`
  takes precedence.
- `unstyled`: removes NeuralNg visual classes while preserving separator
  semantics and structural orientation hooks.
- `dividerClass`: consumer class on the root.
- `classes`: typed `root`, `before`, `content`, and `after` slots.

The component renders `role="separator"` and explicit `aria-orientation`.
Theme tokens use the `--neural-divider-*` prefix.

`NeuralDivider` is canonical. `DividerComponent` remains a deprecated
compatibility alias.
