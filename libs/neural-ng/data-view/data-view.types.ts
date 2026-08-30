export type NeuralDataViewLayout = 'list' | 'grid';
export type NeuralDataViewDataMode = 'local' | 'remote';
export type NeuralDataViewSortOrder = 1 | -1;
export type NeuralDataViewStateReason = 'page' | 'layout' | 'sort';

export interface NeuralDataViewState {
  readonly first: number;
  readonly rows: number;
  readonly pageIndex: number;
  readonly pageCount: number;
  readonly totalRecords: number;
  readonly layout: NeuralDataViewLayout;
  readonly sortField: string;
  readonly sortOrder: NeuralDataViewSortOrder;
}

export interface NeuralDataViewStateChange extends NeuralDataViewState {
  readonly reason: NeuralDataViewStateReason;
}

export interface NeuralDataViewPageEvent extends NeuralDataViewState {
  readonly reason: 'page';
}

export interface NeuralDataViewLayoutChange extends NeuralDataViewState {
  readonly reason: 'layout';
  readonly previousLayout: NeuralDataViewLayout;
}

export interface NeuralDataViewSortChange extends NeuralDataViewState {
  readonly reason: 'sort';
  readonly previousField: string;
  readonly previousOrder: NeuralDataViewSortOrder;
}

export interface NeuralDataViewClasses {
  readonly root?: string;
  readonly header?: string;
  readonly content?: string;
  readonly list?: string;
  readonly grid?: string;
  readonly item?: string;
  readonly empty?: string;
  readonly loading?: string;
  readonly skeleton?: string;
  readonly paginator?: string;
  readonly footer?: string;
}

export type NeuralDataViewTrackBy<T> = (item: T, index: number) => unknown;
export type NeuralDataViewSortComparator<T> = (
  first: T,
  second: T,
  field: string,
  order: NeuralDataViewSortOrder,
) => number;
