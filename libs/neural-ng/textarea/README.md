# NeuralNg Textarea

Native, Signal Forms-ready multiline text enhancement for Angular 22+.

**Beta status:** the documented contract is ready for application-level
validation. Beta consumers should still pin an exact version until stable.

## Import

```ts
import { NeuralTextarea, type NeuralTextareaResizeMode } from '@neural-ng/core/textarea';
```

Apply `neuralTextarea` to a native textarea:

```html
<label for="message">Message</label> <textarea neuralTextarea id="message" name="message" rows="5" maxlength="500"></textarea>
```

Textarea does not render a custom element or wrapper. Native attributes,
validation, labels, events, selection, form submission, and accessibility
semantics remain available without a forwarding API.

## Angular Signal Forms

Angular's stable v22 Signal Forms directive binds directly to the native host:

```ts
import { form, maxLength } from '@angular/forms/signals';

readonly profileForm = form(this.profile, (path) => {
  maxLength(path.biography, 500);
});
```

```html
<textarea neuralTextarea [formField]="profileForm.biography"></textarea>
```

Import `FormField` from `@angular/forms/signals` in the consumer. NeuralNg does
not add a ControlValueAccessor because the host is already a native form
control. Signal Forms owns constraint metadata, so use schema validators such
as `maxLength(path.biography, 500)` instead of adding a competing `maxlength`
attribute to the same `[formField]` host. FormField reflects that schema
constraint back to the native `maxlength` attribute at runtime. Native forms
without `[formField]` continue to declare `maxlength` normally.

## Auto resize

```html
<textarea neuralTextarea autoResize></textarea>
```

`autoResize` defaults to `false`. It uses the native CSS
`field-sizing: content` capability without reading `scrollHeight`, registering
browser listeners, or touching the DOM during SSR. Older browsers retain a
functional fixed-size textarea as progressive enhancement fallback.

When auto resize is active, `rows` and `cols` do not control the preferred
size. Use `--neural-textarea-auto-min-block-size` and
`--neural-textarea-auto-max-block-size` to constrain growth.

## Manual resize

`resizeMode` accepts `vertical` (default), `horizontal`, `both`, or `none`.
Auto resize takes precedence and exposes an effective `none` mode.

```html
<textarea neuralTextarea resizeMode="none"></textarea>
```

## Field composition

Inside `neural-field`, Textarea inherits the deterministic control ID,
descriptions, required, invalid, pending, disabled, native readonly, fluid, and
unstyled state.

## Classes, tokens, and unstyled mode

There is no `textareaClass` input because the host is the native textarea. Use
normal class bindings directly:

```html
<textarea neuralTextarea class="product-textarea" [class.compact]="compact()"></textarea>
```

`unstyled` removes all NeuralNg visual, fluid, resize, and auto-resize classes
while retaining `neural-textarea-root`, data attributes, consumer classes, and
native behavior. Global `provideNeuralNg({ unstyled: true })` is supported.

The neutral theme exposes `--neural-textarea-*` tokens for dimensions,
typography, placeholder, background, border, shadow, states, motion, and
auto-resize constraints.

## Public API

| Input        | Default      | Purpose                                      |
| ------------ | ------------ | -------------------------------------------- |
| `fluid`      | `false`      | Use full container width in styled mode      |
| `unstyled`   | `false`      | Remove NeuralNg visual and behavioral styles |
| `autoResize` | `false`      | Size to content through native CSS           |
| `resizeMode` | `'vertical'` | Configure manual resize in styled mode       |

The exported instance provides `focus(options?)` and `select()`. Use native
`input` and `change` events; Textarea does not invent duplicate outputs.

`TextareaComponent` remains as a deprecated compatibility alias. New code
should import `NeuralTextarea`.
