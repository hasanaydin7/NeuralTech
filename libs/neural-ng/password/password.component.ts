import {
  APP_ID,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injectable,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  numberAttribute,
  output,
  viewChild,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import {
  NEURAL_FIELD_CONTEXT,
  NEURAL_NG_CONFIG,
  NeuralLocaleService,
} from '@neural-ng/core';
import type {
  NeuralPasswordClasses,
  NeuralPasswordStrength,
  NeuralPasswordStrengthChange,
} from './password.types';

@Injectable({ providedIn: 'root' })
class NeuralPasswordIdGenerator {
  private readonly appId = inject(APP_ID);
  private nextId = 0;

  next(): string {
    return `${this.appId}-neural-password-${this.nextId++}`;
  }
}

@Component({
  selector: 'neural-password',
  standalone: true,
  template: `
    <div
      [class]="rootClass()"
      [attr.data-visible]="visible() ? 'true' : null"
      [attr.data-strength]="strength()"
      [attr.data-disabled]="effectiveDisabled() ? 'true' : null"
      [attr.data-readonly]="effectiveReadonly() ? 'true' : null"
      [attr.data-invalid]="effectiveInvalid() ? 'true' : null"
      [attr.data-pending]="pending() || field?.pending() ? 'true' : null"
    >
      <div [class]="inputGroupClass()">
        <input
          #passwordInput
          [id]="controlId()"
          [class]="inputClassName()"
          [type]="visible() ? 'text' : 'password'"
          [name]="name()"
          [value]="value()"
          [autocomplete]="autocomplete()"
          [placeholder]="placeholder()"
          [disabled]="effectiveDisabled()"
          [readOnly]="effectiveReadonly()"
          [required]="effectiveRequired()"
          [attr.minlength]="minLength() ?? null"
          [attr.maxlength]="maxLength() ?? null"
          [attr.inputmode]="inputMode() || null"
          [attr.aria-label]="ariaLabel() || null"
          [attr.aria-describedby]="describedBy()"
          [attr.aria-invalid]="effectiveInvalid() ? 'true' : null"
          [attr.aria-required]="effectiveRequired() ? 'true' : null"
          [attr.aria-busy]="pending() || field?.pending() ? 'true' : null"
          (input)="handleInput($event)"
          (blur)="handleBlur()"
          (keydown)="updateCapsLock($event)"
          (keyup)="updateCapsLock($event)"
        />

        @if (toggleVisibility()) {
          <button
            type="button"
            [class]="toggleClass()"
            [disabled]="effectiveDisabled()"
            [attr.aria-label]="visible() ? hideLabel() : showLabel()"
            [attr.aria-pressed]="visible()"
            [attr.aria-controls]="controlId()"
            (pointerdown)="$event.preventDefault()"
            (click)="toggle()"
          >
            <i [class]="toggleIconClass()" aria-hidden="true"></i>
          </button>
        }
      </div>

      @if (showFeedback()) {
        <div [class]="feedbackClass()" aria-live="polite">
          <div
            role="progressbar"
            [class]="meterClass()"
            [attr.aria-label]="strengthLabel()"
            [attr.aria-valuemin]="0"
            [attr.aria-valuemax]="4"
            [attr.aria-valuenow]="strengthScore()"
            [attr.aria-valuetext]="strengthLabel()"
          >
            <span
              [class]="meterBarClass()"
              [style.inline-size.%]="strengthScore() * 25"
            ></span>
          </div>
          <span [class]="strengthLabelClass()">{{ strengthLabel() }}</span>
        </div>
      }

      @if (capsLock()) {
        <span role="status" [class]="capsLockClass()">
          {{ capsLockLabel() }}
        </span>
      }
    </div>
  `,
  styles: `
    :where(.neural-password-host) {
      display: inline-block;
      min-width: 0;
      max-width: 100%;
    }
    :where(.neural-password-host-fluid) {
      display: block;
      width: 100%;
    }
    :where(.neural-password-root) {
      box-sizing: border-box;
      min-width: 0;
      max-width: 100%;
    }
    :where(.neural-password-base) {
      width: var(--neural-password-width, auto);
      color: var(--neural-password-color, inherit);
      font-family: var(--neural-password-font-family, inherit);
      font-size: var(--neural-password-font-size, 0.875rem);
    }
    :where(.neural-password-fluid-base) {
      width: 100%;
    }
    :where(.neural-password-input-group-root) {
      box-sizing: border-box;
      display: flex;
      align-items: stretch;
      min-width: 0;
    }
    :where(.neural-password-input-group-base) {
      width: 100%;
      min-height: var(--neural-password-min-height, 2.5rem);
      overflow: hidden;
      background: var(--neural-password-background, transparent);
      border: var(--neural-password-border, 1px solid currentColor);
      border-radius: var(--neural-password-radius, 0.5rem);
      box-shadow: var(--neural-password-shadow, none);
      transition: var(--neural-password-transition, none);
    }
    :where(.neural-password-input-root) {
      box-sizing: border-box;
      min-width: 0;
    }
    :where(.neural-password-input-base) {
      flex: 1 1 auto;
      width: var(--neural-password-input-width, 12rem);
      padding: var(--neural-password-padding, 0.625rem 0.75rem);
      color: var(--neural-password-color, inherit);
      caret-color: var(--neural-password-caret-color, currentColor);
      background: transparent;
      border: 0;
      outline: 0;
      font: inherit;
      line-height: var(--neural-password-line-height, 1.25);
    }
    :where(.neural-password-input-base)::placeholder {
      color: var(--neural-password-placeholder-color, currentColor);
      opacity: var(--neural-password-placeholder-opacity, 0.65);
    }
    :where(.neural-password-toggle-root) {
      box-sizing: border-box;
      display: inline-grid;
      flex: 0 0 auto;
      place-items: center;
    }
    :where(.neural-password-toggle-base) {
      width: var(--neural-password-toggle-size, 2.5rem);
      padding: 0;
      color: var(--neural-password-toggle-color, inherit);
      background: var(--neural-password-toggle-background, transparent);
      border: 0;
      cursor: pointer;
      transition: var(--neural-password-transition, none);
    }
    :where(.neural-password-toggle-base:hover:not(:disabled)) {
      color: var(--neural-password-toggle-color-hover, inherit);
      background: var(--neural-password-toggle-background-hover, transparent);
    }
    :where(.neural-password-input-group-base:focus-within) {
      border-color: var(--neural-password-border-color-focus, currentColor);
      box-shadow: var(--neural-password-shadow-focus, none);
      outline: var(--neural-password-focus-ring, 2px solid currentColor);
      outline-offset: var(--neural-password-focus-ring-offset, 2px);
    }
    :where(
      .neural-password-root[data-invalid='true']
        .neural-password-input-group-base
    ) {
      border-color: var(--neural-password-border-color-invalid, currentColor);
      box-shadow: var(--neural-password-shadow-invalid, none);
    }
    :where(.neural-password-root[data-readonly='true']) {
      color: var(--neural-password-color-readonly, inherit);
    }
    :where(.neural-password-root[data-disabled='true']) {
      opacity: var(--neural-password-disabled-opacity, 0.5);
    }
    :where(.neural-password-feedback-root) {
      box-sizing: border-box;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: var(--neural-password-feedback-gap, 0.5rem);
      margin-block-start: var(--neural-password-feedback-offset, 0.5rem);
    }
    :where(.neural-password-meter-root) {
      position: relative;
      box-sizing: border-box;
      display: block;
      min-width: 0;
    }
    :where(.neural-password-meter-base) {
      height: var(--neural-password-meter-height, 0.25rem);
      overflow: hidden;
      background: var(--neural-password-meter-background, currentColor);
      border-radius: var(--neural-password-meter-radius, 999px);
    }
    :where(.neural-password-meter-bar-root) {
      display: block;
      height: 100%;
      transition: var(--neural-password-meter-transition, none);
    }
    :where(
      .neural-password-root[data-strength='empty']
        .neural-password-meter-bar-root
    ) {
      background: transparent;
    }
    :where(
      .neural-password-root[data-strength='weak']
        .neural-password-meter-bar-root
    ) {
      background: var(--neural-password-strength-weak, currentColor);
    }
    :where(
      .neural-password-root[data-strength='medium']
        .neural-password-meter-bar-root
    ) {
      background: var(--neural-password-strength-medium, currentColor);
    }
    :where(
      .neural-password-root[data-strength='strong']
        .neural-password-meter-bar-root
    ) {
      background: var(--neural-password-strength-strong, currentColor);
    }
    :where(.neural-password-strength-label-base),
    :where(.neural-password-caps-lock-base) {
      color: var(--neural-password-message-color, inherit);
      font-size: var(--neural-password-message-font-size, 0.75rem);
    }
    :where(.neural-password-caps-lock-root) {
      display: block;
      margin-block-start: var(--neural-password-message-offset, 0.375rem);
    }
    @media (prefers-reduced-motion: reduce) {
      :where(.neural-password-input-group-base),
      :where(.neural-password-toggle-base),
      :where(.neural-password-meter-bar-root) {
        transition-duration: 0.01ms !important;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neural-password-host',
    '[class.neural-password-host-fluid]': 'effectiveFluid()',
  },
})
export class NeuralPassword implements FormValueControl<string> {
  private readonly config = inject(NEURAL_NG_CONFIG);
  private readonly locale = inject(NeuralLocaleService);
  private readonly generatedId = inject(NeuralPasswordIdGenerator).next();
  protected readonly field = inject(NEURAL_FIELD_CONTEXT, { optional: true });
  private readonly passwordInput =
    viewChild.required<ElementRef<HTMLInputElement>>('passwordInput');

  readonly value = model('');
  readonly visible = model(false);
  readonly toggleVisibility = input(true, { transform: booleanAttribute });
  readonly showFeedback = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly pending = input(false, { transform: booleanAttribute });
  readonly touched = input(false, { transform: booleanAttribute });
  readonly dirty = input(false, { transform: booleanAttribute });
  readonly minLength = input<number | undefined, unknown>(undefined, {
    transform: optionalNumberAttribute,
  });
  readonly maxLength = input<number | undefined, unknown>(undefined, {
    transform: optionalNumberAttribute,
  });
  readonly name = input('');
  readonly autocomplete = input('current-password');
  readonly inputMode = input('');
  readonly placeholder = input('');
  readonly ariaLabel = input('');
  readonly passwordId = input('');
  readonly showIconClass = input('nt-eye');
  readonly hideIconClass = input('nt-eye-off');
  readonly showPasswordLabel = input('');
  readonly hidePasswordLabel = input('');
  readonly weakLabel = input('');
  readonly mediumLabel = input('');
  readonly strongLabel = input('');
  readonly emptyLabel = input('');
  readonly capsLockMessage = input('');
  readonly fluid = input(false, { transform: booleanAttribute });
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly passwordClass = input('');
  readonly inputClass = input('');
  readonly classes = input<NeuralPasswordClasses>({});

  readonly visibilityChange = output<boolean>();
  readonly strengthChange = output<NeuralPasswordStrengthChange>();
  readonly touch = output<void>();
  readonly capsLock = model(false);

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
  readonly controlId = computed(
    () => this.field?.controlId() || this.passwordId() || this.generatedId,
  );
  readonly describedBy = computed(
    () => this.field?.controlDescribedBy() || null,
  );
  readonly strengthScore = computed(() => scorePassword(this.value()));
  readonly strength = computed<NeuralPasswordStrength>(() =>
    resolveStrength(this.value(), this.strengthScore()),
  );
  readonly messages = computed(() => this.locale.messages().password);
  readonly showLabel = computed(
    () => this.showPasswordLabel() || this.messages().show,
  );
  readonly hideLabel = computed(
    () => this.hidePasswordLabel() || this.messages().hide,
  );
  readonly capsLockLabel = computed(
    () => this.capsLockMessage() || this.messages().capsLock,
  );
  readonly strengthLabel = computed(() => {
    switch (this.strength()) {
      case 'weak':
        return this.weakLabel() || this.messages().weak;
      case 'medium':
        return this.mediumLabel() || this.messages().medium;
      case 'strong':
        return this.strongLabel() || this.messages().strong;
      default:
        return this.emptyLabel() || this.messages().empty;
    }
  });

  readonly rootClass = computed(() =>
    this.compose(
      'neural-password-root',
      `neural-password-base ${this.effectiveFluid() ? 'neural-password-fluid-base' : ''}`,
      this.passwordClass(),
      this.classes().root,
    ),
  );
  readonly inputGroupClass = computed(() =>
    this.compose(
      'neural-password-input-group-root',
      'neural-password-input-group-base',
      this.classes().inputGroup,
    ),
  );
  readonly inputClassName = computed(() =>
    this.compose(
      'neural-password-input-root',
      'neural-password-input-base',
      this.inputClass(),
      this.classes().input,
    ),
  );
  readonly toggleClass = computed(() =>
    this.compose(
      'neural-password-toggle-root',
      'neural-password-toggle-base',
      this.classes().toggle,
    ),
  );
  readonly toggleIconClass = computed(() =>
    this.compose(
      normalizeIconClass(
        this.visible() ? this.hideIconClass() : this.showIconClass(),
      ),
      '',
      this.classes().toggleIcon,
    ),
  );
  readonly feedbackClass = computed(() =>
    this.compose(
      'neural-password-feedback-root',
      'neural-password-feedback-base',
      this.classes().feedback,
    ),
  );
  readonly meterClass = computed(() =>
    this.compose(
      'neural-password-meter-root',
      'neural-password-meter-base',
      this.classes().meter,
    ),
  );
  readonly meterBarClass = computed(() =>
    this.compose(
      'neural-password-meter-bar-root',
      'neural-password-meter-bar-base',
      this.classes().meterBar,
    ),
  );
  readonly strengthLabelClass = computed(() =>
    this.compose(
      'neural-password-strength-label-root',
      'neural-password-strength-label-base',
      this.classes().strengthLabel,
    ),
  );
  readonly capsLockClass = computed(() =>
    this.compose(
      'neural-password-caps-lock-root',
      'neural-password-caps-lock-base',
      this.classes().capsLock,
    ),
  );

  handleInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const score = scorePassword(value);
    this.value.set(value);
    this.strengthChange.emit({
      value,
      score,
      strength: resolveStrength(value, score),
    });
  }
  handleBlur(): void {
    this.capsLock.set(false);
    this.touch.emit();
  }
  updateCapsLock(event: KeyboardEvent): void {
    this.capsLock.set(event.getModifierState('CapsLock'));
  }
  toggle(): void {
    if (this.effectiveDisabled()) return;
    const visible = !this.visible();
    this.visible.set(visible);
    this.visibilityChange.emit(visible);
    this.focus({ preventScroll: true });
  }
  focus(options?: FocusOptions): void {
    this.passwordInput().nativeElement.focus(options);
  }
  select(): void {
    this.passwordInput().nativeElement.select();
  }
  reset(): void {
    this.value.set('');
    this.visible.set(false);
    this.capsLock.set(false);
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

export function scorePassword(value: string): number {
  if (!value) return 0;
  let score = value.length >= 8 ? 1 : 0;
  if (value.length >= 12) score += 1;
  const groups = [/[a-z]/, /[A-Z]/, /\d/, /[^\p{L}\p{N}\s]/u].filter(
    (pattern) => pattern.test(value),
  ).length;
  if (groups >= 3) score += 1;
  if (groups === 4) score += 1;
  return Math.min(4, score);
}

function resolveStrength(value: string, score: number): NeuralPasswordStrength {
  if (!value) return 'empty';
  if (score <= 1) return 'weak';
  if (score <= 3) return 'medium';
  return 'strong';
}

function optionalNumberAttribute(value: unknown): number | undefined {
  return value === undefined || value === null
    ? undefined
    : numberAttribute(value);
}

function normalizeIconClass(value: string): string {
  const normalized = value.trim();
  if (!normalized) return '';
  const classes = normalized.split(/\s+/);
  return classes.some((name) => name.startsWith('nt-')) &&
    !classes.includes('nt')
    ? `nt ${normalized}`
    : normalized;
}
