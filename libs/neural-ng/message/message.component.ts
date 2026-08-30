import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { NEURAL_NG_CONFIG } from '@neural-ng/core';
import type {
  NeuralMessageAriaLive,
  NeuralMessageClasses,
  NeuralMessageSize,
  NeuralMessageVariant,
} from './message.component.types';
import type { NeuralMessageSeverity } from './message.types';

const DEFAULT_ICONS: Readonly<Record<NeuralMessageSeverity, string>> =
  Object.freeze({
    primary: 'nt nt-sparkles',
    secondary: 'nt nt-bell',
    neutral: 'nt nt-info-circle',
    info: 'nt nt-info-circle',
    success: 'nt nt-circle-check',
    warning: 'nt nt-alert-triangle',
    error: 'nt nt-circle-times',
  });

@Component({
  selector: 'neural-message',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-message-host' },
  template: `
    @if (visible()) {
      <section
        [class]="rootClass()"
        [attr.data-severity]="severity()"
        [attr.data-variant]="variant()"
        [attr.data-size]="size()"
        [attr.role]="computedRole()"
        [attr.aria-live]="computedAriaLive()"
        aria-atomic="true"
        animate.enter="neural-message-enter"
        animate.leave="neural-message-leave"
      >
        @if (icon()) {
          <i [class]="iconClasses()" aria-hidden="true"></i>
        }

        <span [class]="contentClass()">
          @if (title()) {
            <strong [class]="titleClass()">{{ title() }}</strong>
          }
          @if (message()) {
            <span [class]="detailClass()">{{ message() }}</span>
          }
          <ng-content />
        </span>

        <span [class]="actionsClass()"
          ><ng-content select="[message-actions]"
        /></span>

        @if (closable()) {
          <button
            type="button"
            [class]="closeClass()"
            [attr.aria-label]="closeLabel()"
            (click)="close()"
          >
            <i class="nt nt-x" aria-hidden="true"></i>
          </button>
        }
      </section>
    }
  `,
  styles: `
    :where(.neural-message-host) {
      display: contents;
    }
    :where(.neural-message-root),
    :where(.neural-message-content-root),
    :where(.neural-message-actions-root) {
      box-sizing: border-box;
    }
    :where(.neural-message-root) {
      display: flex;
      width: 100%;
      align-items: flex-start;
    }
    :where(.neural-message-base) {
      --neural-message-accent: var(--neural-message-neutral-color, #64748b);
      --neural-message-tone-background: color-mix(
        in srgb,
        var(--neural-message-accent) 14%,
        var(--neural-message-background, var(--neural-color-surface, #fff))
      );
      --neural-message-tone-border: color-mix(
        in srgb,
        var(--neural-message-accent) 42%,
        var(--neural-message-border-color, var(--neural-color-border, #cbd5e1))
      );
      --neural-message-tone-color: color-mix(
        in srgb,
        var(--neural-message-accent) 76%,
        var(--neural-message-color, var(--neural-color-text, #0f172a))
      );
      gap: var(--neural-message-gap, 0.75rem);
      padding: var(--neural-message-padding, 0.875rem 1rem);
      color: var(--neural-message-tone-color);
      background: var(--neural-message-tone-background);
      border: var(--neural-message-border-width, 1px) solid
        var(--neural-message-tone-border);
      border-radius: var(--neural-message-radius, 0.75rem);
      box-shadow: var(--neural-message-shadow, none);
      font-family: var(--neural-message-font-family, inherit);
    }
    :where(.neural-message-primary-base) {
      --neural-message-accent: var(
        --neural-message-primary-color,
        var(--neural-color-primary, #2563eb)
      );
    }
    :where(.neural-message-secondary-base) {
      --neural-message-accent: var(
        --neural-message-secondary-color,
        var(--neural-color-text-muted, #64748b)
      );
    }
    :where(.neural-message-neutral-base) {
      --neural-message-accent: var(
        --neural-message-neutral-color,
        var(--neural-color-text-muted, #64748b)
      );
    }
    :where(.neural-message-info-base) {
      --neural-message-accent: var(
        --neural-message-info-color,
        var(--neural-color-info, #0284c7)
      );
    }
    :where(.neural-message-success-base) {
      --neural-message-accent: var(
        --neural-message-success-color,
        var(--neural-color-success, #16a34a)
      );
    }
    :where(.neural-message-warning-base) {
      --neural-message-accent: var(
        --neural-message-warning-color,
        var(--neural-color-warning, #ca8a04)
      );
    }
    :where(.neural-message-error-base) {
      --neural-message-accent: var(
        --neural-message-error-color,
        var(--neural-color-error, #dc2626)
      );
    }
    :where(.neural-message-outlined-base) {
      background: transparent;
      border-color: var(--neural-message-accent);
    }
    :where(.neural-message-simple-base) {
      width: auto;
      padding: var(--neural-message-simple-padding, 0.25rem 0);
      background: transparent;
      border-color: transparent;
      border-radius: 0;
    }
    :where(.neural-message-small-base) {
      --neural-message-padding: 0.625rem 0.75rem;
      --neural-message-gap: 0.5rem;
      font-size: 0.8125rem;
    }
    :where(.neural-message-large-base) {
      --neural-message-padding: 1rem 1.125rem;
      --neural-message-gap: 0.875rem;
      font-size: 1rem;
    }
    :where(.neural-message-icon-root) {
      flex: 0 0 auto;
      margin-block-start: 0.0625rem;
    }
    :where(.neural-message-icon-base) {
      color: var(--neural-message-accent);
      font-size: var(--neural-message-icon-size, 1.25rem);
    }
    :where(.neural-message-content-root) {
      display: grid;
      min-width: 0;
      flex: 1 1 auto;
      gap: var(--neural-message-content-gap, 0.125rem);
    }
    :where(.neural-message-title-base) {
      color: inherit;
      font-size: 0.875rem;
      font-weight: 750;
      line-height: 1.4;
    }
    :where(.neural-message-detail-base) {
      color: inherit;
      font-size: 0.875rem;
      line-height: 1.5;
      opacity: 0.88;
      overflow-wrap: anywhere;
    }
    :where(.neural-message-actions-root) {
      display: inline-flex;
      flex: 0 0 auto;
      align-items: center;
      gap: 0.5rem;
    }
    :where(.neural-message-close-root) {
      flex: 0 0 auto;
    }
    :where(.neural-message-close-base) {
      display: grid;
      width: 1.75rem;
      height: 1.75rem;
      padding: 0;
      place-items: center;
      color: inherit;
      background: transparent;
      border: 0;
      border-radius: 0.5rem;
      cursor: pointer;
      opacity: 0.72;
      transition:
        background-color 140ms ease,
        opacity 140ms ease;
    }
    :where(.neural-message-close-base:hover) {
      background: color-mix(in srgb, currentColor 10%, transparent);
      opacity: 1;
    }
    :where(.neural-message-close-base:focus-visible) {
      outline: var(
        --neural-message-focus-ring,
        2px solid var(--neural-color-focus, #3b82f6)
      );
      outline-offset: 2px;
    }
    :where(.neural-message-enter) {
      animation: neural-message-enter
        var(--neural-message-enter-duration, 180ms) ease-out;
    }
    :where(.neural-message-leave) {
      animation: neural-message-leave
        var(--neural-message-leave-duration, 140ms) ease-in forwards;
    }
    @keyframes neural-message-enter {
      from {
        opacity: 0;
        translate: 0 -0.25rem;
      }
    }
    @keyframes neural-message-leave {
      to {
        opacity: 0;
        translate: 0 -0.25rem;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      :where(.neural-message-enter, .neural-message-leave) {
        animation-duration: 0.01ms;
      }
    }
  `,
})
export class NeuralMessage {
  private readonly config = inject(NEURAL_NG_CONFIG);

  readonly severity = input<NeuralMessageSeverity>('info');
  readonly title = input<string | null>(null);
  readonly message = input<string | null>(null);
  readonly variant = input<NeuralMessageVariant>('filled');
  readonly size = input<NeuralMessageSize>('medium');
  readonly icon = input(true, { transform: booleanAttribute });
  readonly iconClass = input<string | null>(null);
  readonly closable = input(false, { transform: booleanAttribute });
  readonly closeLabel = input('Close message');
  readonly ariaLive = input<NeuralMessageAriaLive>('auto');
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly messageClass = input('');
  readonly classes = input<NeuralMessageClasses>({});
  readonly visible = model(true);
  readonly closed = output<void>();

  readonly effectiveUnstyled = computed(
    () => this.unstyled() || this.config.unstyled,
  );
  readonly computedRole = computed(() =>
    this.severity() === 'error' ? 'alert' : 'status',
  );
  readonly computedAriaLive = computed(() => {
    const value = this.ariaLive();
    if (value === 'off') return 'off';
    if (value !== 'auto') return value;
    return this.severity() === 'error' ? 'assertive' : 'polite';
  });
  readonly rootClass = computed(() =>
    [
      this.compose(
        'neural-message-root',
        'neural-message-base',
        this.messageClass(),
        this.classes().root,
      ),
      this.visual(`neural-message-${this.severity()}-base`),
      this.variant() === 'filled'
        ? ''
        : this.visual(`neural-message-${this.variant()}-base`),
      this.size() === 'medium'
        ? ''
        : this.visual(`neural-message-${this.size()}-base`),
    ]
      .filter(Boolean)
      .join(' '),
  );
  readonly iconClasses = computed(() =>
    this.compose(
      'neural-message-icon-root',
      'neural-message-icon-base',
      this.iconClass()?.trim() || DEFAULT_ICONS[this.severity()],
      this.classes().icon,
    ),
  );
  readonly contentClass = computed(() =>
    this.compose(
      'neural-message-content-root',
      'neural-message-content-base',
      this.classes().content,
    ),
  );
  readonly titleClass = computed(() =>
    this.compose(
      'neural-message-title-root',
      'neural-message-title-base',
      this.classes().title,
    ),
  );
  readonly detailClass = computed(() =>
    this.compose(
      'neural-message-detail-root',
      'neural-message-detail-base',
      this.classes().detail,
    ),
  );
  readonly actionsClass = computed(() =>
    this.compose(
      'neural-message-actions-root',
      'neural-message-actions-base',
      this.classes().actions,
    ),
  );
  readonly closeClass = computed(() =>
    this.compose(
      'neural-message-close-root',
      'neural-message-close-base',
      this.classes().close,
    ),
  );

  close(): void {
    if (!this.visible()) return;
    this.visible.set(false);
    this.closed.emit();
  }

  private visual(value: string): string {
    return this.effectiveUnstyled() ? '' : value;
  }

  private compose(
    structural: string,
    visual: string,
    ...consumer: Array<string | undefined>
  ): string {
    return [structural, this.visual(visual), ...consumer]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(' ');
  }
}

/** @deprecated Import and use `NeuralMessage` instead. */
export { NeuralMessage as MessageComponent };
