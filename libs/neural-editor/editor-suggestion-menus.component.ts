import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  TemplateRef,
  ViewEncapsulation,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { NeuralEditorMessages } from '@neural-ng/core';
import type {
  NeuralEditorCommandExecutedEvent,
  NeuralEditorCommandPaletteItem,
  NeuralEditorController,
  NeuralEditorMentionItem,
  NeuralEditorMentionSelectedEvent,
  NeuralEditorSlashCommand,
  NeuralEditorSuggestionKind,
  NeuralEditorSuggestionRange,
} from './editor.types';
import type {
  NeuralEditorCommandPaletteTemplateContext,
  NeuralEditorSuggestionMenuTemplateContext,
} from './editor-suggestion-menu-template.directives';

export interface NeuralEditorSuggestionViewProps<T> {
  readonly query: string;
  readonly items: readonly T[];
  readonly range: NeuralEditorSuggestionRange;
  readonly loading: boolean;
  readonly command: (item: T) => void;
}

@Component({
  selector: 'neural-editor-suggestion-menus',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `
    <div #suggestionHost hidden aria-hidden="true"></div>

    <div
      #slashMenu
      hidden
      [id]="menuId('slash')"
      [class]="slashMenuClass()"
      role="listbox"
      [attr.aria-label]="messages().slashMenu"
      [attr.aria-activedescendant]="activeOptionId('slash')"
      [attr.aria-busy]="slashLoading()"
      (pointerdown)="$event.preventDefault()"
    >
      @if (slashMenuTemplate(); as customTemplate) {
        <ng-container
          [ngTemplateOutlet]="customTemplate"
          [ngTemplateOutletContext]="slashContext()"
        />
      } @else {
        <ng-container
          [ngTemplateOutlet]="defaultSuggestionList"
          [ngTemplateOutletContext]="{ kind: 'slash' }"
        />
      }
    </div>

    <div
      #mentionMenu
      hidden
      [id]="menuId('mention')"
      [class]="mentionMenuClass()"
      role="listbox"
      [attr.aria-label]="messages().mentionMenu"
      [attr.aria-activedescendant]="activeOptionId('mention')"
      [attr.aria-busy]="mentionLoading()"
      (pointerdown)="$event.preventDefault()"
    >
      @if (mentionMenuTemplate(); as customTemplate) {
        <ng-container
          [ngTemplateOutlet]="customTemplate"
          [ngTemplateOutletContext]="mentionContext()"
        />
      } @else {
        <ng-container
          [ngTemplateOutlet]="defaultSuggestionList"
          [ngTemplateOutletContext]="{ kind: 'mention' }"
        />
      }
    </div>

    <ng-template #defaultSuggestionList let-kind="kind">
      @if (loadingFor(kind)) {
        <div [class]="suggestionStateClass()" role="status">
          {{ messages().suggestionLoading }}
        </div>
      } @else if (itemsFor(kind).length === 0) {
        <div [class]="suggestionStateClass()" role="status">
          {{
            kind === 'mention' ? messages().mentionEmpty : messages().slashEmpty
          }}
        </div>
      } @else {
        <div [class]="suggestionListClass()">
          @for (item of itemsFor(kind); track item.id; let index = $index) {
            <button
              type="button"
              tabindex="-1"
              role="option"
              [id]="optionId(kind, index)"
              [class]="suggestionItemClass()"
              [attr.aria-selected]="activeIndexFor(kind) === index"
              [disabled]="itemDisabled(item)"
              (mouseenter)="setActiveIndex(kind, index)"
              (click)="select(kind, index)"
            >
              @if (kind === 'mention' && mentionAvatar(item); as avatarUrl) {
                <img
                  [class]="suggestionItemIconClass()"
                  [src]="avatarUrl"
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              } @else if (itemIconClass(item)) {
                <span
                  [class]="
                    suggestionItemIconClass() + ' ' + itemIconClass(item)
                  "
                  aria-hidden="true"
                ></span>
              }

              <span [class]="suggestionItemContentClass()">
                <span [class]="suggestionItemLabelClass()">
                  {{ item.label }}
                </span>
                @if (item.description) {
                  <span [class]="suggestionItemDescriptionClass()">
                    {{ item.description }}
                  </span>
                }
              </span>

              @if (itemShortcut(item); as shortcut) {
                <kbd>{{ shortcut }}</kbd>
              }
            </button>
          }
        </div>
      }
    </ng-template>

    <div
      #commandPalette
      hidden
      [class]="commandPaletteClass()"
      role="presentation"
    >
      <div
        [class]="commandPaletteBackdropClass()"
        (pointerdown)="closeCommandPalette()"
      ></div>
      <section
        #commandPalettePanel
        tabindex="-1"
        [class]="commandPalettePanelClass()"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="messages().commandPalette"
        (pointerdown)="$event.stopPropagation()"
        (keydown.escape)="closeCommandPalette()"
        (keydown)="trapPaletteFocus($event)"
      >
        @if (commandPaletteTemplate(); as customTemplate) {
          <ng-container
            [ngTemplateOutlet]="customTemplate"
            [ngTemplateOutletContext]="commandPaletteContext()"
          />
        } @else {
          <label class="neural-editor-visually-hidden" [for]="paletteInputId()">
            {{ messages().commandPalettePlaceholder }}
          </label>
          <input
            #paletteInput
            type="search"
            autocomplete="off"
            [id]="paletteInputId()"
            [class]="commandPaletteInputClass()"
            [placeholder]="messages().commandPalettePlaceholder"
            [value]="commandPaletteQuery()"
            [attr.aria-controls]="paletteListId()"
            [attr.aria-activedescendant]="activePaletteOptionId()"
            (input)="setCommandPaletteQuery($any($event.target).value)"
            (keydown)="handleCommandPaletteKeyDown($event)"
          />

          <div
            [id]="paletteListId()"
            [class]="commandPaletteListClass()"
            role="listbox"
            [attr.aria-label]="messages().commandPalette"
          >
            @if (filteredCommandPaletteItems().length === 0) {
              <div [class]="suggestionStateClass()" role="status">
                {{ messages().commandPaletteEmpty }}
              </div>
            } @else {
              @for (
                item of filteredCommandPaletteItems();
                track item.id;
                let index = $index
              ) {
                <button
                  type="button"
                  tabindex="-1"
                  role="option"
                  [id]="paletteOptionId(index)"
                  [class]="commandPaletteItemClass()"
                  [attr.aria-selected]="commandPaletteActiveIndex() === index"
                  [disabled]="itemDisabled(item)"
                  (mouseenter)="setCommandPaletteActiveIndex(index)"
                  (click)="executeCommandPaletteItem(index)"
                >
                  @if (itemIconClass(item)) {
                    <span
                      [class]="
                        suggestionItemIconClass() + ' ' + itemIconClass(item)
                      "
                      aria-hidden="true"
                    ></span>
                  }
                  <span [class]="suggestionItemContentClass()">
                    <span [class]="suggestionItemLabelClass()">
                      {{ item.label }}
                    </span>
                    @if (item.description) {
                      <span [class]="suggestionItemDescriptionClass()">
                        {{ item.description }}
                      </span>
                    }
                  </span>
                  @if (itemShortcut(item); as shortcut) {
                    <kbd>{{ shortcut }}</kbd>
                  }
                </button>
              }
            }
          </div>
        }
      </section>
    </div>
  `,
  styles: `
    :where(.neural-editor-suggestion-menu-root) {
      box-sizing: border-box;
      z-index: var(--neural-editor-suggestion-z-index, 1100);
      width: min(
        var(--neural-editor-suggestion-width, 20rem),
        calc(100vw - 1rem)
      );
      max-height: min(
        var(--neural-editor-suggestion-max-height, 22rem),
        calc(100vh - 1rem)
      );
      overflow: auto;
    }
    :where(.neural-editor-suggestion-menu-base) {
      padding: var(--neural-editor-suggestion-padding, 0.35rem);
      color: var(--neural-editor-suggestion-color, inherit);
      background: var(--neural-editor-suggestion-background, Canvas);
      border: var(--neural-editor-suggestion-border, 1px solid currentColor);
      border-radius: var(--neural-editor-suggestion-radius, 0.65rem);
      box-shadow: var(
        --neural-editor-suggestion-shadow,
        0 1rem 2.5rem rgb(0 0 0 / 0.24)
      );
      overscroll-behavior: contain;
      scrollbar-width: thin;
    }
    :where(.neural-editor-suggestion-list-root) {
      display: grid;
      min-width: 0;
    }
    :where(.neural-editor-suggestion-list-base) {
      gap: var(--neural-editor-suggestion-list-gap, 0.15rem);
    }
    :where(.neural-editor-suggestion-item-root) {
      box-sizing: border-box;
      display: flex;
      width: 100%;
      min-width: 0;
      align-items: center;
      text-align: start;
    }
    :where(.neural-editor-suggestion-item-base) {
      gap: var(--neural-editor-suggestion-item-gap, 0.65rem);
      min-height: var(--neural-editor-suggestion-item-height, 2.75rem);
      padding: var(--neural-editor-suggestion-item-padding, 0.45rem 0.6rem);
      color: var(--neural-editor-suggestion-item-color, inherit);
      background: var(--neural-editor-suggestion-item-background, transparent);
      border: var(--neural-editor-suggestion-item-border, 0);
      border-radius: var(--neural-editor-suggestion-item-radius, 0.45rem);
      font: inherit;
      cursor: pointer;
    }
    :where(.neural-editor-suggestion-item-base:hover:not(:disabled)),
    :where(.neural-editor-suggestion-item-base[aria-selected='true']) {
      color: var(--neural-editor-suggestion-item-color-active, inherit);
      background: var(
        --neural-editor-suggestion-item-background-active,
        color-mix(in srgb, currentColor 12%, transparent)
      );
    }
    :where(.neural-editor-suggestion-item-base:focus-visible),
    :where(.neural-editor-command-palette-item-base:focus-visible),
    :where(.neural-editor-command-palette-input-base:focus-visible) {
      outline: var(
        --neural-editor-suggestion-focus-ring,
        2px solid currentColor
      );
      outline-offset: var(--neural-editor-suggestion-focus-ring-offset, 1px);
    }
    :where(.neural-editor-suggestion-item-base:disabled) {
      opacity: var(--neural-editor-suggestion-item-disabled-opacity, 0.45);
      cursor: default;
    }
    :where(.neural-editor-suggestion-item-icon-root) {
      box-sizing: border-box;
      flex: 0 0 auto;
      width: var(--neural-editor-suggestion-icon-size, 1.75rem);
      height: var(--neural-editor-suggestion-icon-size, 1.75rem);
      object-fit: cover;
      border-radius: var(--neural-editor-suggestion-icon-radius, 0.4rem);
    }
    :where(.neural-editor-suggestion-item-content-root) {
      display: grid;
      min-width: 0;
      flex: 1 1 auto;
    }
    :where(.neural-editor-suggestion-item-label-root) {
      overflow: hidden;
      font-weight: var(--neural-editor-suggestion-label-weight, 600);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    :where(.neural-editor-suggestion-item-description-root) {
      overflow: hidden;
      color: var(--neural-editor-suggestion-description-color, inherit);
      font-size: var(--neural-editor-suggestion-description-size, 0.78rem);
      opacity: var(--neural-editor-suggestion-description-opacity, 0.7);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    :where(.neural-editor-suggestion-state-root) {
      box-sizing: border-box;
    }
    :where(.neural-editor-suggestion-state-base) {
      padding: var(--neural-editor-suggestion-state-padding, 0.8rem);
      color: var(--neural-editor-suggestion-state-color, inherit);
      text-align: center;
      opacity: var(--neural-editor-suggestion-state-opacity, 0.72);
    }
    :where(.neural-editor-command-palette-root) {
      position: fixed;
      inset: 0;
      z-index: var(--neural-editor-command-palette-z-index, 1200);
      box-sizing: border-box;
      display: grid;
      align-items: start;
      justify-items: center;
      padding: min(12vh, 7rem) 1rem 1rem;
    }
    :where(.neural-editor-command-palette-backdrop-root) {
      position: absolute;
      inset: 0;
      background: var(
        --neural-editor-command-palette-backdrop,
        rgb(0 0 0 / 0.48)
      );
      backdrop-filter: var(
        --neural-editor-command-palette-backdrop-filter,
        blur(2px)
      );
    }
    :where(.neural-editor-command-palette-panel-root) {
      position: relative;
      box-sizing: border-box;
      display: grid;
      width: min(var(--neural-editor-command-palette-width, 42rem), 100%);
      min-width: 0;
      max-height: min(
        var(--neural-editor-command-palette-max-height, 34rem),
        calc(100vh - 2rem)
      );
      overflow: hidden;
    }
    :where(.neural-editor-command-palette-panel-base) {
      color: var(--neural-editor-command-palette-color, inherit);
      background: var(--neural-editor-command-palette-background, Canvas);
      border: var(
        --neural-editor-command-palette-border,
        1px solid currentColor
      );
      border-radius: var(--neural-editor-command-palette-radius, 0.85rem);
      box-shadow: var(
        --neural-editor-command-palette-shadow,
        0 1.5rem 4rem rgb(0 0 0 / 0.3)
      );
    }
    :where(.neural-editor-command-palette-input-root) {
      box-sizing: border-box;
      width: 100%;
      min-height: var(--neural-editor-command-palette-input-height, 3rem);
    }
    :where(.neural-editor-command-palette-input-base) {
      padding: var(--neural-editor-command-palette-input-padding, 0.75rem 1rem);
      color: inherit;
      background: var(
        --neural-editor-command-palette-input-background,
        transparent
      );
      border: var(--neural-editor-command-palette-input-border, 0);
      border-block-end: var(
        --neural-editor-command-palette-divider,
        1px solid currentColor
      );
      font: inherit;
      outline: 0;
    }
    :where(.neural-editor-command-palette-panel-root:focus) {
      outline: 0;
    }
    :where(.neural-editor-command-palette-list-root) {
      display: grid;
      min-width: 0;
      overflow: auto;
      padding: var(--neural-editor-command-palette-list-padding, 0.4rem);
      overscroll-behavior: contain;
    }
    :where(.neural-editor-command-palette-item-root) {
      box-sizing: border-box;
      display: flex;
      width: 100%;
      min-width: 0;
      align-items: center;
      text-align: start;
    }
    :where(.neural-editor-command-palette-item-base) {
      gap: var(--neural-editor-command-palette-item-gap, 0.7rem);
      min-height: var(--neural-editor-command-palette-item-height, 3rem);
      padding: var(--neural-editor-command-palette-item-padding, 0.5rem 0.7rem);
      color: inherit;
      background: transparent;
      border: 0;
      border-radius: var(--neural-editor-command-palette-item-radius, 0.5rem);
      font: inherit;
      cursor: pointer;
    }
    :where(.neural-editor-command-palette-item-base:disabled) {
      opacity: var(--neural-editor-command-palette-item-disabled-opacity, 0.45);
      cursor: default;
    }
    :where(.neural-editor-command-palette-item-base:hover:not(:disabled)),
    :where(.neural-editor-command-palette-item-base[aria-selected='true']) {
      background: var(
        --neural-editor-command-palette-item-background-active,
        color-mix(in srgb, currentColor 12%, transparent)
      );
    }
    :where(.neural-editor-suggestion-item-base kbd),
    :where(.neural-editor-command-palette-item-base kbd) {
      flex: 0 0 auto;
      color: inherit;
      font: inherit;
      font-size: 0.75em;
      opacity: 0.65;
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
      :where(.neural-editor-command-palette-root) {
        align-items: end;
        padding: 0;
      }
      :where(.neural-editor-command-palette-panel-root) {
        width: 100%;
        max-height: min(78vh, 38rem);
      }
      :where(.neural-editor-command-palette-panel-base) {
        border-radius: var(
          --neural-editor-command-palette-mobile-radius,
          1rem 1rem 0 0
        );
      }
      :where(.neural-editor-suggestion-menu-root) {
        width: min(24rem, calc(100vw - 0.75rem));
        max-height: min(46vh, 22rem);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      :where(.neural-editor-command-palette-root),
      :where(.neural-editor-suggestion-menu-root) {
        scroll-behavior: auto;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EditorSuggestionMenusComponent {
  readonly controller = input.required<NeuralEditorController>();
  readonly messages = input.required<NeuralEditorMessages>();
  readonly editable = input(true);
  readonly editorId = input('');
  readonly appendTarget = input.required<() => HTMLElement>();
  readonly contentElement = input.required<() => HTMLElement | null>();
  readonly commandPaletteItems = input<
    readonly NeuralEditorCommandPaletteItem[]
  >([]);

  readonly slashMenuTemplate = input<TemplateRef<
    NeuralEditorSuggestionMenuTemplateContext<NeuralEditorSlashCommand>
  > | null>(null);
  readonly mentionMenuTemplate = input<TemplateRef<
    NeuralEditorSuggestionMenuTemplateContext<NeuralEditorMentionItem>
  > | null>(null);
  readonly commandPaletteTemplate =
    input<TemplateRef<NeuralEditorCommandPaletteTemplateContext> | null>(null);

  readonly slashMenuClass = input('');
  readonly mentionMenuClass = input('');
  readonly suggestionListClass = input('');
  readonly suggestionItemClass = input('');
  readonly suggestionItemIconClass = input('');
  readonly suggestionItemContentClass = input('');
  readonly suggestionItemLabelClass = input('');
  readonly suggestionItemDescriptionClass = input('');
  readonly suggestionStateClass = input('');
  readonly commandPaletteClass = input('');
  readonly commandPaletteBackdropClass = input('');
  readonly commandPalettePanelClass = input('');
  readonly commandPaletteInputClass = input('');
  readonly commandPaletteListClass = input('');
  readonly commandPaletteItemClass = input('');

  readonly overlayOpened = output<'slash' | 'mention' | 'command-palette'>();
  readonly closeSuggestionsRequested = output<void>();
  readonly commandExecuted = output<NeuralEditorCommandExecutedEvent>();
  readonly mentionSelected = output<NeuralEditorMentionSelectedEvent>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly suggestionHost =
    viewChild.required<ElementRef<HTMLElement>>('suggestionHost');
  private readonly slashMenu =
    viewChild.required<ElementRef<HTMLElement>>('slashMenu');
  private readonly mentionMenu =
    viewChild.required<ElementRef<HTMLElement>>('mentionMenu');
  private readonly commandPalette =
    viewChild.required<ElementRef<HTMLElement>>('commandPalette');
  private readonly commandPalettePanel = viewChild.required<
    ElementRef<HTMLElement>
  >('commandPalettePanel');
  private readonly paletteInput =
    viewChild<ElementRef<HTMLInputElement>>('paletteInput');

  private readonly activeSuggestion = signal<NeuralEditorSuggestionKind | null>(
    null,
  );
  private readonly slashQuery = signal('');
  private readonly mentionQuery = signal('');
  private readonly slashItems = signal<readonly NeuralEditorSlashCommand[]>([]);
  private readonly mentionItems = signal<readonly NeuralEditorMentionItem[]>(
    [],
  );
  private readonly slashActiveIndex = signal(0);
  private readonly mentionActiveIndex = signal(0);
  protected readonly slashLoading = signal(false);
  protected readonly mentionLoading = signal(false);
  private readonly slashRange = signal<NeuralEditorSuggestionRange>({
    from: 0,
    to: 0,
  });
  private readonly mentionRange = signal<NeuralEditorSuggestionRange>({
    from: 0,
    to: 0,
  });
  private slashCommand: ((item: NeuralEditorSlashCommand) => void) | null =
    null;
  private mentionCommand: ((item: NeuralEditorMentionItem) => void) | null =
    null;

  private readonly notLoading = signal(false);
  readonly commandPaletteOpen = signal(false);
  readonly commandPaletteQuery = signal('');
  readonly commandPaletteActiveIndex = signal(0);

  readonly filteredCommandPaletteItems = computed(() =>
    filterItems(this.commandPaletteItems(), this.commandPaletteQuery()),
  );
  readonly overlayOpen = computed(
    () => this.activeSuggestion() !== null || this.commandPaletteOpen(),
  );

  readonly slashContext = computed<
    NeuralEditorSuggestionMenuTemplateContext<NeuralEditorSlashCommand>
  >(() => ({
    $implicit: this.controller(),
    editor: this.controller(),
    query: this.slashQuery,
    items: this.slashItems,
    activeIndex: this.slashActiveIndex,
    loading: this.slashLoading,
    select: (index) => this.select('slash', index),
    setActiveIndex: (index) => this.setActiveIndex('slash', index),
    optionId: (index) => this.optionId('slash', index),
    close: () => this.closeSuggestionsRequested.emit(),
  }));

  readonly mentionContext = computed<
    NeuralEditorSuggestionMenuTemplateContext<NeuralEditorMentionItem>
  >(() => ({
    $implicit: this.controller(),
    editor: this.controller(),
    query: this.mentionQuery,
    items: this.mentionItems,
    activeIndex: this.mentionActiveIndex,
    loading: this.mentionLoading,
    select: (index) => this.select('mention', index),
    setActiveIndex: (index) => this.setActiveIndex('mention', index),
    optionId: (index) => this.optionId('mention', index),
    close: () => this.closeSuggestionsRequested.emit(),
  }));

  readonly commandPaletteContext =
    computed<NeuralEditorCommandPaletteTemplateContext>(() => ({
      $implicit: this.controller(),
      editor: this.controller(),
      query: this.commandPaletteQuery,
      items: this.filteredCommandPaletteItems,
      activeIndex: this.commandPaletteActiveIndex,
      loading: this.notLoading,
      select: (index) => this.executeCommandPaletteItem(index),
      setActiveIndex: (index) => this.setCommandPaletteActiveIndex(index),
      optionId: (index) => this.paletteOptionId(index),
      setQuery: (query) => this.setCommandPaletteQuery(query),
      close: () => this.closeCommandPalette(),
    }));

  constructor() {
    this.destroyRef.onDestroy(() => this.detachMovedElements());
  }

  slashElement(): HTMLElement {
    return this.slashMenu().nativeElement;
  }

  mentionElement(): HTMLElement {
    return this.mentionMenu().nativeElement;
  }

  startSlash(
    props: NeuralEditorSuggestionViewProps<NeuralEditorSlashCommand>,
  ): void {
    this.startSuggestion('slash', props);
  }

  updateSlash(
    props: NeuralEditorSuggestionViewProps<NeuralEditorSlashCommand>,
  ): void {
    this.updateSuggestion('slash', props);
  }

  exitSlash(): void {
    this.exitSuggestion('slash');
  }

  startMention(
    props: NeuralEditorSuggestionViewProps<NeuralEditorMentionItem>,
  ): void {
    this.startSuggestion('mention', props);
  }

  updateMention(
    props: NeuralEditorSuggestionViewProps<NeuralEditorMentionItem>,
  ): void {
    this.updateSuggestion('mention', props);
  }

  exitMention(): void {
    this.exitSuggestion('mention');
  }

  handleSuggestionKeyDown(
    kind: NeuralEditorSuggestionKind,
    event: KeyboardEvent,
  ): boolean {
    if (event.key === 'Escape') {
      this.closeSuggestionsRequested.emit();
      return true;
    }
    const items = this.itemsFor(kind);
    if (event.key === 'ArrowDown') {
      this.moveActive(kind, 1);
      return true;
    }
    if (event.key === 'ArrowUp') {
      this.moveActive(kind, -1);
      return true;
    }
    if (event.key === 'Home') {
      this.setActiveIndex(kind, firstEnabledIndex(items));
      return true;
    }
    if (event.key === 'End') {
      this.setActiveIndex(kind, lastEnabledIndex(items));
      return true;
    }
    if (event.key === 'Enter' || event.key === 'Tab') {
      if (items.length === 0) return false;
      this.select(kind, this.activeIndexFor(kind));
      return true;
    }
    return false;
  }

  openCommandPalette(query = ''): void {
    if (!this.editable()) return;
    this.closeSuggestionsRequested.emit();
    this.commandPaletteQuery.set(query);
    this.commandPaletteActiveIndex.set(
      firstEnabledIndex(this.filteredCommandPaletteItems()),
    );
    this.commandPaletteOpen.set(true);
    const element = this.commandPalette().nativeElement;
    element.hidden = false;
    element.remove();
    this.appendTarget()().appendChild(element);
    this.overlayOpened.emit('command-palette');
    queueMicrotask(() => this.focusCommandPalette());
  }

  closeCommandPalette(restoreFocus = true): void {
    if (!this.commandPaletteOpen()) return;
    this.commandPaletteOpen.set(false);
    const element = this.commandPalette().nativeElement;
    element.hidden = true;
    element.remove();
    this.suggestionHost().nativeElement.after(element);
    if (restoreFocus) queueMicrotask(() => this.controller().focus());
  }

  toggleCommandPalette(query = ''): void {
    if (this.commandPaletteOpen()) this.closeCommandPalette();
    else this.openCommandPalette(query);
  }

  closeAll(restoreFocus = false): void {
    this.closeCommandPalette(restoreFocus);
    this.closeSuggestionsRequested.emit();
  }

  detachMovedElements(): void {
    this.clearSuggestionAria();
    this.slashMenu().nativeElement.remove();
    this.mentionMenu().nativeElement.remove();
    this.commandPalette().nativeElement.remove();
  }

  itemsFor(kind: NeuralEditorSuggestionKind): readonly SuggestionItem[] {
    return kind === 'slash' ? this.slashItems() : this.mentionItems();
  }

  loadingFor(kind: NeuralEditorSuggestionKind): boolean {
    return kind === 'slash' ? this.slashLoading() : this.mentionLoading();
  }

  activeIndexFor(kind: NeuralEditorSuggestionKind): number {
    return kind === 'slash'
      ? this.slashActiveIndex()
      : this.mentionActiveIndex();
  }

  setActiveIndex(kind: NeuralEditorSuggestionKind, index: number): void {
    const items = this.itemsFor(kind);
    const next = items.length === 0 ? 0 : clamp(index, 0, items.length - 1);
    const enabledIndex = itemDisabledAt(items, next)
      ? nextEnabledIndex(items, next, 1)
      : next;
    if (kind === 'slash') this.slashActiveIndex.set(enabledIndex);
    else this.mentionActiveIndex.set(enabledIndex);
    this.syncSuggestionAria(kind);
  }

  select(kind: NeuralEditorSuggestionKind, index: number): void {
    if (kind === 'slash') {
      const item = this.slashItems()[index];
      if (!item || item.disabled) return;
      this.slashCommand?.(item);
      this.commandExecuted.emit({
        id: item.id,
        source: 'slash',
        controller: this.controller(),
      });
      return;
    }

    const item = this.mentionItems()[index];
    if (!item) return;
    this.mentionCommand?.(item);
    this.mentionSelected.emit({ item, controller: this.controller() });
  }

  setCommandPaletteQuery(query: string): void {
    this.commandPaletteQuery.set(query);
    this.commandPaletteActiveIndex.set(
      firstEnabledIndex(this.filteredCommandPaletteItems()),
    );
  }

  setCommandPaletteActiveIndex(index: number): void {
    const items = this.filteredCommandPaletteItems();
    if (items.length === 0) {
      this.commandPaletteActiveIndex.set(0);
      return;
    }
    const next = clamp(index, 0, items.length - 1);
    this.commandPaletteActiveIndex.set(
      itemDisabledAt(items, next) ? nextEnabledIndex(items, next, 1) : next,
    );
  }

  executeCommandPaletteItem(index: number): void {
    const item = this.filteredCommandPaletteItems()[index];
    if (!item || item.disabled) return;
    item.execute({
      controller: this.controller(),
      query: this.commandPaletteQuery(),
    });
    this.commandExecuted.emit({
      id: item.id,
      source: 'command-palette',
      controller: this.controller(),
    });
    this.closeCommandPalette(false);
    queueMicrotask(() => this.controller().focus());
  }

  handleCommandPaletteKeyDown(event: KeyboardEvent): void {
    const items = this.filteredCommandPaletteItems();
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeCommandPalette();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.moveCommandPaletteActive(1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveCommandPaletteActive(-1);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      this.setCommandPaletteActiveIndex(firstEnabledIndex(items));
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      this.setCommandPaletteActiveIndex(lastEnabledIndex(items));
      return;
    }
    if (event.key === 'Enter' && items.length > 0) {
      event.preventDefault();
      this.executeCommandPaletteItem(this.commandPaletteActiveIndex());
    }
  }

  trapPaletteFocus(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;

    const panel = event.currentTarget as HTMLElement;
    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
      ),
    ).filter(
      (element) => !element.hidden && element.getClientRects().length > 0,
    );
    if (focusable.length === 0) return;
    const current = panel.ownerDocument.activeElement;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && current === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && current === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private moveCommandPaletteActive(delta: number): void {
    const items = this.filteredCommandPaletteItems();
    if (items.length === 0) return;
    this.commandPaletteActiveIndex.set(
      nextEnabledIndex(items, this.commandPaletteActiveIndex(), delta),
    );
  }

  menuId(kind: NeuralEditorSuggestionKind): string {
    return `${this.editorId()}-${kind}-menu`;
  }

  private focusCommandPalette(): void {
    const preferred =
      this.paletteInput()?.nativeElement ??
      this.commandPalettePanel().nativeElement.querySelector<HTMLElement>(
        'input:not(:disabled), button:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
      ) ??
      this.commandPalettePanel().nativeElement;
    preferred.focus();
  }

  private syncSuggestionAria(kind: NeuralEditorSuggestionKind): void {
    const content = this.contentElement()();
    if (!content) return;
    content.setAttribute('aria-autocomplete', 'list');
    content.setAttribute('aria-expanded', 'true');
    content.setAttribute('aria-controls', this.menuId(kind));
    const activeId = this.activeOptionId(kind);
    if (activeId) content.setAttribute('aria-activedescendant', activeId);
    else content.removeAttribute('aria-activedescendant');
  }

  private clearSuggestionAria(): void {
    const content = this.contentElement()();
    if (!content) return;
    content.removeAttribute('aria-autocomplete');
    content.removeAttribute('aria-expanded');
    content.removeAttribute('aria-controls');
    content.removeAttribute('aria-activedescendant');
  }

  optionId(kind: NeuralEditorSuggestionKind, index: number): string {
    return `${this.editorId()}-${kind}-option-${index}`;
  }

  activeOptionId(kind: NeuralEditorSuggestionKind): string | null {
    return this.itemsFor(kind).length
      ? this.optionId(kind, this.activeIndexFor(kind))
      : null;
  }

  paletteInputId(): string {
    return `${this.editorId()}-command-palette-input`;
  }

  paletteListId(): string {
    return `${this.editorId()}-command-palette-list`;
  }

  paletteOptionId(index: number): string {
    return `${this.editorId()}-command-palette-option-${index}`;
  }

  activePaletteOptionId(): string | null {
    return this.filteredCommandPaletteItems().length
      ? this.paletteOptionId(this.commandPaletteActiveIndex())
      : null;
  }

  itemDisabled(item: SuggestionItem): boolean {
    return 'disabled' in item && item.disabled === true;
  }

  itemIconClass(item: SuggestionItem): string {
    return 'iconClass' in item ? (item.iconClass ?? '') : '';
  }

  itemShortcut(item: SuggestionItem): string {
    return 'shortcut' in item ? (item.shortcut ?? '') : '';
  }

  mentionAvatar(item: SuggestionItem): string | null {
    return 'avatarUrl' in item && typeof item.avatarUrl === 'string'
      ? item.avatarUrl
      : null;
  }

  private startSuggestion<T extends SuggestionItem>(
    kind: NeuralEditorSuggestionKind,
    props: NeuralEditorSuggestionViewProps<T>,
  ): void {
    this.closeCommandPalette(false);
    this.activeSuggestion.set(kind);
    this.writeSuggestionState(kind, props);
    const element = this.elementFor(kind);
    element.hidden = false;
    element.remove();
    if (kind === 'slash') {
      this.slashCommand = props.command as (
        item: NeuralEditorSlashCommand,
      ) => void;
    } else {
      this.mentionCommand = props.command as (
        item: NeuralEditorMentionItem,
      ) => void;
    }
    this.syncSuggestionAria(kind);
    this.overlayOpened.emit(kind);
  }

  private updateSuggestion<T extends SuggestionItem>(
    kind: NeuralEditorSuggestionKind,
    props: NeuralEditorSuggestionViewProps<T>,
  ): void {
    this.writeSuggestionState(kind, props);
    this.syncSuggestionAria(kind);
    if (kind === 'slash') {
      this.slashCommand = props.command as (
        item: NeuralEditorSlashCommand,
      ) => void;
    } else {
      this.mentionCommand = props.command as (
        item: NeuralEditorMentionItem,
      ) => void;
    }
  }

  private exitSuggestion(kind: NeuralEditorSuggestionKind): void {
    const element = this.elementFor(kind);
    if (kind === 'slash') {
      this.slashCommand = null;
      this.slashItems.set([]);
      this.slashLoading.set(false);
    } else {
      this.mentionCommand = null;
      this.mentionItems.set([]);
      this.mentionLoading.set(false);
    }
    element.hidden = true;
    element.remove();
    this.suggestionHost().nativeElement.appendChild(element);
    if (this.activeSuggestion() === kind) {
      this.activeSuggestion.set(null);
      this.clearSuggestionAria();
    }
  }

  private writeSuggestionState<T extends SuggestionItem>(
    kind: NeuralEditorSuggestionKind,
    props: NeuralEditorSuggestionViewProps<T>,
  ): void {
    if (kind === 'slash') {
      this.slashQuery.set(props.query);
      this.slashItems.set(props.items as readonly NeuralEditorSlashCommand[]);
      this.slashRange.set(props.range);
      this.slashLoading.set(props.loading);
      this.slashActiveIndex.set(
        normalizeActiveIndex(props.items, this.slashActiveIndex()),
      );
    } else {
      this.mentionQuery.set(props.query);
      this.mentionItems.set(props.items as readonly NeuralEditorMentionItem[]);
      this.mentionRange.set(props.range);
      this.mentionLoading.set(props.loading);
      this.mentionActiveIndex.set(
        normalizeActiveIndex(props.items, this.mentionActiveIndex()),
      );
    }
  }

  private moveActive(kind: NeuralEditorSuggestionKind, delta: number): void {
    const items = this.itemsFor(kind);
    if (items.length === 0) return;
    this.setActiveIndex(
      kind,
      nextEnabledIndex(items, this.activeIndexFor(kind), delta),
    );
  }

  private elementFor(kind: NeuralEditorSuggestionKind): HTMLElement {
    return kind === 'slash'
      ? this.slashMenu().nativeElement
      : this.mentionMenu().nativeElement;
  }
}

type SuggestionItem =
  | NeuralEditorSlashCommand
  | NeuralEditorMentionItem
  | NeuralEditorCommandPaletteItem;

function filterItems<T extends SuggestionItem>(
  items: readonly T[],
  query: string,
): readonly T[] {
  const normalized = normalizeSearchText(query);
  if (!normalized) return items;
  return items.filter((item) => {
    const haystack = [
      item.label,
      item.description ?? '',
      ...('keywords' in item ? (item.keywords ?? []) : []),
    ]
      .map(normalizeSearchText)
      .join(' ');
    return haystack.includes(normalized);
  });
}

function normalizeSearchText(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function itemDisabledAt(
  items: readonly SuggestionItem[],
  index: number,
): boolean {
  const item = items[index];
  return Boolean(item && 'disabled' in item && item.disabled);
}

function firstEnabledIndex(items: readonly SuggestionItem[]): number {
  const index = items.findIndex(
    (item) => !('disabled' in item) || !item.disabled,
  );
  return index < 0 ? 0 : index;
}

function lastEnabledIndex(items: readonly SuggestionItem[]): number {
  for (let index = items.length - 1; index >= 0; index--) {
    if (!itemDisabledAt(items, index)) return index;
  }
  return 0;
}

function nextEnabledIndex(
  items: readonly SuggestionItem[],
  current: number,
  delta: number,
): number {
  if (items.length === 0) return 0;
  for (let step = 1; step <= items.length; step++) {
    const index = (current + delta * step + items.length * step) % items.length;
    const item = items[index];
    if (!('disabled' in item) || !item.disabled) return index;
  }
  return clamp(current, 0, items.length - 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeActiveIndex(
  items: readonly SuggestionItem[],
  current: number,
): number {
  if (items.length === 0) return 0;
  const clamped = clamp(current, 0, items.length - 1);
  const currentItem = items[clamped];
  if (!('disabled' in currentItem) || !currentItem.disabled) return clamped;
  return firstEnabledIndex(items);
}
