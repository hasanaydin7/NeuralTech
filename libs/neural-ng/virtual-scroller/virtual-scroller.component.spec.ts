import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NeuralVirtualScroller } from './virtual-scroller.component';
import { NeuralVirtualScrollerItemTemplate } from './virtual-scroller-templates';
import type { NeuralVirtualScrollerRangeEvent } from './virtual-scroller.types';

interface RecordItem {
  readonly id: number;
  readonly label: string;
}

@Component({
  imports: [NeuralVirtualScroller, NeuralVirtualScrollerItemTemplate],
  template: `<neural-virtual-scroller
    [items]="items"
    [itemSize]="40"
    [viewportSize]="120"
    [overscan]="1"
    [(first)]="first"
    [lazy]="lazy()"
    [unstyled]="unstyled()"
    (rangeChange)="ranges.push($event)"
    (lazyLoad)="lazyRanges.push($event)"
    ariaLabel="Records"
  >
    <ng-template [neuralVirtualScrollerItem]="items" let-item let-index="index">
      <span class="record">{{ index }}:{{ item.label }}</span>
    </ng-template>
  </neural-virtual-scroller>`,
})
class HostComponent {
  readonly items: readonly RecordItem[] = Array.from(
    { length: 100 },
    (_, index) => ({ id: index, label: `Record ${index}` }),
  );
  readonly first = signal(0);
  readonly lazy = signal(false);
  readonly unstyled = signal(false);
  readonly ranges: NeuralVirtualScrollerRangeEvent[] = [];
  readonly lazyRanges: NeuralVirtualScrollerRangeEvent[] = [];
}

describe('NeuralVirtualScroller beta', () => {
  let fixture: ComponentFixture<HostComponent>;
  let component: NeuralVirtualScroller<RecordItem>;
  let viewport: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    component = fixture.debugElement.query(
      (element) => element.componentInstance instanceof NeuralVirtualScroller,
    ).componentInstance as NeuralVirtualScroller<RecordItem>;
    viewport = fixture.nativeElement.querySelector(
      '.neural-virtual-scroller-viewport-root',
    );
  });

  it('renders only the overscanned fixed-size window', () => {
    expect(component.range()).toEqual({
      start: 0,
      end: 4,
      offsetBefore: 0,
      offsetAfter: 3840,
      totalSize: 4000,
      visibleStart: 0,
      visibleEnd: 3,
    });
    expect(fixture.nativeElement.querySelectorAll('.record')).toHaveLength(4);
  });

  it('updates the controlled first index and emits end-exclusive ranges', () => {
    fixture.componentInstance.lazy.set(true);
    fixture.detectChanges();
    viewport.scrollTop = 400;
    viewport.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(fixture.componentInstance.first()).toBe(10);
    expect(component.range().start).toBe(9);
    expect(component.range().end).toBe(14);
    expect(
      fixture.componentInstance.lazyRanges[
        fixture.componentInstance.lazyRanges.length - 1
      ]?.visibleStart,
    ).toBe(10);
  });

  it('supports programmatic index scrolling', () => {
    component.scrollToIndex(20);
    fixture.detectChanges();
    expect(viewport.scrollTop).toBe(800);
    expect(component.range().visibleStart).toBe(20);
  });

  it('removes visual classes but preserves structure and aria metadata', () => {
    fixture.componentInstance.unstyled.set(true);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector(
      '.neural-virtual-scroller-root',
    );
    expect(root.classList.contains('neural-virtual-scroller-base')).toBe(false);
    expect(viewport.getAttribute('role')).toBe('list');
    expect(
      fixture.nativeElement
        .querySelector('.neural-virtual-scroller-item-root')
        .getAttribute('aria-setsize'),
    ).toBe('100');
  });
});
