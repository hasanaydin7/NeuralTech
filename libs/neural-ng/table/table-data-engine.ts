import type {
  NeuralTableColumn,
  NeuralTableFilter,
  NeuralTableFilterMatchMode,
  NeuralTableSort,
} from './table.types';

export function resolveNeuralTableValue<T>(
  row: T,
  column: NeuralTableColumn<T>,
  rowIndex: number,
): unknown {
  if (column.valueAccessor) return column.valueAccessor(row, rowIndex);
  return column.field ? resolveNeuralTablePath(row, String(column.field)) : null;
}

export function resolveNeuralTablePath(value: unknown, path: string): unknown {
  return path
    .split('.')
    .filter(Boolean)
    .reduce<unknown>((current, key) => {
      if (current === null || typeof current !== 'object') return undefined;
      return (current as Readonly<Record<string, unknown>>)[key];
    }, value);
}

export function aggregateNeuralTableValues(
  values: readonly unknown[],
  operation: 'sum' | 'average' | 'min' | 'max',
): number | null {
  const numbers = values
    .filter(
      (value) =>
        value !== null &&
        value !== undefined &&
        value !== '' &&
        typeof value !== 'boolean',
    )
    .map((value) => (typeof value === 'number' ? value : Number(value)))
    .filter((value) => Number.isFinite(value));
  if (numbers.length === 0) return null;
  if (operation === 'sum') return numbers.reduce((total, value) => total + value, 0);
  if (operation === 'average') {
    return numbers.reduce((total, value) => total + value, 0) / numbers.length;
  }
  return operation === 'min' ? Math.min(...numbers) : Math.max(...numbers);
}

export function aggregateNeuralTableRows<T>(
  rows: readonly T[],
  field: keyof T | string | ((row: T, rowIndex: number) => unknown),
  operation: 'sum' | 'average' | 'min' | 'max',
): number | null {
  return aggregateNeuralTableValues(
    rows.map((row, rowIndex) =>
      typeof field === 'function'
        ? field(row, rowIndex)
        : resolveNeuralTablePath(row, String(field)),
    ),
    operation,
  );
}

export function filterNeuralTableRows<T>(
  rows: readonly T[],
  columns: readonly NeuralTableColumn<T>[],
  filters: readonly NeuralTableFilter[],
  globalFilter: unknown,
): T[] {
  const searchableColumns = columns.filter(
    (column) => !column.hidden && column.filterable !== false,
  );
  return rows.filter((row, rowIndex) => {
    const matchesFields = filters.every((filter) => {
      const column = columns.find(
        (candidate) =>
          candidate.id === filter.field ||
          String(candidate.field ?? '') === filter.field,
      );
      if (!column) return true;
      return matchesNeuralTableFilter(
        resolveNeuralTableValue(row, column, rowIndex),
        filter.value,
        filter.matchMode ?? 'contains',
      );
    });
    if (!matchesFields || isEmptyFilter(globalFilter)) return matchesFields;
    return searchableColumns.some((column) =>
      matchesNeuralTableFilter(
        resolveNeuralTableValue(row, column, rowIndex),
        globalFilter,
        'contains',
      ),
    );
  });
}

export function sortNeuralTableRows<T>(
  rows: readonly T[],
  columns: readonly NeuralTableColumn<T>[],
  sorts: readonly NeuralTableSort[],
): T[] {
  if (sorts.length === 0) return [...rows];
  return rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => {
      for (const sort of sorts) {
        const column = columns.find(
          (candidate) =>
            candidate.id === sort.field ||
            String(candidate.field ?? '') === sort.field,
        );
        if (!column) continue;
        const comparison = compareNeuralTableValues(
          resolveNeuralTableValue(left.row, column, left.index),
          resolveNeuralTableValue(right.row, column, right.index),
        );
        if (comparison !== 0) {
          return sort.direction === 'asc' ? comparison : -comparison;
        }
      }
      return left.index - right.index;
    })
    .map(({ row }) => row);
}

export function paginateNeuralTableRows<T>(
  rows: readonly T[],
  pageIndex: number,
  pageSize: number,
): T[] {
  const safeSize = Math.max(1, Math.trunc(pageSize) || 1);
  const safeIndex = Math.max(0, Math.trunc(pageIndex) || 0);
  return rows.slice(safeIndex * safeSize, (safeIndex + 1) * safeSize);
}

export function compareNeuralTableValues(
  left: unknown,
  right: unknown,
): number {
  if (Object.is(left, right)) return 0;
  if (left === null || left === undefined) return -1;
  if (right === null || right === undefined) return 1;
  if (left instanceof Date || right instanceof Date) {
    const leftTime =
      left instanceof Date ? left.getTime() : Date.parse(String(left));
    const rightTime =
      right instanceof Date ? right.getTime() : Date.parse(String(right));
    if (!Number.isNaN(leftTime) && !Number.isNaN(rightTime)) {
      return leftTime - rightTime;
    }
  }
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  if (typeof left === 'boolean' && typeof right === 'boolean') {
    return Number(left) - Number(right);
  }
  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

export function matchesNeuralTableFilter(
  value: unknown,
  filter: unknown,
  matchMode: NeuralTableFilterMatchMode,
): boolean {
  if (isEmptyFilter(filter)) return true;
  const normalizedValue = normalize(value);
  const normalizedFilter = normalize(filter);
  switch (matchMode) {
    case 'startsWith':
      return normalizedValue.startsWith(normalizedFilter);
    case 'endsWith':
      return normalizedValue.endsWith(normalizedFilter);
    case 'equals':
      return Object.is(value, filter) || normalizedValue === normalizedFilter;
    case 'notEquals':
      return !Object.is(value, filter) && normalizedValue !== normalizedFilter;
    case 'lt':
      return compareNeuralTableValues(value, filter) < 0;
    case 'lte':
      return compareNeuralTableValues(value, filter) <= 0;
    case 'gt':
      return compareNeuralTableValues(value, filter) > 0;
    case 'gte':
      return compareNeuralTableValues(value, filter) >= 0;
    case 'in':
      return (
        Array.isArray(filter) &&
        filter.some(
          (item) =>
            Object.is(value, item) || normalizedValue === normalize(item),
          )
      );
    case 'between':
      if (!Array.isArray(filter) || filter.length < 2) return true;
      return (
        (isEmptyFilter(filter[0]) ||
          compareNeuralTableValues(value, filter[0]) >= 0) &&
        (isEmptyFilter(filter[1]) ||
          compareNeuralTableValues(value, filter[1]) <= 0)
      );
    default:
      return normalizedValue.includes(normalizedFilter);
  }
}

function normalize(value: unknown): string {
  return String(value ?? '').trim().toLocaleLowerCase();
}

function isEmptyFilter(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0)
  );
}
