import { Directive, TemplateRef, inject } from '@angular/core';
import type { NeuralToastTemplateContext } from './toast-template.types';

@Directive({
  selector: 'ng-template[neuralToastTemplate]',
  standalone: true,
})
export class NeuralToastTemplateDirective {
  readonly templateRef = inject(TemplateRef<NeuralToastTemplateContext>);

  static ngTemplateContextGuard(
    _directive: NeuralToastTemplateDirective,
    _context: unknown,
  ): _context is NeuralToastTemplateContext {
    void _context;
    return true;
  }
}
