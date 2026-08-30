# NeuralNg Toolbar

Accessible, standalone action grouping for Angular 22+.

**Beta status:** the documented contract is ready for application-level
validation. Beta consumers should still pin an exact version until stable.

```ts
import { NeuralToolbar, NeuralToolbarStart, NeuralToolbarCenter, NeuralToolbarEnd, NeuralToolbarSeparator } from '@neural-ng/core/toolbar';
```

```html
<neural-toolbar ariaLabel="Editor actions">
  <neural-toolbar-start>...</neural-toolbar-start>
  <neural-toolbar-separator />
  <neural-toolbar-center>...</neural-toolbar-center>
  <neural-toolbar-end>...</neural-toolbar-end>
</neural-toolbar>
```

Toolbar uses `role="toolbar"`, one roving tab stop, Arrow/Home/End navigation,
disabled-item skipping, RTL-aware horizontal arrows, and focus restoration of
consumer tabindex values on destroy. Use `orientation="vertical"` for vertical
toolbars. `wrap`, `loop`, and `rovingFocus` are configurable.

`ariaLabelledby` takes precedence over `ariaLabel`. The `focusChanged` output
emits the focused index, element, and native keyboard or focus event. Editable
controls keep their native arrow-key behavior. Dynamic projected controls are
resynchronized without leaking the internal MutationObserver.

Start, center, and end sections accept `sectionClass`; the separator accepts
`separatorClass`. Root-level `toolbarClass` and typed `classes` slots are both
available for the internal semantic elements.

Local/global `unstyled` removes NeuralNg visual classes while structural hooks
and typed `NeuralToolbarClasses` slots remain.

The former `Toolbar*Component` exports remain deprecated compatibility aliases.
New code should use the canonical `NeuralToolbar*` names.
