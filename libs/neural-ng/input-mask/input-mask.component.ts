import {
  APP_ID,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injectable,
  Injector,
  ViewEncapsulation,
  afterNextRender,
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
  NeuralInputMaskClasses,
  NeuralInputMaskCompleteEvent,
  NeuralInputMaskSlot,
} from './input-mask.types';

interface NeuralMaskLiteralToken {
  readonly kind: 'literal';
  readonly value: string;
}

interface NeuralMaskSlotToken {
  readonly kind: 'slot';
  readonly value: NeuralInputMaskSlot;
}

type NeuralMaskToken = NeuralMaskLiteralToken | NeuralMaskSlotToken;

@Injectable({ providedIn: 'root' })
class NeuralInputMaskIdGenerator {
  private readonly appId = inject(APP_ID);
  private nextId = 0;

  next(): string {
    return `${this.appId}-neural-input-mask-${this.nextId++}`;
  }
}

@Component({
  selector: 'neural-input-mask',
  standalone: true,
  template: `
    <div
      [class]="rootClass()"
      [attr.data-complete]="isComplete() ? 'true' : null"
      [attr.data-disabled]="effectiveDisabled() ? 'true' : null"
      [attr.data-readonly]="effectiveReadonly() ? 'true' : null"
      [attr.data-invalid]="effectiveInvalid() ? 'true' : null"
      [attr.data-pending]="effectivePending() ? 'true' : null"
      [attr.data-required]="effectiveRequired() ? 'true' : null"
      [attr.data-touched]="touched() ? 'true' : null"
      [attr.data-dirty]="dirty() ? 'true' : null"
    >
      <input
        #maskInput
        [id]="controlId()"
        [class]="inputClassName()"
        type="text"
        [name]="name()"
        [value]="displayValue()"
        [placeholder]="placeholder()"
        [autocomplete]="autocomplete()"
        [inputMode]="inputMode()"
        [disabled]="effectiveDisabled()"
        [readOnly]="effectiveReadonly()"
        [required]="effectiveRequired()"
        [attr.maxlength]="tokens().length || null"
        [attr.aria-label]="ariaLabel() || messages().inputLabel"
        [attr.aria-describedby]="describedBy()"
        [attr.aria-invalid]="effectiveInvalid() ? 'true' : null"
        [attr.aria-required]="effectiveRequired() ? 'true' : null"
        [attr.aria-busy]="effectivePending() ? 'true' : null"
        autocapitalize="off"
        spellcheck="false"
        (focus)="handleFocus()"
        (blur)="handleBlur()"
        (beforeinput)="handleBeforeInput($event)"
        (input)="handleInput($event)"
        (keydown)="handleKeydown($event)"
        (paste)="handlePaste($event)"
        (compositionstart)="composing.set(true)"
        (compositionend)="handleCompositionEnd($event)"
      />
    </div>
  `,
  styles: `
    :where(.neural-input-mask-host) {
      display: inline-block;
      min-width: 0;
      max-width: 100%;
    }
    :where(.neural-input-mask-host-fluid) {
      display: block;
      width: 100%;
    }
    :where(.neural-input-mask-root) {
      box-sizing: border-box;
      min-width: 0;
      max-width: 100%;
    }
    :where(.neural-input-mask-base) {
      width: var(--neural-input-mask-width, auto);
      color: var(--neural-input-mask-color, inherit);
      font-family: var(--neural-input-mask-font-family, inherit);
      font-size: var(--neural-input-mask-font-size, 0.875rem);
    }
    :where(.neural-input-mask-fluid-base) {
      width: 100%;
    }
    :where(.neural-input-mask-input-root) {
      box-sizing: border-box;
      min-width: 0;
      max-width: 100%;
    }
    :where(.neural-input-mask-input-base) {
      width: var(--neural-input-mask-input-width, 14rem);
      min-height: var(--neural-input-mask-min-height, 2.5rem);
      padding: var(--neural-input-mask-padding, 0.625rem 0.75rem);
      color: var(--neural-input-mask-color, inherit);
      caret-color: var(--neural-input-mask-caret-color, currentColor);
      background: var(--neural-input-mask-background, transparent);
      border: var(--neural-input-mask-border, 1px solid currentColor);
      border-radius: var(--neural-input-mask-radius, 0.5rem);
      box-shadow: var(--neural-input-mask-shadow, none);
      font: inherit;
      font-variant-numeric: tabular-nums;
      line-height: var(--neural-input-mask-line-height, 1.25);
      outline: 0;
      transition: var(--neural-input-mask-transition, none);
    }
    :where(.neural-input-mask-fluid-base .neural-input-mask-input-root) {
      width: 100%;
    }
    :where(.neural-input-mask-input-base)::placeholder {
      color: var(--neural-input-mask-placeholder-color, currentColor);
      opacity: var(--neural-input-mask-placeholder-opacity, 1);
    }
    :where(.neural-input-mask-input-base:hover:not(:disabled):not([readonly])) {
      color: var(--neural-input-mask-color-hover, inherit);
      background: var(
        --neural-input-mask-background-hover,
        var(--neural-input-mask-background, transparent)
      );
      border-color: var(--neural-input-mask-border-color-hover, currentColor);
    }
    :where(.neural-input-mask-input-base:focus-visible) {
      color: var(--neural-input-mask-color-focus, inherit);
      background: var(
        --neural-input-mask-background-focus,
        var(--neural-input-mask-background, transparent)
      );
      border-color: var(--neural-input-mask-border-color-focus, currentColor);
      box-shadow: var(--neural-input-mask-shadow-focus, none);
      outline: var(--neural-input-mask-focus-ring, 2px solid currentColor);
      outline-offset: var(--neural-input-mask-focus-ring-offset, 2px);
    }
    :where(
      .neural-input-mask-root[data-invalid='true'] .neural-input-mask-input-base
    ) {
      border-color: var(--neural-input-mask-border-color-invalid, currentColor);
      box-shadow: var(--neural-input-mask-shadow-invalid, none);
    }
    :where(.neural-input-mask-root[data-disabled='true']) {
      opacity: var(--neural-input-mask-disabled-opacity, 0.5);
    }
    :where(.neural-input-mask-input-base:disabled) {
      cursor: not-allowed;
    }
    :where(.neural-input-mask-input-base[readonly]) {
      color: var(--neural-input-mask-color-readonly, inherit);
      background: var(--neural-input-mask-background-readonly, transparent);
      cursor: default;
    }
    @media (prefers-reduced-motion: reduce) {
      :where(.neural-input-mask-input-base) {
        transition-duration: 0.01ms !important;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neural-input-mask-host',
    '[class.neural-input-mask-host-fluid]': 'effectiveFluid()',
  },
})
export class NeuralInputMask implements FormValueControl<string> {
  private readonly config = inject(NEURAL_NG_CONFIG);
  private readonly injector = inject(Injector);
  private readonly locale = inject(NeuralLocaleService);
  private readonly generatedId = inject(NeuralInputMaskIdGenerator).next();
  protected readonly field = inject(NEURAL_FIELD_CONTEXT, { optional: true });
  private readonly maskInput =
    viewChild.required<ElementRef<HTMLInputElement>>('maskInput');
  private readonly rawValue = signal('');
  private deletionHandledOnKeydown = false;
  private caretRequest = 0;
  protected readonly composing = signal(false);
  protected readonly focused = signal(false);

  readonly value = model('');
  readonly mask = input('');
  readonly slotChar = input('_');
  readonly unmask = input(false, { transform: booleanAttribute });
  readonly showMaskOnFocus = input(true, { transform: booleanAttribute });
  readonly clearIncomplete = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly pending = input(false, { transform: booleanAttribute });
  readonly touched = input(false, { transform: booleanAttribute });
  readonly dirty = input(false, { transform: booleanAttribute });
  readonly name = input('');
  readonly autocomplete = input('off');
  readonly inputMode = input('text');
  readonly placeholder = input('');
  readonly ariaLabel = input('');
  readonly inputMaskId = input('');
  readonly fluid = input(false, { transform: booleanAttribute });
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly inputMaskClass = input('');
  readonly inputClass = input('');
  readonly classes = input<NeuralInputMaskClasses>({});

  readonly complete = output<NeuralInputMaskCompleteEvent>();
  readonly incomplete = output<NeuralInputMaskCompleteEvent>();
  readonly touch = output<void>();

  readonly tokens = computed(() => compileMask(this.mask()));
  readonly slotCount = computed(
    () => this.tokens().filter((token) => token.kind === 'slot').length,
  );
  readonly isComplete = computed(
    () => this.slotCount() > 0 && this.rawValue().length === this.slotCount(),
  );
  readonly formattedValue = computed(() =>
    formatTokens(this.rawValue(), this.tokens(), '', false),
  );
  readonly displayValue = computed(() => {
    const showSlots =
      this.showMaskOnFocus() && (this.focused() || this.rawValue().length > 0);
    return formatTokens(
      this.rawValue(),
      this.tokens(),
      showSlots ? firstCharacter(this.slotChar()) : '',
      showSlots,
    );
  });
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
  readonly controlId = computed(
    () => this.field?.controlId() || this.inputMaskId() || this.generatedId,
  );
  readonly describedBy = computed(
    () => this.field?.controlDescribedBy() || null,
  );
  readonly messages = computed(() => this.locale.messages().inputMask);

  readonly rootClass = computed(() =>
    this.compose(
      'neural-input-mask-root',
      `neural-input-mask-base ${this.effectiveFluid() ? 'neural-input-mask-fluid-base' : ''}`,
      this.inputMaskClass(),
      this.classes().root,
    ),
  );
  readonly inputClassName = computed(() =>
    this.compose(
      'neural-input-mask-input-root',
      'neural-input-mask-input-base',
      this.inputClass(),
      this.classes().input,
    ),
  );

  constructor() {
    effect(() => {
      const raw = extractRaw(this.value(), this.tokens());
      if (raw !== this.rawValue()) this.rawValue.set(raw);
    });
  }

  handleFocus(): void {
    this.focused.set(true);
    queueMicrotask(() => {
      const input = this.maskInput().nativeElement;
      if (input.selectionStart === 0 && this.rawValue()) {
        this.setCaret(this.rawValue().length);
      }
    });
  }

  handleBlur(): void {
    this.focused.set(false);
    if (this.clearIncomplete() && this.rawValue() && !this.isComplete()) {
      this.setRaw('');
    } else if (this.rawValue() && !this.isComplete()) {
      this.incomplete.emit(this.eventValue());
    }
    this.touch.emit();
  }

  handleBeforeInput(event: InputEvent): void {
    if (
      this.composing() ||
      this.effectiveDisabled() ||
      this.effectiveReadonly()
    )
      return;
    if (event.inputType === 'deleteContentBackward') {
      event.preventDefault();
      if (this.deletionHandledOnKeydown) return;
      this.deleteFromSelection(true);
      return;
    }
    if (event.inputType === 'deleteContentForward') {
      event.preventDefault();
      if (this.deletionHandledOnKeydown) return;
      this.deleteFromSelection(false);
      return;
    }
    if (event.inputType.startsWith('insert') && event.data !== null) {
      event.preventDefault();
      this.insertAtSelection(event.data);
    }
  }

  handleInput(event: Event): void {
    if (this.composing()) return;
    const input = event.target as HTMLInputElement;
    this.setRaw(extractRaw(input.value, this.tokens()));
  }

  handleCompositionEnd(event: CompositionEvent): void {
    this.composing.set(false);
    this.handleInput(event);
  }

  handleKeydown(event: KeyboardEvent): void {
    if (this.effectiveDisabled() || this.effectiveReadonly()) return;
    if (event.key !== 'Backspace' && event.key !== 'Delete') return;
    event.preventDefault();
    this.deletionHandledOnKeydown = true;
    this.deleteFromSelection(event.key === 'Backspace');
    queueMicrotask(() => {
      this.deletionHandledOnKeydown = false;
    });
  }

  handlePaste(event: ClipboardEvent): void {
    if (this.effectiveDisabled() || this.effectiveReadonly()) return;
    const content = event.clipboardData?.getData('text') ?? '';
    if (!content) return;
    event.preventDefault();
    this.insertAtSelection(content);
  }

  focus(options?: FocusOptions): void {
    this.maskInput().nativeElement.focus(options);
  }

  select(): void {
    this.maskInput().nativeElement.select();
  }

  reset(): void {
    this.setRaw('');
  }

  private insertAtSelection(content: string): void {
    const input = this.maskInput().nativeElement;
    const cells = Array.from(this.rawValue());
    const start = Math.min(
      slotsBefore(this.tokens(), input.selectionStart ?? 0),
      cells.length,
    );
    const end = Math.min(
      slotsBefore(
        this.tokens(),
        input.selectionEnd ?? input.selectionStart ?? 0,
      ),
      cells.length,
    );
    if (end > start) cells.splice(start, end - start);
    let cursor = Math.min(start, cells.length);
    for (const character of Array.from(content.normalize('NFKC'))) {
      const token = slotTokenAt(this.tokens(), cursor);
      if (!token) break;
      if (!accepts(token.value, character)) continue;
      if (cells.length < this.slotCount()) {
        cells.splice(cursor, 0, character);
      } else {
        cells[cursor] = character;
      }
      cursor += 1;
    }
    this.setRaw(cells.join(''));
    this.restoreCaret(cursor);
  }

  private deleteFromSelection(backward: boolean): void {
    const input = this.maskInput().nativeElement;
    const cells = Array.from(this.rawValue());
    const start = Math.min(
      slotsBefore(this.tokens(), input.selectionStart ?? 0),
      cells.length,
    );
    const end = Math.min(
      slotsBefore(
        this.tokens(),
        input.selectionEnd ?? input.selectionStart ?? 0,
      ),
      cells.length,
    );
    let caret = start;
    if (end > start) {
      cells.splice(start, end - start);
    } else if (backward && start > 0) {
      cells.splice(start - 1, 1);
      caret = start - 1;
    } else if (!backward && start < cells.length) {
      cells.splice(start, 1);
    }
    this.setRaw(cells.join(''));
    this.restoreCaret(caret);
  }

  private setRaw(raw: string): void {
    const normalized = extractRaw(raw, this.tokens());
    this.rawValue.set(normalized);
    const formatted = formatTokens(normalized, this.tokens(), '', false);
    this.value.set(this.unmask() ? normalized : formatted);
    if (normalized.length === this.slotCount() && this.slotCount() > 0) {
      this.complete.emit({
        value: this.unmask() ? normalized : formatted,
        rawValue: normalized,
        formattedValue: formatted,
      });
    }
  }

  private eventValue(): NeuralInputMaskCompleteEvent {
    return {
      value: this.unmask() ? this.rawValue() : this.formattedValue(),
      rawValue: this.rawValue(),
      formattedValue: this.formattedValue(),
    };
  }

  private setCaret(slotIndex: number): void {
    const position = positionAfterSlots(this.tokens(), slotIndex);
    this.maskInput().nativeElement.setSelectionRange(position, position);
  }

  private restoreCaret(slotIndex: number): void {
    const request = ++this.caretRequest;
    const restore = () => {
      if (request !== this.caretRequest) return;
      const input = this.maskInput().nativeElement;
      if (input.ownerDocument.activeElement !== input) return;
      this.setCaret(slotIndex);
    };
    queueMicrotask(restore);
    afterNextRender(restore, { injector: this.injector });
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

/** @deprecated Use `NeuralInputMask`. */
export { NeuralInputMask as InputMaskComponent };

export function formatNeuralMask(
  rawValue: string,
  mask: string,
  slotChar = '_',
): string {
  return formatTokens(
    extractRaw(rawValue, compileMask(mask)),
    compileMask(mask),
    firstCharacter(slotChar),
    true,
  );
}

export function unmaskNeuralValue(value: string, mask: string): string {
  return extractRaw(value, compileMask(mask));
}

function compileMask(mask: string): NeuralMaskToken[] {
  const tokens: NeuralMaskToken[] = [];
  let escaped = false;
  for (const character of Array.from(mask)) {
    if (escaped) {
      tokens.push({ kind: 'literal', value: character });
      escaped = false;
    } else if (character === '\\') {
      escaped = true;
    } else if (character === '9' || character === 'a' || character === '*') {
      tokens.push({ kind: 'slot', value: character });
    } else {
      tokens.push({ kind: 'literal', value: character });
    }
  }
  if (escaped) tokens.push({ kind: 'literal', value: '\\' });
  return tokens;
}

function extractRaw(
  value: string | null | undefined,
  tokens: readonly NeuralMaskToken[],
): string {
  const source = Array.from((value ?? '').normalize('NFKC'));
  const result: string[] = [];
  let sourceIndex = 0;
  for (const token of tokens) {
    if (sourceIndex >= source.length) break;
    const character = source[sourceIndex] ?? '';
    if (token.kind === 'literal') {
      if (character === token.value) sourceIndex += 1;
      continue;
    }
    while (sourceIndex < source.length) {
      const candidate = source[sourceIndex++] ?? '';
      if (!accepts(token.value, candidate)) continue;
      result.push(candidate);
      break;
    }
  }
  return result.join('');
}

function formatTokens(
  rawValue: string,
  tokens: readonly NeuralMaskToken[],
  slotChar: string,
  showSlots: boolean,
): string {
  const raw = Array.from(rawValue);
  const result: string[] = [];
  let rawIndex = 0;
  let exhausted = raw.length === 0;
  for (const token of tokens) {
    if (token.kind === 'literal') {
      if (showSlots || raw.length > 0) result.push(token.value);
      continue;
    }
    if (rawIndex < raw.length) {
      result.push(raw[rawIndex++] ?? '');
      exhausted = rawIndex >= raw.length;
      continue;
    }
    if (showSlots) {
      result.push(slotChar);
      continue;
    }
    if (exhausted) break;
  }
  return result.join('');
}

function slotsBefore(
  tokens: readonly NeuralMaskToken[],
  position: number,
): number {
  return tokens
    .slice(0, Math.max(0, position))
    .filter((token) => token.kind === 'slot').length;
}

function positionAfterSlots(
  tokens: readonly NeuralMaskToken[],
  slotCount: number,
): number {
  if (slotCount <= 0) {
    const firstSlot = tokens.findIndex((token) => token.kind === 'slot');
    return Math.max(0, firstSlot);
  }
  let seen = 0;
  for (let index = 0; index < tokens.length; index += 1) {
    if (tokens[index]?.kind !== 'slot') continue;
    seen += 1;
    if (seen !== slotCount) continue;
    let position = index + 1;
    while (tokens[position]?.kind === 'literal') position += 1;
    return position;
  }
  return tokens.length;
}

function slotTokenAt(
  tokens: readonly NeuralMaskToken[],
  index: number,
): NeuralMaskSlotToken | undefined {
  return tokens.filter(
    (token): token is NeuralMaskSlotToken => token.kind === 'slot',
  )[index];
}

function accepts(slot: NeuralInputMaskSlot, character: string): boolean {
  if (slot === '9') return /[0-9]/u.test(character);
  if (slot === 'a') return /\p{L}/u.test(character);
  return /[\p{L}\p{N}]/u.test(character);
}

function firstCharacter(value: string): string {
  return Array.from(value)[0] ?? '_';
}
