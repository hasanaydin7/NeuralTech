import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  signal,
} from '@angular/core';
import {
  PaginatorComponent,
  type NeuralPageChange,
  type NeuralPaginatorClasses,
} from '@neural-ng/core/paginator';
import { CodeExample } from '../../../shared/code-example/code-example';

@Component({
  selector: 'app-paginator-page',
  imports: [CodeExample, PaginatorComponent],
  templateUrl: './paginator.page.html',
  styleUrls: ['./paginator.page.scss', '../shared-doc-page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginatorPage {
  readonly products = Array.from(
    { length: 42 },
    (_, index) => `Neural product ${index + 1}`,
  );
  readonly pageIndex = signal(0);
  readonly pageSize = signal(5);
  readonly visibleProducts = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.products.slice(start, start + this.pageSize());
  });
  readonly lastRange = signal('No page event yet');
  readonly headlessIndex = signal(0);
  readonly headlessClasses: NeuralPaginatorClasses = {
    list: 'docs-paginator-list',
    navigationButton: 'docs-paginator-button',
    pageButton: 'docs-paginator-button',
    activePageButton: 'docs-paginator-button--active',
    report: 'docs-paginator-report',
    pageSize: 'docs-paginator-size',
    pageSizeSelect: 'docs-paginator-select',
  };
  readonly importCode =
    "import { PaginatorComponent } from '@neural-ng/core/paginator';";
  readonly basicCode = `<neural-paginator
  [totalItems]="products.length"
  [(pageIndex)]="pageIndex"
  [(pageSize)]="pageSize"
  [pageSizeOptions]="[5, 10, 20]"
  (pageChange)="loadPage($event)"
/>`;

  recordRange(event: NeuralPageChange): void {
    this.lastRange.set(`${event.startIndex}–${event.endIndex}`);
  }
}
