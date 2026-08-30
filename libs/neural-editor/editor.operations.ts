import type { Editor, JSONContent } from '@tiptap/core';
import { Fragment, type Node as ProseMirrorNode } from '@tiptap/pm/model';
import type { Transaction } from '@tiptap/pm/state';
import type {
  NeuralEditorInsertPosition,
  NeuralEditorNode,
  NeuralEditorNodeSnapshot,
  NeuralEditorOperation,
  NeuralEditorOperationApplyResult,
  NeuralEditorOperationBatch,
  NeuralEditorOperationError,
  NeuralEditorOperationErrorCode,
  NeuralEditorOperationTarget,
  NeuralEditorOperationValidationResult,
} from './editor.types';
import { fromTiptapJson } from './editor.utils';

export interface NeuralEditorOperationEngineOptions {
  readonly nodeIdAttribute: string;
  readonly currentRevision: () => number;
  readonly editable: () => boolean;
}

interface ResolvedTarget {
  readonly from: number;
  readonly to: number;
  readonly node?: ProseMirrorNode;
  readonly nodePosition?: number;
  readonly nodeId?: string;
}

export function createNeuralEditorOperationBatch(
  operations: readonly NeuralEditorOperation[],
  baseRevision: number,
  options: {
    readonly id?: string;
    readonly metadata?: Readonly<Record<string, unknown>>;
  } = {},
): NeuralEditorOperationBatch {
  return {
    id: normalizeBatchId(options.id),
    baseRevision: normalizeRevision(baseRevision),
    operations: operations.map(cloneOperation),
    ...(options.metadata ? { metadata: { ...options.metadata } } : {}),
  };
}

export function validateNeuralEditorOperations(
  editor: Editor,
  batch: NeuralEditorOperationBatch,
  options: NeuralEditorOperationEngineOptions,
): NeuralEditorOperationValidationResult {
  const currentRevision = options.currentRevision();
  const preliminary = validateBatch(
    batch,
    currentRevision,
    options.editable(),
    false,
  );
  if (preliminary) return preliminary;

  try {
    buildTransaction(editor, batch, options.nodeIdAttribute);
    return {
      valid: true,
      batchId: batch.id,
      baseRevision: batch.baseRevision,
      currentRevision,
      operationCount: batch.operations.length,
    };
  } catch (error) {
    return {
      valid: false,
      batchId: batch.id,
      baseRevision: batch.baseRevision,
      currentRevision,
      error: toOperationError(error),
    };
  }
}

export function applyNeuralEditorOperations(
  editor: Editor,
  batch: NeuralEditorOperationBatch,
  options: NeuralEditorOperationEngineOptions,
): NeuralEditorOperationApplyResult {
  const currentRevision = options.currentRevision();
  const preliminary = validateBatch(
    batch,
    currentRevision,
    options.editable(),
    true,
  );
  if (preliminary) {
    return {
      status:
        preliminary.error.code === 'revision-conflict'
          ? 'conflict'
          : 'rejected',
      batchId: batch.id,
      baseRevision: batch.baseRevision,
      revision: currentRevision,
      error: preliminary.error,
    };
  }

  try {
    const transaction = buildTransaction(
      editor,
      batch,
      options.nodeIdAttribute,
    );

    if (transaction.docChanged) {
      editor.view.dispatch(transaction.scrollIntoView());
    }

    return {
      status: 'applied',
      batchId: batch.id,
      baseRevision: batch.baseRevision,
      revision: options.currentRevision(),
      operationCount: batch.operations.length,
      document: fromTiptapJson(editor.getJSON()),
    };
  } catch (error) {
    return {
      status: 'rejected',
      batchId: batch.id,
      baseRevision: batch.baseRevision,
      revision: options.currentRevision(),
      error: toOperationError(error),
    };
  }
}

export function findNeuralEditorNodeById(
  document: ProseMirrorNode,
  nodeId: string,
  nodeIdAttribute: string,
): NeuralEditorNodeSnapshot | null {
  const normalizedId = nodeId.trim();
  if (!normalizedId) return null;

  let match: NeuralEditorNodeSnapshot | null = null;
  document.descendants((node, position) => {
    if (String(node.attrs[nodeIdAttribute] ?? '') !== normalizedId) return true;
    match = {
      id: normalizedId,
      type: node.type.name,
      position,
      from: position,
      to: position + node.nodeSize,
      depth: document.resolve(position).depth + 1,
      node: node.toJSON() as NeuralEditorNode,
    };
    return false;
  });
  return match;
}

export function findNeuralEditorNodeIdAt(
  document: ProseMirrorNode,
  position: number,
  nodeIdAttribute: string,
): string | null {
  const safePosition = Math.max(
    0,
    Math.min(Math.trunc(position), document.content.size),
  );
  const resolved = document.resolve(safePosition);
  for (let depth = resolved.depth; depth > 0; depth--) {
    const value = resolved.node(depth).attrs[nodeIdAttribute];
    if (typeof value === 'string' && value) return value;
  }
  return null;
}

function validateBatch(
  batch: NeuralEditorOperationBatch,
  currentRevision: number,
  editable: boolean,
  requireEditable: boolean,
): Extract<NeuralEditorOperationValidationResult, { valid: false }> | null {
  if (requireEditable && !editable) {
    return invalidValidation(batch, currentRevision, {
      code: 'not-editable',
      message: 'Editor operations require an editable editor.',
    });
  }
  if (!batch.id?.trim()) {
    return invalidValidation(batch, currentRevision, {
      code: 'operation-failed',
      message: 'Operation batch id must be a non-empty string.',
    });
  }
  if (batch.baseRevision !== currentRevision) {
    return invalidValidation(batch, currentRevision, {
      code: 'revision-conflict',
      message: `Operation batch targets revision ${batch.baseRevision}, but the current revision is ${currentRevision}.`,
    });
  }
  if (batch.operations.length === 0) {
    return invalidValidation(batch, currentRevision, {
      code: 'empty-batch',
      message: 'Operation batch must contain at least one operation.',
    });
  }
  return null;
}

function invalidValidation(
  batch: NeuralEditorOperationBatch,
  currentRevision: number,
  error: NeuralEditorOperationError,
): Extract<NeuralEditorOperationValidationResult, { valid: false }> {
  return {
    valid: false,
    batchId: batch.id,
    baseRevision: batch.baseRevision,
    currentRevision,
    error,
  };
}

function buildTransaction(
  editor: Editor,
  batch: NeuralEditorOperationBatch,
  nodeIdAttribute: string,
): Transaction {
  const transaction = editor.state.tr;
  batch.operations.forEach((operation, index) => {
    try {
      applyOperation(
        transaction,
        operation,
        index,
        editor.state.doc,
        nodeIdAttribute,
      );
    } catch (error) {
      if (error instanceof NeuralEditorOperationEngineError) throw error;
      throw new NeuralEditorOperationEngineError(
        classifyOperationError(error),
        error instanceof Error ? error.message : 'Editor operation failed.',
        index,
        operation.id,
      );
    }
  });
  return transaction;
}

function applyOperation(
  transaction: Transaction,
  operation: NeuralEditorOperation,
  operationIndex: number,
  baseDocument: ProseMirrorNode,
  nodeIdAttribute: string,
): void {
  switch (operation.type) {
    case 'insert': {
      const target = resolveTarget(
        transaction,
        operation.target,
        operationIndex,
        operation.id,
        baseDocument,
        nodeIdAttribute,
      );
      const content = createOperationFragment(
        transaction,
        operation.content,
        nodeIdAttribute,
        operationIndex,
        operation.id,
      );
      const position = resolveInsertPosition(target, operation.position);
      transaction.insert(position, content);
      return;
    }

    case 'replace': {
      const target = resolveTarget(
        transaction,
        operation.target,
        operationIndex,
        operation.id,
        baseDocument,
        nodeIdAttribute,
      );
      const normalizedContent = operation.content.map((node) =>
        stripNodeId(node, nodeIdAttribute),
      );
      const [first] = normalizedContent;
      if (
        operation.preserveTargetId !== false &&
        target.node &&
        target.nodeId &&
        normalizedContent.length === 1 &&
        first?.type === target.node.type.name
      ) {
        normalizedContent[0] = {
          ...first,
          attrs: {
            ...(first.attrs ?? {}),
            [nodeIdAttribute]: target.nodeId,
          },
        };
      }
      const content = createOperationFragment(
        transaction,
        normalizedContent,
        nodeIdAttribute,
        operationIndex,
        operation.id,
        false,
      );
      transaction.replaceWith(target.from, target.to, content);
      return;
    }

    case 'delete': {
      const target = resolveTarget(
        transaction,
        operation.target,
        operationIndex,
        operation.id,
        baseDocument,
        nodeIdAttribute,
      );
      transaction.delete(target.from, target.to);
      return;
    }

    case 'update-node': {
      if (
        Object.prototype.hasOwnProperty.call(operation.attrs, nodeIdAttribute)
      ) {
        throw new NeuralEditorOperationEngineError(
          'protected-attribute',
          `The protected node ID attribute "${nodeIdAttribute}" cannot be updated.`,
          operationIndex,
          operation.id,
        );
      }
      const target = resolveTarget(
        transaction,
        operation.target,
        operationIndex,
        operation.id,
        baseDocument,
        nodeIdAttribute,
      );
      if (
        !target.node ||
        target.nodePosition === undefined ||
        target.node.isText
      ) {
        throw new NeuralEditorOperationEngineError(
          'invalid-target',
          'update-node requires a non-text node ID target.',
          operationIndex,
          operation.id,
        );
      }
      const declaredAttributes = new Set(
        Object.keys(target.node.type.spec.attrs ?? {}),
      );
      const unknownAttribute = Object.keys(operation.attrs).find(
        (attribute) => !declaredAttributes.has(attribute),
      );
      if (unknownAttribute) {
        throw new NeuralEditorOperationEngineError(
          'schema-violation',
          `Attribute "${unknownAttribute}" is not declared for node type "${target.node.type.name}".`,
          operationIndex,
          operation.id,
        );
      }
      transaction.setNodeMarkup(
        target.nodePosition,
        undefined,
        { ...target.node.attrs, ...operation.attrs },
        target.node.marks,
      );
      return;
    }
  }
}

function resolveTarget(
  transaction: Transaction,
  target: NeuralEditorOperationTarget,
  operationIndex: number,
  operationId: string | undefined,
  baseDocument: ProseMirrorNode,
  nodeIdAttribute: string,
): ResolvedTarget {
  const nodeId = target.nodeId?.trim();
  const hasFrom = Number.isInteger(target.from);
  const hasTo = Number.isInteger(target.to);

  if (nodeId && !hasFrom && !hasTo) {
    const found = findNodeInDocument(transaction.doc, nodeId, nodeIdAttribute);
    if (!found) {
      throw new NeuralEditorOperationEngineError(
        'target-not-found',
        `No editor node was found for ID "${nodeId}".`,
        operationIndex,
        operationId,
      );
    }
    return found;
  }

  if (!nodeId && hasFrom && hasTo) {
    const from = target.from as number;
    const to = target.to as number;
    if (from < 0 || to < from || to > baseDocument.content.size) {
      throw new NeuralEditorOperationEngineError(
        'invalid-target',
        `Invalid editor range ${from}..${to}.`,
        operationIndex,
        operationId,
      );
    }
    const mappedFrom = transaction.mapping.map(from, -1);
    const mappedTo = transaction.mapping.map(to, 1);
    return { from: mappedFrom, to: mappedTo };
  }

  throw new NeuralEditorOperationEngineError(
    'invalid-target',
    'Operation target must contain either nodeId or a complete from/to range, but not both.',
    operationIndex,
    operationId,
  );
}

function findNodeInDocument(
  document: ProseMirrorNode,
  nodeId: string,
  nodeIdAttribute: string,
): ResolvedTarget | null {
  let result: ResolvedTarget | null = null;
  document.descendants((node, position) => {
    if (String(node.attrs[nodeIdAttribute] ?? '') !== nodeId) return true;
    result = {
      from: position,
      to: position + node.nodeSize,
      node,
      nodePosition: position,
      nodeId,
    };
    return false;
  });
  return result;
}

function resolveInsertPosition(
  target: ResolvedTarget,
  position: NeuralEditorInsertPosition,
): number {
  switch (position) {
    case 'before':
      return target.from;
    case 'after':
      return target.to;
    case 'inside-start':
      return target.node ? target.from + 1 : target.from;
    case 'inside-end':
      return target.node ? target.to - 1 : target.to;
  }
}

function createOperationFragment(
  transaction: Transaction,
  content: readonly NeuralEditorNode[],
  nodeIdAttribute: string,
  operationIndex: number,
  operationId: string | undefined,
  stripIds = true,
): Fragment {
  if (content.length === 0) return Fragment.empty;
  try {
    const nodes = content.map((node) =>
      transaction.doc.type.schema.nodeFromJSON(
        (stripIds
          ? stripNodeId(node, nodeIdAttribute)
          : cloneNode(node)) as JSONContent,
      ),
    );
    return Fragment.fromArray(nodes);
  } catch (error) {
    throw new NeuralEditorOperationEngineError(
      'invalid-content',
      error instanceof Error
        ? error.message
        : 'Operation content is not valid editor JSON.',
      operationIndex,
      operationId,
    );
  }
}

function stripNodeId(
  node: NeuralEditorNode,
  nodeIdAttribute: string,
): NeuralEditorNode {
  const attrs = node.attrs ? { ...node.attrs } : undefined;
  if (attrs) delete attrs[nodeIdAttribute];
  return {
    type: node.type,
    ...(attrs && Object.keys(attrs).length > 0 ? { attrs } : {}),
    ...(node.content
      ? {
          content: node.content.map((child) =>
            stripNodeId(child, nodeIdAttribute),
          ),
        }
      : {}),
    ...(node.marks
      ? {
          marks: node.marks.map((mark) => ({
            type: mark.type,
            ...(mark.attrs ? { attrs: { ...mark.attrs } } : {}),
          })),
        }
      : {}),
    ...(node.text !== undefined ? { text: node.text } : {}),
  };
}

function cloneNode(node: NeuralEditorNode): NeuralEditorNode {
  return {
    type: node.type,
    ...(node.attrs ? { attrs: { ...node.attrs } } : {}),
    ...(node.content ? { content: node.content.map(cloneNode) } : {}),
    ...(node.marks
      ? {
          marks: node.marks.map((mark) => ({
            type: mark.type,
            ...(mark.attrs ? { attrs: { ...mark.attrs } } : {}),
          })),
        }
      : {}),
    ...(node.text !== undefined ? { text: node.text } : {}),
  };
}

function cloneOperation(
  operation: NeuralEditorOperation,
): NeuralEditorOperation {
  switch (operation.type) {
    case 'insert':
      return {
        ...operation,
        target: { ...operation.target },
        content: operation.content.map(cloneNode),
      };
    case 'replace':
      return {
        ...operation,
        target: { ...operation.target },
        content: operation.content.map(cloneNode),
      };
    case 'delete':
      return { ...operation, target: { ...operation.target } };
    case 'update-node':
      return {
        ...operation,
        target: { ...operation.target },
        attrs: { ...operation.attrs },
      };
  }
}

function normalizeBatchId(value: string | undefined): string {
  const normalized = value?.trim();
  if (normalized) return normalized;
  return `operation-${globalThis.crypto?.randomUUID?.() ?? fallbackRandomId()}`;
}

function normalizeRevision(value: number): number {
  return Number.isInteger(value) && value >= 0 ? value : 0;
}

function fallbackRandomId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function classifyOperationError(
  error: unknown,
): NeuralEditorOperationErrorCode {
  const message = error instanceof Error ? error.message : '';
  return /content|schema|wrap|replace|insert|invalid/i.test(message)
    ? 'schema-violation'
    : 'operation-failed';
}

function toOperationError(error: unknown): NeuralEditorOperationError {
  if (error instanceof NeuralEditorOperationEngineError) {
    return {
      code: error.code,
      message: error.message,
      ...(error.operationIndex === undefined
        ? {}
        : { operationIndex: error.operationIndex }),
      ...(error.operationId ? { operationId: error.operationId } : {}),
    };
  }
  return {
    code: classifyOperationError(error),
    message:
      error instanceof Error ? error.message : 'Editor operation failed.',
  };
}

class NeuralEditorOperationEngineError extends Error {
  constructor(
    readonly code: NeuralEditorOperationErrorCode,
    message: string,
    readonly operationIndex?: number,
    readonly operationId?: string,
  ) {
    super(message);
    this.name = 'NeuralEditorOperationEngineError';
  }
}
