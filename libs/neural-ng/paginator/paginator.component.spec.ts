import { ComponentFixture, TestBed } from '@angular/core/testing';
import { neuralTr } from '../locales/tr';
import { NeuralLocaleService } from '../src/neural-locale';
import { provideNeuralNg } from '../src/neural-ng.config';
import { NeuralPaginator } from './paginator.component';
import { createPageChange, createPageItems } from './paginator.utils';

describe('Paginator utilities', () => {
  it('creates a slice-compatible page state', () => {
    expect(createPageChange(2, 10, 26)).toEqual({
      pageIndex: 2,
      pageSize: 10,
      pageCount: 3,
      totalItems: 26,
      startIndex: 20,
      endIndex: 26,
    });
  });

  it('clamps invalid values without producing NaN', () => {
    expect(createPageChange(99, 0, -10)).toEqual({
      pageIndex: 0,
      pageSize: 1,
      pageCount: 0,
      totalItems: 0,
      startIndex: 0,
      endIndex: 0,
    });
  });

  it('creates stable page windows with unique ellipsis items', () => {
    expect(createPageItems(0, 20, 5)).toEqual([0, 1, 2, 3, 'end-ellipsis', 19]);
    expect(createPageItems(9, 20, 5)).toEqual([
      0,
      'start-ellipsis',
      8,
      9,
      10,
      'end-ellipsis',
      19,
    ]);
  });
});

describe('NeuralPaginator', () => {
  let fixture: ComponentFixture<NeuralPaginator>;
  let component: NeuralPaginator;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NeuralPaginator],
    }).compileComponents();

    fixture = TestBed.createComponent(NeuralPaginator);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('totalItems', 120);
    fixture.detectChanges();
  });

  it('exposes modern signal defaults', () => {
    expect(component.pageIndex()).toBe(0);
    expect(component.pageSize()).toBe(10);
    expect(component.pageLinkCount()).toBe(5);
    expect(component.showFirstLast()).toBe(true);
    expect(component.showReport()).toBe(true);
    expect(component.rounded()).toBe(false);
    expect(component.outlined()).toBe(false);
    expect(component.firstPageIcon()).toBe('nt-chevrons-left');
    expect(component.ellipsisIcon()).toBe('nt-dots');
    expect(component.unstyled()).toBe(false);
  });

  it('composes rounded and borderless outlined visual variants', () => {
    fixture.componentRef.setInput('rounded', true);
    fixture.componentRef.setInput('outlined', true);
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector('nav') as HTMLElement;
    expect(nav.classList).toContain('neural-paginator-rounded-base');
    expect(nav.classList).toContain('neural-paginator-outlined-base');
  });

  it('renders overridable Neural Icons classes without text glyphs', () => {
    fixture.componentRef.setInput(
      'previousPageIcon',
      'nt-arrow-back custom-icon',
    );
    fixture.detectChanges();

    const previousIcon = fixture.nativeElement.querySelector(
      '[aria-label="Previous page"] i',
    ) as HTMLElement;
    expect(previousIcon.classList.contains('nt')).toBe(true);
    expect(previousIcon.classList.contains('nt-arrow-back')).toBe(true);
    expect(previousIcon.classList.contains('custom-icon')).toBe(true);
  });

  it('renders a labelled navigation landmark and current page', () => {
    const nav = fixture.nativeElement.querySelector('nav') as HTMLElement;
    const current = fixture.nativeElement.querySelector(
      '[aria-current="page"]',
    ) as HTMLButtonElement;

    expect(nav.getAttribute('aria-label')).toBe('Pagination');
    expect(current.textContent?.trim()).toBe('1');
    expect(current.getAttribute('aria-label')).toBe('Page 1');
    expect(current.disabled).toBe(false);
  });

  it('renders and updates the polite information report', () => {
    const report = () =>
      fixture.nativeElement.querySelector(
        '.neural-paginator-report-root',
      ) as HTMLElement;

    expect(report().textContent?.trim()).toBe('Showing 1 to 10 of 120 items');
    expect(report().getAttribute('aria-live')).toBe('polite');
    expect(report().getAttribute('aria-atomic')).toBe('true');

    component.pageIndex.set(11);
    fixture.detectChanges();
    expect(report().textContent?.trim()).toBe(
      'Showing 111 to 120 of 120 items',
    );
  });

  it('supports a localized report template and labels', () => {
    fixture.componentRef.setInput(
      'reportTemplate',
      '{total} öğeden {start}–{end} arası gösteriliyor',
    );
    fixture.componentRef.setInput('labels', {
      navigation: 'Ürün sayfaları',
      nextPage: 'Sonraki sayfa',
    });
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('nav').getAttribute('aria-label'),
    ).toBe('Ürün sayfaları');
    expect(
      fixture.nativeElement.querySelector('.neural-paginator-report-root')
        .textContent,
    ).toContain('120 öğeden 1–10 arası gösteriliyor');
    expect(
      fixture.nativeElement.querySelector('[aria-label="Sonraki sayfa"]'),
    ).not.toBeNull();
  });

  it('updates the model and emits a complete event on user navigation', () => {
    let event: unknown;
    component.pageChange.subscribe((value) => (event = value));

    const next = fixture.nativeElement.querySelector(
      '[aria-label="Next page"]',
    ) as HTMLButtonElement;
    next.click();
    fixture.detectChanges();

    expect(component.pageIndex()).toBe(1);
    expect(event).toEqual({
      pageIndex: 1,
      pageSize: 10,
      pageCount: 12,
      totalItems: 120,
      startIndex: 10,
      endIndex: 20,
    });
  });

  it('preserves the first visible item when page size changes', () => {
    component.pageIndex.set(4);
    fixture.componentRef.setInput('pageSizeOptions', [10, 20, 50]);
    fixture.detectChanges();
    let event: unknown;
    component.pageChange.subscribe((value) => (event = value));

    component.changePageSize(20);
    fixture.detectChanges();

    expect(component.pageSize()).toBe(20);
    expect(component.pageIndex()).toBe(2);
    expect(event).toMatchObject({ startIndex: 40, endIndex: 60 });
  });

  it('composes NeuralSelect instead of a native page-size select', () => {
    fixture.componentRef.setInput('pageSizeOptions', [10, 20, 50]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('neural-select')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('select')).toBeNull();
    expect(
      fixture.nativeElement
        .querySelector('.neural-select-trigger-root')
        ?.classList.contains('neural-paginator-size-select-root'),
    ).toBe(true);
  });

  it('disables navigation safely for an empty collection', () => {
    fixture.componentRef.setInput('totalItems', 0);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelectorAll('[aria-current="page"]'),
    ).toHaveLength(0);
    expect(
      Array.from(
        fixture.nativeElement.querySelectorAll(
          'button',
        ) as NodeListOf<HTMLButtonElement>,
      ).every((button) => button.disabled),
    ).toBe(true);
    expect(component.report()).toBe('Showing 0 to 0 of 0 items');
  });

  it('keeps structural classes and merges slot classes when unstyled', () => {
    fixture.componentRef.setInput('unstyled', true);
    fixture.componentRef.setInput('paginatorClass', 'consumer-root');
    fixture.componentRef.setInput('classes', {
      pageButton: 'consumer-page',
      activePageButton: 'consumer-active',
      report: 'consumer-report',
    });
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector('nav') as HTMLElement;
    const current = fixture.nativeElement.querySelector(
      '[aria-current="page"]',
    ) as HTMLButtonElement;
    expect(nav.classList).toContain('neural-paginator-root');
    expect(nav.classList).not.toContain('neural-paginator-base');
    expect(nav.classList).toContain('consumer-root');
    expect(current.classList).toContain('consumer-page');
    expect(current.classList).toContain('consumer-active');
    expect(current.classList).not.toContain('neural-paginator-button-base');
  });

  it('does not emit when the active page is selected again', () => {
    let count = 0;
    component.pageChange.subscribe(() => count++);
    const current = fixture.nativeElement.querySelector(
      '[aria-current="page"]',
    ) as HTMLButtonElement;
    current.click();

    expect(count).toBe(0);
  });
});

describe('NeuralPaginator global configuration', () => {
  it('inherits global unstyled mode', () => {
    TestBed.configureTestingModule({
      imports: [NeuralPaginator],
      providers: [provideNeuralNg({ unstyled: true })],
    });
    const fixture = TestBed.createComponent(NeuralPaginator);
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('nav') as HTMLElement;

    expect(nav.classList).toContain('neural-paginator-root');
    expect(nav.classList).not.toContain('neural-paginator-base');
  });

  it('reacts to runtime locale changes while local labels stay optional', () => {
    TestBed.configureTestingModule({
      imports: [NeuralPaginator],
    });
    const fixture = TestBed.createComponent(NeuralPaginator);
    fixture.componentRef.setInput('totalItems', 25);
    fixture.detectChanges();

    TestBed.inject(NeuralLocaleService).use(neuralTr);
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector('nav') as HTMLElement;
    const next = Array.from(
      fixture.nativeElement.querySelectorAll(
        'button',
      ) as NodeListOf<HTMLButtonElement>,
    ).find(
      (button) =>
        button.getAttribute('aria-label') ===
        neuralTr.messages?.paginator?.nextPage,
    );

    expect(nav.getAttribute('aria-label')).toBe(
      neuralTr.messages?.paginator?.navigation,
    );
    expect(next).toBeDefined();
    expect(
      fixture.nativeElement.querySelector('[aria-live]').textContent.trim(),
    ).toBe('25 öğeden 1–10 arası gösteriliyor');
  });
});
