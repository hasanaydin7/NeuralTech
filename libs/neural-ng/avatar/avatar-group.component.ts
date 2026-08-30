import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  numberAttribute,
} from '@angular/core';
import { NEURAL_NG_CONFIG } from '@neural-ng/core';
import { NeuralAvatar } from './avatar.component';
import type { NeuralAvatarGroupClasses } from './avatar.types';

@Component({
  selector: 'neural-avatar-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-avatar-group-host' },
  template: `
    <div
      [class]="rootClass()"
      [attr.role]="computedAriaLabel() ? 'group' : null"
      [attr.aria-label]="computedAriaLabel()"
    >
      <ng-content />
      @if (hiddenCount() > 0) {
        <span
          [class]="overflowClass()"
          [attr.aria-label]="computedOverflowLabel()"
        >
          +{{ hiddenCount() }}
        </span>
      }
    </div>
  `,
  styles: `
    :where(.neural-avatar-group-host) {
      display: inline-flex;
      vertical-align: middle;
    }

    :where(.neural-avatar-group-root),
    :where(.neural-avatar-group-overflow-root) {
      box-sizing: border-box;
    }

    :where(.neural-avatar-group-root) {
      display: inline-flex;
      align-items: center;
      isolation: isolate;
    }

    :where(
      .neural-avatar-group-base > .neural-avatar-host:not(:first-child),
      .neural-avatar-group-overflow-base
    ) {
      margin-inline-start: var(--neural-avatar-group-overlap, -0.75rem);
    }

    :where(
      .neural-avatar-group-base > .neural-avatar-host > .neural-avatar-root
    ) {
      position: relative;
      box-shadow: var(
        --neural-avatar-group-avatar-ring,
        0 0 0 2px var(--neural-avatar-group-ring-color, Canvas)
      );
    }

    :where(.neural-avatar-group-overflow-root) {
      position: relative;
      display: inline-flex;
      flex: 0 0 auto;
      align-items: center;
      justify-content: center;
      width: var(--neural-avatar-group-overflow-size, 2.5rem);
      height: var(--neural-avatar-group-overflow-size, 2.5rem);
      white-space: nowrap;
    }

    :where(.neural-avatar-group-overflow-base) {
      color: var(--neural-avatar-group-overflow-color, CanvasText);
      background: var(--neural-avatar-group-overflow-background, Canvas);
      border: var(
        --neural-avatar-group-overflow-border,
        1px solid currentColor
      );
      border-radius: var(--neural-avatar-group-overflow-radius, 50%);
      box-shadow: var(
        --neural-avatar-group-overflow-ring,
        0 0 0 2px var(--neural-avatar-group-ring-color, Canvas)
      );
      font-family: var(--neural-avatar-font-family, inherit);
      font-size: var(--neural-avatar-group-overflow-font-size, 0.75rem);
      font-weight: var(--neural-avatar-group-overflow-font-weight, 700);
      line-height: 1;
    }
  `,
})
export class NeuralAvatarGroup {
  private readonly config = inject(NEURAL_NG_CONFIG);
  private readonly avatars = contentChildren(NeuralAvatar);

  readonly max = input<number | null>(null, { transform: numberAttribute });
  readonly ariaLabel = input<string | null>(null);
  readonly overflowLabel = input('{count} more avatars');
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly groupClass = input('');
  readonly classes = input<NeuralAvatarGroupClasses>({});

  readonly effectiveUnstyled = computed(
    () => this.unstyled() || this.config.unstyled,
  );
  readonly visibleLimit = computed(() => {
    const max = this.max();
    return max === null || !Number.isFinite(max)
      ? this.avatars().length
      : Math.max(0, Math.floor(max));
  });
  readonly hiddenCount = computed(() =>
    Math.max(0, this.avatars().length - this.visibleLimit()),
  );
  readonly computedAriaLabel = computed(() => this.ariaLabel()?.trim() || null);
  readonly computedOverflowLabel = computed(() =>
    this.overflowLabel().replace('{count}', String(this.hiddenCount())),
  );
  readonly rootClass = computed(() =>
    this.compose(
      'neural-avatar-group-root',
      'neural-avatar-group-base',
      this.groupClass(),
      this.classes().root,
    ),
  );
  readonly overflowClass = computed(() =>
    this.compose(
      'neural-avatar-group-overflow-root',
      'neural-avatar-group-overflow-base',
      this.classes().overflow,
    ),
  );

  constructor() {
    effect(() => {
      const limit = this.visibleLimit();
      this.avatars().forEach((avatar, index) => {
        avatar.setGroupHidden(index >= limit);
      });
    });
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

/** @deprecated Import and use `NeuralAvatarGroup` instead. */
export { NeuralAvatarGroup as AvatarGroupComponent };
