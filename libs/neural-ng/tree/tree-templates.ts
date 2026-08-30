import { Directive, TemplateRef, inject, input } from '@angular/core';
import type {
  NeuralTreeIconTemplateContext,
  NeuralTreeNodeTemplateContext,
  NeuralTreeStateTemplateContext,
  NeuralTreeTogglerTemplateContext,
} from './tree.types';

@Directive({ selector: 'ng-template[neuralTreeNode]' })
export class NeuralTreeNodeTemplate<T = unknown> {
  readonly type = input<T | undefined>(undefined, { alias: 'neuralTreeNode' });
  readonly templateRef = inject(TemplateRef<NeuralTreeNodeTemplateContext<T>>);

  static ngTemplateContextGuard<T>(
    _directive: NeuralTreeNodeTemplate<T>,
    context: unknown,
  ): context is NeuralTreeNodeTemplateContext<T> {
    void context;
    return true;
  }
}

@Directive({ selector: 'ng-template[neuralTreeToggler]' })
export class NeuralTreeTogglerTemplate<T = unknown> {
  readonly type = input<T | undefined>(undefined, {
    alias: 'neuralTreeToggler',
  });
  readonly templateRef = inject(
    TemplateRef<NeuralTreeTogglerTemplateContext<T>>,
  );

  static ngTemplateContextGuard<T>(
    _directive: NeuralTreeTogglerTemplate<T>,
    context: unknown,
  ): context is NeuralTreeTogglerTemplateContext<T> {
    void context;
    return true;
  }
}

@Directive({ selector: 'ng-template[neuralTreeIcon]' })
export class NeuralTreeIconTemplate<T = unknown> {
  readonly type = input<T | undefined>(undefined, { alias: 'neuralTreeIcon' });
  readonly templateRef = inject(TemplateRef<NeuralTreeIconTemplateContext<T>>);

  static ngTemplateContextGuard<T>(
    _directive: NeuralTreeIconTemplate<T>,
    context: unknown,
  ): context is NeuralTreeIconTemplateContext<T> {
    void context;
    return true;
  }
}

@Directive({ selector: 'ng-template[neuralTreeEmpty]' })
export class NeuralTreeEmptyTemplate {
  readonly templateRef = inject(TemplateRef<NeuralTreeStateTemplateContext>);
}

@Directive({ selector: 'ng-template[neuralTreeLoading]' })
export class NeuralTreeLoadingTemplate {
  readonly templateRef = inject(TemplateRef<NeuralTreeStateTemplateContext>);
}
