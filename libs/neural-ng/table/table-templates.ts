import { Directive, TemplateRef, inject, input } from '@angular/core';
import type {
  NeuralTableCellContext,
  NeuralTableEditorContext,
  NeuralTableFilterContext,
  NeuralTableFooterContext,
  NeuralTableFooterGroupContext,
  NeuralTableHeaderContext,
  NeuralTableHeaderGroupContext,
  NeuralTableRowContext,
  NeuralTableRowGroupContext,
  NeuralTableStateContext,
} from './table.types';

@Directive({ selector: 'ng-template[neuralTableGroupHeader]' })
export class NeuralTableGroupHeaderDirective<T = unknown> {
  readonly templateRef = inject(TemplateRef<NeuralTableRowGroupContext<T>>);

  static ngTemplateContextGuard<T>(
    _directive: NeuralTableGroupHeaderDirective<T>,
    context: unknown,
  ): context is NeuralTableRowGroupContext<T> {
    void context;
    return true;
  }
}

@Directive({ selector: 'ng-template[neuralTableGroupFooter]' })
export class NeuralTableGroupFooterDirective<T = unknown> {
  readonly templateRef = inject(TemplateRef<NeuralTableRowGroupContext<T>>);

  static ngTemplateContextGuard<T>(
    _directive: NeuralTableGroupFooterDirective<T>,
    context: unknown,
  ): context is NeuralTableRowGroupContext<T> {
    void context;
    return true;
  }
}

@Directive({ selector: 'ng-template[neuralTableEditor]' })
export class NeuralTableEditorDirective<T = unknown> {
  readonly column = input.required<string>({ alias: 'neuralTableEditor' });
  readonly templateRef = inject(TemplateRef<NeuralTableEditorContext<T>>);

  static ngTemplateContextGuard<T>(
    _directive: NeuralTableEditorDirective<T>,
    context: unknown,
  ): context is NeuralTableEditorContext<T> {
    void context;
    return true;
  }
}

@Directive({ selector: 'ng-template[neuralTableCell]' })
export class NeuralTableCellDirective<T = unknown> {
  readonly column = input.required<string>({ alias: 'neuralTableCell' });
  readonly templateRef = inject(TemplateRef<NeuralTableCellContext<T>>);

  static ngTemplateContextGuard<T>(
    _directive: NeuralTableCellDirective<T>,
    context: unknown,
  ): context is NeuralTableCellContext<T> {
    void context;
    return true;
  }
}

@Directive({ selector: 'ng-template[neuralTableHeader]' })
export class NeuralTableHeaderDirective<T = unknown> {
  readonly column = input.required<string>({ alias: 'neuralTableHeader' });
  readonly templateRef = inject(TemplateRef<NeuralTableHeaderContext<T>>);

  static ngTemplateContextGuard<T>(
    _directive: NeuralTableHeaderDirective<T>,
    context: unknown,
  ): context is NeuralTableHeaderContext<T> {
    void context;
    return true;
  }
}

@Directive({ selector: 'ng-template[neuralTableHeaderGroup]' })
export class NeuralTableHeaderGroupDirective {
  readonly group = input.required<string>({ alias: 'neuralTableHeaderGroup' });
  readonly templateRef = inject(TemplateRef<NeuralTableHeaderGroupContext>);

  static ngTemplateContextGuard(
    _directive: NeuralTableHeaderGroupDirective,
    context: unknown,
  ): context is NeuralTableHeaderGroupContext {
    void context;
    return true;
  }
}

@Directive({ selector: 'ng-template[neuralTableFooter]' })
export class NeuralTableFooterDirective<T = unknown> {
  readonly column = input.required<string>({ alias: 'neuralTableFooter' });
  readonly templateRef = inject(TemplateRef<NeuralTableFooterContext<T>>);

  static ngTemplateContextGuard<T>(
    _directive: NeuralTableFooterDirective<T>,
    context: unknown,
  ): context is NeuralTableFooterContext<T> {
    void context;
    return true;
  }
}

@Directive({ selector: 'ng-template[neuralTableFooterGroup]' })
export class NeuralTableFooterGroupDirective {
  readonly group = input.required<string>({ alias: 'neuralTableFooterGroup' });
  readonly templateRef = inject(TemplateRef<NeuralTableFooterGroupContext>);

  static ngTemplateContextGuard(
    _directive: NeuralTableFooterGroupDirective,
    context: unknown,
  ): context is NeuralTableFooterGroupContext {
    void context;
    return true;
  }
}

@Directive({ selector: 'ng-template[neuralTableFilter]' })
export class NeuralTableFilterDirective<T = unknown> {
  readonly column = input.required<string>({ alias: 'neuralTableFilter' });
  readonly templateRef = inject(TemplateRef<NeuralTableFilterContext<T>>);

  static ngTemplateContextGuard<T>(
    _directive: NeuralTableFilterDirective<T>,
    context: unknown,
  ): context is NeuralTableFilterContext<T> {
    void context;
    return true;
  }
}

@Directive({ selector: 'ng-template[neuralTableExpansion]' })
export class NeuralTableExpansionDirective<T = unknown> {
  readonly templateRef = inject(TemplateRef<NeuralTableRowContext<T>>);

  static ngTemplateContextGuard<T>(
    _directive: NeuralTableExpansionDirective<T>,
    context: unknown,
  ): context is NeuralTableRowContext<T> {
    void context;
    return true;
  }
}

@Directive({ selector: 'ng-template[neuralTableLoading]' })
export class NeuralTableLoadingDirective {
  readonly templateRef = inject(TemplateRef<NeuralTableStateContext>);
}

@Directive({ selector: 'ng-template[neuralTableEmpty]' })
export class NeuralTableEmptyDirective {
  readonly templateRef = inject(TemplateRef<NeuralTableStateContext>);
}

@Directive({ selector: 'ng-template[neuralTableError]' })
export class NeuralTableErrorDirective {
  readonly templateRef = inject(TemplateRef<NeuralTableStateContext>);
}
