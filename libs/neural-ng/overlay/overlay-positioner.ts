import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import type {
  NeuralOverlayPlacement,
  NeuralOverlayPositionOptions,
  NeuralOverlayPositionRef,
} from './overlay.types';

const DEFAULT_OFFSET = 8;
const DEFAULT_VIEWPORT_PADDING = 8;

@Injectable({ providedIn: 'root' })
export class NeuralOverlayPositioner {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly nativeAnchors = new WeakMap<
    HTMLElement,
    { readonly original: string; readonly names: Set<string> }
  >();
  private anchorId = 0;

  connect(
    anchor: HTMLElement,
    overlay: HTMLElement,
    options: NeuralOverlayPositionOptions = {},
  ): NeuralOverlayPositionRef {
    const preferred = options.placement ?? 'top';
    const resolved = signal<NeuralOverlayPlacement>(preferred);

    if (!isPlatformBrowser(this.platformId)) {
      return {
        resolvedPlacement: resolved,
        update: () => undefined,
        destroy: () => undefined,
      };
    }

    if (this.supportsAnchorPositioning()) {
      return this.connectNative(
        anchor,
        overlay,
        preferred,
        options.offset ?? DEFAULT_OFFSET,
        resolved,
      );
    }

    return this.connectFallback(
      anchor,
      overlay,
      preferred,
      options.offset ?? DEFAULT_OFFSET,
      options.viewportPadding ?? DEFAULT_VIEWPORT_PADDING,
      resolved,
    );
  }

  private connectNative(
    anchor: HTMLElement,
    overlay: HTMLElement,
    placement: NeuralOverlayPlacement,
    offset: number,
    resolved: ReturnType<typeof signal<NeuralOverlayPlacement>>,
  ): NeuralOverlayPositionRef {
    const anchorName = `--neural-overlay-${++this.anchorId}`;
    this.acquireAnchorName(anchor, anchorName);
    const previousPositionAnchor =
      overlay.style.getPropertyValue('position-anchor');
    const previousPositionArea = overlay.style.getPropertyValue('position-area');
    const previousTryFallbacks = overlay.style.getPropertyValue(
      'position-try-fallbacks',
    );
    const previousMargin = overlay.style.getPropertyValue('margin');
    let frame = 0;

    const resolveActualPlacement = (): void => {
      if (!anchor.isConnected || !overlay.isConnected) return;
      const anchorRect = anchor.getBoundingClientRect();
      const overlayRect = overlay.getBoundingClientRect();
      const suffix = placement.endsWith('-start')
        ? '-start'
        : placement.endsWith('-end')
          ? '-end'
          : '';
      let actual: NeuralOverlayPlacement = placement;
      if (overlayRect.bottom <= anchorRect.top) {
        actual = `top${suffix}` as NeuralOverlayPlacement;
      } else if (overlayRect.top >= anchorRect.bottom) {
        actual = `bottom${suffix}` as NeuralOverlayPlacement;
      } else if (overlayRect.right <= anchorRect.left) {
        actual = 'left';
      } else if (overlayRect.left >= anchorRect.right) {
        actual = 'right';
      }
      resolved.set(actual);
      overlay.dataset['position'] = actual;
    };
    const scheduleResolution = (): void => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(resolveActualPlacement);
    };

    const update = (): void => {
      const area = this.toPositionArea(placement);
      overlay.style.setProperty('position-anchor', anchorName);
      overlay.style.setProperty('position-area', area);
      overlay.style.setProperty(
        'position-try-fallbacks',
        'flip-block, flip-inline',
      );
      overlay.style.setProperty('margin', this.toAnchorMargin(placement, offset));
      overlay.style.removeProperty('inset');
      resolved.set(placement);
      overlay.dataset['position'] = placement;
      scheduleResolution();
    };

    window.addEventListener('resize', scheduleResolution);
    this.document.addEventListener('scroll', scheduleResolution, true);
    update();
    return {
      resolvedPlacement: resolved,
      update,
      destroy: () => {
        cancelAnimationFrame(frame);
        window.removeEventListener('resize', scheduleResolution);
        this.document.removeEventListener('scroll', scheduleResolution, true);
        this.releaseAnchorName(anchor, anchorName);
        this.restoreStyle(
          overlay,
          'position-anchor',
          previousPositionAnchor,
        );
        this.restoreStyle(overlay, 'position-area', previousPositionArea);
        this.restoreStyle(
          overlay,
          'position-try-fallbacks',
          previousTryFallbacks,
        );
        this.restoreStyle(overlay, 'margin', previousMargin);
      },
    };
  }

  private acquireAnchorName(anchor: HTMLElement, name: string): void {
    let state = this.nativeAnchors.get(anchor);
    if (!state) {
      state = {
        original: anchor.style.getPropertyValue('anchor-name'),
        names: new Set<string>(),
      };
      this.nativeAnchors.set(anchor, state);
    }
    state.names.add(name);
    this.writeAnchorNames(anchor, state);
  }

  private releaseAnchorName(anchor: HTMLElement, name: string): void {
    const state = this.nativeAnchors.get(anchor);
    if (!state) return;
    state.names.delete(name);
    if (state.names.size) {
      this.writeAnchorNames(anchor, state);
      return;
    }
    this.restoreStyle(anchor, 'anchor-name', state.original);
    this.nativeAnchors.delete(anchor);
  }

  private writeAnchorNames(
    anchor: HTMLElement,
    state: { readonly original: string; readonly names: Set<string> },
  ): void {
    const names = [
      ...(state.original && state.original !== 'none' ? [state.original] : []),
      ...state.names,
    ];
    anchor.style.setProperty('anchor-name', names.join(', '));
  }

  private connectFallback(
    anchor: HTMLElement,
    overlay: HTMLElement,
    preferred: NeuralOverlayPlacement,
    offset: number,
    viewportPadding: number,
    resolved: ReturnType<typeof signal<NeuralOverlayPlacement>>,
  ): NeuralOverlayPositionRef {
    let frame = 0;
    const update = (): void => {
      if (!anchor.isConnected || !overlay.isConnected) return;
      const anchorRect = anchor.getBoundingClientRect();
      const overlayRect = overlay.getBoundingClientRect();
      const rtl = getComputedStyle(anchor).direction === 'rtl';
      const candidates = this.candidates(preferred);
      let selected = candidates[0];
      let point = this.point(
        candidates[0],
        anchorRect,
        overlayRect,
        offset,
        rtl,
      );

      for (const candidate of candidates) {
        const candidatePoint = this.point(
          candidate,
          anchorRect,
          overlayRect,
          offset,
          rtl,
        );
        if (
          candidatePoint.left >= viewportPadding &&
          candidatePoint.top >= viewportPadding &&
          candidatePoint.left + overlayRect.width <=
            window.innerWidth - viewportPadding &&
          candidatePoint.top + overlayRect.height <=
            window.innerHeight - viewportPadding
        ) {
          selected = candidate;
          point = candidatePoint;
          break;
        }
      }

      const maxLeft = Math.max(
        viewportPadding,
        window.innerWidth - overlayRect.width - viewportPadding,
      );
      const maxTop = Math.max(
        viewportPadding,
        window.innerHeight - overlayRect.height - viewportPadding,
      );
      overlay.style.left = `${Math.min(Math.max(point.left, viewportPadding), maxLeft)}px`;
      overlay.style.top = `${Math.min(Math.max(point.top, viewportPadding), maxTop)}px`;
      resolved.set(selected);
      overlay.dataset['position'] = selected;
    };
    const schedule = (): void => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    window.addEventListener('resize', schedule);
    this.document.addEventListener('scroll', schedule, true);
    update();

    return {
      resolvedPlacement: resolved,
      update,
      destroy: () => {
        cancelAnimationFrame(frame);
        window.removeEventListener('resize', schedule);
        this.document.removeEventListener('scroll', schedule, true);
        overlay.style.removeProperty('left');
        overlay.style.removeProperty('top');
      },
    };
  }

  private point(
    placement: NeuralOverlayPlacement,
    anchor: DOMRect,
    overlay: DOMRect,
    offset: number,
    rtl: boolean,
  ): { left: number; top: number } {
    const centerLeft = anchor.left + (anchor.width - overlay.width) / 2;
    const startLeft = rtl ? anchor.right - overlay.width : anchor.left;
    const endLeft = rtl ? anchor.left : anchor.right - overlay.width;

    switch (placement) {
      case 'top':
        return { left: centerLeft, top: anchor.top - overlay.height - offset };
      case 'top-start':
        return { left: startLeft, top: anchor.top - overlay.height - offset };
      case 'top-end':
        return { left: endLeft, top: anchor.top - overlay.height - offset };
      case 'bottom':
        return { left: centerLeft, top: anchor.bottom + offset };
      case 'bottom-start':
        return { left: startLeft, top: anchor.bottom + offset };
      case 'bottom-end':
        return { left: endLeft, top: anchor.bottom + offset };
      case 'left':
        return {
          left: anchor.left - overlay.width - offset,
          top: anchor.top + (anchor.height - overlay.height) / 2,
        };
      case 'right':
        return {
          left: anchor.right + offset,
          top: anchor.top + (anchor.height - overlay.height) / 2,
        };
    }
  }

  private candidates(
    preferred: NeuralOverlayPlacement,
  ): readonly NeuralOverlayPlacement[] {
    const opposite: Record<NeuralOverlayPlacement, NeuralOverlayPlacement> = {
      top: 'bottom',
      'top-start': 'bottom-start',
      'top-end': 'bottom-end',
      bottom: 'top',
      'bottom-start': 'top-start',
      'bottom-end': 'top-end',
      left: 'right',
      right: 'left',
    };
    return [
      preferred,
      opposite[preferred],
      'top',
      'bottom',
      'right',
      'left',
    ];
  }

  private toPositionArea(placement: NeuralOverlayPlacement): string {
    const areas: Record<NeuralOverlayPlacement, string> = {
      top: 'block-start',
      'top-start': 'block-start span-inline-end',
      'top-end': 'block-start span-inline-start',
      bottom: 'block-end',
      'bottom-start': 'block-end span-inline-end',
      'bottom-end': 'block-end span-inline-start',
      left: 'left',
      right: 'right',
    };
    return areas[placement];
  }

  private toAnchorMargin(
    placement: NeuralOverlayPlacement,
    offset: number,
  ): string {
    if (placement.startsWith('top')) return `0 0 ${offset}px`;
    if (placement.startsWith('bottom')) return `${offset}px 0 0`;
    if (placement === 'left') return `0 ${offset}px 0 0`;
    return `0 0 0 ${offset}px`;
  }

  private supportsAnchorPositioning(): boolean {
    return (
      typeof CSS !== 'undefined' &&
      typeof CSS.supports === 'function' &&
      CSS.supports('position-area: top') &&
      CSS.supports('anchor-name: --neural-anchor')
    );
  }

  private restoreStyle(
    element: HTMLElement,
    property: string,
    previous: string,
  ): void {
    if (previous) element.style.setProperty(property, previous);
    else element.style.removeProperty(property);
  }
}
