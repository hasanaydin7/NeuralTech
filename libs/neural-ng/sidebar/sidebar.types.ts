export type NeuralSidebarSide = 'start' | 'end';
export type NeuralSidebarVariant = 'sidebar' | 'floating' | 'inset';
export type NeuralSidebarCollapseMode = 'none' | 'icon' | 'offcanvas';
export type NeuralSidebarIconMenu = 'flyout' | 'hidden';
export interface NeuralSidebarClasses {
  readonly root?: string;
  readonly backdrop?: string;
  readonly panel?: string;
  readonly header?: string;
  readonly content?: string;
  readonly footer?: string;
}
export interface NeuralSidebarStateChange {
  readonly open: boolean;
  readonly mobile: boolean;
  readonly mode: NeuralSidebarCollapseMode;
  readonly reason:
    | 'api'
    | 'trigger'
    | 'backdrop'
    | 'escape'
    | 'responsive'
    | 'navigation';
  readonly nativeEvent?: Event;
}
export interface NeuralSidebarHoverChange {
  readonly expanded: boolean;
  readonly nativeEvent?: PointerEvent | FocusEvent;
}
