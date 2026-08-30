# NeuralNg Message

`@neural-ng/core/message` contains two deliberately separate contracts:

- `NeuralMessage` renders local feedback in normal document flow.
- `NeuralMessageService` is the headless Signal store consumed by renderers such
  as Toast.

## Inline component

```ts
import { NeuralMessage } from '@neural-ng/core/message';

@Component({ imports: [NeuralMessage] })
export class ProfileForm {}
```

```html
<neural-message severity="success" title="Profile saved" message="Your public information is up to date." />
```

Message stays where it is declared and requires no provider. It supports seven
severities, `filled`, `outlined`, and `simple` variants, three sizes,
automatic/custom icons, projected content, projected `[message-actions]`,
controlled dismissal, typed classes, local or global unstyled mode, RTL, dark
mode and reduced motion.

The immutable store value is named `NeuralMessageRecord`; this keeps it distinct
from the `NeuralMessage` component.

## Headless store setup

Register one configured message store at application bootstrap:

```ts
import { ApplicationConfig } from '@angular/core';
import { provideNeuralMessages } from '@neural-ng/core/message';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNeuralMessages({
      defaultDuration: 5000,
      importantDuration: null,
      maxVisible: 3,
    }),
  ],
};
```

Inject the service where an application action produces user feedback:

```ts
import { Component, inject } from '@angular/core';
import { NeuralMessageService } from '@neural-ng/core/message';

@Component({
  selector: 'app-save-action',
  standalone: true,
  template: `<button type="button" (click)="save()">Save</button>`,
})
export class SaveActionComponent {
  private readonly messages = inject(NeuralMessageService);

  save(): void {
    this.messages.notify({
      severity: 'success',
      title: 'Saved',
      message: 'Your changes were saved.',
    });
  }
}
```

Components such as Button should emit their own interaction events. Application
code should call `NeuralMessageService`; UI components should not produce global
messages automatically.

## Store message input

| Property      | Type                                                                                   | Default            | Description                                          |
| ------------- | -------------------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------- |
| `message`     | `string`                                                                               | Required           | Primary user-facing text. Blank values are rejected. |
| `severity`    | `'primary' \| 'secondary' \| 'neutral' \| 'info' \| 'success' \| 'warning' \| 'error'` | `'neutral'`        | Semantic importance used by renderers.               |
| `title`       | `string`                                                                               | None               | Optional short heading.                              |
| `channel`     | `string`                                                                               | Configured default | Routes the message to a renderer channel.            |
| `duration`    | `number \| null`                                                                       | Severity default   | Positive milliseconds or `null` for persistent.      |
| `dismissible` | `boolean`                                                                              | `true`             | Whether a renderer should expose user dismissal.     |
| `data`        | `unknown`                                                                              | None               | Application metadata for custom renderers.           |

## Configuration

| Option              | Default    | Description                                       |
| ------------------- | ---------- | ------------------------------------------------- |
| `defaultChannel`    | `'global'` | Channel used when input does not specify one.     |
| `defaultDuration`   | `5000`     | Duration for neutral, info, and success messages. |
| `importantDuration` | `null`     | Duration for warning and error messages.          |
| `maxVisible`        | `3`        | Maximum active messages retained per channel.     |

Warnings and errors are persistent by default. Passing `duration: null`
explicitly makes any severity persistent.

## Message References

`notify()` returns a reference that can dismiss the message and observe closure:

```ts
const ref = messages.notify({
  message: 'Uploading...',
  duration: null,
});

ref.closed(); // Signal<boolean>
ref.closeReason(); // Signal<NeuralMessageDismissReason | null>
ref.dismiss();
```

Close reasons are `api`, `clear`, `overflow`, `timeout`, and `user`. The Message
API uses `api`, `clear`, and `overflow`; renderers will use `timeout` and `user`.

## Channels and Clearing

```ts
messages.notify({ channel: 'editor', message: 'Draft saved.' });
messages.clear('editor');
messages.clear();
```

`maxVisible` is enforced independently per channel. When a channel exceeds the
limit, its oldest message closes with the `overflow` reason.

## Renderer Contract

Custom renderers can read the public message signal:

```ts
readonly messages = inject(NeuralMessageService).messages;
```

The Message API does not start dismissal timers. Timer ownership belongs to the
renderer so it can pause on hover, keyboard focus, page visibility, and SSR.

## AI Context

Machine-oriented rules are available in [llms.txt](./llms.txt).
