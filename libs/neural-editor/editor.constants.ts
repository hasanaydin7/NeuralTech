import type { NeuralEditorMessages } from '@neural-ng/core';
import type {
  NeuralEditorColorOption,
  NeuralEditorCommandPaletteItem,
  NeuralEditorDocument,
  NeuralEditorNodeIdContext,
  NeuralEditorSlashCommand,
  NeuralEditorToolbarItem,
} from './editor.types';

export const NEURAL_EDITOR_EMPTY_DOCUMENT: NeuralEditorDocument = Object.freeze(
  {
    type: 'doc',
    content: Object.freeze([
      Object.freeze({
        type: 'paragraph',
      }),
    ]),
  },
);

export const NEURAL_EDITOR_DEFAULT_NODE_ID_ATTRIBUTE = 'neuralId';

export const NEURAL_EDITOR_DEFAULT_IDENTIFIED_NODE_TYPES: readonly string[] =
  Object.freeze([
    'paragraph',
    'heading',
    'blockquote',
    'codeBlock',
    'bulletList',
    'orderedList',
    'listItem',
    'taskList',
    'taskItem',
    'table',
    'tableRow',
    'tableCell',
    'tableHeader',
    'image',
    'horizontalRule',
  ]);

export function createNeuralEditorNodeId(
  context: NeuralEditorNodeIdContext,
): string {
  const randomId = globalThis.crypto?.randomUUID?.() ?? fallbackRandomId();
  return `${normalizeNodeIdPrefix(context.nodeType)}-${randomId}`;
}

export const NEURAL_EDITOR_DEFAULT_TEXT_COLORS: readonly NeuralEditorColorOption[] =
  Object.freeze([
    { value: '#111827' },
    { value: '#dc2626' },
    { value: '#ea580c' },
    { value: '#ca8a04' },
    { value: '#16a34a' },
    { value: '#0891b2' },
    { value: '#2563eb' },
    { value: '#7c3aed' },
    { value: '#db2777' },
  ]);

export const NEURAL_EDITOR_DEFAULT_HIGHLIGHT_COLORS: readonly NeuralEditorColorOption[] =
  Object.freeze([
    { value: '#fef08a' },
    { value: '#fed7aa' },
    { value: '#fecaca' },
    { value: '#bbf7d0' },
    { value: '#a5f3fc' },
    { value: '#bfdbfe' },
    { value: '#ddd6fe' },
    { value: '#fbcfe8' },
  ]);

export const NEURAL_EDITOR_DEFAULT_TOOLBAR: readonly NeuralEditorToolbarItem[] =
  Object.freeze([
    { type: 'command', command: 'undo', text: '↶' },
    { type: 'command', command: 'redo', text: '↷' },
    { type: 'separator' },
    { type: 'command', command: 'paragraph', text: 'P' },
    { type: 'command', command: 'heading-1', text: 'H1' },
    { type: 'command', command: 'heading-2', text: 'H2' },
    { type: 'command', command: 'heading-3', text: 'H3' },
    { type: 'separator' },
    { type: 'command', command: 'bold', text: 'B' },
    { type: 'command', command: 'italic', text: 'I' },
    { type: 'command', command: 'underline', text: 'U' },
    { type: 'command', command: 'strike', text: 'S' },
    { type: 'command', command: 'code', text: '</>' },
    { type: 'color', kind: 'text', text: 'A' },
    { type: 'color', kind: 'highlight', text: '▰' },
    { type: 'separator' },
    { type: 'command', command: 'align-left', text: '≡' },
    { type: 'command', command: 'align-center', text: '≣' },
    { type: 'command', command: 'align-right', text: '≡' },
    { type: 'command', command: 'align-justify', text: '☰' },
    { type: 'separator' },
    { type: 'command', command: 'bullet-list', text: '•' },
    { type: 'command', command: 'ordered-list', text: '1.' },
    { type: 'command', command: 'task-list', text: '☑' },
    { type: 'command', command: 'blockquote', text: '❝' },
    { type: 'command', command: 'code-block', text: '{}' },
    { type: 'separator' },
    { type: 'command', command: 'link', text: '🔗' },
    { type: 'command', command: 'image', text: '▧' },
    { type: 'table', text: '▦' },
    { type: 'command', command: 'horizontal-rule', text: '—' },
    { type: 'command', command: 'clear-formatting', text: 'Tx' },
  ]);

export function createNeuralEditorDefaultSlashCommands(
  messages: NeuralEditorMessages,
): readonly NeuralEditorSlashCommand[] {
  return Object.freeze([
    command('paragraph', messages.paragraph, ['text', 'p'], ({ controller }) =>
      controller.setParagraph(),
    ),
    command('heading-1', messages.heading1, ['h1', 'title'], ({ controller }) =>
      controller.toggleHeading(1),
    ),
    command(
      'heading-2',
      messages.heading2,
      ['h2', 'subtitle'],
      ({ controller }) => controller.toggleHeading(2),
    ),
    command('heading-3', messages.heading3, ['h3'], ({ controller }) =>
      controller.toggleHeading(3),
    ),
    command(
      'bullet-list',
      messages.bulletList,
      ['bullet', 'unordered'],
      ({ controller }) => controller.toggleBulletList(),
    ),
    command(
      'ordered-list',
      messages.orderedList,
      ['numbered', 'ordered'],
      ({ controller }) => controller.toggleOrderedList(),
    ),
    command(
      'task-list',
      messages.taskList,
      ['todo', 'checklist'],
      ({ controller }) => controller.toggleTaskList(),
    ),
    command('blockquote', messages.blockquote, ['quote'], ({ controller }) =>
      controller.toggleBlockquote(),
    ),
    command(
      'code-block',
      messages.codeBlock,
      ['code', 'pre'],
      ({ controller }) => controller.toggleCodeBlock(),
    ),
    command(
      'insert-table',
      messages.insertTable,
      ['table', 'grid'],
      ({ controller }) => controller.insertTable(),
    ),
    command(
      'insert-image',
      messages.insertImage,
      ['image', 'photo', 'media'],
      ({ controller }) => controller.requestImageInsert(),
    ),
    command(
      'horizontal-rule',
      messages.horizontalRule,
      ['divider', 'separator'],
      ({ controller }) => controller.insertHorizontalRule(),
    ),
    command(
      'ask-ai',
      messages.aiAsk,
      ['ai', 'rewrite', 'generate'],
      ({ controller }) => controller.requestAi('custom'),
    ),
  ]);
}

export function createNeuralEditorDefaultCommandPaletteItems(
  messages: NeuralEditorMessages,
): readonly NeuralEditorCommandPaletteItem[] {
  return Object.freeze([
    paletteCommand(
      'undo',
      messages.undo,
      ['history'],
      'Ctrl+Z',
      ({ controller }) => controller.undo(),
    ),
    paletteCommand(
      'redo',
      messages.redo,
      ['history'],
      'Ctrl+Shift+Z',
      ({ controller }) => controller.redo(),
    ),
    paletteCommand(
      'bold',
      messages.bold,
      ['strong'],
      'Ctrl+B',
      ({ controller }) => controller.toggleBold(),
    ),
    paletteCommand(
      'italic',
      messages.italic,
      ['emphasis'],
      'Ctrl+I',
      ({ controller }) => controller.toggleItalic(),
    ),
    paletteCommand(
      'underline',
      messages.underline,
      [],
      'Ctrl+U',
      ({ controller }) => controller.toggleUnderline(),
    ),
    paletteCommand(
      'bullet-list',
      messages.bulletList,
      ['unordered'],
      undefined,
      ({ controller }) => controller.toggleBulletList(),
    ),
    paletteCommand(
      'ordered-list',
      messages.orderedList,
      ['numbered'],
      undefined,
      ({ controller }) => controller.toggleOrderedList(),
    ),
    paletteCommand(
      'task-list',
      messages.taskList,
      ['todo', 'checklist'],
      undefined,
      ({ controller }) => controller.toggleTaskList(),
    ),
    paletteCommand(
      'insert-table',
      messages.insertTable,
      ['grid'],
      undefined,
      ({ controller }) => controller.insertTable(),
    ),
    paletteCommand(
      'insert-image',
      messages.insertImage,
      ['photo', 'media'],
      undefined,
      ({ controller }) => controller.requestImageInsert(),
    ),
    paletteCommand(
      'horizontal-rule',
      messages.horizontalRule,
      ['divider'],
      undefined,
      ({ controller }) => controller.insertHorizontalRule(),
    ),
    paletteCommand(
      'clear-formatting',
      messages.clearFormatting,
      ['reset', 'remove'],
      undefined,
      ({ controller }) => controller.clearFormatting(),
    ),
    paletteCommand(
      'ai-rewrite',
      messages.aiRewrite,
      ['ai', 'rewrite', 'edit'],
      undefined,
      ({ controller }) => controller.requestAi('rewrite'),
    ),
    paletteCommand(
      'ai-ask',
      messages.aiAsk,
      ['ai', 'generate'],
      undefined,
      ({ controller }) => controller.requestAi('custom'),
    ),
  ]);
}

function command(
  id: string,
  label: string,
  keywords: readonly string[],
  execute: NeuralEditorSlashCommand['execute'],
): NeuralEditorSlashCommand {
  return { id, label, keywords, execute };
}

function paletteCommand(
  id: string,
  label: string,
  keywords: readonly string[],
  shortcut: string | undefined,
  execute: NeuralEditorCommandPaletteItem['execute'],
): NeuralEditorCommandPaletteItem {
  return { id, label, keywords, shortcut, execute };
}

function normalizeNodeIdPrefix(value: string): string {
  const normalized = value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLocaleLowerCase();
  return normalized || 'node';
}

function fallbackRandomId(): string {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 12);
  return `${time}-${random}`;
}
