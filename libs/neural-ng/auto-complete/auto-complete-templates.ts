import { Directive, TemplateRef, inject } from '@angular/core';
import type { NeuralResolvedAutoCompleteOption } from './auto-complete.types';

export interface NeuralAutoCompleteOptionTemplateContext<
  TValue = unknown,
  TOption = unknown,
> {
  readonly $implicit: TOption;
  readonly option: TOption;
  readonly resolved: NeuralResolvedAutoCompleteOption<TValue, TOption>;
  readonly label: string;
  readonly value: TValue;
  readonly index: number;
  readonly active: boolean;
  readonly selected: boolean;
  readonly disabled: boolean;
}

export interface NeuralAutoCompleteGroupTemplateContext {
  readonly $implicit: string;
  readonly group: string;
}

export interface NeuralAutoCompleteIconTemplateContext {
  readonly $implicit: string;
  readonly className: string;
}

@Directive({
  selector: 'ng-template[neuralAutoCompleteOption]',
  standalone: true,
})
export class NeuralAutoCompleteOptionTemplate {
  readonly templateRef = inject(
    TemplateRef<NeuralAutoCompleteOptionTemplateContext>,
  );
  static ngTemplateContextGuard(
    _directive: NeuralAutoCompleteOptionTemplate,
    _context: unknown,
  ): _context is NeuralAutoCompleteOptionTemplateContext {
    void _context;
    return true;
  }
}

@Directive({
  selector: 'ng-template[neuralAutoCompleteGroup]',
  standalone: true,
})
export class NeuralAutoCompleteGroupTemplate {
  readonly templateRef = inject(
    TemplateRef<NeuralAutoCompleteGroupTemplateContext>,
  );
  static ngTemplateContextGuard(
    _directive: NeuralAutoCompleteGroupTemplate,
    _context: unknown,
  ): _context is NeuralAutoCompleteGroupTemplateContext {
    void _context;
    return true;
  }
}

@Directive({
  selector: 'ng-template[neuralAutoCompleteEmpty]',
  standalone: true,
})
export class NeuralAutoCompleteEmptyTemplate {
  readonly templateRef = inject(TemplateRef<{ readonly $implicit: string }>);
  static ngTemplateContextGuard(
    _directive: NeuralAutoCompleteEmptyTemplate,
    _context: unknown,
  ): _context is { readonly $implicit: string } {
    void _context;
    return true;
  }
}

@Directive({
  selector: 'ng-template[neuralAutoCompleteLoading]',
  standalone: true,
})
export class NeuralAutoCompleteLoadingTemplate {
  readonly templateRef = inject(TemplateRef<{ readonly $implicit: string }>);
  static ngTemplateContextGuard(
    _directive: NeuralAutoCompleteLoadingTemplate,
    _context: unknown,
  ): _context is { readonly $implicit: string } {
    void _context;
    return true;
  }
}

@Directive({
  selector: 'ng-template[neuralAutoCompleteDropdownIcon]',
  standalone: true,
})
export class NeuralAutoCompleteDropdownIconTemplate {
  readonly templateRef = inject(
    TemplateRef<NeuralAutoCompleteIconTemplateContext>,
  );
}

@Directive({
  selector: 'ng-template[neuralAutoCompleteClearIcon]',
  standalone: true,
})
export class NeuralAutoCompleteClearIconTemplate {
  readonly templateRef = inject(
    TemplateRef<NeuralAutoCompleteIconTemplateContext>,
  );
}
