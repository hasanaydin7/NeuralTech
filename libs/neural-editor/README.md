# Editor

Status: **Beta**. The canonical standalone export is `NeuralEditor`;
`EditorComponent` remains a deprecated compatibility alias.

Signal-first structured rich-text editing for Angular 22+. NeuralNg Editor uses
Tiptap 3 and ProseMirror internally, while its canonical form value remains a
`NeuralEditorDocument` JSON tree. HTML is derived output, never the model.

## Install

Install the complete Editor runtime with one command:

```bash
npm install @neural-ng/editor
```

The package installs Tiptap, ProseMirror, Floating UI, Yjs, and the required
NeuralNg core runtime. Applications do not install those Editor internals
individually. A realtime collaboration transport such as `y-websocket` or a
Hocuspocus provider remains application-owned and is only needed when that
feature is enabled.

```ts
import {
  NeuralEditor,
  type NeuralEditorDocument,
} from '@neural-ng/editor';

readonly document = signal<NeuralEditorDocument>({
  type: 'doc',
  content: [{ type: 'paragraph' }],
});
```

```html
<neural-editor [(value)]="document" ariaLabel="Article body" placeholder="Write the article..." showCharacterCount showWordCount [maxCharacters]="5000" fluid />
```

Editor implements `FormValueControl<NeuralEditorDocument>`. Use the same
component with `[(value)]`, `[formField]`, `[formControl]`, or `[(ngModel)]`.
Do not implement a second `ControlValueAccessor`.

`EditorComponent` remains a deprecated compatibility alias. New code should
import the canonical `NeuralEditor` runtime.

## Public API contract

The standalone package contract is documented in [`API_FREEZE.md`](./API_FREEZE.md).
Import only from `@neural-ng/editor`; deep imports and internal rendering
components are unsupported. The freeze document is the source of truth for
component inputs/outputs, controller methods, template contexts, class slots,
utilities, and package asset entry points.

### Theme

Import the matching Core and Editor token files:

```css
@import '@neural-ng/core/themes/neutral.css';
@import '@neural-ng/editor/themes/neutral.css';
```

Experimental presets follow the same two-file rule: import the matching Core
preset first, then the Editor preset. The optional Tailwind bridge remains
`@neural-ng/core/themes/tailwind.css`.

## Ownership boundary

Editor owns structured editing, toolbar commands, selection state, undo/redo,
JSON output, HTML/text derivation, accessibility, and Angular Forms
integration. It does not save documents, call HTTP APIs, upload image files,
invoke AI models, connect collaboration providers, or sanitize backend output. Those
responsibilities belong to application services or explicit extensions.

## Canonical value

The model is never HTML, Markdown, or a format-dependent union:

```ts
export interface NeuralEditorDocument {
  readonly type: 'doc';
  readonly content?: readonly NeuralEditorNode[];
}
```

The current Beta schema and interaction layer includes:

- paragraph and heading alignment: `left`, `center`, `right`, `justify`
- text color through a `textStyle` mark
- multicolor highlight marks
- `taskList` and `taskItem` nodes
- `table`, `tableRow`, `tableHeader`, and `tableCell` nodes
- `image` nodes containing persistent URLs, alt text, title, width, and height
- BubbleMenu, FloatingMenu, and a selection-aware link popover
- slash commands, async mentions, and a searchable command palette

Persist a schema version beside long-lived documents:

```ts
const stored = {
  schemaVersion: 1,
  document: document(),
} satisfies NeuralEditorStoredDocument;
```

Use the serializers for external representations:

```ts
const html = editorDocumentToHtml(document());
const restored = editorDocumentFromHtml(html);
const text = editorDocumentToText(document());
```

The default serializers include the current Beta schema, including image and
mention nodes. Pass the matching custom extension set when converting documents
with additional nodes or marks.

## Stable node IDs and structured operations

The Beta contract enables Tiptap `UniqueID` by default. Identified nodes receive a
`neuralId` attribute in canonical JSON. The default list covers block nodes,
list items, tables and cells, images, and horizontal rules. Configure this at
initialization time:

```html
<neural-editor [(value)]="document" nodeIdAttribute="neuralId" [identifiedNodeTypes]="['paragraph', 'heading', 'image']" />
```

Use `nodeIdGenerator` only when the application requires a custom ID strategy.
The generator must return a non-empty, globally unique, stable string. Disable
the feature with `[enableNodeIds]="false"` only when the document will never use
structured operations, AI review, comments, or collaboration adapters.

The controller exposes a document-only revision signal and node lookup:

```ts
const revision = controller.revision();
const paragraph = controller.getNodeById('paragraph-a1b2');
const nodeId = controller.getNodeIdAt(selection.from);
```

Build and apply atomic, schema-checked operation batches through the controller:

```ts
const batch = controller.createOperationBatch(
  [
    {
      type: 'replace',
      target: { nodeId: 'paragraph-a1b2' },
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Rewritten content' }],
        },
      ],
    },
  ],
  { id: 'rewrite-1', metadata: { source: 'application' } },
);

const validation = controller.validateOperations(batch);
if (validation.valid) {
  const result = controller.applyOperations(batch);
}
```

Supported operations are `insert`, `replace`, `delete`, and `update-node`.
Prefer `nodeId` targets. Numeric `from`/`to` targets are accepted for captured
selection ranges and are mapped across earlier operations in the same batch.
A batch is built fully before dispatch, so one invalid operation rejects the
whole batch without partial document changes.

`baseRevision` prevents stale edits. If the document changes after a batch is
created, `applyOperations()` returns `status: 'conflict'` and emits
`operationConflict`. Successful and rejected batches emit `operationsApplied`
and `operationsRejected` respectively.

Node IDs are protected identity. Inserted content cannot choose IDs;
`UniqueID` assigns them. A compatible single-node replacement preserves the
target ID by default. `update-node` cannot change the configured ID attribute.

Internal IDs are excluded from HTML by default:

```ts
const publicHtml = editorDocumentToHtml(document);
const diagnosticHtml = editorDocumentToHtml(document, {
  includeNodeIds: true,
});

const identified = editorDocumentWithNodeIds(legacyDocument);
```

Persist canonical JSON with IDs. Do not use generated HTML as the source of
truth for operations.

## AI requests and reviewable proposals

Editor remains provider-neutral. It never calls OpenAI, Anthropic, or any other
model directly. Request work through the controller and handle the event in
application code:

```html
<neural-editor [(value)]="document" (editorReady)="controller = $event" (aiRequest)="handleAiRequest($event)" (aiProposalAccepted)="saveAcceptedProposal($event)" />
```

```ts
async handleAiRequest(event: NeuralEditorAiRequestEvent) {
  const proposal = await aiService.edit(event.request);
  event.controller.previewAiProposal(proposal);
}
```

`requestAi()` captures the canonical JSON document, document revision, current
selection range, selected text, selected JSON content, and stable node IDs. The
application service returns a `NeuralEditorAiProposal` containing only the
structured operations from the current Beta contract.

Preview is non-destructive. Insertions, deletions, replacements, and attribute
updates are rendered as ProseMirror decorations while `[(value)]` remains
unchanged. Only `acceptAiProposal()` applies the complete operation batch in one
transaction. `rejectAiProposal()` removes the preview without touching the
model.

```ts
const request = controller.requestAi('rewrite', {
  instruction: 'Make this paragraph concise.',
});

controller.previewAiProposal({
  id: 'proposal-1',
  requestId: request.id,
  baseRevision: request.baseRevision,
  summary: 'Rewrite the introduction',
  operations: [
    {
      type: 'replace',
      target: { nodeId: request.selection.nodeIds[0] },
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Concise replacement.' }],
        },
      ],
    },
  ],
});
```

A proposal is rejected as a conflict when its `baseRevision` no longer matches
the editor revision. Editing the document while a preview is active also clears
the preview and emits `aiOperationConflict`. Do not silently overwrite the base
revision or force stale operations onto new content.

The default review bar appends to `menuAppendTo` and supports previous/next,
accept, reject, Escape, mobile layout, themes, and `unstyled`. Replace it with a
typed template when needed:

```html
<ng-template neuralEditorAiReview let-review="review" let-previous="previous" let-next="next" let-accept="accept" let-reject="reject">
  @if (review(); as state) {
  <span>{{ state.activeOperationIndex + 1 }} / {{ state.operationCount }}</span>
  <button type="button" (click)="previous()">Previous</button>
  <button type="button" (click)="next()">Next</button>
  <button type="button" (click)="reject()">Reject</button>
  <button type="button" (click)="accept()">Accept</button>
  }
</ng-template>
```

`controller.aiReview()` exposes the active review state and
`controller.aiRequestPending()` reports unresolved requests. The Beta contract keeps a
single active proposal; `getActiveAiProposals()` therefore returns zero or one
proposal while preserving room for a future multi-proposal adapter.

## Slash commands, mentions, and command palette

Type `/` in a paragraph to open the default slash menu. The default commands
insert headings, lists, tasks, quotes, code blocks, tables, images, and dividers.
Replace the defaults with `slashCommands`, or provide `slashCommandProvider` for
async or remote filtering. Providers receive an `AbortSignal`; stop stale work
when it is aborted.

Mentions are enabled only when `mentionProvider` is present:

```ts
readonly mentionProvider: NeuralEditorSuggestionProvider<NeuralEditorMentionItem> =
  (query, { signal }) => peopleService.search(query, { signal });
```

```html
<neural-editor [(value)]="document" [mentionProvider]="mentionProvider" (mentionSelected)="mentionSelected($event)" />
```

The canonical mention node persists only stable identity and display data:

```ts
{
  type: 'mention',
  attrs: { id: 'user-42', label: 'Beyza' },
}
```

Provider-only `metadata` is not written to the document. Keep authorization,
profiles, and mutable user data in application services.

Press `Ctrl+K` or `Cmd+K`, or call `controller.openCommandPalette()`, to open the
searchable command palette. Set `commandPaletteItems` to replace its defaults.
Slash, mention, command-palette, bubble, floating, link, and toolbar overlays are
coordinated so only the relevant layer remains open. Suggestion menus and the
palette use the same `menuAppendTo` target; `body` remains the default to avoid
overflow clipping.

Project complete menu UIs when needed:

```html
<neural-editor [(value)]="document" [mentionProvider]="mentionProvider">
  <ng-template neuralEditorSlashMenu let-editor let-items="items" let-activeIndex="activeIndex" let-select="select" let-optionId="optionId">
    @for (item of items(); track item.id; let index = $index) {
    <button type="button" role="option" [id]="optionId(index)" [attr.aria-selected]="activeIndex() === index" (pointerdown)="$event.preventDefault()" (click)="select(index)">{{ item.label }}</button>
    }
  </ng-template>

  <ng-template neuralEditorCommandPalette let-query="query" let-setQuery="setQuery" let-items="items" let-select="select">
    <input type="search" [value]="query()" (input)="setQuery(inputValue($event))" />
    @for (item of items(); track item.id; let index = $index) {
    <button type="button" (click)="select(index)">{{ item.label }}</button>
    }
  </ng-template>
</neural-editor>
```

Use the supplied context callbacks. Do not query the editor DOM, manually
position suggestion panels, or insert mention HTML yourself.

## Controller

`editorReady` exposes a stable NeuralNg controller instead of the raw Tiptap
instance:

```html
<neural-editor [(value)]="document" (editorReady)="editor = $event" />
```

```ts
editor?.setTextAlign('center');
editor?.setTextColor('#2563eb');
editor?.setHighlight('#fef08a');
editor?.toggleTaskList();
editor?.insertTable({ rows: 3, cols: 3, withHeaderRow: true });
```

Table commands are contextual. Row, column, cell, and delete commands become
available when the current selection is inside a table. Use controller commands
instead of mutating JSON nodes or editing the `contenteditable` DOM.

## Toolbar

Toolbar palettes and table actions use NeuralNg Popover rather than native `details` menus. Popover renders through the browser top layer, so panels are not clipped by editor or card overflow. Opening one toolbar popover closes the previously open auto popover; no `appendTo="body"` option or DOM reparenting is needed.

The default toolbar contains:

- undo and redo
- paragraph and H1-H3
- bold, italic, underline, strike, and inline code
- text-color and highlight palettes
- left, center, right, and justified alignment
- bullet, ordered, and task lists
- blockquote and code block
- link editing
- table insertion and contextual table commands
- horizontal rule and clear formatting

Customize the palettes without changing the document type:

```ts
readonly textColors = [
  { value: '#111827', label: 'Ink' },
  { value: '#2563eb', label: 'Brand' },
] as const;
```

```html
<neural-editor [(value)]="document" [textColors]="textColors" [highlightColors]="highlightColors" />
```

Replace the toolbar model with `toolbarItems`, or project a complete toolbar:

```html
<neural-editor [(value)]="document">
  <ng-template neuralEditorToolbar let-editor>
    <button type="button" (click)="editor.toggleBold()">Bold</button>
    <button type="button" (click)="editor.toggleTaskList()">Tasks</button>
    <button type="button" (click)="editor.insertTable()">Table</button>
  </ng-template>
</neural-editor>
```

## Images and FileUpload

The toolbar and floating menu emit `imageInsertRequest`; Editor never uploads a
`File`. Application code selects and validates the file with FileUpload, sends
it to a media service, then inserts only the persistent URL:

```html
<neural-editor [(value)]="document" (imageInsertRequest)="openImageUpload($event)" />
```

```ts
const uploaded = await mediaService.upload(file);
request.controller.insertImage({
  src: uploaded.url,
  alt: file.name,
});
```

Base64 sources are rejected by the controller and default Image extension.
Enable `allowBase64Images` only for a deliberate application requirement. Do
not persist `File`, blob URLs, or temporary object URLs in editor JSON.

## Context menus and positioning

Bubble, floating, and link menus use Tiptap's Floating UI-based extensions.
`menuAppendTo` defaults to `body`, which avoids clipping by editor, card, dialog,
or overflow containers. Use `menuAppendTo="editor"` only when the menu must stay
inside the editor stacking context, or bind a specific `HTMLElement`.

```html
<neural-editor [(value)]="document" menuAppendTo="body" [showBubbleMenu]="true" [showFloatingMenu]="true" [showLinkPopover]="true">
  <ng-template neuralEditorBubbleMenu let-editor>
    <button type="button" (click)="editor.toggleBold()">Bold</button>
  </ng-template>

  <ng-template neuralEditorFloatingMenu let-editor>
    <button type="button" (click)="editor.toggleHeading(2)">H2</button>
  </ng-template>
</neural-editor>
```

Use `ng-template[neuralEditorLinkPopover]` for a custom link form. Default menus
are keyboard reachable, expose toolbar/dialog roles, stay within the viewport,
and switch to compact horizontally scrollable layouts on narrow screens.

## Extensions

`extensions` appends Tiptap extensions. Top-level extension names are
last-write-wins. To replace the default schema, set
`includeDefaultExtensions="false"` and provide the complete extension set.
Extension configuration is initialization-time in this Beta release.

## Security and persistence

JSON is not a security boundary. Validate the document schema, URLs, colors,
table attributes, pasted content, and custom node attributes on the server.
Sanitize generated HTML for its final rendering context. Do not trust content
solely because the editor accepted it.

## Styling

Use the neutral, glass, mist, or futuristic themes, or set `unstyled` locally or
globally. Structural `*-root` hooks remain while visual `*-base` classes are
removed. `NeuralEditorClasses` includes typed slots for toolbar menus, palette
options, slash and mention suggestions, the command palette, BubbleMenu,
FloatingMenu, link popover controls, the editing surface, content, footer, and
counters.

## Collaboration and review

Editor collaboration is provider-neutral. The component receives an initialized
Yjs document and, optionally, a provider that exposes awareness and connection
events. NeuralNg does not create rooms, authenticate users, or persist Yjs
updates.

```ts
import { Doc } from 'yjs';
import type {
  NeuralEditorCollaborationConfig,
  NeuralEditorCollaborationUser,
  NeuralEditorSnapshot,
} from '@neural-ng/editor';

readonly collaboration: NeuralEditorCollaborationConfig = {
  document: new Doc(),
  provider: appCollaborationProvider,
  field: 'article-body',
  commentsField: 'article-comments',
  waitForSync: true,
};

readonly user: NeuralEditorCollaborationUser = {
  id: 'user-42',
  name: 'Ada Lovelace',
  color: '#2563eb',
};

readonly snapshots = signal<readonly NeuralEditorSnapshot[]>([]);
```

```html
<neural-editor [collaboration]="collaboration" [collaborationUser]="user" enableComments trackedChangesMode="suggesting" enableSnapshots [(snapshots)]="snapshots" />
```

When `collaboration` is present:

- The Yjs document is the live collaborative source of truth.
- Editor waits for provider sync by default before mounting.
- StarterKit undo/redo is disabled because Collaboration owns history.
- External `value` writes are not pushed into the collaborative document.
- `editorUpdate.source` is `remote` for collaboration-origin transactions.
- Presence is read from the provider awareness `user` field and is never
  persisted as document content.
- `disconnectOnDestroy` is opt-in because provider lifetime normally belongs to
  the application.

### Provider contract

The optional provider is structural, so Hocuspocus, y-websocket, or another Yjs
provider can be adapted without making it a NeuralNg dependency. It may expose
`connect`, `disconnect`, `synced`, `on`, `off`, and `awareness`.

Treat `document`, `provider`, `field`, and `fragment` as initialization-only.
When the room or collaborative field changes, destroy and recreate the Editor
instance instead of mutating the collaboration config in place.

For providers with custom event names, pass `whenSynced` and resolve it when the
initial room synchronization is complete. Do not seed `value` before sync. Seed
an empty Yjs fragment in application code after synchronization instead.

### Comments

Comments use a lightweight inline `neuralComment` mark and thread data stored in
a dedicated Yjs map. Without collaboration, the same API uses an in-memory
repository. The default panel supports creating, replying, resolving, reopening,
selecting, and deleting threads through `NeuralEditorController`.

Comments in the Beta contract are plain-text thread messages. Authentication,
authorization, mentions, notifications, and server-side moderation remain
application responsibilities.

### Tracked changes

Set `trackedChangesMode="suggesting"` to track local text insertions and
deletions. Remote Yjs transactions are ignored, so each client attributes only
its own edits. Changes can be accepted or rejected individually or as a batch.

The Beta contract tracks text insertions and deletions. Mark changes, complex block
replacement, overlapping suggestions, and production audit policy are not part
of this Beta contract.

### Version snapshots

`snapshots` is a controlled model containing portable JSON checkpoints:

```ts
interface NeuralEditorSnapshot {
  schemaVersion: 1;
  id: string;
  label?: string;
  createdAt: string;
  revision: number;
  document: NeuralEditorDocument;
  comments: readonly NeuralEditorCommentThread[];
}
```

The built-in snapshot model intentionally does not persist Yjs binary updates.
Store snapshots in application code, and use a provider/backend-specific Yjs
history service when exact CRDT history, branching, or audit-grade restoration
is required.

### Collaboration controller methods

```ts
controller.updateCollaborationUser(user);
controller.addComment('Review this paragraph.');
controller.replyToComment(threadId, 'Updated.');
controller.resolveComment(threadId);
controller.acceptTrackedChange(changeId);
controller.rejectTrackedChange(changeId);
controller.createSnapshot('Before legal review');
controller.restoreSnapshot(snapshotId);
```

The default collaboration panel is enabled whenever collaboration, comments,
tracked changes, or snapshots are enabled. Set `showCollaborationPanel="false"`
to render an application-owned review surface using the controller signals.
