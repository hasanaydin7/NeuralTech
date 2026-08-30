import { Directive, TemplateRef, inject } from '@angular/core';
import type { NeuralResolvedMultiSelectOption } from './multi-select.types';

export interface NeuralMultiSelectOptionTemplateContext<
  TValue = unknown,
  TOption = unknown,
> {
  readonly $implicit: TOption;
  readonly option: TOption;
  readonly resolved: NeuralResolvedMultiSelectOption<TValue, TOption>;
  readonly label: string;
  readonly value: TValue;
  readonly index: number;
  readonly active: boolean;
  readonly selected: boolean;
  readonly disabled: boolean;
}

export interface NeuralMultiSelectValueTemplateContext<TValue = unknown> {
  readonly $implicit: readonly TValue[];
  readonly value: readonly TValue[];
  readonly labels: readonly string[];
}

export interface NeuralMultiSelectGroupTemplateContext {
  readonly $implicit: string;
  readonly group: string;
}

@Directive({
  selector: 'ng-template[neuralMultiSelectOption]',
  standalone: true,
})
export class NeuralMultiSelectOptionTemplate {
  readonly templateRef = inject(
    TemplateRef<NeuralMultiSelectOptionTemplateContext>,
  );
  static ngTemplateContextGuard(
    _directive: NeuralMultiSelectOptionTemplate,
    _context: unknown,
  ): _context is NeuralMultiSelectOptionTemplateContext {
    void _context;
    return true;
  }
}

@Directive({
  selector: 'ng-template[neuralMultiSelectValue]',
  standalone: true,
})
export class NeuralMultiSelectValueTemplate {
  readonly templateRef = inject(
    TemplateRef<NeuralMultiSelectValueTemplateContext>,
  );
  static ngTemplateContextGuard(
    _directive: NeuralMultiSelectValueTemplate,
    _context: unknown,
  ): _context is NeuralMultiSelectValueTemplateContext {
    void _context;
    return true;
  }
}

@Directive({
  selector: 'ng-template[neuralMultiSelectGroup]',
  standalone: true,
})
export class NeuralMultiSelectGroupTemplate {
  readonly templateRef = inject(
    TemplateRef<NeuralMultiSelectGroupTemplateContext>,
  );
}

@Directive({
  selector: 'ng-template[neuralMultiSelectHeader]',
  standalone: true,
})
export class NeuralMultiSelectHeaderTemplate {
  readonly templateRef = inject(TemplateRef<unknown>);
}

@Directive({
  selector: 'ng-template[neuralMultiSelectFooter]',
  standalone: true,
})
export class NeuralMultiSelectFooterTemplate {
  readonly templateRef = inject(TemplateRef<unknown>);
}

@Directive({
  selector: 'ng-template[neuralMultiSelectEmpty]',
  standalone: true,
})
export class NeuralMultiSelectEmptyTemplate {
  readonly templateRef = inject(TemplateRef<{ readonly $implicit: string }>);
}

@Directive({
  selector: 'ng-template[neuralMultiSelectLoading]',
  standalone: true,
})
export class NeuralMultiSelectLoadingTemplate {
  readonly templateRef = inject(TemplateRef<{ readonly $implicit: string }>);
}
