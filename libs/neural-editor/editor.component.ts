import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import {
  APP_ID,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injectable,
  ViewEncapsulation,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import {
  NEURAL_FIELD_CONTEXT,
  NEURAL_NG_CONFIG,
  NeuralLocaleService,
  type NeuralEditorMessages,
} from '@neural-ng/core';
import { Editor } from '@tiptap/core';
import { isChangeOrigin } from '@tiptap/extension-collaboration';
import { exitSuggestion } from '@tiptap/suggestion';
import {
  NEURAL_EDITOR_DEFAULT_HIGHLIGHT_COLORS,
  NEURAL_EDITOR_DEFAULT_IDENTIFIED_NODE_TYPES,
  NEURAL_EDITOR_DEFAULT_NODE_ID_ATTRIBUTE,
  NEURAL_EDITOR_DEFAULT_TEXT_COLORS,
  NEURAL_EDITOR_DEFAULT_TOOLBAR,
  createNeuralEditorDefaultCommandPaletteItems,
  createNeuralEditorDefaultSlashCommands,
  createNeuralEditorNodeId,
} from './editor.constants';
import {
  NeuralEditorControllerImpl,
  type NeuralEditorControllerAdapter,
} from './editor.controller';
import { EditorAiReviewComponent } from './editor-ai-review.component';
import { EditorCollaborationPanelComponent } from './editor-collaboration-panel.component';
import { EditorAiReviewTemplateDirective } from './editor-ai-review-template.directive';
import {
  clearNeuralEditorAiReview,
  selectNeuralEditorAiReviewOperation,
  showNeuralEditorAiReview,
} from './editor.ai-review';
import {
  cloneSnapshotDocument,
  createNeuralEditorCommentMessage,
  createNeuralEditorCommentRepository,
  createNeuralEditorCommentThread,
  createNeuralEditorSnapshot,
  prepareNeuralEditorCollaboration,
  readNeuralEditorPresence,
  subscribeNeuralEditorProvider,
  type NeuralEditorCommentRepository,
} from './editor.collaboration';
import {
  acceptNeuralEditorTrackedChange,
  NEURAL_EDITOR_COMMENT_MARK,
  readNeuralEditorTrackedChanges,
  rejectNeuralEditorTrackedChange,
  resolveAllNeuralEditorTrackedChanges,
} from './editor.review';
import {
  NEURAL_EDITOR_BUBBLE_MENU_PLUGIN_KEY,
  NEURAL_EDITOR_FLOATING_MENU_PLUGIN_KEY,
  NEURAL_EDITOR_MENTION_SUGGESTION_PLUGIN_KEY,
  NEURAL_EDITOR_SLASH_SUGGESTION_PLUGIN_KEY,
  createNeuralEditorExtensions,
} from './editor.extensions';
import {
  applyNeuralEditorOperations,
  createNeuralEditorOperationBatch,
  validateNeuralEditorOperations,
} from './editor.operations';
import { EditorContextMenusComponent } from './editor-context-menus.component';
import { EditorSuggestionMenusComponent } from './editor-suggestion-menus.component';
import {
  EditorBubbleMenuTemplateDirective,
  EditorFloatingMenuTemplateDirective,
  EditorLinkPopoverTemplateDirective,
} from './editor-context-menu-template.directives';
import { EditorToolbarComponent } from './editor-toolbar.component';
import {
  EditorCommandPaletteTemplateDirective,
  EditorMentionMenuTemplateDirective,
  EditorSlashMenuTemplateDirective,
} from './editor-suggestion-menu-template.directives';
import {
  EditorToolbarTemplateDirective,
  type NeuralEditorToolbarTemplateContext,
} from './editor-toolbar-template.directive';
import type {
  NeuralEditorAiAction,
  NeuralEditorAiConflictEvent,
  NeuralEditorAiPreviewResult,
  NeuralEditorAiProposal,
  NeuralEditorAiProposalAcceptedEvent,
  NeuralEditorAiProposalEvent,
  NeuralEditorAiProposalRejectedEvent,
  NeuralEditorAiRequest,
  NeuralEditorAiRequestCancelledEvent,
  NeuralEditorAiRequestEvent,
  NeuralEditorAiRequestOptions,
  NeuralEditorAiReviewState,
  NeuralEditorClasses,
  NeuralEditorCollaborationConfig,
  NeuralEditorCollaborationPresence,
  NeuralEditorCollaborationStatus,
  NeuralEditorCollaborationStatusEvent,
  NeuralEditorCollaborationUser,
  NeuralEditorCommentDeletedEvent,
  NeuralEditorCommentEvent,
  NeuralEditorCommentThread,
  NeuralEditorCommandExecutedEvent,
  NeuralEditorCommandPaletteItem,
  NeuralEditorColorOption,
  NeuralEditorContentErrorEvent,
  NeuralEditorController,
  NeuralEditorDocument,
  NeuralEditorExtension,
  NeuralEditorImageInsertRequestEvent,
  NeuralEditorMenuAppendTo,
  NeuralEditorMenuPlacement,
  NeuralEditorNodeIdGenerator,
  NeuralEditorOperationApplyResult,
  NeuralEditorOperationBatch,
  NeuralEditorOperationConflictEvent,
  NeuralEditorOperationsAppliedEvent,
  NeuralEditorOperationsRejectedEvent,
  NeuralEditorOperationValidationResult,
  NeuralEditorMentionItem,
  NeuralEditorMentionSelectedEvent,
  NeuralEditorSelectionEvent,
  NeuralEditorSelectionSnapshot,
  NeuralEditorSlashCommand,
  NeuralEditorSuggestionPlacement,
  NeuralEditorSuggestionProvider,
  NeuralEditorSuggestionRange,
  NeuralEditorSnapshot,
  NeuralEditorSnapshotEvent,
  NeuralEditorTrackedChange,
  NeuralEditorTrackedChangeEvent,
  NeuralEditorTrackedChangesMode,
  NeuralEditorToolbarItem,
  NeuralEditorUpdateEvent,
  NeuralEditorUpdateSource,
  NeuralEditorValue,
  NeuralEditorPresenceChangeEvent,
} from './editor.types';
import {
  addMissingNeuralEditorNodeIds,
  cloneNeuralEditorDocument,
  createNeuralEditorEmptyDocument,
  fromTiptapJson,
  isNeuralEditorDocument,
  neuralEditorDocumentsEqual,
  toTiptapJson,
} from './editor.utils';

@Injectable({ providedIn: 'root' })
class NeuralEditorIdGenerator {
  private readonly appId = inject(APP_ID);
  private nextId = 0;

  next(): string {
    return `${this.appId}-neural-editor-${this.nextId++}`;
  }
}

@Component({
  selector: 'neural-editor',
  standalone: true,
  imports: [
    EditorToolbarComponent,
    EditorAiReviewComponent,
    EditorCollaborationPanelComponent,
    EditorContextMenusComponent,
    EditorSuggestionMenusComponent,
    NgTemplateOutlet,
  ],
  template: `
    <div
      [class]="rootClass()"
      [attr.data-ready]="ready() ? 'true' : null"
      [attr.data-focused]="focused() ? 'true' : null"
      [attr.data-empty]="empty() ? 'true' : null"
      [attr.data-disabled]="effectiveDisabled() ? 'true' : null"
      [attr.data-readonly]="effectiveReadonly() ? 'true' : null"
      [attr.data-invalid]="effectiveInvalid() ? 'true' : null"
      [attr.data-pending]="effectivePending() ? 'true' : null"
      [attr.data-collaboration]="collaboration() ? collaborationStatus() : null"
      [attr.data-tracked-changes]="trackedChangesMode()"
    >
      @if (showToolbar()) {
        @if (toolbarTemplate(); as customToolbar) {
          <div
            [class]="toolbarClass()"
            role="toolbar"
            [attr.aria-label]="resolvedMessages().toolbar"
            [attr.aria-controls]="controlId()"
          >
            <ng-container
              [ngTemplateOutlet]="customToolbar.template"
              [ngTemplateOutletContext]="toolbarContext()"
            />
          </div>
        } @else {
          <neural-editor-toolbar
            [controller]="controller"
            [messages]="resolvedMessages()"
            [items]="toolbarItems()"
            [disabled]="!effectiveEditable()"
            [editorId]="controlId()"
            [toolbarClass]="toolbarClass()"
            [buttonClass]="toolbarButtonClass()"
            [buttonIconClass]="toolbarButtonIconClass()"
            [separatorClass]="toolbarSeparatorClass()"
            [textColors]="textColors()"
            [highlightColors]="highlightColors()"
            [menuClass]="toolbarMenuClass()"
            [menuButtonClass]="toolbarMenuButtonClass()"
            [menuPanelClass]="toolbarMenuPanelClass()"
            [menuActionClass]="toolbarMenuActionClass()"
            [colorOptionClass]="toolbarColorOptionClass()"
            [colorSwatchClass]="toolbarColorSwatchClass()"
          />
        }
      }

      <div #editorMount [class]="surfaceClass()"></div>

      <neural-editor-context-menus
        #contextMenus
        [controller]="controller"
        [messages]="resolvedMessages()"
        [editable]="effectiveEditable()"
        [editorId]="controlId()"
        [showBubbleMenu]="showBubbleMenu()"
        [showFloatingMenu]="showFloatingMenu()"
        [showLinkPopover]="showLinkPopover()"
        [bubbleMenuTemplate]="bubbleMenuTemplate()?.template ?? null"
        [floatingMenuTemplate]="floatingMenuTemplate()?.template ?? null"
        [linkPopoverTemplate]="linkPopoverTemplate()?.template ?? null"
        [bubbleMenuClass]="bubbleMenuClass()"
        [bubbleButtonClass]="bubbleMenuButtonClass()"
        [floatingMenuClass]="floatingMenuClass()"
        [floatingButtonClass]="floatingMenuButtonClass()"
        [linkPopoverClass]="linkPopoverClass()"
        [linkPopoverInputClass]="linkPopoverInputClass()"
        [linkPopoverActionClass]="linkPopoverActionClass()"
      />

      <neural-editor-suggestion-menus
        #suggestionMenus
        [controller]="controller"
        [messages]="resolvedMessages()"
        [editable]="effectiveEditable()"
        [editorId]="controlId()"
        [appendTarget]="menuAppendTarget"
        [contentElement]="editorContentElement"
        [commandPaletteItems]="effectiveCommandPaletteItems()"
        [slashMenuTemplate]="slashMenuTemplate()?.template ?? null"
        [mentionMenuTemplate]="mentionMenuTemplate()?.template ?? null"
        [commandPaletteTemplate]="commandPaletteTemplate()?.template ?? null"
        [slashMenuClass]="slashMenuClass()"
        [mentionMenuClass]="mentionMenuClass()"
        [suggestionListClass]="suggestionListClass()"
        [suggestionItemClass]="suggestionItemClass()"
        [suggestionItemIconClass]="suggestionItemIconClass()"
        [suggestionItemContentClass]="suggestionItemContentClass()"
        [suggestionItemLabelClass]="suggestionItemLabelClass()"
        [suggestionItemDescriptionClass]="suggestionItemDescriptionClass()"
        [suggestionStateClass]="suggestionStateClass()"
        [commandPaletteClass]="commandPaletteClass()"
        [commandPaletteBackdropClass]="commandPaletteBackdropClass()"
        [commandPalettePanelClass]="commandPalettePanelClass()"
        [commandPaletteInputClass]="commandPaletteInputClass()"
        [commandPaletteListClass]="commandPaletteListClass()"
        [commandPaletteItemClass]="commandPaletteItemClass()"
        (overlayOpened)="handleSuggestionOverlayOpened($event)"
        (closeSuggestionsRequested)="closeSuggestionMenus()"
        (commandExecuted)="commandExecuted.emit($event)"
        (mentionSelected)="mentionSelected.emit($event)"
      />

      <neural-editor-ai-review
        [controller]="controller"
        [messages]="resolvedMessages()"
        [state]="showAiReview() ? aiReview() : null"
        [editorId]="controlId()"
        [appendTarget]="menuAppendTarget"
        [strategy]="menuAppendTo() === 'body' ? 'fixed' : 'absolute'"
        [reviewTemplate]="aiReviewTemplate()?.template ?? null"
        [reviewClass]="aiReviewClass()"
        [summaryClass]="aiReviewSummaryClass()"
        [progressClass]="aiReviewProgressClass()"
        [actionsClass]="aiReviewActionsClass()"
        [buttonClass]="aiReviewButtonClass()"
      />

      @if (effectiveShowCollaborationPanel()) {
        <neural-editor-collaboration-panel
          [controller]="controller"
          [messages]="resolvedMessages()"
          [status]="collaborationStatus()"
          [presence]="presence()"
          [comments]="comments()"
          [trackedChanges]="trackedChanges()"
          [snapshots]="snapshots()"
          [commentsEnabled]="enableComments()"
          [trackedChangesEnabled]="trackedChangesMode() === 'suggesting'"
          [snapshotsEnabled]="enableSnapshots()"
          [disabled]="!effectiveEditable()"
          [panelClass]="collaborationPanelClass()"
          [barClass]="collaborationBarClass()"
          [statusClass]="collaborationStatusClass()"
          [presenceListClass]="presenceListClass()"
          [presenceItemClass]="presenceItemClass()"
          [sectionClass]="collaborationSectionClass()"
          [sectionTitleClass]="collaborationSectionTitleClass()"
          [inputClass]="collaborationInputClass()"
          [buttonClass]="collaborationButtonClass()"
          [threadClass]="commentThreadClass()"
          [messageClass]="commentMessageClass()"
          [trackedChangeClass]="trackedChangeClass()"
          [snapshotClass]="snapshotItemClass()"
        />
      }

      @if (showCharacterCount() || showWordCount()) {
        <footer [class]="footerClass()" aria-live="polite">
          @if (showCharacterCount()) {
            <span [class]="characterCountClass()">
              {{ characterCountLabel() }}
            </span>
          }
          @if (showWordCount()) {
            <span [class]="wordCountClass()">
              {{ wordCountLabel() }}
            </span>
          }
        </footer>
      }
    </div>
  `,
  styles: `
    :where(.neural-editor-host) {
      display: inline-block;
      min-width: 0;
      max-width: 100%;
    }
    :where(.neural-editor-host-fluid) {
      display: block;
      width: 100%;
    }
    :where(.neural-editor-root) {
      position: relative;
      box-sizing: border-box;
      display: grid;
      min-width: 0;
      max-width: 100%;
    }
    :where(.neural-editor-base) {
      width: var(--neural-editor-width, 36rem);
      color: var(--neural-editor-color, inherit);
      background: var(--neural-editor-background, transparent);
      border: var(--neural-editor-border, 1px solid currentColor);
      border-radius: var(--neural-editor-radius, 0.625rem);
      box-shadow: var(--neural-editor-shadow, none);
      font-family: var(--neural-editor-font-family, inherit);
      font-size: var(--neural-editor-font-size, 0.875rem);
      overflow: hidden;
      transition: var(--neural-editor-transition, none);
    }
    :where(.neural-editor-fluid-base) {
      width: 100%;
    }
    :where(.neural-editor-surface-root) {
      box-sizing: border-box;
      min-width: 0;
    }
    :where(.neural-editor-surface-base) {
      min-height: var(--neural-editor-min-height, 14rem);
      max-height: var(--neural-editor-max-height, none);
      overflow: auto;
      background: var(--neural-editor-content-background, transparent);
    }
    :where(.neural-editor-content-root) {
      box-sizing: border-box;
      min-width: 0;
      min-height: inherit;
    }
    :where(.neural-editor-content-base) {
      padding: var(--neural-editor-content-padding, 1rem);
      color: var(--neural-editor-content-color, inherit);
      caret-color: var(--neural-editor-caret-color, currentColor);
      font: inherit;
      line-height: var(--neural-editor-line-height, 1.6);
      outline: 0;
      overflow-wrap: anywhere;
    }
    :where(.neural-editor-content-base > :first-child) {
      margin-block-start: 0;
    }
    :where(.neural-editor-content-base > :last-child) {
      margin-block-end: 0;
    }
    :where(.neural-editor-content-base p.is-editor-empty:first-child::before) {
      float: left;
      height: 0;
      color: var(--neural-editor-placeholder-color, currentColor);
      content: attr(data-placeholder);
      opacity: var(--neural-editor-placeholder-opacity, 0.55);
      pointer-events: none;
    }
    :where(.neural-editor-content-base h1),
    :where(.neural-editor-content-base h2),
    :where(.neural-editor-content-base h3) {
      color: var(--neural-editor-heading-color, inherit);
      line-height: var(--neural-editor-heading-line-height, 1.25);
    }
    :where(.neural-editor-content-base h1) {
      font-size: var(--neural-editor-heading-1-size, 1.75rem);
    }
    :where(.neural-editor-content-base h2) {
      font-size: var(--neural-editor-heading-2-size, 1.4rem);
    }
    :where(.neural-editor-content-base h3) {
      font-size: var(--neural-editor-heading-3-size, 1.15rem);
    }
    :where(.neural-editor-content-base blockquote) {
      margin-inline: 0;
      padding-inline-start: var(--neural-editor-blockquote-padding, 1rem);
      color: var(--neural-editor-blockquote-color, inherit);
      border-inline-start: var(
        --neural-editor-blockquote-border,
        3px solid currentColor
      );
    }
    :where(.neural-editor-content-base code) {
      padding: var(--neural-editor-inline-code-padding, 0.1em 0.3em);
      background: var(--neural-editor-inline-code-background, currentColor);
      border-radius: var(--neural-editor-inline-code-radius, 0.25rem);
      font-family: var(
        --neural-editor-code-font-family,
        ui-monospace,
        monospace
      );
    }
    :where(.neural-editor-content-base pre) {
      padding: var(--neural-editor-code-block-padding, 0.85rem 1rem);
      overflow: auto;
      color: var(--neural-editor-code-block-color, inherit);
      background: var(--neural-editor-code-block-background, transparent);
      border-radius: var(--neural-editor-code-block-radius, 0.5rem);
    }
    :where(.neural-editor-content-base pre code) {
      padding: 0;
      color: inherit;
      background: transparent;
      border-radius: 0;
    }
    :where(.neural-editor-content-base a) {
      color: var(--neural-editor-link-color, currentColor);
      text-decoration: var(--neural-editor-link-decoration, underline);
      text-underline-offset: var(--neural-editor-link-underline-offset, 0.15em);
    }
    :where(.neural-editor-content-base [data-neural-editor-mention]) {
      padding: var(--neural-editor-mention-padding, 0.08em 0.3em);
      color: var(--neural-editor-mention-color, currentColor);
      background: var(--neural-editor-mention-background, transparent);
      border-radius: var(--neural-editor-mention-radius, 0.3em);
      box-decoration-break: clone;
    }
    :where(.neural-editor-content-base hr) {
      margin-block: var(--neural-editor-rule-margin, 1.25rem);
      border: 0;
      border-block-start: var(
        --neural-editor-rule-border,
        1px solid currentColor
      );
    }
    :where(.neural-editor-content-base ul:not([data-type='taskList'])),
    :where(.neural-editor-content-base ol) {
      margin-block: var(--neural-editor-list-margin, 0.75rem);
      padding-inline-start: var(--neural-editor-list-indent, 1.5rem);
      list-style-position: outside;
    }
    :where(.neural-editor-content-base ul:not([data-type='taskList'])) {
      list-style-type: disc;
    }
    :where(.neural-editor-content-base ol) {
      list-style-type: decimal;
    }
    :where(.neural-editor-content-base ul:not([data-type='taskList']) ul) {
      list-style-type: circle;
    }
    :where(.neural-editor-content-base ul:not([data-type='taskList']) ul ul) {
      list-style-type: square;
    }
    :where(.neural-editor-content-base ol ol) {
      list-style-type: lower-alpha;
    }
    :where(.neural-editor-content-base ol ol ol) {
      list-style-type: lower-roman;
    }
    :where(.neural-editor-content-base ul:not([data-type='taskList']) > li),
    :where(.neural-editor-content-base ol > li) {
      padding-inline-start: var(--neural-editor-list-item-padding, 0.25rem);
    }
    :where(
      .neural-editor-content-base ul:not([data-type='taskList']) > li::marker
    ),
    :where(.neural-editor-content-base ol > li::marker) {
      color: var(--neural-editor-list-marker-color, currentColor);
      font-weight: var(--neural-editor-list-marker-font-weight, inherit);
    }
    :where(.neural-editor-content-base ul[data-type='taskList']) {
      padding: 0;
      list-style: none;
    }
    :where(.neural-editor-content-base li[data-type='taskItem']) {
      display: flex;
      gap: var(--neural-editor-task-gap, 0.5rem);
      align-items: flex-start;
    }
    :where(.neural-editor-content-base li[data-type='taskItem'] > label) {
      flex: 0 0 auto;
      margin-block-start: var(--neural-editor-task-checkbox-offset, 0.3em);
      user-select: none;
    }
    :where(.neural-editor-content-base li[data-type='taskItem'] > div) {
      flex: 1 1 auto;
      min-width: 0;
    }
    :where(
      .neural-editor-content-base
        li[data-type='taskItem']
        input[type='checkbox']
    ) {
      width: var(--neural-editor-task-checkbox-size, 1rem);
      height: var(--neural-editor-task-checkbox-size, 1rem);
      margin: 0;
      accent-color: var(--neural-editor-task-checkbox-accent, currentColor);
    }
    :where(.neural-editor-content-base .tableWrapper) {
      max-width: 100%;
      margin-block: var(--neural-editor-table-margin, 1rem);
      overflow-x: auto;
    }
    :where(.neural-editor-content-base table) {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    :where(.neural-editor-content-base th),
    :where(.neural-editor-content-base td) {
      position: relative;
      min-width: var(--neural-editor-table-cell-min-width, 5rem);
      padding: var(--neural-editor-table-cell-padding, 0.5rem);
      vertical-align: top;
      border: var(--neural-editor-table-cell-border, 1px solid currentColor);
    }
    :where(.neural-editor-content-base th) {
      background: var(--neural-editor-table-header-background, transparent);
      font-weight: var(--neural-editor-table-header-font-weight, 600);
      text-align: start;
    }
    :where(.neural-editor-content-base .selectedCell::after) {
      position: absolute;
      z-index: 1;
      inset: 0;
      background: var(--neural-editor-table-selection-background, Highlight);
      content: '';
      opacity: var(--neural-editor-table-selection-opacity, 0.18);
      pointer-events: none;
    }
    :where(.neural-editor-content-base ::selection) {
      color: var(--neural-editor-selection-color, inherit);
      background: var(--neural-editor-selection-background, Highlight);
    }
    :where(.neural-editor-content-base img[data-neural-editor-image]) {
      display: block;
      max-width: 100%;
      height: auto;
      margin-block: var(--neural-editor-image-margin, 1rem);
      border-radius: var(--neural-editor-image-radius, 0.5rem);
    }
    :where(.neural-editor-content-base img.ProseMirror-selectednode) {
      outline: var(
        --neural-editor-image-selection-outline,
        2px solid currentColor
      );
      outline-offset: var(--neural-editor-image-selection-outline-offset, 3px);
    }
    :where(.neural-editor-base .neural-editor-ai-addition) {
      border-radius: var(--neural-editor-ai-change-radius, 0.25rem);
      background: var(
        --neural-editor-ai-addition-background,
        color-mix(in srgb, #16a34a 20%, transparent)
      );
      box-shadow: inset 0 0 0 1px
        var(--neural-editor-ai-addition-border-color, #16a34a);
      text-decoration: none;
    }
    :where(.neural-editor-base .neural-editor-ai-deletion) {
      border-radius: var(--neural-editor-ai-change-radius, 0.25rem);
      background: var(
        --neural-editor-ai-deletion-background,
        color-mix(in srgb, #dc2626 18%, transparent)
      );
      box-shadow: inset 0 0 0 1px
        var(--neural-editor-ai-deletion-border-color, #dc2626);
      text-decoration: line-through;
      text-decoration-thickness: 0.1em;
    }
    :where(.neural-editor-base .neural-editor-ai-update) {
      border-radius: var(--neural-editor-ai-change-radius, 0.25rem);
      box-shadow: inset 0 0 0 2px
        var(--neural-editor-ai-update-border-color, #2563eb);
    }
    :where(.neural-editor-base .neural-editor-ai-change-selected) {
      outline: var(--neural-editor-ai-selected-outline, 2px solid currentColor);
      outline-offset: var(--neural-editor-ai-selected-outline-offset, 2px);
    }
    :where(.neural-editor-base div.neural-editor-ai-addition) {
      margin-block: var(--neural-editor-ai-block-margin, 0.5rem);
      padding: var(--neural-editor-ai-block-padding, 0.5rem);
    }
    :where(.neural-editor-content-base .neural-editor-comment-anchor) {
      border-radius: var(--neural-editor-comment-radius, 0.2em);
      background: var(
        --neural-editor-comment-background,
        color-mix(in srgb, #f59e0b 22%, transparent)
      );
      box-shadow: inset 0 -2px 0
        var(--neural-editor-comment-border-color, #f59e0b);
    }
    :where(.neural-editor-content-base .neural-editor-tracked-insertion) {
      border-radius: var(--neural-editor-tracked-change-radius, 0.2em);
      background: var(
        --neural-editor-tracked-insertion-background,
        color-mix(in srgb, #16a34a 18%, transparent)
      );
      text-decoration: underline;
      text-decoration-color: var(
        --neural-editor-tracked-insertion-color,
        #16a34a
      );
    }
    :where(.neural-editor-content-base .neural-editor-tracked-deletion) {
      border-radius: var(--neural-editor-tracked-change-radius, 0.2em);
      background: var(
        --neural-editor-tracked-deletion-background,
        color-mix(in srgb, #dc2626 16%, transparent)
      );
      text-decoration: line-through;
      text-decoration-color: var(
        --neural-editor-tracked-deletion-color,
        #dc2626
      );
    }
    :where(.neural-editor-content-base .neural-editor-collaboration-caret) {
      position: relative;
      margin-inline: -1px;
      border-inline-start: 2px solid
        var(--neural-editor-collaboration-user-color, #2563eb);
      pointer-events: none;
    }
    :where(
      .neural-editor-content-base .neural-editor-collaboration-caret-label
    ) {
      position: absolute;
      inset-block-end: calc(100% + 0.2rem);
      inset-inline-start: -1px;
      z-index: 3;
      padding: 0.1rem 0.3rem;
      color: white;
      background: var(--neural-editor-collaboration-user-color, #2563eb);
      border-radius: 0.25rem 0.25rem 0.25rem 0;
      font-size: 0.7rem;
      font-weight: 600;
      line-height: 1.3;
      white-space: nowrap;
      user-select: none;
    }
    :where(.neural-editor-content-base .neural-editor-collaboration-selection) {
      background: color-mix(
        in srgb,
        var(--neural-editor-collaboration-user-color, #2563eb) 25%,
        transparent
      );
    }
    :where(.neural-editor-footer-root) {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      min-width: 0;
    }
    :where(.neural-editor-footer-base) {
      gap: var(--neural-editor-footer-gap, 0.75rem);
      padding: var(--neural-editor-footer-padding, 0.4rem 0.75rem);
      color: var(--neural-editor-footer-color, inherit);
      background: var(--neural-editor-footer-background, transparent);
      border-block-start: var(
        --neural-editor-footer-border,
        1px solid currentColor
      );
      font-size: var(--neural-editor-footer-font-size, 0.75rem);
    }
    :where(.neural-editor-count-root) {
      flex: 0 0 auto;
      font-variant-numeric: tabular-nums;
    }
    :where(.neural-editor-root[data-focused='true'].neural-editor-base) {
      border-color: var(--neural-editor-border-color-focus, currentColor);
      box-shadow: var(--neural-editor-shadow-focus, none);
      outline: var(--neural-editor-focus-ring, 2px solid currentColor);
      outline-offset: var(--neural-editor-focus-ring-offset, 2px);
    }
    :where(.neural-editor-root[data-invalid='true'].neural-editor-base) {
      border-color: var(--neural-editor-border-color-invalid, currentColor);
      box-shadow: var(--neural-editor-shadow-invalid, none);
    }
    :where(.neural-editor-root[data-readonly='true']) {
      color: var(--neural-editor-color-readonly, inherit);
    }
    :where(.neural-editor-root[data-disabled='true']) {
      opacity: var(--neural-editor-disabled-opacity, 0.5);
    }
    @media (prefers-reduced-motion: reduce) {
      :where(.neural-editor-base),
      :where(.neural-editor-toolbar-button-base) {
        transition-duration: 0.01ms !important;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neural-editor-host',
    '[class.neural-editor-host-fluid]': 'effectiveFluid()',
  },
})
export class NeuralEditor implements FormValueControl<NeuralEditorValue> {
  private readonly config = inject(NEURAL_NG_CONFIG);
  private readonly document = inject(DOCUMENT);
  private readonly locale = inject(NeuralLocaleService);
  private readonly generatedId = inject(NeuralEditorIdGenerator).next();
  protected readonly field = inject(NEURAL_FIELD_CONTEXT, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly editorMount =
    viewChild.required<ElementRef<HTMLElement>>('editorMount');
  private readonly contextMenus =
    viewChild.required<EditorContextMenusComponent>('contextMenus');
  private readonly suggestionMenus =
    viewChild.required<EditorSuggestionMenusComponent>('suggestionMenus');
  readonly toolbarTemplate = contentChild(EditorToolbarTemplateDirective);
  readonly bubbleMenuTemplate = contentChild(EditorBubbleMenuTemplateDirective);
  readonly floatingMenuTemplate = contentChild(
    EditorFloatingMenuTemplateDirective,
  );
  readonly linkPopoverTemplate = contentChild(
    EditorLinkPopoverTemplateDirective,
  );
  readonly slashMenuTemplate = contentChild(EditorSlashMenuTemplateDirective);
  readonly mentionMenuTemplate = contentChild(
    EditorMentionMenuTemplateDirective,
  );
  readonly commandPaletteTemplate = contentChild(
    EditorCommandPaletteTemplateDirective,
  );
  readonly aiReviewTemplate = contentChild(EditorAiReviewTemplateDirective);

  readonly value = model<NeuralEditorValue>(createNeuralEditorEmptyDocument());
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly pending = input(false, { transform: booleanAttribute });
  readonly touched = input(false, { transform: booleanAttribute });
  readonly dirty = input(false, { transform: booleanAttribute });
  readonly placeholder = input('');
  readonly autofocus = input(false, { transform: booleanAttribute });
  readonly spellcheck = input(true, { transform: booleanAttribute });
  readonly showToolbar = input(true, { transform: booleanAttribute });
  readonly showCharacterCount = input(false, {
    transform: booleanAttribute,
  });
  readonly showWordCount = input(false, { transform: booleanAttribute });
  readonly showBubbleMenu = input(true, { transform: booleanAttribute });
  readonly showFloatingMenu = input(true, { transform: booleanAttribute });
  readonly showLinkPopover = input(true, { transform: booleanAttribute });
  readonly showSlashMenu = input(true, { transform: booleanAttribute });
  readonly showMentionMenu = input(true, { transform: booleanAttribute });
  readonly showCommandPalette = input(true, { transform: booleanAttribute });
  readonly showAiReview = input(true, { transform: booleanAttribute });
  readonly collaboration = input<NeuralEditorCollaborationConfig | null>(null);
  readonly collaborationUser = input<NeuralEditorCollaborationUser | null>(
    null,
  );
  readonly enableComments = input(false, { transform: booleanAttribute });
  readonly trackedChangesMode = input<NeuralEditorTrackedChangesMode>('off');
  readonly enableSnapshots = input(false, { transform: booleanAttribute });
  readonly showCollaborationPanel = input(true, {
    transform: booleanAttribute,
  });
  readonly snapshots = model<readonly NeuralEditorSnapshot[]>([]);
  readonly allowBase64Images = input(false, { transform: booleanAttribute });
  readonly enableNodeIds = input(true, { transform: booleanAttribute });
  readonly nodeIdAttribute = input(NEURAL_EDITOR_DEFAULT_NODE_ID_ATTRIBUTE);
  readonly identifiedNodeTypes = input<readonly string[]>(
    NEURAL_EDITOR_DEFAULT_IDENTIFIED_NODE_TYPES,
  );
  readonly nodeIdGenerator = input<NeuralEditorNodeIdGenerator>(
    createNeuralEditorNodeId,
  );
  readonly menuAppendTo = input<NeuralEditorMenuAppendTo>('body');
  readonly bubbleMenuPlacement = input<NeuralEditorMenuPlacement>('top');
  readonly floatingMenuPlacement =
    input<NeuralEditorMenuPlacement>('left-start');
  readonly slashMenuPlacement =
    input<NeuralEditorSuggestionPlacement>('bottom-start');
  readonly mentionMenuPlacement =
    input<NeuralEditorSuggestionPlacement>('bottom-start');
  readonly slashDebounce = input(0, { transform: numberAttribute });
  readonly mentionDebounce = input(150, { transform: numberAttribute });
  readonly mentionTrigger = input('@');
  readonly mentionMinimumQueryLength = input(0, { transform: numberAttribute });
  readonly slashCommands = input<readonly NeuralEditorSlashCommand[] | null>(
    null,
  );
  readonly slashCommandProvider =
    input<NeuralEditorSuggestionProvider<NeuralEditorSlashCommand> | null>(
      null,
    );
  readonly mentionProvider =
    input<NeuralEditorSuggestionProvider<NeuralEditorMentionItem> | null>(null);
  readonly commandPaletteItems = input<
    readonly NeuralEditorCommandPaletteItem[] | null
  >(null);
  readonly includeDefaultExtensions = input(true, {
    transform: booleanAttribute,
  });
  readonly extensions = input<readonly NeuralEditorExtension[]>([]);
  readonly toolbarItems = input<readonly NeuralEditorToolbarItem[]>(
    NEURAL_EDITOR_DEFAULT_TOOLBAR,
  );
  readonly textColors = input<readonly NeuralEditorColorOption[]>(
    NEURAL_EDITOR_DEFAULT_TEXT_COLORS,
  );
  readonly highlightColors = input<readonly NeuralEditorColorOption[]>(
    NEURAL_EDITOR_DEFAULT_HIGHLIGHT_COLORS,
  );
  readonly messages = input<Partial<NeuralEditorMessages>>({});
  readonly name = input('');
  readonly editorId = input('');
  readonly ariaLabel = input('');
  readonly ariaLabelledBy = input('');
  readonly ariaDescription = input('');
  readonly fluid = input(false, { transform: booleanAttribute });
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly editorClass = input('');
  readonly contentClass = input('');
  readonly classes = input<NeuralEditorClasses>({});

  readonly editorReady = output<NeuralEditorController>();
  readonly editorUpdate = output<NeuralEditorUpdateEvent>();
  readonly selectionChange = output<NeuralEditorSelectionEvent>();
  readonly imageInsertRequest = output<NeuralEditorImageInsertRequestEvent>();
  readonly commandExecuted = output<NeuralEditorCommandExecutedEvent>();
  readonly mentionSelected = output<NeuralEditorMentionSelectedEvent>();
  readonly operationsApplied = output<NeuralEditorOperationsAppliedEvent>();
  readonly operationsRejected = output<NeuralEditorOperationsRejectedEvent>();
  readonly operationConflict = output<NeuralEditorOperationConflictEvent>();
  readonly aiRequest = output<NeuralEditorAiRequestEvent>();
  readonly aiRequestCancelled = output<NeuralEditorAiRequestCancelledEvent>();
  readonly aiProposalPreviewed = output<NeuralEditorAiProposalEvent>();
  readonly aiProposalAccepted = output<NeuralEditorAiProposalAcceptedEvent>();
  readonly aiProposalRejected = output<NeuralEditorAiProposalRejectedEvent>();
  readonly aiOperationConflict = output<NeuralEditorAiConflictEvent>();
  readonly collaborationStatusChange =
    output<NeuralEditorCollaborationStatusEvent>();
  readonly presenceChange = output<NeuralEditorPresenceChangeEvent>();
  readonly commentCreated = output<NeuralEditorCommentEvent>();
  readonly commentUpdated = output<NeuralEditorCommentEvent>();
  readonly commentDeleted = output<NeuralEditorCommentDeletedEvent>();
  readonly trackedChangeAccepted = output<NeuralEditorTrackedChangeEvent>();
  readonly trackedChangeRejected = output<NeuralEditorTrackedChangeEvent>();
  readonly snapshotCreated = output<NeuralEditorSnapshotEvent>();
  readonly snapshotRestored = output<NeuralEditorSnapshotEvent>();
  readonly snapshotDeleted = output<NeuralEditorSnapshotEvent>();
  readonly editorFocus = output<FocusEvent>();
  readonly editorBlur = output<FocusEvent>();
  readonly contentError = output<NeuralEditorContentErrorEvent>();
  readonly editorPaste = output<ClipboardEvent>();
  readonly editorDrop = output<DragEvent>();
  readonly touch = output<void>();

  readonly menuAppendTarget = () => this.resolveMenuAppendTarget();
  readonly editorContentElement = () =>
    (this.editorSignal()?.view.dom as HTMLElement | undefined) ?? null;

  private readonly editorSignal = signal<Editor | null>(null);
  private readonly revision = signal(0);
  private readonly documentRevision = signal(0);
  private readonly activeAiReview = signal<NeuralEditorAiReviewState | null>(
    null,
  );
  private readonly pendingAiRequests = signal<readonly NeuralEditorAiRequest[]>(
    [],
  );
  private readonly collaborationUserOverride = signal<
    NeuralEditorCollaborationUser | null | undefined
  >(undefined);
  readonly activeCollaborationUser = computed(
    () => this.collaborationUserOverride() ?? this.collaborationUser(),
  );
  readonly collaborationStatus =
    signal<NeuralEditorCollaborationStatus>('disabled');
  readonly collaborationSynced = signal(false);
  readonly presence = signal<readonly NeuralEditorCollaborationPresence[]>([]);
  readonly comments = signal<readonly NeuralEditorCommentThread[]>([]);
  readonly activeCommentId = signal<string | null>(null);
  readonly trackedChanges = signal<readonly NeuralEditorTrackedChange[]>([]);
  private commentRepository: NeuralEditorCommentRepository | null = null;
  private disposeCommentRepository: (() => void) | null = null;
  private disposeCollaborationProvider: (() => void) | null = null;
  private lastUpdateSource: NeuralEditorUpdateSource = 'user';
  readonly focused = signal(false);
  private commandDepth = 0;
  private applyingAiProposal = false;
  private readyEmitted = false;
  private initialDocument = createNeuralEditorEmptyDocument();

  readonly effectiveUnstyled = computed(
    () =>
      this.unstyled() ||
      this.field?.effectiveUnstyled() ||
      this.config.unstyled,
  );
  readonly effectiveFluid = computed(() => this.fluid() || this.field?.fluid());
  readonly effectiveDisabled = computed(
    () => this.disabled() || (this.field?.disabled() ?? false),
  );
  readonly effectiveReadonly = computed(
    () => this.readonly() || (this.field?.readonly() ?? false),
  );
  readonly effectiveRequired = computed(
    () => this.required() || (this.field?.required() ?? false),
  );
  readonly effectiveInvalid = computed(
    () => this.invalid() || (this.field?.invalid() ?? false),
  );
  readonly effectivePending = computed(
    () => this.pending() || (this.field?.pending() ?? false),
  );
  readonly effectiveEditable = computed(
    () => !this.effectiveDisabled() && !this.effectiveReadonly(),
  );
  readonly effectiveShowCollaborationPanel = computed(
    () =>
      this.showCollaborationPanel() &&
      (this.collaboration() !== null ||
        this.enableComments() ||
        this.trackedChangesMode() === 'suggesting' ||
        this.enableSnapshots()),
  );
  readonly controlId = computed(
    () => this.field?.controlId() || this.editorId() || this.generatedId,
  );
  readonly describedBy = computed(
    () => this.field?.controlDescribedBy() || null,
  );
  readonly ready = computed(() => this.editorSignal() !== null);
  readonly effectiveNodeIdAttribute = computed(() =>
    normalizeNodeIdAttribute(this.nodeIdAttribute()),
  );
  readonly effectiveIdentifiedNodeTypes = computed(() =>
    normalizeIdentifiedNodeTypes(this.identifiedNodeTypes()),
  );
  readonly empty = computed(() => {
    this.revision();
    return this.editorSignal()?.isEmpty ?? true;
  });
  readonly characterCount = computed(() => {
    this.revision();
    return readCharacterCount(this.editorSignal());
  });
  readonly wordCount = computed(() => {
    this.revision();
    return readWordCount(this.editorSignal());
  });
  readonly canUndo = computed(() => {
    this.revision();
    return this.editorSignal()?.can().chain().undo().run() ?? false;
  });
  readonly canRedo = computed(() => {
    this.revision();
    return this.editorSignal()?.can().chain().redo().run() ?? false;
  });
  readonly resolvedMessages = computed<NeuralEditorMessages>(() => ({
    ...this.locale.messages().editor,
    ...this.messages(),
  }));
  readonly effectiveSlashCommands = computed(
    () =>
      this.slashCommands() ??
      createNeuralEditorDefaultSlashCommands(this.resolvedMessages()),
  );
  readonly effectiveCommandPaletteItems = computed(
    () =>
      this.commandPaletteItems() ??
      createNeuralEditorDefaultCommandPaletteItems(this.resolvedMessages()),
  );
  readonly commandPaletteOpen = computed(
    () => this.suggestionMenus()?.commandPaletteOpen() ?? false,
  );
  readonly aiReview = this.activeAiReview.asReadonly();
  readonly aiRequestPending = computed(
    () => this.pendingAiRequests().length > 0,
  );
  readonly effectivePlaceholder = computed(
    () => this.placeholder() || this.resolvedMessages().placeholder,
  );
  readonly characterCountLabel = computed(() =>
    this.locale.format(this.resolvedMessages().characterCount, {
      count: this.characterCount(),
      max: this.maxCharacters() ?? '',
    }),
  );
  readonly wordCountLabel = computed(() =>
    this.locale.format(this.resolvedMessages().wordCount, {
      count: this.wordCount(),
    }),
  );

  readonly rootClass = computed(() =>
    this.compose(
      'neural-editor-root',
      `neural-editor-base ${this.effectiveFluid() ? 'neural-editor-fluid-base' : ''}`,
      this.editorClass(),
      this.classes().root,
    ),
  );
  readonly toolbarClass = computed(() =>
    this.compose(
      'neural-editor-toolbar-root',
      'neural-editor-toolbar-base',
      this.classes().toolbar,
    ),
  );
  readonly toolbarButtonClass = computed(() =>
    this.compose(
      'neural-editor-toolbar-button-root',
      'neural-editor-toolbar-button-base',
      this.classes().toolbarButton,
    ),
  );
  readonly toolbarButtonIconClass = computed(
    () => this.classes().toolbarButtonIcon?.trim() ?? '',
  );
  readonly toolbarSeparatorClass = computed(() =>
    this.compose(
      'neural-editor-toolbar-separator-root',
      'neural-editor-toolbar-separator-base',
      this.classes().toolbarSeparator,
    ),
  );
  readonly toolbarMenuClass = computed(() =>
    this.compose(
      'neural-editor-toolbar-menu-root',
      'neural-editor-toolbar-menu-base',
      this.classes().toolbarMenu,
    ),
  );
  readonly toolbarMenuButtonClass = computed(() =>
    this.compose(
      'neural-editor-toolbar-menu-button-root',
      'neural-editor-toolbar-menu-button-base',
      this.classes().toolbarMenuButton,
    ),
  );
  readonly toolbarMenuPanelClass = computed(() =>
    this.compose(
      'neural-editor-toolbar-menu-panel-root',
      'neural-editor-toolbar-menu-panel-base',
      this.classes().toolbarMenuPanel,
    ),
  );
  readonly toolbarMenuActionClass = computed(() =>
    this.compose(
      'neural-editor-toolbar-menu-action-root',
      'neural-editor-toolbar-menu-action-base',
      this.classes().toolbarMenuAction,
    ),
  );
  readonly toolbarColorOptionClass = computed(() =>
    this.compose(
      'neural-editor-toolbar-color-option-root',
      'neural-editor-toolbar-color-option-base',
      this.classes().toolbarColorOption,
    ),
  );
  readonly toolbarColorSwatchClass = computed(() =>
    this.compose(
      'neural-editor-toolbar-color-swatch-root',
      'neural-editor-toolbar-color-swatch-base',
      this.classes().toolbarColorSwatch,
    ),
  );
  readonly bubbleMenuClass = computed(() =>
    this.compose(
      'neural-editor-bubble-menu-root',
      'neural-editor-bubble-menu-base',
      this.classes().bubbleMenu,
    ),
  );
  readonly bubbleMenuButtonClass = computed(() =>
    this.compose(
      'neural-editor-context-menu-button-root',
      'neural-editor-context-menu-button-base',
      this.classes().bubbleMenuButton,
    ),
  );
  readonly floatingMenuClass = computed(() =>
    this.compose(
      'neural-editor-floating-menu-root',
      'neural-editor-floating-menu-base',
      this.classes().floatingMenu,
    ),
  );
  readonly floatingMenuButtonClass = computed(() =>
    this.compose(
      'neural-editor-context-menu-button-root',
      'neural-editor-context-menu-button-base',
      this.classes().floatingMenuButton,
    ),
  );
  readonly linkPopoverClass = computed(() =>
    this.compose(
      'neural-editor-link-popover-root',
      'neural-editor-link-popover-base',
      this.classes().linkPopover,
    ),
  );
  readonly linkPopoverInputClass = computed(() =>
    this.compose(
      'neural-editor-link-popover-input-root',
      'neural-editor-link-popover-input-base',
      this.classes().linkPopoverInput,
    ),
  );
  readonly linkPopoverActionClass = computed(() =>
    this.compose(
      'neural-editor-link-popover-action-root',
      'neural-editor-link-popover-action-base',
      this.classes().linkPopoverAction,
    ),
  );
  readonly slashMenuClass = computed(() =>
    this.compose(
      'neural-editor-suggestion-menu-root neural-editor-slash-menu-root',
      'neural-editor-suggestion-menu-base neural-editor-slash-menu-base',
      this.classes().slashMenu,
    ),
  );
  readonly mentionMenuClass = computed(() =>
    this.compose(
      'neural-editor-suggestion-menu-root neural-editor-mention-menu-root',
      'neural-editor-suggestion-menu-base neural-editor-mention-menu-base',
      this.classes().mentionMenu,
    ),
  );
  readonly suggestionListClass = computed(() =>
    this.compose(
      'neural-editor-suggestion-list-root',
      'neural-editor-suggestion-list-base',
      this.classes().suggestionList,
    ),
  );
  readonly suggestionItemClass = computed(() =>
    this.compose(
      'neural-editor-suggestion-item-root',
      'neural-editor-suggestion-item-base',
      this.classes().suggestionItem,
    ),
  );
  readonly suggestionItemIconClass = computed(() =>
    this.compose(
      'neural-editor-suggestion-item-icon-root',
      'neural-editor-suggestion-item-icon-base',
      this.classes().suggestionItemIcon,
    ),
  );
  readonly suggestionItemContentClass = computed(() =>
    this.compose(
      'neural-editor-suggestion-item-content-root',
      'neural-editor-suggestion-item-content-base',
      this.classes().suggestionItemContent,
    ),
  );
  readonly suggestionItemLabelClass = computed(() =>
    this.compose(
      'neural-editor-suggestion-item-label-root',
      'neural-editor-suggestion-item-label-base',
      this.classes().suggestionItemLabel,
    ),
  );
  readonly suggestionItemDescriptionClass = computed(() =>
    this.compose(
      'neural-editor-suggestion-item-description-root',
      'neural-editor-suggestion-item-description-base',
      this.classes().suggestionItemDescription,
    ),
  );
  readonly suggestionStateClass = computed(() =>
    this.compose(
      'neural-editor-suggestion-state-root',
      'neural-editor-suggestion-state-base',
      this.classes().suggestionState,
    ),
  );
  readonly commandPaletteClass = computed(() =>
    this.compose(
      'neural-editor-command-palette-root',
      'neural-editor-command-palette-base',
      this.classes().commandPalette,
    ),
  );
  readonly commandPaletteBackdropClass = computed(() =>
    this.compose(
      'neural-editor-command-palette-backdrop-root',
      'neural-editor-command-palette-backdrop-base',
      this.classes().commandPaletteBackdrop,
    ),
  );
  readonly commandPalettePanelClass = computed(() =>
    this.compose(
      'neural-editor-command-palette-panel-root',
      'neural-editor-command-palette-panel-base',
      this.classes().commandPalettePanel,
    ),
  );
  readonly commandPaletteInputClass = computed(() =>
    this.compose(
      'neural-editor-command-palette-input-root',
      'neural-editor-command-palette-input-base',
      this.classes().commandPaletteInput,
    ),
  );
  readonly commandPaletteListClass = computed(() =>
    this.compose(
      'neural-editor-command-palette-list-root',
      'neural-editor-command-palette-list-base',
      this.classes().commandPaletteList,
    ),
  );
  readonly commandPaletteItemClass = computed(() =>
    this.compose(
      'neural-editor-suggestion-item-root neural-editor-command-palette-item-root',
      'neural-editor-suggestion-item-base neural-editor-command-palette-item-base',
      this.classes().commandPaletteItem,
    ),
  );
  readonly aiReviewClass = computed(() =>
    this.compose(
      'neural-editor-ai-review-root',
      'neural-editor-ai-review-base',
      this.classes().aiReview,
    ),
  );
  readonly aiReviewSummaryClass = computed(() =>
    this.compose(
      'neural-editor-ai-review-summary-root',
      'neural-editor-ai-review-summary-base',
      this.classes().aiReviewSummary,
    ),
  );
  readonly aiReviewProgressClass = computed(() =>
    this.compose(
      'neural-editor-ai-review-progress-root',
      'neural-editor-ai-review-progress-base',
      this.classes().aiReviewProgress,
    ),
  );
  readonly aiReviewActionsClass = computed(() =>
    this.compose(
      'neural-editor-ai-review-actions-root',
      'neural-editor-ai-review-actions-base',
      this.classes().aiReviewActions,
    ),
  );
  readonly aiReviewButtonClass = computed(() =>
    this.compose(
      'neural-editor-ai-review-button-root',
      'neural-editor-ai-review-button-base',
      this.classes().aiReviewButton,
    ),
  );
  readonly collaborationPanelClass = computed(() =>
    this.compose(
      'neural-editor-collaboration-panel-root',
      'neural-editor-collaboration-panel-base',
      this.classes().collaborationPanel,
    ),
  );
  readonly collaborationBarClass = computed(() =>
    this.compose(
      'neural-editor-collaboration-bar-root',
      'neural-editor-collaboration-bar-base',
      this.classes().collaborationBar,
    ),
  );
  readonly collaborationStatusClass = computed(() =>
    this.compose(
      'neural-editor-collaboration-status-root',
      'neural-editor-collaboration-status-base',
      this.classes().collaborationStatus,
    ),
  );
  readonly presenceListClass = computed(() =>
    this.compose(
      'neural-editor-presence-list-root',
      'neural-editor-presence-list-base',
      this.classes().presenceList,
    ),
  );
  readonly presenceItemClass = computed(() =>
    this.compose(
      'neural-editor-presence-item-root',
      'neural-editor-presence-item-base',
      this.classes().presenceItem,
    ),
  );
  readonly collaborationSectionClass = computed(() =>
    this.compose(
      'neural-editor-collaboration-section-root',
      'neural-editor-collaboration-section-base',
      this.classes().collaborationSection,
    ),
  );
  readonly collaborationSectionTitleClass = computed(() =>
    this.compose(
      'neural-editor-collaboration-section-title-root',
      'neural-editor-collaboration-section-title-base',
      this.classes().collaborationSectionTitle,
    ),
  );
  readonly collaborationInputClass = computed(() =>
    this.compose(
      'neural-editor-collaboration-input-root',
      'neural-editor-collaboration-input-base',
      this.classes().collaborationInput,
    ),
  );
  readonly collaborationButtonClass = computed(() =>
    this.compose(
      'neural-editor-collaboration-button-root',
      'neural-editor-collaboration-button-base',
      this.classes().collaborationButton,
    ),
  );
  readonly commentThreadClass = computed(() =>
    this.compose(
      'neural-editor-comment-thread-root',
      'neural-editor-comment-thread-base',
      this.classes().commentThread,
    ),
  );
  readonly commentMessageClass = computed(() =>
    this.compose(
      'neural-editor-comment-message-root',
      'neural-editor-comment-message-base',
      this.classes().commentMessage,
    ),
  );
  readonly trackedChangeClass = computed(() =>
    this.compose(
      'neural-editor-tracked-change-root',
      'neural-editor-tracked-change-base',
      this.classes().trackedChange,
    ),
  );
  readonly snapshotItemClass = computed(() =>
    this.compose(
      'neural-editor-snapshot-item-root',
      'neural-editor-snapshot-item-base',
      this.classes().snapshotItem,
    ),
  );
  readonly surfaceClass = computed(() =>
    this.compose(
      'neural-editor-surface-root',
      'neural-editor-surface-base',
      this.classes().surface,
    ),
  );
  readonly contentClassName = computed(() =>
    this.compose(
      'neural-editor-content-root',
      'neural-editor-content-base',
      this.contentClass(),
      this.classes().content,
    ),
  );
  readonly footerClass = computed(() =>
    this.compose(
      'neural-editor-footer-root',
      'neural-editor-footer-base',
      this.classes().footer,
    ),
  );
  readonly characterCountClass = computed(() =>
    this.compose(
      'neural-editor-count-root',
      'neural-editor-count-base',
      this.classes().characterCount,
    ),
  );
  readonly wordCountClass = computed(() =>
    this.compose(
      'neural-editor-count-root',
      'neural-editor-count-base',
      this.classes().wordCount,
    ),
  );
  readonly toolbarContext = computed<NeuralEditorToolbarTemplateContext>(
    () => ({
      $implicit: this.controller,
      editor: this.controller,
    }),
  );

  readonly controller: NeuralEditorController = new NeuralEditorControllerImpl(
    this.controllerAdapter(),
  );

  constructor() {
    afterNextRender(() => void this.initializeEditor());

    effect(() => {
      const editor = this.editorSignal();
      const nextValue = this.value();
      if (!editor || this.collaboration()) return;
      this.syncExternalValue(editor, nextValue);
    });

    effect(() => {
      const editor = this.editorSignal();
      if (!editor) return;
      editor.setEditable(this.effectiveEditable(), false);
      this.syncEditorDomAttributes(editor);
      if (!this.effectiveEditable()) {
        this.closeAllEditorOverlays(false);
        if (this.activeAiReview()) {
          this.rejectActiveAiProposal('editor-state');
        }
      }
    });

    effect(() => {
      const editor = this.editorSignal();
      const user = this.activeCollaborationUser();
      if (!editor || !user || !this.collaboration()) return;
      editor.commands.updateUser?.(user);
      this.refreshPresence();
    });

    this.destroyRef.onDestroy(() => {
      this.disposeCommentRepository?.();
      this.disposeCommentRepository = null;
      this.commentRepository?.destroy();
      this.commentRepository = null;
      this.disposeCollaborationProvider?.();
      this.disposeCollaborationProvider = null;
      if (this.collaboration()?.disconnectOnDestroy) {
        this.collaboration()?.provider?.disconnect?.();
      }
      this.editorSignal()?.destroy();
      this.contextMenus().detachMovedElements();
      this.editorSignal.set(null);
    });
  }

  readonly maxCharacters = input<number | undefined, unknown>(undefined, {
    transform: optionalNumberAttribute,
  });

  focus(options?: FocusOptions): void {
    this.editorSignal()?.view.dom.focus(options);
  }

  clear(): void {
    const empty = createNeuralEditorEmptyDocument();
    this.value.set(empty);
    this.setEditorContent(empty, false);
  }

  reset(): void {
    const initial = cloneNeuralEditorDocument(this.initialDocument);
    this.value.set(initial);
    this.setEditorContent(initial, false);
  }

  private async initializeEditor(): Promise<void> {
    const suppliedValue = this.value();
    if (!isNeuralEditorDocument(suppliedValue)) {
      this.emitContentError(
        suppliedValue,
        new TypeError(
          'Editor value must be a NeuralEditorDocument with type "doc".',
        ),
      );
    }

    const suppliedInitial = isNeuralEditorDocument(suppliedValue)
      ? cloneNeuralEditorDocument(suppliedValue)
      : createNeuralEditorEmptyDocument();
    const initial = this.prepareDocument(suppliedInitial);
    if (!neuralEditorDocumentsEqual(suppliedInitial, initial)) {
      this.value.set(initial);
    }
    this.initialDocument = cloneNeuralEditorDocument(initial);

    const collaboration = this.collaboration();
    this.disposeCommentRepository?.();
    this.commentRepository?.destroy();
    this.commentRepository = createNeuralEditorCommentRepository(collaboration);
    this.disposeCommentRepository = this.commentRepository.subscribe(() =>
      this.refreshComments(),
    );
    this.refreshComments();

    if (collaboration) {
      this.setCollaborationStatus('connecting');
      try {
        await prepareNeuralEditorCollaboration(collaboration, (status) =>
          this.setCollaborationStatus(status),
        );
        this.collaborationSynced.set(this.collaborationStatus() === 'synced');
        if (this.destroyRef.destroyed) return;
      } catch (error) {
        this.setCollaborationStatus('error');
        this.emitContentError(collaboration, asError(error));
        return;
      }
      this.disposeCollaborationProvider = subscribeNeuralEditorProvider(
        collaboration.provider,
        {
          status: (status) => this.setCollaborationStatus(status),
          synced: () => this.collaborationSynced.set(true),
          presence: () => this.refreshPresence(),
        },
      );
      this.refreshPresence();
    } else {
      this.setCollaborationStatus('disabled');
    }

    this.contextMenus().attachTo(this.resolveMenuAppendTarget());
    const editor = new Editor({
      element: this.editorMount().nativeElement,
      extensions: createNeuralEditorExtensions({
        includeDefaultExtensions: this.includeDefaultExtensions(),
        collaboration,
        collaborationUser: () => this.activeCollaborationUser(),
        commentsEnabled: () => this.enableComments(),
        onCommentActivated: (threadId) => this.activateComment(threadId),
        trackedChangesEnabled: () => this.trackedChangesMode() === 'suggesting',
        placeholder: this.effectivePlaceholder(),
        maxCharacters: this.maxCharacters(),
        taskCheckedLabel: this.resolvedMessages().taskChecked,
        taskUncheckedLabel: this.resolvedMessages().taskUnchecked,
        allowBase64Images: this.allowBase64Images(),
        enableNodeIds: this.enableNodeIds(),
        nodeIdAttribute: this.effectiveNodeIdAttribute(),
        identifiedNodeTypes: this.effectiveIdentifiedNodeTypes(),
        nodeIdGenerator: this.nodeIdGenerator(),
        bubbleMenuElement: this.contextMenus().bubbleElement(),
        floatingMenuElement: this.contextMenus().floatingElement(),
        showBubbleMenu: () => this.showBubbleMenu(),
        showFloatingMenu: () => this.showFloatingMenu(),
        showLinkPopover: () => this.showLinkPopover(),
        linkPopoverOpen: () => this.contextMenus().linkPopoverOpen(),
        blockingOverlayOpen: () =>
          this.commandPaletteOpen() || this.aiReview() !== null,
        contextMenuBlocked: () =>
          this.suggestionMenus().overlayOpen() || this.aiReview() !== null,
        menuAppendTo: () => this.resolveMenuAppendTarget(),
        menuStrategy: this.menuAppendTo() === 'body' ? 'fixed' : 'absolute',
        bubbleMenuPlacement: this.bubbleMenuPlacement(),
        floatingMenuPlacement: this.floatingMenuPlacement(),
        showSlashMenu: () => this.showSlashMenu(),
        showMentionMenu: () => this.showMentionMenu(),
        mentionAvailable: () => this.mentionProvider() !== null,
        mentionTrigger: this.mentionTrigger(),
        mentionMinimumQueryLength: Math.max(
          0,
          this.mentionMinimumQueryLength(),
        ),
        mentionDebounce: Math.max(0, this.mentionDebounce()),
        slashDebounce: Math.max(0, this.slashDebounce()),
        slashMenuPlacement: this.slashMenuPlacement(),
        mentionMenuPlacement: this.mentionMenuPlacement(),
        loadSlashItems: (query, range, abortSignal) =>
          this.resolveSlashItems(query, range, abortSignal),
        loadMentionItems: (query, range, abortSignal) =>
          this.resolveMentionItems(query, range, abortSignal),
        executeSlashCommand: (command, query, range) =>
          command.execute({ controller: this.controller, query, range }),
        slashRenderer: {
          element: () => this.suggestionMenus().slashElement(),
          start: (props) => this.suggestionMenus().startSlash(props),
          update: (props) => this.suggestionMenus().updateSlash(props),
          keyDown: (event) =>
            this.suggestionMenus().handleSuggestionKeyDown('slash', event),
          exit: () => this.suggestionMenus().exitSlash(),
        },
        mentionRenderer: {
          element: () => this.suggestionMenus().mentionElement(),
          start: (props) => this.suggestionMenus().startMention(props),
          update: (props) => this.suggestionMenus().updateMention(props),
          keyDown: (event) =>
            this.suggestionMenus().handleSuggestionKeyDown('mention', event),
          exit: () => this.suggestionMenus().exitMention(),
        },
        extensions: this.extensions(),
      }),
      content: collaboration ? undefined : toTiptapJson(initial),
      editable: this.effectiveEditable(),
      autofocus: this.autofocus(),
      injectCSS: false,
      enableContentCheck: true,
      editorProps: {
        handleKeyDown: (_view, event) => {
          if (event.key === 'Escape' && this.activeAiReview()) {
            event.preventDefault();
            this.rejectActiveAiProposal('user');
            return true;
          }
          if (
            this.showCommandPalette() &&
            this.effectiveEditable() &&
            (event.metaKey || event.ctrlKey) &&
            !event.altKey &&
            event.key.toLocaleLowerCase() === 'k'
          ) {
            event.preventDefault();
            this.toggleCommandPalette();
            return true;
          }
          return false;
        },
        handlePaste: (_view, event) => {
          this.editorPaste.emit(event);
          return false;
        },
        handleDrop: (_view, event) => {
          this.editorDrop.emit(event);
          return false;
        },
      },
      onCreate: ({ editor: createdEditor }) => {
        this.markEditorReady(createdEditor);
      },
      onTransaction: ({ transaction }) => {
        const reviewBeforeTransaction = this.activeAiReview();
        this.lastUpdateSource = isChangeOrigin(transaction)
          ? 'remote'
          : this.commandDepth > 0
            ? 'command'
            : 'user';
        this.bumpRevision();
        if (transaction.docChanged) {
          this.documentRevision.update((value) => value + 1);
          queueMicrotask(() => this.refreshTrackedChanges());
          if (reviewBeforeTransaction && !this.applyingAiProposal) {
            queueMicrotask(() =>
              this.invalidateAiReview(reviewBeforeTransaction.proposal),
            );
          }
        }
      },
      onUpdate: ({ editor: updatedEditor }) =>
        this.handleEditorUpdate(updatedEditor),
      onSelectionUpdate: ({ editor: updatedEditor }) => {
        const selection = updatedEditor.state.selection;
        this.selectionChange.emit({
          from: selection.from,
          to: selection.to,
          empty: selection.empty,
        });
      },
      onFocus: ({ event }) => {
        this.focused.set(true);
        this.editorFocus.emit(event);
      },
      onBlur: ({ event }) => {
        this.focused.set(false);
        this.editorBlur.emit(event);
        this.touch.emit();
      },
      onContentError: ({ error }) => {
        this.emitContentError(this.value(), error);
      },
    });

    if (!this.editorSignal()) this.markEditorReady(editor);
  }

  private markEditorReady(editor: Editor): void {
    this.editorSignal.set(editor);
    if (this.collaboration()) {
      this.value.set(fromTiptapJson(editor.getJSON()));
      this.refreshPresence();
    }
    this.refreshTrackedChanges();
    this.syncEditorDomAttributes(editor);
    this.bumpRevision();
    if (!this.readyEmitted) {
      this.readyEmitted = true;
      this.editorReady.emit(this.controller);
    }
  }

  private syncExternalValue(editor: Editor, value: NeuralEditorValue): void {
    if (!isNeuralEditorDocument(value)) {
      this.emitContentError(
        value,
        new TypeError(
          'Editor value must be a NeuralEditorDocument with type "doc".',
        ),
      );
      return;
    }

    const preparedValue = this.prepareDocument(value);
    if (!neuralEditorDocumentsEqual(preparedValue, value)) {
      this.value.set(preparedValue);
    }

    const current = fromTiptapJson(editor.getJSON());
    if (neuralEditorDocumentsEqual(current, preparedValue)) return;

    try {
      editor.commands.setContent(toTiptapJson(preparedValue), {
        emitUpdate: false,
        errorOnInvalidContent: true,
      });
      this.bumpRevision();
    } catch (error) {
      this.emitContentError(value, asError(error));
    }
  }

  private prepareDocument(
    document: NeuralEditorDocument,
  ): NeuralEditorDocument {
    if (!this.enableNodeIds() || this.collaboration()) {
      return cloneNeuralEditorDocument(document);
    }
    return addMissingNeuralEditorNodeIds(
      document,
      this.effectiveNodeIdAttribute(),
      this.effectiveIdentifiedNodeTypes(),
      this.nodeIdGenerator(),
    );
  }

  private handleEditorUpdate(editor: Editor): void {
    const nextValue = fromTiptapJson(editor.getJSON());
    this.value.set(nextValue);
    this.bumpRevision();

    const event: NeuralEditorUpdateEvent = {
      value: nextValue,
      html: editor.getHTML(),
      text: editor.getText(),
      characterCount: readCharacterCount(editor),
      wordCount: readWordCount(editor),
      source: this.lastUpdateSource,
    };
    this.editorUpdate.emit(event);
    this.lastUpdateSource = 'user';
  }

  private setCollaborationStatus(
    status: NeuralEditorCollaborationStatus,
  ): void {
    if (this.destroyRef.destroyed || this.collaborationStatus() === status)
      return;
    this.collaborationStatus.set(status);
    if (status !== 'synced') this.collaborationSynced.set(false);
    this.collaborationStatusChange.emit({
      status,
      controller: this.controller,
    });
  }

  private refreshPresence(): void {
    const next = readNeuralEditorPresence(
      this.collaboration()?.provider,
      this.activeCollaborationUser(),
    );
    if (JSON.stringify(next) === JSON.stringify(this.presence())) return;
    this.presence.set(next);
    this.presenceChange.emit({
      presence: next,
      controller: this.controller,
    });
  }

  private refreshComments(): void {
    this.comments.set(this.commentRepository?.list() ?? []);
  }

  private refreshTrackedChanges(): void {
    this.trackedChanges.set(
      readNeuralEditorTrackedChanges(this.editorSignal()),
    );
  }

  private activateComment(threadId: string): void {
    if (!this.enableComments()) return;
    this.activeCommentId.set(threadId);
  }

  private updateCollaborationUser(user: NeuralEditorCollaborationUser): void {
    this.collaborationUserOverride.set(user);
    const editor = this.editorSignal();
    if (!editor || !this.collaboration()) return;
    editor.commands.updateUser?.(user);
    this.collaboration()?.provider?.awareness?.setLocalStateField('user', user);
    this.refreshPresence();
  }

  private addComment(text: string): NeuralEditorCommentThread | null {
    const editor = this.editorSignal();
    const user = this.activeCollaborationUser();
    if (
      !editor ||
      !this.enableComments() ||
      !this.effectiveEditable() ||
      !user ||
      editor.state.selection.empty
    ) {
      return null;
    }

    try {
      const thread = createNeuralEditorCommentThread(text, user);
      const applied = editor
        .chain()
        .focus()
        .setMark(NEURAL_EDITOR_COMMENT_MARK, { threadId: thread.id })
        .run();
      if (!applied) return null;
      this.commentRepository?.set(thread);
      this.activeCommentId.set(thread.id);
      this.refreshComments();
      this.commentCreated.emit({ thread, controller: this.controller });
      return thread;
    } catch (error) {
      this.emitContentError(text, asError(error));
      return null;
    }
  }

  private replyToComment(
    threadId: string,
    text: string,
  ): NeuralEditorCommentThread | null {
    const user = this.activeCollaborationUser();
    const current = this.commentRepository?.get(threadId);
    if (!user || !current || current.resolved || !this.effectiveEditable()) {
      return null;
    }
    try {
      const message = createNeuralEditorCommentMessage(text, user);
      const updated =
        this.commentRepository?.appendMessage(threadId, message) ?? null;
      if (!updated) return null;
      this.refreshComments();
      this.commentUpdated.emit({
        thread: updated,
        controller: this.controller,
      });
      return updated;
    } catch (error) {
      this.emitContentError(text, asError(error));
      return null;
    }
  }

  private resolveComment(threadId: string, resolved: boolean): boolean {
    const current = this.commentRepository?.get(threadId);
    if (!current || !this.effectiveEditable()) return false;
    const updated = this.commentRepository?.setResolved(
      threadId,
      resolved,
      new Date().toISOString(),
    );
    if (!updated) return false;
    this.refreshComments();
    this.commentUpdated.emit({ thread: updated, controller: this.controller });
    return true;
  }

  private deleteComment(threadId: string): boolean {
    const editor = this.editorSignal();
    const current = this.commentRepository?.get(threadId);
    if (!editor || !current || !this.effectiveEditable()) return false;

    const markType = editor.schema.marks[NEURAL_EDITOR_COMMENT_MARK];
    if (markType) {
      const tr = editor.state.tr;
      editor.state.doc.descendants((node, position) => {
        if (!node.isText) return;
        for (const mark of node.marks) {
          if (
            mark.type === markType &&
            String(mark.attrs['threadId'] ?? '') === threadId
          ) {
            tr.removeMark(position, position + node.nodeSize, mark);
          }
        }
      });
      if (tr.docChanged) editor.view.dispatch(tr);
    }

    const deleted = this.commentRepository?.delete(threadId) ?? false;
    if (!deleted) return false;
    if (this.activeCommentId() === threadId) this.activeCommentId.set(null);
    this.refreshComments();
    this.commentDeleted.emit({ threadId, controller: this.controller });
    return true;
  }

  private selectComment(threadId: string): boolean {
    const editor = this.editorSignal();
    const markType = editor?.schema.marks[NEURAL_EDITOR_COMMENT_MARK];
    if (!editor || !markType) return false;
    let range: { from: number; to: number } | null = null;
    editor.state.doc.descendants((node, position) => {
      if (range || !node.isText) return;
      const matched = node.marks.some(
        (mark) =>
          mark.type === markType &&
          String(mark.attrs['threadId'] ?? '') === threadId,
      );
      if (matched) range = { from: position, to: position + node.nodeSize };
    });
    if (!range) return false;
    this.activeCommentId.set(threadId);
    return editor.chain().focus().setTextSelection(range).run();
  }

  private acceptTrackedChange(changeId: string): boolean {
    const editor = this.editorSignal();
    const change = this.trackedChanges().find((item) => item.id === changeId);
    if (!editor || !change || !this.effectiveEditable()) return false;
    const accepted = acceptNeuralEditorTrackedChange(editor, changeId);
    if (accepted) {
      this.refreshTrackedChanges();
      this.trackedChangeAccepted.emit({ change, controller: this.controller });
    }
    return accepted;
  }

  private rejectTrackedChange(changeId: string): boolean {
    const editor = this.editorSignal();
    const change = this.trackedChanges().find((item) => item.id === changeId);
    if (!editor || !change || !this.effectiveEditable()) return false;
    const rejected = rejectNeuralEditorTrackedChange(editor, changeId);
    if (rejected) {
      this.refreshTrackedChanges();
      this.trackedChangeRejected.emit({ change, controller: this.controller });
    }
    return rejected;
  }

  private resolveAllTrackedChanges(accept: boolean): boolean {
    const editor = this.editorSignal();
    if (!editor || !this.effectiveEditable()) return false;
    const changes = this.trackedChanges();
    const resolved = resolveAllNeuralEditorTrackedChanges(editor, accept);
    if (resolved) {
      for (const change of changes) {
        const event = { change, controller: this.controller };
        if (accept) this.trackedChangeAccepted.emit(event);
        else this.trackedChangeRejected.emit(event);
      }
      this.refreshTrackedChanges();
    }
    return resolved;
  }

  private createSnapshot(label?: string): NeuralEditorSnapshot | null {
    const editor = this.editorSignal();
    if (!editor || !this.enableSnapshots()) return null;
    const snapshot = createNeuralEditorSnapshot(
      editor,
      this.comments(),
      this.activeCollaborationUser(),
      this.documentRevision(),
      label,
    );
    this.snapshots.set([snapshot, ...this.snapshots()]);
    this.snapshotCreated.emit({ snapshot, controller: this.controller });
    return snapshot;
  }

  private restoreSnapshot(snapshotId: string): boolean {
    const editor = this.editorSignal();
    const snapshot = this.snapshots().find((item) => item.id === snapshotId);
    if (!editor || !snapshot || !this.effectiveEditable()) return false;
    try {
      editor.commands.setContent(
        toTiptapJson(cloneSnapshotDocument(snapshot)),
        {
          emitUpdate: true,
          errorOnInvalidContent: true,
        },
      );
      const repository = this.commentRepository;
      if (repository) {
        for (const thread of repository.list()) repository.delete(thread.id);
        for (const thread of snapshot.comments) repository.set(thread);
      }
      this.refreshComments();
      this.snapshotRestored.emit({ snapshot, controller: this.controller });
      return true;
    } catch (error) {
      this.emitContentError(snapshot, asError(error));
      return false;
    }
  }

  private deleteSnapshot(snapshotId: string): boolean {
    const snapshot = this.snapshots().find((item) => item.id === snapshotId);
    if (!snapshot) return false;
    this.snapshots.set(
      this.snapshots().filter((item) => item.id !== snapshotId),
    );
    this.snapshotDeleted.emit({ snapshot, controller: this.controller });
    return true;
  }

  private syncEditorDomAttributes(editor: Editor): void {
    const dom = editor.view.dom as HTMLElement;
    dom.className = ['ProseMirror', this.contentClassName()]
      .filter(Boolean)
      .join(' ');
    dom.id = this.controlId();
    setAttribute(dom, 'name', this.name() || null);
    dom.spellcheck = this.spellcheck();
    dom.tabIndex = this.effectiveDisabled() ? -1 : 0;
    dom.setAttribute('role', 'textbox');
    dom.setAttribute('aria-multiline', 'true');
    setAttribute(
      dom,
      'aria-label',
      this.ariaLabelledBy()
        ? null
        : this.ariaLabel() || this.resolvedMessages().content,
    );
    setAttribute(dom, 'aria-labelledby', this.ariaLabelledBy() || null);
    setAttribute(dom, 'aria-describedby', this.describedBy());
    setAttribute(dom, 'aria-description', this.ariaDescription() || null);
    setBooleanAttribute(dom, 'aria-disabled', this.effectiveDisabled());
    setBooleanAttribute(dom, 'aria-readonly', this.effectiveReadonly());
    setBooleanAttribute(dom, 'aria-required', this.effectiveRequired());
    setBooleanAttribute(dom, 'aria-invalid', this.effectiveInvalid());
    setBooleanAttribute(dom, 'aria-busy', this.effectivePending());
  }

  private controllerAdapter(): NeuralEditorControllerAdapter {
    return {
      editor: () => this.editorSignal(),
      ready: this.ready,
      focused: this.focused,
      empty: this.empty,
      characterCount: this.characterCount,
      wordCount: this.wordCount,
      canUndo: this.canUndo,
      canRedo: this.canRedo,
      commandPaletteOpen: this.commandPaletteOpen,
      revision: this.revision,
      documentRevision: this.documentRevision,
      requestImageInsert: () => this.emitImageInsertRequest(),
      openLinkPopover: () => this.openLinkPopover(),
      closeLinkPopover: () => this.closeLinkPopover(),
      openCommandPalette: (query) => this.openCommandPalette(query),
      closeCommandPalette: () => this.closeCommandPalette(),
      toggleCommandPalette: (query) => this.toggleCommandPalette(query),
      allowBase64Images: () => this.allowBase64Images(),
      nodeIdAttribute: () => this.effectiveNodeIdAttribute(),
      validateOperations: (batch) => this.validateOperationBatch(batch),
      applyOperations: (batch) => this.applyOperationBatch(batch),
      requestAi: (action, options) => this.createAiRequest(action, options),
      cancelAiRequest: (requestId) => this.cancelAiRequest(requestId),
      previewAiProposal: (proposal) => this.previewAiProposal(proposal),
      acceptAiProposal: (proposalId) => this.acceptAiProposal(proposalId),
      rejectAiProposal: (proposalId) => this.rejectAiProposal(proposalId),
      selectPreviousAiChange: () => this.selectAiChange(-1),
      selectNextAiChange: () => this.selectAiChange(1),
      clearAiPreview: () => this.clearAiPreview(),
      getActiveAiProposals: () => {
        const review = this.activeAiReview();
        return review ? [review.proposal] : [];
      },
      aiReview: this.aiReview,
      aiRequestPending: this.aiRequestPending,
      collaborationStatus: this.collaborationStatus,
      collaborationSynced: this.collaborationSynced,
      presence: this.presence,
      comments: this.comments,
      activeCommentId: this.activeCommentId,
      trackedChanges: this.trackedChanges,
      snapshots: this.snapshots,
      updateCollaborationUser: (user) => this.updateCollaborationUser(user),
      addComment: (text) => this.addComment(text),
      replyToComment: (threadId, text) => this.replyToComment(threadId, text),
      resolveComment: (threadId, resolved) =>
        this.resolveComment(threadId, resolved),
      deleteComment: (threadId) => this.deleteComment(threadId),
      selectComment: (threadId) => this.selectComment(threadId),
      acceptTrackedChange: (changeId) => this.acceptTrackedChange(changeId),
      rejectTrackedChange: (changeId) => this.rejectTrackedChange(changeId),
      resolveAllTrackedChanges: (accept) =>
        this.resolveAllTrackedChanges(accept),
      createSnapshot: (label) => this.createSnapshot(label),
      restoreSnapshot: (snapshotId) => this.restoreSnapshot(snapshotId),
      deleteSnapshot: (snapshotId) => this.deleteSnapshot(snapshotId),
      runCommand: (command) => {
        const editor = this.editorSignal();
        if (!editor || !this.effectiveEditable()) return false;
        this.commandDepth++;
        try {
          return command(editor);
        } finally {
          this.commandDepth--;
          this.bumpRevision();
        }
      },
      reset: () => {
        const editor = this.editorSignal();
        if (!editor || !this.effectiveEditable()) return;
        this.commandDepth++;
        try {
          editor.commands.setContent(toTiptapJson(this.initialDocument), {
            emitUpdate: true,
            errorOnInvalidContent: true,
          });
        } finally {
          this.commandDepth--;
        }
      },
    };
  }

  private validateOperationBatch(
    batch: NeuralEditorOperationBatch,
  ): NeuralEditorOperationValidationResult {
    const editor = this.editorSignal();
    if (!editor) {
      return {
        valid: false,
        batchId: batch.id,
        baseRevision: batch.baseRevision,
        currentRevision: this.documentRevision(),
        error: {
          code: 'operation-failed',
          message: 'Editor is not ready.',
        },
      };
    }
    return validateNeuralEditorOperations(editor, batch, {
      nodeIdAttribute: this.effectiveNodeIdAttribute(),
      currentRevision: () => this.documentRevision(),
      editable: () => this.effectiveEditable(),
    });
  }

  private applyOperationBatch(
    batch: NeuralEditorOperationBatch,
  ): NeuralEditorOperationApplyResult {
    const editor = this.editorSignal();
    if (!editor) {
      const result: NeuralEditorOperationApplyResult = {
        status: 'rejected',
        batchId: batch.id,
        baseRevision: batch.baseRevision,
        revision: this.documentRevision(),
        error: {
          code: 'operation-failed',
          message: 'Editor is not ready.',
        },
      };
      this.operationsRejected.emit({
        batch,
        result,
        controller: this.controller,
      });
      return result;
    }

    this.commandDepth++;
    let result: NeuralEditorOperationApplyResult;
    try {
      result = applyNeuralEditorOperations(editor, batch, {
        nodeIdAttribute: this.effectiveNodeIdAttribute(),
        currentRevision: () => this.documentRevision(),
        editable: () => this.effectiveEditable(),
      });
    } finally {
      this.commandDepth--;
      this.bumpRevision();
    }

    if (result.status === 'applied') {
      this.operationsApplied.emit({
        batch,
        result,
        controller: this.controller,
      });
    } else if (result.status === 'conflict') {
      this.operationConflict.emit({
        batch,
        result,
        controller: this.controller,
      });
    } else {
      this.operationsRejected.emit({
        batch,
        result,
        controller: this.controller,
      });
    }
    return result;
  }

  private createAiRequest(
    action: NeuralEditorAiAction,
    options: NeuralEditorAiRequestOptions = {},
  ): NeuralEditorAiRequest {
    const editor = this.editorSignal();
    const request: NeuralEditorAiRequest = {
      id: createEditorRequestId('ai-request'),
      action,
      ...(options.instruction?.trim()
        ? { instruction: options.instruction.trim() }
        : {}),
      selection: editor
        ? this.createSelectionSnapshot(editor)
        : {
            from: 0,
            to: 0,
            empty: true,
            text: '',
            content: [],
            nodeIds: [],
          },
      document: cloneNeuralEditorDocument(
        editor ? fromTiptapJson(editor.getJSON()) : this.value(),
      ),
      schemaVersion: 1,
      baseRevision: this.documentRevision(),
      ...(options.metadata ? { metadata: { ...options.metadata } } : {}),
    };

    if (this.activeAiReview()) {
      this.rejectActiveAiProposal('replaced');
    }
    this.closeAllEditorOverlays(false);
    this.pendingAiRequests.update((requests) => [...requests, request]);
    this.aiRequest.emit({ request, controller: this.controller });
    return request;
  }

  private cancelAiRequest(requestId: string): boolean {
    const normalizedId = requestId.trim();
    const request = this.pendingAiRequests().find(
      (candidate) => candidate.id === normalizedId,
    );
    if (!request) return false;
    this.pendingAiRequests.update((requests) =>
      requests.filter((candidate) => candidate.id !== normalizedId),
    );
    this.aiRequestCancelled.emit({ request, controller: this.controller });
    return true;
  }

  private previewAiProposal(
    proposal: NeuralEditorAiProposal,
  ): NeuralEditorAiPreviewResult {
    const editor = this.editorSignal();
    if (!editor) {
      return {
        status: 'rejected',
        proposal,
        error: {
          code: 'editor-not-ready',
          message: 'Editor is not ready.',
        },
      };
    }

    if (
      !proposal.id?.trim() ||
      !proposal.requestId?.trim() ||
      !Number.isInteger(proposal.baseRevision) ||
      proposal.baseRevision < 0 ||
      !Array.isArray(proposal.operations) ||
      proposal.operations.length === 0
    ) {
      const requestId = proposal.requestId?.trim();
      if (requestId) {
        this.pendingAiRequests.update((requests) =>
          requests.filter((request) => request.id !== requestId),
        );
      }
      const result: NeuralEditorAiPreviewResult = {
        status: 'rejected',
        proposal,
        error: {
          code: 'invalid-proposal',
          message:
            'AI proposal id, requestId, non-negative integer baseRevision, and at least one operation are required.',
        },
      };
      this.aiProposalRejected.emit({
        proposal,
        reason: 'validation',
        controller: this.controller,
      });
      return result;
    }

    const normalizedBatch = createNeuralEditorOperationBatch(
      proposal.operations,
      proposal.baseRevision,
      { id: proposal.id, metadata: proposal.metadata },
    );
    const normalizedProposal: NeuralEditorAiProposal = {
      id: proposal.id.trim(),
      requestId: proposal.requestId.trim(),
      baseRevision: normalizedBatch.baseRevision,
      ...(proposal.summary?.trim() ? { summary: proposal.summary.trim() } : {}),
      operations: normalizedBatch.operations,
      ...(proposal.metadata ? { metadata: { ...proposal.metadata } } : {}),
    };

    this.pendingAiRequests.update((requests) =>
      requests.filter((request) => request.id !== normalizedProposal.requestId),
    );

    const batch: NeuralEditorOperationBatch = {
      id: normalizedProposal.id,
      baseRevision: normalizedProposal.baseRevision,
      operations: normalizedProposal.operations,
      ...(normalizedProposal.metadata
        ? { metadata: normalizedProposal.metadata }
        : {}),
    };
    const validation = this.validateOperationBatch(batch);
    if (!validation.valid) {
      const conflict = validation.error.code === 'revision-conflict';
      if (conflict) {
        this.aiOperationConflict.emit({
          proposal: normalizedProposal,
          reason: 'revision-conflict',
          currentRevision: this.documentRevision(),
          controller: this.controller,
        });
      } else {
        this.aiProposalRejected.emit({
          proposal: normalizedProposal,
          reason: 'validation',
          controller: this.controller,
        });
      }
      return {
        status: conflict ? 'conflict' : 'rejected',
        proposal: normalizedProposal,
        error: {
          code: conflict ? 'revision-conflict' : 'validation-failed',
          message: validation.error.message,
          operationError: validation.error,
        },
      };
    }

    if (this.activeAiReview()) {
      this.rejectActiveAiProposal('replaced');
    }

    const state: NeuralEditorAiReviewState = {
      proposal: normalizedProposal,
      activeOperationIndex: 0,
      operationCount: normalizedProposal.operations.length,
    };
    this.closeAllEditorOverlays(false);
    this.activeAiReview.set(state);
    showNeuralEditorAiReview(
      editor,
      normalizedProposal,
      0,
      this.effectiveNodeIdAttribute(),
    );
    this.aiProposalPreviewed.emit({
      proposal: normalizedProposal,
      controller: this.controller,
    });
    return {
      status: 'previewed',
      proposal: normalizedProposal,
      operationCount: normalizedProposal.operations.length,
    };
  }

  private acceptAiProposal(
    proposalId?: string,
  ): NeuralEditorOperationApplyResult | null {
    const review = this.activeAiReview();
    if (!review || (proposalId && proposalId !== review.proposal.id))
      return null;

    const batch: NeuralEditorOperationBatch = {
      id: review.proposal.id,
      baseRevision: review.proposal.baseRevision,
      operations: review.proposal.operations,
      ...(review.proposal.metadata
        ? { metadata: review.proposal.metadata }
        : {}),
    };

    this.applyingAiProposal = true;
    let result: NeuralEditorOperationApplyResult;
    try {
      result = this.applyOperationBatch(batch);
    } finally {
      this.applyingAiProposal = false;
    }

    if (result.status === 'applied') {
      this.clearAiPreview();
      this.aiProposalAccepted.emit({
        proposal: review.proposal,
        result,
        controller: this.controller,
      });
    } else if (result.status === 'conflict') {
      this.clearAiPreview();
      this.aiOperationConflict.emit({
        proposal: review.proposal,
        reason: 'revision-conflict',
        currentRevision: this.documentRevision(),
        controller: this.controller,
      });
    } else {
      this.clearAiPreview();
      this.aiProposalRejected.emit({
        proposal: review.proposal,
        reason: 'apply-rejected',
        result,
        controller: this.controller,
      });
    }
    return result;
  }

  private rejectAiProposal(proposalId?: string): boolean {
    const review = this.activeAiReview();
    if (!review || (proposalId && proposalId !== review.proposal.id))
      return false;
    return this.rejectActiveAiProposal('user');
  }

  private rejectActiveAiProposal(
    reason: 'user' | 'replaced' | 'editor-state',
  ): boolean {
    const review = this.activeAiReview();
    if (!review) return false;
    this.clearAiPreview();
    this.aiProposalRejected.emit({
      proposal: review.proposal,
      reason,
      controller: this.controller,
    });
    return true;
  }

  private clearAiPreview(): void {
    const editor = this.editorSignal();
    if (editor) clearNeuralEditorAiReview(editor);
    this.activeAiReview.set(null);
  }

  private selectAiChange(delta: -1 | 1): void {
    const review = this.activeAiReview();
    const editor = this.editorSignal();
    if (!review || !editor || review.operationCount <= 0) return;
    const nextIndex =
      (review.activeOperationIndex + delta + review.operationCount) %
      review.operationCount;
    const nextState: NeuralEditorAiReviewState = {
      ...review,
      activeOperationIndex: nextIndex,
    };
    this.activeAiReview.set(nextState);
    selectNeuralEditorAiReviewOperation(editor, nextIndex);
    queueMicrotask(() => {
      const operation = review.proposal.operations[nextIndex];
      const operationId = operation?.id ?? `operation-${nextIndex + 1}`;
      editor.view.dom
        .querySelector<HTMLElement>(
          `[data-neural-editor-ai-operation="${escapeAttributeSelector(operationId)}"]`,
        )
        ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
  }

  private invalidateAiReview(proposal: NeuralEditorAiProposal): void {
    const active = this.activeAiReview();
    if (!active || active.proposal.id !== proposal.id) return;
    this.clearAiPreview();
    this.aiOperationConflict.emit({
      proposal,
      reason: 'document-changed',
      currentRevision: this.documentRevision(),
      controller: this.controller,
    });
  }

  private createSelectionSnapshot(
    editor: Editor,
  ): NeuralEditorSelectionSnapshot {
    const { selection, doc } = editor.state;
    const nodeIds = new Set<string>();
    if (selection.empty) {
      const id = this.controller.getNodeIdAt(selection.from);
      if (id) nodeIds.add(id);
    } else {
      doc.nodesBetween(selection.from, selection.to, (node) => {
        const id = node.attrs[this.effectiveNodeIdAttribute()];
        if (typeof id === 'string' && id) nodeIds.add(id);
      });
    }

    const content = selection
      .content()
      .content.toJSON() as NeuralEditorSelectionSnapshot['content'];
    return {
      from: selection.from,
      to: selection.to,
      empty: selection.empty,
      text: selection.empty
        ? ''
        : doc.textBetween(selection.from, selection.to, '\n'),
      content,
      nodeIds: [...nodeIds],
    };
  }

  private resolveSlashItems(
    query: string,
    range: NeuralEditorSuggestionRange,
    abortSignal: AbortSignal,
  ):
    | readonly NeuralEditorSlashCommand[]
    | Promise<readonly NeuralEditorSlashCommand[]> {
    const provider = this.slashCommandProvider();
    if (provider) {
      return provider(query, {
        controller: this.controller,
        query,
        range,
        signal: abortSignal,
      });
    }
    return filterEditorItems(this.effectiveSlashCommands(), query);
  }

  private resolveMentionItems(
    query: string,
    range: NeuralEditorSuggestionRange,
    abortSignal: AbortSignal,
  ):
    | readonly NeuralEditorMentionItem[]
    | Promise<readonly NeuralEditorMentionItem[]> {
    const provider = this.mentionProvider();
    if (!provider) return [];
    return provider(query, {
      controller: this.controller,
      query,
      range,
      signal: abortSignal,
    });
  }

  private openCommandPalette(query = ''): void {
    if (!this.showCommandPalette() || !this.effectiveEditable()) return;
    if (this.activeAiReview()) this.rejectActiveAiProposal('user');
    this.closeSuggestionMenus();
    this.hideContextMenus();
    this.suggestionMenus().openCommandPalette(query);
  }

  private closeCommandPalette(): void {
    this.suggestionMenus().closeCommandPalette();
  }

  private toggleCommandPalette(query = ''): void {
    if (!this.showCommandPalette() || !this.effectiveEditable()) return;
    if (this.commandPaletteOpen()) this.closeCommandPalette();
    else this.openCommandPalette(query);
  }

  protected handleSuggestionOverlayOpened(
    kind: 'slash' | 'mention' | 'command-palette',
  ): void {
    this.hideContextMenus();
    const editor = this.editorSignal();
    if (!editor || kind === 'command-palette') return;
    const otherKey =
      kind === 'slash'
        ? NEURAL_EDITOR_MENTION_SUGGESTION_PLUGIN_KEY
        : NEURAL_EDITOR_SLASH_SUGGESTION_PLUGIN_KEY;
    exitSuggestion(editor.view, otherKey);
  }

  protected closeSuggestionMenus(): void {
    const editor = this.editorSignal();
    if (!editor) return;
    exitSuggestion(editor.view, NEURAL_EDITOR_SLASH_SUGGESTION_PLUGIN_KEY);
    exitSuggestion(editor.view, NEURAL_EDITOR_MENTION_SUGGESTION_PLUGIN_KEY);
  }

  private closeAllEditorOverlays(restoreFocus = false): void {
    this.closeSuggestionMenus();
    this.suggestionMenus().closeCommandPalette(restoreFocus);
    this.hideContextMenus();
  }

  private emitImageInsertRequest(): void {
    if (!this.effectiveEditable()) return;
    if (this.activeAiReview()) this.rejectActiveAiProposal('user');
    this.closeAllEditorOverlays(false);
    const editor = this.editorSignal();
    const selection = editor?.state.selection;
    this.imageInsertRequest.emit({
      controller: this.controller,
      selection: {
        from: selection?.from ?? 0,
        to: selection?.to ?? 0,
        empty: selection?.empty ?? true,
      },
    });
  }

  private openLinkPopover(): void {
    if (!this.effectiveEditable() || !this.showLinkPopover()) return;
    if (this.activeAiReview()) this.rejectActiveAiProposal('user');
    this.closeSuggestionMenus();
    this.suggestionMenus().closeCommandPalette(false);
    this.editorSignal()?.commands.setMeta(
      NEURAL_EDITOR_FLOATING_MENU_PLUGIN_KEY,
      'hide',
    );
    this.contextMenus().openLinkPopover(this.controller.getLinkHref());
    this.editorSignal()?.commands.setMeta(
      NEURAL_EDITOR_BUBBLE_MENU_PLUGIN_KEY,
      'show',
    );
    queueMicrotask(() => this.updateBubbleMenuPosition());
  }

  private closeLinkPopover(): void {
    this.contextMenus().closeLinkPopover();
    this.editorSignal()?.commands.setMeta(
      NEURAL_EDITOR_BUBBLE_MENU_PLUGIN_KEY,
      'hide',
    );
    queueMicrotask(() => this.updateBubbleMenuPosition());
  }

  private hideContextMenus(): void {
    this.contextMenus().closeLinkPopover();
    const editor = this.editorSignal();
    editor?.commands.setMeta(NEURAL_EDITOR_BUBBLE_MENU_PLUGIN_KEY, 'hide');
    editor?.commands.setMeta(NEURAL_EDITOR_FLOATING_MENU_PLUGIN_KEY, 'hide');
  }

  private updateBubbleMenuPosition(): void {
    this.editorSignal()?.commands.setMeta(
      NEURAL_EDITOR_BUBBLE_MENU_PLUGIN_KEY,
      'updatePosition',
    );
  }

  private resolveMenuAppendTarget(): HTMLElement {
    const target = this.menuAppendTo();
    const elementConstructor = this.document.defaultView?.HTMLElement;
    if (elementConstructor && target instanceof elementConstructor) {
      return target;
    }
    if (target === 'editor') {
      return (
        this.editorMount().nativeElement.parentElement ??
        this.editorMount().nativeElement
      );
    }
    return this.document.body;
  }

  private setEditorContent(
    document: NeuralEditorDocument,
    emitUpdate: boolean,
  ): void {
    const editor = this.editorSignal();
    if (!editor) return;
    editor.commands.setContent(toTiptapJson(document), {
      emitUpdate,
      errorOnInvalidContent: true,
    });
    this.bumpRevision();
  }

  private emitContentError(value: unknown, error: Error): void {
    this.contentError.emit({ value, error });
  }

  private bumpRevision(): void {
    this.revision.update((value) => value + 1);
  }

  private compose(
    structural: string,
    visual: string,
    ...consumer: Array<string | undefined>
  ): string {
    return [structural, this.effectiveUnstyled() ? '' : visual, ...consumer]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(' ');
  }
}

/** @deprecated Use NeuralEditor. */
export { NeuralEditor as EditorComponent };

function readCharacterCount(editor: Editor | null): number {
  if (!editor) return 0;
  const storage = editor.storage as {
    characterCount?: { characters?: () => number };
  };
  return storage.characterCount?.characters?.() ?? editor.getText().length;
}

function readWordCount(editor: Editor | null): number {
  if (!editor) return 0;
  const storage = editor.storage as {
    characterCount?: { words?: () => number };
  };
  return (
    storage.characterCount?.words?.() ??
    editor.getText().trim().split(/\s+/).filter(Boolean).length
  );
}

function filterEditorItems<
  T extends {
    readonly label: string;
    readonly description?: string;
    readonly keywords?: readonly string[];
  },
>(items: readonly T[], query: string): readonly T[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return items;
  return items.filter((item) =>
    [item.label, item.description ?? '', ...(item.keywords ?? [])]
      .join(' ')
      .toLocaleLowerCase()
      .includes(normalized),
  );
}

function normalizeNodeIdAttribute(value: string): string {
  const normalized = value.trim().replace(/[^a-zA-Z0-9_-]/g, '');
  return normalized || NEURAL_EDITOR_DEFAULT_NODE_ID_ATTRIBUTE;
}

function normalizeIdentifiedNodeTypes(
  values: readonly string[],
): readonly string[] {
  const normalized = values.map((value) => value.trim()).filter(Boolean);
  return normalized.length > 0
    ? [...new Set(normalized)]
    : NEURAL_EDITOR_DEFAULT_IDENTIFIED_NODE_TYPES;
}

function optionalNumberAttribute(value: unknown): number | undefined {
  return value === undefined || value === null || value === ''
    ? undefined
    : numberAttribute(value);
}

function setAttribute(
  element: HTMLElement,
  name: string,
  value: string | null,
): void {
  if (value) element.setAttribute(name, value);
  else element.removeAttribute(name);
}

function setBooleanAttribute(
  element: HTMLElement,
  name: string,
  value: boolean,
): void {
  if (value) element.setAttribute(name, 'true');
  else element.removeAttribute(name);
}

function asError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

function createEditorRequestId(prefix: string): string {
  const id =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  return `${prefix}-${id}`;
}

function escapeAttributeSelector(value: string): string {
  const css = globalThis.CSS;
  if (css?.escape) return css.escape(value);
  return value.replace(/["\\]/g, '\\$&');
}
