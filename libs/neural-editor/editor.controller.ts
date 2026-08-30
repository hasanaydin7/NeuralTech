import type { Signal } from '@angular/core';
import type { Content, Editor } from '@tiptap/core';
import type {
  NeuralEditorAiAction,
  NeuralEditorAiPreviewResult,
  NeuralEditorAiProposal,
  NeuralEditorAiRequest,
  NeuralEditorAiRequestOptions,
  NeuralEditorAiReviewState,
  NeuralEditorCommand,
  NeuralEditorController,
  NeuralEditorDocument,
  NeuralEditorFocusPosition,
  NeuralEditorImageAttributes,
  NeuralEditorNode,
  NeuralEditorNodeSnapshot,
  NeuralEditorOperation,
  NeuralEditorOperationApplyResult,
  NeuralEditorOperationBatch,
  NeuralEditorOperationValidationResult,
  NeuralEditorCollaborationPresence,
  NeuralEditorCollaborationStatus,
  NeuralEditorCollaborationUser,
  NeuralEditorCommentThread,
  NeuralEditorSnapshot,
  NeuralEditorTrackedChange,
  NeuralEditorTableOptions,
  NeuralEditorTextAlign,
} from './editor.types';
import {
  createNeuralEditorOperationBatch,
  findNeuralEditorNodeById,
  findNeuralEditorNodeIdAt,
} from './editor.operations';
import {
  createNeuralEditorEmptyDocument,
  fromTiptapJson,
} from './editor.utils';

export interface NeuralEditorControllerAdapter {
  readonly editor: () => Editor | null;
  readonly ready: Signal<boolean>;
  readonly focused: Signal<boolean>;
  readonly empty: Signal<boolean>;
  readonly characterCount: Signal<number>;
  readonly wordCount: Signal<number>;
  readonly canUndo: Signal<boolean>;
  readonly canRedo: Signal<boolean>;
  readonly commandPaletteOpen: Signal<boolean>;
  readonly revision: Signal<number>;
  readonly documentRevision: Signal<number>;
  readonly aiReview: Signal<NeuralEditorAiReviewState | null>;
  readonly aiRequestPending: Signal<boolean>;
  readonly collaborationStatus: Signal<NeuralEditorCollaborationStatus>;
  readonly collaborationSynced: Signal<boolean>;
  readonly presence: Signal<readonly NeuralEditorCollaborationPresence[]>;
  readonly comments: Signal<readonly NeuralEditorCommentThread[]>;
  readonly activeCommentId: Signal<string | null>;
  readonly trackedChanges: Signal<readonly NeuralEditorTrackedChange[]>;
  readonly snapshots: Signal<readonly NeuralEditorSnapshot[]>;
  readonly runCommand: (command: (editor: Editor) => boolean) => boolean;
  readonly reset: () => void;
  readonly requestImageInsert: () => void;
  readonly openLinkPopover: () => void;
  readonly closeLinkPopover: () => void;
  readonly openCommandPalette: (query?: string) => void;
  readonly closeCommandPalette: () => void;
  readonly toggleCommandPalette: (query?: string) => void;
  readonly allowBase64Images: () => boolean;
  readonly nodeIdAttribute: () => string;
  readonly validateOperations: (
    batch: NeuralEditorOperationBatch,
  ) => NeuralEditorOperationValidationResult;
  readonly applyOperations: (
    batch: NeuralEditorOperationBatch,
  ) => NeuralEditorOperationApplyResult;
  readonly requestAi: (
    action: NeuralEditorAiAction,
    options?: NeuralEditorAiRequestOptions,
  ) => NeuralEditorAiRequest;
  readonly cancelAiRequest: (requestId: string) => boolean;
  readonly previewAiProposal: (
    proposal: NeuralEditorAiProposal,
  ) => NeuralEditorAiPreviewResult;
  readonly acceptAiProposal: (
    proposalId?: string,
  ) => NeuralEditorOperationApplyResult | null;
  readonly rejectAiProposal: (proposalId?: string) => boolean;
  readonly selectPreviousAiChange: () => void;
  readonly selectNextAiChange: () => void;
  readonly clearAiPreview: () => void;
  readonly getActiveAiProposals: () => readonly NeuralEditorAiProposal[];
  readonly updateCollaborationUser: (
    user: NeuralEditorCollaborationUser,
  ) => void;
  readonly addComment: (text: string) => NeuralEditorCommentThread | null;
  readonly replyToComment: (
    threadId: string,
    text: string,
  ) => NeuralEditorCommentThread | null;
  readonly resolveComment: (threadId: string, resolved: boolean) => boolean;
  readonly deleteComment: (threadId: string) => boolean;
  readonly selectComment: (threadId: string) => boolean;
  readonly acceptTrackedChange: (changeId: string) => boolean;
  readonly rejectTrackedChange: (changeId: string) => boolean;
  readonly resolveAllTrackedChanges: (accept: boolean) => boolean;
  readonly createSnapshot: (label?: string) => NeuralEditorSnapshot | null;
  readonly restoreSnapshot: (snapshotId: string) => boolean;
  readonly deleteSnapshot: (snapshotId: string) => boolean;
}

export class NeuralEditorControllerImpl implements NeuralEditorController {
  readonly ready: Signal<boolean>;
  readonly focused: Signal<boolean>;
  readonly empty: Signal<boolean>;
  readonly characterCount: Signal<number>;
  readonly wordCount: Signal<number>;
  readonly canUndo: Signal<boolean>;
  readonly canRedo: Signal<boolean>;
  readonly commandPaletteOpen: Signal<boolean>;
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

  constructor(private readonly adapter: NeuralEditorControllerAdapter) {
    this.ready = adapter.ready;
    this.focused = adapter.focused;
    this.empty = adapter.empty;
    this.characterCount = adapter.characterCount;
    this.wordCount = adapter.wordCount;
    this.canUndo = adapter.canUndo;
    this.canRedo = adapter.canRedo;
    this.commandPaletteOpen = adapter.commandPaletteOpen;
    this.revision = adapter.documentRevision;
    this.aiReview = adapter.aiReview;
    this.aiRequestPending = adapter.aiRequestPending;
    this.collaborationStatus = adapter.collaborationStatus;
    this.collaborationSynced = adapter.collaborationSynced;
    this.presence = adapter.presence;
    this.comments = adapter.comments;
    this.activeCommentId = adapter.activeCommentId;
    this.trackedChanges = adapter.trackedChanges;
    this.snapshots = adapter.snapshots;
  }

  focus(position?: NeuralEditorFocusPosition): void {
    const editor = this.adapter.editor();
    if (!editor) return;
    if (position) editor.commands.focus(position, { scrollIntoView: false });
    editor.view.dom.focus();
  }

  blur(): void {
    const editor = this.adapter.editor();
    if (!editor) return;
    editor.view.dom.blur();
    editor.view.dom.ownerDocument.defaultView
      ?.getSelection()
      ?.removeAllRanges();
  }

  clear(): void {
    this.adapter.runCommand((editor) => editor.commands.clearContent());
  }

  reset(): void {
    this.adapter.reset();
  }

  undo(): void {
    this.run('undo');
  }

  redo(): void {
    this.run('redo');
  }

  setParagraph(): void {
    this.run('paragraph');
  }

  toggleHeading(level: 1 | 2 | 3): void {
    this.run(`heading-${level}`);
  }

  toggleBold(): void {
    this.run('bold');
  }

  toggleItalic(): void {
    this.run('italic');
  }

  toggleUnderline(): void {
    this.run('underline');
  }

  toggleStrike(): void {
    this.run('strike');
  }

  toggleCode(): void {
    this.run('code');
  }

  toggleBulletList(): void {
    this.run('bullet-list');
  }

  toggleOrderedList(): void {
    this.run('ordered-list');
  }

  toggleTaskList(): void {
    this.run('task-list');
  }

  toggleBlockquote(): void {
    this.run('blockquote');
  }

  toggleCodeBlock(): void {
    this.run('code-block');
  }

  insertHorizontalRule(): void {
    this.run('horizontal-rule');
  }

  clearFormatting(): void {
    this.run('clear-formatting');
  }

  setTextAlign(alignment: NeuralEditorTextAlign): void {
    this.adapter.runCommand((editor) =>
      editor.chain().focus().setTextAlign(alignment).run(),
    );
  }

  unsetTextAlign(): void {
    this.adapter.runCommand((editor) =>
      editor.chain().focus().unsetTextAlign().run(),
    );
  }

  setTextColor(color: string): void {
    const normalizedColor = color.trim();
    if (!normalizedColor) {
      this.unsetTextColor();
      return;
    }
    this.adapter.runCommand((editor) =>
      editor.chain().focus().setColor(normalizedColor).run(),
    );
  }

  unsetTextColor(): void {
    this.adapter.runCommand((editor) =>
      editor.chain().focus().unsetColor().removeEmptyTextStyle().run(),
    );
  }

  getTextColor(): string {
    this.adapter.revision();
    return String(
      this.adapter.editor()?.getAttributes('textStyle')['color'] ?? '',
    );
  }

  setHighlight(color?: string): void {
    const normalizedColor = color?.trim();
    this.adapter.runCommand((editor) =>
      editor
        .chain()
        .focus()
        .setHighlight(normalizedColor ? { color: normalizedColor } : undefined)
        .run(),
    );
  }

  unsetHighlight(): void {
    this.adapter.runCommand((editor) =>
      editor.chain().focus().unsetHighlight().run(),
    );
  }

  getHighlightColor(): string {
    this.adapter.revision();
    return String(
      this.adapter.editor()?.getAttributes('highlight')['color'] ?? '',
    );
  }

  insertTable(options: NeuralEditorTableOptions = {}): void {
    const rows = normalizeTableDimension(options.rows, 3);
    const cols = normalizeTableDimension(options.cols, 3);
    this.adapter.runCommand((editor) =>
      editor
        .chain()
        .focus()
        .insertTable({
          rows,
          cols,
          withHeaderRow: options.withHeaderRow ?? true,
        })
        .run(),
    );
  }

  deleteTable(): void {
    this.run('delete-table');
  }

  addTableRowBefore(): void {
    this.run('add-row-before');
  }

  addTableRowAfter(): void {
    this.run('add-row-after');
  }

  deleteTableRow(): void {
    this.run('delete-row');
  }

  addTableColumnBefore(): void {
    this.run('add-column-before');
  }

  addTableColumnAfter(): void {
    this.run('add-column-after');
  }

  deleteTableColumn(): void {
    this.run('delete-column');
  }

  mergeTableCells(): void {
    this.run('merge-cells');
  }

  splitTableCell(): void {
    this.run('split-cell');
  }

  toggleTableHeaderRow(): void {
    this.run('toggle-header-row');
  }

  setLink(href: string): void {
    const normalizedHref = href.trim();
    if (!normalizedHref) {
      this.unsetLink();
      return;
    }

    this.adapter.runCommand((editor) =>
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: normalizedHref })
        .run(),
    );
  }

  unsetLink(): void {
    this.adapter.runCommand((editor) =>
      editor.chain().focus().extendMarkRange('link').unsetLink().run(),
    );
  }

  getLinkHref(): string {
    this.adapter.revision();
    return String(this.adapter.editor()?.getAttributes('link')['href'] ?? '');
  }

  openLinkPopover(): void {
    this.adapter.openLinkPopover();
  }

  closeLinkPopover(): void {
    this.adapter.closeLinkPopover();
  }

  openCommandPalette(query = ''): void {
    this.adapter.openCommandPalette(query);
  }

  closeCommandPalette(): void {
    this.adapter.closeCommandPalette();
  }

  toggleCommandPalette(query = ''): void {
    this.adapter.toggleCommandPalette(query);
  }

  requestImageInsert(): void {
    this.adapter.requestImageInsert();
  }

  requestAi(
    action: NeuralEditorAiAction,
    options?: NeuralEditorAiRequestOptions,
  ): NeuralEditorAiRequest {
    return this.adapter.requestAi(action, options);
  }

  cancelAiRequest(requestId: string): boolean {
    return this.adapter.cancelAiRequest(requestId);
  }

  previewAiProposal(
    proposal: NeuralEditorAiProposal,
  ): NeuralEditorAiPreviewResult {
    return this.adapter.previewAiProposal(proposal);
  }

  acceptAiProposal(
    proposalId?: string,
  ): NeuralEditorOperationApplyResult | null {
    return this.adapter.acceptAiProposal(proposalId);
  }

  rejectAiProposal(proposalId?: string): boolean {
    return this.adapter.rejectAiProposal(proposalId);
  }

  acceptAllAiProposals(): NeuralEditorOperationApplyResult | null {
    return this.acceptAiProposal();
  }

  rejectAllAiProposals(): boolean {
    return this.rejectAiProposal();
  }

  selectPreviousAiChange(): void {
    this.adapter.selectPreviousAiChange();
  }

  selectNextAiChange(): void {
    this.adapter.selectNextAiChange();
  }

  clearAiPreview(): void {
    this.adapter.clearAiPreview();
  }

  getActiveAiProposals(): readonly NeuralEditorAiProposal[] {
    return this.adapter.getActiveAiProposals();
  }

  updateCollaborationUser(user: NeuralEditorCollaborationUser): void {
    this.adapter.updateCollaborationUser(user);
  }

  addComment(text: string): NeuralEditorCommentThread | null {
    return this.adapter.addComment(text);
  }

  replyToComment(
    threadId: string,
    text: string,
  ): NeuralEditorCommentThread | null {
    return this.adapter.replyToComment(threadId, text);
  }

  resolveComment(threadId: string): boolean {
    return this.adapter.resolveComment(threadId, true);
  }

  reopenComment(threadId: string): boolean {
    return this.adapter.resolveComment(threadId, false);
  }

  deleteComment(threadId: string): boolean {
    return this.adapter.deleteComment(threadId);
  }

  selectComment(threadId: string): boolean {
    return this.adapter.selectComment(threadId);
  }

  acceptTrackedChange(changeId: string): boolean {
    return this.adapter.acceptTrackedChange(changeId);
  }

  rejectTrackedChange(changeId: string): boolean {
    return this.adapter.rejectTrackedChange(changeId);
  }

  acceptAllTrackedChanges(): boolean {
    return this.adapter.resolveAllTrackedChanges(true);
  }

  rejectAllTrackedChanges(): boolean {
    return this.adapter.resolveAllTrackedChanges(false);
  }

  createSnapshot(label?: string): NeuralEditorSnapshot | null {
    return this.adapter.createSnapshot(label);
  }

  restoreSnapshot(snapshotId: string): boolean {
    return this.adapter.restoreSnapshot(snapshotId);
  }

  deleteSnapshot(snapshotId: string): boolean {
    return this.adapter.deleteSnapshot(snapshotId);
  }

  insertImage(attributes: NeuralEditorImageAttributes): void {
    const normalized = normalizeImageAttributes(
      attributes,
      this.adapter.allowBase64Images(),
    );
    this.adapter.runCommand((editor) =>
      editor.chain().focus().setImage(normalized).run(),
    );
  }

  updateImage(attributes: Partial<NeuralEditorImageAttributes>): void {
    if (!this.isActive('image')) return;
    const current = this.getImageAttributes();
    if (!current) return;
    const normalized = normalizeImageUpdateAttributes(
      { ...current, ...attributes },
      this.adapter.allowBase64Images(),
    );
    this.adapter.runCommand((editor) =>
      editor.chain().focus().updateAttributes('image', normalized).run(),
    );
  }

  removeImage(): void {
    if (!this.isActive('image')) return;
    this.adapter.runCommand((editor) =>
      editor.chain().focus().deleteNode('image').run(),
    );
  }

  getImageAttributes(): NeuralEditorImageAttributes | null {
    this.adapter.revision();
    const editor = this.adapter.editor();
    if (!editor?.isActive('image')) return null;
    const attributes = editor.getAttributes('image');
    return {
      src: String(attributes['src'] ?? ''),
      alt: nullableString(attributes['alt']),
      title: nullableString(attributes['title']),
      width: nullableFiniteNumber(attributes['width']),
      height: nullableFiniteNumber(attributes['height']),
    };
  }

  run(command: Exclude<NeuralEditorCommand, 'link' | 'image'>): void {
    this.adapter.runCommand((editor) => runEditorCommand(editor, command));
  }

  can(command: Exclude<NeuralEditorCommand, 'link' | 'image'>): boolean {
    this.adapter.revision();
    const editor = this.adapter.editor();
    return editor ? canRunEditorCommand(editor, command) : false;
  }

  isActive(name: string, attrs?: Readonly<Record<string, unknown>>): boolean {
    this.adapter.revision();
    return this.adapter.editor()?.isActive(name, attrs) ?? false;
  }

  getNodeById(nodeId: string): NeuralEditorNodeSnapshot | null {
    this.adapter.revision();
    const editor = this.adapter.editor();
    return editor
      ? findNeuralEditorNodeById(
          editor.state.doc,
          nodeId,
          this.adapter.nodeIdAttribute(),
        )
      : null;
  }

  getNodeIdAt(position: number): string | null {
    this.adapter.revision();
    const editor = this.adapter.editor();
    return editor
      ? findNeuralEditorNodeIdAt(
          editor.state.doc,
          position,
          this.adapter.nodeIdAttribute(),
        )
      : null;
  }

  createOperationBatch(
    operations: readonly NeuralEditorOperation[],
    options: {
      readonly id?: string;
      readonly metadata?: Readonly<Record<string, unknown>>;
    } = {},
  ): NeuralEditorOperationBatch {
    return createNeuralEditorOperationBatch(
      operations,
      this.revision(),
      options,
    );
  }

  validateOperations(
    batch: NeuralEditorOperationBatch,
  ): NeuralEditorOperationValidationResult {
    return this.adapter.validateOperations(batch);
  }

  applyOperations(
    batch: NeuralEditorOperationBatch,
  ): NeuralEditorOperationApplyResult {
    return this.adapter.applyOperations(batch);
  }

  getDocument(): NeuralEditorDocument {
    const editor = this.adapter.editor();
    return editor
      ? fromTiptapJson(editor.getJSON())
      : createNeuralEditorEmptyDocument();
  }

  getHtml(): string {
    return this.adapter.editor()?.getHTML() ?? '';
  }

  getText(): string {
    return this.adapter.editor()?.getText() ?? '';
  }

  insertContent(content: NeuralEditorNode | readonly NeuralEditorNode[]): void {
    this.adapter.runCommand((editor) =>
      editor
        .chain()
        .focus()
        .insertContent(content as unknown as Content)
        .run(),
    );
  }

  insertText(text: string): void {
    this.adapter.runCommand((editor) =>
      editor.chain().focus().insertContent({ type: 'text', text }).run(),
    );
  }
}

function runEditorCommand(
  editor: Editor,
  command: Exclude<NeuralEditorCommand, 'link' | 'image'>,
): boolean {
  const chain = editor.chain().focus();
  switch (command) {
    case 'undo':
      return chain.undo().run();
    case 'redo':
      return chain.redo().run();
    case 'paragraph':
      return chain.setParagraph().run();
    case 'heading-1':
      return chain.toggleHeading({ level: 1 }).run();
    case 'heading-2':
      return chain.toggleHeading({ level: 2 }).run();
    case 'heading-3':
      return chain.toggleHeading({ level: 3 }).run();
    case 'bold':
      return chain.toggleBold().run();
    case 'italic':
      return chain.toggleItalic().run();
    case 'underline':
      return chain.toggleUnderline().run();
    case 'strike':
      return chain.toggleStrike().run();
    case 'code':
      return chain.toggleCode().run();
    case 'bullet-list':
      return chain.toggleBulletList().run();
    case 'ordered-list':
      return chain.toggleOrderedList().run();
    case 'task-list':
      return chain.toggleTaskList().run();
    case 'blockquote':
      return chain.toggleBlockquote().run();
    case 'code-block':
      return chain.toggleCodeBlock().run();
    case 'align-left':
      return chain.setTextAlign('left').run();
    case 'align-center':
      return chain.setTextAlign('center').run();
    case 'align-right':
      return chain.setTextAlign('right').run();
    case 'align-justify':
      return chain.setTextAlign('justify').run();
    case 'horizontal-rule':
      return chain.setHorizontalRule().run();
    case 'clear-formatting':
      return chain.unsetAllMarks().unsetTextAlign().clearNodes().run();
    case 'insert-table':
      return chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    case 'delete-table':
      return chain.deleteTable().run();
    case 'add-row-before':
      return chain.addRowBefore().run();
    case 'add-row-after':
      return chain.addRowAfter().run();
    case 'delete-row':
      return chain.deleteRow().run();
    case 'add-column-before':
      return chain.addColumnBefore().run();
    case 'add-column-after':
      return chain.addColumnAfter().run();
    case 'delete-column':
      return chain.deleteColumn().run();
    case 'merge-cells':
      return chain.mergeCells().run();
    case 'split-cell':
      return chain.splitCell().run();
    case 'toggle-header-row':
      return chain.toggleHeaderRow().run();
  }
}

function canRunEditorCommand(
  editor: Editor,
  command: Exclude<NeuralEditorCommand, 'link' | 'image'>,
): boolean {
  const chain = editor.can().chain();
  switch (command) {
    case 'undo':
      return chain.undo().run();
    case 'redo':
      return chain.redo().run();
    case 'paragraph':
      return chain.setParagraph().run();
    case 'heading-1':
      return chain.toggleHeading({ level: 1 }).run();
    case 'heading-2':
      return chain.toggleHeading({ level: 2 }).run();
    case 'heading-3':
      return chain.toggleHeading({ level: 3 }).run();
    case 'bold':
      return chain.toggleBold().run();
    case 'italic':
      return chain.toggleItalic().run();
    case 'underline':
      return chain.toggleUnderline().run();
    case 'strike':
      return chain.toggleStrike().run();
    case 'code':
      return chain.toggleCode().run();
    case 'bullet-list':
      return chain.toggleBulletList().run();
    case 'ordered-list':
      return chain.toggleOrderedList().run();
    case 'task-list':
      return chain.toggleTaskList().run();
    case 'blockquote':
      return chain.toggleBlockquote().run();
    case 'code-block':
      return chain.toggleCodeBlock().run();
    case 'align-left':
      return chain.setTextAlign('left').run();
    case 'align-center':
      return chain.setTextAlign('center').run();
    case 'align-right':
      return chain.setTextAlign('right').run();
    case 'align-justify':
      return chain.setTextAlign('justify').run();
    case 'horizontal-rule':
      return chain.setHorizontalRule().run();
    case 'clear-formatting':
      return chain.unsetAllMarks().unsetTextAlign().clearNodes().run();
    case 'insert-table':
      return chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    case 'delete-table':
      return chain.deleteTable().run();
    case 'add-row-before':
      return chain.addRowBefore().run();
    case 'add-row-after':
      return chain.addRowAfter().run();
    case 'delete-row':
      return chain.deleteRow().run();
    case 'add-column-before':
      return chain.addColumnBefore().run();
    case 'add-column-after':
      return chain.addColumnAfter().run();
    case 'delete-column':
      return chain.deleteColumn().run();
    case 'merge-cells':
      return chain.mergeCells().run();
    case 'split-cell':
      return chain.splitCell().run();
    case 'toggle-header-row':
      return chain.toggleHeaderRow().run();
  }
}

function normalizeTableDimension(
  value: number | undefined,
  fallback: number,
): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.floor(value as number));
}

interface NormalizedImageAttributes {
  readonly src: string;
  readonly alt?: string;
  readonly title?: string;
  readonly width?: number;
  readonly height?: number;
}

function normalizeImageAttributes(
  attributes: NeuralEditorImageAttributes,
  allowBase64: boolean,
): NormalizedImageAttributes {
  const src = attributes.src.trim();
  if (!src) throw new TypeError('Image src must be a non-empty URL.');
  if (!allowBase64 && /^data:/i.test(src)) {
    throw new TypeError(
      'Base64 image sources are disabled. Upload the file and insert its persistent URL.',
    );
  }
  if (/^blob:/i.test(src)) {
    throw new TypeError(
      'Blob image sources are temporary. Upload the file and insert its persistent URL.',
    );
  }

  const alt = optionalTrimmedString(attributes.alt);
  const title = optionalTrimmedString(attributes.title);
  const width = optionalPositiveNumber(attributes.width);
  const height = optionalPositiveNumber(attributes.height);

  return {
    src,
    ...(alt ? { alt } : {}),
    ...(title ? { title } : {}),
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  };
}

function normalizeImageUpdateAttributes(
  attributes: NeuralEditorImageAttributes,
  allowBase64: boolean,
): Readonly<Record<string, string | number | null>> {
  const normalized = normalizeImageAttributes(attributes, allowBase64);
  return {
    src: normalized.src,
    alt: normalized.alt ?? null,
    title: normalized.title ?? null,
    width: normalized.width ?? null,
    height: normalized.height ?? null,
  };
}

function optionalTrimmedString(
  value: string | null | undefined,
): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null;
}

function nullableFiniteNumber(value: unknown): number | null {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function optionalPositiveNumber(
  value: number | null | undefined,
): number | undefined {
  return Number.isFinite(value) && Number(value) > 0
    ? Number(value)
    : undefined;
}
