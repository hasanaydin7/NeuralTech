import { Doc } from 'yjs';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { NeuralColorModeService } from '@neural-ng/core/color-mode';
import {
  EditorAiReviewTemplateDirective,
  EditorBubbleMenuTemplateDirective,
  EditorComponent,
  EditorFloatingMenuTemplateDirective,
  EditorLinkPopoverTemplateDirective,
  EditorMentionMenuTemplateDirective,
  EditorToolbarTemplateDirective,
  editorDocumentToHtml,
  type NeuralEditorAiConflictEvent,
  type NeuralEditorAiProposalAcceptedEvent,
  type NeuralEditorAiProposalRejectedEvent,
  type NeuralEditorAiRequestEvent,
  type NeuralEditorClasses,
  type NeuralEditorCollaborationConfig,
  type NeuralEditorCollaborationStatusEvent,
  type NeuralEditorCollaborationUser,
  type NeuralEditorCommandExecutedEvent,
  type NeuralEditorController,
  type NeuralEditorDocument,
  type NeuralEditorImageInsertRequestEvent,
  type NeuralEditorMentionItem,
  type NeuralEditorMentionSelectedEvent,
  type NeuralEditorOperationConflictEvent,
  type NeuralEditorSnapshot,
  type NeuralEditorSuggestionProvider,
  type NeuralEditorUpdateEvent,
} from '@neural-ng/editor';
import {
  FileUploadComponent,
  type NeuralFileSelectionChange,
} from '@neural-ng/core/file-upload';
import {
  FieldComponent,
  FieldHintDirective,
  FieldLabelDirective,
} from '@neural-ng/core/field';
import { CodeView } from '../../../shared/code-view';

const INITIAL_DOCUMENT: NeuralEditorDocument = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 2, textAlign: 'center' },
      content: [{ type: 'text', text: 'AI-native structured editing' }],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'The form value is a deterministic JSON tree, ' },
        {
          type: 'text',
          text: 'not HTML.',
          marks: [
            { type: 'bold' },
            { type: 'textStyle', attrs: { color: '#2563eb' } },
          ],
        },
      ],
    },
  ],
};

const MENTION_ITEMS: readonly NeuralEditorMentionItem[] = [
  { id: 'ada', label: 'Ada Lovelace', description: 'Engineering' },
  { id: 'grace', label: 'Grace Hopper', description: 'Compiler systems' },
  { id: 'alan', label: 'Alan Turing', description: 'Research' },
  { id: 'margaret', label: 'Margaret Hamilton', description: 'Software engineering' },
];

const ADVANCED_DOCUMENT: NeuralEditorDocument = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Editor alpha adds ' },
        {
          type: 'text',
          text: 'structured color and highlight',
          marks: [
            { type: 'textStyle', attrs: { color: '#2563eb' } },
            { type: 'highlight', attrs: { color: '#fef08a' } },
          ],
        },
        { type: 'text', text: ', tasks, alignment, and tables.' },
      ],
    },
    {
      type: 'taskList',
      content: [
        {
          type: 'taskItem',
          attrs: { checked: true },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Freeze the JSON schema' }],
            },
          ],
        },
        {
          type: 'taskItem',
          attrs: { checked: false },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Review table behavior' }],
            },
          ],
        },
      ],
    },
    {
      type: 'table',
      content: [
        {
          type: 'tableRow',
          content: [
            {
              type: 'tableHeader',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Feature' }],
                },
              ],
            },
            {
              type: 'tableHeader',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Model' }],
                },
              ],
            },
          ],
        },
        {
          type: 'tableRow',
          content: [
            {
              type: 'tableCell',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Task state' }],
                },
              ],
            },
            {
              type: 'tableCell',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'checked: boolean' }],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

@Component({
  selector: 'app-editor-page',
  imports: [
    CodeView,
    EditorAiReviewTemplateDirective,
    EditorBubbleMenuTemplateDirective,
    EditorComponent,
    EditorFloatingMenuTemplateDirective,
    EditorLinkPopoverTemplateDirective,
    EditorMentionMenuTemplateDirective,
    EditorToolbarTemplateDirective,
    FileUploadComponent,
    FieldComponent,
    FieldHintDirective,
    FieldLabelDirective,
    FormField,
  ],
  templateUrl: './editor.page.html',
  styleUrls: ['../shared-doc-page.scss', './editor.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EditorPage {
  readonly resolvedMode = inject(NeuralColorModeService).resolvedMode;
  readonly article = signal({ body: INITIAL_DOCUMENT });
  readonly articleForm = form(this.article);
  readonly advancedDocument = signal<NeuralEditorDocument>(ADVANCED_DOCUMENT);
  readonly customDocument = signal<NeuralEditorDocument>({
    type: 'doc',
    content: [{ type: 'paragraph' }],
  });
  readonly contextDocument = signal<NeuralEditorDocument>({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Select this text or open an empty paragraph.' }] }],
  });
  readonly suggestionDocument = signal<NeuralEditorDocument>({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Type / for blocks, @ for people, or press Ctrl/Cmd+K.',
          },
        ],
      },
    ],
  });
  readonly suggestionController = signal<NeuralEditorController | null>(null);
  readonly suggestionStatus = signal('No command or mention selected yet.');
  readonly operationDocument = signal<NeuralEditorDocument>({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'This paragraph has a stable node ID and can be addressed without DOM queries.',
          },
        ],
      },
    ],
  });
  readonly operationController = signal<NeuralEditorController | null>(null);
  readonly operationStatus = signal('No structured operation applied yet.');
  readonly aiDocument = signal<NeuralEditorDocument>({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'NeuralNg keeps AI output outside canonical content until the user accepts it.',
          },
        ],
      },
    ],
  });
  readonly aiController = signal<NeuralEditorController | null>(null);
  readonly aiStatus = signal('Select text or place the caret, then request a rewrite.');
  readonly mentionProvider: NeuralEditorSuggestionProvider<NeuralEditorMentionItem> =
    (query, { signal: abortSignal }) => {
      if (abortSignal.aborted) return [];
      const normalized = query.trim().toLocaleLowerCase();
      return MENTION_ITEMS.filter((item) =>
        [item.label, item.description ?? '']
          .join(' ')
          .toLocaleLowerCase()
          .includes(normalized),
      );
    };
  readonly collaborationDocument = new Doc();
  readonly collaborationConfig: NeuralEditorCollaborationConfig = {
    document: this.collaborationDocument,
    field: 'docs-collaboration-body',
    commentsField: 'docs-collaboration-comments',
    waitForSync: false,
  };
  readonly collaborationAlice: NeuralEditorCollaborationUser = {
    id: 'ada',
    name: 'Ada Lovelace',
    color: '#2563eb',
  };
  readonly collaborationGrace: NeuralEditorCollaborationUser = {
    id: 'grace',
    name: 'Grace Hopper',
    color: '#9333ea',
  };
  readonly collaborationAliceDocument = signal<NeuralEditorDocument>({
    type: 'doc',
    content: [{ type: 'paragraph' }],
  });
  readonly collaborationGraceDocument = signal<NeuralEditorDocument>({
    type: 'doc',
    content: [{ type: 'paragraph' }],
  });
  readonly collaborationSnapshots = signal<readonly NeuralEditorSnapshot[]>([]);
  readonly collaborationStatus = signal('Shared Yjs document is ready.');

  readonly imageFiles = signal<readonly File[]>([]);
  readonly imageUrl = signal('');
  readonly pendingImageRequest =
    signal<NeuralEditorImageInsertRequestEvent | null>(null);
  readonly headlessDocument = signal<NeuralEditorDocument>({
    type: 'doc',
    content: [{ type: 'paragraph' }],
  });
  readonly controller = signal<NeuralEditorController | null>(null);
  readonly advancedController = signal<NeuralEditorController | null>(null);
  readonly updateStatus = signal('No editor update yet.');
  readonly htmlPreview = signal('');
  readonly headlessClasses: NeuralEditorClasses = {
    root: 'docs-editor-headless',
    toolbar: 'docs-editor-headless__toolbar',
    toolbarButton: 'docs-editor-headless__button',
    toolbarSeparator: 'docs-editor-headless__separator',
    toolbarMenu: 'docs-editor-headless__menu',
    toolbarMenuButton: 'docs-editor-headless__button',
    toolbarMenuPanel: 'docs-editor-headless__menu-panel',
    toolbarMenuAction: 'docs-editor-headless__menu-action',
    toolbarColorOption: 'docs-editor-headless__menu-action',
    toolbarColorSwatch: 'docs-editor-headless__swatch',
    surface: 'docs-editor-headless__surface',
    content: 'docs-editor-headless__content',
    bubbleMenu: 'docs-editor-headless__context-menu',
    bubbleMenuButton: 'docs-editor-headless__button',
    floatingMenu: 'docs-editor-headless__context-menu',
    floatingMenuButton: 'docs-editor-headless__button',
    linkPopover: 'docs-editor-headless__context-menu',
    linkPopoverInput: 'docs-editor-headless__link-input',
    linkPopoverAction: 'docs-editor-headless__button',
    slashMenu: 'docs-editor-headless__suggestion',
    mentionMenu: 'docs-editor-headless__suggestion',
    suggestionList: 'docs-editor-headless__suggestion-list',
    suggestionItem: 'docs-editor-headless__suggestion-item',
    suggestionItemContent: 'docs-editor-headless__suggestion-content',
    suggestionItemLabel: 'docs-editor-headless__suggestion-label',
    suggestionItemDescription: 'docs-editor-headless__suggestion-description',
    suggestionState: 'docs-editor-headless__suggestion-state',
    commandPalette: 'docs-editor-headless__palette',
    commandPaletteBackdrop: 'docs-editor-headless__palette-backdrop',
    commandPalettePanel: 'docs-editor-headless__palette-panel',
    commandPaletteInput: 'docs-editor-headless__palette-input',
    commandPaletteList: 'docs-editor-headless__suggestion-list',
    commandPaletteItem: 'docs-editor-headless__suggestion-item',
    aiReview: 'docs-editor-headless__ai-review',
    aiReviewSummary: 'docs-editor-headless__ai-review-summary',
    aiReviewActions: 'docs-editor-headless__ai-review-actions',
    aiReviewButton: 'docs-editor-headless__button',
    footer: 'docs-editor-headless__footer',
  };

  readonly importCode = `import {
  EditorComponent,
  type NeuralEditorDocument,
  type NeuralEditorImageInsertRequestEvent,
} from '@neural-ng/editor';
import {
  FileUploadComponent,
  type NeuralFileSelectionChange,
} from '@neural-ng/core/file-upload';`;

  readonly basicCode = `<neural-field controlId="article-body" fluid>
  <label neuralFieldLabel>Article body</label>
  <neural-editor
    [formField]="articleForm.body"
    placeholder="Write the article…"
    [maxCharacters]="5000"
    showCharacterCount
    showWordCount
    fluid
  />
  <small neuralFieldHint>The model is NeuralEditorDocument JSON.</small>
</neural-field>`;

  readonly advancedCode = `<neural-editor
  [(value)]="document"
  (editorReady)="editor = $event"
  fluid
/>

editor.setTextAlign('center');
editor.setTextColor('#2563eb');
editor.setHighlight('#fef08a');
editor.toggleTaskList();
editor.insertTable({ rows: 3, cols: 3, withHeaderRow: true });`;

  readonly suggestionsCode = `import type {
  NeuralEditorMentionItem,
  NeuralEditorSuggestionProvider,
} from '@neural-ng/editor';

readonly mentionProvider: NeuralEditorSuggestionProvider<NeuralEditorMentionItem> =
  (query, { signal }) => peopleService.search(query, { signal });

<neural-editor
  [(value)]="document"
  [mentionProvider]="mentionProvider"
  (commandExecuted)="commandExecuted($event)"
  (mentionSelected)="mentionSelected($event)"
>
  <ng-template
    neuralEditorMentionMenu
    let-items="items"
    let-activeIndex="activeIndex"
    let-select="select"
    let-setActiveIndex="setActiveIndex"
    let-optionId="optionId"
  >
    @for (item of items(); track item.id; let index = $index) {
      <button
        type="button"
        role="option"
        [id]="optionId(index)"
        [attr.aria-selected]="activeIndex() === index"
        (pointerdown)="$event.preventDefault()"
        (mouseenter)="setActiveIndex(index)"
        (click)="select(index)"
      >
        {{ item.label }}
      </button>
    }
  </ng-template>
</neural-editor>

// Ctrl/Cmd+K is built in. Programmatic equivalent:
controller.openCommandPalette();`;

  readonly operationsCode = `const controller = operationController();
const paragraphId = controller.getDocument().content?.[0]?.attrs?.['neuralId'];

const batch = controller.createOperationBatch(
  [
    {
      type: 'replace',
      target: { nodeId: String(paragraphId) },
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Applied atomically.' }],
        },
      ],
    },
  ],
  { id: 'rewrite-intro' },
);

const result = controller.applyOperations(batch);
// status is applied, rejected, or conflict.`;

  readonly aiCode = `import type {
  NeuralEditorAiRequestEvent,
  NeuralEditorAiProposal,
} from '@neural-ng/editor';

<neural-editor
  [(value)]="document"
  (editorReady)="editor = $event"
  (aiRequest)="handleAiRequest($event)"
  (aiProposalAccepted)="saved($event)"
/>

async handleAiRequest(event: NeuralEditorAiRequestEvent) {
  const proposal = await aiService.edit(event.request);
  event.controller.previewAiProposal(proposal);
}

// Preview decorations do not change [(value)].
// Only explicit acceptance applies the structured operations.
editor.acceptAiProposal();`;

  readonly collaborationCode = `import { Doc } from 'yjs';
import type {
  NeuralEditorCollaborationConfig,
  NeuralEditorCollaborationUser,
  NeuralEditorSnapshot,
} from '@neural-ng/editor';

const document = new Doc();
const collaboration: NeuralEditorCollaborationConfig = {
  document,
  provider: applicationOwnedProvider,
  field: 'article-body',
  commentsField: 'article-comments',
  waitForSync: true,
};

<neural-editor
  [collaboration]="collaboration"
  [collaborationUser]="currentUser"
  enableComments
  trackedChangesMode="suggesting"
  enableSnapshots
  [(snapshots)]="snapshots"
/>`;

  readonly imageCode = `<neural-editor
  [(value)]="document"
  (imageInsertRequest)="request = $event"
/>

<neural-file-upload
  accept="image/*"
  [multiple]="false"
  (selectionChange)="selectImage($event)"
/>

// Upload in application code, then insert the persistent URL.
request.controller.insertImage({ src: uploaded.url, alt: file.name });`;

  readonly contextMenuCode = `<neural-editor [(value)]="document" menuAppendTo="body">
  <ng-template neuralEditorBubbleMenu let-editor>
    <button type="button" (click)="editor.toggleBold()">Bold</button>
  </ng-template>

  <ng-template neuralEditorFloatingMenu let-editor>
    <button type="button" (click)="editor.toggleHeading(2)">H2</button>
  </ng-template>

  <ng-template
    neuralEditorLinkPopover
    let-href="href"
    let-setHref="setHref"
    let-apply="apply"
  >
    <input [value]="href()" (input)="setHref(inputValue($event))" />
    <button type="button" (click)="apply()">Apply</button>
  </ng-template>
</neural-editor>`;

  readonly toolbarCode = `<neural-editor [(value)]="document">
  <ng-template neuralEditorToolbar let-editor>
    <button type="button" (click)="editor.toggleBold()">Bold</button>
    <button type="button" (click)="editor.setTextAlign('center')">Center</button>
    <button type="button" (click)="editor.toggleTaskList()">Tasks</button>
    <button type="button" (click)="editor.insertTable()">Table</button>
  </ng-template>
</neural-editor>`;

  readonly serializerCode = `const html = editorDocumentToHtml(document());
// HTML is derived output. Persist the JSON document with a schema version.
const stored = { schemaVersion: 1, document: document() };

// Validate JSON and sanitize rendered HTML on the server.`;

  readonly headlessCode = `<neural-editor
  [(value)]="document"
  [classes]="editorClasses"
  showCharacterCount
  unstyled
  fluid
/>`;

  editorCommandExecuted(event: NeuralEditorCommandExecutedEvent): void {
    this.suggestionStatus.set(`${event.source} · ${event.id}`);
  }

  editorMentionSelected(event: NeuralEditorMentionSelectedEvent): void {
    this.suggestionStatus.set(`mention · ${event.item.label}`);
  }

  applyStructuredRewrite(): void {
    const controller = this.operationController();
    const nodeId = controller?.getDocument().content?.[0]?.attrs?.['neuralId'];
    if (!controller || typeof nodeId !== 'string') {
      this.operationStatus.set('No addressable paragraph was found.');
      return;
    }

    const batch = controller.createOperationBatch(
      [
        {
          type: 'replace',
          target: { nodeId },
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'The structured operation was validated and applied atomically.',
                },
              ],
            },
          ],
        },
      ],
      { id: 'demo-rewrite' },
    );
    const result = controller.applyOperations(batch);
    this.operationStatus.set(
      result.status === 'applied'
        ? `Applied at document revision ${result.revision}.`
        : `${result.status}: ${result.error.message}`,
    );
  }

  editorOperationConflict(event: NeuralEditorOperationConflictEvent): void {
    this.operationStatus.set(`conflict: ${event.result.error.message}`);
  }

  handleAiRequest(event: NeuralEditorAiRequestEvent): void {
    const nodeId =
      event.request.selection.nodeIds[0] ??
      event.controller.getNodeIdAt(event.request.selection.from);
    if (!nodeId) {
      this.aiStatus.set('No addressable node was found for the AI request.');
      return;
    }

    const selectedText = event.request.selection.text.trim();
    const replacement = selectedText
      ? `AI suggestion: ${selectedText}`
      : 'AI suggestion: concise, structured, and reviewable content.';

    const preview = event.controller.previewAiProposal({
      id: `proposal-${event.request.id}`,
      requestId: event.request.id,
      baseRevision: event.request.baseRevision,
      summary: 'Rewrite the addressed paragraph',
      operations: [
        {
          id: 'rewrite-selection',
          type: 'replace',
          target: { nodeId },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: replacement }],
            },
          ],
        },
      ],
    });

    this.aiStatus.set(
      preview.status === 'previewed'
        ? 'Proposal is visible as a non-destructive diff.'
        : `${preview.status}: ${preview.error.message}`,
    );
  }

  requestAiRewrite(): void {
    this.aiController()?.requestAi('rewrite', {
      instruction: 'Rewrite this content more clearly.',
    });
  }

  aiProposalAccepted(event: NeuralEditorAiProposalAcceptedEvent): void {
    this.aiStatus.set(
      `Accepted ${event.proposal.operations.length} structured AI change(s).`,
    );
  }

  aiProposalRejected(event: NeuralEditorAiProposalRejectedEvent): void {
    this.aiStatus.set(`Proposal rejected: ${event.reason}.`);
  }

  aiProposalConflict(event: NeuralEditorAiConflictEvent): void {
    this.aiStatus.set(
      `Proposal conflict at revision ${event.currentRevision}: ${event.reason}.`,
    );
  }

  collaborationChanged(event: NeuralEditorCollaborationStatusEvent): void {
    this.collaborationStatus.set(`Collaboration status: ${event.status}`);
  }

  openImageInsert(event: NeuralEditorImageInsertRequestEvent): void {
    this.pendingImageRequest.set(event);
    this.imageFiles.set([]);
    this.imageUrl.set('');
  }

  imageSelected(event: NeuralFileSelectionChange): void {
    this.imageFiles.set(event.value);
  }

  setImageUrl(event: Event): void {
    this.imageUrl.set((event.target as HTMLInputElement).value);
  }

  insertUploadedImage(): void {
    const request = this.pendingImageRequest();
    const src = this.imageUrl().trim();
    if (!request || !src) return;
    request.controller.insertImage({
      src,
      alt: this.imageFiles()[0]?.name ?? null,
    });
    this.pendingImageRequest.set(null);
    this.imageFiles.set([]);
    this.imageUrl.set('');
  }

  cancelImageInsert(): void {
    this.pendingImageRequest.set(null);
    this.imageFiles.set([]);
    this.imageUrl.set('');
  }

  inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  editorUpdated(event: NeuralEditorUpdateEvent): void {
    this.updateStatus.set(
      `${event.source} · ${event.characterCount} characters · ${event.wordCount} words`,
    );
  }

  captureHtml(): void {
    this.htmlPreview.set(editorDocumentToHtml(this.advancedDocument()));
  }
}
