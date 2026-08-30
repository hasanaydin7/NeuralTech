import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
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
import { NEURAL_NG_CONFIG, resolveNeuralVirtualRange } from '@neural-ng/core';
import {
  NeuralVirtualScrollerEmptyTemplate,
  NeuralVirtualScrollerItemTemplate,
  NeuralVirtualScrollerLoadingTemplate,
  type NeuralVirtualScrollerItemContext,
} from './virtual-scroller-templates';
import type {
  NeuralVirtualScrollerClasses,
  NeuralVirtualScrollerOrientation,
  NeuralVirtualScrollerRangeEvent,
  NeuralVirtualScrollerScrollBehavior,
  NeuralVirtualScrollerScrollEvent,
  NeuralVirtualScrollerTrackBy,
} from './virtual-scroller.types';

@Component({
  selector: 'neural-virtual-scroller',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './virtual-scroller.component.html',
  styleUrl: './virtual-scroller.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-virtual-scroller-host' },
})
export class NeuralVirtualScroller<T = unknown> {
  private readonly config = inject(NEURAL_NG_CONFIG);
  private readonly viewport = viewChild<ElementRef<HTMLElement>>('viewport');
  private lastRangeKey = '';
  private lastLazyRangeKey = '';
  private internalFirstWrite = false;

  readonly itemTemplate = contentChild(NeuralVirtualScrollerItemTemplate<T>);
  readonly emptyTemplate = contentChild(NeuralVirtualScrollerEmptyTemplate);
  readonly loadingTemplate = contentChild(NeuralVirtualScrollerLoadingTemplate);

  readonly items = input<readonly T[]>([]);
  readonly itemSize = input(48, { transform: numberAttribute });
  readonly viewportSize = input(320, { transform: numberAttribute });
  readonly overscan = input(3, { transform: numberAttribute });
  readonly orientation = input<NeuralVirtualScrollerOrientation>('vertical');
  readonly first = model(0);
  readonly lazy = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly emptyMessage = input('No items found');
  readonly loadingMessage = input('Loading items');
  readonly ariaLabel = input('Virtual list');
  readonly tabindex = input(0, { transform: numberAttribute });
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly virtualScrollerClass = input('');
  readonly classes = input<NeuralVirtualScrollerClasses>({});
  readonly trackBy = input<NeuralVirtualScrollerTrackBy<T> | null>(null);

  readonly rangeChange = output<NeuralVirtualScrollerRangeEvent>();
  readonly lazyLoad = output<NeuralVirtualScrollerRangeEvent>();
  readonly scrolled = output<NeuralVirtualScrollerScrollEvent>();

  readonly scrollOffset = signal(0);
  readonly effectiveUnstyled = computed(
    () => this.unstyled() || this.config.unstyled,
  );
  readonly normalizedItemSize = computed(() =>
    Math.max(1, this.itemSize() || 1),
  );
  readonly normalizedViewportSize = computed(() =>
    Math.max(this.normalizedItemSize(), this.viewportSize() || 1),
  );
  readonly normalizedFirst = computed(() =>
    Math.min(
      Math.max(0, this.items().length - 1),
      Math.max(0, Math.trunc(this.first()) || 0),
    ),
  );
  readonly range = computed<NeuralVirtualScrollerRangeEvent>(() => {
    const itemSize = this.normalizedItemSize();
    const viewportSize = this.normalizedViewportSize();
    const maximumOffset = Math.max(
      0,
      this.items().length * itemSize - viewportSize,
    );
    const offset = Math.min(maximumOffset, Math.max(0, this.scrollOffset()));
    const visibleStart = Math.floor(offset / itemSize);
    const visibleEnd = Math.min(
      this.items().length,
      visibleStart + Math.ceil(viewportSize / itemSize),
    );
    return {
      ...resolveNeuralVirtualRange({
        itemCount: this.items().length,
        itemSize,
        viewportSize,
        scrollOffset: offset,
        overscan: this.overscan(),
      }),
      visibleStart,
      visibleEnd,
    };
  });
  readonly renderedItems = computed(() =>
    this.items().slice(this.range().start, this.range().end),
  );
  readonly rootClass = computed(() =>
    this.compose(
      'neural-virtual-scroller-root',
      'neural-virtual-scroller-base',
      this.virtualScrollerClass(),
      this.classes().root,
    ),
  );

  constructor() {
    effect(() => {
      this.range();
      this.lazy();
      this.emitRange();
    });
    effect(() => {
      const viewport = this.viewport()?.nativeElement;
      const target = this.normalizedFirst() * this.normalizedItemSize();
      if (!viewport) return;
      if (this.internalFirstWrite) {
        this.internalFirstWrite = false;
        return;
      }
      const current =
        this.orientation() === 'vertical'
          ? viewport.scrollTop
          : viewport.scrollLeft;
      if (Math.abs(current - target) < 0.5) return;
      if (this.orientation() === 'vertical') viewport.scrollTop = target;
      else viewport.scrollLeft = target;
      this.scrollOffset.set(target);
      this.emitRange();
    });
  }

  handleScroll(event: Event): void {
    const viewport = event.currentTarget as HTMLElement;
    const offset =
      this.orientation() === 'vertical'
        ? viewport.scrollTop
        : viewport.scrollLeft;
    this.scrollOffset.set(offset);
    const visibleStart = this.range().visibleStart;
    if (visibleStart !== this.first()) {
      this.internalFirstWrite = true;
      this.first.set(visibleStart);
    }
    this.emitRange();
    this.scrolled.emit({ ...this.range(), offset });
  }

  scrollToIndex(
    index: number,
    behavior: NeuralVirtualScrollerScrollBehavior = 'auto',
  ): void {
    const normalized = Math.min(
      Math.max(0, this.items().length - 1),
      Math.max(0, Math.trunc(index) || 0),
    );
    this.scrollToOffset(normalized * this.normalizedItemSize(), behavior);
  }

  scrollToOffset(
    offset: number,
    behavior: NeuralVirtualScrollerScrollBehavior = 'auto',
  ): void {
    const viewport = this.viewport()?.nativeElement;
    const normalized = Math.max(0, offset || 0);
    if (!viewport) {
      this.scrollOffset.set(normalized);
      return;
    }
    const options =
      this.orientation() === 'vertical'
        ? { top: normalized, behavior }
        : { left: normalized, behavior };
    if (typeof viewport.scrollTo === 'function') viewport.scrollTo(options);
    else if (this.orientation() === 'vertical') viewport.scrollTop = normalized;
    else viewport.scrollLeft = normalized;
    if (behavior === 'auto') {
      this.scrollOffset.set(normalized);
      const visibleStart = this.range().visibleStart;
      if (visibleStart !== this.first()) {
        this.internalFirstWrite = true;
        this.first.set(visibleStart);
      }
      this.emitRange();
    }
  }

  itemContext(
    item: T,
    renderedIndex: number,
  ): NeuralVirtualScrollerItemContext<T> {
    const index = this.range().start + renderedIndex;
    return {
      $implicit: item,
      item,
      index,
      first: index === 0,
      last: index === this.items().length - 1,
      even: index % 2 === 0,
      odd: index % 2 !== 0,
    };
  }

  trackItem(renderedIndex: number, item: T): unknown {
    const index = this.range().start + renderedIndex;
    return this.trackBy()?.(item, index) ?? item;
  }

  stateContext(label: string) {
    return { $implicit: label, label };
  }

  classFor(
    slot: keyof NeuralVirtualScrollerClasses,
    root: string,
    base: string,
  ): string {
    return this.compose(root, base, this.classes()[slot]);
  }

  private emitRange(): void {
    const range = this.range();
    const key = `${range.start}:${range.end}:${range.visibleStart}:${range.visibleEnd}`;
    if (key !== this.lastRangeKey) {
      this.lastRangeKey = key;
      this.rangeChange.emit(range);
    }
    if (this.lazy() && key !== this.lastLazyRangeKey) {
      this.lastLazyRangeKey = key;
      this.lazyLoad.emit(range);
    }
  }

  private compose(
    root: string,
    base: string,
    ...consumer: Array<string | undefined>
  ): string {
    return [root, this.effectiveUnstyled() ? '' : base, ...consumer]
      .filter(Boolean)
      .join(' ');
  }
}

/** @deprecated Import NeuralVirtualScroller instead. */
export { NeuralVirtualScroller as VirtualScrollerComponent };
