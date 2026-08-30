import { DOCUMENT, NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
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
  effect,
  forwardRef,
  inject,
  input,
  isDevMode,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NEURAL_NG_CONFIG } from '@neural-ng/core';
import { RouterLink } from '@angular/router';
import {
  NeuralOverlayPositioner,
  type NeuralOverlayPositionRef,
} from '@neural-ng/core/overlay';
import type {
  NeuralMenuAction,
  NeuralMenuClasses,
  NeuralMenuEntry,
  NeuralMenuGroupEntry,
  NeuralMenuGroupItem,
  NeuralMenuInteractionSource,
  NeuralMenuPosition,
  NeuralMenuRouterLink,
  NeuralMenuSelect,
} from './menu.types';

type PopoverElement = HTMLElement & {
  showPopover?: () => void;
  hidePopover?: () => void;
};

@Injectable({ providedIn: 'root' })
class NeuralMenuIdGenerator {
  private readonly appId = inject(APP_ID);
  private nextId = 0;

  next(): string {
    return `${this.appId}-neural-menu-${this.nextId++}`;
  }
}

@Component({
  selector: 'neural-menu',
  exportAs: 'neuralMenu',
  standalone: true,
  imports: [
    forwardRef(() => NeuralMenuItem),
    forwardRef(() => NeuralMenuSeparatorItem),
    forwardRef(() => NeuralMenuGroup),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neural-menu-host',
    '(document:pointerdown)': 'handleDocumentPointerDown($event)',
  },
  template: `
    <div
      #menuRoot
      role="menu"
      [id]="normalizedId()"
      [class]="rootClass()"
      [hidden]="popup() && !open()"
      [attr.popover]="popup() ? 'manual' : null"
      [attr.data-popup]="popup() ? 'true' : null"
      [attr.data-open]="open() ? 'true' : null"
      [attr.aria-label]="normalizedAriaLabel()"
      [attr.aria-labelledby]="normalizedAriaLabelledby()"
      [attr.aria-disabled]="disabled() ? 'true' : null"
      [attr.tabindex]="popup() ? -1 : 0"
      (keydown)="handleKeydown($event)"
    >
      <div [class]="listClass()">
        @if (items().length > 0) {
          @for (entry of items(); track entryKey(entry, $index)) {
            @if (isSeparator(entry)) {
              <neural-menu-separator
                [separatorClass]="entry.separatorClass ?? ''"
              />
            } @else if (isGroup(entry)) {
              <neural-menu-group [group]="groupEntry(entry)" />
            } @else {
              <neural-menu-item [item]="actionEntry(entry)" />
            }
          }
        } @else {
          <ng-content />
        }
      </div>
    </div>
  `,
  styles: `
    :where(
      .neural-menu-host,
      .neural-menu-item-host,
      .neural-menu-separator-host,
      .neural-menu-group-host
    ) {
      display: contents;
    }

    :where(.neural-menu-root),
    :where(.neural-menu-list-root),
    :where(.neural-menu-group-root),
    :where(.neural-menu-group-list-root) {
      box-sizing: border-box;
      min-width: 0;
    }

    :where(.neural-menu-list-root) {
      display: flex;
      flex-direction: column;
    }

    :where(.neural-menu-group-root),
    :where(.neural-menu-group-list-root) {
      display: flex;
      flex-direction: column;
    }

    :where(.neural-menu-root:focus) {
      outline: none;
    }

    :where(.neural-menu-root[data-popup='true']) {
      position: fixed;
      z-index: var(--neural-menu-z-index, 1000);
      inset: auto;
      margin: 0;
    }

    :where(.neural-menu-item-root) {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      width: 100%;
      min-width: 0;
      text-align: start;
      text-decoration: none;
    }

    :where(.neural-menu-label-root) {
      min-width: 0;
    }

    :where(.neural-menu-meta-root) {
      display: inline-flex;
      align-items: center;
      margin-inline-start: auto;
    }

    :where(.neural-menu-base) {
      width: var(--neural-menu-width, 14rem);
      max-width: min(var(--neural-menu-max-width, 20rem), calc(100vw - 1rem));
      max-height: min(var(--neural-menu-max-height, 24rem), calc(100vh - 1rem));
      overflow: auto;
      padding: var(--neural-menu-padding, 0.375rem);
      color: var(--neural-menu-color, inherit);
      background: var(--neural-menu-background, Canvas);
      border: var(--neural-menu-border, 1px solid currentColor);
      border-radius: var(--neural-menu-radius, 0.75rem);
      box-shadow: var(--neural-menu-shadow, none);
      font-family: var(--neural-menu-font-family, inherit);
      opacity: 1;
      transform: translateY(0) scale(1);
      transform-origin: top;
      transition:
        opacity var(--neural-menu-leave-duration, 100ms)
          var(--neural-menu-easing, ease),
        transform var(--neural-menu-leave-duration, 100ms)
          var(--neural-menu-easing, ease);
    }

    :where(.neural-menu-base:popover-open) {
      transition-duration:
        var(--neural-menu-enter-duration, 140ms),
        var(--neural-menu-enter-duration, 140ms);

      @starting-style {
        opacity: 0;
        transform: translateY(var(--neural-menu-enter-distance, -0.25rem))
          scale(var(--neural-menu-enter-scale, 0.98));
      }
    }

    :where(.neural-menu-list-base) {
      gap: var(--neural-menu-list-gap, 0.125rem);
    }

    :where(.neural-menu-group-base) {
      gap: var(--neural-menu-group-gap, 0.125rem);
    }

    :where(.neural-menu-group-label-base) {
      padding: var(--neural-menu-group-label-padding, 0.625rem 0.75rem 0.25rem);
      color: var(--neural-menu-group-label-color, inherit);
      font-size: var(--neural-menu-group-label-font-size, 0.6875rem);
      font-weight: var(--neural-menu-group-label-font-weight, 700);
      line-height: 1.25;
      letter-spacing: var(--neural-menu-group-label-letter-spacing, 0.08em);
      text-transform: var(--neural-menu-group-label-transform, uppercase);
    }

    :where(.neural-menu-group-list-base) {
      gap: var(--neural-menu-group-list-gap, 0.125rem);
    }

    :where(.neural-menu-item-base) {
      gap: var(--neural-menu-item-gap, 0.625rem);
      min-height: var(--neural-menu-item-min-height, 2.375rem);
      padding: var(--neural-menu-item-padding, 0.5rem 0.75rem);
      color: var(--neural-menu-item-color, inherit);
      background: var(--neural-menu-item-background, transparent);
      border: 0;
      border-radius: var(--neural-menu-item-radius, 0.5rem);
      font: inherit;
      font-size: var(--neural-menu-item-font-size, 0.875rem);
      font-weight: var(--neural-menu-item-font-weight, 600);
      line-height: var(--neural-menu-item-line-height, 1.35);
      cursor: pointer;
      transition: var(--neural-menu-item-transition, none);
    }

    :where(.neural-menu-item-base:hover:not([aria-disabled='true'])),
    :where(.neural-menu-item-base:focus-visible:not([aria-disabled='true'])) {
      color: var(--neural-menu-item-color-active, inherit);
      background: var(--neural-menu-item-background-active, transparent);
    }

    :where(.neural-menu-item-base:focus-visible) {
      outline: var(--neural-menu-focus-ring, 2px solid currentColor);
      outline-offset: var(--neural-menu-focus-ring-offset, -2px);
    }

    :where(.neural-menu-item-disabled-base) {
      opacity: var(--neural-menu-disabled-opacity, 0.45);
      cursor: not-allowed;
    }

    :where(.neural-menu-icon-base) {
      flex: 0 0 auto;
      color: var(--neural-menu-icon-color, currentColor);
      font-size: var(--neural-menu-icon-size, 1rem);
    }

    :where(.neural-menu-label-base) {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    :where(.neural-menu-meta-base) {
      gap: var(--neural-menu-meta-gap, 0.5rem);
      color: var(--neural-menu-meta-color, inherit);
    }

    :where(.neural-menu-badge-base) {
      min-width: var(--neural-menu-badge-min-width, 1.25rem);
      padding: var(--neural-menu-badge-padding, 0.125rem 0.375rem);
      color: var(--neural-menu-badge-color, inherit);
      background: var(--neural-menu-badge-background, transparent);
      border-radius: var(--neural-menu-badge-radius, 999px);
      font-size: var(--neural-menu-badge-font-size, 0.6875rem);
      line-height: 1.2;
      text-align: center;
    }

    :where(.neural-menu-shortcut-base) {
      color: var(--neural-menu-shortcut-color, inherit);
      font-size: var(--neural-menu-shortcut-font-size, 0.6875rem);
      font-weight: 500;
    }

    :where(.neural-menu-separator-base) {
      height: 1px;
      margin: var(--neural-menu-separator-margin, 0.375rem 0.5rem);
      background: var(--neural-menu-separator-color, currentColor);
      border: 0;
    }

    @media (prefers-reduced-motion: reduce) {
      :where(.neural-menu-base),
      :where(.neural-menu-item-base) {
        transition-duration: 0.01ms !important;
      }
    }
  `,
})
export class NeuralMenu {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly positioner = inject(NeuralOverlayPositioner);
  private readonly config = inject(NEURAL_NG_CONFIG);
  private readonly generatedId = inject(NeuralMenuIdGenerator).next();
  private readonly root = viewChild<ElementRef<PopoverElement>>('menuRoot');
  private readonly projectedItems = contentChildren(
    forwardRef(() => NeuralMenuItem),
  );
  private readonly projectedGroups = contentChildren(
    forwardRef(() => NeuralMenuGroup),
  );
  private positionRef: NeuralOverlayPositionRef | undefined;
  private readonly activeTrigger = signal<HTMLElement | undefined>(undefined);
  private typeahead = '';
  private typeaheadTimer: ReturnType<typeof setTimeout> | undefined;
  private restoreFocusTimer: ReturnType<typeof setTimeout> | undefined;
  private scrollCloseReadyAt = 0;
  private triggerViewportPoint: { left: number; top: number } | undefined;
  private warnedAboutMixedSources = false;
  private warnedAboutDuplicates = false;
  private readonly handleDocumentScroll = (event: Event): void => {
    if (!this.popup() || !this.open()) return;
    const target = event.target;
    const root = this.root()?.nativeElement;
    if (target instanceof Node && root?.contains(target)) return;
    const view = this.document.defaultView;
    const trigger = this.activeTrigger();
    if (!view || !trigger) return;
    const movesTriggerContext =
      target === this.document ||
      target === view ||
      (target instanceof Element && target.contains(trigger));
    if (!movesTriggerContext) return;
    const rect = trigger.getBoundingClientRect();
    if (view.performance.now() < this.scrollCloseReadyAt) {
      this.triggerViewportPoint = { left: rect.left, top: rect.top };
      return;
    }
    const initial = this.triggerViewportPoint;
    const moved =
      initial !== undefined &&
      (Math.abs(rect.left - initial.left) > 2 ||
        Math.abs(rect.top - initial.top) > 2);
    if (moved) this.hide(false);
  };

  readonly items = input<readonly NeuralMenuEntry[]>([]);
  readonly popup = input(false, { transform: booleanAttribute });
  readonly open = model(false);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly closeOnSelect = input(true, { transform: booleanAttribute });
  readonly menuId = input(this.generatedId);
  readonly ariaLabel = input<string | null>(null);
  readonly ariaLabelledby = input<string | null>(null);
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly menuClass = input('');
  readonly classes = input<NeuralMenuClasses>({});
  readonly itemSelect = output<NeuralMenuSelect>();

  readonly effectiveUnstyled = computed(
    () => this.unstyled() || this.config.unstyled,
  );
  readonly normalizedId = computed(
    () => this.menuId().trim() || this.generatedId,
  );
  readonly normalizedAriaLabel = computed(() => {
    const labelledby = this.ariaLabelledby()?.trim();
    if (labelledby) return null;
    return this.ariaLabel()?.trim() || 'Menu';
  });
  readonly normalizedAriaLabelledby = computed(
    () => this.ariaLabelledby()?.trim() || null,
  );
  readonly rootClass = computed(() =>
    this.compose(
      'neural-menu-root',
      'neural-menu-base',
      this.menuClass(),
      this.classes().root,
    ),
  );
  readonly listClass = computed(() =>
    this.compose(
      'neural-menu-list-root',
      'neural-menu-list-base',
      this.classes().list,
    ),
  );

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.document.addEventListener('scroll', this.handleDocumentScroll, true);
    }

    effect(() => {
      const open = this.open();
      const popup = this.popup();
      if (!isPlatformBrowser(this.platformId) || !popup) return;
      queueMicrotask(() => this.syncPopover(open));
    });

    inject(DestroyRef).onDestroy(() => {
      this.document.removeEventListener(
        'scroll',
        this.handleDocumentScroll,
        true,
      );
      if (this.restoreFocusTimer !== undefined) {
        clearTimeout(this.restoreFocusTimer);
      }
      this.clearTypeahead();
      this.positionRef?.destroy();
    });
  }

  showFor(
    trigger: HTMLElement,
    position: NeuralMenuPosition = 'bottom-start',
    focus: 'first' | 'last' = 'first',
  ): void {
    if (!this.popup() || this.disabled()) return;
    if (this.restoreFocusTimer !== undefined) {
      clearTimeout(this.restoreFocusTimer);
      this.restoreFocusTimer = undefined;
    }
    const view = this.document.defaultView;
    this.scrollCloseReadyAt = (view?.performance.now() ?? 0) + 250;
    const rect = trigger.getBoundingClientRect();
    this.triggerViewportPoint = { left: rect.left, top: rect.top };
    this.activeTrigger.set(trigger);
    this.open.set(true);
    queueMicrotask(() => {
      const root = this.root()?.nativeElement;
      if (root) root.hidden = false;
      this.syncPopover(true);
      this.connectPosition(trigger, position);
      this.focusEdge(focus);
    });
  }

  toggleFor(
    trigger: HTMLElement,
    position: NeuralMenuPosition = 'bottom-start',
  ): void {
    if (this.open() && this.activeTrigger() === trigger) {
      this.hide(true);
      return;
    }
    this.showFor(trigger, position);
  }

  hide(restoreFocus = false): void {
    if (!this.open()) return;
    const trigger = this.activeTrigger();
    this.scrollCloseReadyAt = 0;
    this.triggerViewportPoint = undefined;
    this.open.set(false);
    this.clearTypeahead();
    this.syncPopover(false);
    if (restoreFocus && trigger?.isConnected) {
      this.restoreFocusTimer = setTimeout(() => {
        this.restoreFocusTimer = undefined;
        trigger.focus({ preventScroll: true });
      }, 0);
    }
  }

  isTriggerOpen(trigger: HTMLElement): boolean {
    return this.open() && this.activeTrigger() === trigger;
  }

  selectItem(
    item: NeuralMenuAction,
    originalEvent: Event,
    source = interactionSource(originalEvent),
  ): void {
    if (this.disabled() || item.disabled) {
      originalEvent.preventDefault();
      return;
    }
    this.itemSelect.emit({ key: item.key, item, source, originalEvent });
    if (this.popup() && this.closeOnSelect()) this.hide(false);
  }

  handleKeydown(event: KeyboardEvent): void {
    const items = this.enabledItems();
    const current = event.target as HTMLElement;
    const currentIndex = items.indexOf(current);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusRelative(items, currentIndex, 1);
        return;
      case 'ArrowUp':
        event.preventDefault();
        this.focusRelative(items, currentIndex, -1);
        return;
      case 'Home':
        event.preventDefault();
        items[0]?.focus({ preventScroll: true });
        return;
      case 'End':
        event.preventDefault();
        items[items.length - 1]?.focus({ preventScroll: true });
        return;
      case 'Escape':
        if (!this.popup()) return;
        event.preventDefault();
        event.stopPropagation();
        this.hide(true);
        return;
      case 'Tab':
        if (this.popup()) this.hide(false);
        return;
      default:
        if (
          event.key.length === 1 &&
          !event.altKey &&
          !event.ctrlKey &&
          !event.metaKey
        ) {
          this.handleTypeahead(event, items, currentIndex);
        }
    }
  }

  handleDocumentPointerDown(event: PointerEvent): void {
    if (!this.popup() || !this.open()) return;
    const target = event.target as Node;
    if (
      this.element.nativeElement.contains(target) ||
      this.activeTrigger()?.contains(target)
    ) {
      return;
    }
    this.hide(false);
  }

  itemClass(disabled: boolean, localClass = ''): string {
    return this.compose(
      'neural-menu-item-root',
      `neural-menu-item-base ${
        disabled ? 'neural-menu-item-disabled-base' : ''
      }`,
      this.classes().item,
      disabled ? this.classes().disabledItem : '',
      localClass,
    );
  }

  slotClass(
    slot: 'icon' | 'label' | 'meta' | 'badge' | 'shortcut',
    structural: string,
    visual: string,
  ): string {
    return this.compose(structural, visual, this.classes()[slot]);
  }

  separatorClass(localClass = ''): string {
    return this.compose(
      'neural-menu-separator-root',
      'neural-menu-separator-base',
      this.classes().separator,
      localClass,
    );
  }

  groupClass(localClass = ''): string {
    return this.compose(
      'neural-menu-group-root',
      'neural-menu-group-base',
      this.classes().group,
      localClass,
    );
  }

  groupLabelClass(localClass = ''): string {
    return this.compose(
      'neural-menu-group-label-root',
      'neural-menu-group-label-base',
      this.classes().groupLabel,
      localClass,
    );
  }

  groupListClass(localClass = ''): string {
    return this.compose(
      'neural-menu-group-list-root',
      'neural-menu-group-list-base',
      this.classes().groupList,
      localClass,
    );
  }

  groupLabelId(key: string): string {
    const safeKey = key.trim().replace(/[^a-zA-Z0-9_-]+/g, '-');
    return `${this.normalizedId()}-group-${safeKey || 'unnamed'}`;
  }

  entryKey(entry: NeuralMenuEntry, index: number): string {
    return isSeparator(entry) ? (entry.key ?? `separator-${index}`) : entry.key;
  }

  groupItemKey(entry: NeuralMenuGroupItem, index: number): string {
    return isSeparator(entry) ? (entry.key ?? `separator-${index}`) : entry.key;
  }

  isSeparator(
    entry: NeuralMenuEntry,
  ): entry is Extract<NeuralMenuEntry, { separator: true }> {
    return isSeparator(entry);
  }

  isGroup(entry: NeuralMenuEntry): entry is NeuralMenuGroupEntry {
    return isGroup(entry);
  }

  actionEntry(entry: NeuralMenuEntry): NeuralMenuAction {
    return entry as NeuralMenuAction;
  }

  groupEntry(entry: NeuralMenuEntry): NeuralMenuGroupEntry {
    return entry as NeuralMenuGroupEntry;
  }

  private syncPopover(open: boolean): void {
    const root = this.root()?.nativeElement;
    if (!root) return;
    if (open) {
      try {
        root.showPopover?.();
      } catch {
        // The hidden/data-open fallback remains authoritative.
      }
      return;
    }
    this.positionRef?.destroy();
    this.positionRef = undefined;
    try {
      root.hidePopover?.();
    } catch {
      // The hidden/data-open fallback remains authoritative.
    }
  }

  private connectPosition(
    trigger: HTMLElement,
    position: NeuralMenuPosition,
  ): void {
    const root = this.root()?.nativeElement;
    if (!root || !root.isConnected) return;
    this.positionRef?.destroy();
    this.positionRef = this.positioner.connect(trigger, root, {
      placement: position,
    });
  }

  private enabledItems(): HTMLElement[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    return [
      ...this.element.nativeElement.querySelectorAll<HTMLElement>(
        '[role="menuitem"]',
      ),
    ].filter((item) => item.getAttribute('aria-disabled') !== 'true');
  }

  private focusEdge(edge: 'first' | 'last'): void {
    const items = this.enabledItems();
    (edge === 'first' ? items[0] : items[items.length - 1])?.focus({
      preventScroll: true,
    });
  }

  private focusRelative(
    items: readonly HTMLElement[],
    currentIndex: number,
    direction: 1 | -1,
  ): void {
    if (items.length === 0) return;
    const next =
      currentIndex < 0
        ? direction === 1
          ? 0
          : items.length - 1
        : (currentIndex + direction + items.length) % items.length;
    items[next]?.focus({ preventScroll: true });
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
      ?.focus({ preventScroll: true });
  }

  private clearTypeahead(): void {
    if (this.typeaheadTimer !== undefined) clearTimeout(this.typeaheadTimer);
    this.typeaheadTimer = undefined;
    this.typeahead = '';
  }

  private validateSourcesAndKeys(): void {
    if (
      isDevMode() &&
      !this.warnedAboutMixedSources &&
      this.items().length > 0 &&
      (this.projectedItems().length > 0 || this.projectedGroups().length > 0)
    ) {
      this.warnedAboutMixedSources = true;
      console.warn(
        'NeuralNg Menu: use either [items] or projected menu children. [items] is used when both are present.',
      );
    }
    if (!isDevMode() || this.warnedAboutDuplicates) return;
    const keys = this.items().flatMap((entry) => {
      if (isSeparator(entry)) return [];
      if (isGroup(entry)) {
        return [
          entry.key,
          ...entry.items
            .filter((item): item is NeuralMenuAction => !isSeparator(item))
            .map((item) => item.key),
        ];
      }
      return [entry.key];
    });
    const duplicate = keys.find((key, index) => keys.indexOf(key) !== index);
    if (duplicate === undefined) return;
    this.warnedAboutDuplicates = true;
    console.warn(
      `NeuralNg Menu: duplicate item key "${duplicate}". Keys must be unique.`,
    );
  }

  private compose(
    structural: string,
    visual: string,
    ...consumer: Array<string | undefined>
  ): string {
    this.validateSourcesAndKeys();
    return [structural, this.effectiveUnstyled() ? '' : visual, ...consumer]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(' ');
  }
}

@Component({
  selector: 'neural-menu-item',
  standalone: true,
  imports: [NgTemplateOutlet, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-menu-item-host' },
  template: `
    @if (resolvedItem().routerLink !== undefined && !effectiveDisabled()) {
      <a
        role="menuitem"
        tabindex="-1"
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
        [attr.data-key]="effectiveKey()"
        [attr.data-label]="resolvedItem().label"
        (click)="activate($event)"
      >
        <ng-container *ngTemplateOutlet="itemContent" />
      </a>
    } @else if (resolvedItem().href && !effectiveDisabled()) {
      <a
        role="menuitem"
        tabindex="-1"
        [class]="computedItemClass()"
        [attr.href]="resolvedItem().href"
        [attr.target]="resolvedItem().target || null"
        [attr.rel]="resolvedItem().rel || null"
        [attr.data-key]="effectiveKey()"
        [attr.data-label]="resolvedItem().label"
        (click)="activate($event)"
      >
        <ng-container *ngTemplateOutlet="itemContent" />
      </a>
    } @else {
      <button
        type="button"
        role="menuitem"
        tabindex="-1"
        [class]="computedItemClass()"
        [disabled]="effectiveDisabled()"
        [attr.aria-disabled]="effectiveDisabled() ? 'true' : null"
        [attr.data-key]="effectiveKey()"
        [attr.data-label]="resolvedItem().label"
        (click)="activate($event)"
      >
        <ng-container *ngTemplateOutlet="itemContent" />
      </button>
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
      </span>
    </ng-template>
  `,
})
export class NeuralMenuItem {
  private readonly menu = inject(NeuralMenu);
  readonly item = input<NeuralMenuAction | null>(null);
  readonly key = input('');
  readonly label = input('');
  readonly iconClass = input('');
  readonly badge = input<string | number | undefined>(undefined);
  readonly shortcut = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly href = input('');
  readonly routerLink = input<NeuralMenuRouterLink | null>(null);
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

  readonly resolvedItem = computed<NeuralMenuAction>(() => {
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
  readonly effectiveDisabled = computed(
    () => this.menu.disabled() || Boolean(this.resolvedItem().disabled),
  );
  readonly computedItemClass = computed(() =>
    this.menu.itemClass(
      this.effectiveDisabled(),
      this.resolvedItem().itemClass,
    ),
  );
  readonly computedIconClass = computed(() =>
    [
      this.menu.slotClass(
        'icon',
        'neural-menu-icon-root',
        'neural-menu-icon-base',
      ),
      normalizeIconClass(this.resolvedItem().iconClass ?? ''),
    ]
      .filter(Boolean)
      .join(' '),
  );
  readonly labelClass = computed(() =>
    this.menu.slotClass(
      'label',
      'neural-menu-label-root',
      'neural-menu-label-base',
    ),
  );
  readonly metaClass = computed(() =>
    this.menu.slotClass(
      'meta',
      'neural-menu-meta-root',
      'neural-menu-meta-base',
    ),
  );
  readonly badgeClass = computed(() =>
    this.menu.slotClass(
      'badge',
      'neural-menu-badge-root',
      'neural-menu-badge-base',
    ),
  );
  readonly shortcutClass = computed(() =>
    this.menu.slotClass(
      'shortcut',
      'neural-menu-shortcut-root',
      'neural-menu-shortcut-base',
    ),
  );

  activate(event: MouseEvent): void {
    this.menu.selectItem(this.resolvedItem(), event);
  }
}

@Component({
  selector: 'neural-menu-group',
  standalone: true,
  imports: [
    forwardRef(() => NeuralMenuItem),
    forwardRef(() => NeuralMenuSeparatorItem),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-menu-group-host' },
  template: `
    <div [class]="computedGroupClass()">
      <div [id]="labelId()" [class]="computedLabelClass()">
        {{ resolvedGroup().label }}
      </div>
      <div
        role="group"
        [attr.aria-labelledby]="labelId()"
        [class]="computedListClass()"
      >
        @if (resolvedGroup().items.length > 0) {
          @for (
            entry of resolvedGroup().items;
            track menu.groupItemKey(entry, $index)
          ) {
            @if (menu.isSeparator(entry)) {
              <neural-menu-separator
                [separatorClass]="entry.separatorClass ?? ''"
              />
            } @else {
              <neural-menu-item [item]="actionEntry(entry)" />
            }
          }
        } @else {
          <ng-content />
        }
      </div>
    </div>
  `,
})
export class NeuralMenuGroup {
  readonly menu = inject(NeuralMenu);
  readonly group = input<NeuralMenuGroupEntry | null>(null);
  readonly key = input('');
  readonly label = input('');
  readonly groupClass = input('');
  readonly labelClass = input('');
  readonly listClass = input('');

  readonly resolvedGroup = computed<NeuralMenuGroupEntry>(() => {
    const group = this.group();
    if (group) return group;
    return {
      key: this.key(),
      label: this.label(),
      items: [],
      groupClass: this.groupClass() || undefined,
      labelClass: this.labelClass() || undefined,
      listClass: this.listClass() || undefined,
    };
  });
  readonly labelId = computed(() =>
    this.menu.groupLabelId(this.resolvedGroup().key),
  );
  readonly computedGroupClass = computed(() =>
    this.menu.groupClass(this.resolvedGroup().groupClass),
  );
  readonly computedLabelClass = computed(() =>
    this.menu.groupLabelClass(this.resolvedGroup().labelClass),
  );
  readonly computedListClass = computed(() =>
    this.menu.groupListClass(this.resolvedGroup().listClass),
  );

  actionEntry(entry: NeuralMenuGroupItem): NeuralMenuAction {
    return entry as NeuralMenuAction;
  }
}

@Component({
  selector: 'neural-menu-separator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-menu-separator-host' },
  template: `<div role="separator" [class]="computedClass()"></div>`,
})
export class NeuralMenuSeparatorItem {
  private readonly menu = inject(NeuralMenu);
  readonly separatorClass = input('');
  readonly computedClass = computed(() =>
    this.menu.separatorClass(this.separatorClass()),
  );
}

function interactionSource(event: Event): NeuralMenuInteractionSource {
  return event instanceof KeyboardEvent ||
    (event instanceof MouseEvent && event.detail === 0)
    ? 'keyboard'
    : 'pointer';
}

function isSeparator(
  entry: NeuralMenuEntry,
): entry is Extract<NeuralMenuEntry, { separator: true }> {
  return 'separator' in entry && entry.separator === true;
}

function isGroup(entry: NeuralMenuEntry): entry is NeuralMenuGroupEntry {
  return 'items' in entry && Array.isArray(entry.items);
}

function normalizeIconClass(value: string): string {
  const normalized = value.trim();
  if (!normalized) return '';
  const classes = normalized.split(/\s+/);
  const usesNeuralIcon = classes.some((className) =>
    className.startsWith('nt-'),
  );
  return usesNeuralIcon && !classes.includes('nt')
    ? `nt ${normalized}`
    : normalized;
}

/** @deprecated Import and use `NeuralMenu` instead. */
export { NeuralMenu as MenuComponent };
/** @deprecated Import and use `NeuralMenuItem` instead. */
export { NeuralMenuItem as MenuItemComponent };
/** @deprecated Import and use `NeuralMenuGroup` instead. */
export { NeuralMenuGroup as MenuGroupComponent };
/** @deprecated Import and use `NeuralMenuSeparatorItem` instead. */
export { NeuralMenuSeparatorItem as MenuSeparatorComponent };
