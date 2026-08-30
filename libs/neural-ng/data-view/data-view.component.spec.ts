import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NeuralDataView } from './data-view.component';
import {
  NeuralDataViewGridItemTemplate,
  NeuralDataViewListItemTemplate,
} from './data-view-templates';

interface Product {
  readonly id: number;
  readonly name: string;
  readonly price: number;
}

@Component({
  imports: [
    NeuralDataView,
    NeuralDataViewListItemTemplate,
    NeuralDataViewGridItemTemplate,
  ],
  template: `<neural-data-view
    [value]="products"
    [(layout)]="layout"
    [(first)]="first"
    [rows]="2"
    sortField="price"
    [sortOrder]="order()"
    [dataMode]="dataMode()"
    [totalRecords]="totalRecords()"
    [unstyled]="unstyled()"
    ariaLabel="Products"
  >
    <ng-template
      [neuralDataViewListItem]="products"
      let-product
      let-index="originalIndex"
      ><span class="list-product"
        >{{ index }}:{{ product.name }}</span
      ></ng-template
    >
    <ng-template [neuralDataViewGridItem]="products" let-product
      ><span class="grid-product">{{ product.name }}</span></ng-template
    >
  </neural-data-view>`,
})
class HostComponent {
  readonly products: readonly Product[] = [
    { id: 1, name: 'Desk', price: 900 },
    { id: 2, name: 'Lamp', price: 120 },
    { id: 3, name: 'Chair', price: 540 },
  ];
  readonly layout = signal<'list' | 'grid'>('list');
  readonly first = signal(0);
  readonly order = signal<1 | -1>(1);
  readonly unstyled = signal(false);
  readonly dataMode = signal<'local' | 'remote'>('local');
  readonly totalRecords = signal(0);
}

describe('NeuralDataView', () => {
  let fixture: ComponentFixture<HostComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('sorts stably, pages locally, and exposes original indices', () => {
    expect(
      Array.from(
        fixture.nativeElement.querySelectorAll(
          '.list-product',
        ) as NodeListOf<Element>,
      ).map((item) => item.textContent?.trim()),
    ).toEqual(['0:Lamp', '1:Chair']);
    const component = dataViewComponent();
    component.handlePageChange({
      pageIndex: 1,
      pageSize: 2,
      pageCount: 2,
      totalItems: 3,
      startIndex: 2,
      endIndex: 3,
    });
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.list-product').textContent.trim(),
    ).toBe('2:Desk');
  });

  it('switches typed layout templates through controlled state', () => {
    const component = dataViewComponent();
    component.setLayout('grid');
    fixture.detectChanges();
    expect(fixture.componentInstance.layout()).toBe('grid');
    expect(
      fixture.nativeElement.querySelectorAll('.grid-product'),
    ).toHaveLength(2);
  });

  it('removes visual classes without removing structural hooks', () => {
    fixture.componentInstance.unstyled.set(true);
    fixture.detectChanges();
    const root = fixture.nativeElement.querySelector('.neural-data-view-root');
    expect(root.classList.contains('neural-data-view-base')).toBe(false);
    expect(root.getAttribute('role')).toBe('region');
  });

  it('does not sort or slice remote data', () => {
    const component = dataViewComponent();
    fixture.componentInstance.dataMode.set('remote');
    fixture.componentInstance.totalRecords.set(80);
    component.first.set(20);
    fixture.detectChanges();
    expect(component.renderedItems().map((product) => product.name)).toEqual([
      'Desk',
      'Lamp',
      'Chair',
    ]);
    expect(component.effectiveTotalRecords()).toBe(80);
  });

  function dataViewComponent(): NeuralDataView<Product> {
    return fixture.debugElement.query(
      (element) => element.componentInstance instanceof NeuralDataView,
    ).componentInstance as NeuralDataView<Product>;
  }
});
