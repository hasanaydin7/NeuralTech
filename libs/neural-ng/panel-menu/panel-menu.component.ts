import {
  APP_ID,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injectable,
  PLATFORM_ID,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChildren,
  forwardRef,
  inject,
  input,
  isDevMode,
  model,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NEURAL_NG_CONFIG } from '@neural-ng/core';
import type {
  NeuralPanelMenuAction,
  NeuralPanelMenuClasses,
  NeuralPanelMenuEntry,
  NeuralPanelMenuInteractionSource,
  NeuralPanelMenuRouterLink,
  NeuralPanelMenuSelect,
  NeuralPanelMenuToggle,
} from './panel-menu.types';

@Injectable({ providedIn: 'root' })
class NeuralPanelMenuIdGenerator {
  private readonly appId = inject(APP_ID);
  private nextId = 0;

  next(): string {
    return `${this.appId}-neural-panel-menu-${this.nextId++}`;
  }
}

@Component({
  selector: 'neural-panel-menu',
  standalone: true,
  imports: [
    forwardRef(() => NeuralPanelMenuItem),
    forwardRef(() => NeuralPanelMenuSeparator),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-panel-menu-host' },
  template: `
    <div
      #root
      role="tree"
      [id]="normalizedId()"
      [class]="rootClass()"
      [attr.aria-label]="normalizedAriaLabel()"
      [attr.aria-labelledby]="normalizedAriaLabelledby()"
      [attr.aria-disabled]="disabled() ? 'true' : null"
      [attr.tabindex]="itemHasFocus() ? -1 : 0"
      (focus)="handleRootFocus($event)"
      (focusout)="handleRootFocusOut($event)"
      (keydown)="handleKeydown($event)"
    >
      <div [class]="listClass()">
        @if (items().length > 0) {
          @for (entry of items(); track entryKey(entry, $index)) {
            @if (isSeparator(entry)) {
              <neural-panel-menu-separator />
            } @else {
              <neural-panel-menu-item
                [item]="actionEntry(entry)"
                [level]="1"
                [rootKey]="actionEntry(entry).key"
              />
            }
          }
        } @else {
          <ng-content />
        }
      </div>
    </div>
  `,
  styles: `
    :where(.neural-panel-menu-host),
    :where(.neural-panel-menu-item-host),
    :where(.neural-panel-menu-separator-host) {
      display: contents;
    }

    :where(
      .neural-panel-menu-root,
      .neural-panel-menu-list-root,
      .neural-panel-menu-item-container-root,
      .neural-panel-menu-group-root,
      .neural-panel-menu-group-inner-root
    ) {
      box-sizing: border-box;
      min-width: 0;
    }

    :where(.neural-panel-menu-root),
    :where(.neural-panel-menu-list-root) {
      display: flex;
      flex-direction: column;
    }

    :where(.neural-panel-menu-root:focus) {
      outline: none;
    }

    :where(.neural-panel-menu-item-root) {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      width: 100%;
      min-width: 0;
      text-align: start;
      text-decoration: none;
    }

    :where(.neural-panel-menu-label-root) {
      min-width: 0;
    }

    :where(.neural-panel-menu-meta-root) {
      display: inline-flex;
      align-items: center;
      margin-inline-start: auto;
    }

    :where(.neural-panel-menu-indicator-root) {
      flex: 0 0 auto;
    }

    :where(.neural-panel-menu-group-root) {
      display: grid;
      grid-template-rows: 0fr;
      visibility: hidden;
      transition:
        grid-template-rows var(--neural-panel-menu-group-duration, 180ms)
          var(--neural-panel-menu-group-easing, ease),
        visibility 0s var(--neural-panel-menu-group-duration, 180ms);
    }

    :where(.neural-panel-menu-group-expanded-root) {
      grid-template-rows: 1fr;
      visibility: visible;
      transition:
        grid-template-rows var(--neural-panel-menu-group-duration, 180ms)
          var(--neural-panel-menu-group-easing, ease),
        visibility 0s;
    }

    :where(.neural-panel-menu-group-inner-root) {
      overflow: hidden;
    }

    :where(.neural-panel-menu-base) {
      width: var(--neural-panel-menu-width, 18rem);
      max-width: 100%;
      padding: var(--neural-panel-menu-padding, 0.375rem);
      color: var(--neural-panel-menu-color, inherit);
      background: var(--neural-panel-menu-background, Canvas);
      border: var(--neural-panel-menu-border, 1px solid currentColor);
      border-radius: var(--neural-panel-menu-radius, 0.75rem);
      box-shadow: var(--neural-panel-menu-shadow, none);
      font-family: var(--neural-panel-menu-font-family, inherit);
    }

    :where(.neural-panel-menu-list-base) {
      gap: var(--neural-panel-menu-list-gap, 0.125rem);
    }

    :where(.neural-panel-menu-item-container-base) {
      border-radius: var(--neural-panel-menu-item-radius, 0.5rem);
    }

    :where(.neural-panel-menu-item-base) {
      gap: var(--neural-panel-menu-item-gap, 0.625rem);
      min-height: var(--neural-panel-menu-item-min-height, 2.375rem);
      padding-block: var(--neural-panel-menu-item-padding-block, 0.5rem);
      padding-inline: calc(
          var(--neural-panel-menu-item-padding-inline, 0.75rem) +
            (var(--neural-panel-menu-level, 1) - 1) *
            var(--neural-panel-menu-level-indent, 1rem)
        )
        var(--neural-panel-menu-item-padding-inline, 0.75rem);
      color: var(--neural-panel-menu-item-color, inherit);
      background: var(--neural-panel-menu-item-background, transparent);
      border: 0;
      border-radius: var(--neural-panel-menu-item-radius, 0.5rem);
      font: inherit;
      font-size: var(--neural-panel-menu-item-font-size, 0.875rem);
      font-weight: var(--neural-panel-menu-item-font-weight, 600);
      line-height: var(--neural-panel-menu-item-line-height, 1.35);
      cursor: pointer;
      transition: var(--neural-panel-menu-item-transition, none);
    }

    :where(.neural-panel-menu-item-base:hover:not([aria-disabled='true'])) {
      color: var(--neural-panel-menu-item-color-hover, inherit);
      background: var(--neural-panel-menu-item-background-hover, transparent);
    }

    :where(.neural-panel-menu-item-expanded-base) {
      color: var(
        --neural-panel-menu-item-color-expanded,
        var(--neural-panel-menu-item-color, inherit)
      );
      background: var(
        --neural-panel-menu-item-background-expanded,
        var(--neural-panel-menu-item-background, transparent)
      );
    }

    :where(.neural-panel-menu-item-base:focus-visible) {
      position: relative;
      z-index: 1;
      outline: var(--neural-panel-menu-focus-ring, 2px solid currentColor);
      outline-offset: var(--neural-panel-menu-focus-ring-offset, -2px);
    }

    :where(.neural-panel-menu-item-disabled-base) {
      opacity: var(--neural-panel-menu-disabled-opacity, 0.45);
      cursor: not-allowed;
    }

    :where(.neural-panel-menu-icon-base) {
      flex: 0 0 auto;
      color: var(--neural-panel-menu-icon-color, currentColor);
      font-size: var(--neural-panel-menu-icon-size, 1rem);
    }

    :where(.neural-panel-menu-label-base) {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    :where(.neural-panel-menu-meta-base) {
      gap: var(--neural-panel-menu-meta-gap, 0.5rem);
      color: var(--neural-panel-menu-meta-color, inherit);
    }

    :where(.neural-panel-menu-badge-base) {
      min-width: var(--neural-panel-menu-badge-min-width, 1.25rem);
      padding: var(--neural-panel-menu-badge-padding, 0.125rem 0.375rem);
      color: var(--neural-panel-menu-badge-color, inherit);
      background: var(--neural-panel-menu-badge-background, transparent);
      border-radius: var(--neural-panel-menu-badge-radius, 999px);
      font-size: var(--neural-panel-menu-badge-font-size, 0.6875rem);
      line-height: 1.2;
      text-align: center;
    }

    :where(.neural-panel-menu-shortcut-base) {
      color: var(--neural-panel-menu-shortcut-color, inherit);
      font-size: var(--neural-panel-menu-shortcut-font-size, 0.6875rem);
      font-weight: 500;
    }

    :where(.neural-panel-menu-indicator-base) {
      width: var(--neural-panel-menu-indicator-size, 0.5rem);
      height: var(--neural-panel-menu-indicator-size, 0.5rem);
      border: solid currentColor;
      border-width: 0 0.1rem 0.1rem 0;
      transform: rotate(-45deg);
      transition: transform var(--neural-panel-menu-indicator-duration, 160ms)
        var(--neural-panel-menu-indicator-easing, ease);
    }

    :where(.neural-panel-menu-indicator-expanded-base) {
      transform: rotate(45deg);
    }

    :where(.neural-panel-menu-separator-base) {
      height: 1px;
      margin: var(--neural-panel-menu-separator-margin, 0.375rem 0.5rem);
      background: var(--neural-panel-menu-separator-color, currentColor);
      border: 0;
    }

    @media (prefers-reduced-motion: reduce) {
      :where(.neural-panel-menu-item-base),
      :where(.neural-panel-menu-indicator-base),
      :where(.neural-panel-menu-group-root) {
        transition-duration: 0.01ms !important;
      }
    }
  `,
})
export class NeuralPanelMenu {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly neuralConfig = inject(NEURAL_NG_CONFIG);
  private readonly generatedId = inject(NeuralPanelMenuIdGenerator).next();
  private warnedAboutMixedSources = false;
  private warnedAboutDuplicates = false;
  private typeahead = '';
  private typeaheadTimer: ReturnType<typeof setTimeout> | undefined;

  readonly items = input<readonly NeuralPanelMenuEntry[]>([]);
  readonly expandedKeys = model<readonly string[]>([]);
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly panelMenuId = input(this.generatedId);
  readonly ariaLabel = input<string | null>(null);
  readonly ariaLabelledby = input<string | null>(null);
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly panelMenuClass = input('');
  readonly classes = input<NeuralPanelMenuClasses>({});
  readonly projectedItems = contentChildren<NeuralPanelMenuItem>(
    forwardRef(() => NeuralPanelMenuItem),
  );
  readonly itemSelect = output<NeuralPanelMenuSelect>();
  readonly itemToggle = output<NeuralPanelMenuToggle>();
  readonly itemHasFocus = signal(false);

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.typeaheadTimer !== undefined) clearTimeout(this.typeaheadTimer);
    });
  }

  readonly effectiveUnstyled = computed(
    () => this.unstyled() || this.neuralConfig.unstyled,
  );
  readonly normalizedId = computed(
    () => this.panelMenuId().trim().replace(/\s+/g, '-') || this.generatedId,
  );
  readonly normalizedAriaLabel = computed(
    () => this.ariaLabel()?.trim() || null,
  );
  readonly normalizedAriaLabelledby = computed(
    () => this.ariaLabelledby()?.trim() || null,
  );
  readonly rootClass = computed(() => {
    this.validateSourcesAndKeys();
    return this.compose(
      'neural-panel-menu-root',
      'neural-panel-menu-base',
      this.panelMenuClass(),
      this.classes().root,
    );
  });
  readonly listClass = computed(() =>
    this.compose(
      'neural-panel-menu-list-root',
      'neural-panel-menu-list-base',
      this.classes().list,
    ),
  );

  isExpanded(key: string): boolean {
    return this.expandedKeys().includes(key);
  }

  toggleItem(
    item: NeuralPanelMenuAction,
    level: number,
    rootKey: string,
    branchKeys: readonly string[],
    source: NeuralPanelMenuInteractionSource,
    originalEvent: MouseEvent | KeyboardEvent,
  ): void {
    if (this.disabled() || item.disabled) return;
    originalEvent.preventDefault();
    const previousExpandedKeys = this.expandedKeys();
    const expanded = previousExpandedKeys.includes(item.key);
    let next = expanded
      ? previousExpandedKeys.filter((key) => !branchKeys.includes(key))
      : [...previousExpandedKeys, item.key];

    if (!expanded && level === 1 && !this.multiple()) {
      const otherBranchKeys = this.rootBranches()
        .filter((branch) => branch[0] !== rootKey)
        .flat();
      next = next.filter((key) => !otherBranchKeys.includes(key));
    }

    this.expandedKeys.set(next);
    this.itemToggle.emit({
      key: item.key,
      expanded: !expanded,
      expandedKeys: next,
      previousExpandedKeys,
      item,
      source,
    });
  }

  selectItem(
    item: NeuralPanelMenuAction,
    originalEvent: MouseEvent | KeyboardEvent,
  ): void {
    if (this.disabled() || item.disabled || hasActionChildren(item)) {
      originalEvent.preventDefault();
      return;
    }
    this.itemSelect.emit({
      key: item.key,
      item,
      originalEvent,
      source: interactionSource(originalEvent),
    });
  }

  handleItemFocus(element: EventTarget | null): void {
    if (!(element instanceof HTMLElement)) return;
    this.itemHasFocus.set(true);
    for (const item of this.menuItems())
      item.tabIndex = item === element ? 0 : -1;
  }

  handleRootFocus(event: FocusEvent): void {
    if (event.target !== event.currentTarget || this.itemHasFocus()) return;
    this.menuItems()[0]?.focus();
  }

  handleRootFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (next instanceof Node && this.element.nativeElement.contains(next))
      return;
    this.itemHasFocus.set(false);
    for (const item of this.menuItems(true)) item.tabIndex = -1;
  }

  handleKeydown(event: KeyboardEvent): void {
    const current = event.target;
    if (!(current instanceof HTMLElement) || current.role !== 'treeitem')
      return;
    const items = this.menuItems();
    const index = items.indexOf(current);
    if (index < 0) return;

    let target: HTMLElement | undefined;
    if (event.key === 'ArrowDown') target = items[index + 1] ?? items[0];
    else if (event.key === 'ArrowUp') {
      target = items[index - 1] ?? items[items.length - 1];
    } else if (event.key === 'Home') target = items[0];
    else if (event.key === 'End') target = items[items.length - 1];
    else if (event.key === 'ArrowRight') {
      event.preventDefault();
      if (current.getAttribute('aria-expanded') === 'false') {
        current.click();
      } else if (current.getAttribute('aria-expanded') === 'true') {
        queueMicrotask(() => {
          const updated = this.menuItems();
          updated[updated.indexOf(current) + 1]?.focus();
        });
      }
      return;
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (current.getAttribute('aria-expanded') === 'true') {
        current.click();
      } else {
        const parentKey = current.dataset['parentKey'];
        if (parentKey) this.focusKey(parentKey);
      }
      return;
    } else if (
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      this.handleTypeahead(event, items, index);
      return;
    }

    if (!target) return;
    event.preventDefault();
    target.focus();
  }

  itemContainerClass(expanded: boolean, disabled: boolean): string {
    return this.compose(
      'neural-panel-menu-item-container-root',
      'neural-panel-menu-item-container-base',
      this.classes().itemContainer,
      expanded ? this.classes().expandedItem : '',
      disabled ? this.classes().disabledItem : '',
    );
  }

  itemClass(expanded: boolean, disabled: boolean, localClass = ''): string {
    return this.compose(
      'neural-panel-menu-item-root',
      [
        'neural-panel-menu-item-base',
        expanded ? 'neural-panel-menu-item-expanded-base' : '',
        disabled ? 'neural-panel-menu-item-disabled-base' : '',
      ].join(' '),
      this.classes().item,
      localClass,
    );
  }

  slotClass(
    slot: 'icon' | 'label' | 'meta' | 'badge' | 'shortcut' | 'indicator',
    structural: string,
    visual: string,
  ): string {
    return this.compose(structural, visual, this.classes()[slot]);
  }

  indicatorClass(expanded: boolean): string {
    return this.compose(
      'neural-panel-menu-indicator-root',
      `neural-panel-menu-indicator-base ${
        expanded ? 'neural-panel-menu-indicator-expanded-base' : ''
      }`,
      this.classes().indicator,
    );
  }

  groupClass(expanded: boolean): string {
    return this.compose(
      `neural-panel-menu-group-root ${
        expanded ? 'neural-panel-menu-group-expanded-root' : ''
      }`,
      `neural-panel-menu-group-base ${
        expanded ? 'neural-panel-menu-group-expanded-base' : ''
      }`,
      this.classes().group,
    );
  }

  groupInnerClass(): string {
    return this.compose(
      'neural-panel-menu-group-inner-root',
      'neural-panel-menu-group-inner-base',
      this.classes().groupInner,
    );
  }

  separatorClass(localClass = ''): string {
    return this.compose(
      'neural-panel-menu-separator-root',
      'neural-panel-menu-separator-base',
      this.classes().separator,
      localClass,
    );
  }

  entryKey(entry: NeuralPanelMenuEntry, index: number): string {
    return isSeparator(entry) ? (entry.key ?? `separator-${index}`) : entry.key;
  }

  isSeparator(entry: NeuralPanelMenuEntry): boolean {
    return isSeparator(entry);
  }

  actionEntry(entry: NeuralPanelMenuEntry): NeuralPanelMenuAction {
    return entry as NeuralPanelMenuAction;
  }

  private menuItems(includeHidden = false): HTMLElement[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    return [
      ...this.element.nativeElement.querySelectorAll<HTMLElement>(
        '[role="treeitem"]',
      ),
    ].filter(
      (item) =>
        item.getAttribute('aria-disabled') !== 'true' &&
        (includeHidden || !item.closest('[inert]')),
    );
  }

  private focusKey(key: string): void {
    this.menuItems(true)
      .find((item) => item.dataset['key'] === key)
      ?.focus();
  }

  private handleTypeahead(
    event: KeyboardEvent,
    items: readonly HTMLElement[],
    currentIndex: number,
  ): void {
    event.preventDefault();
    if (this.typeaheadTimer !== undefined) clearTimeout(this.typeaheadTimer);
    this.typeahead += event.key.toLocaleLowerCase();
    this.typeaheadTimer = setTimeout(() => {
      this.typeahead = '';
      this.typeaheadTimer = undefined;
    }, 500);
    const ordered = [
      ...items.slice(currentIndex + 1),
      ...items.slice(0, currentIndex + 1),
    ];
    ordered
      .find((item) =>
        (item.dataset['label'] ?? '')
          .toLocaleLowerCase()
          .startsWith(this.typeahead),
      )
      ?.focus();
  }

  private rootBranches(): readonly (readonly string[])[] {
    if (this.items().length > 0) {
      return this.items()
        .filter((entry): entry is NeuralPanelMenuAction => !isSeparator(entry))
        .map((item) => [item.key, ...flattenKeys(item.items ?? [])]);
    }
    return this.projectedItems().map((item) => item.branchKeys());
  }

  private validateSourcesAndKeys(): void {
    if (
      isDevMode() &&
      !this.warnedAboutMixedSources &&
      this.items().length > 0 &&
      this.projectedItems().length > 0
    ) {
      this.warnedAboutMixedSources = true;
      console.warn(
        'NeuralNg PanelMenu: use either [items] or neural-panel-menu-item children. [items] is used when both are present.',
      );
    }
    if (!isDevMode() || this.warnedAboutDuplicates) return;
    const keys = flattenKeys(this.items());
    const duplicate = keys.find((key, index) => keys.indexOf(key) !== index);
    if (duplicate === undefined) return;
    this.warnedAboutDuplicates = true;
    console.warn(
      `NeuralNg PanelMenu: duplicate item key "${duplicate}". Keys must be unique.`,
    );
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

@Component({
  selector: 'neural-panel-menu-item',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    RouterLink,
    forwardRef(() => NeuralPanelMenuItem),
    forwardRef(() => NeuralPanelMenuSeparator),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-panel-menu-item-host' },
  template: `
    <div
      [class]="containerClass()"
      [attr.data-expanded]="expanded() ? 'true' : null"
      [attr.data-disabled]="effectiveDisabled() ? 'true' : null"
    >
      @if (
        hasChildren() ||
        (!resolvedItem().href && resolvedItem().routerLink === undefined)
      ) {
        <button
          type="button"
          role="treeitem"
          tabindex="-1"
          [id]="itemId()"
          [class]="computedItemClass()"
          [disabled]="effectiveDisabled()"
          [attr.aria-level]="effectiveLevel()"
          aria-selected="false"
          [attr.aria-expanded]="hasChildren() ? expanded() : null"
          [attr.aria-controls]="hasChildren() ? groupId() : null"
          [attr.aria-disabled]="effectiveDisabled() ? 'true' : null"
          [attr.data-key]="effectiveKey()"
          [attr.data-parent-key]="effectiveParentKey()"
          [attr.data-label]="resolvedItem().label"
          [style.--neural-panel-menu-level]="effectiveLevel()"
          (focus)="menu.handleItemFocus($event.currentTarget)"
          (click)="activate($event)"
        >
          <ng-container *ngTemplateOutlet="itemContent" />
        </button>
      } @else if (resolvedItem().routerLink !== undefined) {
        <a
          role="treeitem"
          tabindex="-1"
          [id]="itemId()"
          [class]="computedItemClass()"
          [routerLink]="resolvedItem().routerLink"
          [queryParams]="resolvedItem().queryParams"
          [fragment]="resolvedItem().fragment"
          [queryParamsHandling]="resolvedItem().queryParamsHandling"
          [preserveFragment]="resolvedItem().preserveFragment === true"
          [skipLocationChange]="resolvedItem().skipLocationChange === true"
          [replaceUrl]="resolvedItem().replaceUrl === true"
          [state]="resolvedItem().state"
          [target]="resolvedItem().target || undefined"
          [attr.rel]="resolvedItem().rel || null"
          [attr.aria-level]="effectiveLevel()"
          aria-selected="false"
          [attr.aria-disabled]="effectiveDisabled() ? 'true' : null"
          [attr.data-key]="effectiveKey()"
          [attr.data-parent-key]="effectiveParentKey()"
          [attr.data-label]="resolvedItem().label"
          [style.--neural-panel-menu-level]="effectiveLevel()"
          (focus)="menu.handleItemFocus($event.currentTarget)"
          (click)="activate($event)"
        >
          <ng-container *ngTemplateOutlet="itemContent" />
        </a>
      } @else {
        <a
          role="treeitem"
          tabindex="-1"
          [id]="itemId()"
          [class]="computedItemClass()"
          [attr.href]="effectiveDisabled() ? null : resolvedItem().href"
          [attr.target]="resolvedItem().target || null"
          [attr.rel]="resolvedItem().rel || null"
          [attr.aria-level]="effectiveLevel()"
          aria-selected="false"
          [attr.aria-disabled]="effectiveDisabled() ? 'true' : null"
          [attr.data-key]="effectiveKey()"
          [attr.data-parent-key]="effectiveParentKey()"
          [attr.data-label]="resolvedItem().label"
          [style.--neural-panel-menu-level]="effectiveLevel()"
          (focus)="menu.handleItemFocus($event.currentTarget)"
          (click)="activate($event)"
        >
          <ng-container *ngTemplateOutlet="itemContent" />
        </a>
      }

      <ng-template #itemContent>
        @if (resolvedItem().iconClass) {
          <i [class]="computedIconClass()" aria-hidden="true"></i>
        }
        <span [class]="labelClass()">{{ resolvedItem().label }}</span>
        <span [class]="metaClass()">
          @if (resolvedItem().badge !== undefined) {
            <span [class]="badgeClass()">{{ resolvedItem().badge }}</span>
          }
          @if (resolvedItem().shortcut) {
            <span [class]="shortcutClass()">
              {{ resolvedItem().shortcut }}
            </span>
          }
          @if (hasChildren()) {
            <span
              [class]="menu.indicatorClass(expanded())"
              aria-hidden="true"
            ></span>
          }
        </span>
      </ng-template>

      @if (hasChildren()) {
        <div
          role="group"
          [id]="groupId()"
          [class]="menu.groupClass(expanded())"
          [attr.aria-labelledby]="itemId()"
          [attr.aria-hidden]="!expanded()"
          [attr.inert]="expanded() ? null : ''"
        >
          <div [class]="menu.groupInnerClass()">
            @if (dataChildren().length > 0) {
              @for (
                entry of dataChildren();
                track menu.entryKey(entry, $index)
              ) {
                @if (menu.isSeparator(entry)) {
                  <neural-panel-menu-separator />
                } @else {
                  <neural-panel-menu-item
                    [item]="menu.actionEntry(entry)"
                    [level]="effectiveLevel() + 1"
                    [rootKey]="effectiveRootKey()"
                    [parentKey]="effectiveKey()"
                  />
                }
              }
            } @else {
              <ng-content />
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class NeuralPanelMenuItem {
  readonly menu = inject(NeuralPanelMenu);
  private readonly parent = inject(NeuralPanelMenuItem, {
    skipSelf: true,
    optional: true,
  });
  readonly item = input<NeuralPanelMenuAction | null>(null);
  readonly key = input('');
  readonly label = input('');
  readonly iconClass = input('');
  readonly badge = input<string | number | undefined>(undefined);
  readonly shortcut = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly href = input('');
  readonly routerLink = input<NeuralPanelMenuRouterLink | null>(null);
  readonly queryParams = input<Record<string, unknown> | null>(null);
  readonly fragment = input<string | undefined>(undefined);
  readonly queryParamsHandling = input<
    'merge' | 'preserve' | 'replace' | '' | null
  >(null);
  readonly preserveFragment = input(false, { transform: booleanAttribute });
  readonly skipLocationChange = input(false, { transform: booleanAttribute });
  readonly replaceUrl = input(false, { transform: booleanAttribute });
  readonly state = input<Record<string, unknown> | undefined>(undefined);
  readonly target = input('');
  readonly rel = input('');
  readonly itemClass = input('');
  readonly level = input<number | null>(null);
  readonly rootKey = input('');
  readonly parentKey = input('');
  readonly projectedChildren = contentChildren<NeuralPanelMenuItem>(
    forwardRef(() => NeuralPanelMenuItem),
  );

  readonly resolvedItem = computed<NeuralPanelMenuAction>(() => {
    const item = this.item();
    if (item) return item;
    return {
      key: this.key(),
      label: this.label(),
      iconClass: this.iconClass() || undefined,
      badge: this.badge(),
      shortcut: this.shortcut() || undefined,
      disabled: this.disabled(),
      href: this.href() || undefined,
      routerLink: this.routerLink() ?? undefined,
      queryParams: this.queryParams(),
      fragment: this.fragment(),
      queryParamsHandling: this.queryParamsHandling(),
      preserveFragment: this.preserveFragment(),
      skipLocationChange: this.skipLocationChange(),
      replaceUrl: this.replaceUrl(),
      state: this.state(),
      target: this.target() || undefined,
      rel: this.rel() || undefined,
      itemClass: this.itemClass() || undefined,
    };
  });
  readonly effectiveKey = computed(
    () => this.resolvedItem().key.trim() || 'missing-key',
  );
  readonly effectiveLevel = computed<number>(
    (): number =>
      this.level() ?? (this.parent ? this.parent.effectiveLevel() + 1 : 1),
  );
  readonly effectiveParentKey = computed(
    () => this.parentKey() || this.parent?.effectiveKey() || '',
  );
  readonly effectiveRootKey = computed<string>(
    (): string =>
      this.rootKey() || this.parent?.effectiveRootKey() || this.effectiveKey(),
  );
  readonly dataChildren = computed(() => this.resolvedItem().items ?? []);
  readonly hasChildren = computed(
    () =>
      this.dataChildren().some((entry) => !isSeparator(entry)) ||
      this.projectedChildren().length > 0,
  );
  readonly expanded = computed(
    () => this.hasChildren() && this.menu.isExpanded(this.effectiveKey()),
  );
  readonly effectiveDisabled = computed(
    () => this.menu.disabled() || Boolean(this.resolvedItem().disabled),
  );

  branchKeys(): readonly string[] {
    const dataKeys = flattenKeys(this.dataChildren());
    const projectedKeys = this.projectedChildren().flatMap((child) =>
      child.branchKeys(),
    );
    return [this.effectiveKey(), ...dataKeys, ...projectedKeys];
  }
  readonly itemId = computed(
    () => `${this.menu.normalizedId()}-item-${safeId(this.effectiveKey())}`,
  );
  readonly groupId = computed(
    () => `${this.menu.normalizedId()}-group-${safeId(this.effectiveKey())}`,
  );
  readonly containerClass = computed(() =>
    this.menu.itemContainerClass(this.expanded(), this.effectiveDisabled()),
  );
  readonly computedItemClass = computed(() =>
    this.menu.itemClass(
      this.expanded(),
      this.effectiveDisabled(),
      this.resolvedItem().itemClass,
    ),
  );
  readonly computedIconClass = computed(() =>
    [
      this.menu.slotClass(
        'icon',
        'neural-panel-menu-icon-root',
        'neural-panel-menu-icon-base',
      ),
      this.resolvedItem().iconClass,
    ]
      .filter(Boolean)
      .join(' '),
  );
  readonly labelClass = computed(() =>
    this.menu.slotClass(
      'label',
      'neural-panel-menu-label-root',
      'neural-panel-menu-label-base',
    ),
  );
  readonly metaClass = computed(() =>
    this.menu.slotClass(
      'meta',
      'neural-panel-menu-meta-root',
      'neural-panel-menu-meta-base',
    ),
  );
  readonly badgeClass = computed(() =>
    this.menu.slotClass(
      'badge',
      'neural-panel-menu-badge-root',
      'neural-panel-menu-badge-base',
    ),
  );
  readonly shortcutClass = computed(() =>
    this.menu.slotClass(
      'shortcut',
      'neural-panel-menu-shortcut-root',
      'neural-panel-menu-shortcut-base',
    ),
  );

  activate(event: MouseEvent): void {
    const resolved = this.resolvedItem();
    if (this.hasChildren()) {
      this.menu.toggleItem(
        { ...resolved, items: this.dataChildren() },
        this.effectiveLevel(),
        this.effectiveRootKey(),
        this.branchKeys(),
        interactionSource(event),
        event,
      );
      return;
    }
    this.menu.selectItem(resolved, event);
  }
}

@Component({
  selector: 'neural-panel-menu-separator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-panel-menu-separator-host' },
  template: `<div
    role="presentation"
    aria-hidden="true"
    [class]="computedClass()"
  ></div>`,
})
export class NeuralPanelMenuSeparator {
  private readonly menu = inject(NeuralPanelMenu);
  readonly separatorClass = input('');
  readonly computedClass = computed(() =>
    this.menu.separatorClass(this.separatorClass()),
  );
}

function interactionSource(
  event: MouseEvent | KeyboardEvent,
): NeuralPanelMenuInteractionSource {
  return event instanceof KeyboardEvent || event.detail === 0
    ? 'keyboard'
    : 'pointer';
}

function isSeparator(
  entry: NeuralPanelMenuEntry,
): entry is Extract<NeuralPanelMenuEntry, { separator: true }> {
  return 'separator' in entry && entry.separator === true;
}

function hasActionChildren(item: NeuralPanelMenuAction): boolean {
  return Boolean(item.items?.some((entry) => !isSeparator(entry)));
}

function flattenKeys(entries: readonly NeuralPanelMenuEntry[]): string[] {
  return entries.flatMap((entry) =>
    isSeparator(entry) ? [] : [entry.key, ...flattenKeys(entry.items ?? [])],
  );
}

function safeId(value: string): string {
  return encodeURIComponent(value).replace(/%/g, '-');
}
