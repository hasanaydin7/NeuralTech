import type {
  NeuralTreeFlatNode,
  NeuralTreeFilterOptions,
  NeuralTreeFilterResult,
  NeuralTreeIndexEntry,
  NeuralTreeKey,
  NeuralTreeNode,
  NeuralTreeOptionMapping,
  NeuralResolvedTreeState,
  NeuralTreeState,
} from './tree.types';
import {
  normalizeNeuralOptionText,
  readNeuralOptionPath,
} from '@neural-ng/core';

export function flattenNeuralTree<T>(
  nodes: readonly NeuralTreeNode<T>[],
  expandedKeys: ReadonlySet<NeuralTreeKey>,
): readonly NeuralTreeFlatNode<T>[] {
  indexNeuralTree(nodes);
  const result: NeuralTreeFlatNode<T>[] = [];

  const visit = (
    siblings: readonly NeuralTreeNode<T>[],
    level: number,
    parentKey: NeuralTreeKey | null,
    parentPath: readonly NeuralTreeKey[],
  ): void => {
    for (let position = 0; position < siblings.length; position += 1) {
      const node = siblings[position];
      const children = node.children ?? [];
      const leaf = node.leaf ?? children.length === 0;
      const expanded = !leaf && expandedKeys.has(node.key);
      const path = Object.freeze([...parentPath, node.key]);
      result.push(
        Object.freeze({
          node,
          key: node.key,
          level,
          parentKey,
          path,
          index: result.length,
          posInSet: position + 1,
          setSize: siblings.length,
          expanded,
          leaf,
        }),
      );

      if (expanded && children.length > 0) {
        visit(children, level + 1, node.key, path);
      }
    }
  };

  visit(nodes, 1, null, []);
  return Object.freeze(result);
}

export function collectExpandableTreeKeys<T>(
  nodes: readonly NeuralTreeNode<T>[],
): ReadonlySet<NeuralTreeKey> {
  indexNeuralTree(nodes);
  const keys = new Set<NeuralTreeKey>();

  const visit = (items: readonly NeuralTreeNode<T>[]): void => {
    for (const node of items) {
      const children = node.children ?? [];
      if (node.leaf === false || children.length > 0) keys.add(node.key);
      visit(children);
    }
  };

  visit(nodes);
  return keys;
}

export function indexNeuralTree<T>(
  nodes: readonly NeuralTreeNode<T>[],
): ReadonlyMap<NeuralTreeKey, NeuralTreeIndexEntry<T>> {
  const keys = new Set<NeuralTreeKey>();
  const ancestors = new Set<NeuralTreeNode<T>>();
  const index = new Map<NeuralTreeKey, NeuralTreeIndexEntry<T>>();

  const visit = (
    items: readonly NeuralTreeNode<T>[],
    parentKey: NeuralTreeKey | null,
    parentPath: readonly NeuralTreeKey[],
    level: number,
  ): void => {
    for (const node of items) {
      if (ancestors.has(node)) {
        throw new Error(`NeuralNg Tree: cycle detected at key "${node.key}".`);
      }
      if (keys.has(node.key)) {
        throw new Error(`NeuralNg Tree: duplicate key "${node.key}".`);
      }
      keys.add(node.key);
      const path = Object.freeze([...parentPath, node.key]);
      index.set(
        node.key,
        Object.freeze({
          node,
          key: node.key,
          parentKey,
          childKeys: Object.freeze(
            (node.children ?? []).map((child) => child.key),
          ),
          path,
          level,
        }),
      );
      ancestors.add(node);
      visit(node.children ?? [], node.key, path, level + 1);
      ancestors.delete(node);
    }
  };

  visit(nodes, null, [], 1);
  return index;
}

export function filterNeuralTree<T>(
  nodes: readonly NeuralTreeNode<T>[],
  query: string,
  options: NeuralTreeFilterOptions<T> = {},
): NeuralTreeFilterResult<T> {
  const normalizedQuery = normalizeNeuralOptionText(
    query.trim(),
    options.locale,
  );
  if (!normalizedQuery) {
    return Object.freeze({
      nodes,
      expandedKeys: new Set<NeuralTreeKey>(),
      matchedKeys: new Set<NeuralTreeKey>(),
    });
  }
  indexNeuralTree(nodes);
  const mode = options.mode ?? 'lenient';
  const fields = options.fields?.length ? options.fields : ['label'];
  const expandedKeys = new Set<NeuralTreeKey>();
  const matchedKeys = new Set<NeuralTreeKey>();

  const matches = (node: NeuralTreeNode<T>): boolean => {
    if (options.predicate?.(node, normalizedQuery)) return true;
    return fields.some((field) =>
      normalizeNeuralOptionText(
        String(readNeuralOptionPath(node, field) ?? ''),
        options.locale,
      ).includes(normalizedQuery),
    );
  };

  const collectExpandable = (node: NeuralTreeNode<T>): void => {
    if ((node.children?.length ?? 0) > 0 || node.leaf === false) {
      expandedKeys.add(node.key);
    }
    for (const child of node.children ?? []) collectExpandable(child);
  };

  const visit = (
    items: readonly NeuralTreeNode<T>[],
  ): readonly NeuralTreeNode<T>[] => {
    const result: NeuralTreeNode<T>[] = [];
    for (const node of items) {
      const matched = matches(node);
      if (matched) matchedKeys.add(node.key);
      if (matched && mode === 'lenient') {
        collectExpandable(node);
        result.push(node);
        continue;
      }
      const children = visit(node.children ?? []);
      if (!matched && children.length === 0) continue;
      if (children.length > 0) expandedKeys.add(node.key);
      result.push(
        children === node.children
          ? node
          : Object.freeze({ ...node, children: Object.freeze(children) }),
      );
    }
    return Object.freeze(result);
  };

  return Object.freeze({
    nodes: visit(nodes),
    expandedKeys,
    matchedKeys,
  });
}

export function mapNeuralTreeOptions<TOption>(
  options: readonly TOption[],
  mapping: NeuralTreeOptionMapping = {},
): readonly NeuralTreeNode<TOption>[] {
  const labelPath = mapping.optionLabel ?? 'label';
  const valuePath = mapping.optionValue ?? 'value';
  const keyPath = mapping.optionKey ?? valuePath;
  const childrenPath = mapping.optionChildren ?? 'children';
  const disabledPath = mapping.optionDisabled ?? 'disabled';
  const iconPath = mapping.optionIcon ?? 'iconClass';
  const map = (items: readonly TOption[]): readonly NeuralTreeNode<TOption>[] =>
    Object.freeze(
      items.map((option) => {
        const key = readNeuralOptionPath(option, keyPath);
        if (typeof key !== 'string' && typeof key !== 'number') {
          throw new Error(
            `NeuralNg Tree: optionKey "${keyPath}" must resolve to a string or number.`,
          );
        }
        const childrenValue = readNeuralOptionPath(option, childrenPath);
        const children = Array.isArray(childrenValue)
          ? map(childrenValue as readonly TOption[])
          : undefined;
        const icon = readNeuralOptionPath(option, iconPath);
        return Object.freeze({
          key,
          label: String(readNeuralOptionPath(option, labelPath) ?? ''),
          data: option,
          ...(children ? { children } : {}),
          ...(readNeuralOptionPath(option, disabledPath)
            ? { disabled: true }
            : {}),
          ...(typeof icon === 'string' && icon ? { iconClass: icon } : {}),
        });
      }),
    );
  const nodes = map(options);
  indexNeuralTree(nodes);
  return nodes;
}

export class NeuralTreeController<T = unknown> {
  resolve(
    nodes: readonly NeuralTreeNode<T>[],
    state: NeuralTreeState,
    filterOptions: NeuralTreeFilterOptions<T> = {},
  ): NeuralResolvedTreeState<T> {
    const filtered = filterNeuralTree(nodes, state.filterValue, filterOptions);
    const expandedKeys = new Set([
      ...state.expandedKeys,
      ...filtered.expandedKeys,
    ]);
    return Object.freeze({
      nodes: filtered.nodes,
      index: indexNeuralTree(filtered.nodes),
      visibleNodes: flattenNeuralTree(filtered.nodes, expandedKeys),
      expandedKeys,
      selectionKeys: new Set(state.selectionKeys),
      filterValue: state.filterValue,
      matchedKeys: filtered.matchedKeys,
    });
  }
}
