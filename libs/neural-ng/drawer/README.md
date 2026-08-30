# Drawer

Native top-layer, Signal-first edge panels for Angular 22+.

```ts
import { NeuralDrawer, NeuralDrawerHeader, NeuralDrawerBody, NeuralDrawerFooter, NeuralDrawerInitialFocus } from '@neural-ng/core/drawer';
```

```html
<neural-drawer #drawer position="end" ariaLabelledby="settings-title">
  <neural-drawer-header><h2 id="settings-title">Settings</h2></neural-drawer-header>
  <neural-drawer-body>Content</neural-drawer-body>
  <neural-drawer-footer>Actions</neural-drawer-footer>
</neural-drawer>
```

`position` accepts logical `start`, `end`, `top`, or `bottom`. Start and end
follow document direction. `open` is a Signal model; `show()`, `toggle()`, and
`close()` provide imperative control. Modal drawers use native dialog focus
containment and top-layer behavior.

Non-modal drawers use the browser Popover top layer when available, so they
remain above application chrome without making the document inert or trapping
focus. Browsers without Popover support fall back to native `dialog.show()`.

Close events report `api`, `escape`, `backdrop`, `close-button`, or `native`.
Use `closeOnEscape` and `dismissibleBackdrop` to control dismissal. The opener
regains focus after close and `neuralDrawerInitialFocus` selects initial focus.

Set `unstyled` locally or through `provideNeuralNg`. Structural hooks, dialog
semantics, focus behavior, and logical placement remain while typed `classes`
slots own the visual layer.

All public runtime declarations use canonical `NeuralDrawer*` names. The old
`DrawerComponent`, section component, and initial-focus directive names remain
only as deprecated compatibility aliases.
