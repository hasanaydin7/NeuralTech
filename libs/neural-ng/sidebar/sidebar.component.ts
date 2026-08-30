import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  Injectable,
  PLATFORM_ID,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { NEURAL_NG_CONFIG } from '@neural-ng/core';
import { NavigationEnd, Router } from '@angular/router';
import type {
  NeuralSidebarClasses,
  NeuralSidebarCollapseMode,
  NeuralSidebarIconMenu,
  NeuralSidebarHoverChange,
  NeuralSidebarSide,
  NeuralSidebarStateChange,
  NeuralSidebarVariant,
} from './sidebar.types';

type Controller = Pick<NeuralSidebar, 'visibleOpen' | 'toggle'>;
let nextSidebarId = 0;
@Injectable({ providedIn: 'root' })
class SidebarRegistry {
  private readonly entries = signal(new Map<string, Controller>());
  get(id: string): Controller | undefined {
    return this.entries().get(id);
  }
  register(id: string, value: Controller): () => void {
    this.entries.update((all) => new Map(all).set(id, value));
    return () =>
      this.entries.update((all) => {
        const next = new Map(all);
        if (next.get(id) === value) next.delete(id);
        return next;
      });
  }
}

@Injectable({ providedIn: 'root' })
class SidebarScrollLock {
  private readonly document = inject(DOCUMENT);
  private locks = 0;
  private previousOverflow = '';

  lock(): () => void {
    if (this.locks++ === 0) {
      this.previousOverflow = this.document.body.style.overflow;
      this.document.body.style.overflow = 'hidden';
    }
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.locks = Math.max(0, this.locks - 1);
      if (this.locks === 0)
        this.document.body.style.overflow = this.previousOverflow;
    };
  }
}

@Component({
  selector: 'neural-sidebar-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-sidebar-layout-host' },
  template: `<div [class]="rootClass()"><ng-content /></div>`,
  styles: `
    :where(.neural-sidebar-layout-host) {
      display: contents;
    }
    :where(.neural-sidebar-layout-root) {
      position: relative;
      display: flex;
      min-width: 0;
      min-height: 0;
      isolation: isolate;
      overflow: hidden;
    }
    :where(.neural-sidebar-layout-base) {
      width: 100%;
      min-height: var(--neural-sidebar-layout-min-height, 32rem);
      color: var(--neural-color-text);
      background: var(
        --neural-sidebar-layout-background,
        var(--neural-color-surface)
      );
    }
    :where(.neural-sidebar-main-root) {
      box-sizing: border-box;
      flex: 1 1 auto;
      min-width: 0;
      min-height: 0;
      overflow: auto;
    }
    :where(.neural-sidebar-main-base) {
      background: var(
        --neural-sidebar-main-background,
        var(--neural-color-surface)
      );
    }
  `,
})
export class NeuralSidebarLayout {
  private readonly config = inject(NEURAL_NG_CONFIG);
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly layoutClass = input('');
  readonly classes = input<Pick<NeuralSidebarClasses, 'root'>>({});
  readonly rootClass = computed(() =>
    [
      'neural-sidebar-layout-root',
      this.unstyled() || this.config.unstyled
        ? ''
        : 'neural-sidebar-layout-base',
      this.layoutClass(),
      this.classes().root,
    ]
      .filter(Boolean)
      .join(' '),
  );
}

@Component({
  selector: 'neural-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neural-sidebar-host',
    '[attr.id]': 'null',
  },
  template: `
    @if (effectiveOverlay() && visibleOpen() && showBackdrop()) {
      <button
        type="button"
        tabindex="-1"
        aria-hidden="true"
        [class]="backdropClass()"
        (click)="close('backdrop', $event)"
      ></button>
    }
    <aside
      [id]="id()"
      tabindex="-1"
      [class]="panelClass()"
      [attr.aria-label]="ariaLabel()?.trim() || null"
      [attr.aria-labelledby]="ariaLabelledby()?.trim() || null"
      [attr.aria-hidden]="hidden() ? 'true' : null"
      [attr.inert]="hidden() ? '' : null"
      [attr.data-side]="side()"
      [attr.data-variant]="variant()"
      [attr.data-mode]="effectiveMode()"
      [attr.data-open]="visibleOpen() ? 'true' : 'false'"
      [attr.data-mobile]="mobile() ? 'true' : 'false'"
      [attr.data-icon-menu]="iconMenu()"
      [attr.data-open-on-hover]="openOnHover() ? 'true' : 'false'"
      [attr.data-hover-expanded]="hoverExpanded() ? 'true' : 'false'"
      [style.--neural-sidebar-width]="width()"
      [style.--neural-sidebar-icon-width]="iconWidth()"
      (keydown)="handleKeydown($event)"
      (pointerenter)="handlePointerEnter($event)"
      (pointerover)="handleNestedFlyoutPointerOver($event)"
      (pointerleave)="handlePointerLeave($event)"
      (focusout)="handleFocusOut($event)"
    >
      <ng-content />
    </aside>
  `,
  styles: `
    :where(.neural-sidebar-host),
    :where(.neural-sidebar-section-host) {
      display: contents;
    }
    :where(.neural-sidebar-panel-root) {
      position: relative;
      z-index: 2;
      box-sizing: border-box;
      flex: 0 0 auto;
      display: grid;
      grid-template-rows: auto minmax(0, 1fr) auto;
      width: var(--neural-sidebar-width, 16rem);
      min-width: 0;
      min-height: 0;
      overflow: hidden;
      transition:
        width var(--neural-sidebar-duration, 200ms)
          var(--neural-sidebar-easing, cubic-bezier(0.2, 0, 0, 1)),
        transform var(--neural-sidebar-duration, 200ms)
          var(--neural-sidebar-easing, cubic-bezier(0.2, 0, 0, 1));
    }
    :where(.neural-sidebar-panel-root[data-mode='icon'][data-open='false']) {
      width: var(--neural-sidebar-icon-width, 3.5rem);
    }
    :where(.neural-sidebar-panel-root[data-mode='offcanvas']) {
      position: absolute;
      inset-block: 0;
    }
    :where(
      .neural-sidebar-panel-root[data-mode='offcanvas'][data-side='start']
    ) {
      inset-inline-start: 0;
    }
    :where(.neural-sidebar-panel-root[data-mode='offcanvas'][data-side='end']) {
      inset-inline-end: 0;
    }
    :where(
      .neural-sidebar-panel-root[data-mode='offcanvas'][data-open='false'][data-side='start']
    ) {
      transform: translateX(-100%);
    }
    :where(
      .neural-sidebar-panel-root:dir(
          rtl
        )[data-mode='offcanvas'][data-open='false'][data-side='start']
    ) {
      transform: translateX(100%);
    }
    :where(
      .neural-sidebar-panel-root[data-mode='offcanvas'][data-open='false'][data-side='end']
    ) {
      transform: translateX(100%);
    }
    :where(
      .neural-sidebar-panel-root:dir(
          rtl
        )[data-mode='offcanvas'][data-open='false'][data-side='end']
    ) {
      transform: translateX(-100%);
    }
    :where(
      .neural-sidebar-panel-root[data-side='end']:not([data-mode='offcanvas'])
    ) {
      order: 2;
    }
    :where(.neural-sidebar-label-root) {
      min-width: 0;
      overflow: hidden;
      white-space: nowrap;
      transition:
        width var(--neural-sidebar-duration, 200ms)
          var(--neural-sidebar-easing, cubic-bezier(0.2, 0, 0, 1)),
        opacity var(--neural-sidebar-duration, 200ms)
          var(--neural-sidebar-easing, cubic-bezier(0.2, 0, 0, 1));
    }
    .neural-sidebar-panel-root[data-mode='icon'][data-open='false']
      .neural-sidebar-label-root,
    .neural-sidebar-panel-root[data-mode='icon'][data-open='false']
      .neural-panel-menu-list-root
      > neural-panel-menu-item
      > .neural-panel-menu-item-container-root
      > .neural-panel-menu-item-root
      > .neural-panel-menu-label-root,
    .neural-sidebar-panel-root[data-mode='icon'][data-open='false']
      .neural-menu-label-root {
      width: 0;
      min-width: 0;
      overflow: hidden;
      opacity: 0;
      pointer-events: none;
    }
    .neural-sidebar-panel-root[data-mode='icon'][data-open='false']
      .neural-sidebar-label-root {
      position: absolute;
      visibility: hidden;
    }
    .neural-sidebar-panel-root[data-mode='icon'][data-open='false']
      :where(.neural-sidebar-header-root, .neural-sidebar-footer-root) {
      display: flex;
      align-items: center;
      justify-content: flex-start;
    }
    .neural-sidebar-panel-base .neural-panel-menu-base {
      width: 100%;
      max-width: none;
      padding: 0;
      background: transparent;
      border: 0;
      border-radius: 0;
      box-shadow: none;
    }
    .neural-sidebar-panel-base .neural-menu-base:not([data-popup='true']) {
      width: 100%;
      max-width: none;
      padding: 0;
      background: transparent;
      border: 0;
      border-radius: 0;
      box-shadow: none;
    }
    .neural-sidebar-panel-root[data-mode='icon'][data-open='false']
      .neural-panel-menu-list-root
      > neural-panel-menu-item
      > .neural-panel-menu-item-container-root
      > .neural-panel-menu-item-root {
      width: var(
        --neural-sidebar-rail-item-width,
        calc(var(--neural-sidebar-icon-width, 3.5rem) - 1.5rem)
      );
      max-width: 100%;
      justify-content: center;
      gap: 0;
      padding-inline: 0;
    }
    .neural-sidebar-panel-root[data-mode='icon'][data-open='false']
      .neural-menu-item-root {
      position: relative;
      width: var(
        --neural-sidebar-rail-item-width,
        calc(var(--neural-sidebar-icon-width, 3.5rem) - 1.5rem)
      );
      max-width: 100%;
      justify-content: center;
      gap: 0;
      padding-inline: 0;
    }
    .neural-sidebar-panel-root[data-mode='icon'][data-open='false']
      .neural-panel-menu-list-root
      > neural-panel-menu-item
      > .neural-panel-menu-item-container-root
      > .neural-panel-menu-item-root
      > .neural-panel-menu-meta-root,
    .neural-sidebar-panel-root[data-mode='icon'][data-open='false']
      .neural-menu-meta-root,
    .neural-sidebar-panel-root[data-mode='icon'][data-open='false']
      .neural-menu-group-label-root,
    .neural-sidebar-panel-root[data-mode='icon'][data-open='false']
      .neural-panel-menu-list-root
      > neural-panel-menu-separator
      > .neural-panel-menu-separator-root,
    .neural-sidebar-panel-root[data-mode='icon'][data-open='false'][data-icon-menu='hidden']
      .neural-panel-menu-list-root
      > neural-panel-menu-item
      > .neural-panel-menu-item-container-root
      > .neural-panel-menu-group-root {
      display: none;
    }
    .neural-sidebar-panel-root[data-mode='icon'][data-open='false']
      .neural-menu-separator-root {
      display: none;
    }
    .neural-sidebar-panel-root[data-mode='icon'][data-open='false'][data-icon-menu='flyout'] {
      overflow: visible;
    }
    .neural-sidebar-panel-root[data-mode='icon'][data-open='false'][data-icon-menu='flyout']
      .neural-sidebar-content-root,
    .neural-sidebar-panel-root[data-mode='icon'][data-open='false'][data-icon-menu='flyout']
      :where(
        .neural-panel-menu-root,
        .neural-panel-menu-list-root,
        .neural-menu-root:not([data-popup='true']),
        .neural-menu-list-root,
        .neural-menu-group-root,
        .neural-menu-group-list-root
      ) {
      overflow: visible;
    }
    .neural-sidebar-panel-root[data-mode='icon'][data-open='false']
      .neural-panel-menu-list-root
      > neural-panel-menu-item
      > .neural-panel-menu-item-container-root {
      position: relative;
    }
    .neural-sidebar-panel-root[data-mode='icon'][data-open='false']
      .neural-panel-menu-list-root
      > neural-panel-menu-item
      > .neural-panel-menu-item-container-root
      > .neural-panel-menu-item-root::after,
    .neural-sidebar-panel-root[data-mode='icon'][data-open='false']
      .neural-menu-item-root::after {
      position: absolute;
      z-index: var(--neural-sidebar-rail-label-z-index, 21);
      inset-block-start: 50%;
      inset-inline-start: calc(
        100% + var(--neural-sidebar-rail-label-offset, 0.625rem)
      );
      padding: var(--neural-sidebar-rail-label-padding, 0.375rem 0.625rem);
      color: var(--neural-sidebar-rail-label-color, var(--neural-color-text));
      font-size: var(--neural-sidebar-rail-label-font-size, 0.75rem);
      font-weight: 600;
      line-height: 1.2;
      white-space: nowrap;
      content: attr(data-label);
      background: var(
        --neural-sidebar-rail-label-background,
        var(--neural-color-surface)
      );
      border: var(
        --neural-sidebar-rail-label-border,
        1px solid var(--neural-color-border)
      );
      border-radius: var(--neural-sidebar-rail-label-radius, 0.5rem);
      box-shadow: var(
        --neural-sidebar-rail-label-shadow,
        0 10px 24px rgb(var(--neural-color-shadow) / 0.16)
      );
      opacity: 0;
      pointer-events: none;
      transform: translateY(-50%) translateX(-0.25rem);
      transition:
        opacity var(--neural-sidebar-rail-label-duration, 120ms)
          var(--neural-sidebar-easing, cubic-bezier(0.2, 0, 0, 1)),
        transform var(--neural-sidebar-rail-label-duration, 120ms)
          var(--neural-sidebar-easing, cubic-bezier(0.2, 0, 0, 1));
    }
    .neural-sidebar-panel-root[data-mode='icon'][data-open='false'][data-side='end']
      .neural-panel-menu-list-root
      > neural-panel-menu-item
      > .neural-panel-menu-item-container-root
      > .neural-panel-menu-item-root::after,
    .neural-sidebar-panel-root[data-mode='icon'][data-open='false'][data-side='end']
      .neural-menu-item-root::after {
      inset-inline: auto
        calc(100% + var(--neural-sidebar-rail-label-offset, 0.625rem));
      transform: translateY(-50%) translateX(0.25rem);
    }
    .neural-sidebar-panel-root[data-mode='icon'][data-open='false']
      .neural-panel-menu-list-root
      > neural-panel-menu-item
      > .neural-panel-menu-item-container-root
      > .neural-panel-menu-item-root:not([aria-expanded='true']):is(
        :hover,
        :focus-visible
      )::after,
    .neural-sidebar-panel-root[data-mode='icon'][data-open='false']
      .neural-menu-item-root:is(:hover, :focus-visible)::after {
      opacity: 1;
      transform: translateY(-50%) translateX(0);
    }
    .neural-sidebar-panel-root[data-mode='icon'][data-open='false'][data-icon-menu='flyout']
      .neural-panel-menu-list-root
      > neural-panel-menu-item
      > .neural-panel-menu-item-container-root {
      position: relative;
    }
    .neural-sidebar-panel-root[data-mode='icon'][data-open='false'][data-icon-menu='flyout']
      .neural-panel-menu-list-root
      > neural-panel-menu-item
      > .neural-panel-menu-item-container-root
      > .neural-panel-menu-group-root {
      position: absolute;
      z-index: var(--neural-sidebar-flyout-z-index, 20);
      inset-block-start: 0;
      inset-inline-start: calc(
        100% + var(--neural-sidebar-flyout-offset, 0.5rem)
      );
      width: var(--neural-sidebar-flyout-width, 15rem);
      max-width: min(
        var(--neural-sidebar-flyout-width, 15rem),
        calc(100vw - var(--neural-sidebar-icon-width, 3.5rem) - 2rem)
      );
      opacity: 0;
      pointer-events: none;
      transform: translateX(-0.375rem) scale(0.98);
      transform-origin: top left;
      transition:
        opacity var(--neural-sidebar-flyout-duration, 160ms)
          var(--neural-sidebar-easing, cubic-bezier(0.2, 0, 0, 1)),
        transform var(--neural-sidebar-flyout-duration, 160ms)
          var(--neural-sidebar-easing, cubic-bezier(0.2, 0, 0, 1)),
        visibility 0s var(--neural-sidebar-flyout-duration, 160ms);
    }
    .neural-sidebar-panel-root[data-mode='icon'][data-open='false'][data-icon-menu='flyout'][data-side='end']
      .neural-panel-menu-list-root
      > neural-panel-menu-item
      > .neural-panel-menu-item-container-root
      > .neural-panel-menu-group-root {
      inset-inline: auto
        calc(100% + var(--neural-sidebar-flyout-offset, 0.5rem));
      transform: translateX(0.375rem) scale(0.98);
      transform-origin: top right;
    }
    .neural-sidebar-panel-root[data-mode='icon'][data-open='false'][data-icon-menu='flyout']
      .neural-panel-menu-list-root
      > neural-panel-menu-item
      > .neural-panel-menu-item-container-root
      > .neural-panel-menu-group-expanded-root {
      opacity: 1;
      pointer-events: auto;
      transform: translateX(0) scale(1);
      transition-delay: 0s;
    }
    .neural-sidebar-panel-root[data-mode='icon'][data-open='false'][data-icon-menu='flyout']
      .neural-panel-menu-list-root
      > neural-panel-menu-item
      > .neural-panel-menu-item-container-root
      > .neural-panel-menu-group-root
      > .neural-panel-menu-group-inner-root {
      max-height: min(var(--neural-sidebar-flyout-max-height, 28rem), 80vh);
      padding: var(--neural-sidebar-flyout-padding, 0.375rem);
      overflow: visible;
      color: var(--neural-sidebar-flyout-color, var(--neural-color-text));
      background: var(
        --neural-sidebar-flyout-background,
        var(--neural-color-surface)
      );
      border: var(
        --neural-sidebar-flyout-border,
        1px solid var(--neural-color-border)
      );
      border-radius: var(--neural-sidebar-flyout-radius, 0.75rem);
      box-shadow: var(
        --neural-sidebar-flyout-shadow,
        0 16px 40px rgb(var(--neural-color-shadow) / 0.18)
      );
    }
    .neural-sidebar-panel-root[data-mode='icon'][data-open='false'][data-icon-menu='flyout']
      .neural-panel-menu-list-root
      > neural-panel-menu-item
      > .neural-panel-menu-item-container-root
      > .neural-panel-menu-group-root
      .neural-panel-menu-item-container-root {
      position: relative;
    }
    .neural-sidebar-panel-root[data-mode='icon'][data-open='false'][data-icon-menu='flyout']
      .neural-panel-menu-list-root
      > neural-panel-menu-item
      > .neural-panel-menu-item-container-root
      > .neural-panel-menu-group-root
      .neural-panel-menu-item-container-root
      > .neural-panel-menu-group-root {
      position: absolute;
      z-index: calc(var(--neural-sidebar-flyout-z-index, 20) + 1);
      inset-block-start: 0;
      inset-inline-start: calc(
        100% + var(--neural-sidebar-nested-flyout-offset, 0.5rem)
      );
      width: var(
        --neural-sidebar-nested-flyout-width,
        var(--neural-sidebar-flyout-width, 15rem)
      );
      max-width: min(
        var(
          --neural-sidebar-nested-flyout-width,
          var(--neural-sidebar-flyout-width, 15rem)
        ),
        calc(100vw - var(--neural-sidebar-icon-width, 3.5rem) - 2rem)
      );
      display: block;
      grid-template-rows: none;
      visibility: hidden;
      opacity: 0;
      pointer-events: none;
      transform: translateX(-0.375rem) scale(0.98);
      transform-origin: top left;
      transition:
        opacity var(--neural-sidebar-flyout-duration, 160ms)
          var(--neural-sidebar-easing, cubic-bezier(0.2, 0, 0, 1)),
        transform var(--neural-sidebar-flyout-duration, 160ms)
          var(--neural-sidebar-easing, cubic-bezier(0.2, 0, 0, 1)),
        visibility 0s var(--neural-sidebar-flyout-duration, 160ms);
    }
    .neural-sidebar-panel-root[data-mode='icon'][data-open='false'][data-icon-menu='flyout'][data-side='end']
      .neural-panel-menu-list-root
      > neural-panel-menu-item
      > .neural-panel-menu-item-container-root
      > .neural-panel-menu-group-root
      .neural-panel-menu-item-container-root
      > .neural-panel-menu-group-root {
      inset-inline: auto
        calc(100% + var(--neural-sidebar-nested-flyout-offset, 0.5rem));
      transform: translateX(0.375rem) scale(0.98);
      transform-origin: top right;
    }
    .neural-sidebar-panel-root[data-mode='icon'][data-open='false'][data-icon-menu='flyout']
      .neural-panel-menu-list-root
      > neural-panel-menu-item
      > .neural-panel-menu-item-container-root
      > .neural-panel-menu-group-root
      .neural-panel-menu-item-container-root
      > .neural-panel-menu-group-expanded-root {
      visibility: visible;
      opacity: 1;
      pointer-events: auto;
      transform: translateX(0) scale(1);
      transition-delay: 0s;
    }
    .neural-sidebar-panel-root[data-mode='icon'][data-open='false'][data-icon-menu='flyout']
      .neural-panel-menu-list-root
      > neural-panel-menu-item
      > .neural-panel-menu-item-container-root
      > .neural-panel-menu-group-root
      .neural-panel-menu-item-container-root
      > .neural-panel-menu-group-root
      > .neural-panel-menu-group-inner-root {
      max-height: min(var(--neural-sidebar-flyout-max-height, 28rem), 80vh);
      padding: var(--neural-sidebar-flyout-padding, 0.375rem);
      overflow: visible;
      color: var(--neural-sidebar-flyout-color, var(--neural-color-text));
      background: var(
        --neural-sidebar-flyout-background,
        var(--neural-color-surface)
      );
      border: var(
        --neural-sidebar-flyout-border,
        1px solid var(--neural-color-border)
      );
      border-radius: var(--neural-sidebar-flyout-radius, 0.75rem);
      box-shadow: var(
        --neural-sidebar-flyout-shadow,
        0 16px 40px rgb(var(--neural-color-shadow) / 0.18)
      );
    }
    .neural-sidebar-panel-root[data-mode='icon'][data-open='false'][data-icon-menu='flyout']
      .neural-panel-menu-list-root
      > neural-panel-menu-item
      > .neural-panel-menu-item-container-root
      > .neural-panel-menu-group-root
      .neural-panel-menu-item-root[aria-expanded]
      .neural-panel-menu-indicator-root {
      transform: rotate(-45deg);
    }
    .neural-sidebar-panel-root[data-mode='icon'][data-open='false'][data-icon-menu='flyout'][data-side='end']
      .neural-panel-menu-list-root
      > neural-panel-menu-item
      > .neural-panel-menu-item-container-root
      > .neural-panel-menu-group-root
      .neural-panel-menu-item-root[aria-expanded]
      .neural-panel-menu-indicator-root {
      transform: rotate(135deg);
    }
    :where(.neural-sidebar-panel-base) {
      color: var(--neural-sidebar-color, var(--neural-color-text));
      background: var(--neural-sidebar-background, var(--neural-color-surface));
      border-inline-end: var(
        --neural-sidebar-border,
        1px solid var(--neural-color-border)
      );
    }
    :where(.neural-sidebar-panel-base[data-side='end']) {
      border-inline: var(
          --neural-sidebar-border,
          1px solid var(--neural-color-border)
        )
        0;
    }
    :where(.neural-sidebar-panel-base[data-variant='floating']) {
      margin: var(--neural-sidebar-floating-margin, 0.75rem);
      border: var(
        --neural-sidebar-border,
        1px solid var(--neural-color-border)
      );
      border-radius: var(--neural-sidebar-radius, 0.875rem);
      box-shadow: var(
        --neural-sidebar-shadow,
        0 12px 32px rgb(var(--neural-color-shadow) / 0.14)
      );
    }
    :where(.neural-sidebar-panel-base[data-variant='inset']) {
      margin: var(--neural-sidebar-inset-margin, 0.5rem);
      border: 0;
      border-radius: var(--neural-sidebar-radius, 0.875rem);
    }
    :where(.neural-sidebar-backdrop-root) {
      position: absolute;
      z-index: 1;
      inset: 0;
      width: 100%;
      height: 100%;
      padding: 0;
      border: 0;
    }
    :where(.neural-sidebar-backdrop-base) {
      background: var(--neural-sidebar-backdrop, rgb(15 23 42/0.42));
      backdrop-filter: var(--neural-sidebar-backdrop-filter, blur(2px));
    }
    :where(.neural-sidebar-content-root) {
      min-width: 0;
      min-height: 0;
      overflow: auto;
      overscroll-behavior: contain;
    }
    :where(.neural-sidebar-header-base) {
      padding: var(--neural-sidebar-header-padding, 0.75rem);
    }
    :where(.neural-sidebar-content-base) {
      padding: var(--neural-sidebar-content-padding, 0.5rem 0.75rem);
    }
    :where(.neural-sidebar-footer-base) {
      padding: var(--neural-sidebar-footer-padding, 0.75rem);
    }
    @media (prefers-reduced-motion: reduce) {
      :where(.neural-sidebar-panel-root),
      :where(.neural-sidebar-panel-root) .neural-panel-menu-group-root {
        transition-duration: 0.01ms;
      }
    }
  `,
})
export class NeuralSidebar {
  private readonly config = inject(NEURAL_NG_CONFIG);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly registry = inject(SidebarRegistry);
  private readonly scrollLock = inject(SidebarScrollLock);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router, { optional: true });
  private media?: MediaQueryList;
  private listener?: (event: MediaQueryListEvent) => void;
  private opener: HTMLElement | null = null;
  private unregister?: () => void;
  private hoverOpenTimer?: ReturnType<typeof setTimeout>;
  private hoverCloseTimer?: ReturnType<typeof setTimeout>;
  private nestedFlyoutTimer?: ReturnType<typeof setTimeout>;
  private nestedFlyoutTarget: HTMLButtonElement | null = null;
  private lastOpen = true;
  readonly open = model(true);
  readonly id = input(`neural-sidebar-${++nextSidebarId}`);
  readonly side = input<NeuralSidebarSide>('start');
  readonly variant = input<NeuralSidebarVariant>('sidebar');
  readonly collapseMode = input<NeuralSidebarCollapseMode>('icon');
  readonly iconMenu = input<NeuralSidebarIconMenu>('flyout');
  readonly openOnHover = input(false, { transform: booleanAttribute });
  readonly hoverOpenDelay = input(100, { transform: numberAttribute });
  readonly hoverCloseDelay = input(180, { transform: numberAttribute });
  readonly responsive = input(true, { transform: booleanAttribute });
  readonly breakpoint = input('64rem');
  readonly mobileMode = input<NeuralSidebarCollapseMode>('offcanvas');
  readonly overlay = input(false, { transform: booleanAttribute });
  readonly showBackdrop = input(true, { transform: booleanAttribute });
  readonly modal = input(true, { transform: booleanAttribute });
  readonly dismissibleBackdrop = input(true, { transform: booleanAttribute });
  readonly closeOnEscape = input(true, { transform: booleanAttribute });
  readonly closeOnMobile = input(true, { transform: booleanAttribute });
  readonly closeOnNavigation = input(true, { transform: booleanAttribute });
  readonly blockScroll = input(true, { transform: booleanAttribute });
  readonly width = input('16rem');
  readonly iconWidth = input('3.5rem');
  readonly ariaLabel = input<string | null>('Application navigation');
  readonly ariaLabelledby = input<string | null>(null);
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly sidebarClass = input('');
  readonly classes = input<NeuralSidebarClasses>({});
  readonly stateChange = output<NeuralSidebarStateChange>();
  readonly hoverChange = output<NeuralSidebarHoverChange>();
  readonly mobile = signal(false);
  readonly hoverExpanded = signal(false);
  readonly effectiveMode = computed(() =>
    this.mobile() ? this.mobileMode() : this.collapseMode(),
  );
  readonly effectiveOverlay = computed(
    () => this.overlay() || this.effectiveMode() === 'offcanvas',
  );
  readonly hidden = computed(
    () => this.effectiveMode() === 'offcanvas' && !this.open(),
  );
  readonly effectiveUnstyled = computed(
    () => this.unstyled() || this.config.unstyled,
  );
  readonly panelClass = computed(() =>
    this.compose(
      'neural-sidebar-panel-root',
      'neural-sidebar-panel-base',
      this.sidebarClass(),
      this.classes().panel,
    ),
  );
  readonly backdropClass = computed(() =>
    this.compose(
      'neural-sidebar-backdrop-root',
      'neural-sidebar-backdrop-base',
      this.classes().backdrop,
    ),
  );
  readonly visibleOpen = computed(
    () =>
      this.effectiveMode() === 'none' || this.open() || this.hoverExpanded(),
  );
  constructor() {
    effect((cleanup) => {
      this.unregister?.();
      this.unregister = this.registry.register(this.id(), this);
      cleanup(() => this.unregister?.());
    });
    effect((cleanup) => {
      this.clearMedia();
      if (!isPlatformBrowser(this.platformId) || !this.responsive()) {
        this.mobile.set(false);
        return;
      }
      this.media = matchMedia(`(max-width: ${this.breakpoint()})`);
      this.mobile.set(this.media.matches);
      if (this.media.matches && this.closeOnMobile())
        this.setOpen(false, 'responsive');
      this.listener = (event) => {
        this.mobile.set(event.matches);
        if (event.matches && this.closeOnMobile())
          this.setOpen(false, 'responsive', event);
      };
      this.media.addEventListener('change', this.listener);
      cleanup(() => this.clearMedia());
    });
    effect((cleanup) => {
      if (
        isPlatformBrowser(this.platformId) &&
        this.visibleOpen() &&
        this.effectiveOverlay() &&
        this.modal() &&
        this.blockScroll()
      )
        cleanup(this.scrollLock.lock());
    });
    effect(() => this.syncFocus());
    effect(() => {
      if (this.hoverExpanded() && !this.canHoverExpand())
        this.setHoverExpanded(false);
    });
    effect((cleanup) => {
      if (
        !isPlatformBrowser(this.platformId) ||
        this.effectiveMode() !== 'icon' ||
        this.visibleOpen() ||
        this.iconMenu() !== 'flyout'
      )
        return;
      const handleOutsidePointer = (event: PointerEvent) => {
        if (
          event.target instanceof Node &&
          !this.host.nativeElement.contains(event.target)
        )
          this.collapseFlyouts();
      };
      this.document.addEventListener('pointerdown', handleOutsidePointer, true);
      cleanup(() =>
        this.document.removeEventListener(
          'pointerdown',
          handleOutsidePointer,
          true,
        ),
      );
    });
    const routerSubscription = this.router?.events.subscribe((event) => {
      if (!(event instanceof NavigationEnd) || !this.closeOnNavigation())
        return;
      if (this.effectiveMode() === 'offcanvas' && this.visibleOpen())
        this.close('navigation');
      else if (this.effectiveMode() === 'icon' && !this.visibleOpen())
        this.collapseFlyouts();
    });
    this.destroyRef.onDestroy(() => {
      this.clearMedia();
      this.clearHoverTimers();
      this.clearNestedFlyoutTimer();
      this.unregister?.();
      routerSubscription?.unsubscribe();
    });
  }
  show(reason: NeuralSidebarStateChange['reason'] = 'api', event?: Event) {
    this.setOpen(true, reason, event);
  }
  close(reason: NeuralSidebarStateChange['reason'] = 'api', event?: Event) {
    if (reason === 'backdrop' && !this.dismissibleBackdrop()) return;
    this.setOpen(false, reason, event);
  }
  toggle(reason: NeuralSidebarStateChange['reason'] = 'api', event?: Event) {
    this.setOpen(!this.open(), reason, event);
  }
  handlePointerEnter(event: PointerEvent) {
    if (event.pointerType === 'touch' || !this.canHoverExpand()) return;
    this.clearHoverTimer('close');
    if (this.hoverExpanded()) return;
    this.scheduleHover(true, this.hoverOpenDelay(), event);
  }
  handlePointerLeave(event: PointerEvent) {
    this.clearNestedFlyoutTimer();
    if (!this.openOnHover() || !this.hoverExpanded()) return;
    this.clearHoverTimer('open');
    this.scheduleHover(false, this.hoverCloseDelay(), event);
  }
  handleNestedFlyoutPointerOver(event: PointerEvent) {
    if (
      event.pointerType === 'touch' ||
      this.effectiveMode() !== 'icon' ||
      this.visibleOpen() ||
      this.iconMenu() !== 'flyout' ||
      !(event.target instanceof Element)
    )
      return;
    const target = event.target.closest<HTMLButtonElement>(
      '.neural-panel-menu-item-root',
    );
    if (
      !target ||
      !this.host.nativeElement.contains(target) ||
      Number(target.getAttribute('aria-level')) <= 1 ||
      target.disabled ||
      target.getAttribute('aria-expanded') !== 'false'
    ) {
      if (target !== this.nestedFlyoutTarget) this.clearNestedFlyoutTimer();
      return;
    }
    if (this.nestedFlyoutTarget === target) return;

    this.clearNestedFlyoutTimer();
    this.nestedFlyoutTarget = target;
    const open = () => {
      this.nestedFlyoutTimer = undefined;
      this.nestedFlyoutTarget = null;
      if (
        !target.isConnected ||
        this.effectiveMode() !== 'icon' ||
        this.visibleOpen() ||
        target.getAttribute('aria-expanded') !== 'false'
      )
        return;
      const parentKey = target.dataset['parentKey'];
      const level = target.getAttribute('aria-level');
      for (const sibling of this.host.nativeElement.querySelectorAll<HTMLButtonElement>(
        'aside .neural-panel-menu-item-root[aria-expanded="true"]',
      )) {
        if (
          sibling !== target &&
          sibling.dataset['parentKey'] === parentKey &&
          sibling.getAttribute('aria-level') === level
        )
          sibling.click();
      }
      target.click();
    };
    const delay = Math.max(0, this.hoverOpenDelay());
    if (delay === 0) open();
    else this.nestedFlyoutTimer = setTimeout(open, delay);
  }
  handleFocusOut(event: FocusEvent) {
    if (
      !this.hoverExpanded() ||
      (event.relatedTarget instanceof Node &&
        this.host.nativeElement.contains(event.relatedTarget))
    )
      return;
    this.scheduleHover(false, this.hoverCloseDelay(), event);
  }
  handleKeydown(event: KeyboardEvent) {
    if (
      event.key === 'Escape' &&
      this.effectiveMode() === 'icon' &&
      !this.visibleOpen() &&
      this.collapseFlyouts(true)
    ) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (
      event.key === 'Escape' &&
      this.effectiveOverlay() &&
      this.closeOnEscape()
    ) {
      event.preventDefault();
      this.close('escape', event);
      return;
    }
    if (
      event.key !== 'Tab' ||
      !this.effectiveOverlay() ||
      !this.modal() ||
      !this.open()
    )
      return;
    const items = this.focusable();
    if (!items.length) return;
    const first = items[0],
      last = items[items.length - 1];
    if (event.shiftKey && this.document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && this.document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
  composeSlotClass(
    slot: 'header' | 'content' | 'footer',
    structural: string,
    visual: string,
    local: string,
  ) {
    return this.compose(structural, visual, this.classes()[slot], local);
  }
  private setOpen(
    value: boolean,
    reason: NeuralSidebarStateChange['reason'],
    nativeEvent?: Event,
  ) {
    if (this.effectiveMode() === 'none') value = true;
    if (value === this.open()) return;
    if (value && isPlatformBrowser(this.platformId))
      this.opener =
        this.document.activeElement instanceof HTMLElement
          ? this.document.activeElement
          : null;
    if (!value && this.effectiveMode() === 'icon') this.collapseFlyouts();
    if (value) this.setHoverExpanded(false);
    this.open.set(value);
    this.stateChange.emit({
      open: value,
      mobile: this.mobile(),
      mode: this.effectiveMode(),
      reason,
      nativeEvent,
    });
  }
  private canHoverExpand(): boolean {
    return (
      isPlatformBrowser(this.platformId) &&
      this.openOnHover() &&
      !this.mobile() &&
      this.effectiveMode() === 'icon' &&
      !this.open()
    );
  }
  private scheduleHover(
    expanded: boolean,
    delay: number,
    nativeEvent: PointerEvent | FocusEvent,
  ) {
    this.clearHoverTimer(expanded ? 'open' : 'close');
    const run = () => {
      if (expanded && !this.canHoverExpand()) return;
      if (
        !expanded &&
        this.document.activeElement instanceof Node &&
        this.host.nativeElement.contains(this.document.activeElement)
      )
        return;
      this.setHoverExpanded(expanded, nativeEvent);
    };
    if (Math.max(0, delay) === 0) run();
    else if (expanded)
      this.hoverOpenTimer = setTimeout(run, Math.max(0, delay));
    else this.hoverCloseTimer = setTimeout(run, Math.max(0, delay));
  }
  private setHoverExpanded(
    expanded: boolean,
    nativeEvent?: PointerEvent | FocusEvent,
  ) {
    if (expanded === this.hoverExpanded()) return;
    if (!expanded) this.collapseFlyouts();
    this.hoverExpanded.set(expanded);
    this.hoverChange.emit({ expanded, nativeEvent });
  }
  private clearHoverTimer(kind: 'open' | 'close') {
    const timer = kind === 'open' ? this.hoverOpenTimer : this.hoverCloseTimer;
    if (timer !== undefined) clearTimeout(timer);
    if (kind === 'open') this.hoverOpenTimer = undefined;
    else this.hoverCloseTimer = undefined;
  }
  private clearHoverTimers() {
    this.clearHoverTimer('open');
    this.clearHoverTimer('close');
  }
  private clearNestedFlyoutTimer() {
    if (this.nestedFlyoutTimer !== undefined)
      clearTimeout(this.nestedFlyoutTimer);
    this.nestedFlyoutTimer = undefined;
    this.nestedFlyoutTarget = null;
  }
  private syncFocus() {
    const open = this.visibleOpen();
    if (open === this.lastOpen) return;
    this.lastOpen = open;
    if (open && this.effectiveOverlay() && this.modal())
      queueMicrotask(() => this.focusTarget()?.focus({ preventScroll: true }));
    if (!open && this.opener?.isConnected) {
      const target = this.opener;
      this.opener = null;
      queueMicrotask(() => target.focus({ preventScroll: true }));
    }
  }
  private focusable() {
    return Array.from(
      this.host.nativeElement.querySelectorAll<HTMLElement>(
        'aside a[href],aside button:not([disabled]),aside input:not([disabled]),aside [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((item) => !item.hidden);
  }
  private focusTarget() {
    const preferredHost = this.host.nativeElement.querySelector<HTMLElement>(
      'aside [neuralSidebarInitialFocus]:not([disabled])',
    );
    if (
      preferredHost?.matches(
        'a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])',
      )
    )
      return preferredHost;
    return (
      preferredHost?.querySelector<HTMLElement>(
        'a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])',
      ) ?? this.focusable()[0]
    );
  }
  private collapseFlyouts(restoreFocus = false): boolean {
    this.clearNestedFlyoutTimer();
    const expanded = Array.from(
      this.host.nativeElement.querySelectorAll<HTMLElement>(
        'aside .neural-panel-menu-item-root[aria-level="1"][aria-expanded="true"]',
      ),
    );
    if (!expanded.length) return false;
    for (const item of expanded) item.click();
    if (restoreFocus) expanded[0]?.focus({ preventScroll: true });
    return true;
  }
  private clearMedia() {
    if (this.media && this.listener)
      this.media.removeEventListener('change', this.listener);
    this.media = undefined;
    this.listener = undefined;
  }
  private compose(
    structural: string,
    visual: string,
    ...consumer: Array<string | undefined>
  ) {
    return [structural, this.effectiveUnstyled() ? '' : visual, ...consumer]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(' ');
  }
}
abstract class Section {
  protected readonly sidebar = inject(NeuralSidebar, { host: true });
  compose(
    slot: 'header' | 'content' | 'footer',
    structural: string,
    visual: string,
    local: string,
  ) {
    return this.sidebar.composeSlotClass(slot, structural, visual, local);
  }
}
@Component({
  selector: 'neural-sidebar-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-sidebar-section-host' },
  template: `<header [class]="computedClass()"><ng-content /></header>`,
})
export class NeuralSidebarHeader extends Section {
  readonly headerClass = input('');
  readonly computedClass = computed(() =>
    this.compose(
      'header',
      'neural-sidebar-header-root',
      'neural-sidebar-header-base',
      this.headerClass(),
    ),
  );
}
@Component({
  selector: 'neural-sidebar-content',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-sidebar-section-host' },
  template: `<div [class]="computedClass()"><ng-content /></div>`,
})
export class NeuralSidebarContent extends Section {
  readonly contentClass = input('');
  readonly computedClass = computed(() =>
    this.compose(
      'content',
      'neural-sidebar-content-root',
      'neural-sidebar-content-base',
      this.contentClass(),
    ),
  );
}
@Component({
  selector: 'neural-sidebar-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-sidebar-section-host' },
  template: `<footer [class]="computedClass()"><ng-content /></footer>`,
})
export class NeuralSidebarFooter extends Section {
  readonly footerClass = input('');
  readonly computedClass = computed(() =>
    this.compose(
      'footer',
      'neural-sidebar-footer-root',
      'neural-sidebar-footer-base',
      this.footerClass(),
    ),
  );
}
@Directive({
  selector: '[neuralSidebarLabel]',
  standalone: true,
  host: { class: 'neural-sidebar-label-root' },
})
export class NeuralSidebarLabel {}

@Directive({
  selector: '[neuralSidebarInitialFocus]',
  standalone: true,
})
export class NeuralSidebarInitialFocus {}

@Directive({
  selector: '[neuralSidebarMain]',
  standalone: true,
  host: { '[class]': 'mainClass()' },
})
export class NeuralSidebarMain {
  private readonly config = inject(NEURAL_NG_CONFIG);
  readonly unstyled = input(false, {
    alias: 'neuralSidebarMainUnstyled',
    transform: booleanAttribute,
  });
  readonly mainClass = computed(() =>
    [
      'neural-sidebar-main-root',
      this.unstyled() || this.config.unstyled ? '' : 'neural-sidebar-main-base',
    ]
      .filter(Boolean)
      .join(' '),
  );
}
@Directive({
  selector: '[neuralSidebarTrigger]',
  standalone: true,
  exportAs: 'neuralSidebarTrigger',
  host: {
    '[attr.aria-controls]': 'target()',
    '[attr.aria-expanded]': 'expanded()',
    '[attr.data-sidebar-open]': "expanded() ? 'true' : 'false'",
    '(click)': 'activate($event)',
  },
})
export class NeuralSidebarTrigger {
  private readonly registry = inject(SidebarRegistry);
  readonly target = input.required<string>({ alias: 'neuralSidebarTrigger' });
  readonly expanded = computed(
    () => this.registry.get(this.target())?.visibleOpen() ?? false,
  );
  activate(event: Event) {
    this.registry.get(this.target())?.toggle('trigger', event);
  }
}
