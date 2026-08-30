import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  TemplateRef,
  ViewEncapsulation,
  computed,
  input,
  signal,
  viewChild,
} from '@angular/core';
import type { NeuralEditorMessages } from '@neural-ng/core';
import type { NeuralEditorController } from './editor.types';
import type {
  NeuralEditorLinkPopoverTemplateContext,
  NeuralEditorMenuTemplateContext,
} from './editor-context-menu-template.directives';

@Component({
  selector: 'neural-editor-context-menus',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `
    <div
      #bubbleMenu
      style="display: none"
      [class]="bubbleMenuClass()"
      [attr.role]="linkPopoverOpen() ? 'dialog' : 'toolbar'"
      [attr.aria-label]="
        linkPopoverOpen() ? messages().linkPopover : messages().bubbleMenu
      "
      [attr.aria-controls]="editorId() || null"
      (keydown.escape)="closeLinkPopover()"
      (focusout)="handleBubbleFocusOut()"
    >
      @if (linkPopoverOpen()) {
        @if (linkPopoverTemplate(); as customLinkPopover) {
          <ng-container
            [ngTemplateOutlet]="customLinkPopover"
            [ngTemplateOutletContext]="linkPopoverContext()"
          />
        } @else {
          <form [class]="linkPopoverClass()" (submit)="applyLink($event)">
            <label class="neural-editor-visually-hidden" [for]="linkInputId()">
              {{ messages().linkUrl }}
            </label>
            <input
              #linkInput
              data-neural-editor-link-input
              type="url"
              [id]="linkInputId()"
              [class]="linkPopoverInputClass()"
              [value]="linkHref()"
              [placeholder]="messages().linkPlaceholder"
              autocomplete="url"
              (input)="setLinkHref(asInputValue($event))"
              (keydown.escape)="closeLinkPopover()"
            />
            <button
              type="submit"
              [class]="linkPopoverActionClass()"
              [disabled]="!linkHref().trim()"
            >
              {{ messages().applyLink }}
            </button>
            @if (controller().isActive('link')) {
              <button
                type="button"
                [class]="linkPopoverActionClass()"
                (click)="removeLink()"
              >
                {{ messages().removeLink }}
              </button>
            }
            <button
              type="button"
              [class]="linkPopoverActionClass()"
              (click)="closeLinkPopover()"
            >
              {{ messages().closeLinkPopover }}
            </button>
          </form>
        }
      } @else if (showBubbleMenu()) {
        @if (bubbleMenuTemplate(); as customBubbleMenu) {
          <ng-container
            [ngTemplateOutlet]="customBubbleMenu"
            [ngTemplateOutletContext]="menuContext()"
          />
        } @else if (controller().isActive('image')) {
          <button
            type="button"
            [class]="bubbleButtonClass()"
            [disabled]="!editable()"
            (pointerdown)="$event.preventDefault()"
            (click)="controller().removeImage()"
          >
            {{ messages().removeImage }}
          </button>
        } @else {
          <button
            type="button"
            [class]="bubbleButtonClass()"
            [disabled]="!editable()"
            [attr.aria-pressed]="controller().isActive('bold')"
            (pointerdown)="$event.preventDefault()"
            (click)="controller().toggleBold()"
          >
            {{ messages().bold }}
          </button>
          <button
            type="button"
            [class]="bubbleButtonClass()"
            [disabled]="!editable()"
            [attr.aria-pressed]="controller().isActive('italic')"
            (pointerdown)="$event.preventDefault()"
            (click)="controller().toggleItalic()"
          >
            {{ messages().italic }}
          </button>
          <button
            type="button"
            [class]="bubbleButtonClass()"
            [disabled]="!editable()"
            [attr.aria-pressed]="controller().isActive('underline')"
            (pointerdown)="$event.preventDefault()"
            (click)="controller().toggleUnderline()"
          >
            {{ messages().underline }}
          </button>
          <button
            type="button"
            [class]="bubbleButtonClass()"
            [disabled]="!editable()"
            [attr.aria-pressed]="controller().isActive('strike')"
            (pointerdown)="$event.preventDefault()"
            (click)="controller().toggleStrike()"
          >
            {{ messages().strike }}
          </button>
          @if (showLinkPopover()) {
            <button
              type="button"
              [class]="bubbleButtonClass()"
              [disabled]="!editable()"
              [attr.aria-pressed]="controller().isActive('link')"
              aria-haspopup="dialog"
              (pointerdown)="$event.preventDefault()"
              (click)="controller().openLinkPopover()"
            >
              {{ messages().link }}
            </button>
          }
        }
      }
    </div>

    <div
      #floatingMenu
      style="display: none"
      [class]="floatingMenuClass()"
      role="toolbar"
      [attr.aria-label]="messages().floatingMenu"
      [attr.aria-controls]="editorId() || null"
    >
      @if (showFloatingMenu()) {
        @if (floatingMenuTemplate(); as customFloatingMenu) {
          <ng-container
            [ngTemplateOutlet]="customFloatingMenu"
            [ngTemplateOutletContext]="menuContext()"
          />
        } @else {
          <button
            type="button"
            [class]="floatingButtonClass()"
            [disabled]="!editable()"
            (pointerdown)="$event.preventDefault()"
            (click)="controller().toggleHeading(1)"
          >
            {{ messages().heading1 }}
          </button>
          <button
            type="button"
            [class]="floatingButtonClass()"
            [disabled]="!editable()"
            (pointerdown)="$event.preventDefault()"
            (click)="controller().toggleBulletList()"
          >
            {{ messages().bulletList }}
          </button>
          <button
            type="button"
            [class]="floatingButtonClass()"
            [disabled]="!editable()"
            (pointerdown)="$event.preventDefault()"
            (click)="controller().toggleTaskList()"
          >
            {{ messages().taskList }}
          </button>
          <button
            type="button"
            [class]="floatingButtonClass()"
            [disabled]="!editable()"
            (pointerdown)="$event.preventDefault()"
            (click)="controller().requestImageInsert()"
          >
            {{ messages().insertImage }}
          </button>
        }
      }
    </div>
  `,
  styles: `
    :where(.neural-editor-bubble-menu-root),
    :where(.neural-editor-floating-menu-root) {
      box-sizing: border-box;
      z-index: var(--neural-editor-context-menu-z-index, 1000);
      max-width: calc(100vw - 1rem);
    }
    :where(.neural-editor-bubble-menu-base),
    :where(.neural-editor-floating-menu-base) {
      display: flex;
      gap: var(--neural-editor-context-menu-gap, 0.25rem);
      align-items: center;
      padding: var(--neural-editor-context-menu-padding, 0.35rem);
      color: var(--neural-editor-context-menu-color, inherit);
      background: var(--neural-editor-context-menu-background, Canvas);
      border: var(--neural-editor-context-menu-border, 1px solid currentColor);
      border-radius: var(--neural-editor-context-menu-radius, 0.5rem);
      box-shadow: var(
        --neural-editor-context-menu-shadow,
        0 0.75rem 2rem rgb(0 0 0 / 0.2)
      );
      overflow-x: auto;
      overscroll-behavior: contain;
      scrollbar-width: thin;
    }
    :where(.neural-editor-context-menu-button-root) {
      box-sizing: border-box;
      flex: 0 0 auto;
    }
    :where(.neural-editor-context-menu-button-base) {
      min-height: var(--neural-editor-context-menu-button-height, 2rem);
      padding: var(
        --neural-editor-context-menu-button-padding,
        0.35rem 0.55rem
      );
      color: var(--neural-editor-context-menu-button-color, inherit);
      background: var(
        --neural-editor-context-menu-button-background,
        transparent
      );
      border: var(--neural-editor-context-menu-button-border, 0);
      border-radius: var(--neural-editor-context-menu-button-radius, 0.375rem);
      font: inherit;
      white-space: nowrap;
      cursor: pointer;
    }
    :where(.neural-editor-context-menu-button-base:hover:not(:disabled)),
    :where(.neural-editor-context-menu-button-base[aria-pressed='true']) {
      color: var(--neural-editor-context-menu-button-color-active, inherit);
      background: var(
        --neural-editor-context-menu-button-background-active,
        transparent
      );
    }
    :where(.neural-editor-context-menu-button-base:focus-visible),
    :where(.neural-editor-link-popover-input-base:focus-visible),
    :where(.neural-editor-link-popover-action-base:focus-visible) {
      outline: var(--neural-editor-focus-ring, 2px solid currentColor);
      outline-offset: var(--neural-editor-focus-ring-offset, 2px);
    }
    :where(.neural-editor-link-popover-root) {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      min-width: 0;
    }
    :where(.neural-editor-link-popover-base) {
      gap: var(--neural-editor-link-gap, 0.375rem);
    }
    :where(.neural-editor-link-popover-input-root) {
      box-sizing: border-box;
      min-width: 0;
    }
    :where(.neural-editor-link-popover-input-base) {
      width: min(18rem, 52vw);
      min-height: var(--neural-editor-link-control-height, 2rem);
      padding: var(--neural-editor-link-input-padding, 0.35rem 0.5rem);
      color: var(--neural-editor-color, inherit);
      background: var(--neural-editor-link-input-background, transparent);
      border: var(--neural-editor-link-input-border, 1px solid currentColor);
      border-radius: var(--neural-editor-link-input-radius, 0.375rem);
      font: inherit;
      outline: 0;
    }
    :where(.neural-editor-link-popover-action-root) {
      box-sizing: border-box;
      flex: 0 0 auto;
    }
    :where(.neural-editor-link-popover-action-base) {
      min-height: var(--neural-editor-link-control-height, 2rem);
      padding: var(--neural-editor-link-action-padding, 0.35rem 0.6rem);
      color: var(--neural-editor-link-action-color, inherit);
      background: var(--neural-editor-link-action-background, transparent);
      border: var(--neural-editor-link-action-border, 1px solid currentColor);
      border-radius: var(--neural-editor-link-action-radius, 0.375rem);
      font: inherit;
      white-space: nowrap;
      cursor: pointer;
    }
    :where(.neural-editor-visually-hidden) {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    @media (max-width: 40rem) {
      :where(.neural-editor-bubble-menu-base),
      :where(.neural-editor-floating-menu-base) {
        max-width: calc(100vw - 0.75rem);
        padding: var(--neural-editor-context-menu-mobile-padding, 0.3rem);
      }
      :where(.neural-editor-link-popover-base) {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        width: min(30rem, calc(100vw - 1.5rem));
      }
      :where(.neural-editor-link-popover-input-base) {
        width: 100%;
        grid-column: 1 / -1;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EditorContextMenusComponent {
  readonly controller = input.required<NeuralEditorController>();
  readonly messages = input.required<NeuralEditorMessages>();
  readonly editable = input(true);
  readonly editorId = input('');
  readonly showBubbleMenu = input(true);
  readonly showFloatingMenu = input(true);
  readonly showLinkPopover = input(true);

  readonly bubbleMenuTemplate =
    input<TemplateRef<NeuralEditorMenuTemplateContext> | null>(null);
  readonly floatingMenuTemplate =
    input<TemplateRef<NeuralEditorMenuTemplateContext> | null>(null);
  readonly linkPopoverTemplate =
    input<TemplateRef<NeuralEditorLinkPopoverTemplateContext> | null>(null);

  readonly bubbleMenuClass = input('');
  readonly bubbleButtonClass = input('');
  readonly floatingMenuClass = input('');
  readonly floatingButtonClass = input('');
  readonly linkPopoverClass = input('');
  readonly linkPopoverInputClass = input('');
  readonly linkPopoverActionClass = input('');

  readonly linkPopoverOpen = signal(false);
  readonly linkHref = signal('');

  private readonly bubbleMenuRef =
    viewChild.required<ElementRef<HTMLElement>>('bubbleMenu');
  private readonly floatingMenuRef =
    viewChild.required<ElementRef<HTMLElement>>('floatingMenu');
  private readonly linkInput =
    viewChild<ElementRef<HTMLInputElement>>('linkInput');

  readonly menuContext = computed<NeuralEditorMenuTemplateContext>(() => ({
    $implicit: this.controller(),
    editor: this.controller(),
  }));

  readonly linkPopoverContext =
    computed<NeuralEditorLinkPopoverTemplateContext>(() => ({
      ...this.menuContext(),
      href: this.linkHref,
      setHref: (href) => this.setLinkHref(href),
      apply: () => this.applyCurrentLink(),
      remove: () => this.removeLink(),
      close: () => this.closeLinkPopover(),
    }));

  bubbleElement(): HTMLElement {
    return this.bubbleMenuRef().nativeElement;
  }

  floatingElement(): HTMLElement {
    return this.floatingMenuRef().nativeElement;
  }

  attachTo(target: HTMLElement): void {
    target.appendChild(this.bubbleElement());
    target.appendChild(this.floatingElement());
  }

  openLinkPopover(href: string): void {
    if (!this.showLinkPopover() || !this.editable()) return;
    this.linkHref.set(href);
    this.linkPopoverOpen.set(true);
    queueMicrotask(() => this.focusLinkInput());
  }

  closeLinkPopover(): void {
    if (!this.linkPopoverOpen()) return;
    this.linkPopoverOpen.set(false);
    this.controller().focus();
  }

  focusLinkInput(): void {
    const element =
      this.linkInput()?.nativeElement ??
      this.bubbleElement().querySelector<HTMLElement>(
        '[data-neural-editor-link-input], input, [tabindex]:not([tabindex="-1"])',
      );
    element?.focus();
  }

  setLinkHref(href: string): void {
    this.linkHref.set(href);
  }

  applyLink(event: Event): void {
    event.preventDefault();
    this.applyCurrentLink();
  }

  removeLink(): void {
    this.controller().unsetLink();
    this.closeLinkPopover();
  }

  asInputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  linkInputId(): string {
    return `${this.editorId() || 'neural-editor'}-link-popover-url`;
  }

  handleBubbleFocusOut(): void {
    if (!this.linkPopoverOpen()) return;
    queueMicrotask(() => {
      const activeElement = this.bubbleElement().ownerDocument.activeElement;
      if (!activeElement || !this.bubbleElement().contains(activeElement)) {
        this.closeLinkPopover();
      }
    });
  }

  detachMovedElements(): void {
    this.bubbleElement().remove();
    this.floatingElement().remove();
  }

  private applyCurrentLink(): void {
    const href = this.linkHref().trim();
    if (!href) return;
    this.controller().setLink(href);
    this.closeLinkPopover();
  }
}
