import type { NeuralPageChange, NeuralPaginatorItem } from './paginator.types';

export function normalizeInteger(value: number, minimum: number): number {
  return Number.isFinite(value)
    ? Math.max(minimum, Math.trunc(value))
    : minimum;
}

export function getPageCount(totalItems: number, pageSize: number): number {
  return totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
}

export function clampPageIndex(pageIndex: number, pageCount: number): number {
  return pageCount === 0
    ? 0
    : Math.min(normalizeInteger(pageIndex, 0), pageCount - 1);
}

export function createPageItems(
  pageIndex: number,
  pageCount: number,
  pageLinkCount: number,
): readonly NeuralPaginatorItem[] {
  if (pageCount === 0) {
    return [];
  }

  const maximumLinks = normalizeInteger(pageLinkCount, 5);
  if (pageCount <= maximumLinks) {
    return Array.from({ length: pageCount }, (_, index) => index);
  }

  const current = clampPageIndex(pageIndex, pageCount);
  const last = pageCount - 1;
  const middleSlots = maximumLinks - 2;
  const maximumStart = last - middleSlots;
  const middleStart = Math.min(
    Math.max(current - Math.floor(middleSlots / 2), 1),
    maximumStart,
  );
  const middleEnd = middleStart + middleSlots - 1;
  const items: NeuralPaginatorItem[] = [0];

  if (middleStart > 1) {
    items.push('start-ellipsis');
  }
  for (let page = middleStart; page <= middleEnd; page += 1) {
    items.push(page);
  }
  if (middleEnd < last - 1) {
    items.push('end-ellipsis');
  }
  items.push(last);

  return items;
}

export function createPageChange(
  pageIndex: number,
  pageSize: number,
  totalItems: number,
): NeuralPageChange {
  const normalizedTotal = normalizeInteger(totalItems, 0);
  const normalizedSize = normalizeInteger(pageSize, 1);
  const pageCount = getPageCount(normalizedTotal, normalizedSize);
  const normalizedIndex = clampPageIndex(pageIndex, pageCount);
  const startIndex = pageCount === 0 ? 0 : normalizedIndex * normalizedSize;
  const endIndex = Math.min(startIndex + normalizedSize, normalizedTotal);

  return {
    pageIndex: normalizedIndex,
    pageSize: normalizedSize,
    pageCount,
    totalItems: normalizedTotal,
    startIndex,
    endIndex,
  };
}
