import { Directive, TemplateRef, inject } from '@angular/core';
import type { NeuralTreeNodeTemplateContext } from '@neural-ng/core/tree';

export type NeuralTreeSelectValueContext<TValue> =
  | TValue
  | readonly TValue[]
  | null;
export interface NeuralTreeSelectValueTemplateContext<TValue = unknown> {
  readonly $implicit: NeuralTreeSelectValueContext<TValue>;
  readonly value: NeuralTreeSelectValueContext<TValue>;
  readonly labels: readonly string[];
}

@Directive({ selector: 'ng-template[neuralTreeSelectNode]', standalone: true })
export class NeuralTreeSelectNodeTemplate<TOption = unknown> {
  readonly templateRef =
    inject<TemplateRef<NeuralTreeNodeTemplateContext<TOption>>>(TemplateRef);
  static ngTemplateContextGuard<TOption>(
    _directive: NeuralTreeSelectNodeTemplate<TOption>,
    context: unknown,
  ): context is NeuralTreeNodeTemplateContext<TOption> {
    void _directive;
    void context;
    return true;
  }
}

@Directive({ selector: 'ng-template[neuralTreeSelectValue]', standalone: true })
export class NeuralTreeSelectValueTemplate<TValue = unknown> {
  readonly templateRef =
    inject<TemplateRef<NeuralTreeSelectValueTemplateContext<TValue>>>(
      TemplateRef,
    );
  static ngTemplateContextGuard<TValue>(
    _directive: NeuralTreeSelectValueTemplate<TValue>,
    context: unknown,
  ): context is NeuralTreeSelectValueTemplateContext<TValue> {
    void _directive;
    void context;
    return true;
  }
}
