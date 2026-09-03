# NeuralNg

NeuralNg is an Angular UI component library designed first for AI coding agents
and fully usable by human developers. It combines Angular 22+, Signals,
standalone components, strict TypeScript, SSR, fine-grained secondary entry
points, component-level `llms.txt` contracts, and a read-only MCP server for
deterministic discovery.

The project is in early development. Button, Card, Checkbox, RadioGroup,
Switch, native Input and Textarea, localized InputNumber, accessible Field
composition, FileUpload, structured Editor, Select, MultiSelect, Tree, TreeSelect, DataView, VirtualScroller, Paginator, composable Tabs, hierarchical PanelMenu,
inline and popup Menu, arbitrary top-layer Popover, Tooltip, ProgressBar,
ProgressSpinner, LoadingOverlay, native Overlay positioning, the headless
Message API, its Toast renderer, timezone-safe DatePicker/TimePicker,
localization, and an optional Signal-based color-mode controller are the first
public building blocks.

The current package version is `0.1.0-beta.8`.

## Install

```sh
npm install @neural-ng/core
```

Install the optional class-based icon package separately when needed:

```sh
npm install @neural-ng/icons
```

```css
@import '@neural-ng/icons/icons.css';
```

```html
<i class="nt nt-user" aria-hidden="true"></i>
```

`@neural-ng/core` does not require a specific icon library. Neural Icons uses
framework-independent SVG masks; components continue to accept projected
content and custom icon systems.

Import the neutral reference theme once in the application's global stylesheet:

```css
@import '@neural-ng/core/themes/neutral.css';
```

## Button Quick Start

Import Button from its tree-shakable secondary entry point:

```ts
import { Component } from '@angular/core';
import { NeuralButton, NeuralButtonGroup } from '@neural-ng/core/button';

@Component({
  selector: 'app-save-action',
  standalone: true,
  imports: [NeuralButton, NeuralButtonGroup],
  template: ` <neural-button (clicked)="save()"> Save </neural-button> `,
})
export class SaveActionComponent {
  save(): void {
    // Persist changes.
  }
}
```

## DatePicker and TimePicker

Import the timezone-safe calendar and time picker from its secondary entry
point. Values are immutable plain objects rather than JavaScript timestamps.

```ts
import { NeuralDatePicker, type NeuralDateTimeParts, type NeuralTimeParts } from '@neural-ng/core/date-picker';
```

```html
<neural-date-picker pickerMode="time" [(value)]="meetingTime" [hourFormat]="12" [minuteStep]="15" showSeconds />

<neural-date-picker pickerMode="datetime" [(value)]="releaseDateTime" [minuteStep]="15" [minDateTime]="minimum" [maxDateTime]="maximum" />
```

`time` and `datetime` modes always use an Apply/Cancel draft so partial edits
never leak into the committed model. Their spinbutton fields accept numeric
keyboard input and Arrow Up/Down stepping. Use `hourStep`, `minuteStep`, and
`secondStep` to control increments. All visual hooks can be removed with
`unstyled` and replaced through typed time class slots.

DatePicker uses `Intl.DateTimeFormat` only for locale-aware display and
`formatToParts()` metadata. Parse user or API text explicitly with the strict
helper:

```ts
import { formatNeuralLocaleDate, parseNeuralLocaleDate } from '@neural-ng/core/date-picker';

parseNeuralLocaleDate('31.07.2026', 'tr-TR'); // { year: 2026, month: 7, day: 31 }
parseNeuralLocaleDate('02/31/2026', 'en-US'); // null
```

The parser enforces locale field order and separators, supports localized
decimal digits, uses the Gregorian calendar, and never accepts JavaScript Date
rollover. Component-level locale overrides also set local `dir`, weekday order,
date formatting, and keyboard direction without mutating global configuration.
The calendar follows the WAI-ARIA dialog/grid keyboard model with a single
roving day tab stop and a polite view announcement.

DatePicker is headless-ready from the first release. Local `unstyled` and
global `provideNeuralNg({ unstyled: true })` remove visual `*-base` classes but
retain structural hooks, ARIA, focus, overlay positioning, and consumer
classes. `NeuralDatePickerClasses` exposes typed state slots including
`trigger`, `today`, `selectedDay`, `rangeStart`, `rangeMiddle`, `rangeEnd`,
`disabledDay`, `footer`, and `timePicker`.

The style cascade is structural hooks -> component token consumption -> theme
tokens -> consumer classes. Neutral defines the stable DatePicker token set;
Glass and Futuristic only override those tokens. Use projected typed templates
for structural content customization:

```ts
import { NeuralDatePicker, NeuralDatePickerDayTemplate, NeuralDatePickerFooterTemplate, NeuralDatePickerHeaderTemplate, NeuralDatePickerNextIconTemplate, NeuralDatePickerPreviousIconTemplate, NeuralDatePickerTriggerIconTemplate } from '@neural-ng/core/date-picker';
```

```html
<neural-date-picker [(value)]="date">
  <ng-template neuralDatePickerDay let-day let-selected="selected">
    <span [class.selected]="selected">{{ day.date.day }}</span>
  </ng-template>
</neural-date-picker>
```

The six template selectors are `neuralDatePickerDay`,
`neuralDatePickerHeader`, `neuralDatePickerFooter`,
`neuralDatePickerTriggerIcon`, `neuralDatePickerPreviousIcon`, and
`neuralDatePickerNextIcon`. Their exported context types and Angular template
context guards keep `let-*` variables type checked.

DatePicker implements Angular 22's stable `FormValueControl` contract. The same
component therefore supports `[formControl]`, `[(ngModel)]`, and Signal Forms
`[formField]` without implementing a second ControlValueAccessor. Its `value`
model is the single source of truth; `touch` reports composite-control blur and
close interaction so touched/dirty/disabled state remains owned by the form.

Semantic outputs complement `valueChange`: `opened`, `closed`, `selected`,
`cleared`, `viewChanged`, `monthChanged`, `yearChanged`, and `invalidInput`.
`selected` carries the same typed payload as `selectionChange`; view and
calendar navigation outputs contain both previous and next state. Invalid year
or time text reports its field, raw input, and `format` or `range` reason.

DatePicker panels use the browser top layer through NeuralNg Popover. This is
the clipping-safe equivalent of legacy `appendTo="body"` APIs without moving or
cloning Angular-owned DOM. Escape and committed selections restore focus to the
input; destroying the component releases positioning listeners and pending
overlay timers. The server renders a closed, deterministic shell so hydration
starts from the same control and panel identifiers.

## FileUpload

FileUpload is an immutable `readonly File[]` form control for native file
selection, drag and drop, client-side rejection feedback, removal, and clearing.
It never sends HTTP requests. Single mode replaces the selected file; `multiple`
appends accepted files.

```ts
import { FileUploadComponent } from '@neural-ng/core/file-upload';
```

```html
<neural-file-upload name="attachments" accept=".pdf,image/*" [(value)]="attachments" multiple [maxFileSize]="10 * 1024 * 1024" [maxFiles]="5" fluid />
```

Submit files with `FormData` in application code. Client-side `accept`, size,
count, and duplicate checks are UX only; validate file type, size, filename, and
content again on the server. FileUpload implements
`FormValueControl<readonly File[]>` for Signal, Reactive, and template-driven
Forms without a second ControlValueAccessor.

## Editor

Editor is distributed separately so Core stays lightweight:

```bash
npm install @neural-ng/editor
```

```ts
import { EditorComponent, type NeuralEditorDocument } from '@neural-ng/editor';
```

The standalone package installs its Tiptap, ProseMirror, Floating UI, and Yjs
runtime automatically while continuing to use NeuralNg configuration, locale,
field, and popover contracts from Core. JSON remains the canonical model.
Editor does not persist content, upload files, call AI models, create network
providers, or sanitize backend output.

## Forms foundation

NeuralNg uses Angular 22's Signal Forms control contracts as the canonical
custom-control boundary. Value controls expose one writable `value` model;
binary controls expose one writable `checked` model. Do not add a parallel
`ControlValueAccessor` or `NG_VALUE_ACCESSOR` provider. Angular adapts the same
signal contract for Signal, Reactive, and template-driven Forms:

```html
<neural-select [formField]="profileForm.city" [options]="cities" />
<neural-select [formControl]="cityControl" [options]="cities" />
<neural-switch name="alerts" [(ngModel)]="alerts" />
```

Composite controls emit `touch` when focus leaves the control or its popup
interaction completes. Controls accept form-owned `disabled`, `readonly`,
`required`, `invalid`, `pending`, `touched`, and `dirty` state where relevant,
and expose `focus()` plus `reset()` for orchestration. Validation belongs to the
form schema rather than component-local validator implementations.

Checkbox uses two explicit Forms contracts. `neural-checkbox` implements
`FormCheckboxControl` with a boolean `checked` model.
`neural-tri-state-checkbox` implements `FormValueControl<boolean | null>` with
a nullable `value` model, so mixed state never weakens the binary contract.

RadioGroup and Select implement `FormValueControl<TValue | null>` for
single-value choice controls. AutoComplete implements
`FormValueControl<TValue | string | null>` while keeping editable `query`
separate from the committed value. MultiSelect implements
`FormValueControl<readonly TValue[]>` with immutable arrays. TreeSelect
implements `FormValueControl<NeuralTreeSelectValue<TValue>>`, using
`TValue | null` in single mode and immutable `readonly TValue[]` values in
multiple or checkbox mode. Their primary selection outputs are user-only;
programmatic writes, readonly state, and reset update the value model without
semantic selection events. Readonly keeps the active control focusable, uses
`aria-readonly` instead of native disabled state, and allows popup inspection
while blocking value mutations. TreeSelect keeps filtering and branch expansion
available while blocking Tree selection, clear, and chip removal.

## Global Configuration

Global unstyled mode, logical direction, and density are configured together:

```ts
import { provideNeuralNg } from '@neural-ng/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNeuralNg({
      unstyled: false,
      direction: 'auto',
      density: 'comfortable',
    }),
  ],
};
```

`direction: 'auto'` follows the active NeuralNg locale. Inject
`NeuralNgService` to change direction or density at runtime. The service writes
the native `dir` attribute plus namespaced `data-neural-direction` and
`data-neural-density` attributes on the document root. It does not mutate the
DOM during SSR.

The same provider accepts a tree-shakable initial locale:

```ts
import { neuralTr } from '@neural-ng/core/locales/tr';

provideNeuralNg({ locale: neuralTr });
```

Use `NeuralLocaleService.use(...)` for runtime switching. NeuralNg never infers
the locale from a browser global, preserving deterministic SSR and hydration.

## Light, dark, and system modes

Theme identity and color mode are separate. Themes use
`data-neural-theme="neutral|glass|mist|futuristic"`; the resolved color mode uses
`data-neural-mode="light|dark"`.

```ts
import { provideNeuralColorMode } from '@neural-ng/core/color-mode';

export const appConfig: ApplicationConfig = {
  providers: [provideNeuralColorMode({ defaultMode: 'system' })],
};
```

The service is optional: applications may manage `data-neural-mode` themselves.
NeuralNg never owns Tailwind's `.dark` class. Tailwind v4 can explicitly bind its
dark variant to the NeuralNg attribute; see the Color Mode documentation.

## Primitive palettes and Tailwind CSS v4

The neutral theme exposes stable `--neural-color-primary-{50..950}` and
`--neural-color-surface-{50..950}` primitive palettes. Surface also includes
`--neural-color-surface-0`. Light and dark mode switch semantic aliases such as
`--neural-color-primary` and `--neural-color-surface`; primitive steps retain
their meaning.

Tailwind is optional. Import the bridge only from a Tailwind-processed global
stylesheet:

```css
@import 'tailwindcss';
@import '@neural-ng/core/themes/neutral.css';
@import '@neural-ng/core/themes/tailwind.css';
```

The bridge uses Tailwind v4 theme variables, enabling utilities such as
`bg-primary-50`, `text-primary-700`, `border-surface-300`, and
`dark:bg-surface-900`. Tailwind remains absent from NeuralNg runtime and peer
dependencies.

## Package Entry Points

| Import                                               | Purpose                                            |
| ---------------------------------------------------- | -------------------------------------------------- |
| `@neural-ng/core`                                    | Package-level public API                           |
| `@neural-ng/core/badge`                              | Semantic counts, statuses, dots, and metadata      |
| `@neural-ng/core/breadcrumb`                         | Router-aware breadcrumb with responsive overflow   |
| `@neural-ng/core/button`                             | Standalone Button component                        |
| `@neural-ng/core/card`                               | Composable, headless-capable Card sections         |
| `@neural-ng/core/checkbox`                           | Native binary and tri-state Signal checkbox        |
| `@neural-ng/core/color-mode`                         | Optional Signal light/dark/system controller       |
| `@neural-ng/core/field`                              | Label, hint, error, and control state composition  |
| `@neural-ng/core/input`                              | Native, Signal Forms-ready text input              |
| `@neural-ng/core/avatar`                             | Image, initials, status, and grouped identities    |
| `@neural-ng/core/input-number`                       | Localized numeric and currency spinbutton          |
| `@neural-ng/core/input-mask`                         | Native caret-aware formatted text input            |
| `@neural-ng/core/input-otp`                          | Accessible one-time verification code input        |
| `@neural-ng/core/password`                           | Native, password-manager-friendly secure input     |
| `@neural-ng/core/i18n`                               | Runtime locale signal and provider                 |
| `@neural-ng/core/locales/en`                         | Tree-shakable English locale                       |
| `@neural-ng/core/locales/tr`                         | Tree-shakable Turkish locale                       |
| `@neural-ng/core/locales/de`                         | Tree-shakable German locale                        |
| `@neural-ng/core/locales/fr`                         | Tree-shakable French locale                        |
| `@neural-ng/core/locales/es`                         | Tree-shakable Spanish locale                       |
| `@neural-ng/core/locales/pt-br`                      | Tree-shakable Brazilian Portuguese locale          |
| `@neural-ng/core/locales/ar`                         | Tree-shakable Arabic RTL locale                    |
| `@neural-ng/core/locales/zh-cn`                      | Tree-shakable Simplified Chinese locale            |
| `@neural-ng/core/message`                            | Headless Signal-based notification state           |
| `@neural-ng/core/menu`                               | Accessible inline and popup command menu           |
| `@neural-ng/core/overlay`                            | Shared native-first floating UI positioner         |
| `@neural-ng/core/panel-menu`                         | Inline hierarchical Accordion + Tree navigation    |
| `@neural-ng/core/sidebar`                            | Responsive application-shell navigation            |
| `@neural-ng/core/paginator`                          | Signal paginator with an accessible range report   |
| `@neural-ng/core/popover`                            | Arbitrary non-modal top-layer content              |
| `@neural-ng/core/radio`                              | Native data-driven or projected Signal radio group |
| `@neural-ng/core/select`                             | Signal combobox with data or projected options     |
| `@neural-ng/core/slider`                             | Native accessible numeric range control            |
| `@neural-ng/core/switch`                             | Native boolean Signal switch                       |
| `@neural-ng/core/tag`                                | Text-first classification and removable labels     |
| `@neural-ng/core/tabs`                               | Composable, accessible Signal tabs                 |
| `@neural-ng/core/textarea`                           | Native Signal Forms-ready multiline text control   |
| `@neural-ng/core/tooltip`                            | Accessible text Tooltip directive                  |
| `@neural-ng/core/toast`                              | Standalone, headless-capable Toast renderer        |
| `@neural-ng/core/themes/neutral.css`                 | Stable neutral reference theme                     |
| `@neural-ng/core/themes/tailwind.css`                | Optional Tailwind CSS v4 color-token bridge        |
| `@neural-ng/core/themes/experimental/glass.css`      | Experimental Glass token preset                    |
| `@neural-ng/core/themes/experimental/mist.css`       | Experimental calm blur-based Mist token preset     |
| `@neural-ng/core/themes/experimental/futuristic.css` | Experimental Futuristic token preset               |

Experimental themes contain CSS custom-property values only. Their token values
may change before they are promoted to stable themes.

## Design Principles

- Standalone Angular components; no consumer NgModules.
- Signal inputs and modern `output()` APIs.
- Native HTML semantics and accessible keyboard behavior.
- Headless usage through `unstyled` and native-element class APIs.
- Component-scoped CSS custom properties for themes.
- Independent visual-theme and resolved color-mode attributes.
- SSR-safe component code with no browser-global assumptions.
- Component-level README and `llms.txt` context files.

## Tooltip Quick Start

```ts
import { NeuralTooltip } from '@neural-ng/core/tooltip';
```

```html
<button neuralTooltip="Delete account">Delete</button>
```

Tooltip uses the browser Popover API for top-layer rendering and the shared
Overlay positioner for CSS Anchor Positioning or its viewport-aware fallback.

## Message Quick Start

```ts
import { ApplicationConfig, Injectable, inject } from '@angular/core';
import { NeuralMessageService, provideNeuralMessages } from '@neural-ng/core/message';

export const appConfig: ApplicationConfig = {
  providers: [provideNeuralMessages()],
};

@Injectable({ providedIn: 'root' })
export class SaveFeedback {
  private readonly messages = inject(NeuralMessageService);

  success(): void {
    this.messages.notify({
      severity: 'success',
      message: 'Changes saved.',
    });
  }
}
```

Render the default global channel at the default `top-end` position:

```ts
import { NeuralToast } from '@neural-ng/core/toast';

@Component({
  imports: [NeuralToast],
  template: `<neural-toast />`,
})
export class App {}
```

`provideNeuralToast()` is optional. Toast v0.1 supports nine logical positions,
modern `animate.enter`/`animate.leave`, progress, hover/focus pause, touch/pen
swipe, stable live regions, optional severity icons, and type-safe custom
templates. Default Toast artwork uses the separately installed Neural Icons
stylesheet; `iconClass` remains compatible with other class-based icon systems.

## Documentation

- [Button documentation](./button/README.md)
- [Card documentation](./card/README.md)
- [Checkbox documentation](./checkbox/README.md)
- [Color Mode documentation](./color-mode/README.md)
- [DataView documentation](./data-view/README.md)
- [VirtualScroller documentation](./virtual-scroller/README.md)
- [Field documentation](./field/README.md)
- [Message API documentation](./message/README.md)
- [Input documentation](./input/README.md)
- [InputNumber documentation](./input-number/README.md)
- [Localization documentation](./i18n/README.md)
- [Radio documentation](./radio/README.md)
- [Popover documentation](./popover/README.md)
- [Select documentation](./select/README.md)
- [TreeSelect documentation](./tree-select/README.md)
- [Switch documentation](./switch/README.md)
- [Textarea documentation](./textarea/README.md)
- [Toast documentation](./toast/README.md)
- [Tabs documentation](./tabs/README.md)
- [Package AI context](./llms.txt)
- [Button AI context](./button/llms.txt)
- [Card AI context](./card/llms.txt)
- [Checkbox AI context](./checkbox/llms.txt)
- [Color Mode AI context](./color-mode/llms.txt)
- [DataView AI context](./data-view/llms.txt)
- [VirtualScroller AI context](./virtual-scroller/llms.txt)
- [Field AI context](./field/llms.txt)
- [Message API AI context](./message/llms.txt)
- [Input AI context](./input/llms.txt)
- [InputNumber AI context](./input-number/llms.txt)
- [Radio AI context](./radio/llms.txt)
- [Popover AI context](./popover/llms.txt)
- [Select AI context](./select/llms.txt)
- [TreeSelect AI context](./tree-select/llms.txt)
- [Switch AI context](./switch/llms.txt)
- [Textarea AI context](./textarea/llms.txt)
- [Toast AI context](./toast/llms.txt)
- [Tabs AI context](./tabs/llms.txt)
- [Neutral theme tokens](./themes/neutral.css)

## Workspace Commands

```sh
npx nx build neural-ng
npx nx test neural-ng
npx nx package-test neural-ng
npx playwright test apps/neural-demo-e2e/src/tabs.spec.ts \
  --config=apps/neural-demo-e2e/playwright.config.mts \
  --project=chromium
npx playwright test apps/neural-demo-e2e/src/button.spec.ts \
  --config=apps/neural-demo-e2e/playwright.config.mts \
  --project=chromium
```

### Editor collaboration boundary

Editor Alpha 4 accepts an application-owned Yjs document and optional provider.
It adds collaborative carets/presence, inline comments, local suggestion-mode
text changes, and controlled JSON snapshots without coupling NeuralNg to a
specific collaboration server. Room naming, authentication, provider creation,
Yjs update persistence, permissions, and audit storage remain application or
backend responsibilities.
