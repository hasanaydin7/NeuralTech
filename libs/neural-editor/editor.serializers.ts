import type { AnyExtension, JSONContent } from '@tiptap/core';
import { Highlight } from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import Mention from '@tiptap/extension-mention';
import { TableKit } from '@tiptap/extension-table';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyleKit } from '@tiptap/extension-text-style';
import { generateUniqueIds, UniqueID } from '@tiptap/extension-unique-id';
import { generateHTML, generateJSON } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import { createNeuralEditorReviewSchemaExtensions } from './editor.review';
import {
  createNeuralEditorNodeId,
  NEURAL_EDITOR_DEFAULT_IDENTIFIED_NODE_TYPES,
  NEURAL_EDITOR_DEFAULT_NODE_ID_ATTRIBUTE,
} from './editor.constants';
import type {
  NeuralEditorDocument,
  NeuralEditorExtension,
  NeuralEditorHtmlSerializerOptions,
  NeuralEditorNode,
  NeuralEditorNodeIdOptions,
} from './editor.types';
import {
  fromTiptapJson,
  normalizeNeuralEditorDocument,
  toTiptapJson,
} from './editor.utils';

const DEFAULT_SERIALIZER_EXTENSIONS: readonly AnyExtension[] = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    link: {
      openOnClick: false,
      defaultProtocol: 'https',
    },
  }),
  TextAlign.configure({
    types: ['heading', 'paragraph'],
    alignments: ['left', 'center', 'right', 'justify'],
  }),
  TextStyleKit.configure({
    backgroundColor: false,
    fontFamily: false,
    fontSize: false,
    lineHeight: false,
  }),
  Highlight.configure({ multicolor: true }),
  TaskList,
  TaskItem.configure({ nested: true }),
  TableKit.configure({
    table: {
      resizable: false,
      renderWrapper: true,
    },
  }),
  Image.configure({ allowBase64: false }),
  ...createNeuralEditorReviewSchemaExtensions(),
  Mention.configure({
    HTMLAttributes: {
      class: 'neural-editor-mention',
      'data-neural-editor-mention': '',
    },
  }),
];

export function editorDocumentToHtml(
  document: NeuralEditorDocument,
  optionsOrExtensions:
    | NeuralEditorHtmlSerializerOptions
    | readonly NeuralEditorExtension[] = {},
): string {
  const options = normalizeSerializerOptions(optionsOrExtensions);
  return generateHTML(toTiptapJson(document), serializerExtensions(options));
}

export function editorDocumentFromHtml(
  html: string,
  optionsOrExtensions:
    | NeuralEditorHtmlSerializerOptions
    | readonly NeuralEditorExtension[] = {},
): NeuralEditorDocument {
  const options = normalizeSerializerOptions(optionsOrExtensions);
  const value = generateJSON(
    html,
    serializerExtensions(options),
  ) as JSONContent;
  return fromTiptapJson(value);
}

export function editorDocumentWithNodeIds(
  document: NeuralEditorDocument,
  options: NeuralEditorNodeIdOptions = {},
  extensions: readonly NeuralEditorExtension[] = DEFAULT_SERIALIZER_EXTENSIONS,
): NeuralEditorDocument {
  const uniqueId = createUniqueIdExtension(options, true);
  const value = generateUniqueIds(
    toTiptapJson(document),
    dedupeExtensions([...extensions, uniqueId]),
  );
  return fromTiptapJson(value);
}

export function editorDocumentToText(
  document: NeuralEditorDocument,
  blockSeparator = '\n',
): string {
  return collectText(normalizeNeuralEditorDocument(document), blockSeparator)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function serializerExtensions(
  options: NeuralEditorHtmlSerializerOptions,
): AnyExtension[] {
  const extensions = [
    ...(options.extensions ?? DEFAULT_SERIALIZER_EXTENSIONS),
  ] as AnyExtension[];
  if (options.includeNodeIds) {
    extensions.push(createUniqueIdExtension(options.nodeIds ?? {}, false));
  }
  return dedupeExtensions(extensions);
}

function dedupeExtensions(extensions: readonly AnyExtension[]): AnyExtension[] {
  const byName = new Map<string, AnyExtension>();
  for (const extension of extensions) byName.set(extension.name, extension);
  return [...byName.values()];
}

function createUniqueIdExtension(
  options: NeuralEditorNodeIdOptions,
  updateDocument: boolean,
): AnyExtension {
  const attributeName = normalizeNodeIdAttribute(options.attributeName);
  const types = options.types ?? NEURAL_EDITOR_DEFAULT_IDENTIFIED_NODE_TYPES;
  const generateId = options.generateId ?? createNeuralEditorNodeId;
  return UniqueID.configure({
    attributeName,
    types: types === 'all' ? 'all' : [...types],
    generateID: ({
      node,
      pos,
    }: {
      node: { type: { name: string } };
      pos?: number | null;
    }) =>
      normalizeGeneratedId(
        generateId({
          nodeType: node.type.name,
          position: typeof pos === 'number' ? pos : null,
        }),
        node.type.name,
        pos,
      ),
    updateDocument,
  });
}

function normalizeSerializerOptions(
  value: NeuralEditorHtmlSerializerOptions | readonly NeuralEditorExtension[],
): NeuralEditorHtmlSerializerOptions {
  return isExtensionArray(value) ? { extensions: value } : value;
}

function isExtensionArray(
  value: NeuralEditorHtmlSerializerOptions | readonly NeuralEditorExtension[],
): value is readonly NeuralEditorExtension[] {
  return Array.isArray(value);
}

function normalizeNodeIdAttribute(value: string | undefined): string {
  const normalized = (value ?? NEURAL_EDITOR_DEFAULT_NODE_ID_ATTRIBUTE)
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '');
  return normalized || NEURAL_EDITOR_DEFAULT_NODE_ID_ATTRIBUTE;
}

function normalizeGeneratedId(
  value: string,
  nodeType: string,
  position: number | null | undefined,
): string {
  const normalized = value.trim();
  if (normalized) return normalized;
  const suffix =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.max(0, position ?? 0).toString(36)}`;
  return `${nodeType}-${suffix}`;
}

function collectText(node: NeuralEditorNode, blockSeparator: string): string {
  if (node.type === 'text') return node.text ?? '';
  if (node.type === 'hardBreak') return '\n';
  if (node.type === 'horizontalRule') return blockSeparator;
  if (node.type === 'mention') {
    const label = node.attrs?.['label'] ?? node.attrs?.['id'];
    return typeof label === 'string' && label ? `@${label}` : '';
  }
  if (node.type === 'image') {
    const alt = node.attrs?.['alt'];
    const title = node.attrs?.['title'];
    const label =
      typeof alt === 'string' && alt
        ? alt
        : typeof title === 'string' && title
          ? title
          : '';
    return label ? `${label}${blockSeparator}` : '';
  }

  if (node.type === 'tableRow') {
    return `${(node.content ?? [])
      .map((child) => collectText(child, blockSeparator).trim())
      .join('\t')}${blockSeparator}`;
  }

  if (node.type === 'tableCell' || node.type === 'tableHeader') {
    return (node.content ?? [])
      .map((child) => collectText(child, blockSeparator))
      .join('')
      .trim();
  }

  const text = (node.content ?? [])
    .map((child) => collectText(child, blockSeparator))
    .join('');

  return isBlockNode(node.type) && text ? `${text}${blockSeparator}` : text;
}

function isBlockNode(type: string): boolean {
  return new Set([
    'paragraph',
    'heading',
    'blockquote',
    'codeBlock',
    'listItem',
    'taskItem',
  ]).has(type);
}
