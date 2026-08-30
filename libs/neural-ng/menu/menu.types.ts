import type { NeuralOverlayPlacement } from '@neural-ng/core/overlay';
import type { Params, QueryParamsHandling, UrlTree } from '@angular/router';

export type NeuralMenuPosition = NeuralOverlayPlacement;
export type NeuralMenuInteractionSource = 'keyboard' | 'pointer' | 'api';
export type NeuralMenuRouterLink = string | readonly unknown[] | UrlTree;

export interface NeuralMenuAction {
  readonly key: string;
  readonly label: string;
  readonly iconClass?: string;
  readonly badge?: string | number;
  readonly shortcut?: string;
  readonly disabled?: boolean;
  readonly href?: string;
  readonly routerLink?: NeuralMenuRouterLink;
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
}

export interface NeuralMenuSeparator {
  readonly separator: true;
  readonly key?: string;
  readonly separatorClass?: string;
}

export type NeuralMenuGroupItem = NeuralMenuAction | NeuralMenuSeparator;

export interface NeuralMenuGroupEntry {
  readonly key: string;
  readonly label: string;
  readonly items: readonly NeuralMenuGroupItem[];
  readonly groupClass?: string;
  readonly labelClass?: string;
  readonly listClass?: string;
}

export type NeuralMenuEntry =
  | NeuralMenuAction
  | NeuralMenuSeparator
  | NeuralMenuGroupEntry;

export interface NeuralMenuSelect {
  readonly key: string;
  readonly item: NeuralMenuAction;
  readonly source: NeuralMenuInteractionSource;
  readonly originalEvent: Event;
}

export interface NeuralMenuClasses {
  readonly root?: string;
  readonly list?: string;
  readonly group?: string;
  readonly groupLabel?: string;
  readonly groupList?: string;
  readonly item?: string;
  readonly disabledItem?: string;
  readonly icon?: string;
  readonly label?: string;
  readonly meta?: string;
  readonly badge?: string;
  readonly shortcut?: string;
  readonly separator?: string;
}
