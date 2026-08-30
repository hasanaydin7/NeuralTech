import type { Signal } from '@angular/core';
import type { AnyExtension } from '@tiptap/core';
import type { Doc, XmlFragment } from 'yjs';

export interface NeuralEditorMark {
  readonly type: string;
  readonly attrs?: Readonly<Record<string, unknown>>;
}

export interface NeuralEditorNode {
  readonly type: string;
  readonly attrs?: Readonly<Record<string, unknown>>;
  readonly content?: readonly NeuralEditorNode[];
  readonly marks?: readonly NeuralEditorMark[];
  readonly text?: string;
}

export interface NeuralEditorDocument extends NeuralEditorNode {
  readonly type: 'doc';
}

export type NeuralEditorValue = NeuralEditorDocument;
export type NeuralEditorExtension = AnyExtension;
export type NeuralEditorUpdateSource = 'user' | 'command' | 'remote';
export type NeuralEditorFocusPosition = 'start' | 'end';
export type NeuralEditorTextAlign = 'left' | 'center' | 'right' | 'justify';
export type NeuralEditorColorKind = 'text' | 'highlight';
export type NeuralEditorMenuAppendTo = 'body' | 'editor' | HTMLElement;
export type NeuralEditorSuggestionKind = 'slash' | 'mention';
export type NeuralEditorSuggestionPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end';
export type NeuralEditorCommandSource = 'slash' | 'command-palette';
export type NeuralEditorMenuPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'right'
  | 'right-start'
  | 'right-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end';

export interface NeuralEditorNodeIdContext {
  readonly nodeType: string;
  readonly position: number | null;
}

export type NeuralEditorNodeIdGenerator = (
  context: NeuralEditorNodeIdContext,
) => string;

export interface NeuralEditorNodeSnapshot {
  readonly id: string;
  readonly type: string;
  /** ProseMirror position immediately before the node. */
  readonly position: number;
  readonly from: number;
  readonly to: number;
  readonly depth: number;
  readonly node: NeuralEditorNode;
}

export interface NeuralEditorOperationTarget {
  /** Stable node address. Prefer this over numeric ranges. */
  readonly nodeId?: string;
  /** Base-document range start. Must be paired with `to`. */
  readonly from?: number;
  /** Base-document range end. Must be paired with `from`. */
  readonly to?: number;
}

export type NeuralEditorInsertPosition =
  | 'before'
  | 'after'
  | 'inside-start'
  | 'inside-end';

export interface NeuralEditorInsertOperation {
  readonly id?: string;
  readonly type: 'insert';
  readonly target: NeuralEditorOperationTarget;
  readonly position: NeuralEditorInsertPosition;
  readonly content: readonly NeuralEditorNode[];
}

export interface NeuralEditorReplaceOperation {
  readonly id?: string;
  readonly type: 'replace';
  readonly target: NeuralEditorOperationTarget;
  readonly content: readonly NeuralEditorNode[];
  /**
   * Keeps the target node ID when one compatible node replaces a node target.
   * Defaults to true.
   */
  readonly preserveTargetId?: boolean;
}

export interface NeuralEditorDeleteOperation {
  readonly id?: string;
  readonly type: 'delete';
  readonly target: NeuralEditorOperationTarget;
}

export interface NeuralEditorUpdateNodeOperation {
  readonly id?: string;
  readonly type: 'update-node';
  readonly target: {
    readonly nodeId: string;
  };
  readonly attrs: Readonly<Record<string, unknown>>;
}

export type NeuralEditorOperation =
  | NeuralEditorInsertOperation
  | NeuralEditorReplaceOperation
  | NeuralEditorDeleteOperation
  | NeuralEditorUpdateNodeOperation;

export interface NeuralEditorOperationBatch {
  readonly id: string;
  readonly baseRevision: number;
  readonly operations: readonly NeuralEditorOperation[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export type NeuralEditorOperationErrorCode =
  | 'not-editable'
  | 'revision-conflict'
  | 'empty-batch'
  | 'invalid-target'
  | 'target-not-found'
  | 'invalid-content'
  | 'schema-violation'
  | 'protected-attribute'
  | 'operation-failed';

export interface NeuralEditorOperationError {
  readonly code: NeuralEditorOperationErrorCode;
  readonly message: string;
  readonly operationIndex?: number;
  readonly operationId?: string;
}

export type NeuralEditorOperationValidationResult =
  | {
      readonly valid: true;
      readonly batchId: string;
      readonly baseRevision: number;
      readonly currentRevision: number;
      readonly operationCount: number;
    }
  | {
      readonly valid: false;
      readonly batchId: string;
      readonly baseRevision: number;
      readonly currentRevision: number;
      readonly error: NeuralEditorOperationError;
    };

export type NeuralEditorOperationApplyResult =
  | {
      readonly status: 'applied';
      readonly batchId: string;
      readonly baseRevision: number;
      readonly revision: number;
      readonly operationCount: number;
      readonly document: NeuralEditorDocument;
    }
  | {
      readonly status: 'conflict';
      readonly batchId: string;
      readonly baseRevision: number;
      readonly revision: number;
      readonly error: NeuralEditorOperationError;
    }
  | {
      readonly status: 'rejected';
      readonly batchId: string;
      readonly baseRevision: number;
      readonly revision: number;
      readonly error: NeuralEditorOperationError;
    };

export interface NeuralEditorOperationsAppliedEvent {
  readonly batch: NeuralEditorOperationBatch;
  readonly result: Extract<
    NeuralEditorOperationApplyResult,
    { status: 'applied' }
  >;
  readonly controller: NeuralEditorController;
}

export interface NeuralEditorOperationsRejectedEvent {
  readonly batch: NeuralEditorOperationBatch;
  readonly result: Extract<
    NeuralEditorOperationApplyResult,
    { status: 'rejected' }
  >;
  readonly controller: NeuralEditorController;
}

export interface NeuralEditorOperationConflictEvent {
  readonly batch: NeuralEditorOperationBatch;
  readonly result: Extract<
    NeuralEditorOperationApplyResult,
    { status: 'conflict' }
  >;
  readonly controller: NeuralEditorController;
}

export interface NeuralEditorNodeIdOptions {
  readonly attributeName?: string;
  readonly types?: readonly string[] | 'all';
  readonly generateId?: NeuralEditorNodeIdGenerator;
}

export interface NeuralEditorHtmlSerializerOptions {
  readonly extensions?: readonly NeuralEditorExtension[];
  /** Internal node IDs are omitted by default. */
  readonly includeNodeIds?: boolean;
  readonly nodeIds?: NeuralEditorNodeIdOptions;
}

export interface NeuralEditorStoredDocument {
  readonly schemaVersion: 1;
  readonly document: NeuralEditorDocument;
}

export interface NeuralEditorColorOption {
  readonly value: string;
  readonly label?: string;
}

export interface NeuralEditorTableOptions {
  readonly rows?: number;
  readonly cols?: number;
  readonly withHeaderRow?: boolean;
}

export interface NeuralEditorImageAttributes {
  readonly src: string;
  readonly alt?: string | null;
  readonly title?: string | null;
  readonly width?: number | null;
  readonly height?: number | null;
}

export interface NeuralEditorSuggestionRange {
  readonly from: number;
  readonly to: number;
}

export interface NeuralEditorSuggestionProviderContext {
  readonly controller: NeuralEditorController;
  readonly query: string;
  readonly range: NeuralEditorSuggestionRange;
  readonly signal: AbortSignal;
}

export type NeuralEditorSuggestionProvider<T> = (
  query: string,
  context: NeuralEditorSuggestionProviderContext,
) => readonly T[] | Promise<readonly T[]>;

export interface NeuralEditorSlashCommandContext {
  readonly controller: NeuralEditorController;
  readonly query: string;
  readonly range: NeuralEditorSuggestionRange;
}

export interface NeuralEditorSlashCommand {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly keywords?: readonly string[];
  readonly group?: string;
  readonly iconClass?: string;
  readonly shortcut?: string;
  readonly disabled?: boolean;
  execute(context: NeuralEditorSlashCommandContext): void;
}

export interface NeuralEditorMentionItem {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly avatarUrl?: string;
  /** Provider-only data. NeuralNg does not persist this object in the document. */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface NeuralEditorCommandPaletteContext {
  readonly controller: NeuralEditorController;
  readonly query: string;
}

export interface NeuralEditorCommandPaletteItem {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly keywords?: readonly string[];
  readonly group?: string;
  readonly iconClass?: string;
  readonly shortcut?: string;
  readonly disabled?: boolean;
  execute(context: NeuralEditorCommandPaletteContext): void;
}

export interface NeuralEditorCommandExecutedEvent {
  readonly id: string;
  readonly source: NeuralEditorCommandSource;
  readonly controller: NeuralEditorController;
}

export interface NeuralEditorMentionSelectedEvent {
  readonly item: NeuralEditorMentionItem;
  readonly controller: NeuralEditorController;
}

export type NeuralEditorCommand =
  | 'undo'
  | 'redo'
  | 'paragraph'
  | 'heading-1'
  | 'heading-2'
  | 'heading-3'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'code'
  | 'bullet-list'
  | 'ordered-list'
  | 'task-list'
  | 'blockquote'
  | 'code-block'
  | 'align-left'
  | 'align-center'
  | 'align-right'
  | 'align-justify'
  | 'link'
  | 'image'
  | 'horizontal-rule'
  | 'clear-formatting'
  | 'insert-table'
  | 'delete-table'
  | 'add-row-before'
  | 'add-row-after'
  | 'delete-row'
  | 'add-column-before'
  | 'add-column-after'
  | 'delete-column'
  | 'merge-cells'
  | 'split-cell'
  | 'toggle-header-row';

export interface NeuralEditorToolbarCommandItem {
  readonly type: 'command';
  readonly command: NeuralEditorCommand;
  readonly label?: string;
  readonly text?: string;
  readonly iconClass?: string;
}

export interface NeuralEditorToolbarColorItem {
  readonly type: 'color';
  readonly kind: NeuralEditorColorKind;
  readonly label?: string;
  readonly text?: string;
  readonly iconClass?: string;
}

export interface NeuralEditorToolbarTableItem {
  readonly type: 'table';
  readonly label?: string;
  readonly text?: string;
  readonly iconClass?: string;
}

export interface NeuralEditorToolbarSeparatorItem {
  readonly type: 'separator';
}

export type NeuralEditorToolbarItem =
  | NeuralEditorToolbarCommandItem
  | NeuralEditorToolbarColorItem
  | NeuralEditorToolbarTableItem
  | NeuralEditorToolbarSeparatorItem;

export type NeuralEditorAiAction =
  | 'rewrite'
  | 'shorten'
  | 'expand'
  | 'summarize'
  | 'fix-grammar'
  | 'change-tone'
  | 'translate'
  | 'custom';

export interface NeuralEditorSelectionSnapshot {
  readonly from: number;
  readonly to: number;
  readonly empty: boolean;
  readonly text: string;
  readonly content: readonly NeuralEditorNode[];
  readonly nodeIds: readonly string[];
}

export interface NeuralEditorAiRequestOptions {
  readonly instruction?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface NeuralEditorAiRequest {
  readonly id: string;
  readonly action: NeuralEditorAiAction;
  readonly instruction?: string;
  readonly selection: NeuralEditorSelectionSnapshot;
  readonly document: NeuralEditorDocument;
  readonly schemaVersion: 1;
  readonly baseRevision: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface NeuralEditorAiRequestEvent {
  readonly request: NeuralEditorAiRequest;
  readonly controller: NeuralEditorController;
}

export interface NeuralEditorAiProposal {
  readonly id: string;
  readonly requestId: string;
  readonly baseRevision: number;
  readonly summary?: string;
  readonly operations: readonly NeuralEditorOperation[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface NeuralEditorAiReviewState {
  readonly proposal: NeuralEditorAiProposal;
  readonly activeOperationIndex: number;
  readonly operationCount: number;
}

export type NeuralEditorAiPreviewErrorCode =
  | 'invalid-proposal'
  | 'revision-conflict'
  | 'validation-failed'
  | 'editor-not-ready';

export interface NeuralEditorAiPreviewError {
  readonly code: NeuralEditorAiPreviewErrorCode;
  readonly message: string;
  readonly operationError?: NeuralEditorOperationError;
}

export type NeuralEditorAiPreviewResult =
  | {
      readonly status: 'previewed';
      readonly proposal: NeuralEditorAiProposal;
      readonly operationCount: number;
    }
  | {
      readonly status: 'conflict' | 'rejected';
      readonly proposal: NeuralEditorAiProposal;
      readonly error: NeuralEditorAiPreviewError;
    };

export interface NeuralEditorAiProposalEvent {
  readonly proposal: NeuralEditorAiProposal;
  readonly controller: NeuralEditorController;
}

export interface NeuralEditorAiProposalAcceptedEvent
  extends NeuralEditorAiProposalEvent {
  readonly result: Extract<
    NeuralEditorOperationApplyResult,
    { status: 'applied' }
  >;
}

export type NeuralEditorAiProposalRejectionReason =
  | 'user'
  | 'replaced'
  | 'editor-state'
  | 'validation'
  | 'apply-rejected';

export interface NeuralEditorAiProposalRejectedEvent
  extends NeuralEditorAiProposalEvent {
  readonly reason: NeuralEditorAiProposalRejectionReason;
  readonly result?: Extract<
    NeuralEditorOperationApplyResult,
    { status: 'rejected' }
  >;
}

export type NeuralEditorAiConflictReason =
  | 'revision-conflict'
  | 'document-changed';

export interface NeuralEditorAiConflictEvent
  extends NeuralEditorAiProposalEvent {
  readonly reason: NeuralEditorAiConflictReason;
  readonly currentRevision: number;
}

export interface NeuralEditorAiRequestCancelledEvent {
  readonly request: NeuralEditorAiRequest;
  readonly controller: NeuralEditorController;
}

export interface NeuralEditorClasses {
  readonly root?: string;
  readonly toolbar?: string;
  readonly toolbarButton?: string;
  readonly toolbarButtonIcon?: string;
  readonly toolbarSeparator?: string;
  readonly toolbarMenu?: string;
  readonly toolbarMenuButton?: string;
  readonly toolbarMenuPanel?: string;
  readonly toolbarMenuAction?: string;
  readonly toolbarColorOption?: string;
  readonly toolbarColorSwatch?: string;
  readonly bubbleMenu?: string;
  readonly bubbleMenuButton?: string;
  readonly floatingMenu?: string;
  readonly floatingMenuButton?: string;
  readonly linkPopover?: string;
  readonly linkPopoverInput?: string;
  readonly linkPopoverAction?: string;
  readonly slashMenu?: string;
  readonly mentionMenu?: string;
  readonly suggestionList?: string;
  readonly suggestionItem?: string;
  readonly suggestionItemIcon?: string;
  readonly suggestionItemContent?: string;
  readonly suggestionItemLabel?: string;
  readonly suggestionItemDescription?: string;
  readonly suggestionState?: string;
  readonly commandPalette?: string;
  readonly commandPaletteBackdrop?: string;
  readonly commandPalettePanel?: string;
  readonly commandPaletteInput?: string;
  readonly commandPaletteList?: string;
  readonly commandPaletteItem?: string;
  readonly aiReview?: string;
  readonly aiReviewSummary?: string;
  readonly aiReviewProgress?: string;
  readonly aiReviewActions?: string;
  readonly aiReviewButton?: string;
  readonly collaborationBar?: string;
  readonly collaborationStatus?: string;
  readonly presenceList?: string;
  readonly presenceItem?: string;
  readonly collaborationPanel?: string;
  readonly collaborationSection?: string;
  readonly collaborationSectionTitle?: string;
  readonly collaborationInput?: string;
  readonly collaborationButton?: string;
  readonly commentThread?: string;
  readonly commentMessage?: string;
  readonly trackedChange?: string;
  readonly snapshotItem?: string;
  readonly surface?: string;
  readonly content?: string;
  readonly footer?: string;
  readonly characterCount?: string;
  readonly wordCount?: string;
}

export interface NeuralEditorUpdateEvent {
  readonly value: NeuralEditorDocument;
  readonly html: string;
  readonly text: string;
  readonly characterCount: number;
  readonly wordCount: number;
  readonly source: NeuralEditorUpdateSource;
}

export interface NeuralEditorSelectionEvent {
  readonly from: number;
  readonly to: number;
  readonly empty: boolean;
}

export interface NeuralEditorContentErrorEvent {
  readonly value: unknown;
  readonly error: Error;
}

export interface NeuralEditorImageInsertRequestEvent {
  readonly controller: NeuralEditorController;
  readonly selection: NeuralEditorSelectionEvent;
}

export interface NeuralEditorController {
  readonly ready: Signal<boolean>;
  readonly focused: Signal<boolean>;
  readonly empty: Signal<boolean>;
  readonly characterCount: Signal<number>;
  readonly wordCount: Signal<number>;
  readonly canUndo: Signal<boolean>;
  readonly canRedo: Signal<boolean>;
  readonly commandPaletteOpen: Signal<boolean>;
  /** Increments only when document content changes. */
  readonly revision: Signal<number>;
  readonly aiReview: Signal<NeuralEditorAiReviewState | null>;
  readonly aiRequestPending: Signal<boolean>;
  readonly collaborationStatus: Signal<NeuralEditorCollaborationStatus>;
  readonly collaborationSynced: Signal<boolean>;
  readonly presence: Signal<readonly NeuralEditorCollaborationPresence[]>;
  readonly comments: Signal<readonly NeuralEditorCommentThread[]>;
  readonly activeCommentId: Signal<string | null>;
  readonly trackedChanges: Signal<readonly NeuralEditorTrackedChange[]>;
  readonly snapshots: Signal<readonly NeuralEditorSnapshot[]>;

  focus(position?: NeuralEditorFocusPosition): void;
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

  requestAi(
    action: NeuralEditorAiAction,
    options?: NeuralEditorAiRequestOptions,
  ): NeuralEditorAiRequest;
  cancelAiRequest(requestId: string): boolean;
  previewAiProposal(
    proposal: NeuralEditorAiProposal,
  ): NeuralEditorAiPreviewResult;
  acceptAiProposal(
    proposalId?: string,
  ): NeuralEditorOperationApplyResult | null;
  rejectAiProposal(proposalId?: string): boolean;
  acceptAllAiProposals(): NeuralEditorOperationApplyResult | null;
  rejectAllAiProposals(): boolean;
  selectPreviousAiChange(): void;
  selectNextAiChange(): void;
  clearAiPreview(): void;
  getActiveAiProposals(): readonly NeuralEditorAiProposal[];

  updateCollaborationUser(user: NeuralEditorCollaborationUser): void;
  addComment(text: string): NeuralEditorCommentThread | null;
  replyToComment(
    threadId: string,
    text: string,
  ): NeuralEditorCommentThread | null;
  resolveComment(threadId: string): boolean;
  reopenComment(threadId: string): boolean;
  deleteComment(threadId: string): boolean;
  selectComment(threadId: string): boolean;
  acceptTrackedChange(changeId: string): boolean;
  rejectTrackedChange(changeId: string): boolean;
  acceptAllTrackedChanges(): boolean;
  rejectAllTrackedChanges(): boolean;
  createSnapshot(label?: string): NeuralEditorSnapshot | null;
  restoreSnapshot(snapshotId: string): boolean;
  deleteSnapshot(snapshotId: string): boolean;

  run(command: Exclude<NeuralEditorCommand, 'link' | 'image'>): void;
  can(command: Exclude<NeuralEditorCommand, 'link' | 'image'>): boolean;
  isActive(name: string, attrs?: Readonly<Record<string, unknown>>): boolean;

  getDocument(): NeuralEditorDocument;
  getNodeById(nodeId: string): NeuralEditorNodeSnapshot | null;
  getNodeIdAt(position: number): string | null;
  createOperationBatch(
    operations: readonly NeuralEditorOperation[],
    options?: {
      readonly id?: string;
      readonly metadata?: Readonly<Record<string, unknown>>;
    },
  ): NeuralEditorOperationBatch;
  validateOperations(
    batch: NeuralEditorOperationBatch,
  ): NeuralEditorOperationValidationResult;
  applyOperations(
    batch: NeuralEditorOperationBatch,
  ): NeuralEditorOperationApplyResult;
  getHtml(): string;
  getText(): string;
  insertContent(content: NeuralEditorNode | readonly NeuralEditorNode[]): void;
  insertText(text: string): void;
}

export type NeuralEditorCollaborationStatus =
  | 'disabled'
  | 'connecting'
  | 'connected'
  | 'synced'
  | 'disconnected'
  | 'error';

export interface NeuralEditorAwareness {
  readonly clientID?: number;
  readonly states?: ReadonlyMap<number, unknown>;
  getStates?(): ReadonlyMap<number, unknown>;
  setLocalStateField(field: string, value: unknown): void;
  on(event: 'update' | 'change', listener: (...args: unknown[]) => void): void;
  off(event: 'update' | 'change', listener: (...args: unknown[]) => void): void;
}

export interface NeuralEditorCollaborationProvider {
  readonly awareness?: NeuralEditorAwareness;
  readonly synced?: boolean;
  connect?(): void;
  disconnect?(): void;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  off?(event: string, listener: (...args: unknown[]) => void): void;
}

export interface NeuralEditorCollaborationConfig {
  readonly document: Doc;
  readonly provider?: NeuralEditorCollaborationProvider;
  readonly field?: string;
  readonly fragment?: XmlFragment;
  readonly commentsField?: string;
  readonly connectOnInit?: boolean;
  readonly disconnectOnDestroy?: boolean;
  readonly waitForSync?: boolean;
  readonly syncTimeout?: number;
  readonly whenSynced?: () => Promise<void>;
}

export interface NeuralEditorCollaborationUser {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly avatarUrl?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface NeuralEditorCollaborationPresence {
  readonly clientId: number;
  readonly user: NeuralEditorCollaborationUser;
  readonly local: boolean;
}

export interface NeuralEditorCollaborationStatusEvent {
  readonly status: NeuralEditorCollaborationStatus;
  readonly controller: NeuralEditorController;
}

export interface NeuralEditorPresenceChangeEvent {
  readonly presence: readonly NeuralEditorCollaborationPresence[];
  readonly controller: NeuralEditorController;
}

export interface NeuralEditorCommentAuthor {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly avatarUrl?: string;
}

export interface NeuralEditorCommentMessage {
  readonly id: string;
  readonly text: string;
  readonly createdAt: string;
  readonly user: NeuralEditorCommentAuthor;
}

export interface NeuralEditorCommentThread {
  readonly id: string;
  readonly resolved: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string;
  readonly messages: readonly NeuralEditorCommentMessage[];
}

export interface NeuralEditorCommentEvent {
  readonly thread: NeuralEditorCommentThread;
  readonly controller: NeuralEditorController;
}

export interface NeuralEditorCommentDeletedEvent {
  readonly threadId: string;
  readonly controller: NeuralEditorController;
}

export type NeuralEditorTrackedChangesMode = 'off' | 'suggesting';
export type NeuralEditorTrackedChangeKind = 'insertion' | 'deletion';

export interface NeuralEditorTrackedChange {
  readonly id: string;
  readonly kind: NeuralEditorTrackedChangeKind;
  readonly from: number;
  readonly to: number;
  readonly text: string;
  readonly userId: string;
  readonly userName: string;
  readonly userColor: string;
  readonly createdAt: string;
}

export interface NeuralEditorTrackedChangeEvent {
  readonly change: NeuralEditorTrackedChange;
  readonly controller: NeuralEditorController;
}

export interface NeuralEditorSnapshot {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly label?: string;
  readonly createdAt: string;
  readonly createdBy?: NeuralEditorCommentAuthor;
  readonly revision: number;
  readonly document: NeuralEditorDocument;
  readonly comments: readonly NeuralEditorCommentThread[];
}

export interface NeuralEditorSnapshotEvent {
  readonly snapshot: NeuralEditorSnapshot;
  readonly controller: NeuralEditorController;
}
