import { CurrencyPipe } from '@angular/common';
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
  NeuralDataView,
  NeuralDataViewEmptyTemplate,
  NeuralDataViewGridItemTemplate,
  NeuralDataViewHeaderTemplate,
  NeuralDataViewListItemTemplate,
  type NeuralDataViewClasses,
  type NeuralDataViewLayout,
  type NeuralDataViewPageEvent,
  type NeuralDataViewSortOrder,
} from '@neural-ng/core/data-view';
import { NeuralTag } from '@neural-ng/core/tag';
import { CodeView } from '../../../shared/code-view';

interface Product {
  readonly id: number;
  readonly name: string;
  readonly category: string;
  readonly description: string;
  readonly price: number;
  readonly stock: number;
  readonly icon: string;
}

@Component({
  selector: 'app-data-view-page',
  imports: [
    NeuralButton,
    CodeView,
    CurrencyPipe,
    NeuralDataView,
    NeuralDataViewEmptyTemplate,
    NeuralDataViewGridItemTemplate,
    NeuralDataViewHeaderTemplate,
    NeuralDataViewListItemTemplate,
    NeuralTag,
  ],
  templateUrl: './data-view.page.html',
  styleUrls: ['../shared-doc-page.scss', './data-view.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class DataViewPage {
  readonly resolvedMode = inject(NeuralColorModeService).resolvedMode;
  readonly products: readonly Product[] = [
    {
      id: 1,
      name: 'Signal Desk',
      category: 'Office',
      description: 'A calm workspace for reactive products.',
      price: 899,
      stock: 24,
      icon: 'nt-desktop',
    },
    {
      id: 2,
      name: 'Hydration Lamp',
      category: 'Lighting',
      description: 'Adaptive ambient light with instant startup.',
      price: 129,
      stock: 7,
      icon: 'nt-bulb',
    },
    {
      id: 3,
      name: 'Standalone Chair',
      category: 'Office',
      description: 'Ergonomic support without legacy modules.',
      price: 549,
      stock: 0,
      icon: 'nt-armchair',
    },
    {
      id: 4,
      name: 'Neural Speaker',
      category: 'Audio',
      description: 'Clear spatial sound for focused teams.',
      price: 249,
      stock: 18,
      icon: 'nt-speakerphone',
    },
    {
      id: 5,
      name: 'Token Shelf',
      category: 'Storage',
      description: 'A modular home for every design primitive.',
      price: 319,
      stock: 4,
      icon: 'nt-books',
    },
    {
      id: 6,
      name: 'Headless Clock',
      category: 'Accessories',
      description: 'Timezone-safe focus for distributed agents.',
      price: 89,
      stock: 31,
      icon: 'nt-clock',
    },
    {
      id: 7,
      name: 'Agent Hub',
      category: 'Compute',
      description: 'A compact command center for AI workflows.',
      price: 1149,
      stock: 11,
      icon: 'nt-cpu',
    },
    {
      id: 8,
      name: 'Context Board',
      category: 'Office',
      description: 'Keep product intent visible to every collaborator.',
      price: 199,
      stock: 16,
      icon: 'nt-layout-board',
    },
  ];
  readonly layout = signal<NeuralDataViewLayout>('grid');
  readonly first = signal(0);
  readonly rows = signal(6);
  readonly sortField = signal('name');
  readonly sortOrder = signal<NeuralDataViewSortOrder>(1);
  readonly remoteItems = signal<readonly Product[]>(this.products.slice(0, 3));
  readonly remoteStatus = signal('Request 1 · records 1–3');
  readonly headlessClasses: NeuralDataViewClasses = {
    root: 'docs-data-view-headless',
    content: 'docs-data-view-headless__content',
    list: 'docs-data-view-headless__list',
    item: 'docs-data-view-headless__item',
    paginator: 'docs-data-view-headless__paginator',
  };
  readonly productTrackBy = (product: Product): number => product.id;
  readonly importCode = `import {
  NeuralDataView,
  NeuralDataViewListItemTemplate,
  NeuralDataViewGridItemTemplate,
} from '@neural-ng/core/data-view';`;
  readonly basicCode = `<neural-data-view
  [value]="products"
  [(layout)]="layout"
  [(first)]="first"
  [(rows)]="rows"
  [(sortField)]="sortField"
  [(sortOrder)]="sortOrder"
>
  <ng-template [neuralDataViewListItem]="products" let-product>{{ product.name }}</ng-template>
  <ng-template [neuralDataViewGridItem]="products" let-product>{{ product.name }}</ng-template>
</neural-data-view>`;
  readonly remoteCode = `<neural-data-view dataMode="remote" [value]="page" [totalRecords]="240" [rows]="3" (stateChange)="loadPage($event)">...</neural-data-view>`;
  readonly statesCode = `<neural-data-view [value]="[]" loading />
<neural-data-view [value]="[]"><ng-template neuralDataViewEmpty let-label>{{ label }}</ng-template></neural-data-view>`;
  readonly headlessCode = `<neural-data-view [value]="products" unstyled [classes]="classes">...</neural-data-view>`;

  setLayout(layout: NeuralDataViewLayout): void {
    this.layout.set(layout);
  }
  updateSort(event: Event): void {
    const [field, order] = (event.target as HTMLSelectElement).value.split(':');
    this.sortField.set(field);
    this.sortOrder.set(Number(order) as NeuralDataViewSortOrder);
    this.first.set(0);
  }
  handleRemotePage(event: NeuralDataViewPageEvent): void {
    const start = event.first % this.products.length;
    this.remoteItems.set(
      Array.from(
        { length: event.rows },
        (_, index) => this.products[(start + index) % this.products.length],
      ),
    );
    this.remoteStatus.set(
      `Request page ${event.pageIndex + 1} · records ${event.first + 1}–${Math.min(event.first + event.rows, event.totalRecords)}`,
    );
  }
  stockSeverity(product: Product): 'success' | 'warning' | 'error' {
    return product.stock === 0
      ? 'error'
      : product.stock < 8
        ? 'warning'
        : 'success';
  }
  stockLabel(product: Product): string {
    return product.stock === 0
      ? 'Out of stock'
      : product.stock < 8
        ? 'Low stock'
        : 'In stock';
  }
}
