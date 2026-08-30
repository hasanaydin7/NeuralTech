# NeuralNg Dialog

Dialog Beta is the native, Signals-first modal and non-modal composition
primitive for Angular 22+.

## Import

```ts
import { NeuralDialog, NeuralDialogBody, NeuralDialogFooter, NeuralDialogHeader, NeuralDialogInitialFocus } from '@neural-ng/core/dialog';
```

## Basic usage

```html
<neural-button (clicked)="accountDialog.show()">Edit account</neural-button>

<neural-dialog #accountDialog ariaLabelledby="account-dialog-title" ariaDescribedby="account-dialog-description" (closed)="lastCloseReason.set($event.reason)">
  <neural-dialog-header>
    <h2 id="account-dialog-title">Edit account</h2>
  </neural-dialog-header>
  <neural-dialog-body>
    <p id="account-dialog-description">Update the public account name.</p>
    <input neuralDialogInitialFocus aria-label="Account name" />
  </neural-dialog-body>
  <neural-dialog-footer>
    <button type="button" (click)="accountDialog.close()">Cancel</button>
    <button type="button" (click)="accountDialog.close('api', 'saved')">Save</button>
  </neural-dialog-footer>
</neural-dialog>
```

`open` is a model input, so `[(open)]` is also supported. `show()` and
`close()` are concise imperative conveniences for trigger-driven interfaces.

All public runtime declarations use canonical `NeuralDialog*` names. The old
`DialogComponent`, `DialogHeaderComponent`, `DialogBodyComponent`,
`DialogFooterComponent`, and `DialogInitialFocusDirective` names remain only as
deprecated compatibility aliases.

## Inputs and outputs

- `open`: Signal model, default `false`.
- `modal`: uses native `showModal()` when true and `show()` when false. Default
  `true`.
- `closable`: renders the localized close button. Default `true`.
- `closeOnEscape`: controls Escape dismissal. Default `true`.
- `dismissibleBackdrop`: controls pointer dismissal outside a modal dialog.
  Default `true`.
- `fluid`: expands to the viewport-safe width.
- `full`: fills the entire dynamic viewport with square, borderless edges.
- `showFullScreenButton`: renders a localized maximize/minimize toggle directly
  before the close action. User changes emit `fullChange`.
- `ariaLabel`, `ariaLabelledby`, `ariaDescribedby`: accessible naming and
  description.
- `closeLabel`: overrides the localized common close label.
- `unstyled`, `dialogClass`, `classes`: visual-class ownership.
- `opened`: fires after the native dialog opens.
- `closed`: emits `NeuralDialogClose` with `reason`, `returnValue`, and the
  originating native event.

Close reasons are `api`, `escape`, `backdrop`, `close-button`, and `native`.
`native` covers a close initiated directly by native dialog behavior, such as a
projected `form method="dialog"`.

## Focus and accessibility

The component renders a real `<dialog>`. Modal dialogs therefore use the
browser top layer and make the rest of the document inert. Give every dialog an
accessible name with either `ariaLabel` or `ariaLabelledby`. Add
`neuralDialogInitialFocus` to the most useful first control. The element that
opened the dialog is focused again after closing.

Escape is intercepted so a blocked dismissal stays open and every accepted
dismissal has a deterministic close reason. The component does not install a
global keyboard listener.

## Headless classes

`unstyled` removes NeuralNg visual classes while retaining structural hooks and
native behavior. Application-wide headless mode from
`provideNeuralNg({ unstyled: true })` is also respected.

```ts
const classes: NeuralDialogClasses = {
  root: 'app-dialog',
  header: 'app-dialog__header',
  body: 'app-dialog__body',
  footer: 'app-dialog__footer',
  closeButton: 'app-dialog__close',
  closeIcon: 'app-dialog__close-icon',
};
```

Section-local `headerClass`, `bodyClass`, and `footerClass` inputs are merged
after typed slot classes.

## SSR and hydration

Server rendering outputs a closed native `<dialog>`. `showModal()`, `show()`,
focus, and active-element reads run only in the browser. When `open` starts
true, the dialog opens after hydration without requiring browser globals on the
server.

## Beta boundary

Dialog Beta includes native modal and non-modal behavior, controlled Signals,
deterministic close reasons, focus restoration, localized controls, responsive
fluid sizing, typed class slots, global/local unstyled mode, SSR safety, and
complete theme tokens and an optional full-screen toggle. Confirmation
workflows belong to ConfirmDialog; dragging and resizing remain outside this
base primitive.
