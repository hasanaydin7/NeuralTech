import { Directive, TemplateRef, inject, type Signal } from '@angular/core';
import type { NeuralEditorController } from './editor.types';

export interface NeuralEditorMenuTemplateContext {
  readonly $implicit: NeuralEditorController;
  readonly editor: NeuralEditorController;
}

export interface NeuralEditorLinkPopoverTemplateContext
  extends NeuralEditorMenuTemplateContext {
  readonly href: Signal<string>;
  readonly setHref: (href: string) => void;
  readonly apply: () => void;
  readonly remove: () => void;
  readonly close: () => void;
}

@Directive({
  selector: 'ng-template[neuralEditorBubbleMenu]',
  standalone: true,
})
export class EditorBubbleMenuTemplateDirective {
  readonly template = inject(TemplateRef<NeuralEditorMenuTemplateContext>);

  static ngTemplateContextGuard(
    _directive: EditorBubbleMenuTemplateDirective,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Angular uses this parameter in the template context type predicate.
    _context: unknown,
  ): _context is NeuralEditorMenuTemplateContext {
    return true;
  }
}

@Directive({
  selector: 'ng-template[neuralEditorFloatingMenu]',
  standalone: true,
})
export class EditorFloatingMenuTemplateDirective {
  readonly template = inject(TemplateRef<NeuralEditorMenuTemplateContext>);

  static ngTemplateContextGuard(
    _directive: EditorFloatingMenuTemplateDirective,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Angular uses this parameter in the template context type predicate.
    _context: unknown,
  ): _context is NeuralEditorMenuTemplateContext {
    return true;
  }
}

@Directive({
  selector: 'ng-template[neuralEditorLinkPopover]',
  standalone: true,
})
export class EditorLinkPopoverTemplateDirective {
  readonly template = inject(
    TemplateRef<NeuralEditorLinkPopoverTemplateContext>,
  );

  static ngTemplateContextGuard(
    _directive: EditorLinkPopoverTemplateDirective,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Angular uses this parameter in the template context type predicate.
    _context: unknown,
  ): _context is NeuralEditorLinkPopoverTemplateContext {
    return true;
  }
}
