import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
} from '@angular/core';
import type { NeuralEditorMessages } from '@neural-ng/core';
import {
  PopoverCloseDirective,
  PopoverComponent,
  PopoverTriggerDirective,
} from '@neural-ng/core/popover';
import type {
  NeuralEditorColorKind,
  NeuralEditorColorOption,
  NeuralEditorCommand,
  NeuralEditorController,
  NeuralEditorToolbarColorItem,
  NeuralEditorToolbarCommandItem,
  NeuralEditorToolbarItem,
  NeuralEditorToolbarTableItem,
} from './editor.types';

const TABLE_COMMANDS: readonly Exclude<
  NeuralEditorCommand,
  'link' | 'image'
>[] = [
  'insert-table',
  'add-row-before',
  'add-row-after',
  'delete-row',
  'add-column-before',
  'add-column-after',
  'delete-column',
  'merge-cells',
  'split-cell',
  'toggle-header-row',
  'delete-table',
];

@Component({
  selector: 'neural-editor-toolbar',
  standalone: true,
  imports: [PopoverComponent, PopoverTriggerDirective, PopoverCloseDirective],
  template: `
    <div
      [class]="toolbarClass()"
      role="toolbar"
      [attr.aria-label]="messages().toolbar"
      [attr.aria-controls]="editorId() || null"
    >
      @for (item of items(); track $index) {
        @if (item.type === 'separator') {
          <span
            role="separator"
            aria-orientation="vertical"
            [class]="separatorClass()"
          ></span>
        } @else if (item.type === 'command') {
          <button
            type="button"
            [class]="buttonClass()"
            [disabled]="commandDisabled(item.command)"
            [attr.aria-label]="commandLabel(item)"
            [attr.aria-pressed]="commandPressed(item.command)"
            [attr.aria-haspopup]="item.command === 'link' ? 'dialog' : null"
            [attr.title]="commandLabel(item)"
            [attr.data-command]="item.command"
            [attr.data-active]="commandActive(item.command) ? 'true' : null"
            (pointerdown)="$event.preventDefault()"
            (click)="handleCommand(item.command)"
          >
            @if (item.iconClass) {
              <i [class]="iconClass(item.iconClass)" aria-hidden="true"></i>
            } @else {
              <span aria-hidden="true">{{ commandText(item) }}</span>
            }
          </button>
        } @else if (item.type === 'color') {
          <span [class]="menuClass()">
            <button
              type="button"
              [class]="menuButtonClass()"
              [disabled]="disabled()"
              [attr.aria-label]="colorItemLabel(item)"
              [attr.title]="colorItemLabel(item)"
              [neuralPopoverTriggerFor]="colorPanel"
              (pointerdown)="$event.preventDefault()"
            >
              @if (item.iconClass) {
                <i [class]="iconClass(item.iconClass)" aria-hidden="true"></i>
              } @else {
                <span aria-hidden="true">{{ colorItemText(item) }}</span>
              }
              <span
                [class]="colorSwatchClass()"
                [style.background-color]="currentColor(item.kind) || null"
                aria-hidden="true"
              ></span>
            </button>

            <neural-popover #colorPanel position="bottom-start">
              <div
                [class]="menuPanelClass()"
                role="group"
                [attr.aria-label]="colorItemLabel(item)"
              >
                @for (option of colorOptions(item.kind); track option.value) {
                  <button
                    type="button"
                    neuralPopoverClose
                    [class]="colorOptionClass()"
                    [disabled]="disabled()"
                    [attr.aria-pressed]="colorActive(item.kind, option.value)"
                    [attr.title]="option.label || option.value"
                    (pointerdown)="$event.preventDefault()"
                    (click)="applyColor(item.kind, option.value)"
                  >
                    <span
                      [class]="colorSwatchClass()"
                      [style.background-color]="option.value"
                      aria-hidden="true"
                    ></span>
                    <span>{{ option.label || option.value }}</span>
                  </button>
                }

                <button
                  type="button"
                  neuralPopoverClose
                  [class]="menuActionClass()"
                  [disabled]="disabled() || !currentColor(item.kind)"
                  (pointerdown)="$event.preventDefault()"
                  (click)="clearColor(item.kind)"
                >
                  {{ clearColorLabel(item.kind) }}
                </button>
              </div>
            </neural-popover>
          </span>
        } @else {
          <span [class]="menuClass()">
            <button
              type="button"
              [class]="menuButtonClass()"
              [disabled]="disabled()"
              [attr.aria-label]="tableItemLabel(item)"
              [attr.title]="tableItemLabel(item)"
              [neuralPopoverTriggerFor]="tablePanel"
              (pointerdown)="$event.preventDefault()"
            >
              @if (item.iconClass) {
                <i [class]="iconClass(item.iconClass)" aria-hidden="true"></i>
              } @else {
                <span aria-hidden="true">{{ tableItemText(item) }}</span>
              }
            </button>

            <neural-popover #tablePanel position="bottom-start">
              <div
                [class]="menuPanelClass()"
                role="group"
                [attr.aria-label]="tableItemLabel(item)"
              >
                @for (command of tableCommands; track command) {
                  <button
                    type="button"
                    neuralPopoverClose
                    [class]="menuActionClass()"
                    [disabled]="commandDisabled(command)"
                    (pointerdown)="$event.preventDefault()"
                    (click)="handleMenuCommand(command)"
                  >
                    {{ commandLabelFor(command) }}
                  </button>
                }
              </div>
            </neural-popover>
          </span>
        }
      }
    </div>
  `,
  styles: `
    :where(.neural-editor-toolbar-root) {
      box-sizing: border-box;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      min-width: 0;
    }
    :where(.neural-editor-toolbar-base) {
      gap: var(--neural-editor-toolbar-gap, 0.25rem);
      padding: var(--neural-editor-toolbar-padding, 0.5rem);
      background: var(--neural-editor-toolbar-background, transparent);
      border-block-end: var(
        --neural-editor-toolbar-border,
        1px solid currentColor
      );
    }
    :where(.neural-editor-toolbar-button-root),
    :where(.neural-editor-toolbar-menu-button-root) {
      box-sizing: border-box;
      display: inline-grid;
      flex: 0 0 auto;
      place-items: center;
    }
    :where(.neural-editor-toolbar-button-base),
    :where(.neural-editor-toolbar-menu-button-base) {
      min-width: var(--neural-editor-toolbar-button-size, 2rem);
      min-height: var(--neural-editor-toolbar-button-size, 2rem);
      padding: var(--neural-editor-toolbar-button-padding, 0.35rem);
      color: var(--neural-editor-toolbar-button-color, inherit);
      background: var(--neural-editor-toolbar-button-background, transparent);
      border: var(--neural-editor-toolbar-button-border, 0);
      border-radius: var(--neural-editor-toolbar-button-radius, 0.375rem);
      font: inherit;
      cursor: pointer;
      transition: var(--neural-editor-transition, none);
    }
    :where(.neural-editor-toolbar-menu-button-base) {
      grid-auto-flow: column;
      gap: 0.25rem;
      list-style: none;
    }
    :where(.neural-editor-toolbar-menu-button-base::-webkit-details-marker) {
      display: none;
    }
    :where(.neural-editor-toolbar-button-base:hover:not(:disabled)),
    :where(.neural-editor-toolbar-menu-button-base:hover) {
      color: var(--neural-editor-toolbar-button-color-hover, inherit);
      background: var(
        --neural-editor-toolbar-button-background-hover,
        transparent
      );
    }
    :where(.neural-editor-toolbar-button-base[data-active='true']),
    :where(.neural-editor-toolbar-menu-button-base[aria-expanded='true']) {
      color: var(--neural-editor-toolbar-button-color-active, inherit);
      background: var(
        --neural-editor-toolbar-button-background-active,
        transparent
      );
    }
    :where(.neural-editor-toolbar-button-base:focus-visible),
    :where(.neural-editor-toolbar-menu-button-base:focus-visible) {
      outline: var(--neural-editor-focus-ring, 2px solid currentColor);
      outline-offset: var(--neural-editor-focus-ring-offset, 2px);
    }
    :where(.neural-editor-toolbar-button-base:disabled),
    :where(.neural-editor-toolbar-menu-button-base[aria-disabled='true']) {
      cursor: default;
      opacity: var(--neural-editor-toolbar-button-disabled-opacity, 0.45);
    }
    :where(.neural-editor-toolbar-separator-root) {
      display: block;
      flex: 0 0 auto;
      align-self: stretch;
    }
    :where(.neural-editor-toolbar-separator-base) {
      width: 1px;
      min-height: 1.5rem;
      margin: var(--neural-editor-toolbar-separator-margin, 0 0.125rem);
      background: var(--neural-editor-toolbar-separator-color, currentColor);
      opacity: var(--neural-editor-toolbar-separator-opacity, 0.25);
    }
    :where(.neural-editor-toolbar-menu-root) {
      display: inline-flex;
      flex: 0 0 auto;
    }
    :where(.neural-editor-toolbar-menu-panel-root) {
      box-sizing: border-box;
      display: grid;
      min-width: var(--neural-editor-toolbar-menu-min-width, 12rem);
      max-height: var(--neural-editor-toolbar-menu-max-height, 18rem);
      overflow: auto;
    }
    :where(.neural-editor-toolbar-menu-panel-base) {
      gap: var(--neural-editor-toolbar-menu-gap, 0.25rem);
      padding: var(--neural-editor-toolbar-menu-padding, 0.5rem);
      color: var(--neural-editor-toolbar-menu-color, inherit);
      background: var(--neural-editor-toolbar-menu-background, Canvas);
      border: var(--neural-editor-toolbar-menu-border, 1px solid currentColor);
      border-radius: var(--neural-editor-toolbar-menu-radius, 0.5rem);
      box-shadow: var(
        --neural-editor-toolbar-menu-shadow,
        0 0.5rem 1.5rem rgb(0 0 0 / 0.16)
      );
    }
    :where(.neural-editor-toolbar-menu-action-root),
    :where(.neural-editor-toolbar-color-option-root) {
      box-sizing: border-box;
      width: 100%;
      min-width: 0;
      text-align: start;
    }
    :where(.neural-editor-toolbar-menu-action-base),
    :where(.neural-editor-toolbar-color-option-base) {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      min-height: 2rem;
      padding: 0.35rem 0.5rem;
      color: inherit;
      background: transparent;
      border: 0;
      border-radius: 0.375rem;
      font: inherit;
      cursor: pointer;
    }
    :where(.neural-editor-toolbar-menu-action-base:hover:not(:disabled)),
    :where(.neural-editor-toolbar-color-option-base:hover:not(:disabled)),
    :where(.neural-editor-toolbar-color-option-base[aria-pressed='true']) {
      background: var(
        --neural-editor-toolbar-button-background-hover,
        transparent
      );
    }
    :where(.neural-editor-toolbar-menu-action-base:focus-visible),
    :where(.neural-editor-toolbar-color-option-base:focus-visible) {
      outline: var(--neural-editor-focus-ring, 2px solid currentColor);
      outline-offset: 1px;
    }
    :where(.neural-editor-toolbar-color-swatch-root) {
      box-sizing: border-box;
      display: inline-block;
      flex: 0 0 auto;
    }
    :where(.neural-editor-toolbar-color-swatch-base) {
      width: var(--neural-editor-toolbar-color-swatch-size, 0.85rem);
      height: var(--neural-editor-toolbar-color-swatch-size, 0.85rem);
      border: var(
        --neural-editor-toolbar-color-swatch-border,
        1px solid rgb(0 0 0 / 0.25)
      );
      border-radius: var(--neural-editor-toolbar-color-swatch-radius, 0.2rem);
      background: var(--neural-editor-toolbar-color-swatch-empty, transparent);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EditorToolbarComponent {
  readonly controller = input.required<NeuralEditorController>();
  readonly messages = input.required<NeuralEditorMessages>();
  readonly items = input.required<readonly NeuralEditorToolbarItem[]>();
  readonly textColors = input.required<readonly NeuralEditorColorOption[]>();
  readonly highlightColors =
    input.required<readonly NeuralEditorColorOption[]>();
  readonly disabled = input(false);
  readonly editorId = input('');
  readonly toolbarClass = input('');
  readonly buttonClass = input('');
  readonly buttonIconClass = input('');
  readonly separatorClass = input('');
  readonly menuClass = input('');
  readonly menuButtonClass = input('');
  readonly menuPanelClass = input('');
  readonly menuActionClass = input('');
  readonly colorOptionClass = input('');
  readonly colorSwatchClass = input('');

  readonly tableCommands = TABLE_COMMANDS;

  commandActive(command: NeuralEditorCommand): boolean {
    const editor = this.controller();
    switch (command) {
      case 'paragraph':
        return editor.isActive('paragraph');
      case 'heading-1':
        return editor.isActive('heading', { level: 1 });
      case 'heading-2':
        return editor.isActive('heading', { level: 2 });
      case 'heading-3':
        return editor.isActive('heading', { level: 3 });
      case 'bold':
      case 'italic':
      case 'underline':
      case 'strike':
      case 'code':
      case 'blockquote':
        return editor.isActive(command);
      case 'bullet-list':
        return editor.isActive('bulletList');
      case 'ordered-list':
        return editor.isActive('orderedList');
      case 'task-list':
        return editor.isActive('taskList');
      case 'code-block':
        return editor.isActive('codeBlock');
      case 'align-left':
        return isTextAlignActive(editor, 'left');
      case 'align-center':
        return isTextAlignActive(editor, 'center');
      case 'align-right':
        return isTextAlignActive(editor, 'right');
      case 'align-justify':
        return isTextAlignActive(editor, 'justify');
      case 'link':
        return editor.isActive('link');
      default:
        return false;
    }
  }

  commandPressed(command: NeuralEditorCommand): string | null {
    return isToggleCommand(command)
      ? String(this.commandActive(command))
      : null;
  }

  commandDisabled(command: NeuralEditorCommand): boolean {
    if (this.disabled() || !this.controller().ready()) return true;
    if (command === 'link' || command === 'image') return false;
    return !this.controller().can(command);
  }

  commandLabel(item: NeuralEditorToolbarCommandItem): string {
    return item.label || this.commandLabelFor(item.command);
  }

  commandLabelFor(command: NeuralEditorCommand): string {
    return labelForCommand(command, this.messages());
  }

  commandText(item: NeuralEditorToolbarCommandItem): string {
    return item.text || this.commandLabel(item);
  }

  iconClass(iconClass: string): string {
    return [iconClass.trim(), this.buttonIconClass().trim()]
      .filter(Boolean)
      .join(' ');
  }

  handleCommand(command: NeuralEditorCommand): void {
    if (command === 'link') {
      this.controller().openLinkPopover();
      return;
    }
    if (command === 'image') {
      this.controller().requestImageInsert();
      return;
    }
    this.controller().run(command);
  }

  handleMenuCommand(
    command: Exclude<NeuralEditorCommand, 'link' | 'image'>,
  ): void {
    this.controller().run(command);
  }

  colorOptions(
    kind: NeuralEditorColorKind,
  ): readonly NeuralEditorColorOption[] {
    return kind === 'text' ? this.textColors() : this.highlightColors();
  }

  currentColor(kind: NeuralEditorColorKind): string {
    return kind === 'text'
      ? this.controller().getTextColor()
      : this.controller().getHighlightColor();
  }

  colorActive(kind: NeuralEditorColorKind, color: string): string {
    return String(
      this.currentColor(kind).toLowerCase() === color.toLowerCase(),
    );
  }

  applyColor(kind: NeuralEditorColorKind, color: string): void {
    if (kind === 'text') this.controller().setTextColor(color);
    else this.controller().setHighlight(color);
  }

  clearColor(kind: NeuralEditorColorKind): void {
    if (kind === 'text') this.controller().unsetTextColor();
    else this.controller().unsetHighlight();
  }

  colorItemLabel(item: NeuralEditorToolbarColorItem): string {
    if (item.label) return item.label;
    return item.kind === 'text'
      ? this.messages().textColor
      : this.messages().highlight;
  }

  colorItemText(item: NeuralEditorToolbarColorItem): string {
    return item.text || this.colorItemLabel(item);
  }

  clearColorLabel(kind: NeuralEditorColorKind): string {
    return kind === 'text'
      ? this.messages().removeTextColor
      : this.messages().removeHighlight;
  }

  tableItemLabel(item: NeuralEditorToolbarTableItem): string {
    return item.label || this.messages().table;
  }

  tableItemText(item: NeuralEditorToolbarTableItem): string {
    return item.text || this.tableItemLabel(item);
  }
}

function isToggleCommand(command: NeuralEditorCommand): boolean {
  return ![
    'undo',
    'redo',
    'horizontal-rule',
    'clear-formatting',
    'insert-table',
    'delete-table',
    'add-row-before',
    'add-row-after',
    'delete-row',
    'add-column-before',
    'add-column-after',
    'delete-column',
    'merge-cells',
    'split-cell',
    'toggle-header-row',
    'image',
  ].includes(command);
}

function labelForCommand(
  command: NeuralEditorCommand,
  messages: NeuralEditorMessages,
): string {
  const labels: Record<NeuralEditorCommand, string> = {
    undo: messages.undo,
    redo: messages.redo,
    paragraph: messages.paragraph,
    'heading-1': messages.heading1,
    'heading-2': messages.heading2,
    'heading-3': messages.heading3,
    bold: messages.bold,
    italic: messages.italic,
    underline: messages.underline,
    strike: messages.strike,
    code: messages.code,
    'bullet-list': messages.bulletList,
    'ordered-list': messages.orderedList,
    'task-list': messages.taskList,
    blockquote: messages.blockquote,
    'code-block': messages.codeBlock,
    'align-left': messages.alignLeft,
    'align-center': messages.alignCenter,
    'align-right': messages.alignRight,
    'align-justify': messages.alignJustify,
    link: messages.link,
    image: messages.insertImage,
    'horizontal-rule': messages.horizontalRule,
    'clear-formatting': messages.clearFormatting,
    'insert-table': messages.insertTable,
    'delete-table': messages.deleteTable,
    'add-row-before': messages.addRowBefore,
    'add-row-after': messages.addRowAfter,
    'delete-row': messages.deleteRow,
    'add-column-before': messages.addColumnBefore,
    'add-column-after': messages.addColumnAfter,
    'delete-column': messages.deleteColumn,
    'merge-cells': messages.mergeCells,
    'split-cell': messages.splitCell,
    'toggle-header-row': messages.toggleHeaderRow,
  };
  return labels[command];
}

function isTextAlignActive(
  controller: NeuralEditorController,
  alignment: 'left' | 'center' | 'right' | 'justify',
): boolean {
  return (
    controller.isActive('paragraph', { textAlign: alignment }) ||
    controller.isActive('heading', { textAlign: alignment })
  );
}
