import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { NeuralButton } from '@neural-ng/core/button';
import { NeuralColorModeService } from '@neural-ng/core/color-mode';
import {
  NeuralVirtualScrollerItemTemplate,
  NeuralVirtualScroller,
  type NeuralVirtualScrollerClasses,
  type NeuralVirtualScrollerRangeEvent,
} from '@neural-ng/core/virtual-scroller';
import { CodeView } from '../../../shared/code-view';

interface AgentRecord {
  readonly id: number;
  readonly name: string;
  readonly group: string;
  readonly status: 'Ready' | 'Thinking' | 'Queued';
}

@Component({
  selector: 'app-virtual-scroller-page',
  imports: [
    NeuralButton,
    CodeView,
    NeuralVirtualScrollerItemTemplate,
    NeuralVirtualScroller,
  ],
  templateUrl: './virtual-scroller.page.html',
  styleUrls: ['../shared-doc-page.scss', './virtual-scroller.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class VirtualScrollerPage {
  readonly resolvedMode = inject(NeuralColorModeService).resolvedMode;
  readonly records: readonly AgentRecord[] = Array.from(
    { length: 10_000 },
    (_, index) => ({
      id: index + 1,
      name: `Agent task ${String(index + 1).padStart(5, '0')}`,
      group: ['Research', 'Build', 'Review'][index % 3],
      status: ['Ready', 'Thinking', 'Queued'][
        index % 3
      ] as AgentRecord['status'],
    }),
  );
  readonly cards = this.records.slice(0, 24);
  readonly first = signal(0);
  readonly rangeStatus = signal('Visible 1–6 · rendered 1–9');
  readonly lazyStatus = signal('Scroll to request a range');
  readonly loading = signal(false);
  readonly headlessClasses: NeuralVirtualScrollerClasses = {
    root: 'docs-virtual-headless',
    viewport: 'docs-virtual-headless__viewport',
    item: 'docs-virtual-headless__item',
    loading: 'docs-virtual-headless__loading',
  };
  readonly trackRecord = (record: AgentRecord): number => record.id;
  readonly importCode = `import {
  NeuralVirtualScroller,
  NeuralVirtualScrollerItemTemplate,
} from '@neural-ng/core/virtual-scroller';`;
  readonly basicCode = `<neural-virtual-scroller
  #scroller
  [items]="records"
  [itemSize]="52"
  [viewportSize]="312"
  [(first)]="first"
>
  <ng-template [neuralVirtualScrollerItem]="records" let-record let-index="index">
    {{ index + 1 }}. {{ record.name }}
  </ng-template>
</neural-virtual-scroller>

<button (click)="scroller.scrollToIndex(5000)">Jump to 5,001</button>`;
  readonly horizontalCode = `<neural-virtual-scroller
  [items]="cards"
  orientation="horizontal"
  [itemSize]="184"
  [viewportSize]="720"
>...</neural-virtual-scroller>`;
  readonly lazyCode = `<neural-virtual-scroller
  [items]="records"
  lazy
  [loading]="loading"
  (lazyLoad)="loadRange($event)"
/>`;
  readonly headlessCode = `<neural-virtual-scroller
  [items]="records"
  unstyled
  [classes]="classes"
/>`;

  updateRange(range: NeuralVirtualScrollerRangeEvent): void {
    this.rangeStatus.set(
      `Visible ${range.visibleStart + 1}–${range.visibleEnd} · rendered ${range.start + 1}–${range.end}`,
    );
  }

  requestRange(range: NeuralVirtualScrollerRangeEvent): void {
    this.lazyStatus.set(
      `Requested [${range.start}, ${range.end}) · visible [${range.visibleStart}, ${range.visibleEnd})`,
    );
  }

  toggleLoading(): void {
    this.loading.update((value) => !value);
  }
}
