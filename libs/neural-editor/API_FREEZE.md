# NeuralNg Editor — Beta Public API Contract

Status: **Beta**
Package: `@neural-ng/editor`
Baseline: `0.1.0-beta.0`
Angular: `22+`

This document is the authoritative public contract for the first standalone
NeuralNg Editor. It exists so application developers and AI agents can
distinguish supported API from implementation details.

## Freeze policy

- Only symbols exported from `@neural-ng/editor` are public.
- Deep imports such as `@neural-ng/editor/editor.component` are unsupported.
- Public names, selectors, input/output names, model shapes, controller methods,
  template contexts, package subpath exports, and documented CSS slots are
  frozen for the `0.1.x-alpha` line.
- Additive changes are allowed when they do not alter existing behavior or
  types.
- A breaking change requires a new prerelease version, a changelog entry, and a
  migration note.
- Tiptap, ProseMirror, Floating UI, and Yjs are implementation dependencies.
  Their raw editor instance is not part of the NeuralNg public component API.
- Collaboration transport, persistence, upload, AI-provider calls, security
  validation, and backend sanitization remain application responsibilities.

## Installation and supported imports

```bash
npm install @neural-ng/editor
```

```ts
import { NeuralEditor, type NeuralEditorController, type NeuralEditorDocument } from '@neural-ng/editor';
```

The package also re-exports `NeuralEditorMessages` so Editor consumers do not
need a type-only deep dependency on Core:

```ts
import type { NeuralEditorMessages } from '@neural-ng/editor';
```

## Canonical value contract

The form value is always structured JSON:

```ts
export type NeuralEditorValue = NeuralEditorDocument;

export interface NeuralEditorDocument extends NeuralEditorNode {
  readonly type: 'doc';
}
```

The normal empty state is a document containing one empty paragraph. `null`,
HTML strings, Markdown strings, `File` objects, blob URLs, and mutable unions are
not canonical values.

Long-lived storage should use:

```ts
export interface NeuralEditorStoredDocument {
  readonly schemaVersion: 1;
  readonly document: NeuralEditorDocument;
}
```

## Component contract

Selector: `neural-editor`
Class: `NeuralEditor` (`EditorComponent` remains a deprecated compatibility alias)
Forms contract: `FormValueControl<NeuralEditorValue>`

### Models

| Name        | Type                              |        Default | Contract                                |
| ----------- | --------------------------------- | -------------: | --------------------------------------- |
| `value`     | `NeuralEditorValue`               | empty document | Canonical editor JSON.                  |
| `snapshots` | `readonly NeuralEditorSnapshot[]` |           `[]` | Portable application-owned checkpoints. |

### Forms and editor-state inputs

| Input           | Type                  |     Default |
| --------------- | --------------------- | ----------: |
| `disabled`      | `boolean`             |     `false` |
| `readonly`      | `boolean`             |     `false` |
| `required`      | `boolean`             |     `false` |
| `invalid`       | `boolean`             |     `false` |
| `pending`       | `boolean`             |     `false` |
| `touched`       | `boolean`             |     `false` |
| `dirty`         | `boolean`             |     `false` |
| `name`          | `string`              |        `''` |
| `maxCharacters` | `number \| undefined` | `undefined` |

`minLength`, `maxLength`, and `minCharacters` are not Editor inputs. The
component-enforced upper bound is `maxCharacters`; minimum-length validation
belongs to the application or form schema because the canonical value is a
structured document rather than a string.

### Editing and presentation inputs

| Input                | Type                                 |                         Default |
| -------------------- | ------------------------------------ | ------------------------------: |
| `placeholder`        | `string`                             |                            `''` |
| `autofocus`          | `boolean`                            |                         `false` |
| `spellcheck`         | `boolean`                            |                          `true` |
| `showToolbar`        | `boolean`                            |                          `true` |
| `showCharacterCount` | `boolean`                            |                         `false` |
| `showWordCount`      | `boolean`                            |                         `false` |
| `showBubbleMenu`     | `boolean`                            |                          `true` |
| `showFloatingMenu`   | `boolean`                            |                          `true` |
| `showLinkPopover`    | `boolean`                            |                          `true` |
| `showSlashMenu`      | `boolean`                            |                          `true` |
| `showMentionMenu`    | `boolean`                            |                          `true` |
| `showCommandPalette` | `boolean`                            |                          `true` |
| `showAiReview`       | `boolean`                            |                          `true` |
| `allowBase64Images`  | `boolean`                            |                         `false` |
| `toolbarItems`       | `readonly NeuralEditorToolbarItem[]` | `NEURAL_EDITOR_DEFAULT_TOOLBAR` |
| `textColors`         | `readonly NeuralEditorColorOption[]` |            default text palette |
| `highlightColors`    | `readonly NeuralEditorColorOption[]` |       default highlight palette |
| `messages`           | `Partial<NeuralEditorMessages>`      |                            `{}` |

### Schema, extension, and node-identity inputs

These inputs are initialization-time configuration. Recreate the component when
changing the schema or collaboration room.

| Input                      | Type                               |                      Default |
| -------------------------- | ---------------------------------- | ---------------------------: |
| `includeDefaultExtensions` | `boolean`                          |                       `true` |
| `extensions`               | `readonly NeuralEditorExtension[]` |                         `[]` |
| `enableNodeIds`            | `boolean`                          |                       `true` |
| `nodeIdAttribute`          | `string`                           |                 `'neuralId'` |
| `identifiedNodeTypes`      | `readonly string[]`                | default identified-node list |
| `nodeIdGenerator`          | `NeuralEditorNodeIdGenerator`      |   `createNeuralEditorNodeId` |

Custom extensions append to the default extension set. Disabling defaults means
the consumer must supply a complete valid schema.

`NeuralEditorExtension` is the deliberate advanced escape hatch and aliases a
Tiptap 3 `AnyExtension`. Its compatibility boundary is the Tiptap 3 major line;
the raw Tiptap editor instance is still not exposed by `NeuralEditor` or the
controller.

### Overlay and suggestion inputs

| Input                       | Type                                                               |          Default |
| --------------------------- | ------------------------------------------------------------------ | ---------------: |
| `menuAppendTo`              | `'body' \| 'editor' \| HTMLElement`                                |         `'body'` |
| `bubbleMenuPlacement`       | `NeuralEditorMenuPlacement`                                        |          `'top'` |
| `floatingMenuPlacement`     | `NeuralEditorMenuPlacement`                                        |   `'left-start'` |
| `slashMenuPlacement`        | `NeuralEditorSuggestionPlacement`                                  | `'bottom-start'` |
| `mentionMenuPlacement`      | `NeuralEditorSuggestionPlacement`                                  | `'bottom-start'` |
| `slashDebounce`             | `number`                                                           |              `0` |
| `mentionDebounce`           | `number`                                                           |            `150` |
| `mentionTrigger`            | `string`                                                           |            `'@'` |
| `mentionMinimumQueryLength` | `number`                                                           |              `0` |
| `slashCommands`             | `readonly NeuralEditorSlashCommand[] \| null`                      |           `null` |
| `slashCommandProvider`      | `NeuralEditorSuggestionProvider<NeuralEditorSlashCommand> \| null` |           `null` |
| `mentionProvider`           | `NeuralEditorSuggestionProvider<NeuralEditorMentionItem> \| null`  |           `null` |
| `commandPaletteItems`       | `readonly NeuralEditorCommandPaletteItem[] \| null`                |           `null` |

Only one Editor overlay is active at a time. Custom templates must use the
provided close/select callbacks instead of mounting a second overlay system.

### Collaboration and review inputs

| Input                    | Type                                      | Default |
| ------------------------ | ----------------------------------------- | ------: |
| `collaboration`          | `NeuralEditorCollaborationConfig \| null` |  `null` |
| `collaborationUser`      | `NeuralEditorCollaborationUser \| null`   |  `null` |
| `enableComments`         | `boolean`                                 | `false` |
| `trackedChangesMode`     | `NeuralEditorTrackedChangesMode`          | `'off'` |
| `enableSnapshots`        | `boolean`                                 | `false` |
| `showCollaborationPanel` | `boolean`                                 |  `true` |

When collaboration is active, Yjs is the live document source and the normal
StarterKit history is disabled. Provider creation, authorization, transport,
room lifecycle, and durable storage are not owned by Editor.

### Identity, ARIA, and styling inputs

| Input             | Type                  |   Default |
| ----------------- | --------------------- | --------: |
| `editorId`        | `string`              | generated |
| `ariaLabel`       | `string`              |      `''` |
| `ariaLabelledBy`  | `string`              |      `''` |
| `ariaDescription` | `string`              |      `''` |
| `fluid`           | `boolean`             |   `false` |
| `unstyled`        | `boolean`             |   `false` |
| `editorClass`     | `string`              |      `''` |
| `contentClass`    | `string`              |      `''` |
| `classes`         | `NeuralEditorClasses` |      `{}` |

### Outputs

| Output                      | Payload                                |
| --------------------------- | -------------------------------------- |
| `editorReady`               | `NeuralEditorController`               |
| `editorUpdate`              | `NeuralEditorUpdateEvent`              |
| `selectionChange`           | `NeuralEditorSelectionEvent`           |
| `imageInsertRequest`        | `NeuralEditorImageInsertRequestEvent`  |
| `commandExecuted`           | `NeuralEditorCommandExecutedEvent`     |
| `mentionSelected`           | `NeuralEditorMentionSelectedEvent`     |
| `operationsApplied`         | `NeuralEditorOperationsAppliedEvent`   |
| `operationsRejected`        | `NeuralEditorOperationsRejectedEvent`  |
| `operationConflict`         | `NeuralEditorOperationConflictEvent`   |
| `aiRequest`                 | `NeuralEditorAiRequestEvent`           |
| `aiRequestCancelled`        | `NeuralEditorAiRequestCancelledEvent`  |
| `aiProposalPreviewed`       | `NeuralEditorAiProposalEvent`          |
| `aiProposalAccepted`        | `NeuralEditorAiProposalAcceptedEvent`  |
| `aiProposalRejected`        | `NeuralEditorAiProposalRejectedEvent`  |
| `aiOperationConflict`       | `NeuralEditorAiConflictEvent`          |
| `collaborationStatusChange` | `NeuralEditorCollaborationStatusEvent` |
| `presenceChange`            | `NeuralEditorPresenceChangeEvent`      |
| `commentCreated`            | `NeuralEditorCommentEvent`             |
| `commentUpdated`            | `NeuralEditorCommentEvent`             |
| `commentDeleted`            | `NeuralEditorCommentDeletedEvent`      |
| `trackedChangeAccepted`     | `NeuralEditorTrackedChangeEvent`       |
| `trackedChangeRejected`     | `NeuralEditorTrackedChangeEvent`       |
| `snapshotCreated`           | `NeuralEditorSnapshotEvent`            |
| `snapshotRestored`          | `NeuralEditorSnapshotEvent`            |
| `snapshotDeleted`           | `NeuralEditorSnapshotEvent`            |
| `editorFocus`               | `FocusEvent`                           |
| `editorBlur`                | `FocusEvent`                           |
| `contentError`              | `NeuralEditorContentErrorEvent`        |
| `editorPaste`               | `ClipboardEvent`                       |
| `editorDrop`                | `DragEvent`                            |
| `touch`                     | `void`                                 |

`paste` and `drop` are not output names. The prefixed names avoid collision with
native DOM events and Angular template diagnostics.

### Form-control methods

```ts
focus(options?: FocusOptions): void;
reset(): void;
```

Advanced selection focus belongs to `NeuralEditorController.focus()`.

## Controller contract

The controller is the supported imperative API. The raw Tiptap `Editor`
instance is deliberately not exposed.

### Signals

```ts
ready;
focused;
empty;
characterCount;
wordCount;
canUndo;
canRedo;
commandPaletteOpen;
revision;
aiReview;
aiRequestPending;
collaborationStatus;
collaborationSynced;
presence;
comments;
activeCommentId;
trackedChanges;
snapshots;
```

### Editing and formatting

```ts
focus(position?: 'start' | 'end'): void;
blur(): void;
clear(): void;
reset(): void;
undo(): void;
redo(): void;
setParagraph(): void;
toggleHeading(level: 1 | 2 | 3): void;
toggleBold(): void;
toggleItalic(): void;
toggleUnderline(): void;
toggleStrike(): void;
toggleCode(): void;
toggleBulletList(): void;
toggleOrderedList(): void;
toggleTaskList(): void;
toggleBlockquote(): void;
toggleCodeBlock(): void;
insertHorizontalRule(): void;
clearFormatting(): void;
setTextAlign(alignment: NeuralEditorTextAlign): void;
unsetTextAlign(): void;
setTextColor(color: string): void;
unsetTextColor(): void;
getTextColor(): string;
setHighlight(color?: string): void;
unsetHighlight(): void;
getHighlightColor(): string;
```

### Tables, links, images, and palette

```ts
insertTable(options?: NeuralEditorTableOptions): void;
deleteTable(): void;
addTableRowBefore(): void;
addTableRowAfter(): void;
deleteTableRow(): void;
addTableColumnBefore(): void;
addTableColumnAfter(): void;
deleteTableColumn(): void;
mergeTableCells(): void;
splitTableCell(): void;
toggleTableHeaderRow(): void;
setLink(href: string): void;
unsetLink(): void;
getLinkHref(): string;
openLinkPopover(): void;
closeLinkPopover(): void;
requestImageInsert(): void;
insertImage(attributes: NeuralEditorImageAttributes): void;
updateImage(attributes: Partial<NeuralEditorImageAttributes>): void;
removeImage(): void;
getImageAttributes(): NeuralEditorImageAttributes | null;
openCommandPalette(query?: string): void;
closeCommandPalette(): void;
toggleCommandPalette(query?: string): void;
```

### Structured operations and AI review

```ts
getNodeById(nodeId: string): NeuralEditorNodeSnapshot | null;
getNodeIdAt(position: number): string | null;
createOperationBatch(...): NeuralEditorOperationBatch;
validateOperations(batch): NeuralEditorOperationValidationResult;
applyOperations(batch): NeuralEditorOperationApplyResult;
requestAi(action, options?): NeuralEditorAiRequest;
cancelAiRequest(requestId: string): boolean;
previewAiProposal(proposal): NeuralEditorAiPreviewResult;
acceptAiProposal(proposalId?: string): NeuralEditorOperationApplyResult | null;
rejectAiProposal(proposalId?: string): boolean;
acceptAllAiProposals(): NeuralEditorOperationApplyResult | null;
rejectAllAiProposals(): boolean;
selectPreviousAiChange(): void;
selectNextAiChange(): void;
clearAiPreview(): void;
getActiveAiProposals(): readonly NeuralEditorAiProposal[];
```

Operation batches are atomic and revision-checked. AI preview does not mutate the
form value; acceptance applies the proposal once.

### Collaboration, comments, review, and snapshots

```ts
updateCollaborationUser(user): void;
addComment(text): NeuralEditorCommentThread | null;
replyToComment(threadId, text): NeuralEditorCommentThread | null;
resolveComment(threadId): boolean;
reopenComment(threadId): boolean;
deleteComment(threadId): boolean;
selectComment(threadId): boolean;
acceptTrackedChange(changeId): boolean;
rejectTrackedChange(changeId): boolean;
acceptAllTrackedChanges(): boolean;
rejectAllTrackedChanges(): boolean;
createSnapshot(label?): NeuralEditorSnapshot | null;
restoreSnapshot(snapshotId): boolean;
deleteSnapshot(snapshotId): boolean;
```

### Generic commands and content access

```ts
run(command: Exclude<NeuralEditorCommand, 'link' | 'image'>): void;
can(command: Exclude<NeuralEditorCommand, 'link' | 'image'>): boolean;
isActive(name: string, attrs?: Readonly<Record<string, unknown>>): boolean;
getDocument(): NeuralEditorDocument;
getHtml(): string;
getText(): string;
insertContent(content: NeuralEditorNode | readonly NeuralEditorNode[]): void;
insertText(text: string): void;
```

## Template customization contract

The following standalone directives are public:

| Directive selector                        | Context                                                               |
| ----------------------------------------- | --------------------------------------------------------------------- |
| `ng-template[neuralEditorToolbar]`        | `NeuralEditorToolbarTemplateContext`                                  |
| `ng-template[neuralEditorBubbleMenu]`     | `NeuralEditorMenuTemplateContext`                                     |
| `ng-template[neuralEditorFloatingMenu]`   | `NeuralEditorMenuTemplateContext`                                     |
| `ng-template[neuralEditorLinkPopover]`    | `NeuralEditorLinkPopoverTemplateContext`                              |
| `ng-template[neuralEditorSlashMenu]`      | `NeuralEditorSuggestionMenuTemplateContext<NeuralEditorSlashCommand>` |
| `ng-template[neuralEditorMentionMenu]`    | `NeuralEditorSuggestionMenuTemplateContext<NeuralEditorMentionItem>`  |
| `ng-template[neuralEditorCommandPalette]` | `NeuralEditorCommandPaletteTemplateContext`                           |
| `ng-template[neuralEditorAiReview]`       | `NeuralEditorAiReviewTemplateContext`                                 |

Internal default-rendering components, including the toolbar and collaboration
panel implementations, are not public entry-point exports. Customize through
inputs, class slots, controller methods, and the template directives above.

## Public utility contract

### Document utilities

```ts
createNeuralEditorEmptyDocument();
cloneNeuralEditorDocument(document);
isNeuralEditorDocument(value);
normalizeNeuralEditorDocument(value);
editorDocumentFromHtml(html, optionsOrExtensions?);
editorDocumentToHtml(document, optionsOrExtensions?);
editorDocumentToText(document, blockSeparator?);
editorDocumentWithNodeIds(document, options?, extensions?);
```

### Pure construction helpers

```ts
createNeuralEditorOperationBatch(operations, baseRevision, options?);
createNeuralEditorCommentMessage(...);
createNeuralEditorCommentThread(...);
createNeuralEditorSnapshot(...);
readNeuralEditorPresence(awareness);
createNeuralEditorDefaultSlashCommands(...);
createNeuralEditorDefaultCommandPaletteItems(...);
createNeuralEditorNodeId(context);
```

Raw operation-engine and tracked-change helpers that require a Tiptap `Editor`
or ProseMirror node are implementation details. Use the controller instead.

## Constants

```ts
NEURAL_EDITOR_EMPTY_DOCUMENT;
NEURAL_EDITOR_DEFAULT_TOOLBAR;
NEURAL_EDITOR_DEFAULT_TEXT_COLORS;
NEURAL_EDITOR_DEFAULT_HIGHLIGHT_COLORS;
NEURAL_EDITOR_DEFAULT_NODE_ID_ATTRIBUTE;
NEURAL_EDITOR_DEFAULT_IDENTIFIED_NODE_TYPES;
```

## Styling contract

Supported package style entry points:

```css
@import '@neural-ng/editor/themes/neutral.css';
@import '@neural-ng/editor/themes/tailwind.css';
@import '@neural-ng/editor/themes/experimental/glass.css';
@import '@neural-ng/editor/themes/experimental/futuristic.css';
```

`NeuralEditorClasses` freezes the following consumer slots:

```text
root, toolbar, toolbarButton, toolbarButtonIcon, toolbarSeparator,
toolbarMenu, toolbarMenuButton, toolbarMenuPanel, toolbarMenuAction,
toolbarColorOption, toolbarColorSwatch, bubbleMenu, bubbleMenuButton,
floatingMenu, floatingMenuButton, linkPopover, linkPopoverInput,
linkPopoverAction, slashMenu, mentionMenu, suggestionList, suggestionItem,
suggestionItemIcon, suggestionItemContent, suggestionItemLabel,
suggestionItemDescription, suggestionState, commandPalette,
commandPaletteBackdrop, commandPalettePanel, commandPaletteInput,
commandPaletteList, commandPaletteItem, aiReview, aiReviewSummary,
aiReviewProgress, aiReviewActions, aiReviewButton, collaborationBar,
collaborationStatus, presenceList, presenceItem, collaborationPanel,
collaborationSection, collaborationSectionTitle, collaborationInput,
collaborationButton, commentThread, commentMessage, trackedChange,
snapshotItem, surface, content, footer, characterCount, wordCount
```

The retired `linkEditor`, `linkInput`, `linkApplyButton`, and
`linkRemoveButton` aliases are not part of the freeze. Use the `linkPopover*`
slots.

Structural `*-root` classes remain present in styled and unstyled modes. Visual
`*-base` classes may be omitted by `unstyled`. Internal implementation selectors
that are not represented by a documented class slot or theme token are not
public API.

## Package subpath exports

The following non-code assets are public:

```text
@neural-ng/editor/README.md
@neural-ng/editor/API_FREEZE.md
@neural-ng/editor/MIGRATION.md
@neural-ng/editor/llms.txt
@neural-ng/editor/LICENSE
@neural-ng/editor/THIRD_PARTY_NOTICES.md
@neural-ng/editor/themes/neutral.css
@neural-ng/editor/themes/tailwind.css
@neural-ng/editor/themes/experimental/glass.css
@neural-ng/editor/themes/experimental/futuristic.css
```

## Explicitly outside the frozen API

- Internal Angular components used to render default toolbars, menus, review
  bars, and collaboration panels.
- Raw Tiptap `Editor`, transaction, plugin, and ProseMirror node access.
- Deep imports into package source files.
- Collaboration provider implementation or network transport.
- Persistence, autosave, upload, AI-provider, authorization, moderation, and
  server-side sanitization behavior.
- Exact CRDT history, compliance-grade audit history, or a guarantee that Alpha
  tracked changes cover every structural/formatting operation.
- Internal DOM layout and non-documented CSS selectors.

## Audit result

The freeze audit accepted the package boundary, canonical JSON model, Forms
contract, controller-first imperative API, structured operation model,
provider-neutral AI flow, collaboration boundary, template customization, and
theme entry points.

Before freezing, the audit removed:

- undocumented public exports for internal toolbar and collaboration-panel
  renderers;
- low-level root exports that required raw Tiptap/ProseMirror objects;
- an internal suggestion-kind type from the public entry point;
- dead legacy link-editor class aliases and unused toolbar inputs.

This is the contract against which the remaining Vitest, browser interaction,
hydration, accessibility, collaboration, and packaging tests should be written.
