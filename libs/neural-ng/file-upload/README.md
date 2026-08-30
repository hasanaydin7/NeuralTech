# FileUpload

Signal-first file selection and client-side validation control for Angular 22+.
FileUpload owns native file picking, drag and drop, immutable selection state,
removal, clearing, and deterministic rejection events. It does not send HTTP
requests.

Current component maturity: **beta**.

```ts
import { NeuralFileUpload } from '@neural-ng/core/file-upload';
```

```html
<neural-file-upload name="documents" accept=".pdf,image/*" [(value)]="documents" multiple [maxFileSize]="10 * 1024 * 1024" [maxFiles]="5" fluid />
```

The model is always `readonly File[]`, including single-file mode. Single mode
replaces the current file. Multiple mode appends accepted files. FileUpload
creates a new array for every user mutation and never mutates the supplied
model.

FileUpload implements Angular's `FormValueControl<readonly File[]>` contract.
Use the same component with `[formField]`, `[formControl]`, `[(ngModel)]`, or
plain `[(value)]`. Validation rules belong in the form schema and on the server;
`accept`, `maxFileSize`, `maxFiles`, and duplicate checks are client-side UX
constraints only.

`selectionChange` reports the resulting value, accepted files, rejected files,
and the original event. `filesRejected`, `fileRemoved`, and `cleared` provide
focused user-action events. Rejection reasons are `file-type`, `file-size`,
`file-count`, and `duplicate`.

The component deliberately has no `url`, `headers`, `autoUpload`, `progress`,
or retry API. Submit selected files with `FormData` in application code. Do not rely on a
native browser form submission: the immutable model may contain files from
multiple chooser/drop interactions while the native `FileList` cannot be
programmatically synchronized. Never serialize `File` objects as JSON or base64
unless an external API explicitly requires that representation.

`readonly` preserves the visible selection while blocking choose, drop, remove,
and clear actions. `disabled` follows form ownership. The hidden native file
input retains `accept`, `multiple`, `capture`, `name`, and accessible field
relationships. The visible chooser is a real button; the dropzone is not a fake
button.

Set `unstyled` locally or globally. Structural hooks remain while visual base
classes are removed. Use direct root/input/dropzone/list classes or typed
`NeuralFileUploadClasses` slots for consumer-owned styling.

Public methods are `openFileDialog()`, `focus()`, `clear()`, and `reset()`.
`clear()` and `reset()` are programmatic and do not emit user-action events.

`FileUploadComponent` remains exported as a deprecated compatibility alias.
New code and generated output must use `NeuralFileUpload`.
