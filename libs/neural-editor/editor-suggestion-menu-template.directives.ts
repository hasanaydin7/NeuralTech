import { Directive, TemplateRef, inject, type Signal } from '@angular/core';
import type {
  NeuralEditorCommandPaletteItem,
  NeuralEditorController,
  NeuralEditorMentionItem,
  NeuralEditorSlashCommand,
} from './editor.types';

export interface NeuralEditorSuggestionMenuTemplateContext<T> {
  readonly $implicit: NeuralEditorController;
  readonly editor: NeuralEditorController;
  readonly query: Signal<string>;
  readonly items: Signal<readonly T[]>;
  readonly activeIndex: Signal<number>;
  readonly loading: Signal<boolean>;
  readonly select: (index: number) => void;
  readonly setActiveIndex: (index: number) => void;
  readonly optionId: (index: number) => string;
  readonly close: () => void;
}

export interface NeuralEditorCommandPaletteTemplateContext
  extends NeuralEditorSuggestionMenuTemplateContext<NeuralEditorCommandPaletteItem> {
  readonly setQuery: (query: string) => void;
}

@Directive({
  selector: 'ng-template[neuralEditorSlashMenu]',
  standalone: true,
})
export class EditorSlashMenuTemplateDirective {
  readonly template = inject(
    TemplateRef<
      NeuralEditorSuggestionMenuTemplateContext<NeuralEditorSlashCommand>
    >,
  );

  static ngTemplateContextGuard(
    _directive: EditorSlashMenuTemplateDirective,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Angular uses this parameter in the template context type predicate.
    _context: unknown,
  ): _context is NeuralEditorSuggestionMenuTemplateContext<NeuralEditorSlashCommand> {
    return true;
  }
}

@Directive({
  selector: 'ng-template[neuralEditorMentionMenu]',
  standalone: true,
})
export class EditorMentionMenuTemplateDirective {
  readonly template = inject(
    TemplateRef<
      NeuralEditorSuggestionMenuTemplateContext<NeuralEditorMentionItem>
    >,
  );

  static ngTemplateContextGuard(
    _directive: EditorMentionMenuTemplateDirective,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Angular uses this parameter in the template context type predicate.
    _context: unknown,
  ): _context is NeuralEditorSuggestionMenuTemplateContext<NeuralEditorMentionItem> {
    return true;
  }
}

@Directive({
  selector: 'ng-template[neuralEditorCommandPalette]',
  standalone: true,
})
export class EditorCommandPaletteTemplateDirective {
  readonly template = inject(
    TemplateRef<NeuralEditorCommandPaletteTemplateContext>,
  );

  static ngTemplateContextGuard(
    _directive: EditorCommandPaletteTemplateDirective,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Angular uses this parameter in the template context type predicate.
    _context: unknown,
  ): _context is NeuralEditorCommandPaletteTemplateContext {
    return true;
  }
}
