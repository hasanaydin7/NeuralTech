import { SiteOnThisPage } from '../../../shared/on-this-page';
import { ViewportScroller } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { NeuralButton } from '@neural-ng/core/button';
import { NeuralField, NeuralFieldHint } from '@neural-ng/core/field';
import {
  NeuralTab,
  NeuralTabList,
  NeuralTabPanel,
  NeuralTabPanels,
  NeuralTabs,
  type NeuralTabsClasses,
  type NeuralTabValue,
} from '@neural-ng/core/tabs';
import {
  NeuralEditor,
  NeuralEditorToolbarTemplate,
  createNeuralEditorEmptyDocument,
  editorDocumentToHtml,
  editorDocumentToText,
  type NeuralEditorClasses,
  type NeuralEditorController,
  type NeuralEditorDocument,
  type NeuralEditorUpdateEvent,
} from '@neural-ng/editor';
import { SiteAppearanceService } from '../../../core/site-appearance.service';
import { CodeView } from '../../../shared/code-view';
import { DesignTokenList } from '../../../shared/design-token-list';

type EditorDocView = 'component' | 'accessibility' | 'api' | 'tokens';
const INITIAL_DOCUMENT: NeuralEditorDocument = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 2, textAlign: 'center' },
      content: [{ type: 'text', text: 'Interfaces for the agentic era' }],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'The canonical value is structured JSON, while HTML and plain text remain derived outputs.',
        },
      ],
    },
  ],
};
const cloneDocument = (): NeuralEditorDocument =>
  structuredClone(INITIAL_DOCUMENT);

@Component({
  selector: 'app-editor-page',
  imports: [
    SiteOnThisPage,
    DesignTokenList,
    CodeView,
    FormField,
    FormsModule,
    NeuralButton,
    NeuralEditor,
    NeuralEditorToolbarTemplate,
    NeuralField,
    NeuralFieldHint,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
    ReactiveFormsModule,
  ],
  templateUrl: './editor.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);
  readonly article = signal({ body: cloneDocument() });
  readonly articleForm = form(this.article);
  readonly advancedDocument = signal(cloneDocument());
  readonly customDocument = signal(cloneDocument());
  readonly headlessDocument = signal(cloneDocument());
  readonly reactiveDocument = new FormControl<NeuralEditorDocument>(
    cloneDocument(),
    { nonNullable: true },
  );
  templateDocument = cloneDocument();
  readonly advancedController = signal<NeuralEditorController | null>(null);
  readonly updateStatus = signal('Editor is ready for structured input.');
  readonly htmlPreview = signal('');
  readonly selectedView = signal<EditorDocView>(resolveView(this.router.url));
  readonly selectedViewIndex = computed(() =>
    ['component', 'accessibility', 'api', 'tokens'].indexOf(
      this.selectedView(),
    ),
  );
  readonly docTabClasses: NeuralTabsClasses = {
    root: 'min-w-0',
    list: 'relative isolate gap-1 overflow-x-auto rounded-[1.35rem] border border-white/20 bg-[color-mix(in_srgb,var(--site-surface)_76%,transparent)] p-1.5 shadow-[inset_0_1px_rgba(255,255,255,.28),0_12px_35px_rgba(15,23,42,.10)] backdrop-blur-[30px] backdrop-saturate-150',
    tab: 'relative z-10 !flex-1 gap-2 rounded-[1rem] px-3 py-2.5 text-xs font-bold text-[var(--site-text-muted)] transition-[color,transform] duration-300 hover:text-[var(--site-text)] active:scale-[.97] sm:px-4 sm:text-sm',
    activeTab: 'text-[var(--site-text)]',
    panels: 'min-w-0',
    panel:
      'min-w-0 !p-0 animate-[neural-doc-panel-soft-in_200ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none',
  };
  readonly pageLinks: Record<
    EditorDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Install and import', 'import'],
      ['Structured value', 'structured'],
      ['Rich text', 'rich-text'],
      ['Angular Forms', 'forms'],
      ['Custom toolbar', 'toolbar'],
      ['AI and operations', 'ai'],
      ['Collaboration', 'collaboration'],
      ['Persistence', 'persistence'],
      ['States', 'states'],
      ['Unstyled', 'unstyled'],
    ],
    accessibility: [
      ['Editable semantics', 'semantics'],
      ['Keyboard', 'keyboard'],
      ['Menus and focus', 'focus'],
      ['Security', 'security'],
    ],
    api: [
      ['Models and inputs', 'inputs'],
      ['Events', 'events'],
      ['Controller', 'controller'],
      ['Templates', 'templates'],
      ['Class slots', 'class-slots'],
      ['Ownership', 'ownership'],
    ],
    tokens: [['Component tokens', 'design-tokens']],
  };
  readonly headlessClasses: NeuralEditorClasses = {
    root: 'overflow-hidden rounded-2xl border-2 border-violet-400/35 bg-slate-950 text-slate-100',
    toolbar:
      'flex flex-wrap gap-1 border-b border-violet-400/20 bg-violet-950/30 p-2',
    toolbarButton:
      'rounded-lg px-2.5 py-2 text-xs font-bold hover:bg-violet-400/15',
    toolbarButtonIcon: 'text-violet-300',
    toolbarSeparator: 'mx-1 w-px bg-violet-400/20',
    surface: 'bg-slate-950',
    content: 'min-h-52 px-5 py-4 outline-none',
    footer:
      'flex gap-3 border-t border-violet-400/20 px-4 py-2 text-xs text-violet-300',
  };
  readonly importCode = `npm install @neural-ng/editor\n\nimport { NeuralEditor, type NeuralEditorDocument } from '@neural-ng/editor';\n\n@Component({ imports: [NeuralEditor] })`;
  readonly basicCode = `<neural-editor [formField]="articleForm.body" ariaLabel="Article body" placeholder="Write the article..." showCharacterCount showWordCount [maxCharacters]="5000" fluid />`;
  readonly richCode = `<neural-editor [(value)]="document" fluid (editorReady)="controller = $event" />\n\ncontroller.toggleBold();\ncontroller.setTextAlign('center');\ncontroller.setTextColor('#2563eb');\ncontroller.toggleTaskList();\ncontroller.insertTable();`;
  readonly formsCode = `<neural-editor [formField]="articleForm.body" />\n<neural-editor [formControl]="reactiveDocument" />\n<neural-editor name="article" [(ngModel)]="templateDocument" />`;
  readonly toolbarCode = `<neural-editor [(value)]="document">\n  <ng-template neuralEditorToolbar let-editor>\n    <button (click)="editor.toggleBold()">Bold</button>\n    <button (click)="editor.toggleTaskList()">Tasks</button>\n  </ng-template>\n</neural-editor>`;
  readonly aiCode = `const request = controller.requestAi('rewrite', { instruction: 'Make this concise.' });\n// Application calls its provider, then supplies structured operations.\ncontroller.previewAiProposal(proposal);\ncontroller.acceptAiProposal(); // explicit user approval`;
  readonly collaborationCode = `<neural-editor [collaboration]="{ document: yDoc }" [collaborationUser]="currentUser" enableComments trackedChangesMode="suggesting" enableSnapshots />`;
  readonly persistenceCode = `const stored = { schemaVersion: 1, document: document() };\nconst html = editorDocumentToHtml(stored.document);\nconst text = editorDocumentToText(stored.document);\n// Sanitize derived HTML again at the final rendering boundary.`;
  readonly statesCode = `<neural-editor disabled />\n<neural-editor readonly />\n<neural-editor required invalid />\n<neural-editor pending />\n<neural-editor [showToolbar]="false" />`;
  readonly unstyledCode = `<neural-editor unstyled fluid [classes]="editorClasses" [(value)]="document" showCharacterCount showWordCount />`;
  readonly inputGroups = [
    [
      'Models',
      'value: NeuralEditorDocument; snapshots: readonly NeuralEditorSnapshot[]',
      'Canonical structured value and portable application-owned checkpoints.',
    ],
    [
      'Forms state',
      'disabled, readonly, required, invalid, pending, touched, dirty, name, maxCharacters',
      'Angular Forms state and the component-enforced character limit.',
    ],
    [
      'Presentation',
      'placeholder, autofocus, spellcheck, showToolbar, character/word counts, fluid',
      'Editing behavior, counters and responsive presentation.',
    ],
    [
      'Menus',
      'Bubble, Floating, Link, Slash, Mention, Command Palette and AI Review visibility, placement and providers',
      'Overlay visibility, logical placement, debounce and suggestion sources.',
    ],
    [
      'Schema',
      'includeDefaultExtensions, extensions, node IDs, identified node types and ID generator',
      'Initialization-time schema and deterministic node identity.',
    ],
    [
      'Collaboration',
      'collaboration, collaborationUser, comments, tracked changes, snapshots and panel visibility',
      'Application-owned Yjs transport, presence and review capabilities.',
    ],
    [
      'Identity',
      'editorId, ariaLabel, ariaLabelledBy, ariaDescription',
      'Stable DOM identity and accessible naming or description.',
    ],
    [
      'Styling',
      'unstyled, editorClass, contentClass and NeuralEditorClasses',
      'Global or local headless mode and typed consumer class ownership.',
    ],
  ] as const;
  readonly eventGroups = [
    [
      'Editing',
      'editorReady, editorUpdate, selectionChange, editorFocus, editorBlur, editorPaste, editorDrop, touch, contentError',
      'Controller lifecycle, model updates, selection, focus and native editing events.',
    ],
    [
      'Assets and menus',
      'imageInsertRequest, commandExecuted, mentionSelected',
      'Application-owned asset requests and semantic menu selections.',
    ],
    [
      'Operations',
      'operationsApplied, operationsRejected, operationConflict',
      'Atomic revision-aware structured operation results.',
    ],
    [
      'AI review',
      'aiRequest, aiRequestCancelled, aiProposalPreviewed, aiProposalAccepted, aiProposalRejected, aiOperationConflict',
      'Provider-neutral request and explicit proposal review lifecycle.',
    ],
    [
      'Collaboration',
      'collaborationStatusChange, presenceChange, comment events, tracked-change events and snapshot events',
      'Realtime status, review state and portable checkpoint lifecycle.',
    ],
  ] as const;
  readonly controllerGroups = [
    [
      'Editing',
      'focus, blur, clear, reset, undo, redo, paragraphs, headings, marks, lists, quotes and code',
      'Focus, history and rich-text editing commands.',
    ],
    [
      'Structured content',
      'alignment, colors, highlight, table commands, links and image requests',
      'Structured formatting and embedded-content commands.',
    ],
    [
      'Overlays',
      'open/close link popover and command palette',
      'Supported imperative overlay controls without raw Tiptap access.',
    ],
    [
      'Operations and AI',
      'node lookup, revision, validate/apply batches, request/cancel AI and preview/review proposals',
      'Deterministic node operations and non-destructive AI review.',
    ],
    [
      'Collaboration review',
      'presence, comments, tracked changes and snapshots',
      'Collaboration presence, review threads and snapshot commands.',
    ],
  ] as const;
  readonly templates = [
    [
      'NeuralEditorToolbarTemplate',
      'neuralEditorToolbar',
      'NeuralEditorToolbarTemplateContext',
    ],
    [
      'NeuralEditorBubbleMenuTemplate',
      'neuralEditorBubbleMenu',
      'NeuralEditorMenuTemplateContext',
    ],
    [
      'NeuralEditorFloatingMenuTemplate',
      'neuralEditorFloatingMenu',
      'NeuralEditorMenuTemplateContext',
    ],
    [
      'NeuralEditorLinkPopoverTemplate',
      'neuralEditorLinkPopover',
      'NeuralEditorLinkPopoverTemplateContext',
    ],
    [
      'NeuralEditorSlashMenuTemplate',
      'neuralEditorSlashMenu',
      'NeuralEditorSuggestionMenuTemplateContext<NeuralEditorSlashCommand>',
    ],
    [
      'NeuralEditorMentionMenuTemplate',
      'neuralEditorMentionMenu',
      'NeuralEditorSuggestionMenuTemplateContext<NeuralEditorMentionItem>',
    ],
    [
      'NeuralEditorCommandPaletteTemplate',
      'neuralEditorCommandPalette',
      'NeuralEditorCommandPaletteTemplateContext',
    ],
    [
      'NeuralEditorAiReviewTemplate',
      'neuralEditorAiReview',
      'NeuralEditorAiReviewTemplateContext',
    ],
  ] as const;
  readonly tokens = [
    '--neural-editor-width',
    '--neural-editor-min-height',
    '--neural-editor-max-height',
    '--neural-editor-color',
    '--neural-editor-color-readonly',
    '--neural-editor-background',
    '--neural-editor-content-background',
    '--neural-editor-content-color',
    '--neural-editor-border',
    '--neural-editor-border-color-focus',
    '--neural-editor-border-color-invalid',
    '--neural-editor-radius',
    '--neural-editor-shadow',
    '--neural-editor-shadow-focus',
    '--neural-editor-shadow-invalid',
    '--neural-editor-font-family',
    '--neural-editor-font-size',
    '--neural-editor-line-height',
    '--neural-editor-content-padding',
    '--neural-editor-caret-color',
    '--neural-editor-placeholder-color',
    '--neural-editor-placeholder-opacity',
    '--neural-editor-heading-color',
    '--neural-editor-blockquote-color',
    '--neural-editor-blockquote-border',
    '--neural-editor-inline-code-background',
    '--neural-editor-code-block-color',
    '--neural-editor-code-block-background',
    '--neural-editor-link-color',
    '--neural-editor-rule-border',
    '--neural-editor-selection-background',
    '--neural-editor-toolbar-gap',
    '--neural-editor-toolbar-padding',
    '--neural-editor-toolbar-background',
    '--neural-editor-toolbar-border',
    '--neural-editor-toolbar-button-size',
    '--neural-editor-toolbar-button-color',
    '--neural-editor-toolbar-button-background',
    '--neural-editor-toolbar-button-background-hover',
    '--neural-editor-toolbar-button-color-hover',
    '--neural-editor-toolbar-button-background-active',
    '--neural-editor-toolbar-button-color-active',
    '--neural-editor-toolbar-button-radius',
    '--neural-editor-toolbar-separator-color',
    '--neural-editor-toolbar-menu-color',
    '--neural-editor-toolbar-menu-background',
    '--neural-editor-toolbar-menu-border',
    '--neural-editor-toolbar-menu-radius',
    '--neural-editor-toolbar-menu-shadow',
    '--neural-editor-toolbar-color-swatch-border',
    '--neural-editor-task-checkbox-accent',
    '--neural-editor-table-cell-border',
    '--neural-editor-table-header-background',
    '--neural-editor-table-selection-background',
    '--neural-editor-link-input-background',
    '--neural-editor-link-input-border',
    '--neural-editor-link-input-radius',
    '--neural-editor-link-action-color',
    '--neural-editor-link-action-background',
    '--neural-editor-link-action-border',
    '--neural-editor-link-action-radius',
    '--neural-editor-context-menu-z-index',
    '--neural-editor-context-menu-color',
    '--neural-editor-context-menu-background',
    '--neural-editor-context-menu-border',
    '--neural-editor-context-menu-radius',
    '--neural-editor-context-menu-shadow',
    '--neural-editor-context-menu-button-color',
    '--neural-editor-context-menu-button-color-active',
    '--neural-editor-context-menu-button-background-active',
    '--neural-editor-context-menu-button-radius',
    '--neural-editor-image-radius',
    '--neural-editor-image-selection-outline',
    '--neural-editor-mention-color',
    '--neural-editor-mention-background',
    '--neural-editor-suggestion-z-index',
    '--neural-editor-suggestion-color',
    '--neural-editor-suggestion-background',
    '--neural-editor-suggestion-border',
    '--neural-editor-suggestion-radius',
    '--neural-editor-suggestion-shadow',
    '--neural-editor-suggestion-item-color',
    '--neural-editor-suggestion-item-color-active',
    '--neural-editor-suggestion-item-background-active',
    '--neural-editor-command-palette-z-index',
    '--neural-editor-command-palette-backdrop',
    '--neural-editor-command-palette-background',
    '--neural-editor-command-palette-border',
    '--neural-editor-command-palette-radius',
    '--neural-editor-command-palette-shadow',
    '--neural-editor-command-palette-input-background',
    '--neural-editor-command-palette-input-border',
    '--neural-editor-ai-review-z-index',
    '--neural-editor-ai-review-color',
    '--neural-editor-ai-review-muted-color',
    '--neural-editor-ai-review-background',
    '--neural-editor-ai-review-border',
    '--neural-editor-ai-review-radius',
    '--neural-editor-ai-review-shadow',
    '--neural-editor-ai-review-button-color',
    '--neural-editor-ai-review-button-background',
    '--neural-editor-ai-review-button-border',
    '--neural-editor-ai-addition-background',
    '--neural-editor-ai-addition-border-color',
    '--neural-editor-ai-deletion-background',
    '--neural-editor-ai-deletion-border-color',
    '--neural-editor-ai-update-border-color',
    '--neural-editor-ai-selected-outline',
    '--neural-editor-footer-gap',
    '--neural-editor-footer-padding',
    '--neural-editor-footer-color',
    '--neural-editor-footer-background',
    '--neural-editor-footer-border',
    '--neural-editor-footer-font-size',
    '--neural-editor-focus-ring',
    '--neural-editor-focus-ring-offset',
    '--neural-editor-disabled-opacity',
    '--neural-editor-transition',
    '--neural-editor-collaboration-border',
    '--neural-editor-collaboration-input-border',
    '--neural-editor-collaboration-button-border',
    '--neural-editor-collaboration-button-background',
    '--neural-editor-collaboration-item-border',
    '--neural-editor-comment-background',
    '--neural-editor-comment-border-color',
    '--neural-editor-tracked-insertion-color',
    '--neural-editor-tracked-insertion-background',
    '--neural-editor-tracked-deletion-color',
    '--neural-editor-tracked-deletion-background',
  ] as const;
  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd)
        this.selectedView.set(resolveView(event.urlAfterRedirects));
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }
  editorUpdated(event: NeuralEditorUpdateEvent): void {
    this.updateStatus.set(
      `${event.source} - ${event.characterCount} characters - ${event.wordCount} words`,
    );
  }
  resetAdvanced(): void {
    this.advancedDocument.set(cloneDocument());
  }
  clearCustom(): void {
    this.customDocument.set(createNeuralEditorEmptyDocument());
  }
  captureHtml(): void {
    this.htmlPreview.set(editorDocumentToHtml(this.advancedDocument()));
  }
  captureText(): void {
    this.htmlPreview.set(editorDocumentToText(this.advancedDocument()));
  }
  selectView(value: NeuralTabValue | null): void {
    if (!isView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    void this.router.navigateByUrl(
      `/docs/components/editor${value === 'component' ? '' : `/${value}`}`,
    );
  }
  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}
function resolveView(url: string): EditorDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}
function isView(value: NeuralTabValue | null): value is EditorDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
