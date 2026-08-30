import type { NeuralTableState } from './table.types';

export const NEURAL_TABLE_STATE_VERSION = 1 as const;
const FILTER_MATCH_MODES = new Set([
  'contains',
  'startsWith',
  'endsWith',
  'equals',
  'notEquals',
  'lt',
  'lte',
  'gt',
  'gte',
  'in',
  'between',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isRowKeyArray(value: unknown): value is Array<string | number> {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === 'string' ||
        (typeof item === 'number' && Number.isFinite(item)),
    )
  );
}

export function serializeNeuralTableState(state: NeuralTableState): string {
  return JSON.stringify(state);
}

export function parseNeuralTableState(
  value: string | NeuralTableState | unknown,
): NeuralTableState | null {
  let candidate: unknown = value;
  if (typeof value === 'string') {
    try {
      candidate = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!isRecord(candidate)) return null;
  const state = candidate as Partial<NeuralTableState>;
  if (
    state.version !== NEURAL_TABLE_STATE_VERSION ||
    !Number.isFinite(state.pageIndex) ||
    !Number.isFinite(state.pageSize) ||
    !Array.isArray(state.sort) ||
    !state.sort.every(
      (item) =>
        isRecord(item) &&
        typeof item['field'] === 'string' &&
        (item['direction'] === 'asc' || item['direction'] === 'desc'),
    ) ||
    !Array.isArray(state.filters) ||
    !state.filters.every(
      (item) =>
        isRecord(item) &&
        typeof item['field'] === 'string' &&
        ('value' in item) &&
        (item['matchMode'] === undefined ||
          (typeof item['matchMode'] === 'string' &&
            FILTER_MATCH_MODES.has(item['matchMode']))),
    ) ||
    !isStringArray(state.columnOrder) ||
    !isRecord(state.columnWidths) ||
    !Object.values(state.columnWidths).every(
      (width) =>
        typeof width === 'number' && Number.isFinite(width) && width > 0,
    ) ||
    !isStringArray(state.hiddenColumnIds) ||
    !isRowKeyArray(state.selectionKeys) ||
    !isRowKeyArray(state.expandedRowKeys) ||
    !isRowKeyArray(state.expandedRowGroupKeys)
  ) {
    return null;
  }
  return {
    version: NEURAL_TABLE_STATE_VERSION,
    pageIndex: Math.max(0, Math.trunc(state.pageIndex as number)),
    pageSize: Math.max(1, Math.trunc(state.pageSize as number)),
    sort: state.sort,
    filters: state.filters,
    globalFilter: state.globalFilter ?? null,
    columnOrder: state.columnOrder,
    columnWidths: state.columnWidths,
    hiddenColumnIds: state.hiddenColumnIds,
    selectionKeys: state.selectionKeys,
    expandedRowKeys: state.expandedRowKeys,
    expandedRowGroupKeys: state.expandedRowGroupKeys,
  };
}
