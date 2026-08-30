import { Extension, type Editor, type JSONContent } from '@tiptap/core';
import {
  DOMSerializer,
  Fragment,
  type Node as ProseMirrorNode,
  type Schema,
} from '@tiptap/pm/model';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type {
  NeuralEditorAiProposal,
  NeuralEditorOperation,
  NeuralEditorOperationTarget,
} from './editor.types';

export const NEURAL_EDITOR_AI_REVIEW_PLUGIN_KEY =
  new PluginKey<AiReviewPluginState>('neuralEditorAiReview');

interface AiReviewPluginState {
  readonly proposal: NeuralEditorAiProposal | null;
  readonly activeOperationIndex: number;
  readonly nodeIdAttribute: string;
  readonly decorations: DecorationSet;
}

type AiReviewMeta =
  | {
      readonly type: 'preview';
      readonly proposal: NeuralEditorAiProposal;
      readonly activeOperationIndex: number;
      readonly nodeIdAttribute: string;
    }
  | {
      readonly type: 'select';
      readonly activeOperationIndex: number;
    }
  | { readonly type: 'clear' };

interface ResolvedPreviewTarget {
  readonly from: number;
  readonly to: number;
  readonly node?: ProseMirrorNode;
}

export function createNeuralEditorAiReviewExtension(): Extension {
  return Extension.create({
    name: 'neuralEditorAiReview',
    addProseMirrorPlugins() {
      const editor = this.editor;
      return [
        new Plugin<AiReviewPluginState>({
          key: NEURAL_EDITOR_AI_REVIEW_PLUGIN_KEY,
          state: {
            init: () => emptyState(editor.state.doc),
            apply: (transaction, previous, _oldState, nextState) => {
              const meta = transaction.getMeta(
                NEURAL_EDITOR_AI_REVIEW_PLUGIN_KEY,
              ) as AiReviewMeta | undefined;

              if (meta?.type === 'clear') return emptyState(nextState.doc);

              if (meta?.type === 'preview') {
                return createState(
                  editor,
                  nextState.doc,
                  meta.proposal,
                  meta.activeOperationIndex,
                  meta.nodeIdAttribute,
                );
              }

              if (meta?.type === 'select' && previous.proposal) {
                return createState(
                  editor,
                  nextState.doc,
                  previous.proposal,
                  meta.activeOperationIndex,
                  previous.nodeIdAttribute,
                );
              }

              if (transaction.docChanged) return emptyState(nextState.doc);

              return {
                ...previous,
                decorations: previous.decorations.map(
                  transaction.mapping,
                  transaction.doc,
                ),
              };
            },
          },
          props: {
            decorations: (state) =>
              NEURAL_EDITOR_AI_REVIEW_PLUGIN_KEY.getState(state)?.decorations ??
              null,
          },
        }),
      ];
    },
  });
}

export function showNeuralEditorAiReview(
  editor: Editor,
  proposal: NeuralEditorAiProposal,
  activeOperationIndex: number,
  nodeIdAttribute: string,
): void {
  editor.view.dispatch(
    editor.state.tr.setMeta(NEURAL_EDITOR_AI_REVIEW_PLUGIN_KEY, {
      type: 'preview',
      proposal,
      activeOperationIndex: normalizeActiveIndex(
        activeOperationIndex,
        proposal.operations.length,
      ),
      nodeIdAttribute,
    } satisfies AiReviewMeta),
  );
}

export function selectNeuralEditorAiReviewOperation(
  editor: Editor,
  activeOperationIndex: number,
): void {
  editor.view.dispatch(
    editor.state.tr.setMeta(NEURAL_EDITOR_AI_REVIEW_PLUGIN_KEY, {
      type: 'select',
      activeOperationIndex,
    } satisfies AiReviewMeta),
  );
}

export function clearNeuralEditorAiReview(editor: Editor): void {
  editor.view.dispatch(
    editor.state.tr.setMeta(NEURAL_EDITOR_AI_REVIEW_PLUGIN_KEY, {
      type: 'clear',
    } satisfies AiReviewMeta),
  );
}

function emptyState(document: ProseMirrorNode): AiReviewPluginState {
  return {
    proposal: null,
    activeOperationIndex: 0,
    nodeIdAttribute: 'neuralId',
    decorations: DecorationSet.create(document, []),
  };
}

function createState(
  editor: Editor,
  document: ProseMirrorNode,
  proposal: NeuralEditorAiProposal,
  activeOperationIndex: number,
  nodeIdAttribute: string,
): AiReviewPluginState {
  const normalizedIndex = normalizeActiveIndex(
    activeOperationIndex,
    proposal.operations.length,
  );
  return {
    proposal,
    activeOperationIndex: normalizedIndex,
    nodeIdAttribute,
    decorations: createDecorations(
      editor,
      document,
      proposal,
      normalizedIndex,
      nodeIdAttribute,
    ),
  };
}

function createDecorations(
  editor: Editor,
  document: ProseMirrorNode,
  proposal: NeuralEditorAiProposal,
  activeOperationIndex: number,
  nodeIdAttribute: string,
): DecorationSet {
  const decorations: Decoration[] = [];
  proposal.operations.forEach((operation, index) => {
    const selected = index === activeOperationIndex;
    try {
      appendOperationDecorations(
        decorations,
        editor,
        document,
        operation,
        index,
        selected,
        nodeIdAttribute,
      );
    } catch {
      // The operation engine remains the source of truth. A decoration failure
      // must never mutate or invalidate canonical editor content.
    }
  });
  return DecorationSet.create(document, decorations);
}

function appendOperationDecorations(
  decorations: Decoration[],
  editor: Editor,
  document: ProseMirrorNode,
  operation: NeuralEditorOperation,
  index: number,
  selected: boolean,
  nodeIdAttribute: string,
): void {
  const target = resolvePreviewTarget(
    document,
    operation.target,
    nodeIdAttribute,
  );
  if (!target) return;

  const operationId = operation.id ?? `operation-${index + 1}`;
  const selectedClass = selected ? ' neural-editor-ai-change-selected' : '';
  const attributes = {
    'data-neural-editor-ai-operation': operationId,
    'data-neural-editor-ai-operation-index': String(index),
  };

  if (operation.type === 'insert') {
    const position = resolveInsertPosition(target, operation.position);
    decorations.push(
      Decoration.widget(
        position,
        () =>
          renderAddedContent(editor, operation.content, operationId, selected),
        { side: 1, key: `neural-ai-insert-${operationId}` },
      ),
    );
    return;
  }

  if (operation.type === 'replace') {
    appendRemovalDecoration(
      decorations,
      editor.view.dom.ownerDocument,
      document,
      target,
      `neural-editor-ai-deletion${selectedClass}`,
      attributes,
      operationId,
    );
    decorations.push(
      Decoration.widget(
        target.to,
        () =>
          renderAddedContent(editor, operation.content, operationId, selected),
        { side: 1, key: `neural-ai-replace-${operationId}` },
      ),
    );
    return;
  }

  if (operation.type === 'delete') {
    appendRemovalDecoration(
      decorations,
      editor.view.dom.ownerDocument,
      document,
      target,
      `neural-editor-ai-deletion${selectedClass}`,
      attributes,
      operationId,
    );
    return;
  }

  if (operation.type === 'update-node' && target.node) {
    decorations.push(
      Decoration.node(target.from, target.to, {
        class: `neural-editor-ai-update${selectedClass}`,
        ...attributes,
      }),
    );
  }
}

function appendRemovalDecoration(
  decorations: Decoration[],
  ownerDocument: Document,
  document: ProseMirrorNode,
  target: ResolvedPreviewTarget,
  className: string,
  attributes: Readonly<Record<string, string>>,
  operationId: string,
): void {
  if (target.node && !target.node.isText) {
    decorations.push(
      Decoration.node(target.from, target.to, {
        class: className,
        ...attributes,
      }),
    );
    return;
  }

  const from = clampPosition(target.from, document.content.size);
  const to = clampPosition(target.to, document.content.size);
  if (from < to && document.resolve(from).sameParent(document.resolve(to))) {
    decorations.push(
      Decoration.inline(from, to, {
        class: className,
        ...attributes,
      }),
    );
    return;
  }

  decorations.push(
    Decoration.widget(
      from,
      () =>
        renderDeletionMarker(ownerDocument, document, operationId, className),
      { side: -1, key: `neural-ai-delete-${operationId}` },
    ),
  );
}

function renderAddedContent(
  editor: Editor,
  content: readonly import('./editor.types').NeuralEditorNode[],
  operationId: string,
  selected: boolean,
): HTMLElement {
  const ownerDocument = editor.view.dom.ownerDocument;
  const nodes = createPreviewNodes(editor.schema, content);
  const inline = nodes.length > 0 && nodes.every((node) => node.isInline);
  const wrapper = ownerDocument.createElement(inline ? 'span' : 'div');
  wrapper.className = [
    'neural-editor-ai-addition',
    selected ? 'neural-editor-ai-change-selected' : '',
  ]
    .filter(Boolean)
    .join(' ');
  wrapper.contentEditable = 'false';
  wrapper.dataset['neuralEditorAiOperation'] = operationId;
  wrapper.dataset['neuralEditorAiChange'] = 'addition';

  if (nodes.length === 0) {
    wrapper.textContent = '…';
    return wrapper;
  }

  const fragment = Fragment.fromArray(nodes);
  const rendered = DOMSerializer.fromSchema(editor.schema).serializeFragment(
    fragment,
    { document: ownerDocument },
  );
  wrapper.append(rendered);
  return wrapper;
}

function renderDeletionMarker(
  ownerDocument: Document,
  document: ProseMirrorNode,
  operationId: string,
  className: string,
): HTMLElement {
  const marker = ownerDocument.createElement('span');
  marker.className = className;
  marker.contentEditable = 'false';
  marker.dataset['neuralEditorAiOperation'] = operationId;
  marker.dataset['neuralEditorAiChange'] = 'deletion';
  marker.textContent = document.textContent ? '−' : '×';
  return marker;
}

function createPreviewNodes(
  schema: Schema,
  content: readonly import('./editor.types').NeuralEditorNode[],
): ProseMirrorNode[] {
  const nodes: ProseMirrorNode[] = [];
  for (const value of content) {
    try {
      nodes.push(schema.nodeFromJSON(value as JSONContent));
    } catch {
      // Invalid content is reported by operation validation. Keep preview safe.
    }
  }
  return nodes;
}

function resolvePreviewTarget(
  document: ProseMirrorNode,
  target: NeuralEditorOperationTarget,
  nodeIdAttribute: string,
): ResolvedPreviewTarget | null {
  if (target.nodeId?.trim()) {
    return findNodeTarget(document, target.nodeId.trim(), nodeIdAttribute);
  }

  if (target.from === undefined || target.to === undefined) return null;
  const from = clampPosition(Math.trunc(target.from), document.content.size);
  const to = clampPosition(Math.trunc(target.to), document.content.size);
  if (from > to) return null;
  return {
    from,
    to,
    node: findExactNode(document, from, to),
  };
}

function findNodeTarget(
  document: ProseMirrorNode,
  nodeId: string,
  nodeIdAttribute: string,
): ResolvedPreviewTarget | null {
  let result: ResolvedPreviewTarget | null = null;
  document.descendants((node, position) => {
    if (String(node.attrs[nodeIdAttribute] ?? '') !== nodeId) return true;
    result = {
      from: position,
      to: position + node.nodeSize,
      node,
    };
    return false;
  });
  return result;
}

function findExactNode(
  document: ProseMirrorNode,
  from: number,
  to: number,
): ProseMirrorNode | undefined {
  let result: ProseMirrorNode | undefined;
  document.descendants((node, position) => {
    if (position === from && position + node.nodeSize === to) {
      result = node;
      return false;
    }
    return true;
  });
  return result;
}

function resolveInsertPosition(
  target: ResolvedPreviewTarget,
  position: 'before' | 'after' | 'inside-start' | 'inside-end',
): number {
  switch (position) {
    case 'before':
      return target.from;
    case 'after':
      return target.to;
    case 'inside-start':
      return target.node ? target.from + 1 : target.from;
    case 'inside-end':
      return target.node ? Math.max(target.from + 1, target.to - 1) : target.to;
  }
}

function normalizeActiveIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return Math.max(0, Math.min(Math.trunc(index), count - 1));
}

function clampPosition(position: number, size: number): number {
  return Math.max(0, Math.min(position, size));
}
