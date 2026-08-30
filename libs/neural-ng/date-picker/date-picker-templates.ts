import { Directive, TemplateRef, inject } from '@angular/core';
import type {
  NeuralCalendarDay,
  NeuralDateParts,
  NeuralDatePickerFooterAction,
} from './date-picker.types';

export interface NeuralDatePickerDayTemplateContext {
  readonly $implicit: NeuralCalendarDay;
  readonly day: NeuralCalendarDay;
  readonly selected: boolean;
  readonly active: boolean;
  readonly disabled: boolean;
  readonly rangeStart: boolean;
  readonly rangeMiddle: boolean;
  readonly rangeEnd: boolean;
  readonly rangePreview: boolean;
  readonly ariaLabel: string;
}

export interface NeuralDatePickerHeaderTemplateContext {
  readonly $implicit: NeuralDateParts;
  readonly viewDate: NeuralDateParts;
  readonly view: 'days' | 'months' | 'years';
  readonly title: string;
  readonly previousDisabled: boolean;
  readonly nextDisabled: boolean;
  readonly navigate: (amount: -1 | 1) => void;
  readonly showDays: () => void;
  readonly showMonths: () => void;
  readonly showYears: () => void;
}

export interface NeuralDatePickerFooterTemplateContext {
  readonly $implicit: readonly NeuralDatePickerFooterAction[];
  readonly actions: readonly NeuralDatePickerFooterAction[];
  readonly canApply: boolean;
  readonly todayDisabled: boolean;
  readonly selectToday: () => void;
  readonly clear: () => void;
  readonly apply: () => void;
  readonly cancel: () => void;
}

export interface NeuralDatePickerIconTemplateContext {
  readonly $implicit: string;
  readonly className: string;
  readonly direction?: 'previous' | 'next';
}

@Directive({ selector: 'ng-template[neuralDatePickerDay]', standalone: true })
export class NeuralDatePickerDayTemplate {
  readonly templateRef = inject(
    TemplateRef<NeuralDatePickerDayTemplateContext>,
  );

  static ngTemplateContextGuard(
    _directive: NeuralDatePickerDayTemplate,
    _context: unknown,
  ): _context is NeuralDatePickerDayTemplateContext {
    return true;
  }
}

@Directive({
  selector: 'ng-template[neuralDatePickerHeader]',
  standalone: true,
})
export class NeuralDatePickerHeaderTemplate {
  readonly templateRef = inject(
    TemplateRef<NeuralDatePickerHeaderTemplateContext>,
  );

  static ngTemplateContextGuard(
    _directive: NeuralDatePickerHeaderTemplate,
    _context: unknown,
  ): _context is NeuralDatePickerHeaderTemplateContext {
    return true;
  }
}

@Directive({
  selector: 'ng-template[neuralDatePickerFooter]',
  standalone: true,
})
export class NeuralDatePickerFooterTemplate {
  readonly templateRef = inject(
    TemplateRef<NeuralDatePickerFooterTemplateContext>,
  );

  static ngTemplateContextGuard(
    _directive: NeuralDatePickerFooterTemplate,
    _context: unknown,
  ): _context is NeuralDatePickerFooterTemplateContext {
    return true;
  }
}

@Directive({
  selector: 'ng-template[neuralDatePickerTriggerIcon]',
  standalone: true,
})
export class NeuralDatePickerTriggerIconTemplate {
  readonly templateRef = inject(
    TemplateRef<NeuralDatePickerIconTemplateContext>,
  );

  static ngTemplateContextGuard(
    _directive: NeuralDatePickerTriggerIconTemplate,
    _context: unknown,
  ): _context is NeuralDatePickerIconTemplateContext {
    return true;
  }
}

@Directive({
  selector: 'ng-template[neuralDatePickerPreviousIcon]',
  standalone: true,
})
export class NeuralDatePickerPreviousIconTemplate {
  readonly templateRef = inject(
    TemplateRef<NeuralDatePickerIconTemplateContext>,
  );

  static ngTemplateContextGuard(
    _directive: NeuralDatePickerPreviousIconTemplate,
    _context: unknown,
  ): _context is NeuralDatePickerIconTemplateContext {
    return true;
  }
}

@Directive({
  selector: 'ng-template[neuralDatePickerNextIcon]',
  standalone: true,
})
export class NeuralDatePickerNextIconTemplate {
  readonly templateRef = inject(
    TemplateRef<NeuralDatePickerIconTemplateContext>,
  );

  static ngTemplateContextGuard(
    _directive: NeuralDatePickerNextIconTemplate,
    _context: unknown,
  ): _context is NeuralDatePickerIconTemplateContext {
    return true;
  }
}
