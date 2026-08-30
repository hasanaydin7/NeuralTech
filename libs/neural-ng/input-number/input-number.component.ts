import {
  APP_ID,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injectable,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import {
  NEURAL_FIELD_CONTEXT,
  NEURAL_NG_CONFIG,
  NeuralLocaleService,
} from '@neural-ng/core';
import type {
  NeuralInputNumberClasses,
  NeuralInputNumberCommit,
  NeuralInputNumberMode,
} from './input-number.types';
import {
  clampNumber,
  createNumberParser,
  normalizeFinite,
  normalizeStep,
  stepNumber,
} from './input-number.utils';

@Injectable({ providedIn: 'root' })
class NeuralInputNumberIdGenerator {
  private readonly appId = inject(APP_ID);
  private nextId = 0;

  next(): string {
    return `${this.appId}-neural-input-number-${this.nextId++}`;
  }
}

@Component({
  selector: 'neural-input-number',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neural-input-number-host',
    '[class.neural-input-number-host-fluid]': 'effectiveFluid()',
  },
  template: `
    <div
      [class]="rootClass()"
      [attr.data-disabled]="effectiveDisabled() ? 'true' : null"
      [attr.data-invalid]="effectiveInvalid() ? 'true' : null"
      [attr.data-readonly]="effectiveReadonly() ? 'true' : null"
      [attr.data-required]="effectiveRequired() ? 'true' : null"
      [attr.data-pending]="effectivePending() ? 'true' : null"
      [attr.data-touched]="touched() ? 'true' : null"
      [attr.data-dirty]="dirty() ? 'true' : null"
    >
      @if (showButtons()) {
        <button
          type="button"
          tabindex="-1"
          [class]="decrementButtonClass()"
          [disabled]="decrementDisabled()"
          [attr.aria-label]="decrementLabel()"
          [attr.aria-controls]="controlId()"
          (click)="stepBy(-1, 'button')"
        >
          @if (decrementIconClass()) {
            <i [class]="decrementIconClassName()" aria-hidden="true"></i>
          } @else {
            <span [class]="buttonIconClass()" aria-hidden="true">−</span>
          }
        </button>
      }

      <input
        #nativeInput
        type="text"
        role="spinbutton"
        [inputMode]="inputMode()"
        [autocomplete]="autocomplete()"
        [id]="controlId()"
        [name]="name()"
        [class]="inputClassName()"
        [value]="draft()"
        [placeholder]="placeholder()"
        [disabled]="effectiveDisabled()"
        [readOnly]="effectiveReadonly()"
        [required]="effectiveRequired()"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-describedby]="field?.controlDescribedBy()"
        [attr.aria-invalid]="effectiveInvalid() ? 'true' : null"
        [attr.aria-required]="effectiveRequired() ? 'true' : null"
        [attr.aria-busy]="effectivePending() ? 'true' : null"
        [attr.aria-valuemin]="effectiveMin()"
        [attr.aria-valuemax]="effectiveMax()"
        [attr.aria-valuenow]="value()"
        [attr.aria-valuetext]="formattedValue() || null"
        (input)="handleInput($event)"
        (focus)="handleFocus()"
        (blur)="commit('blur')"
        (keydown)="handleKeydown($event)"
      />

      @if (showButtons()) {
        <button
          type="button"
          tabindex="-1"
          [class]="incrementButtonClass()"
          [disabled]="incrementDisabled()"
          [attr.aria-label]="incrementLabel()"
          [attr.aria-controls]="controlId()"
          (click)="stepBy(1, 'button')"
        >
          @if (incrementIconClass()) {
            <i [class]="incrementIconClassName()" aria-hidden="true"></i>
          } @else {
            <span [class]="buttonIconClass()" aria-hidden="true">+</span>
          }
        </button>
      }
    </div>
  `,
  styles: `
    :where(.neural-input-number-host) {
      display: inline-block;
      min-width: 0;
      max-width: 100%;
    }

    :where(.neural-input-number-host-fluid) {
      display: block;
      width: 100%;
    }

    :where(.neural-input-number-root) {
      box-sizing: border-box;
      min-width: 0;
      max-width: 100%;
    }

    :where(.neural-input-number-base) {
      display: inline-flex;
      width: var(--neural-input-number-width, auto);
      overflow: hidden;
      color: var(--neural-input-number-color, inherit);
      background: var(--neural-input-number-background, transparent);
      border: var(--neural-input-number-border, 1px solid currentColor);
      border-radius: var(--neural-input-number-radius, 0.5rem);
      box-shadow: var(--neural-input-number-shadow, none);
    }

    :where(.neural-input-number-fluid-base) {
      width: 100%;
    }

    :where(.neural-input-number-input-root) {
      box-sizing: border-box;
      min-width: 0;
      max-width: 100%;
    }

    :where(.neural-input-number-input-base) {
      flex: 1 1 auto;
      width: var(--neural-input-number-input-width, 8rem);
      min-height: var(--neural-input-number-min-height, 2.5rem);
      padding: var(--neural-input-number-padding, 0.625rem 0.75rem);
      color: inherit;
      background: transparent;
      border: 0;
      outline: 0;
      font: inherit;
      text-align: var(--neural-input-number-text-align, start);
    }

    :where(.neural-input-number-button-root) {
      box-sizing: border-box;
      flex: 0 0 auto;
    }

    :where(.neural-input-number-button-base) {
      display: inline-grid;
      place-items: center;
      min-width: var(--neural-input-number-button-size, 2.5rem);
      padding: 0;
      color: inherit;
      background: var(--neural-input-number-button-background, transparent);
      border: 0;
      font: inherit;
      cursor: pointer;
    }

    :where(.neural-input-number-button-base:hover:not(:disabled)) {
      background: var(
        --neural-input-number-button-background-hover,
        transparent
      );
    }

    :where(.neural-input-number-base:focus-within) {
      border-color: var(--neural-input-number-border-color-focus, currentColor);
      box-shadow: var(--neural-input-number-shadow-focus, none);
      outline: var(--neural-input-number-focus-ring, 2px solid currentColor);
      outline-offset: var(--neural-input-number-focus-ring-offset, 2px);
    }

    :where(.neural-input-number-base[data-invalid='true']) {
      border-color: var(
        --neural-input-number-border-color-invalid,
        currentColor
      );
    }

    :where(.neural-input-number-base[data-disabled='true']) {
      opacity: var(--neural-input-number-disabled-opacity, 0.5);
      cursor: not-allowed;
    }

    :where(.neural-input-number-button-base:disabled) {
      cursor: not-allowed;
    }
  `,
})
export class NeuralInputNumber implements FormValueControl<number | null> {
  private readonly neuralConfig = inject(NEURAL_NG_CONFIG);
  private readonly localeService = inject(NeuralLocaleService);
  private readonly generatedId = inject(NeuralInputNumberIdGenerator).next();
  protected readonly field = inject(NEURAL_FIELD_CONTEXT, { optional: true });
  private readonly nativeInput =
    viewChild<ElementRef<HTMLInputElement>>('nativeInput');
  private readonly editing = signal(false);
  private readonly parseInvalid = signal(false);

  readonly value = model<number | null>(null);
  readonly min = input<number | undefined>(undefined);
  readonly max = input<number | undefined>(undefined);
  readonly step = input(1);
  readonly mode = input<NeuralInputNumberMode>('decimal');
  readonly locale = input('');
  readonly currency = input('USD');
  readonly currencyDisplay =
    input<Intl.NumberFormatOptions['currencyDisplay']>('symbol');
  readonly prefix = input('');
  readonly suffix = input('');
  readonly useGrouping = input(true, { transform: booleanAttribute });
  readonly minFractionDigits = input<number | null>(null);
  readonly maxFractionDigits = input<number | null>(null);
  readonly showButtons = input(true, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly pending = input(false, { transform: booleanAttribute });
  readonly touched = input(false, { transform: booleanAttribute });
  readonly dirty = input(false, { transform: booleanAttribute });
  readonly fluid = input(false, { transform: booleanAttribute });
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly inputId = input('');
  readonly name = input('');
  readonly autocomplete = input('off');
  readonly inputMode = input('decimal');
  readonly placeholder = input('');
  readonly ariaLabel = input('');
  readonly incrementAriaLabel = input('');
  readonly decrementAriaLabel = input('');
  readonly incrementIconClass = input('');
  readonly decrementIconClass = input('');
  readonly inputNumberClass = input('');
  readonly inputClass = input('');
  readonly classes = input<NeuralInputNumberClasses>({});
  readonly valueCommit = output<NeuralInputNumberCommit>();
  readonly touch = output<void>();

  readonly effectiveLocale = computed(() =>
    resolveComponentLocale(this.locale(), this.localeService.code()),
  );
  readonly effectiveMin = computed(() => normalizeFinite(this.min()));
  readonly effectiveMax = computed(() => normalizeFinite(this.max()));
  readonly effectiveStep = computed(() => normalizeStep(this.step()));
  readonly effectiveUnstyled = computed(
    () =>
      this.unstyled() ||
      this.field?.effectiveUnstyled() ||
      this.neuralConfig.unstyled,
  );
  readonly effectiveDisabled = computed(
    () => this.disabled() || (this.field?.disabled() ?? false),
  );
  readonly effectiveReadonly = computed(
    () => this.readonly() || (this.field?.readonly() ?? false),
  );
  readonly effectiveRequired = computed(
    () => this.required() || (this.field?.required() ?? false),
  );
  readonly effectiveFluid = computed(() => this.fluid() || this.field?.fluid());
  readonly effectiveInvalid = computed(
    () =>
      this.invalid() || this.parseInvalid() || (this.field?.invalid() ?? false),
  );
  readonly effectivePending = computed(
    () => this.pending() || (this.field?.pending() ?? false),
  );
  readonly controlId = computed(
    () => this.field?.controlId() || this.inputId() || this.generatedId,
  );
  readonly formatter = computed(
    () => new Intl.NumberFormat(this.effectiveLocale(), this.formatOptions()),
  );
  readonly editorFormatter = computed(
    () =>
      new Intl.NumberFormat(this.effectiveLocale(), {
        useGrouping: false,
        maximumFractionDigits:
          this.maxFractionDigits() === null
            ? 20
            : normalizeFractionDigits(this.maxFractionDigits()),
      }),
  );
  readonly parser = computed(() => createNumberParser(this.effectiveLocale()));
  readonly formattedValue = computed(() => {
    const current = normalizeFinite(this.value());
    return current === null ? '' : this.formattedValueFor(current);
  });
  readonly draft = signal('');
  readonly incrementLabel = computed(
    () =>
      this.incrementAriaLabel() ||
      this.localeService.messages().inputNumber.increment,
  );
  readonly decrementLabel = computed(
    () =>
      this.decrementAriaLabel() ||
      this.localeService.messages().inputNumber.decrement,
  );
  readonly decrementDisabled = computed(() => {
    if (this.effectiveDisabled() || this.effectiveReadonly()) return true;
    const current = normalizeFinite(this.value());
    const minimum = this.effectiveMin();
    return current !== null && minimum !== null && current <= minimum;
  });
  readonly incrementDisabled = computed(() => {
    if (this.effectiveDisabled() || this.effectiveReadonly()) return true;
    const current = normalizeFinite(this.value());
    const maximum = this.effectiveMax();
    return current !== null && maximum !== null && current >= maximum;
  });

  readonly rootClass = computed(() =>
    this.composeClass(
      'neural-input-number-root',
      `neural-input-number-base ${
        this.effectiveFluid() ? 'neural-input-number-fluid-base' : ''
      }`,
      this.inputNumberClass(),
      this.classes().root,
    ),
  );
  readonly inputClassName = computed(() =>
    this.composeClass(
      'neural-input-number-input-root',
      'neural-input-number-input-base',
      this.inputClass(),
      this.classes().input,
    ),
  );
  readonly decrementButtonClass = computed(() =>
    this.composeClass(
      'neural-input-number-button-root neural-input-number-decrement-root',
      'neural-input-number-button-base',
      this.classes().decrementButton,
    ),
  );
  readonly incrementButtonClass = computed(() =>
    this.composeClass(
      'neural-input-number-button-root neural-input-number-increment-root',
      'neural-input-number-button-base',
      this.classes().incrementButton,
    ),
  );
  readonly buttonIconClass = computed(() =>
    ['neural-input-number-button-icon', this.classes().buttonIcon]
      .filter(Boolean)
      .join(' '),
  );
  readonly decrementIconClassName = computed(() =>
    [
      'neural-input-number-button-icon neural-input-number-decrement-icon',
      this.decrementIconClass(),
      this.classes().buttonIcon,
    ]
      .filter(Boolean)
      .join(' '),
  );
  readonly incrementIconClassName = computed(() =>
    [
      'neural-input-number-button-icon neural-input-number-increment-icon',
      this.incrementIconClass(),
      this.classes().buttonIcon,
    ]
      .filter(Boolean)
      .join(' '),
  );

  constructor() {
    effect(() => {
      const formatted = this.formattedValue();
      if (!this.editing()) this.draft.set(formatted);
    });
  }

  handleInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const rawValue = inputElement.value;
    const previousDraft = this.draft();

    if (!this.parser().isPotentialNumber(rawValue)) {
      inputElement.value = previousDraft;
      return;
    }

    this.draft.set(rawValue);
    if (!rawValue.trim()) {
      this.parseInvalid.set(false);
      this.value.set(null);
      return;
    }

    const parsed = this.parser().parse(rawValue);
    this.parseInvalid.set(false);
    if (parsed !== null) this.value.set(parsed);
  }

  handleFocus(): void {
    this.editing.set(true);
    const current = normalizeFinite(this.value());
    this.draft.set(
      current === null ? '' : this.editorFormatter().format(current),
    );
  }

  handleKeydown(event: KeyboardEvent): void {
    if (this.effectiveDisabled() || this.effectiveReadonly()) return;

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.stepBy(event.key === 'ArrowUp' ? 1 : -1, 'keyboard');
      return;
    }

    if (event.key === 'Home' && this.effectiveMin() !== null) {
      event.preventDefault();
      this.setAndCommit(this.effectiveMin() ?? 0, 'keyboard');
      return;
    }

    if (event.key === 'End' && this.effectiveMax() !== null) {
      event.preventDefault();
      this.setAndCommit(this.effectiveMax() ?? 0, 'keyboard');
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      this.commit('enter');
    }
  }

  stepBy(direction: -1 | 1, source: 'keyboard' | 'button'): void {
    if (this.effectiveDisabled() || this.effectiveReadonly()) return;
    const current = normalizeFinite(this.value());
    const nextValue = stepNumber(
      current,
      direction,
      this.effectiveStep(),
      this.effectiveMin(),
      this.effectiveMax(),
    );
    if (current === nextValue) return;
    this.setAndCommit(nextValue, source);
  }

  commit(source: 'blur' | 'enter'): void {
    const previousValue = normalizeFinite(this.value());
    const rawValue = this.draft();
    const parsed = rawValue.trim() ? this.parser().parse(rawValue) : null;

    if (rawValue.trim() && parsed === null) {
      this.parseInvalid.set(true);
      if (source === 'blur') this.touch.emit();
      return;
    }

    this.editing.set(false);
    this.parseInvalid.set(false);
    const nextValue =
      parsed === null
        ? null
        : clampNumber(parsed, this.effectiveMin(), this.effectiveMax());
    this.value.set(nextValue);
    this.draft.set(nextValue === null ? '' : this.formattedValueFor(nextValue));
    this.valueCommit.emit({ value: nextValue, previousValue, source });
    if (source === 'blur') this.touch.emit();
  }

  focus(options?: FocusOptions): void {
    this.nativeInput()?.nativeElement.focus(options);
  }

  select(): void {
    this.nativeInput()?.nativeElement.select();
  }

  reset(): void {
    this.editing.set(false);
    this.parseInvalid.set(false);
    this.value.set(null);
    this.draft.set('');
  }

  private setAndCommit(nextValue: number, source: 'keyboard' | 'button'): void {
    const previousValue = normalizeFinite(this.value());
    this.value.set(nextValue);
    this.parseInvalid.set(false);
    const formatted = this.editing()
      ? this.editorFormatter().format(nextValue)
      : this.formattedValueFor(nextValue);
    this.draft.set(formatted);
    this.valueCommit.emit({ value: nextValue, previousValue, source });
  }

  private formatOptions(): Intl.NumberFormatOptions {
    const options: Intl.NumberFormatOptions = {
      style: this.mode(),
      useGrouping: this.useGrouping(),
    };
    if (this.mode() === 'currency') {
      const currency = this.currency().trim().toUpperCase();
      options.currency = /^[A-Z]{3}$/.test(currency) ? currency : 'USD';
      options.currencyDisplay = this.currencyDisplay();
    }
    if (this.minFractionDigits() !== null) {
      options.minimumFractionDigits = normalizeFractionDigits(
        this.minFractionDigits(),
      );
    }
    if (this.maxFractionDigits() !== null) {
      options.maximumFractionDigits = Math.max(
        options.minimumFractionDigits ?? 0,
        normalizeFractionDigits(this.maxFractionDigits()),
      );
    }
    return options;
  }

  private formattedValueFor(value: number): string {
    return `${this.prefix()}${this.formatter().format(value)}${this.suffix()}`;
  }

  private composeClass(
    structural: string,
    visual: string,
    ...consumerClasses: Array<string | undefined>
  ): string {
    return [
      structural,
      this.effectiveUnstyled() ? '' : visual,
      ...consumerClasses,
    ]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(' ');
  }
}

/** @deprecated Use `NeuralInputNumber`. */
export { NeuralInputNumber as InputNumberComponent };

function normalizeFractionDigits(value: number | null): number {
  return Number.isFinite(value) ? Math.min(100, Math.max(0, value ?? 0)) : 0;
}

function resolveComponentLocale(
  locale: string,
  fallbackLocale: string,
): string {
  const candidate = locale.trim();
  if (!candidate) return fallbackLocale;
  try {
    return Intl.getCanonicalLocales(candidate)[0] ?? fallbackLocale;
  } catch {
    return fallbackLocale;
  }
}
