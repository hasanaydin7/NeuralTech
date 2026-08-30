import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NEURAL_NG_CONFIG } from '@neural-ng/core';
import type {
  NeuralAvatarClasses,
  NeuralAvatarDecoding,
  NeuralAvatarFetchPriority,
  NeuralAvatarImageFit,
  NeuralAvatarLoading,
  NeuralAvatarShape,
  NeuralAvatarSize,
} from './avatar.types';

@Component({
  selector: 'neural-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neural-avatar-host',
    '[hidden]': 'groupHidden()',
  },
  template: `
    <span
      [class]="rootClass()"
      [style.--neural-avatar-image-fit]="imageFit()"
      [attr.data-size]="size()"
      [attr.data-shape]="shape()"
      [attr.data-image-state]="imageState()"
      [attr.role]="
        shouldRenderImage() ? null : computedAriaLabel() ? 'img' : null
      "
      [attr.aria-label]="shouldRenderImage() ? null : computedAriaLabel()"
    >
      @if (shouldRenderImage()) {
        <img
          [class]="imageClass()"
          [src]="normalizedSrc()!"
          [attr.srcset]="normalizedSrcSet()"
          [attr.sizes]="normalizedSizes()"
          [alt]="computedAlt()"
          [loading]="loading()"
          [decoding]="decoding()"
          [attr.fetchpriority]="fetchPriority()"
          [attr.referrerpolicy]="referrerPolicy()"
          (load)="onImageLoad($event)"
          (error)="onImageError($event)"
        />
      } @else {
        <span [class]="fallbackClass()" aria-hidden="true">
          @if (computedInitials()) {
            <span [class]="initialsClass()">{{ computedInitials() }}</span>
          } @else if (normalizedIconClass()) {
            <i [class]="iconClassName()"></i>
          } @else {
            <span [class]="contentClass()"><ng-content /></span>
          }
        </span>
      }
    </span>
  `,
  styles: `
    :where(.neural-avatar-host) {
      display: inline-flex;
      flex: 0 0 auto;
      vertical-align: middle;
    }

    :where(.neural-avatar-host[hidden]) {
      display: none;
    }

    :where(
      .neural-avatar-root,
      .neural-avatar-image-root,
      .neural-avatar-fallback-root,
      .neural-avatar-initials-root,
      .neural-avatar-icon-root,
      .neural-avatar-content-root
    ) {
      box-sizing: border-box;
    }

    :where(.neural-avatar-root) {
      position: relative;
      display: inline-flex;
      flex: 0 0 auto;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      width: var(--neural-avatar-current-size, 2.5rem);
      height: var(--neural-avatar-current-size, 2.5rem);
    }

    :where(.neural-avatar-base) {
      color: var(--neural-avatar-color, CanvasText);
      background: var(--neural-avatar-background, Canvas);
      border: var(--neural-avatar-border, 1px solid currentColor);
      box-shadow: var(--neural-avatar-shadow, none);
      font-family: var(--neural-avatar-font-family, inherit);
      font-size: var(--neural-avatar-font-size, 0.875rem);
      font-weight: var(--neural-avatar-font-weight, 700);
      line-height: 1;
    }

    :where(.neural-avatar-extra-small-base) {
      --neural-avatar-current-size: var(
        --neural-avatar-extra-small-size,
        1.5rem
      );
      font-size: var(--neural-avatar-extra-small-font-size, 0.625rem);
    }

    :where(.neural-avatar-small-base) {
      --neural-avatar-current-size: var(--neural-avatar-small-size, 2rem);
      font-size: var(--neural-avatar-small-font-size, 0.75rem);
    }

    :where(.neural-avatar-medium-base) {
      --neural-avatar-current-size: var(--neural-avatar-medium-size, 2.5rem);
      font-size: var(--neural-avatar-medium-font-size, 0.875rem);
    }

    :where(.neural-avatar-large-base) {
      --neural-avatar-current-size: var(--neural-avatar-large-size, 3.25rem);
      font-size: var(--neural-avatar-large-font-size, 1rem);
    }

    :where(.neural-avatar-extra-large-base) {
      --neural-avatar-current-size: var(--neural-avatar-extra-large-size, 4rem);
      font-size: var(--neural-avatar-extra-large-font-size, 1.25rem);
    }

    :where(.neural-avatar-circle-base) {
      border-radius: var(--neural-avatar-circle-radius, 50%);
    }

    :where(.neural-avatar-rounded-base) {
      border-radius: var(--neural-avatar-rounded-radius, 0.75rem);
    }

    :where(.neural-avatar-square-base) {
      border-radius: var(--neural-avatar-square-radius, 0);
    }

    :where(.neural-avatar-image-root),
    :where(.neural-avatar-fallback-root) {
      display: flex;
      width: 100%;
      height: 100%;
      align-items: center;
      justify-content: center;
    }

    :where(.neural-avatar-image-base) {
      object-fit: var(--neural-avatar-image-fit, cover);
      object-position: var(--neural-avatar-image-position, center);
    }

    :where(.neural-avatar-fallback-base) {
      color: var(--neural-avatar-fallback-color, inherit);
      background: var(--neural-avatar-fallback-background, transparent);
    }

    :where(.neural-avatar-icon-root) {
      font-size: var(--neural-avatar-icon-size, 1.15em);
    }

    :where(.neural-avatar-content-root) {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  `,
})
export class NeuralAvatar {
  private readonly config = inject(NEURAL_NG_CONFIG);
  private readonly imageFailed = signal(false);
  private readonly imageLoadedState = signal(false);
  protected readonly groupHidden = signal(false);

  readonly src = input<string | null>(null);
  readonly srcSet = input<string | null>(null);
  readonly sizes = input<string | null>(null);
  readonly alt = input<string | null>(null);
  readonly name = input<string | null>(null);
  readonly initials = input<string | null>(null);
  readonly ariaLabel = input<string | null>(null);
  readonly iconClass = input<string | null>(null);
  readonly size = input<NeuralAvatarSize>('medium');
  readonly shape = input<NeuralAvatarShape>('circle');
  readonly imageFit = input<NeuralAvatarImageFit>('cover');
  readonly loading = input<NeuralAvatarLoading>('lazy');
  readonly decoding = input<NeuralAvatarDecoding>('async');
  readonly fetchPriority = input<NeuralAvatarFetchPriority>('auto');
  readonly referrerPolicy = input<string | null>(null);
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly avatarClass = input('');
  readonly classes = input<NeuralAvatarClasses>({});

  readonly imageLoaded = output<Event>();
  readonly imageError = output<Event>();

  readonly effectiveUnstyled = computed(
    () => this.unstyled() || this.config.unstyled,
  );
  readonly normalizedSrc = computed(() => this.src()?.trim() || null);
  readonly normalizedSrcSet = computed(() => this.srcSet()?.trim() || null);
  readonly normalizedSizes = computed(() => this.sizes()?.trim() || null);
  readonly normalizedIconClass = computed(
    () => this.iconClass()?.trim() || null,
  );
  readonly computedAlt = computed(
    () => this.alt() ?? this.name()?.trim() ?? '',
  );
  readonly computedAriaLabel = computed(
    () =>
      this.ariaLabel()?.trim() ||
      this.name()?.trim() ||
      this.computedAlt().trim() ||
      null,
  );
  readonly computedInitials = computed(() => {
    const explicit = this.initials()?.trim();
    if (explicit) return explicit;

    const name = this.name()?.trim();
    if (!name) return null;
    const words = name.split(/\s+/).filter(Boolean);
    if (words.length === 1) {
      return Array.from(words[0] ?? '')
        .slice(0, 2)
        .join('')
        .toLocaleUpperCase();
    }
    return `${Array.from(words[0] ?? '')[0] ?? ''}${
      Array.from(words[words.length - 1] ?? '')[0] ?? ''
    }`.toLocaleUpperCase();
  });
  readonly shouldRenderImage = computed(
    () => Boolean(this.normalizedSrc()) && !this.imageFailed(),
  );
  readonly imageState = computed(() => {
    if (!this.normalizedSrc()) return 'fallback';
    if (this.imageFailed()) return 'error';
    return this.imageLoadedState() ? 'loaded' : 'loading';
  });
  readonly rootClass = computed(() =>
    [
      this.compose(
        'neural-avatar-root',
        'neural-avatar-base',
        this.avatarClass(),
        this.classes().root,
      ),
      this.visualClass(`neural-avatar-${this.size()}-base`),
      this.visualClass(`neural-avatar-${this.shape()}-base`),
    ]
      .filter(Boolean)
      .join(' '),
  );
  readonly imageClass = computed(() =>
    this.compose(
      'neural-avatar-image-root',
      'neural-avatar-image-base',
      this.classes().image,
    ),
  );
  readonly fallbackClass = computed(() =>
    this.compose(
      'neural-avatar-fallback-root',
      'neural-avatar-fallback-base',
      this.classes().fallback,
    ),
  );
  readonly initialsClass = computed(() =>
    this.compose(
      'neural-avatar-initials-root',
      'neural-avatar-initials-base',
      this.classes().initials,
    ),
  );
  readonly iconClassName = computed(() =>
    this.compose(
      'neural-avatar-icon-root',
      'neural-avatar-icon-base',
      this.normalizedIconClass() ?? '',
      this.classes().icon,
    ),
  );
  readonly contentClass = computed(() =>
    this.compose(
      'neural-avatar-content-root',
      'neural-avatar-content-base',
      this.classes().content,
    ),
  );

  constructor() {
    effect(() => {
      this.normalizedSrc();
      this.imageFailed.set(false);
      this.imageLoadedState.set(false);
    });
  }

  /** @internal Used by AvatarGroup without mutating DOM directly. */
  setGroupHidden(hidden: boolean): void {
    this.groupHidden.set(hidden);
  }

  protected onImageLoad(event: Event): void {
    this.imageLoadedState.set(true);
    this.imageLoaded.emit(event);
  }

  protected onImageError(event: Event): void {
    this.imageFailed.set(true);
    this.imageLoadedState.set(false);
    this.imageError.emit(event);
  }

  private visualClass(value: string): string {
    return this.effectiveUnstyled() ? '' : value;
  }

  private compose(
    structural: string,
    visual: string,
    ...consumer: Array<string | undefined>
  ): string {
    return [structural, this.visualClass(visual), ...consumer]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(' ');
  }
}

/** @deprecated Import and use `NeuralAvatar` instead. */
export { NeuralAvatar as AvatarComponent };
