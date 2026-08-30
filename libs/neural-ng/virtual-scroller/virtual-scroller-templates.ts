import { Directive, TemplateRef, inject, input } from '@angular/core';

export interface NeuralVirtualScrollerItemContext<T> {
  readonly $implicit: T;
  readonly item: T;
  readonly index: number;
  readonly first: boolean;
  readonly last: boolean;
  readonly even: boolean;
  readonly odd: boolean;
}

export interface NeuralVirtualScrollerStateContext {
  readonly $implicit: string;
  readonly label: string;
}

@Directive({
  selector: 'ng-template[neuralVirtualScrollerItem]',
  standalone: true,
})
export class NeuralVirtualScrollerItemTemplate<T = unknown> {
  readonly neuralVirtualScrollerItem = input.required<readonly T[]>();
  readonly templateRef =
    inject<TemplateRef<NeuralVirtualScrollerItemContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    directive: NeuralVirtualScrollerItemTemplate<T>,
    context: unknown,
  ): context is NeuralVirtualScrollerItemContext<T> {
    void directive;
    void context;
    return true;
  }
}

@Directive({
  selector: 'ng-template[neuralVirtualScrollerEmpty]',
  standalone: true,
})
export class NeuralVirtualScrollerEmptyTemplate {
  readonly templateRef =
    inject<TemplateRef<NeuralVirtualScrollerStateContext>>(TemplateRef);
}

@Directive({
  selector: 'ng-template[neuralVirtualScrollerLoading]',
  standalone: true,
})
export class NeuralVirtualScrollerLoadingTemplate {
  readonly templateRef =
    inject<TemplateRef<NeuralVirtualScrollerStateContext>>(TemplateRef);
}
