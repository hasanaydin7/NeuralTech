import { Directive, TemplateRef, inject, type Signal } from '@angular/core';
import type {
  NeuralEditorAiReviewState,
  NeuralEditorController,
} from './editor.types';

export interface NeuralEditorAiReviewTemplateContext {
  readonly $implicit: Signal<NeuralEditorAiReviewState | null>;
  readonly review: Signal<NeuralEditorAiReviewState | null>;
  readonly controller: NeuralEditorController;
  readonly previous: () => void;
  readonly next: () => void;
  readonly accept: () => void;
  readonly reject: () => void;
}

@Directive({
  selector: 'ng-template[neuralEditorAiReview]',
  standalone: true,
})
export class EditorAiReviewTemplateDirective {
  readonly template = inject(TemplateRef<NeuralEditorAiReviewTemplateContext>);

  static ngTemplateContextGuard(
    _directive: EditorAiReviewTemplateDirective,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Angular uses this parameter in the template context type predicate.
    _context: unknown,
  ): _context is NeuralEditorAiReviewTemplateContext {
    return true;
  }
}
