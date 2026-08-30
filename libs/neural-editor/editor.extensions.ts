import { shift, size } from '@floating-ui/dom';
import { Extension, type AnyExtension, type Editor } from '@tiptap/core';
import BubbleMenu from '@tiptap/extension-bubble-menu';
import { Collaboration, isChangeOrigin } from '@tiptap/extension-collaboration';
import { CollaborationCaret } from '@tiptap/extension-collaboration-caret';
import FloatingMenu from '@tiptap/extension-floating-menu';
import { Highlight } from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import Mention from '@tiptap/extension-mention';
import { TableKit } from '@tiptap/extension-table';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyleKit } from '@tiptap/extension-text-style';
import { UniqueID } from '@tiptap/extension-unique-id';
import { CharacterCount, Placeholder } from '@tiptap/extensions';
import { PluginKey } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import Suggestion from '@tiptap/suggestion';
import { createNeuralEditorAiReviewExtension } from './editor.ai-review';
import { createNeuralEditorReviewExtensions } from './editor.review';
import type { NeuralEditorSuggestionViewProps } from './editor-suggestion-menus.component';
import type {
  NeuralEditorCollaborationConfig,
  NeuralEditorCollaborationUser,
  NeuralEditorExtension,
  NeuralEditorMentionItem,
  NeuralEditorMenuPlacement,
  NeuralEditorNodeIdGenerator,
  NeuralEditorSlashCommand,
  NeuralEditorSuggestionPlacement,
  NeuralEditorSuggestionRange,
} from './editor.types';

export const NEURAL_EDITOR_BUBBLE_MENU_PLUGIN_KEY = 'neuralEditorBubbleMenu';
export const NEURAL_EDITOR_FLOATING_MENU_PLUGIN_KEY =
  'neuralEditorFloatingMenu';
export const NEURAL_EDITOR_SLASH_SUGGESTION_PLUGIN_KEY = new PluginKey(
  'neuralEditorSlashSuggestion',
);
export const NEURAL_EDITOR_MENTION_SUGGESTION_PLUGIN_KEY = new PluginKey(
  'neuralEditorMentionSuggestion',
);

const NeuralBubbleMenu = BubbleMenu.extend({
  name: 'neuralEditorBubbleMenuExtension',
});
const NeuralFloatingMenu = FloatingMenu.extend({
  name: 'neuralEditorFloatingMenuExtension',
});

export interface NeuralEditorSuggestionRenderer<T> {
  readonly element: () => HTMLElement;
  readonly start: (props: NeuralEditorSuggestionViewProps<T>) => void;
  readonly update: (props: NeuralEditorSuggestionViewProps<T>) => void;
  readonly keyDown: (event: KeyboardEvent) => boolean;
  readonly exit: () => void;
}

export interface NeuralEditorExtensionOptions {
  readonly includeDefaultExtensions: boolean;
  readonly collaboration: NeuralEditorCollaborationConfig | null;
  readonly collaborationUser: () => NeuralEditorCollaborationUser | null;
  readonly commentsEnabled: () => boolean;
  readonly onCommentActivated: (threadId: string) => void;
  readonly trackedChangesEnabled: () => boolean;
  readonly placeholder: string;
  readonly maxCharacters?: number;
  readonly taskCheckedLabel: string;
  readonly taskUncheckedLabel: string;
  readonly allowBase64Images: boolean;
  readonly enableNodeIds: boolean;
  readonly nodeIdAttribute: string;
  readonly identifiedNodeTypes: readonly string[];
  readonly nodeIdGenerator: NeuralEditorNodeIdGenerator;
  readonly bubbleMenuElement?: HTMLElement;
  readonly floatingMenuElement?: HTMLElement;
  readonly showBubbleMenu: () => boolean;
  readonly showFloatingMenu: () => boolean;
  readonly showLinkPopover: () => boolean;
  readonly linkPopoverOpen: () => boolean;
  readonly blockingOverlayOpen: () => boolean;
  readonly contextMenuBlocked: () => boolean;
  readonly menuAppendTo: () => HTMLElement;
  readonly menuStrategy: 'absolute' | 'fixed';
  readonly bubbleMenuPlacement: NeuralEditorMenuPlacement;
  readonly floatingMenuPlacement: NeuralEditorMenuPlacement;
  readonly showSlashMenu: () => boolean;
  readonly showMentionMenu: () => boolean;
  readonly mentionAvailable: () => boolean;
  readonly mentionTrigger: string;
  readonly mentionMinimumQueryLength: number;
  readonly mentionDebounce: number;
  readonly slashDebounce: number;
  readonly slashMenuPlacement: NeuralEditorSuggestionPlacement;
  readonly mentionMenuPlacement: NeuralEditorSuggestionPlacement;
  readonly loadSlashItems: (
    query: string,
    range: NeuralEditorSuggestionRange,
    signal: AbortSignal,
  ) =>
    | readonly NeuralEditorSlashCommand[]
    | Promise<readonly NeuralEditorSlashCommand[]>;
  readonly loadMentionItems: (
    query: string,
    range: NeuralEditorSuggestionRange,
    signal: AbortSignal,
  ) =>
    | readonly NeuralEditorMentionItem[]
    | Promise<readonly NeuralEditorMentionItem[]>;
  readonly executeSlashCommand: (
    command: NeuralEditorSlashCommand,
    query: string,
    range: NeuralEditorSuggestionRange,
  ) => void;
  readonly slashRenderer: NeuralEditorSuggestionRenderer<NeuralEditorSlashCommand>;
  readonly mentionRenderer: NeuralEditorSuggestionRenderer<NeuralEditorMentionItem>;
  readonly extensions: readonly NeuralEditorExtension[];
}

export function createNeuralEditorExtensions(
  options: NeuralEditorExtensionOptions,
): AnyExtension[] {
  const defaults: AnyExtension[] = options.includeDefaultExtensions
    ? [
        StarterKit.configure({
          ...(options.collaboration ? { undoRedo: false as const } : {}),
          heading: {
            levels: [1, 2, 3],
          },
          link: {
            openOnClick: false,
            defaultProtocol: 'https',
            autolink: true,
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
        Highlight.configure({
          multicolor: true,
        }),
        TaskList,
        TaskItem.configure({
          nested: true,
          a11y: {
            checkboxLabel: (_node, checked) =>
              checked ? options.taskCheckedLabel : options.taskUncheckedLabel,
          },
        }),
        TableKit.configure({
          table: {
            resizable: false,
            renderWrapper: true,
          },
        }),
        Image.configure({
          allowBase64: options.allowBase64Images,
          HTMLAttributes: {
            'data-neural-editor-image': '',
          },
        }),
        Placeholder.configure({
          placeholder: options.placeholder,
          emptyEditorClass: 'is-editor-empty',
          emptyNodeClass: 'is-empty',
        }),
        CharacterCount.configure({
          limit: options.maxCharacters ?? null,
          autoTrim: false,
        }),
      ]
    : [];

  const collaborationUser = options.collaborationUser();
  const collaborationExtensions: AnyExtension[] = options.collaboration
    ? [
        Collaboration.configure(
          options.collaboration.fragment
            ? { fragment: options.collaboration.fragment }
            : {
                document: options.collaboration.document,
                field: options.collaboration.field ?? 'default',
              },
        ),
        ...(options.collaboration.provider?.awareness && collaborationUser
          ? [
              CollaborationCaret.configure({
                provider: options.collaboration.provider,
                user: collaborationUser,
                render: (user) => createCollaborationCaret(user),
                selectionRender: (user) => ({
                  nodeName: 'span',
                  class: 'neural-editor-collaboration-selection',
                  style: `--neural-editor-collaboration-user-color: ${normalizeCollaborationColor(user['color'])}`,
                  'data-user': String(user['name'] ?? ''),
                }),
              }),
            ]
          : []),
      ]
    : [];

  const identityExtensions: AnyExtension[] = options.enableNodeIds
    ? [
        UniqueID.configure({
          attributeName: normalizeNodeIdAttribute(options.nodeIdAttribute),
          types: [...options.identifiedNodeTypes],
          generateID: ({ node, pos }) =>
            normalizeGeneratedNodeId(
              options.nodeIdGenerator({
                nodeType: node.type.name,
                position: typeof pos === 'number' ? pos : null,
              }),
              node.type.name,
              pos,
            ),
          updateDocument: true,
          ...(options.collaboration
            ? {
                filterTransaction: (transaction) =>
                  !isChangeOrigin(transaction),
              }
            : {}),
        }),
      ]
    : [];

  const suggestionExtensions: AnyExtension[] = [
    ...createNeuralEditorReviewExtensions({
      commentsEnabled: options.commentsEnabled,
      onCommentActivated: options.onCommentActivated,
      trackedChangesEnabled: options.trackedChangesEnabled,
      currentUser: options.collaborationUser,
    }),
    createNeuralEditorAiReviewExtension(),
    createSlashCommandExtension(options),
    Mention.configure({
      HTMLAttributes: {
        class: 'neural-editor-mention',
        'data-neural-editor-mention': '',
      },
      deleteTriggerWithBackspace: true,
      renderText: ({ options: mentionOptions, node }) =>
        `${mentionOptions.suggestion.char}${node.attrs['label'] ?? node.attrs['id']}`,
      renderHTML: ({ options: mentionOptions, node }) => [
        'span',
        {
          ...mentionOptions.HTMLAttributes,
          'data-id': String(node.attrs['id'] ?? ''),
          'data-label': String(node.attrs['label'] ?? ''),
        },
        `${mentionOptions.suggestion.char}${node.attrs['label'] ?? node.attrs['id']}`,
      ],
      suggestion: {
        pluginKey: NEURAL_EDITOR_MENTION_SUGGESTION_PLUGIN_KEY,
        char: normalizeTrigger(options.mentionTrigger, '@'),
        minQueryLength: Math.max(0, options.mentionMinimumQueryLength),
        debounce: Math.max(0, options.mentionDebounce),
        placement: options.mentionMenuPlacement,
        offset: { mainAxis: 8, crossAxis: 0 },
        container: options.menuAppendTo(),
        floatingUi: suggestionFloatingUi(options.menuStrategy),
        allow: ({ editor }) =>
          editor.isEditable &&
          options.showMentionMenu() &&
          options.mentionAvailable() &&
          !options.blockingOverlayOpen(),
        items: async ({ editor, query, signal }) => [
          ...(await options.loadMentionItems(
            query,
            approximateSuggestionRange(editor, query, options.mentionTrigger),
            signal,
          )),
        ],
        render: () => suggestionRender(options.mentionRenderer),
      },
    }),
  ];

  const menus: AnyExtension[] = [];

  if (options.bubbleMenuElement) {
    menus.push(
      NeuralBubbleMenu.configure({
        element: options.bubbleMenuElement,
        pluginKey: NEURAL_EDITOR_BUBBLE_MENU_PLUGIN_KEY,
        appendTo: options.menuAppendTo,
        updateDelay: 0,
        options: {
          strategy: options.menuStrategy,
          placement: options.bubbleMenuPlacement,
          offset: 8,
          flip: true,
          shift: { padding: 8 },
          inline: true,
          hide: true,
        },
        shouldShow: ({ editor, state }) => {
          if (!editor.isEditable || options.contextMenuBlocked()) return false;
          if (options.linkPopoverOpen()) return options.showLinkPopover();
          const menuFocused = options.bubbleMenuElement?.contains(
            options.bubbleMenuElement.ownerDocument.activeElement,
          );
          if (
            !options.showBubbleMenu() ||
            (!editor.isFocused && !menuFocused)
          ) {
            return false;
          }
          return editor.isActive('image') || !state.selection.empty;
        },
      }),
    );
  }

  if (options.floatingMenuElement) {
    menus.push(
      NeuralFloatingMenu.configure({
        element: options.floatingMenuElement,
        pluginKey: NEURAL_EDITOR_FLOATING_MENU_PLUGIN_KEY,
        appendTo: options.menuAppendTo,
        updateDelay: 0,
        options: {
          strategy: options.menuStrategy,
          placement: options.floatingMenuPlacement,
          offset: 8,
          flip: true,
          shift: { padding: 8 },
          hide: true,
        },
        shouldShow: ({ editor, state }) => {
          const menuFocused = options.floatingMenuElement?.contains(
            options.floatingMenuElement.ownerDocument.activeElement,
          );
          if (
            !editor.isEditable ||
            (!editor.isFocused && !menuFocused) ||
            options.linkPopoverOpen() ||
            options.contextMenuBlocked() ||
            !state.selection.empty
          ) {
            return false;
          }

          const { $from } = state.selection;
          return (
            $from.parent.type.name === 'paragraph' &&
            $from.parent.content.size === 0
          );
        },
      }),
    );
  }

  return dedupeTopLevelExtensions([
    ...defaults,
    ...collaborationExtensions,
    ...identityExtensions,
    ...suggestionExtensions,
    ...options.extensions,
    ...menus,
  ]);
}

function createSlashCommandExtension(
  options: NeuralEditorExtensionOptions,
): AnyExtension {
  return Extension.create({
    name: 'neuralEditorSlashCommand',
    addProseMirrorPlugins() {
      return [
        Suggestion<ResolvedSlashCommand>({
          editor: this.editor,
          pluginKey: NEURAL_EDITOR_SLASH_SUGGESTION_PLUGIN_KEY,
          char: '/',
          allowedPrefixes: [' ', '\n'],
          startOfLine: false,
          debounce: Math.max(0, options.slashDebounce),
          placement: options.slashMenuPlacement,
          offset: { mainAxis: 8, crossAxis: 0 },
          container: options.menuAppendTo(),
          floatingUi: suggestionFloatingUi(options.menuStrategy),
          allow: ({ editor, state, range }) => {
            if (
              !editor.isEditable ||
              !options.showSlashMenu() ||
              options.blockingOverlayOpen()
            ) {
              return false;
            }
            const $from = state.doc.resolve(range.from);
            return $from.parent.type.name === 'paragraph';
          },
          items: async ({ editor, query, signal }) => {
            const range = approximateSuggestionRange(editor, query, '/');
            const items = await options.loadSlashItems(query, range, signal);
            return items.map((item) => ({ ...item, __neuralQuery: query }));
          },
          command: ({ editor, range, props }) => {
            const query = props.__neuralQuery ?? '';
            editor.chain().focus().deleteRange(range).run();
            options.executeSlashCommand(props, query, range);
          },
          render: () => suggestionRender(options.slashRenderer),
        }),
      ];
    },
  });
}

function suggestionRender<T>(renderer: NeuralEditorSuggestionRenderer<T>) {
  let unmount: (() => void) | null = null;
  return {
    onStart: (props: SuggestionRenderProps<T>) => {
      const viewProps = toSuggestionViewProps(props);
      renderer.start(viewProps);
      unmount = props.mount(renderer.element());
    },
    onUpdate: (props: SuggestionRenderProps<T>) => {
      renderer.update(toSuggestionViewProps(props));
    },
    onKeyDown: ({ event }: { event: KeyboardEvent }) => renderer.keyDown(event),
    onExit: () => {
      unmount?.();
      unmount = null;
      renderer.exit();
    },
  };
}

function toSuggestionViewProps<T>(
  props: SuggestionRenderProps<T>,
): NeuralEditorSuggestionViewProps<T> {
  return {
    query: props.query,
    items: props.items,
    range: props.range,
    loading: props.loading,
    command: props.command,
  };
}

function suggestionFloatingUi(strategy: 'absolute' | 'fixed') {
  return {
    strategy,
    middleware: [
      shift({ padding: 8 }),
      size({
        padding: 8,
        apply({ availableWidth, availableHeight, elements }) {
          Object.assign(elements.floating.style, {
            maxWidth: `${Math.max(0, availableWidth)}px`,
            maxHeight: `${Math.max(0, availableHeight)}px`,
          });
        },
      }),
    ],
  };
}

function approximateSuggestionRange(
  editor: Editor,
  query: string,
  trigger: string,
): NeuralEditorSuggestionRange {
  const to = editor.state.selection.from;
  return {
    from: Math.max(
      0,
      to - query.length - normalizeTrigger(trigger, '@').length,
    ),
    to,
  };
}

function normalizeTrigger(value: string, fallback: string): string {
  const normalized = value.trim();
  return Array.from(normalized || fallback)[0] ?? fallback;
}

function dedupeTopLevelExtensions(
  extensions: readonly AnyExtension[],
): AnyExtension[] {
  const byName = new Map<string, AnyExtension>();
  for (const extension of extensions) byName.set(extension.name, extension);
  return [...byName.values()];
}

interface ResolvedSlashCommand extends NeuralEditorSlashCommand {
  readonly __neuralQuery?: string;
}

interface SuggestionRenderProps<T> {
  readonly query: string;
  readonly items: readonly T[];
  readonly range: NeuralEditorSuggestionRange;
  readonly loading: boolean;
  readonly command: (item: T) => void;
  readonly mount: (element: HTMLElement) => () => void;
}

function normalizeNodeIdAttribute(value: string): string {
  const normalized = value.trim().replace(/[^a-zA-Z0-9_-]/g, '');
  return normalized || 'neuralId';
}

function normalizeGeneratedNodeId(
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

function createCollaborationCaret(user: Record<string, unknown>): HTMLElement {
  const color = normalizeCollaborationColor(user['color']);
  const caret = document.createElement('span');
  caret.className = 'neural-editor-collaboration-caret';
  caret.style.setProperty('--neural-editor-collaboration-user-color', color);
  const label = document.createElement('span');
  label.className = 'neural-editor-collaboration-caret-label';
  label.textContent = String(user['name'] ?? '');
  caret.append(label);
  return caret;
}

function normalizeCollaborationColor(value: unknown): string {
  const candidate = typeof value === 'string' ? value : '';
  return /^#[0-9a-f]{6}$/i.test(candidate) ? candidate : '#2563eb';
}
