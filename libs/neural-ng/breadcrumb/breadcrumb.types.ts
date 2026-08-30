import type { Params, QueryParamsHandling, UrlTree } from '@angular/router';

export type NeuralBreadcrumbRouterLink = string | readonly unknown[] | UrlTree;

export interface NeuralBreadcrumbItem {
  readonly key: string;
  readonly label: string;
  readonly iconClass?: string;
  readonly href?: string;
  readonly routerLink?: NeuralBreadcrumbRouterLink;
  readonly queryParams?: Params | null;
  readonly fragment?: string;
  readonly queryParamsHandling?: QueryParamsHandling | null;
  readonly preserveFragment?: boolean;
  readonly skipLocationChange?: boolean;
  readonly replaceUrl?: boolean;
  readonly state?: Record<string, unknown>;
  readonly target?: string;
  readonly rel?: string;
  readonly disabled?: boolean;
  readonly current?: boolean;
  readonly itemClass?: string;
}

export interface NeuralBreadcrumbSelect {
  readonly key: string;
  readonly item: NeuralBreadcrumbItem;
  readonly originalEvent: Event;
}

export interface NeuralBreadcrumbClasses {
  readonly root?: string;
  readonly list?: string;
  readonly item?: string;
  readonly link?: string;
  readonly current?: string;
  readonly disabled?: string;
  readonly icon?: string;
  readonly label?: string;
  readonly separator?: string;
  readonly overflowItem?: string;
  readonly overflowTrigger?: string;
}
