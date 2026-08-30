import type { JSONContent } from '@tiptap/core';
import type {
  NeuralEditorDocument,
  NeuralEditorNode,
  NeuralEditorNodeIdGenerator,
} from './editor.types';

export function createNeuralEditorEmptyDocument(): NeuralEditorDocument {
  return {
    type: 'doc',
    content: [{ type: 'paragraph' }],
  };
}

export function isNeuralEditorDocument(
  value: unknown,
): value is NeuralEditorDocument {
  return isRecord(value) && value['type'] === 'doc';
}

export function normalizeNeuralEditorDocument(
  value: unknown,
): NeuralEditorDocument {
  if (!isNeuralEditorDocument(value)) {
    return createNeuralEditorEmptyDocument();
  }

  return cloneNeuralEditorDocument(value);
}

export function cloneNeuralEditorDocument(
  value: NeuralEditorDocument,
): NeuralEditorDocument {
  return cloneNode(value) as NeuralEditorDocument;
}

export function neuralEditorDocumentsEqual(
  first: NeuralEditorDocument,
  second: NeuralEditorDocument,
): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}

export function toTiptapJson(document: NeuralEditorDocument): JSONContent {
  return cloneNeuralEditorDocument(document) as JSONContent;
}

export function fromTiptapJson(content: JSONContent): NeuralEditorDocument {
  return normalizeNeuralEditorDocument(content);
}

export function addMissingNeuralEditorNodeIds(
  document: NeuralEditorDocument,
  attributeName: string,
  types: readonly string[],
  generateId: NeuralEditorNodeIdGenerator,
): NeuralEditorDocument {
  const identifiedTypes = new Set(types);

  const visit = (
    node: NeuralEditorNode,
    position: number,
  ): { readonly node: NeuralEditorNode; readonly size: number } => {
    let attrs = node.attrs ? { ...node.attrs } : undefined;
    const currentId = attrs?.[attributeName];
    if (
      identifiedTypes.has(node.type) &&
      (typeof currentId !== 'string' || !currentId.trim())
    ) {
      attrs ??= {};
      attrs[attributeName] = generateId({
        nodeType: node.type,
        position,
      });
    }

    if (node.text !== undefined) {
      return {
        node: { ...cloneNode(node), ...(attrs ? { attrs } : {}) },
        size: node.text.length,
      };
    }

    const content: NeuralEditorNode[] = [];
    let contentSize = 0;
    const contentStart = node.type === 'doc' ? position : position + 1;
    for (const child of node.content ?? []) {
      const result = visit(child, contentStart + contentSize);
      content.push(result.node);
      contentSize += result.size;
    }

    return {
      node: {
        ...cloneNode(node),
        ...(attrs ? { attrs } : {}),
        ...(node.content ? { content } : {}),
      },
      size: node.type === 'doc' ? contentSize : contentSize + 2,
    };
  };

  return visit(document, 0).node as NeuralEditorDocument;
}

function cloneNode(node: NeuralEditorNode): NeuralEditorNode {
  const clone: {
    type: string;
    attrs?: Record<string, unknown>;
    content?: NeuralEditorNode[];
    marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
    text?: string;
  } = {
    type: node.type,
  };

  if (node.attrs) clone.attrs = { ...node.attrs };
  if (node.content) clone.content = node.content.map(cloneNode);
  if (node.marks) {
    clone.marks = node.marks.map((mark) => ({
      type: mark.type,
      ...(mark.attrs ? { attrs: { ...mark.attrs } } : {}),
    }));
  }
  if (node.text !== undefined) clone.text = node.text;

  return clone;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
