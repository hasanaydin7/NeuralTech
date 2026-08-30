import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  Injector,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {
  NeuralTable,
  type NeuralTableColumn,
  type NeuralTableStateChange,
} from '@neural-ng/core/table';
import type { DemoProduct } from './table.page';

@Component({
  selector: 'app-table-enterprise-state-demo',
  imports: [NeuralTable],
  template: `
    <neural-table
      #table
      stateKey="neural-demo-enterprise-table"
      stateStorage="session"
      [value]="products()"
      [columns]="columns()"
      rowKey="id"
      selectionMode="multiple"
      selectionControl="checkbox"
      [paginate]="true"
      [pageSize]="3"
      resizableColumns
      reorderableColumns
      columnResizeMode="expand"
      striped
      ariaLabel="Persistent enterprise table"
    />
    <output class="demo-status" aria-live="polite">{{ status() }}</output>
    <code
      class="table-query-output"
      tabindex="0"
      aria-label="Serialized table URL query"
    >{{ query() }}</code>
  `,
  host: {
    class: 'table-enterprise-demo',
    'data-testid': 'table-enterprise-state',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableEnterpriseStateDemo {
  private readonly injector = inject(Injector);
  readonly products = input.required<readonly DemoProduct[]>();
  readonly columns = input.required<readonly NeuralTableColumn<DemoProduct>[]>();
  readonly table =
    viewChild.required<NeuralTable<DemoProduct>>('table');
  readonly status = signal(
    'The URL-compatible snapshot refreshes after every state change.',
  );
  readonly query = signal('No query parameter generated yet.');

  constructor() {
    afterNextRender(() => {
      effect(
        () => {
          const params = new URLSearchParams();
          params.set('table', this.table().serializeState());
          this.query.set(`?${params.toString()}`);
        },
        { injector: this.injector },
      );
    });
  }
}

@Component({
  selector: 'app-table-request-identity-demo',
  imports: [NeuralTable],
  template: `
    <neural-table
      #table
      dataMode="remote"
      [value]="products().slice(0, 2)"
      [columns]="columns()"
      [totalItems]="products().length"
      [pageSize]="2"
      ariaLabel="Remote request identity example"
      (stateChange)="handleRequest($event)"
    />
    <output class="demo-status" aria-live="polite">{{ status() }}</output>
  `,
  host: {
    class: 'table-request-demo',
    'data-testid': 'table-request-identity',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableRequestIdentityDemo {
  readonly products = input.required<readonly DemoProduct[]>();
  readonly columns = input.required<readonly NeuralTableColumn<DemoProduct>[]>();
  readonly table =
    viewChild.required<NeuralTable<DemoProduct>>('table');
  readonly status = signal(
    'Starting a slow request, then a fast request…',
  );

  constructor() {
    afterNextRender(() => {
      this.table().setPage(1, 2);
      setTimeout(() => this.table().setPage(2, 2), 40);
    });
  }

  handleRequest(event: NeuralTableStateChange): void {
    const delay = event.requestId % 2 === 1 ? 700 : 120;
    setTimeout(() => {
      this.status.set(
        this.table().isLatestRequest(event.requestId)
          ? `Applied latest request #${event.requestId}.`
          : `Ignored stale request #${event.requestId}.`,
      );
    }, delay);
  }
}
