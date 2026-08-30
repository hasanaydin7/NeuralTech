export type NeuralPaginatorItem = number | 'start-ellipsis' | 'end-ellipsis';

export interface NeuralPageChange {
  readonly pageIndex: number;
  readonly pageSize: number;
  readonly pageCount: number;
  readonly totalItems: number;
  readonly startIndex: number;
  readonly endIndex: number;
}

export interface NeuralPaginatorClasses {
  readonly root?: string;
  readonly list?: string;
  readonly navigationButton?: string;
  readonly pageButton?: string;
  readonly activePageButton?: string;
  readonly icon?: string;
  readonly ellipsis?: string;
  readonly report?: string;
  readonly pageSize?: string;
  readonly pageSizeSelect?: string;
}

export interface NeuralPaginatorLabels {
  readonly navigation: string;
  readonly firstPage: string;
  readonly previousPage: string;
  readonly nextPage: string;
  readonly lastPage: string;
  readonly page: string;
  readonly pageSize: string;
}
