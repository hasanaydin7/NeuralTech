export type NeuralTreeKey = string | number;
export type NeuralTreeSelectionMode = 'single' | 'multiple' | 'checkbox';
export type NeuralTreeCheckboxState = 'checked' | 'partial' | 'unchecked';
export type NeuralTreeFilterMode = 'lenient' | 'strict';

export interface NeuralTreeNode<T = unknown> {
  readonly key: NeuralTreeKey;
  readonly label: string;
  readonly data?: T;
  readonly iconClass?: string;
  readonly children?: readonly NeuralTreeNode<T>[];
  readonly leaf?: boolean;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly error?: string | boolean | null;
  readonly selectable?: boolean;
  readonly styleClass?: string;
  readonly ariaLabel?: string;
}

export interface NeuralTreeNodeTemplateContext<T = unknown> {
  readonly $implicit: NeuralTreeNode<T>;
  readonly item: NeuralTreeFlatNode<T>;
  readonly selected: boolean;
  readonly partial: boolean;
  readonly expanded: boolean;
  readonly level: number;
}

export interface NeuralTreeTogglerTemplateContext<T = unknown> {
  readonly $implicit: NeuralTreeNode<T>;
  readonly item: NeuralTreeFlatNode<T>;
  readonly expanded: boolean;
  readonly loading: boolean;
}

export interface NeuralTreeIconTemplateContext<T = unknown> {
  readonly $implicit: NeuralTreeNode<T>;
  readonly item: NeuralTreeFlatNode<T>;
  readonly iconClass: string | null;
}

export interface NeuralTreeStateTemplateContext {
  readonly $implicit: string;
  readonly label: string;
}

export interface NeuralTreeFlatNode<T = unknown> {
  readonly node: NeuralTreeNode<T>;
  readonly key: NeuralTreeKey;
  readonly level: number;
  readonly parentKey: NeuralTreeKey | null;
  readonly path: readonly NeuralTreeKey[];
  readonly index: number;
  readonly posInSet: number;
  readonly setSize: number;
  readonly expanded: boolean;
  readonly leaf: boolean;
}

export interface NeuralTreeIndexEntry<T = unknown> {
  readonly node: NeuralTreeNode<T>;
  readonly key: NeuralTreeKey;
  readonly parentKey: NeuralTreeKey | null;
  readonly childKeys: readonly NeuralTreeKey[];
  readonly path: readonly NeuralTreeKey[];
  readonly level: number;
}

export type NeuralTreeTrackBy<T = unknown> = (
  node: NeuralTreeNode<T>,
  index: number,
) => unknown;

export interface NeuralTreeNodeEvent<T = unknown> {
  readonly node: NeuralTreeNode<T>;
  readonly key: NeuralTreeKey;
  readonly level: number;
  readonly expanded: boolean;
  readonly nativeEvent?: Event;
}

export interface NeuralTreeLazyLoadEvent<T = unknown>
  extends NeuralTreeNodeEvent<T> {
  readonly path: readonly NeuralTreeKey[];
}

export type NeuralTreeSelectable<T = unknown> = (
  node: NeuralTreeNode<T>,
) => boolean;

export interface NeuralTreeSelectionEvent<T = unknown> {
  readonly node: NeuralTreeNode<T>;
  readonly key: NeuralTreeKey;
  readonly selected: boolean;
  readonly selectionKeys: ReadonlySet<NeuralTreeKey>;
  readonly nativeEvent: MouseEvent | KeyboardEvent;
}

export interface NeuralTreeClasses {
  readonly root?: string;
  readonly list?: string;
  readonly group?: string;
  readonly node?: string;
  readonly nodeContent?: string;
  readonly selectedNode?: string;
  readonly partialNode?: string;
  readonly matchedNode?: string;
  readonly toggler?: string;
  readonly togglerIcon?: string;
  readonly nodeIcon?: string;
  readonly label?: string;
  readonly checkbox?: string;
  readonly checkboxIcon?: string;
  readonly loading?: string;
  readonly empty?: string;
  readonly error?: string;
  readonly errorMessage?: string;
  readonly retry?: string;
}

export interface NeuralTreeFilterOptions<T = unknown> {
  readonly fields?: readonly string[];
  readonly mode?: NeuralTreeFilterMode;
  readonly locale?: string;
  readonly predicate?: (
    node: NeuralTreeNode<T>,
    normalizedQuery: string,
  ) => boolean;
}

export interface NeuralTreeFilterResult<T = unknown> {
  readonly nodes: readonly NeuralTreeNode<T>[];
  readonly expandedKeys: ReadonlySet<NeuralTreeKey>;
  readonly matchedKeys: ReadonlySet<NeuralTreeKey>;
}

export interface NeuralTreeState {
  readonly expandedKeys: ReadonlySet<NeuralTreeKey>;
  readonly selectionKeys: ReadonlySet<NeuralTreeKey>;
  readonly filterValue: string;
}

export interface NeuralResolvedTreeState<T = unknown> {
  readonly nodes: readonly NeuralTreeNode<T>[];
  readonly index: ReadonlyMap<NeuralTreeKey, NeuralTreeIndexEntry<T>>;
  readonly visibleNodes: readonly NeuralTreeFlatNode<T>[];
  readonly expandedKeys: ReadonlySet<NeuralTreeKey>;
  readonly selectionKeys: ReadonlySet<NeuralTreeKey>;
  readonly filterValue: string;
  readonly matchedKeys: ReadonlySet<NeuralTreeKey>;
}

export interface NeuralTreeOptionMapping {
  readonly optionLabel?: string;
  readonly optionKey?: string;
  readonly optionValue?: string;
  readonly optionChildren?: string;
  readonly optionDisabled?: string;
  readonly optionIcon?: string;
}
