import { Directive, TemplateRef, inject, input } from '@angular/core';
import type { NeuralDataViewLayout } from './data-view.types';

export interface NeuralDataViewItemTemplateContext<T> {
  readonly $implicit: T;
  readonly item: T;
  readonly index: number;
  readonly originalIndex: number;
  readonly layout: NeuralDataViewLayout;
  readonly first: boolean;
  readonly last: boolean;
}

export interface NeuralDataViewStateTemplateContext {
  readonly $implicit: string;
  readonly label: string;
}

function templateGuard<T>(
  directive: unknown,
  context: unknown,
): context is NeuralDataViewItemTemplateContext<T> {
  void directive;
  void context;
  return true;
}

@Directive({
  selector: 'ng-template[neuralDataViewListItem]',
  standalone: true,
})
export class NeuralDataViewListItemTemplate<T = unknown> {
  readonly neuralDataViewListItem = input.required<readonly T[]>();
  readonly templateRef =
    inject<TemplateRef<NeuralDataViewItemTemplateContext<T>>>(TemplateRef);
  static ngTemplateContextGuard<T>(
    directive: NeuralDataViewListItemTemplate<T>,
    context: unknown,
  ): context is NeuralDataViewItemTemplateContext<T> {
    return templateGuard<T>(directive, context);
  }
}

@Directive({
  selector: 'ng-template[neuralDataViewGridItem]',
  standalone: true,
})
export class NeuralDataViewGridItemTemplate<T = unknown> {
  readonly neuralDataViewGridItem = input.required<readonly T[]>();
  readonly templateRef =
    inject<TemplateRef<NeuralDataViewItemTemplateContext<T>>>(TemplateRef);
  static ngTemplateContextGuard<T>(
    directive: NeuralDataViewGridItemTemplate<T>,
    context: unknown,
  ): context is NeuralDataViewItemTemplateContext<T> {
    return templateGuard<T>(directive, context);
  }
}

@Directive({ selector: 'ng-template[neuralDataViewHeader]', standalone: true })
export class NeuralDataViewHeaderTemplate {
  readonly templateRef = inject<TemplateRef<void>>(TemplateRef);
}

@Directive({ selector: 'ng-template[neuralDataViewFooter]', standalone: true })
export class NeuralDataViewFooterTemplate {
  readonly templateRef = inject<TemplateRef<void>>(TemplateRef);
}

@Directive({ selector: 'ng-template[neuralDataViewEmpty]', standalone: true })
export class NeuralDataViewEmptyTemplate {
  readonly templateRef =
    inject<TemplateRef<NeuralDataViewStateTemplateContext>>(TemplateRef);
}

@Directive({ selector: 'ng-template[neuralDataViewLoading]', standalone: true })
export class NeuralDataViewLoadingTemplate {
  readonly templateRef =
    inject<TemplateRef<NeuralDataViewStateTemplateContext>>(TemplateRef);
}
