import type { Params, QueryParamsHandling, UrlTree } from '@angular/router';

export type NeuralPanelMenuInteractionSource = 'keyboard' | 'pointer';
export type NeuralPanelMenuRouterLink = string | readonly unknown[] | UrlTree;

export interface NeuralPanelMenuAction {
  readonly key: string;
  readonly label: string;
  readonly iconClass?: string;
  readonly badge?: string | number;
  readonly shortcut?: string;
  readonly disabled?: boolean;
  readonly href?: string;
  readonly routerLink?: NeuralPanelMenuRouterLink;
  readonly queryParams?: Params | null;
  readonly fragment?: string;
  readonly queryParamsHandling?: QueryParamsHandling | null;
  readonly preserveFragment?: boolean;
  readonly skipLocationChange?: boolean;
  readonly replaceUrl?: boolean;
  readonly state?: Record<string, unknown>;
  readonly target?: string;
  readonly rel?: string;
  readonly itemClass?: string;
  readonly items?: readonly NeuralPanelMenuEntry[];
}

export interface NeuralPanelMenuSeparatorEntry {
  readonly separator: true;
  readonly key?: string;
}

export type NeuralPanelMenuEntry =
  | NeuralPanelMenuAction
  | NeuralPanelMenuSeparatorEntry;

export interface NeuralPanelMenuSelect {
  readonly key: string;
  readonly item: NeuralPanelMenuAction;
  readonly originalEvent: MouseEvent | KeyboardEvent;
  readonly source: NeuralPanelMenuInteractionSource;
}

export interface NeuralPanelMenuToggle {
  readonly key: string;
  readonly expanded: boolean;
  readonly expandedKeys: readonly string[];
  readonly previousExpandedKeys: readonly string[];
  readonly item: NeuralPanelMenuAction;
  readonly source: NeuralPanelMenuInteractionSource;
}

export interface NeuralPanelMenuClasses {
  readonly root?: string;
  readonly list?: string;
  readonly itemContainer?: string;
  readonly item?: string;
  readonly expandedItem?: string;
  readonly disabledItem?: string;
  readonly icon?: string;
  readonly label?: string;
  readonly meta?: string;
  readonly badge?: string;
  readonly shortcut?: string;
  readonly indicator?: string;
  readonly group?: string;
  readonly groupInner?: string;
  readonly separator?: string;
}
