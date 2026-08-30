import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  ViewEncapsulation,
  afterNextRender,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { NEURAL_NG_CONFIG } from '@neural-ng/core';
import type {
  NeuralToolbarClasses,
  NeuralToolbarFocusChange,
  NeuralToolbarOrientation,
} from './toolbar.types';

const FOCUSABLE_SELECTOR = [
  'button',
  'a[href]',
  'input',
  'select',
  'textarea',
  '[contenteditable="true"]',
  '[tabindex]',
].join(',');

@Component({
  selector: 'neural-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-toolbar-host' },
  template: `
    <!-- Keyboard and focus handlers delegate to projected focusable controls. -->
    <!-- eslint-disable-next-line @angular-eslint/template/interactive-supports-focus -->
    <div
      #root
      role="toolbar"
      [class]="rootClass()"
      [attr.aria-label]="normalizedAriaLabel()"
      [attr.aria-labelledby]="normalizedAriaLabelledby()"
      [attr.aria-orientation]="orientation()"
      [attr.data-orientation]="orientation()"
      [attr.data-wrap]="wrap() ? 'true' : 'false'"
      (keydown)="handleKeydown($event)"
      (focusin)="handleFocusIn($event)"
    >
      <ng-content />
    </div>
  `,
  styles: `
    :where(.neural-toolbar-host),
    :where(.neural-toolbar-section-host),
    :where(.neural-toolbar-separator-host) {
      display: contents;
    }
    :where(.neural-toolbar-root) {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      min-width: 0;
    }
    :where(.neural-toolbar-root[data-orientation='vertical']) {
      flex-direction: column;
      align-items: stretch;
    }
    :where(.neural-toolbar-root[data-wrap='true']) {
      flex-wrap: wrap;
    }
    :where(.neural-toolbar-section-root) {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      min-width: 0;
    }
    :where(.neural-toolbar-section-root[data-orientation='vertical']) {
      width: 100%;
      flex-direction: column;
      align-items: stretch;
    }
    :where(.neural-toolbar-separator-root) {
      box-sizing: border-box;
      flex: 0 0 auto;
    }
    :where(.neural-toolbar-base) {
      gap: var(--neural-toolbar-gap, 0.75rem);
      padding: var(--neural-toolbar-padding, 0.75rem);
      color: var(--neural-toolbar-color, var(--neural-color-text));
      background: var(--neural-toolbar-background, var(--neural-color-surface));
      border: var(
        --neural-toolbar-border,
        1px solid var(--neural-color-border)
      );
      border-radius: var(--neural-toolbar-radius, 0.75rem);
      box-shadow: var(--neural-toolbar-shadow, none);
      backdrop-filter: var(--neural-toolbar-backdrop-filter, none);
    }
    :where(.neural-toolbar-section-base) {
      gap: var(--neural-toolbar-section-gap, 0.5rem);
    }
    :where(.neural-toolbar-center-base) {
      flex: 1 1 auto;
      justify-content: center;
    }
    :where(.neural-toolbar-end-base) {
      margin-inline-start: auto;
      justify-content: flex-end;
    }
    :where(.neural-toolbar-center-base[data-orientation='vertical']) {
      flex: 0 0 auto;
      justify-content: flex-start;
    }
    :where(.neural-toolbar-end-base[data-orientation='vertical']) {
      margin-block-start: auto;
      margin-inline-start: 0;
      justify-content: flex-start;
    }
    :where(.neural-toolbar-separator-base[aria-orientation='vertical']) {
      width: 1px;
      height: var(--neural-toolbar-separator-length, 1.75rem);
      background: var(
        --neural-toolbar-separator-color,
        var(--neural-color-border)
      );
    }
    :where(.neural-toolbar-separator-base[aria-orientation='horizontal']) {
      width: 100%;
      height: 1px;
      background: var(
        --neural-toolbar-separator-color,
        var(--neural-color-border)
      );
    }
  `,
})
export class NeuralToolbar {
  private readonly config = inject(NEURAL_NG_CONFIG);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly root = viewChild.required<ElementRef<HTMLElement>>('root');
  private readonly originalTabIndex = new Map<HTMLElement, string | null>();
  private observer: MutationObserver | undefined;

  readonly orientation = input<NeuralToolbarOrientation>('horizontal');
  readonly wrap = input(true, { transform: booleanAttribute });
  readonly loop = input(true, { transform: booleanAttribute });
  readonly rovingFocus = input(true, { transform: booleanAttribute });
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string | null>('Toolbar');
  readonly ariaLabelledby = input<string | null>(null);
  readonly toolbarClass = input('');
  readonly classes = input<NeuralToolbarClasses>({});

  readonly focusChanged = output<NeuralToolbarFocusChange>();

  readonly effectiveUnstyled = computed(
    () => this.unstyled() || this.config.unstyled,
  );
  readonly normalizedAriaLabel = computed(() =>
    this.ariaLabelledby()?.trim()
      ? null
      : this.ariaLabel()?.trim() || 'Toolbar',
  );
  readonly normalizedAriaLabelledby = computed(
    () => this.ariaLabelledby()?.trim() || null,
  );
  readonly rootClass = computed(() =>
    this.compose(
      'neural-toolbar-root',
      'neural-toolbar-base',
      this.toolbarClass(),
      this.classes().root,
    ),
  );

  constructor() {
    afterNextRender(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      this.syncFocusable();
      this.observer = new MutationObserver(() => this.syncFocusable());
      this.observer.observe(this.root().nativeElement, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['disabled', 'hidden', 'aria-disabled'],
      });
    });
    this.destroyRef.onDestroy(() => {
      this.observer?.disconnect();
      for (const [element, value] of this.originalTabIndex) {
        if (!element.isConnected) continue;
        if (value === null) element.removeAttribute('tabindex');
        else element.setAttribute('tabindex', value);
      }
      this.originalTabIndex.clear();
    });
  }

  handleFocusIn(event: FocusEvent): void {
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (!target || !this.rovingFocus()) return;
    const items = this.syncFocusable(target);
    const index = items.indexOf(target);
    if (index >= 0)
      this.focusChanged.emit({ index, element: target, nativeEvent: event });
  }

  handleKeydown(event: KeyboardEvent): void {
    if (!this.rovingFocus() || event.altKey || event.ctrlKey || event.metaKey)
      return;
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (!target || this.isEditable(target)) return;
    const items = this.focusableItems();
    const current = items.indexOf(target);
    if (current < 0) return;

    let direction = 0;
    if (event.key === 'Home') direction = -Infinity;
    else if (event.key === 'End') direction = Infinity;
    else if (this.orientation() === 'vertical') {
      if (event.key === 'ArrowUp') direction = -1;
      if (event.key === 'ArrowDown') direction = 1;
    } else {
      const rtl =
        getComputedStyle(this.root().nativeElement).direction === 'rtl';
      if (event.key === 'ArrowLeft') direction = rtl ? 1 : -1;
      if (event.key === 'ArrowRight') direction = rtl ? -1 : 1;
    }
    if (direction === 0) return;
    event.preventDefault();
    const next = this.nextIndex(current, direction, items.length);
    const element = items[next];
    this.syncFocusable(element);
    element.focus({ preventScroll: true });
    this.focusChanged.emit({ index: next, element, nativeEvent: event });
  }

  composeSlotClass(
    slot: 'start' | 'center' | 'end' | 'separator',
    structural: string,
    visual: string,
    localClass: string,
  ): string {
    return this.compose(structural, visual, this.classes()[slot], localClass);
  }

  private syncFocusable(preferred?: HTMLElement): HTMLElement[] {
    if (!this.rovingFocus()) return this.focusableItems(false);
    const items = this.focusableItems();
    if (items.length === 0) return items;
    const active =
      preferred && items.includes(preferred)
        ? preferred
        : items.includes(document.activeElement as HTMLElement)
          ? (document.activeElement as HTMLElement)
          : (items.find((item) => item.getAttribute('tabindex') === '0') ??
            items[0]);
    for (const item of items)
      item.setAttribute('tabindex', item === active ? '0' : '-1');
    return items;
  }

  private focusableItems(track = true): HTMLElement[] {
    const root = this.root().nativeElement;
    return Array.from(
      root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    ).filter((item) => {
      if (item.closest('[role="toolbar"]') !== root || item.hidden)
        return false;
      if ('disabled' in item && (item as HTMLButtonElement).disabled)
        return false;
      if (item.getAttribute('aria-disabled') === 'true') return false;
      const known = this.originalTabIndex.has(item);
      if (!known && item.tabIndex < 0) return false;
      if (track && !known)
        this.originalTabIndex.set(item, item.getAttribute('tabindex'));
      return true;
    });
  }

  private nextIndex(
    current: number,
    direction: number,
    length: number,
  ): number {
    if (direction === -Infinity) return 0;
    if (direction === Infinity) return length - 1;
    const candidate = current + direction;
    if (this.loop()) return (candidate + length) % length;
    return Math.max(0, Math.min(candidate, length - 1));
  }

  private isEditable(element: HTMLElement): boolean {
    return element.matches('input, textarea, select, [contenteditable="true"]');
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

abstract class ToolbarSectionBase {
  protected readonly toolbar = inject(NeuralToolbar, { host: true });
  readonly orientation = computed(() => this.toolbar.orientation());
}

@Component({
  selector: 'neural-toolbar-start',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-toolbar-section-host' },
  template: `<div
    [class]="computedClass()"
    [attr.data-orientation]="orientation()"
  >
    <ng-content />
  </div>`,
})
export class NeuralToolbarStart extends ToolbarSectionBase {
  readonly sectionClass = input('');
  readonly computedClass = computed(() =>
    this.toolbar.composeSlotClass(
      'start',
      'neural-toolbar-section-root neural-toolbar-start-root',
      'neural-toolbar-section-base neural-toolbar-start-base',
      this.sectionClass(),
    ),
  );
}

@Component({
  selector: 'neural-toolbar-center',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-toolbar-section-host' },
  template: `<div
    [class]="computedClass()"
    [attr.data-orientation]="orientation()"
  >
    <ng-content />
  </div>`,
})
export class NeuralToolbarCenter extends ToolbarSectionBase {
  readonly sectionClass = input('');
  readonly computedClass = computed(() =>
    this.toolbar.composeSlotClass(
      'center',
      'neural-toolbar-section-root neural-toolbar-center-root',
      'neural-toolbar-section-base neural-toolbar-center-base',
      this.sectionClass(),
    ),
  );
}

@Component({
  selector: 'neural-toolbar-end',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-toolbar-section-host' },
  template: `<div
    [class]="computedClass()"
    [attr.data-orientation]="orientation()"
  >
    <ng-content />
  </div>`,
})
export class NeuralToolbarEnd extends ToolbarSectionBase {
  readonly sectionClass = input('');
  readonly computedClass = computed(() =>
    this.toolbar.composeSlotClass(
      'end',
      'neural-toolbar-section-root neural-toolbar-end-root',
      'neural-toolbar-section-base neural-toolbar-end-base',
      this.sectionClass(),
    ),
  );
}

@Component({
  selector: 'neural-toolbar-separator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-toolbar-separator-host' },
  template: `<span
    role="separator"
    [class]="computedClass()"
    [attr.aria-orientation]="separatorOrientation()"
  ></span>`,
})
export class NeuralToolbarSeparator {
  private readonly toolbar = inject(NeuralToolbar, { host: true });
  readonly separatorClass = input('');
  readonly separatorOrientation = computed(() =>
    this.toolbar.orientation() === 'horizontal' ? 'vertical' : 'horizontal',
  );
  readonly computedClass = computed(() =>
    this.toolbar.composeSlotClass(
      'separator',
      'neural-toolbar-separator-root',
      'neural-toolbar-separator-base',
      this.separatorClass(),
    ),
  );
}

/** @deprecated Use NeuralToolbar. */
export { NeuralToolbar as ToolbarComponent };
/** @deprecated Use NeuralToolbarStart. */
export { NeuralToolbarStart as ToolbarStartComponent };
/** @deprecated Use NeuralToolbarCenter. */
export { NeuralToolbarCenter as ToolbarCenterComponent };
/** @deprecated Use NeuralToolbarEnd. */
export { NeuralToolbarEnd as ToolbarEndComponent };
/** @deprecated Use NeuralToolbarSeparator. */
export { NeuralToolbarSeparator as ToolbarSeparatorComponent };
