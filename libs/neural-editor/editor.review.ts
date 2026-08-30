import { Extension, Mark, type AnyExtension, type Editor } from '@tiptap/core';
import { isChangeOrigin } from '@tiptap/extension-collaboration';
import { Fragment, type Node as ProseMirrorNode } from '@tiptap/pm/model';
import { Plugin, PluginKey, type Transaction } from '@tiptap/pm/state';
import { Mapping, ReplaceStep } from '@tiptap/pm/transform';
import type {
  NeuralEditorCollaborationUser,
  NeuralEditorTrackedChange,
  NeuralEditorTrackedChangeKind,
} from './editor.types';
import { createCollaborationId } from './editor.collaboration';

export const NEURAL_EDITOR_COMMENT_MARK = 'neuralComment';
export const NEURAL_EDITOR_INSERTION_MARK = 'neuralInsertion';
export const NEURAL_EDITOR_DELETION_MARK = 'neuralDeletion';
export const NEURAL_EDITOR_TRACKED_CHANGES_META = 'neuralEditorTrackedChanges';

const trackedChangesPluginKey = new PluginKey('neuralEditorTrackedChanges');

export interface NeuralEditorReviewExtensionOptions {
  readonly commentsEnabled: () => boolean;
  readonly onCommentActivated: (threadId: string) => void;
  readonly trackedChangesEnabled: () => boolean;
  readonly currentUser: () => NeuralEditorCollaborationUser | null;
}

export function createNeuralEditorReviewSchemaExtensions(): AnyExtension[] {
  return [
    createCommentMark({
      commentsEnabled: () => false,
      onCommentActivated: () => undefined,
      trackedChangesEnabled: () => false,
      currentUser: () => null,
    }),
    createTrackedMark(NEURAL_EDITOR_INSERTION_MARK, 'insertion'),
    createTrackedMark(NEURAL_EDITOR_DELETION_MARK, 'deletion'),
  ];
}

export function createNeuralEditorReviewExtensions(
  options: NeuralEditorReviewExtensionOptions,
): AnyExtension[] {
  return [
    createCommentMark(options),
    createTrackedMark(NEURAL_EDITOR_INSERTION_MARK, 'insertion'),
    createTrackedMark(NEURAL_EDITOR_DELETION_MARK, 'deletion'),
    createTrackedChangesExtension(options),
  ];
}

export function readNeuralEditorTrackedChanges(
  editor: Editor | null,
): readonly NeuralEditorTrackedChange[] {
  if (!editor) return [];
  const grouped = new Map<string, MutableTrackedChange>();
  editor.state.doc.descendants((node, position) => {
    if (!node.isText) return;
    for (const mark of node.marks) {
      const kind =
        mark.type.name === NEURAL_EDITOR_INSERTION_MARK
          ? 'insertion'
          : mark.type.name === NEURAL_EDITOR_DELETION_MARK
            ? 'deletion'
            : null;
      if (!kind) continue;
      const id = String(mark.attrs['id'] ?? '');
      if (!id) continue;
      const from = position;
      const to = position + node.nodeSize;
      const existing = grouped.get(id);
      if (existing) {
        existing.from = Math.min(existing.from, from);
        existing.to = Math.max(existing.to, to);
        existing.text += node.text ?? '';
      } else {
        grouped.set(id, {
          id,
          kind,
          from,
          to,
          text: node.text ?? '',
          userId: String(mark.attrs['userId'] ?? ''),
          userName: String(mark.attrs['userName'] ?? ''),
          userColor: String(mark.attrs['userColor'] ?? '#2563eb'),
          createdAt: String(mark.attrs['createdAt'] ?? ''),
        });
      }
    }
  });
  return [...grouped.values()].sort((left, right) => left.from - right.from);
}

export function acceptNeuralEditorTrackedChange(
  editor: Editor,
  changeId: string,
): boolean {
  return resolveTrackedChange(editor, changeId, true);
}

export function rejectNeuralEditorTrackedChange(
  editor: Editor,
  changeId: string,
): boolean {
  return resolveTrackedChange(editor, changeId, false);
}

export function resolveAllNeuralEditorTrackedChanges(
  editor: Editor,
  accept: boolean,
): boolean {
  const changes = readNeuralEditorTrackedChanges(editor);
  if (!changes.length) return false;
  const tr = editor.state.tr.setMeta(NEURAL_EDITOR_TRACKED_CHANGES_META, true);
  for (const change of [...changes].sort((a, b) => b.from - a.from)) {
    applyTrackedResolution(editor, tr, change, accept);
  }
  editor.view.dispatch(tr);
  return true;
}

function createCommentMark(options: NeuralEditorReviewExtensionOptions) {
  return Mark.create({
    name: NEURAL_EDITOR_COMMENT_MARK,
    inclusive: false,
    addAttributes() {
      return {
        threadId: {
          default: null,
          parseHTML: (element) => element.getAttribute('data-thread-id'),
          renderHTML: (attributes) => ({
            'data-thread-id': attributes['threadId'],
          }),
        },
      };
    },
    parseHTML() {
      return [{ tag: 'span[data-neural-editor-comment]' }];
    },
    renderHTML({ HTMLAttributes }) {
      return [
        'span',
        {
          ...HTMLAttributes,
          'data-neural-editor-comment': '',
          class: 'neural-editor-comment-anchor',
        },
        0,
      ];
    },
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey('neuralEditorComments'),
          props: {
            handleClick: (_view, _position, event) => {
              if (!options.commentsEnabled()) return false;
              const target = event.target;
              if (!(target instanceof HTMLElement)) return false;
              const anchor = target.closest<HTMLElement>(
                '[data-neural-editor-comment][data-thread-id]',
              );
              const threadId = anchor?.dataset['threadId'];
              if (!threadId) return false;
              options.onCommentActivated(threadId);
              return false;
            },
          },
        }),
      ];
    },
  });
}

function createTrackedMark(name: string, kind: NeuralEditorTrackedChangeKind) {
  return Mark.create({
    name,
    inclusive: kind === 'insertion',
    excludes: '',
    addAttributes() {
      return {
        id: { default: null },
        userId: { default: null },
        userName: { default: null },
        userColor: { default: null },
        createdAt: { default: null },
      };
    },
    parseHTML() {
      return [{ tag: `span[data-neural-editor-${kind}]` }];
    },
    renderHTML({ HTMLAttributes }) {
      return [
        'span',
        {
          ...HTMLAttributes,
          [`data-neural-editor-${kind}`]: '',
          'data-change-id': HTMLAttributes['id'],
          class: `neural-editor-tracked-${kind}`,
        },
        0,
      ];
    },
  });
}

function createTrackedChangesExtension(
  options: NeuralEditorReviewExtensionOptions,
): Extension {
  return Extension.create({
    name: 'neuralEditorTrackedChanges',
    addProseMirrorPlugins() {
      return [createTrackedChangesPlugin(options)];
    },
  });
}

function createTrackedChangesPlugin(
  options: NeuralEditorReviewExtensionOptions,
): Plugin {
  return new Plugin({
    key: trackedChangesPluginKey,
    appendTransaction(transactions, oldState, newState) {
      if (!options.trackedChangesEnabled()) return null;
      if (
        transactions.some(
          (transaction) =>
            transaction.getMeta(NEURAL_EDITOR_TRACKED_CHANGES_META) ||
            isChangeOrigin(transaction),
        )
      ) {
        return null;
      }

      const user = options.currentUser();
      if (!user) return null;
      const edits = collectTextEdits(transactions, oldState.doc);
      if (!edits.length) return null;

      const insertionType = newState.schema.marks[NEURAL_EDITOR_INSERTION_MARK];
      const deletionType = newState.schema.marks[NEURAL_EDITOR_DELETION_MARK];
      if (!insertionType || !deletionType) return null;

      const tr = newState.tr.setMeta(NEURAL_EDITOR_TRACKED_CHANGES_META, true);
      const attrs = () => ({
        id: createCollaborationId('change'),
        userId: user.id,
        userName: user.name,
        userColor: user.color,
        createdAt: new Date().toISOString(),
      });

      for (const edit of [...edits].sort((a, b) => b.position - a.position)) {
        const deletionAttrs = attrs();
        const insertionAttrs = attrs();
        let insertionOffset = 0;
        if (edit.deleted.size > 0) {
          const marked = mapFragmentText(edit.deleted, (node) =>
            node.mark([
              ...node.marks.filter(
                (mark) =>
                  mark.type.name !== NEURAL_EDITOR_INSERTION_MARK &&
                  mark.type.name !== NEURAL_EDITOR_DELETION_MARK,
              ),
              deletionType.create(deletionAttrs),
            ]),
          );
          tr.insert(edit.position, marked);
          insertionOffset = marked.size;
        }
        if (edit.insertedSize > 0) {
          const from = edit.position + insertionOffset;
          const to = from + edit.insertedSize;
          if (from < to && to <= tr.doc.content.size) {
            tr.addMark(from, to, insertionType.create(insertionAttrs));
          }
        }
      }
      return tr.docChanged ? tr : null;
    },
  });
}

interface TextEdit {
  readonly position: number;
  readonly insertedSize: number;
  readonly deleted: Fragment;
}

function collectTextEdits(
  transactions: readonly Transaction[],
  initialDoc: ProseMirrorNode,
): TextEdit[] {
  const edits: TextEdit[] = [];
  const allMaps = transactions.flatMap(
    (transaction) => transaction.mapping.maps,
  );
  let globalMapOffset = 0;
  let currentDoc = initialDoc;

  for (const transaction of transactions) {
    for (let stepIndex = 0; stepIndex < transaction.steps.length; stepIndex++) {
      const step = transaction.steps[stepIndex];
      const before = transaction.docs[stepIndex] ?? currentDoc;
      if (step instanceof ReplaceStep) {
        const deletedSlice =
          step.from < step.to ? before.slice(step.from, step.to) : null;
        const deleted = deletedSlice?.content ?? Fragment.empty;
        const inserted = step.slice.content;
        if (
          !isTextOnlyFragment(deleted) ||
          !isTextOnlyFragment(inserted) ||
          (deletedSlice && (deletedSlice.openStart || deletedSlice.openEnd)) ||
          step.slice.openStart ||
          step.slice.openEnd
        ) {
          continue;
        }
        const suffix = new Mapping(
          allMaps.slice(globalMapOffset + stepIndex + 1),
        );
        const positionAfterStep = step.getMap().map(step.from, -1);
        const position = suffix.map(positionAfterStep, -1);
        edits.push({
          position,
          insertedSize: inserted.size,
          deleted,
        });
      }
    }
    globalMapOffset += transaction.mapping.maps.length;
    currentDoc = transaction.doc;
  }
  return edits.filter((edit) => edit.insertedSize > 0 || edit.deleted.size > 0);
}

function isTextOnlyFragment(fragment: Fragment): boolean {
  let valid = true;
  fragment.forEach((node) => {
    if (!node.isText) valid = false;
  });
  return valid;
}

function mapFragmentText(
  fragment: Fragment,
  transform: (node: ProseMirrorNode) => ProseMirrorNode,
): Fragment {
  const children: ProseMirrorNode[] = [];
  fragment.forEach((node) => {
    if (node.isText) {
      children.push(transform(node));
      return;
    }
    if (node.content.size > 0) {
      children.push(node.copy(mapFragmentText(node.content, transform)));
      return;
    }
    children.push(node);
  });
  return Fragment.fromArray(children);
}

function resolveTrackedChange(
  editor: Editor,
  changeId: string,
  accept: boolean,
): boolean {
  const change = readNeuralEditorTrackedChanges(editor).find(
    (candidate) => candidate.id === changeId,
  );
  if (!change) return false;
  const tr = editor.state.tr.setMeta(NEURAL_EDITOR_TRACKED_CHANGES_META, true);
  applyTrackedResolution(editor, tr, change, accept);
  editor.view.dispatch(tr);
  return true;
}

function applyTrackedResolution(
  editor: Editor,
  tr: Transaction,
  change: NeuralEditorTrackedChange,
  accept: boolean,
): void {
  const markType =
    editor.schema.marks[
      change.kind === 'insertion'
        ? NEURAL_EDITOR_INSERTION_MARK
        : NEURAL_EDITOR_DELETION_MARK
    ];
  if (!markType) return;
  const shouldDelete =
    (change.kind === 'insertion' && !accept) ||
    (change.kind === 'deletion' && accept);
  if (shouldDelete) {
    tr.delete(change.from, change.to);
  } else {
    tr.removeMark(change.from, change.to, markType);
  }
}

interface MutableTrackedChange {
  readonly id: string;
  readonly kind: NeuralEditorTrackedChangeKind;
  from: number;
  to: number;
  text: string;
  readonly userId: string;
  readonly userName: string;
  readonly userColor: string;
  readonly createdAt: string;
}
