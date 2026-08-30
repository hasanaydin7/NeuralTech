import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChild,
  contentChildren,
  inject,
  input,
  isDevMode,
  numberAttribute,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NEURAL_NG_CONFIG } from '@neural-ng/core';
import {
  MenuComponent,
  MenuTriggerDirective,
  type NeuralMenuEntry,
  type NeuralMenuSelect,
} from '@neural-ng/core/menu';
import { NeuralTooltip } from '@neural-ng/core/tooltip';
import type {
  NeuralBreadcrumbClasses,
  NeuralBreadcrumbItem,
  NeuralBreadcrumbRouterLink,
  NeuralBreadcrumbSelect,
} from './breadcrumb.types';

function normalizeIconClass(value: string): string {
  const classes = value.trim().split(/\s+/).filter(Boolean);
  if (classes.some((name) => name === 'nt' || name.startsWith('nt-'))) {
    classes.unshift('nt');
  }
  return [...new Set(classes)].join(' ');
}

@Directive({
  selector: 'ng-template[neuralBreadcrumbSeparator]',
  standalone: true,
})
export class NeuralBreadcrumbSeparatorTemplate {
  readonly template = inject(TemplateRef<unknown>);
}

@Component({
  selector: 'neural-breadcrumb-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'neural-breadcrumb-source-item',
    'aria-hidden': 'true',
  },
  template: '',
  styles: `
    :where(.neural-breadcrumb-source-item) {
      display: none;
    }
  `,
})
export class NeuralBreadcrumbItemComponent {
  readonly key = input.required<string>();
  readonly label = input.required<string>();
  readonly iconClass = input('');
  readonly href = input('');
  readonly routerLink = input<NeuralBreadcrumbRouterLink | undefined>();
  readonly queryParams = input<Record<string, unknown> | null>(null);
  readonly fragment = input('');
  readonly queryParamsHandling = input<
    'merge' | 'preserve' | 'replace' | '' | null
  >(null);
  readonly preserveFragment = input(false, { transform: booleanAttribute });
  readonly skipLocationChange = input(false, { transform: booleanAttribute });
  readonly replaceUrl = input(false, { transform: booleanAttribute });
  readonly state = input<Record<string, unknown> | undefined>(undefined);
  readonly target = input('');
  readonly rel = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly current = input<boolean | undefined>(undefined, {
    transform: booleanAttribute,
  });
  readonly itemClass = input('');

  readonly resolved = computed<NeuralBreadcrumbItem>(() => ({
    key: this.key(),
    label: this.label(),
    iconClass: this.iconClass() || undefined,
    href: this.href() || undefined,
    routerLink: this.routerLink(),
    queryParams: this.queryParams(),
    fragment: this.fragment() || undefined,
    queryParamsHandling: this.queryParamsHandling(),
    preserveFragment: this.preserveFragment(),
    skipLocationChange: this.skipLocationChange(),
    replaceUrl: this.replaceUrl(),
    state: this.state(),
    target: this.target() || undefined,
    rel: this.rel() || undefined,
    disabled: this.disabled(),
    current: this.current(),
    itemClass: this.itemClass() || undefined,
  }));
}

@Component({
  selector: 'neural-breadcrumb',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    RouterLink,
    MenuComponent,
    MenuTriggerDirective,
    NeuralTooltip,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-breadcrumb-host' },
  template: `
    <nav [class]="rootClass()" [attr.aria-label]="ariaLabel()">
      <ol [class]="listClass()">
        @for (item of leadingItems(); track item.key; let index = $index) {
          @if (index > 0) {
            <li aria-hidden="true" [class]="separatorClass()">
              <ng-container *ngTemplateOutlet="separatorContent" />
            </li>
          }
          <ng-container
            *ngTemplateOutlet="itemContent; context: { $implicit: item }"
          />
        }

        @if (overflowItems().length > 0) {
          <li aria-hidden="true" [class]="separatorClass()">
            <ng-container *ngTemplateOutlet="separatorContent" />
          </li>
          <li [class]="overflowItemClass()">
            <button
              type="button"
              [class]="overflowTriggerClass()"
              [neuralMenuTriggerFor]="overflowMenu"
              [neuralTooltip]="overflowLabel()"
              tooltipPosition="bottom"
              [showDelay]="overflowTooltipDelay()"
              [attr.aria-label]="overflowLabel()"
            >
              <i [class]="overflowIcon()" aria-hidden="true"></i>
            </button>
            <neural-menu
              #overflowMenu="neuralMenu"
              popup
              [ariaLabel]="overflowLabel()"
              [items]="overflowMenuItems()"
              [unstyled]="effectiveUnstyled()"
              (itemSelect)="selectOverflow($event)"
            />
          </li>
        }

        @for (item of trailingItems(); track item.key) {
          <li aria-hidden="true" [class]="separatorClass()">
            <ng-container *ngTemplateOutlet="separatorContent" />
          </li>
          <ng-container
            *ngTemplateOutlet="itemContent; context: { $implicit: item }"
          />
        }
      </ol>
    </nav>

    <ng-template #separatorContent>
      @if (separatorTemplate()?.template; as template) {
        <ng-container *ngTemplateOutlet="template" />
      } @else {
        <i [class]="separatorIcon()" aria-hidden="true"></i>
      }
    </ng-template>

    <ng-template #itemContent let-item>
      <li [class]="itemClass(item)">
        @if (isRouterLink(item)) {
          <a
            [class]="linkClass()"
            [routerLink]="item.routerLink"
            [queryParams]="item.queryParams ?? null"
            [fragment]="item.fragment ?? undefined"
            [queryParamsHandling]="item.queryParamsHandling ?? null"
            [preserveFragment]="item.preserveFragment === true"
            [skipLocationChange]="item.skipLocationChange === true"
            [replaceUrl]="item.replaceUrl === true"
            [state]="item.state"
            [attr.target]="item.target || null"
            [attr.rel]="item.rel || null"
            [attr.aria-current]="isCurrent(item) ? 'page' : null"
            [attr.data-key]="item.key"
            (click)="select(item, $event)"
          >
            <ng-container
              *ngTemplateOutlet="labelContent; context: { $implicit: item }"
            />
          </a>
        } @else if (isHref(item)) {
          <a
            [class]="linkClass()"
            [attr.href]="item.href"
            [attr.target]="item.target || null"
            [attr.rel]="item.rel || null"
            [attr.aria-current]="isCurrent(item) ? 'page' : null"
            [attr.data-key]="item.key"
            (click)="select(item, $event)"
          >
            <ng-container
              *ngTemplateOutlet="labelContent; context: { $implicit: item }"
            />
          </a>
        } @else {
          <span
            [class]="stateClass(item)"
            [attr.aria-current]="isCurrent(item) ? 'page' : null"
            [attr.aria-disabled]="item.disabled ? 'true' : null"
            [attr.data-key]="item.key"
          >
            <ng-container
              *ngTemplateOutlet="labelContent; context: { $implicit: item }"
            />
          </span>
        }
      </li>
    </ng-template>

    <ng-template #labelContent let-item>
      @if (item.iconClass) {
        <i [class]="itemIconClass(item)" aria-hidden="true"></i>
      }
      <span [class]="labelClass()">{{ item.label }}</span>
    </ng-template>

    <ng-content />
  `,
  styles: `
    :where(.neural-breadcrumb-host) {
      display: contents;
    }

    :where(.neural-breadcrumb-root),
    :where(.neural-breadcrumb-list-root),
    :where(.neural-breadcrumb-item-root),
    :where(.neural-breadcrumb-link-root),
    :where(.neural-breadcrumb-separator-root) {
      box-sizing: border-box;
    }

    :where(.neural-breadcrumb-list-root) {
      display: flex;
      align-items: center;
      min-width: 0;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    :where(.neural-breadcrumb-item-root),
    :where(.neural-breadcrumb-link-root),
    :where(.neural-breadcrumb-state-root),
    :where(.neural-breadcrumb-separator-root) {
      display: inline-flex;
      align-items: center;
      min-width: 0;
    }

    :where(.neural-breadcrumb-base) {
      width: 100%;
      padding: var(--neural-breadcrumb-padding, 0.75rem 1rem);
      color: var(--neural-breadcrumb-color, inherit);
      background: var(--neural-breadcrumb-background, transparent);
      border: var(--neural-breadcrumb-border, 1px solid transparent);
      border-radius: var(--neural-breadcrumb-radius, 0.75rem);
      box-shadow: var(--neural-breadcrumb-shadow, none);
      font-family: var(--neural-breadcrumb-font-family, inherit);
    }

    :where(.neural-breadcrumb-list-base) {
      gap: var(--neural-breadcrumb-gap, 0.5rem);
    }

    :where(.neural-breadcrumb-link-base),
    :where(.neural-breadcrumb-state-base),
    :where(.neural-breadcrumb-overflow-trigger-base) {
      gap: var(--neural-breadcrumb-item-gap, 0.375rem);
      min-height: var(--neural-breadcrumb-item-min-height, 2rem);
      padding: var(--neural-breadcrumb-item-padding, 0.25rem 0.375rem);
      color: var(--neural-breadcrumb-item-color, inherit);
      background: transparent;
      border: 0;
      border-radius: var(--neural-breadcrumb-item-radius, 0.375rem);
      font: inherit;
      font-size: var(--neural-breadcrumb-font-size, 0.875rem);
      text-decoration: none;
    }

    :where(.neural-breadcrumb-link-base:hover),
    :where(.neural-breadcrumb-link-base:focus-visible),
    :where(.neural-breadcrumb-overflow-trigger-base:hover),
    :where(.neural-breadcrumb-overflow-trigger-base:focus-visible) {
      color: var(--neural-breadcrumb-item-color-active, inherit);
      background: var(--neural-breadcrumb-item-background-active, transparent);
    }

    :where(.neural-breadcrumb-link-base:focus-visible),
    :where(.neural-breadcrumb-overflow-trigger-base:focus-visible) {
      outline: var(--neural-breadcrumb-focus-ring, 2px solid currentColor);
      outline-offset: var(--neural-breadcrumb-focus-ring-offset, 2px);
    }

    :where(.neural-breadcrumb-current-base) {
      color: var(--neural-breadcrumb-current-color, inherit);
      font-weight: var(--neural-breadcrumb-current-font-weight, 650);
    }

    :where(.neural-breadcrumb-disabled-base) {
      opacity: var(--neural-breadcrumb-disabled-opacity, 0.45);
    }

    :where(.neural-breadcrumb-label-base) {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    :where(.neural-breadcrumb-icon-base) {
      flex: 0 0 auto;
      font-size: var(--neural-breadcrumb-icon-size, 1rem);
    }

    :where(.neural-breadcrumb-separator-base) {
      flex: 0 0 auto;
      color: var(--neural-breadcrumb-separator-color, inherit);
      font-size: var(--neural-breadcrumb-separator-size, 0.875rem);
    }

    :where(.neural-breadcrumb-overflow-trigger-base) {
      justify-content: center;
      cursor: pointer;
    }
  `,
})
export class NeuralBreadcrumb {
  private readonly config = inject(NEURAL_NG_CONFIG);
  private readonly projectedItems = contentChildren(
    NeuralBreadcrumbItemComponent,
  );
  readonly separatorTemplate = contentChild(NeuralBreadcrumbSeparatorTemplate);

  readonly items = input<readonly NeuralBreadcrumbItem[]>([]);
  readonly maxItems = input(0);
  readonly ariaLabel = input('Breadcrumb');
  readonly separatorIconClass = input('nt-chevron-right');
  readonly overflowIconClass = input('nt-dots');
  readonly overflowLabel = input('More breadcrumb items');
  readonly overflowTooltipDelay = input(100, { transform: numberAttribute });
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly breadcrumbClass = input('');
  readonly classes = input<NeuralBreadcrumbClasses>({});
  readonly itemSelect = output<NeuralBreadcrumbSelect>();

  readonly effectiveUnstyled = computed(
    () => this.unstyled() || this.config.unstyled,
  );
  readonly resolvedItems = computed<readonly NeuralBreadcrumbItem[]>(() => {
    const items = this.items();
    if (isDevMode() && items.length && this.projectedItems().length) {
      console.warn(
        'NeuralNg Breadcrumb: use either [items] or neural-breadcrumb-item children. [items] wins when both are present.',
      );
    }
    return items.length
      ? items
      : this.projectedItems().map((child) => child.resolved());
  });
  readonly collapse = computed(() => {
    const max = Math.max(0, Math.trunc(this.maxItems()));
    return max >= 2 && this.resolvedItems().length > max;
  });
  readonly leadingItems = computed(() =>
    this.collapse() ? this.resolvedItems().slice(0, 1) : this.resolvedItems(),
  );
  readonly trailingItems = computed(() => {
    if (!this.collapse()) return [];
    return this.resolvedItems().slice(-(Math.max(2, this.maxItems()) - 1));
  });
  readonly overflowItems = computed(() => {
    if (!this.collapse()) return [];
    return this.resolvedItems().slice(1, -this.trailingItems().length);
  });
  readonly overflowMenuItems = computed<readonly NeuralMenuEntry[]>(() =>
    this.overflowItems().map((item) => ({
      key: item.key,
      label: item.label,
      iconClass: item.iconClass,
      disabled: item.disabled,
      href: item.href,
      routerLink: item.routerLink,
      queryParams: item.queryParams,
      fragment: item.fragment,
      queryParamsHandling: item.queryParamsHandling,
      preserveFragment: item.preserveFragment,
      skipLocationChange: item.skipLocationChange,
      replaceUrl: item.replaceUrl,
      state: item.state,
      target: item.target,
      rel: item.rel,
    })),
  );

  readonly rootClass = computed(() =>
    this.compose(
      'neural-breadcrumb-root',
      'neural-breadcrumb-base',
      this.breadcrumbClass(),
      this.classes().root,
    ),
  );
  readonly listClass = computed(() =>
    this.compose(
      'neural-breadcrumb-list-root',
      'neural-breadcrumb-list-base',
      this.classes().list,
    ),
  );
  readonly separatorClass = computed(() =>
    this.compose(
      'neural-breadcrumb-separator-root',
      'neural-breadcrumb-separator-base',
      this.classes().separator,
    ),
  );
  readonly labelClass = computed(() =>
    this.compose(
      'neural-breadcrumb-label-root',
      'neural-breadcrumb-label-base',
      this.classes().label,
    ),
  );
  readonly linkClass = computed(() =>
    this.compose(
      'neural-breadcrumb-link-root',
      'neural-breadcrumb-link-base',
      this.classes().link,
    ),
  );
  readonly overflowItemClass = computed(() =>
    this.compose(
      'neural-breadcrumb-overflow-item-root',
      'neural-breadcrumb-overflow-item-base',
      this.classes().overflowItem,
    ),
  );
  readonly overflowTriggerClass = computed(() =>
    this.compose(
      'neural-breadcrumb-overflow-trigger-root',
      'neural-breadcrumb-overflow-trigger-base',
      this.classes().overflowTrigger,
    ),
  );
  readonly separatorIcon = computed(() =>
    normalizeIconClass(this.separatorIconClass()),
  );
  readonly overflowIcon = computed(() =>
    normalizeIconClass(this.overflowIconClass()),
  );

  isCurrent(item: NeuralBreadcrumbItem): boolean {
    const explicit = this.resolvedItems().some(
      (candidate) => candidate.current !== undefined,
    );
    return explicit
      ? item.current === true
      : this.resolvedItems()[this.resolvedItems().length - 1]?.key === item.key;
  }

  isRouterLink(item: NeuralBreadcrumbItem): boolean {
    return !item.disabled && item.routerLink !== undefined;
  }

  isHref(item: NeuralBreadcrumbItem): boolean {
    return !item.disabled && item.href !== undefined;
  }

  itemClass(item: NeuralBreadcrumbItem): string {
    return this.compose(
      'neural-breadcrumb-item-root',
      'neural-breadcrumb-item-base',
      item.itemClass,
      this.classes().item,
    );
  }

  stateClass(item: NeuralBreadcrumbItem): string {
    return [
      this.compose(
        'neural-breadcrumb-state-root',
        'neural-breadcrumb-state-base',
      ),
      this.isCurrent(item)
        ? this.compose(
            'neural-breadcrumb-current-root',
            'neural-breadcrumb-current-base',
            this.classes().current,
          )
        : '',
      item.disabled
        ? this.compose(
            'neural-breadcrumb-disabled-root',
            'neural-breadcrumb-disabled-base',
            this.classes().disabled,
          )
        : '',
    ]
      .filter(Boolean)
      .join(' ');
  }

  itemIconClass(item: NeuralBreadcrumbItem): string {
    return [
      this.compose(
        'neural-breadcrumb-icon-root',
        'neural-breadcrumb-icon-base',
        this.classes().icon,
      ),
      normalizeIconClass(item.iconClass ?? ''),
    ]
      .filter(Boolean)
      .join(' ');
  }

  select(item: NeuralBreadcrumbItem, event: MouseEvent): void {
    if (item.disabled) {
      event.preventDefault();
      return;
    }
    this.itemSelect.emit({ key: item.key, item, originalEvent: event });
  }

  selectOverflow(event: NeuralMenuSelect): void {
    const item = this.overflowItems().find(
      (candidate) => candidate.key === event.key,
    );
    if (!item) return;
    this.itemSelect.emit({
      key: item.key,
      item,
      originalEvent: event.originalEvent,
    });
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

/** @deprecated Import and use `NeuralBreadcrumb` instead. */
export { NeuralBreadcrumb as BreadcrumbComponent };
/** @deprecated Import and use `NeuralBreadcrumbItemComponent` instead. */
export { NeuralBreadcrumbItemComponent as BreadcrumbItemComponent };
/** @deprecated Import and use `NeuralBreadcrumbSeparatorTemplate` instead. */
export { NeuralBreadcrumbSeparatorTemplate as BreadcrumbSeparatorTemplate };
