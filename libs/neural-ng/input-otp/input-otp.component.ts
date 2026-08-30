import {
  APP_ID,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injectable,
  ViewEncapsulation,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  viewChildren,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import {
  NEURAL_FIELD_CONTEXT,
  NEURAL_NG_CONFIG,
  NeuralLocaleService,
} from '@neural-ng/core';
import type {
  NeuralInputOtpClasses,
  NeuralInputOtpCompleteEvent,
  NeuralInputOtpMode,
} from './input-otp.types';

@Injectable({ providedIn: 'root' })
class NeuralInputOtpIdGenerator {
  private readonly appId = inject(APP_ID);
  private nextId = 0;

  next(): string {
    return `${this.appId}-neural-input-otp-${this.nextId++}`;
  }
}

@Component({
  selector: 'neural-input-otp',
  standalone: true,
  template: `
    <div
      [id]="controlId()"
      role="group"
      [class]="rootClass()"
      [attr.aria-label]="ariaLabel() || messages().groupLabel"
      [attr.aria-describedby]="describedBy()"
      [attr.aria-invalid]="effectiveInvalid() ? 'true' : null"
      [attr.aria-required]="effectiveRequired() ? 'true' : null"
      [attr.aria-busy]="effectivePending() ? 'true' : null"
      [attr.dir]="direction()"
      [attr.data-complete]="isComplete() ? 'true' : null"
      [attr.data-disabled]="effectiveDisabled() ? 'true' : null"
      [attr.data-readonly]="effectiveReadonly() ? 'true' : null"
      [attr.data-invalid]="effectiveInvalid() ? 'true' : null"
      [attr.data-required]="effectiveRequired() ? 'true' : null"
      [attr.data-pending]="effectivePending() ? 'true' : null"
      [attr.data-touched]="touched() ? 'true' : null"
      [attr.data-dirty]="dirty() ? 'true' : null"
    >
      <div [class]="groupClass()" (focusout)="handleFocusOut($event)">
        @for (index of indexes(); track index) {
          <input
            #otpInput
            [id]="cellId(index)"
            [class]="inputClassName()"
            [type]="mask() ? 'password' : 'text'"
            [value]="characters()[index]"
            [disabled]="effectiveDisabled()"
            [readOnly]="effectiveReadonly()"
            [required]="effectiveRequired()"
            [inputMode]="effectiveInputMode()"
            [autocomplete]="index === 0 ? autocomplete() : 'off'"
            [attr.aria-label]="cellLabel(index)"
            [attr.aria-invalid]="effectiveInvalid() ? 'true' : null"
            [attr.aria-posinset]="index + 1"
            [attr.aria-setsize]="effectiveLength()"
            maxlength="1"
            autocapitalize="off"
            spellcheck="false"
            (beforeinput)="handleBeforeInput($event)"
            (input)="handleInput($event, index)"
            (keydown)="handleKeydown($event, index)"
            (paste)="handlePaste($event, index)"
            (focus)="handleFocus($event)"
          />
          @if (separator() && index < effectiveLength() - 1) {
            <span [class]="separatorClass()" aria-hidden="true">{{
              separator()
            }}</span>
          }
        }
      </div>
      @if (name()) {
        <input
          type="hidden"
          [name]="name()"
          [value]="value()"
          [disabled]="effectiveDisabled()"
        />
      }
    </div>
  `,
  styles: `
    :where(.neural-input-otp-host) {
      display: inline-block;
      min-width: 0;
      max-width: 100%;
    }
    :where(.neural-input-otp-host-fluid) {
      display: block;
      width: 100%;
    }
    :where(.neural-input-otp-root) {
      box-sizing: border-box;
      min-width: 0;
      max-width: 100%;
    }
    :where(.neural-input-otp-base) {
      width: var(--neural-input-otp-width, max-content);
      color: var(--neural-input-otp-color, inherit);
      font-family: var(--neural-input-otp-font-family, inherit);
      font-size: var(--neural-input-otp-font-size, 1rem);
    }
    :where(.neural-input-otp-fluid-base) {
      width: 100%;
    }
    :where(.neural-input-otp-group-root) {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      min-width: 0;
    }
    :where(.neural-input-otp-group-base) {
      justify-content: var(--neural-input-otp-justify-content, flex-start);
      gap: var(--neural-input-otp-gap, 0.5rem);
    }
    :where(.neural-input-otp-input-root) {
      box-sizing: border-box;
      min-width: 0;
    }
    :where(.neural-input-otp-input-base) {
      inline-size: var(--neural-input-otp-input-size, 2.75rem);
      block-size: var(--neural-input-otp-input-size, 2.75rem);
      padding: var(--neural-input-otp-input-padding, 0.5rem);
      color: var(--neural-input-otp-color, inherit);
      caret-color: var(--neural-input-otp-caret-color, currentColor);
      background: var(--neural-input-otp-background, transparent);
      border: var(--neural-input-otp-border, 1px solid currentColor);
      border-radius: var(--neural-input-otp-radius, 0.5rem);
      box-shadow: var(--neural-input-otp-shadow, none);
      font: inherit;
      font-variant-numeric: tabular-nums;
      font-weight: var(--neural-input-otp-font-weight, 600);
      line-height: 1;
      text-align: center;
      outline: 0;
      transition: var(--neural-input-otp-transition, none);
    }
    :where(.neural-input-otp-input-base:hover:not(:disabled):not([readonly])) {
      border-color: var(--neural-input-otp-border-color-hover, currentColor);
      background: var(
        --neural-input-otp-background-hover,
        var(--neural-input-otp-background, transparent)
      );
    }
    :where(.neural-input-otp-input-base:focus-visible) {
      border-color: var(--neural-input-otp-border-color-focus, currentColor);
      box-shadow: var(--neural-input-otp-shadow-focus, none);
      outline: var(--neural-input-otp-focus-ring, 2px solid currentColor);
      outline-offset: var(--neural-input-otp-focus-ring-offset, 2px);
    }
    :where(
      .neural-input-otp-root[data-invalid='true'] .neural-input-otp-input-base
    ) {
      border-color: var(--neural-input-otp-border-color-invalid, currentColor);
      box-shadow: var(--neural-input-otp-shadow-invalid, none);
    }
    :where(.neural-input-otp-root[data-disabled='true']) {
      opacity: var(--neural-input-otp-disabled-opacity, 0.5);
    }
    :where(.neural-input-otp-input-base:disabled) {
      cursor: not-allowed;
    }
    :where(.neural-input-otp-input-base[readonly]) {
      color: var(--neural-input-otp-color-readonly, inherit);
      background: var(--neural-input-otp-background-readonly, transparent);
      cursor: default;
    }
    :where(.neural-input-otp-separator-root) {
      flex: 0 0 auto;
      pointer-events: none;
      user-select: none;
    }
    :where(.neural-input-otp-separator-base) {
      color: var(--neural-input-otp-separator-color, currentColor);
      font-weight: var(--neural-input-otp-separator-font-weight, 600);
    }
    @media (prefers-reduced-motion: reduce) {
      :where(.neural-input-otp-input-base) {
        transition-duration: 0.01ms !important;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neural-input-otp-host',
    '[class.neural-input-otp-host-fluid]': 'effectiveFluid()',
  },
})
export class NeuralInputOtp implements FormValueControl<string> {
  private readonly config = inject(NEURAL_NG_CONFIG);
  private readonly locale = inject(NeuralLocaleService);
  private readonly generatedId = inject(NeuralInputOtpIdGenerator).next();
  protected readonly field = inject(NEURAL_FIELD_CONTEXT, { optional: true });
  private readonly inputs =
    viewChildren<ElementRef<HTMLInputElement>>('otpInput');
  private readonly cellValues = signal<string[]>([]);

  readonly value = model('');
  readonly length = input(6, { transform: numberAttribute });
  readonly mode = input<NeuralInputOtpMode>('numeric');
  readonly mask = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly pending = input(false, { transform: booleanAttribute });
  readonly touched = input(false, { transform: booleanAttribute });
  readonly dirty = input(false, { transform: booleanAttribute });
  readonly autoFocus = input(false, { transform: booleanAttribute });
  readonly name = input('');
  readonly autocomplete = input('one-time-code');
  readonly inputMode = input('');
  readonly separator = input('');
  readonly ariaLabel = input('');
  readonly inputOtpId = input('');
  readonly cellAriaLabel = input('');
  readonly fluid = input(false, { transform: booleanAttribute });
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly inputOtpClass = input('');
  readonly inputClass = input('');
  readonly classes = input<NeuralInputOtpClasses>({});

  readonly complete = output<NeuralInputOtpCompleteEvent>();
  readonly touch = output<void>();

  readonly effectiveLength = computed(() =>
    Math.max(1, Math.floor(this.length() || 1)),
  );
  readonly indexes = computed(() =>
    Array.from({ length: this.effectiveLength() }, (_, index) => index),
  );
  readonly characters = computed(() => this.cellValues());
  readonly isComplete = computed(
    () =>
      this.characters().length === this.effectiveLength() &&
      this.characters().every(Boolean),
  );
  readonly effectiveUnstyled = computed(
    () =>
      this.unstyled() ||
      this.field?.effectiveUnstyled() ||
      this.config.unstyled,
  );
  readonly effectiveFluid = computed(() => this.fluid() || this.field?.fluid());
  readonly effectiveDisabled = computed(
    () => this.disabled() || (this.field?.disabled() ?? false),
  );
  readonly effectiveReadonly = computed(
    () => this.readonly() || (this.field?.readonly() ?? false),
  );
  readonly effectiveRequired = computed(
    () => this.required() || (this.field?.required() ?? false),
  );
  readonly effectiveInvalid = computed(
    () => this.invalid() || (this.field?.invalid() ?? false),
  );
  readonly effectivePending = computed(
    () => this.pending() || (this.field?.pending() ?? false),
  );
  readonly effectiveInputMode = computed(
    () => this.inputMode() || (this.mode() === 'numeric' ? 'numeric' : 'text'),
  );
  readonly controlId = computed(
    () => this.field?.controlId() || this.inputOtpId() || this.generatedId,
  );
  readonly describedBy = computed(
    () => this.field?.controlDescribedBy() || null,
  );
  readonly messages = computed(() => this.locale.messages().inputOtp);
  readonly direction = this.locale.direction;

  readonly rootClass = computed(() =>
    this.compose(
      'neural-input-otp-root',
      `neural-input-otp-base ${this.effectiveFluid() ? 'neural-input-otp-fluid-base' : ''}`,
      this.inputOtpClass(),
      this.classes().root,
    ),
  );
  readonly groupClass = computed(() =>
    this.compose(
      'neural-input-otp-group-root',
      'neural-input-otp-group-base',
      this.classes().group,
    ),
  );
  readonly inputClassName = computed(() =>
    this.compose(
      'neural-input-otp-input-root',
      'neural-input-otp-input-base',
      this.inputClass(),
      this.classes().input,
    ),
  );
  readonly separatorClass = computed(() =>
    this.compose(
      'neural-input-otp-separator-root',
      'neural-input-otp-separator-base',
      this.classes().separator,
    ),
  );

  constructor() {
    effect(() => {
      const normalized = Array.from(
        this.sanitize(this.value()).slice(0, this.effectiveLength()),
      );
      const current = this.cellValues();
      if (
        normalized.join('') === current.join('') &&
        current.length === this.effectiveLength()
      )
        return;
      this.cellValues.set(
        Array.from(
          { length: this.effectiveLength() },
          (_, index) => normalized[index] ?? '',
        ),
      );
    });

    afterNextRender(() => {
      if (this.autoFocus() && !this.effectiveDisabled()) this.focus();
    });
  }

  handleBeforeInput(event: InputEvent): void {
    if (event.inputType.startsWith('delete') || event.data === null) return;
    if (!this.sanitize(event.data)) event.preventDefault();
  }

  handleInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const incoming = this.sanitize(input.value);
    if (!incoming) {
      this.replace(index, '');
      input.value = '';
      return;
    }
    this.distribute(incoming, index);
  }

  handlePaste(event: ClipboardEvent, index: number): void {
    const content = this.sanitize(event.clipboardData?.getData('text') ?? '');
    if (!content) return;
    event.preventDefault();
    this.distribute(content, index);
  }

  handleKeydown(event: KeyboardEvent, index: number): void {
    if (this.effectiveDisabled() || this.effectiveReadonly()) return;
    const current = this.characters()[index] ?? '';
    switch (event.key) {
      case 'Backspace':
        event.preventDefault();
        if (current) {
          this.replace(index, '');
          this.focusCell(index);
        } else if (index > 0) {
          this.replace(index - 1, '');
          this.focusCell(index - 1);
        }
        break;
      case 'Delete':
        event.preventDefault();
        this.replace(index, '');
        this.focusCell(index);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.focusCell(index + (this.direction() === 'rtl' ? 1 : -1));
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.focusCell(index + (this.direction() === 'rtl' ? -1 : 1));
        break;
      case 'Home':
        event.preventDefault();
        this.focusCell(0);
        break;
      case 'End':
        event.preventDefault();
        this.focusCell(this.effectiveLength() - 1);
        break;
    }
  }

  handleFocus(event: FocusEvent): void {
    (event.target as HTMLInputElement).select();
  }

  handleFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    const group = event.currentTarget as HTMLElement;
    if (!next || !group.contains(next)) this.touch.emit();
  }

  focus(options?: FocusOptions): void {
    const emptyIndex = this.characters().findIndex((character) => !character);
    this.focusCell(
      emptyIndex < 0 ? this.effectiveLength() - 1 : emptyIndex,
      options,
    );
  }

  select(): void {
    const input = this.inputs()[0]?.nativeElement;
    input?.focus();
    input?.select();
  }

  reset(): void {
    this.value.set('');
  }

  cellId(index: number): string {
    return `${this.controlId()}-${index + 1}`;
  }

  cellLabel(index: number): string {
    const template = this.cellAriaLabel() || this.messages().characterLabel;
    return template
      .replace('{current}', String(index + 1))
      .replace('{total}', String(this.effectiveLength()));
  }

  private distribute(content: string, startIndex: number): void {
    const cells = this.toCells();
    let cursor = startIndex;
    for (const character of Array.from(content)) {
      if (cursor >= this.effectiveLength()) break;
      cells[cursor++] = character;
    }
    const next = cells.join('');
    this.cellValues.set(cells);
    this.value.set(next);
    queueMicrotask(() =>
      this.focusCell(Math.min(cursor, this.effectiveLength() - 1)),
    );
    if (cells.every(Boolean)) {
      this.complete.emit({ value: next });
    }
  }

  private replace(index: number, character: string): void {
    const cells = this.toCells();
    cells[index] = character;
    this.cellValues.set(cells);
    this.value.set(cells.join(''));
  }

  private toCells(): string[] {
    return Array.from(
      { length: this.effectiveLength() },
      (_, index) => this.characters()[index] ?? '',
    );
  }

  private sanitize(value: string | null | undefined): string {
    return Array.from((value ?? '').normalize('NFKC'))
      .filter((character) =>
        this.mode() === 'numeric'
          ? /[0-9]/u.test(character)
          : /[\p{L}\p{N}]/u.test(character),
      )
      .join('');
  }

  private focusCell(index: number, options?: FocusOptions): void {
    const bounded = Math.max(0, Math.min(index, this.effectiveLength() - 1));
    const input = this.inputs()[bounded]?.nativeElement;
    input?.focus(options);
    input?.select();
  }

  private compose(
    structural: string,
    visual: string,
    ...consumer: Array<string | undefined>
  ): string {
    return [structural, this.effectiveUnstyled() ? '' : visual, ...consumer]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(' ');
  }
}

/** @deprecated Use NeuralInputOtp. */
export { NeuralInputOtp as InputOtpComponent };
