import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { FormField, form } from '@angular/forms/signals';
import { provideNeuralNg } from '@neural-ng/core';
import {
  EditorCommandPaletteTemplateDirective,
  EditorMentionMenuTemplateDirective,
  EditorSlashMenuTemplateDirective,
} from './editor-suggestion-menu-template.directives';
import { EditorAiReviewTemplateDirective } from './editor-ai-review-template.directive';
import { NeuralEditor } from './editor.component';
import type {
  NeuralEditorAiConflictEvent,
  NeuralEditorAiProposalAcceptedEvent,
  NeuralEditorAiProposalEvent,
  NeuralEditorAiProposalRejectedEvent,
  NeuralEditorAiRequestCancelledEvent,
  NeuralEditorAiRequestEvent,
  NeuralEditorCommandExecutedEvent,
  NeuralEditorController,
  NeuralEditorDocument,
  NeuralEditorImageInsertRequestEvent,
  NeuralEditorMentionItem,
  NeuralEditorMentionSelectedEvent,
  NeuralEditorOperationConflictEvent,
  NeuralEditorOperationsAppliedEvent,
  NeuralEditorOperationsRejectedEvent,
  NeuralEditorSuggestionProvider,
  NeuralEditorUpdateEvent,
} from './editor.types';

const EMPTY: NeuralEditorDocument = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

@Component({
  imports: [NeuralEditor],
  template: `<neural-editor
    editorId="article-editor"
    ariaLabel="Article body"
    [(value)]="document"
    showCharacterCount
    showWordCount
    fluid
    [unstyled]="unstyled()"
    [mentionProvider]="mentionProvider"
    (editorReady)="controller.set($event)"
    (editorUpdate)="updates.push($event)"
    (imageInsertRequest)="imageRequests.push($event)"
    (commandExecuted)="commands.push($event)"
    (mentionSelected)="mentions.push($event)"
    (operationsApplied)="appliedOperations.push($event)"
    (operationsRejected)="rejectedOperations.push($event)"
    (operationConflict)="operationConflicts.push($event)"
    (aiRequest)="aiRequests.push($event)"
    (aiRequestCancelled)="aiCancelled.push($event)"
    (aiProposalPreviewed)="aiPreviews.push($event)"
    (aiProposalAccepted)="aiAccepted.push($event)"
    (aiProposalRejected)="aiRejected.push($event)"
    (aiOperationConflict)="aiConflicts.push($event)"
    (touch)="touches.update((count) => count + 1)"
  />`,
})
class Host {
  readonly document = signal<NeuralEditorDocument>(EMPTY);
  readonly controller = signal<NeuralEditorController | null>(null);
  readonly unstyled = signal(false);
  readonly touches = signal(0);
  readonly updates: NeuralEditorUpdateEvent[] = [];
  readonly imageRequests: NeuralEditorImageInsertRequestEvent[] = [];
  readonly commands: NeuralEditorCommandExecutedEvent[] = [];
  readonly mentions: NeuralEditorMentionSelectedEvent[] = [];
  readonly appliedOperations: NeuralEditorOperationsAppliedEvent[] = [];
  readonly rejectedOperations: NeuralEditorOperationsRejectedEvent[] = [];
  readonly operationConflicts: NeuralEditorOperationConflictEvent[] = [];
  readonly aiRequests: NeuralEditorAiRequestEvent[] = [];
  readonly aiCancelled: NeuralEditorAiRequestCancelledEvent[] = [];
  readonly aiPreviews: NeuralEditorAiProposalEvent[] = [];
  readonly aiAccepted: NeuralEditorAiProposalAcceptedEvent[] = [];
  readonly aiRejected: NeuralEditorAiProposalRejectedEvent[] = [];
  readonly aiConflicts: NeuralEditorAiConflictEvent[] = [];
  readonly mentionProvider: NeuralEditorSuggestionProvider<NeuralEditorMentionItem> =
    (query) =>
      [{ id: 'ada', label: 'Ada Lovelace', description: 'Engineering' }].filter(
        (item) =>
          item.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
      );
}

@Component({
  imports: [NeuralEditor, FormField, FormsModule, ReactiveFormsModule],
  template: `
    <neural-editor [formControl]="reactiveDocument" />
    <neural-editor name="templateEditor" [(ngModel)]="templateDocument" />
    <neural-editor [formField]="documentForm.document" />
  `,
})
class FormsHost {
  readonly reactiveDocument = new FormControl<NeuralEditorDocument>(EMPTY, {
    nonNullable: true,
  });
  templateDocument: NeuralEditorDocument = EMPTY;
  readonly model = signal({ document: EMPTY });
  readonly documentForm = form(this.model);
}

@Component({
  imports: [
    NeuralEditor,
    EditorSlashMenuTemplateDirective,
    EditorMentionMenuTemplateDirective,
    EditorCommandPaletteTemplateDirective,
  ],
  template: `
    <neural-editor [mentionProvider]="mentionProvider">
      <ng-template
        neuralEditorSlashMenu
        let-items="items"
        let-select="select"
        let-optionId="optionId"
      >
        @for (item of items(); track item.id; let index = $index) {
          <button
            type="button"
            role="option"
            [id]="optionId(index)"
            [attr.aria-selected]="false"
            (click)="select(index)"
          >
            {{ item.label }}
          </button>
        }
      </ng-template>
      <ng-template neuralEditorMentionMenu let-items="items">
        <span>{{ items().length }}</span>
      </ng-template>
      <ng-template
        neuralEditorCommandPalette
        let-query="query"
        let-setQuery="setQuery"
      >
        <input
          [value]="query()"
          (input)="setQuery($any($event.target).value)"
        />
      </ng-template>
    </neural-editor>
  `,
})
class CustomMenusHost {
  readonly mentionProvider: NeuralEditorSuggestionProvider<NeuralEditorMentionItem> =
    () => [];
}

@Component({
  imports: [NeuralEditor, EditorAiReviewTemplateDirective],
  template: `
    <neural-editor>
      <ng-template
        neuralEditorAiReview
        let-review="review"
        let-accept="accept"
        let-reject="reject"
      >
        @if (review(); as state) {
          <span>{{ state.operationCount }}</span>
          <button type="button" (click)="reject()">Reject</button>
          <button type="button" (click)="accept()">Accept</button>
        }
      </ng-template>
    </neural-editor>
  `,
})
class CustomAiReviewHost {}

describe('NeuralEditor', () => {
  async function createHost(globalUnstyled = false) {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideNeuralNg({ unstyled: globalUnstyled })],
    }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('mounts one accessible ProseMirror textbox with a stable controller', async () => {
    const fixture = await createHost();
    const content = fixture.nativeElement.querySelector(
      '[contenteditable]',
    ) as HTMLElement;

    expect(content.id).toBe('article-editor');
    expect(content.getAttribute('role')).toBe('textbox');
    expect(content.getAttribute('aria-multiline')).toBe('true');
    expect(content.getAttribute('aria-label')).toBe('Article body');
    expect(fixture.componentInstance.controller()).not.toBeNull();
  });

  it('updates canonical JSON through controller commands', async () => {
    const fixture = await createHost();
    const controller = fixture.componentInstance.controller();
    controller?.insertText('AI-native document');
    fixture.detectChanges();

    expect(controller?.getText()).toContain('AI-native document');
    expect(fixture.componentInstance.document().type).toBe('doc');
    const updates = fixture.componentInstance.updates;
    expect(updates[updates.length - 1]?.source).toBe('command');
  });

  it('applies alignment, text color, and multicolor highlight through the controller', async () => {
    const fixture = await createHost();
    const controller = fixture.componentInstance.controller();

    controller?.setTextAlign('center');
    controller?.setTextColor('#2563eb');
    controller?.setHighlight('#fef08a');
    controller?.insertText('Styled content');
    fixture.detectChanges();

    const document = controller?.getDocument();
    const paragraph = findNode(document, 'paragraph');
    const text = findNode(document, 'text');

    expect(paragraph?.attrs?.['textAlign']).toBe('center');
    expect(text?.marks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'textStyle',
          attrs: expect.objectContaining({ color: '#2563eb' }),
        }),
        expect.objectContaining({
          type: 'highlight',
          attrs: expect.objectContaining({ color: '#fef08a' }),
        }),
      ]),
    );
  });

  it('creates task-list and table nodes without changing the canonical value type', async () => {
    const taskFixture = await createHost();
    const taskController = taskFixture.componentInstance.controller();
    taskController?.toggleTaskList();
    taskController?.insertText('Review alpha');
    taskFixture.detectChanges();

    expect(findNode(taskController?.getDocument(), 'taskList')).toBeDefined();
    expect(findNode(taskController?.getDocument(), 'taskItem')).toBeDefined();

    taskController?.clear();
    taskController?.insertTable({ rows: 2, cols: 2, withHeaderRow: true });
    taskFixture.detectChanges();

    const table = findNode(taskController?.getDocument(), 'table');
    expect(table).toBeDefined();
    expect(table?.content).toHaveLength(2);
    expect(
      findNode(taskController?.getDocument(), 'tableHeader'),
    ).toBeDefined();
  });

  it('keeps upload outside the editor and inserts only the persistent image URL', async () => {
    const fixture = await createHost();
    const controller = fixture.componentInstance.controller();

    controller?.requestImageInsert();
    expect(fixture.componentInstance.imageRequests).toHaveLength(1);
    expect(fixture.componentInstance.imageRequests[0]?.controller).toBe(
      controller,
    );

    controller?.insertImage({
      src: 'https://cdn.example.com/diagram.png',
      alt: 'Architecture diagram',
    });
    fixture.detectChanges();

    const image = findNode(controller?.getDocument(), 'image');
    expect(image?.attrs?.['src']).toBe('https://cdn.example.com/diagram.png');
    expect(image?.attrs?.['alt']).toBe('Architecture diagram');
  });

  it('rejects temporary image sources before they enter canonical JSON', async () => {
    const fixture = await createHost();
    const controller = fixture.componentInstance.controller();

    const insertBase64Image = () =>
      controller?.insertImage({ src: 'data:image/png;base64,AAAA' });
    const insertBlobImage = () =>
      controller?.insertImage({ src: 'blob:https://example.com/temporary' });

    expect(insertBase64Image).toThrowError(TypeError);
    expect(insertBase64Image).toThrowError(/Base64 image sources are disabled/);
    expect(insertBlobImage).toThrowError(TypeError);
    expect(insertBlobImage).toThrowError(/Blob image sources are temporary/);
  });

  it('appends contextual menus outside the clipped editor surface', async () => {
    const fixture = await createHost();
    const bubbleMenus = [
      ...document.body.querySelectorAll('.neural-editor-bubble-menu-root'),
    ];
    const floatingMenus = [
      ...document.body.querySelectorAll('.neural-editor-floating-menu-root'),
    ];
    const bubble = bubbleMenus[bubbleMenus.length - 1] ?? null;
    const floating = floatingMenus[floatingMenus.length - 1] ?? null;

    expect(bubble).not.toBeNull();
    expect(floating).not.toBeNull();
    expect(bubble?.parentElement).toBe(document.body);
    expect(floating?.parentElement).toBe(document.body);

    fixture.destroy();
    expect(document.body.contains(bubble)).toBe(false);
    expect(document.body.contains(floating)).toBe(false);
  });

  it('opens the command palette through the controller and appends it to body', async () => {
    const fixture = await createHost();
    const controller = fixture.componentInstance.controller();

    controller?.openCommandPalette('table');
    fixture.detectChanges();
    await fixture.whenStable();

    const palettes = [
      ...document.body.querySelectorAll<HTMLElement>(
        '.neural-editor-command-palette-root',
      ),
    ];
    const palette = palettes[palettes.length - 1] ?? null;
    const input = palette?.querySelector<HTMLInputElement>(
      'input[type="search"]',
    );

    expect(controller?.commandPaletteOpen()).toBe(true);
    expect(palette?.parentElement).toBe(document.body);
    expect(palette?.hidden).toBe(false);
    expect(input?.value).toBe('table');

    controller?.closeCommandPalette();
    fixture.detectChanges();
    expect(controller?.commandPaletteOpen()).toBe(false);
    expect(palette?.hidden).toBe(true);
  });

  it('compiles typed custom slash, mention, and command-palette templates', async () => {
    await TestBed.configureTestingModule({
      imports: [CustomMenusHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(CustomMenusHost);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(
      fixture.debugElement.query(By.directive(NeuralEditor)),
    ).not.toBeNull();
  });

  it('compiles the typed AI review template context', async () => {
    await TestBed.configureTestingModule({
      imports: [CustomAiReviewHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(CustomAiReviewHost);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(
      fixture.debugElement.query(By.directive(NeuralEditor)),
    ).not.toBeNull();
  });

  it('assigns stable node IDs and applies a structured operation batch atomically', async () => {
    const fixture = await createHost();
    const controller = fixture.componentInstance.controller();
    const paragraph = findNode(controller?.getDocument(), 'paragraph');
    const nodeId = paragraph?.attrs?.['neuralId'];

    expect(typeof nodeId).toBe('string');
    expect(controller?.getNodeById(String(nodeId))?.type).toBe('paragraph');

    const batch = requireValue(
      controller,
      'editor controller',
    ).createOperationBatch(
      [
        {
          id: 'replace-intro',
          type: 'replace',
          target: { nodeId: String(nodeId) },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Structured operation' }],
            },
          ],
        },
      ],
      { id: 'operation-batch-1' },
    );

    expect(controller?.validateOperations(batch).valid).toBe(true);
    const result = controller?.applyOperations(batch);
    fixture.detectChanges();

    expect(result?.status).toBe('applied');
    expect(controller?.getText()).toContain('Structured operation');
    expect(
      findNode(controller?.getDocument(), 'paragraph')?.attrs?.['neuralId'],
    ).toBe(nodeId);
    expect(fixture.componentInstance.appliedOperations).toHaveLength(1);
  });

  it('rejects stale operation batches without mutating the document', async () => {
    const fixture = await createHost();
    const controller = requireValue(
      fixture.componentInstance.controller(),
      'editor controller',
    );
    const paragraph = findNode(controller.getDocument(), 'paragraph');
    const nodeId = String(paragraph?.attrs?.['neuralId']);
    const batch = controller.createOperationBatch(
      [
        {
          type: 'update-node',
          target: { nodeId },
          attrs: { textAlign: 'right' },
        },
      ],
      { id: 'stale-batch' },
    );

    controller.insertText('revision change');
    const before = controller.getDocument();
    const result = controller.applyOperations(batch);

    expect(result.status).toBe('conflict');
    expect(controller.getDocument()).toEqual(before);
    expect(fixture.componentInstance.operationConflicts).toHaveLength(1);
  });

  it('emits an AI request with a structured selection snapshot', async () => {
    const fixture = await createHost();
    const controller = requireValue(
      fixture.componentInstance.controller(),
      'editor controller',
    );
    controller.insertText('Rewrite this text');

    const request = controller.requestAi('rewrite', {
      instruction: 'Make it concise',
    });

    expect(request.document.type).toBe('doc');
    expect(request.baseRevision).toBe(controller.revision());
    expect(request.instruction).toBe('Make it concise');
    expect(fixture.componentInstance.aiRequests).toHaveLength(1);
    expect(controller.aiRequestPending()).toBe(true);
    expect(controller.cancelAiRequest(request.id)).toBe(true);
    expect(controller.aiRequestPending()).toBe(false);
    expect(fixture.componentInstance.aiCancelled).toHaveLength(1);
  });

  it('previews AI operations without mutating the form value and accepts atomically', async () => {
    const fixture = await createHost();
    const controller = requireValue(
      fixture.componentInstance.controller(),
      'editor controller',
    );
    controller.insertText('Original AI text');
    const paragraph = findNode(controller.getDocument(), 'paragraph');
    const nodeId = String(paragraph?.attrs?.['neuralId']);
    const request = controller.requestAi('rewrite');
    const before = controller.getDocument();

    const preview = controller.previewAiProposal({
      id: 'proposal-1',
      requestId: request.id,
      baseRevision: request.baseRevision,
      summary: 'Rewrite the introduction',
      operations: [
        {
          id: 'rewrite-intro',
          type: 'replace',
          target: { nodeId },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Accepted AI text' }],
            },
          ],
        },
      ],
    });
    fixture.detectChanges();

    expect(preview.status).toBe('previewed');
    expect(controller.getDocument()).toEqual(before);
    expect(controller.aiReview()?.proposal.id).toBe('proposal-1');
    expect(
      document.body.querySelector('.neural-editor-ai-review-root'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('.neural-editor-ai-deletion'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('.neural-editor-ai-addition'),
    ).not.toBeNull();
    expect(fixture.componentInstance.aiPreviews).toHaveLength(1);

    const result = controller.acceptAiProposal('proposal-1');
    fixture.detectChanges();

    expect(result?.status).toBe('applied');
    expect(controller.getText()).toContain('Accepted AI text');
    expect(controller.aiReview()).toBeNull();
    expect(fixture.componentInstance.aiAccepted).toHaveLength(1);
  });

  it('rejects an AI proposal without changing canonical content', async () => {
    const fixture = await createHost();
    const controller = requireValue(
      fixture.componentInstance.controller(),
      'editor controller',
    );
    controller.insertText('Keep this');
    const paragraph = findNode(controller.getDocument(), 'paragraph');
    const request = controller.requestAi('rewrite');
    const before = controller.getDocument();

    controller.previewAiProposal({
      id: 'proposal-reject',
      requestId: request.id,
      baseRevision: request.baseRevision,
      operations: [
        {
          type: 'delete',
          target: { nodeId: String(paragraph?.attrs?.['neuralId']) },
        },
      ],
    });

    expect(controller.rejectAiProposal()).toBe(true);
    expect(controller.getDocument()).toEqual(before);
    const rejectedEvents = fixture.componentInstance.aiRejected;
    expect(rejectedEvents[rejectedEvents.length - 1]?.reason).toBe('user');
  });

  it('invalidates a preview when the canonical document changes', async () => {
    const fixture = await createHost();
    const controller = requireValue(
      fixture.componentInstance.controller(),
      'editor controller',
    );
    controller.insertText('Base text');
    const paragraph = findNode(controller.getDocument(), 'paragraph');
    const request = controller.requestAi('rewrite');

    controller.previewAiProposal({
      id: 'proposal-conflict',
      requestId: request.id,
      baseRevision: request.baseRevision,
      operations: [
        {
          type: 'delete',
          target: { nodeId: String(paragraph?.attrs?.['neuralId']) },
        },
      ],
    });

    controller.insertText(' user edit');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(controller.aiReview()).toBeNull();
    const conflictEvents = fixture.componentInstance.aiConflicts;
    expect(conflictEvents[conflictEvents.length - 1]?.reason).toBe(
      'document-changed',
    );
  });

  it('synchronizes an external immutable document without emitting a user update', async () => {
    const fixture = await createHost();
    const next: NeuralEditorDocument = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'External value' }],
        },
      ],
    };
    fixture.componentInstance.document.set(next);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.controller()?.getText()).toBe(
      'External value',
    );
    expect(fixture.componentInstance.updates).toHaveLength(0);
  });

  it('emits touch on blur and keeps structural hooks in unstyled mode', async () => {
    const fixture = await createHost(true);
    fixture.componentInstance.controller()?.focus();
    fixture.componentInstance.controller()?.blur();
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector('.neural-editor-root');
    expect(root.classList.contains('neural-editor-base')).toBe(false);
    expect(fixture.componentInstance.touches()).toBeGreaterThanOrEqual(1);
  });

  it('binds Reactive, template-driven, and Signal Forms through one JSON model', async () => {
    await TestBed.configureTestingModule({
      imports: [FormsHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(FormsHost);
    fixture.detectChanges();
    await fixture.whenStable();

    const reactive: NeuralEditorDocument = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'R' }] }],
    };
    const template: NeuralEditorDocument = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'T' }] }],
    };
    const signalValue: NeuralEditorDocument = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'S' }] }],
    };

    fixture.componentInstance.reactiveDocument.setValue(reactive);
    fixture.componentInstance.templateDocument = template;
    fixture.componentInstance.model.set({ document: signalValue });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const editors = fixture.debugElement.queryAll(By.directive(NeuralEditor));
    expect(
      editors.map((entry) =>
        (entry.componentInstance as NeuralEditor).controller.getText(),
      ),
    ).toEqual(['R', 'T', 'S']);
  });
});

function requireValue<T>(value: T | null | undefined, label: string): T {
  if (value === null || value === undefined) {
    throw new Error(`${label} was not initialized.`);
  }
  return value;
}

function findNode(
  node:
    | NeuralEditorDocument
    | import('./editor.types').NeuralEditorNode
    | undefined,
  type: string,
): import('./editor.types').NeuralEditorNode | undefined {
  if (!node) return undefined;
  if (node.type === type) return node;
  for (const child of node.content ?? []) {
    const match = findNode(child, type);
    if (match) return match;
  }
  return undefined;
}
