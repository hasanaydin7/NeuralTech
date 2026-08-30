import { Directive, TemplateRef, inject } from '@angular/core';
import type { NeuralEditorController } from './editor.types';

export interface NeuralEditorToolbarTemplateContext {
  readonly $implicit: NeuralEditorController;
  readonly editor: NeuralEditorController;
}

@Directive({
  selector: 'ng-template[neuralEditorToolbar]',
  standalone: true,
})
export class EditorToolbarTemplateDirective {
  readonly template = inject(TemplateRef<NeuralEditorToolbarTemplateContext>);

  static ngTemplateContextGuard(
    _directive: EditorToolbarTemplateDirective,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Angular uses this parameter in the template context type predicate.
    _context: unknown,
  ): _context is NeuralEditorToolbarTemplateContext {
    return true;
  }
}
