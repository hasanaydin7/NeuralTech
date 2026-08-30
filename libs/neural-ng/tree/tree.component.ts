import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  NEURAL_NG_CONFIG,
  NeuralLocaleService,
  normalizeNeuralOptionText,
  resolveNeuralVirtualRange,
  type NeuralVirtualRange,
} from '@neural-ng/core';
import {
  collectExpandableTreeKeys,
  filterNeuralTree,
  flattenNeuralTree,
  indexNeuralTree,
} from './tree-controller';
import type {
  NeuralTreeCheckboxState,
  NeuralTreeClasses,
  NeuralTreeFlatNode,
  NeuralTreeFilterMode,
  NeuralTreeKey,
  NeuralTreeLazyLoadEvent,
  NeuralTreeNode,
  NeuralTreeNodeEvent,
  NeuralTreeSelectable,
  NeuralTreeSelectionEvent,
  NeuralTreeSelectionMode,
  NeuralTreeTrackBy,
} from './tree.types';
import {
  NeuralTreeEmptyTemplate,
  NeuralTreeIconTemplate,
  NeuralTreeLoadingTemplate,
  NeuralTreeNodeTemplate,
  NeuralTreeTogglerTemplate,
} from './tree-templates';

@Component({
  selector: 'neural-tree',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neural-tree-host',
    '[class.neural-tree-host-compact]': 'compact()',
  },
  template: `
    <div
      [class]="rootClass()"
      [attr.aria-busy]="loading() ? 'true' : null"
      [attr.data-loading]="loading() ? 'true' : 'false'"
      [attr.data-compact]="compact() ? 'true' : 'false'"
      [attr.data-virtual]="virtualScroll() ? 'true' : 'false'"
    >
      @if (loading()) {
        <div role="status" [class]="loadingClass()">
          @if (loadingTemplate(); as template) {
            <ng-container
              [ngTemplateOutlet]="template.templateRef"
              [ngTemplateOutletContext]="
                stateTemplateContext(effectiveLoadingLabel())
              "
            />
          } @else {
            <i class="nt nt-loader-3 nt-spin" aria-hidden="true"></i>
            <span>{{ effectiveLoadingLabel() }}</span>
          }
        </div>
      } @else if (visibleNodes().length === 0) {
        <div [class]="emptyClass()">
          @if (emptyTemplate(); as template) {
            <ng-container
              [ngTemplateOutlet]="template.templateRef"
              [ngTemplateOutletContext]="
                stateTemplateContext(effectiveEmptyLabel())
              "
            />
          } @else {
            {{ effectiveEmptyLabel() }}
          }
        </div>
      } @else {
        <ul
          role="tree"
          [class]="listClass()"
          [attr.aria-label]="normalizedAriaLabel()"
          [attr.aria-labelledby]="normalizedAriaLabelledby()"
          [style.max-height.px]="virtualScroll() ? virtualScrollHeight() : null"
          [style.overflow]="virtualScroll() ? 'auto' : null"
          (scroll)="handleVirtualScroll($event)"
        >
          <ng-container
            [ngTemplateOutlet]="treeNodes"
            [ngTemplateOutletContext]="{ $implicit: displayNodes() }"
          />
        </ul>
        <ng-template #treeNodes let-nodes>
          @for (node of nodes; track trackDataNode($index, node)) {
            @if (visibleNode(node.key); as item) {
              <li
                #treeItem
                role="treeitem"
                [class]="nodeClass(item)"
                [attr.aria-level]="item.level"
                [attr.aria-posinset]="item.posInSet"
                [attr.aria-setsize]="item.setSize"
                [attr.aria-expanded]="item.leaf ? null : item.expanded"
                [attr.aria-disabled]="item.node.disabled ? 'true' : null"
                [attr.aria-selected]="ariaSelected(item)"
                [attr.aria-checked]="ariaChecked(item)"
                [attr.tabindex]="treeItemTabIndex(item)"
                [style.--neural-tree-level]="item.level"
                [attr.data-key]="item.key"
                [attr.data-label]="item.node.label"
                [attr.data-level]="item.level"
                [attr.data-expanded]="item.expanded ? 'true' : 'false'"
                [attr.data-leaf]="item.leaf ? 'true' : 'false'"
                [attr.data-selected]="isSelected(item.key) ? 'true' : 'false'"
                [attr.data-partial]="
                  isPartiallySelected(item.key) ? 'true' : 'false'
                "
                [attr.data-match]="isFilterMatch(item.key) ? 'true' : 'false'"
                (focus)="handleNodeFocus(item)"
                (click)="handleNodeClick(item, $event)"
                (keydown)="handleNodeKeydown(item, $event)"
              >
                <div [class]="nodeContentClass(item)">
                  @if (!item.leaf) {
                    <button
                      type="button"
                      tabindex="-1"
                      [class]="togglerClass()"
                      [disabled]="item.node.disabled || item.node.loading"
                      [attr.aria-label]="toggleLabel(item)"
                      (click)="handleToggleClick(item, $event)"
                    >
                      @if (togglerTemplate(); as template) {
                        <ng-container
                          [ngTemplateOutlet]="template.templateRef"
                          [ngTemplateOutletContext]="
                            togglerTemplateContext(item)
                          "
                        />
                      } @else {
                        <i
                          [class]="togglerIconClass(item)"
                          aria-hidden="true"
                        ></i>
                      }
                    </button>
                  } @else {
                    <span
                      class="neural-tree-toggler-spacer-root"
                      aria-hidden="true"
                    ></span>
                  }
                  @if (selectionMode() === 'checkbox') {
                    <span
                      [class]="checkboxClass()"
                      aria-hidden="true"
                      [attr.data-state]="checkboxState(item.key)"
                    >
                      @if (checkboxState(item.key) !== 'unchecked') {
                        <i
                          [class]="checkboxIconClass(item)"
                          aria-hidden="true"
                        ></i>
                      }
                    </span>
                  }
                  @if (item.node.iconClass) {
                    @if (iconTemplate(); as template) {
                      <ng-container
                        [ngTemplateOutlet]="template.templateRef"
                        [ngTemplateOutletContext]="iconTemplateContext(item)"
                      />
                    } @else {
                      <i [class]="nodeIconClass(item)" aria-hidden="true"></i>
                    }
                  }
                  @if (nodeTemplate(); as template) {
                    <ng-container
                      [ngTemplateOutlet]="template.templateRef"
                      [ngTemplateOutletContext]="nodeTemplateContext(item)"
                    />
                  } @else {
                    <span [class]="labelClass()">{{ item.node.label }}</span>
                  }
                </div>
                @if (item.node.error) {
                  <div role="alert" [class]="errorClass()">
                    <i class="nt nt-alert-circle" aria-hidden="true"></i>
                    <span [class]="errorMessageClass()">{{
                      lazyErrorLabel(item)
                    }}</span>
                    <button
                      type="button"
                      [class]="retryClass()"
                      (click)="retryLazyLoad(item, $event)"
                    >
                      {{ effectiveRetryLabel() }}
                    </button>
                  </div>
                }
                @if (item.expanded && node.children?.length) {
                  <ul role="group" [class]="groupClass()">
                    <ng-container
                      [ngTemplateOutlet]="treeNodes"
                      [ngTemplateOutletContext]="{ $implicit: node.children }"
                    />
                  </ul>
                }
              </li>
            }
          }
        </ng-template>
      }
    </div>
  `,
  styles: `
    :where(.neural-tree-host) {
      display: block;
      min-width: 0;
    }
    :where(.neural-tree-root),
    :where(.neural-tree-list-root),
    :where(.neural-tree-node-root),
    :where(.neural-tree-node-content-root) {
      box-sizing: border-box;
      min-width: 0;
    }
    :where(.neural-tree-list-root) {
      padding: 0;
      margin: 0;
      list-style: none;
    }
    :where(.neural-tree-group-root) {
      padding: 0;
      margin: 0;
      list-style: none;
    }
    :where(.neural-tree-node-content-root) {
      display: flex;
      align-items: center;
      padding-inline-start: calc(
        (var(--neural-tree-level, 1) - 1) * var(--neural-tree-indent, 1.5rem)
      );
    }
    :where(.neural-tree-toggler-root),
    :where(.neural-tree-toggler-spacer-root),
    :where(.neural-tree-checkbox-root) {
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      width: var(--neural-tree-toggler-size, 2rem);
      height: var(--neural-tree-toggler-size, 2rem);
    }
    :where(.neural-tree-root-base) {
      padding: var(--neural-tree-padding, 0.5rem);
      color: var(--neural-tree-color, var(--neural-color-text));
      background: var(--neural-tree-background, var(--neural-color-surface));
      border: var(--neural-tree-border, 1px solid var(--neural-color-border));
      border-radius: var(--neural-tree-radius, 0.75rem);
      box-shadow: var(--neural-tree-shadow, none);
      font-family: var(--neural-tree-font-family, inherit);
    }
    :where(.neural-tree-list-base) {
      display: grid;
      gap: var(--neural-tree-node-gap, 0.125rem);
    }
    :where(.neural-tree-group-base) {
      display: grid;
      gap: var(--neural-tree-node-gap, 0.125rem);
    }
    :where(.neural-tree-node-content-base) {
      gap: var(--neural-tree-content-gap, 0.5rem);
      min-height: var(--neural-tree-node-height, 2.5rem);
      padding-block: var(--neural-tree-node-padding-block, 0.25rem);
      padding-inline-end: var(--neural-tree-node-padding-inline, 0.5rem);
      border-radius: var(--neural-tree-node-radius, 0.5rem);
      transition:
        background-color 150ms ease,
        color 150ms ease;
    }
    :where(.neural-tree-node-content-base:hover) {
      background: var(
        --neural-tree-node-background-hover,
        var(--neural-color-surface-hover)
      );
    }
    :where(.neural-tree-node-root:focus-visible) {
      outline: none;
    }
    :where(
      .neural-tree-node-root:focus-visible > .neural-tree-node-content-base
    ) {
      outline: 2px solid var(--neural-color-focus);
      outline-offset: -2px;
    }
    :where(.neural-tree-node-content-selected-base) {
      color: var(
        --neural-tree-node-color-selected,
        var(--neural-color-text-strong)
      );
      background: var(
        --neural-tree-node-background-selected,
        color-mix(in srgb, var(--neural-color-primary) 12%, transparent)
      );
    }
    :where(.neural-tree-node-content-partial-base) {
      background: var(
        --neural-tree-node-background-partial,
        var(--neural-color-surface-active)
      );
    }
    :where(.neural-tree-node-content-match-base) {
      box-shadow: inset 3px 0 0
        var(--neural-tree-match-color, var(--neural-color-primary));
    }
    :where(
      .neural-tree-node-root[aria-disabled='true']
        .neural-tree-node-content-base
    ) {
      opacity: var(--neural-tree-disabled-opacity, 0.55);
    }
    :where(.neural-tree-toggler-base) {
      padding: 0;
      color: var(--neural-tree-toggler-color, var(--neural-color-text-muted));
      background: transparent;
      border: 0;
      border-radius: 0.4rem;
      cursor: pointer;
    }
    :where(.neural-tree-toggler-base:hover:not(:disabled)) {
      color: var(--neural-tree-toggler-color-hover, var(--neural-color-text));
      background: var(
        --neural-tree-toggler-background-hover,
        var(--neural-color-surface-active)
      );
    }
    :where(.neural-tree-toggler-base:focus-visible) {
      outline: 2px solid var(--neural-color-focus);
      outline-offset: 1px;
    }
    :where(.neural-tree-toggler-base:disabled) {
      cursor: progress;
    }
    :where(.neural-tree-toggler-icon-base) {
      font-size: 1rem;
      line-height: 1;
    }
    :where(
      .neural-tree-root:dir(rtl) .neural-tree-toggler-icon-root.nt-chevron-right
    ) {
      transform: rotate(180deg);
    }
    :where(.neural-tree-node-icon-base) {
      flex: 0 0 auto;
      color: var(--neural-tree-node-icon-color, var(--neural-color-primary));
      font-size: var(--neural-tree-node-icon-size, 1.05rem);
    }
    :where(.neural-tree-checkbox-base) {
      width: var(--neural-tree-checkbox-size, 1.15rem);
      height: var(--neural-tree-checkbox-size, 1.15rem);
      color: var(
        --neural-tree-checkbox-color,
        var(--neural-color-primary-contrast)
      );
      background: var(
        --neural-tree-checkbox-background,
        var(--neural-color-surface)
      );
      border: 1px solid
        var(--neural-tree-checkbox-border-color, var(--neural-color-border));
      border-radius: var(--neural-tree-checkbox-radius, 0.3rem);
    }
    :where(.neural-tree-checkbox-base[data-state='checked']),
    :where(.neural-tree-checkbox-base[data-state='partial']) {
      background: var(
        --neural-tree-checkbox-background-selected,
        var(--neural-color-primary)
      );
      border-color: var(
        --neural-tree-checkbox-border-color-selected,
        var(--neural-color-primary)
      );
    }
    :where(.neural-tree-checkbox-icon-base) {
      font-size: 0.8rem;
      line-height: 1;
    }
    :where(.neural-tree-label-base) {
      overflow: hidden;
      font-size: 0.9rem;
      font-weight: 500;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    :where(.neural-tree-loading-base),
    :where(.neural-tree-empty-base) {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.625rem;
      min-height: 8rem;
      padding: 1.5rem;
      color: var(--neural-color-text-muted);
      text-align: center;
    }
    :where(.neural-tree-error-base) {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-height: 2rem;
      margin-inline-start: calc(
        var(--neural-tree-level, 1) * var(--neural-tree-indent, 1.5rem)
      );
      color: var(--neural-tree-error-color, var(--neural-color-error));
      font-size: 0.8rem;
    }
    :where(.neural-tree-retry-base) {
      padding: 0.2rem 0.45rem;
      color: inherit;
      background: transparent;
      border: 1px solid currentColor;
      border-radius: 0.35rem;
      cursor: pointer;
    }
    :where(.neural-tree-root-base[data-compact='true']) {
      --neural-tree-node-height: var(--neural-tree-compact-node-height, 2rem);
      --neural-tree-indent: var(--neural-tree-compact-indent, 1.15rem);
      --neural-tree-toggler-size: var(
        --neural-tree-compact-toggler-size,
        1.6rem
      );
      --neural-tree-content-gap: var(
        --neural-tree-compact-content-gap,
        0.35rem
      );
    }
  `,
})
export class NeuralTree<T = unknown> implements OnDestroy {
  private readonly config = inject(NEURAL_NG_CONFIG);
  private readonly locale = inject(NeuralLocaleService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly requestedLazyKeys = new Set<NeuralTreeKey>();
  private selectionAnchorKey: NeuralTreeKey | null = null;
  private typeahead = '';
  private typeaheadTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly focusedKey = signal<NeuralTreeKey | null>(null);

  readonly nodeTemplate = contentChild(NeuralTreeNodeTemplate<T>);
  readonly togglerTemplate = contentChild(NeuralTreeTogglerTemplate<T>);
  readonly iconTemplate = contentChild(NeuralTreeIconTemplate<T>);
  readonly emptyTemplate = contentChild(NeuralTreeEmptyTemplate);
  readonly loadingTemplate = contentChild(NeuralTreeLoadingTemplate);

  readonly value = input<readonly NeuralTreeNode<T>[]>([]);
  readonly expandedKeys = model<ReadonlySet<NeuralTreeKey>>(new Set());
  readonly selectionKeys = model<ReadonlySet<NeuralTreeKey>>(new Set());
  readonly filterValue = model('');
  readonly filterMode = input<NeuralTreeFilterMode>('lenient');
  readonly filterFields = input<readonly string[]>(['label']);
  readonly filterPredicate = input<
    ((node: NeuralTreeNode<T>, normalizedQuery: string) => boolean) | null
  >(null);
  readonly selectionMode = input<NeuralTreeSelectionMode | null>(null);
  readonly metaKeySelection = input(true, { transform: booleanAttribute });
  readonly rangeSelection = input(true, { transform: booleanAttribute });
  readonly propagateSelectionDown = input(true, {
    transform: booleanAttribute,
  });
  readonly propagateSelectionUp = input(true, {
    transform: booleanAttribute,
  });
  readonly selectableNode = input<NeuralTreeSelectable<T> | null>(null);
  readonly loading = input(false, { transform: booleanAttribute });
  readonly emptyLabel = input<string | null>(null);
  readonly loadingLabel = input<string | null>(null);
  readonly retryLabel = input<string | null>(null);
  readonly ariaLabel = input<string | null>(null);
  readonly ariaLabelledby = input<string | null>(null);
  readonly trackBy = input<NeuralTreeTrackBy<T> | null>(null);
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly compact = input(false, { transform: booleanAttribute });
  readonly virtualScroll = input(false, { transform: booleanAttribute });
  readonly virtualItemSize = input(40, { transform: numberAttribute });
  readonly virtualScrollHeight = input(320, { transform: numberAttribute });
  readonly virtualOverscan = input(3, { transform: numberAttribute });
  readonly treeClass = input('');
  readonly classes = input<NeuralTreeClasses>({});

  readonly nodeExpand = output<NeuralTreeNodeEvent<T>>();
  readonly nodeCollapse = output<NeuralTreeNodeEvent<T>>();
  readonly nodeToggle = output<NeuralTreeNodeEvent<T>>();
  readonly lazyLoad = output<NeuralTreeLazyLoadEvent<T>>();
  readonly nodeSelect = output<NeuralTreeSelectionEvent<T>>();
  readonly nodeUnselect = output<NeuralTreeSelectionEvent<T>>();
  readonly virtualRangeChange = output<NeuralVirtualRange>();
  readonly virtualScrollTop = signal(0);

  readonly effectiveUnstyled = computed(
    () => this.unstyled() || this.config.unstyled,
  );
  readonly filterResult = computed(() => {
    const predicate = this.filterPredicate();
    return filterNeuralTree(this.value(), this.filterValue(), {
      fields: this.filterFields(),
      mode: this.filterMode(),
      locale: this.locale.code(),
      ...(predicate ? { predicate } : {}),
    });
  });
  readonly displayNodes = computed(() => this.filterResult().nodes);
  readonly effectiveExpandedKeys = computed(
    () =>
      new Set([
        ...this.expandedKeys(),
        ...(this.filterValue().trim() ? this.filterResult().expandedKeys : []),
      ]),
  );
  readonly visibleNodes = computed(() =>
    flattenNeuralTree(this.displayNodes(), this.effectiveExpandedKeys()),
  );
  readonly visibleNodeIndex = computed(
    () => new Map(this.visibleNodes().map((item) => [item.key, item] as const)),
  );
  readonly treeIndex = computed(() => indexNeuralTree(this.value()));
  readonly virtualRange = computed<NeuralVirtualRange>(() =>
    resolveNeuralVirtualRange({
      itemCount: this.visibleNodes().length,
      itemSize: Math.max(1, this.virtualItemSize()),
      viewportSize: Math.max(1, this.virtualScrollHeight()),
      scrollOffset: this.virtualScrollTop(),
      overscan: Math.max(0, this.virtualOverscan()),
    }),
  );
  readonly virtualItems = computed(() => {
    const range = this.virtualRange();
    return this.visibleNodes().slice(range.start, range.end);
  });
  readonly checkboxStates = computed(() =>
    this.computeCheckboxStates(this.selectionKeys()),
  );
  readonly rovingKey = computed(() => {
    const visible = this.visibleNodes();
    const focused = this.focusedKey();
    if (
      focused !== null &&
      visible.some((item) => item.key === focused && !item.node.disabled)
    ) {
      return focused;
    }
    return visible.find((item) => !item.node.disabled)?.key ?? null;
  });
  readonly normalizedAriaLabel = computed(() =>
    this.ariaLabelledby()?.trim()
      ? null
      : this.ariaLabel()?.trim() || this.locale.messages().tree.navigation,
  );
  readonly normalizedAriaLabelledby = computed(
    () => this.ariaLabelledby()?.trim() || null,
  );
  readonly effectiveEmptyLabel = computed(
    () => this.emptyLabel()?.trim() || this.locale.messages().tree.empty,
  );
  readonly effectiveLoadingLabel = computed(
    () => this.loadingLabel()?.trim() || this.locale.messages().tree.loading,
  );
  readonly effectiveRetryLabel = computed(
    () => this.retryLabel()?.trim() || this.locale.messages().tree.retry,
  );
  readonly rootClass = computed(() =>
    this.compose(
      'neural-tree-root',
      'neural-tree-root-base',
      this.treeClass(),
      this.classes().root,
    ),
  );
  readonly listClass = computed(() =>
    this.compose(
      'neural-tree-list-root',
      'neural-tree-list-base',
      this.classes().list,
    ),
  );
  readonly groupClass = computed(() =>
    this.compose(
      'neural-tree-group-root',
      'neural-tree-group-base',
      this.classes().group,
    ),
  );
  readonly togglerClass = computed(() =>
    this.compose(
      'neural-tree-toggler-root',
      'neural-tree-toggler-base',
      this.classes().toggler,
    ),
  );
  readonly labelClass = computed(() =>
    this.compose(
      'neural-tree-label-root',
      'neural-tree-label-base',
      this.classes().label,
    ),
  );
  readonly checkboxClass = computed(() =>
    this.compose(
      'neural-tree-checkbox-root',
      'neural-tree-checkbox-base',
      this.classes().checkbox,
    ),
  );
  readonly loadingClass = computed(() =>
    this.compose(
      'neural-tree-loading-root',
      'neural-tree-loading-base',
      this.classes().loading,
    ),
  );
  readonly emptyClass = computed(() =>
    this.compose(
      'neural-tree-empty-root',
      'neural-tree-empty-base',
      this.classes().empty,
    ),
  );
  readonly errorClass = computed(() =>
    this.compose(
      'neural-tree-error-root',
      'neural-tree-error-base',
      this.classes().error,
    ),
  );
  readonly errorMessageClass = computed(() =>
    this.compose(
      'neural-tree-error-message-root',
      'neural-tree-error-message-base',
      this.classes().errorMessage,
    ),
  );
  readonly retryClass = computed(() =>
    this.compose(
      'neural-tree-retry-root',
      'neural-tree-retry-base',
      this.classes().retry,
    ),
  );

  constructor() {
    effect(() => {
      const validKeys = new Set(this.treeIndex().keys());
      for (const key of this.requestedLazyKeys) {
        if (!validKeys.has(key)) this.requestedLazyKeys.delete(key);
      }
    });
  }

  toggleNode(item: NeuralTreeFlatNode<T>, nativeEvent?: Event): void {
    if (item.leaf || item.node.disabled || item.node.loading) return;
    const next = new Set(this.expandedKeys());
    const expanded = !next.has(item.key);
    if (expanded) next.add(item.key);
    else next.delete(item.key);
    this.expandedKeys.set(next);
    if (!expanded && this.focusedKey() !== item.key) {
      const focusedPath = this.treeIndex().get(this.focusedKey() ?? '')?.path;
      if (focusedPath?.includes(item.key)) this.focusNode(item.key);
    }
    const event: NeuralTreeNodeEvent<T> = {
      node: item.node,
      key: item.key,
      level: item.level,
      expanded,
      ...(nativeEvent ? { nativeEvent } : {}),
    };
    this.nodeToggle.emit(event);
    if (expanded) {
      this.nodeExpand.emit(event);
      if (
        item.node.leaf === false &&
        (item.node.children?.length ?? 0) === 0 &&
        !this.requestedLazyKeys.has(item.key)
      ) {
        this.emitLazyLoad(item, nativeEvent);
      }
    } else {
      this.nodeCollapse.emit(event);
    }
  }

  selectNode(item: NeuralTreeFlatNode<T>, nativeEvent: Event): void {
    const mode = this.selectionMode();
    if (!mode || !this.isNodeSelectable(item.node)) return;
    const interactionEvent = nativeEvent as MouseEvent | KeyboardEvent;
    if (nativeEvent.type.startsWith('key')) nativeEvent.preventDefault();
    const current = new Set(this.selectionKeys());
    let selected = !current.has(item.key);

    if (mode === 'single') {
      const modified = interactionEvent.ctrlKey || interactionEvent.metaKey;
      selected = !(
        current.has(item.key) &&
        this.metaKeySelection() &&
        modified
      );
      current.clear();
      if (selected) current.add(item.key);
    } else if (mode === 'multiple') {
      const modified = interactionEvent.ctrlKey || interactionEvent.metaKey;
      if (
        interactionEvent.shiftKey &&
        this.rangeSelection() &&
        this.selectionAnchorKey !== null
      ) {
        this.selectVisibleRange(
          current,
          this.selectionAnchorKey,
          item.key,
          modified,
        );
        selected = current.has(item.key);
      } else if (!this.metaKeySelection() || modified) {
        if (selected) current.add(item.key);
        else current.delete(item.key);
      } else {
        current.clear();
        current.add(item.key);
        selected = true;
      }
    } else {
      selected = this.checkboxState(item.key) !== 'checked';
      this.setCheckboxBranch(current, item.key, selected);
      if (this.propagateSelectionUp()) {
        this.normalizeCheckboxAncestors(current, item.key);
      }
    }

    this.selectionAnchorKey = item.key;
    const next = new Set(current);
    this.selectionKeys.set(next);
    const event: NeuralTreeSelectionEvent<T> = {
      node: item.node,
      key: item.key,
      selected,
      selectionKeys: next,
      nativeEvent: interactionEvent,
    };
    if (selected) this.nodeSelect.emit(event);
    else this.nodeUnselect.emit(event);
  }

  handleNodeFocus(item: NeuralTreeFlatNode<T>): void {
    this.focusedKey.set(item.key);
  }

  handleNodeClick(item: NeuralTreeFlatNode<T>, event: MouseEvent): void {
    event.stopPropagation();
    this.focusedKey.set(item.key);
    (event.currentTarget as HTMLElement | null)?.focus({ preventScroll: true });
    this.selectNode(item, event);
  }

  handleToggleClick(item: NeuralTreeFlatNode<T>, event: MouseEvent): void {
    event.stopPropagation();
    this.focusNode(item.key);
    this.toggleNode(item, event);
  }

  handleVirtualScroll(event: Event): void {
    if (!this.virtualScroll()) return;
    this.virtualScrollTop.set((event.currentTarget as HTMLElement).scrollTop);
    this.virtualRangeChange.emit(this.virtualRange());
  }

  retryLazyLoad(item: NeuralTreeFlatNode<T>, event: MouseEvent): void {
    event.stopPropagation();
    this.requestedLazyKeys.delete(item.key);
    this.emitLazyLoad(item, event);
  }

  handleNodeKeydown(item: NeuralTreeFlatNode<T>, event: KeyboardEvent): void {
    if (event.target !== event.currentTarget) return;
    const target = event.currentTarget as HTMLElement;
    const rtl =
      target.closest('[dir]')?.getAttribute('dir') === 'rtl' ||
      getComputedStyle(target).direction === 'rtl';
    switch (event.key) {
      case 'ArrowDown':
        this.focusRelative(item.key, 1, event);
        return;
      case 'ArrowUp':
        this.focusRelative(item.key, -1, event);
        return;
      case 'Home':
        this.focusEdge('first', event);
        return;
      case 'End':
        this.focusEdge('last', event);
        return;
      case 'ArrowRight':
        this.handleHorizontalNavigation(
          item,
          rtl ? 'collapse' : 'expand',
          event,
        );
        return;
      case 'ArrowLeft':
        this.handleHorizontalNavigation(
          item,
          rtl ? 'expand' : 'collapse',
          event,
        );
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.selectionMode()) this.selectNode(item, event);
        else this.toggleNode(item, event);
        return;
      default:
        if (
          event.key.length === 1 &&
          !event.altKey &&
          !event.ctrlKey &&
          !event.metaKey
        ) {
          this.handleTypeahead(event, item.key);
        }
    }
  }

  ngOnDestroy(): void {
    this.clearTypeahead();
  }

  expandAll(): void {
    this.expandedKeys.set(collectExpandableTreeKeys(this.displayNodes()));
  }

  collapseAll(): void {
    const focused = this.treeIndex().get(this.focusedKey() ?? '');
    this.expandedKeys.set(new Set());
    const rootKey = focused?.path[0];
    if (rootKey !== undefined && rootKey !== focused?.key) {
      this.focusNode(rootKey);
    }
  }

  trackNode(index: number, item: NeuralTreeFlatNode<T>): unknown {
    return this.trackBy()?.(item.node, index) ?? item.key;
  }

  trackDataNode(index: number, node: NeuralTreeNode<T>): unknown {
    return this.trackBy()?.(node, index) ?? node.key;
  }

  visibleNode(key: NeuralTreeKey): NeuralTreeFlatNode<T> | undefined {
    return this.visibleNodeIndex().get(key);
  }

  toggleLabel(item: NeuralTreeFlatNode<T>): string {
    const template = item.expanded
      ? this.locale.messages().tree.collapse
      : this.locale.messages().tree.expand;
    return this.locale.format(template, {
      label: item.node.ariaLabel || item.node.label,
    });
  }

  isSelected(key: NeuralTreeKey): boolean {
    return this.selectionKeys().has(key);
  }

  checkboxState(key: NeuralTreeKey): NeuralTreeCheckboxState {
    return this.checkboxStates().get(key) ?? 'unchecked';
  }

  isPartiallySelected(key: NeuralTreeKey): boolean {
    return (
      this.selectionMode() === 'checkbox' &&
      this.checkboxState(key) === 'partial'
    );
  }

  isFilterMatch(key: NeuralTreeKey): boolean {
    return (
      !!this.filterValue().trim() && this.filterResult().matchedKeys.has(key)
    );
  }

  stateTemplateContext(label: string): {
    readonly $implicit: string;
    readonly label: string;
  } {
    return { $implicit: label, label };
  }

  nodeTemplateContext(item: NeuralTreeFlatNode<T>) {
    return {
      $implicit: item.node,
      item,
      selected: this.isSelected(item.key),
      partial: this.isPartiallySelected(item.key),
      expanded: item.expanded,
      level: item.level,
    };
  }

  togglerTemplateContext(item: NeuralTreeFlatNode<T>) {
    return {
      $implicit: item.node,
      item,
      expanded: item.expanded,
      loading: !!item.node.loading,
    };
  }

  iconTemplateContext(item: NeuralTreeFlatNode<T>) {
    return {
      $implicit: item.node,
      item,
      iconClass: item.node.iconClass ?? null,
    };
  }

  lazyErrorLabel(item: NeuralTreeFlatNode<T>): string {
    const error = item.node.error;
    return typeof error === 'string' && error.trim()
      ? error.trim()
      : this.locale.messages().tree.loadError;
  }

  ariaSelected(item: NeuralTreeFlatNode<T>): string | null {
    const mode = this.selectionMode();
    return mode === 'single' || mode === 'multiple'
      ? String(this.isSelected(item.key))
      : null;
  }

  ariaChecked(item: NeuralTreeFlatNode<T>): string | null {
    if (this.selectionMode() !== 'checkbox') return null;
    const state = this.checkboxState(item.key);
    return state === 'partial' ? 'mixed' : String(state === 'checked');
  }

  treeItemTabIndex(item: NeuralTreeFlatNode<T>): number | null {
    return !item.node.disabled && item.key === this.rovingKey() ? 0 : -1;
  }

  nodeClass(item: NeuralTreeFlatNode<T>): string {
    return this.compose(
      'neural-tree-node-root',
      'neural-tree-node-base',
      this.classes().node,
      item.node.styleClass,
    );
  }

  nodeContentClass(item: NeuralTreeFlatNode<T>): string {
    return this.compose(
      'neural-tree-node-content-root',
      [
        'neural-tree-node-content-base',
        this.isSelected(item.key)
          ? 'neural-tree-node-content-selected-base'
          : '',
        this.isPartiallySelected(item.key)
          ? 'neural-tree-node-content-partial-base'
          : '',
        this.isFilterMatch(item.key)
          ? 'neural-tree-node-content-match-base'
          : '',
      ].join(' '),
      this.classes().nodeContent,
      this.isSelected(item.key) ? this.classes().selectedNode : undefined,
      this.isPartiallySelected(item.key)
        ? this.classes().partialNode
        : undefined,
      this.isFilterMatch(item.key) ? this.classes().matchedNode : undefined,
    );
  }

  checkboxIconClass(item: NeuralTreeFlatNode<T>): string {
    const icon =
      this.checkboxState(item.key) === 'partial' ? 'nt-minus' : 'nt-check';
    return this.compose(
      `neural-tree-checkbox-icon-root nt ${icon}`,
      'neural-tree-checkbox-icon-base',
      this.classes().checkboxIcon,
    );
  }

  togglerIconClass(item: NeuralTreeFlatNode<T>): string {
    const icon = item.node.loading
      ? 'nt-loader-3 nt-spin'
      : item.expanded
        ? 'nt-chevron-down'
        : 'nt-chevron-right';
    return this.compose(
      `neural-tree-toggler-icon-root nt ${icon}`,
      'neural-tree-toggler-icon-base',
      this.classes().togglerIcon,
    );
  }

  nodeIconClass(item: NeuralTreeFlatNode<T>): string {
    return this.compose(
      `neural-tree-node-icon-root ${normalizeIconClass(item.node.iconClass ?? '')}`,
      'neural-tree-node-icon-base',
      this.classes().nodeIcon,
    );
  }

  private isNodeSelectable(node: NeuralTreeNode<T>): boolean {
    return (
      !node.disabled &&
      node.selectable !== false &&
      (this.selectableNode()?.(node) ?? true)
    );
  }

  private emitLazyLoad(item: NeuralTreeFlatNode<T>, nativeEvent?: Event): void {
    if (this.requestedLazyKeys.has(item.key)) return;
    this.requestedLazyKeys.add(item.key);
    this.lazyLoad.emit({
      node: item.node,
      key: item.key,
      level: item.level,
      expanded: true,
      path: item.path,
      ...(nativeEvent ? { nativeEvent } : {}),
    });
  }

  private navigableNodes(): readonly NeuralTreeFlatNode<T>[] {
    return this.visibleNodes().filter((item) => !item.node.disabled);
  }

  private focusRelative(
    key: NeuralTreeKey,
    offset: 1 | -1,
    event: KeyboardEvent,
  ): void {
    event.preventDefault();
    const nodes = this.navigableNodes();
    const index = nodes.findIndex((item) => item.key === key);
    const next = nodes[index + offset];
    if (next) this.focusNode(next.key);
  }

  private focusEdge(edge: 'first' | 'last', event: KeyboardEvent): void {
    event.preventDefault();
    const nodes = this.navigableNodes();
    const target = edge === 'first' ? nodes[0] : nodes[nodes.length - 1];
    if (target) this.focusNode(target.key);
  }

  private handleHorizontalNavigation(
    item: NeuralTreeFlatNode<T>,
    action: 'expand' | 'collapse',
    event: KeyboardEvent,
  ): void {
    event.preventDefault();
    if (action === 'expand') {
      if (!item.leaf && !item.expanded) {
        this.toggleNode(item, event);
        return;
      }
      const child = this.navigableNodes().find(
        (candidate) => candidate.parentKey === item.key,
      );
      if (child) this.focusNode(child.key);
      return;
    }
    if (!item.leaf && item.expanded) {
      this.toggleNode(item, event);
      return;
    }
    if (item.parentKey !== null) this.focusNode(item.parentKey);
  }

  private handleTypeahead(
    event: KeyboardEvent,
    currentKey: NeuralTreeKey,
  ): void {
    event.preventDefault();
    if (this.typeaheadTimer !== undefined) clearTimeout(this.typeaheadTimer);
    this.typeahead += normalizeNeuralOptionText(event.key, this.locale.code());
    this.typeaheadTimer = setTimeout(() => this.clearTypeahead(), 500);
    const nodes = this.navigableNodes();
    const currentIndex = nodes.findIndex((item) => item.key === currentKey);
    const ordered = [
      ...nodes.slice(currentIndex + 1),
      ...nodes.slice(0, currentIndex + 1),
    ];
    const match = ordered.find((item) =>
      normalizeNeuralOptionText(item.node.label, this.locale.code()).startsWith(
        this.typeahead,
      ),
    );
    if (match) this.focusNode(match.key);
  }

  private clearTypeahead(): void {
    if (this.typeaheadTimer !== undefined) clearTimeout(this.typeaheadTimer);
    this.typeaheadTimer = undefined;
    this.typeahead = '';
  }

  private focusNode(key: NeuralTreeKey): void {
    this.focusedKey.set(key);
    queueMicrotask(() => {
      const index = this.visibleNodes().findIndex((item) => item.key === key);
      const items =
        this.host.nativeElement.querySelectorAll<HTMLElement>(
          '[role="treeitem"]',
        );
      items[index]?.focus({ preventScroll: true });
    });
  }

  private selectVisibleRange(
    selection: Set<NeuralTreeKey>,
    anchor: NeuralTreeKey,
    target: NeuralTreeKey,
    additive: boolean,
  ): void {
    const visible = this.visibleNodes();
    const start = visible.findIndex((item) => item.key === anchor);
    const end = visible.findIndex((item) => item.key === target);
    if (!additive) selection.clear();
    if (start < 0 || end < 0) {
      selection.add(target);
      return;
    }
    const from = Math.min(start, end);
    const to = Math.max(start, end);
    for (const item of visible.slice(from, to + 1)) {
      if (this.isNodeSelectable(item.node)) selection.add(item.key);
    }
  }

  private setCheckboxBranch(
    selection: Set<NeuralTreeKey>,
    key: NeuralTreeKey,
    selected: boolean,
  ): void {
    const entry = this.treeIndex().get(key);
    if (!entry || !this.isNodeSelectable(entry.node)) return;
    if (selected) selection.add(key);
    else selection.delete(key);
    if (!this.propagateSelectionDown()) return;
    for (const childKey of entry.childKeys) {
      this.setCheckboxBranch(selection, childKey, selected);
    }
  }

  private normalizeCheckboxAncestors(
    selection: Set<NeuralTreeKey>,
    key: NeuralTreeKey,
  ): void {
    let parentKey = this.treeIndex().get(key)?.parentKey ?? null;
    while (parentKey !== null) {
      const parent = this.treeIndex().get(parentKey);
      if (!parent) break;
      const children = parent.childKeys
        .map((childKey) => this.treeIndex().get(childKey))
        .filter(
          (entry): entry is NonNullable<typeof entry> =>
            !!entry && this.isNodeSelectable(entry.node),
        );
      if (
        this.isNodeSelectable(parent.node) &&
        children.length > 0 &&
        children.every((child) => selection.has(child.key))
      ) {
        selection.add(parent.key);
      } else {
        selection.delete(parent.key);
      }
      parentKey = parent.parentKey;
    }
  }

  private computeCheckboxStates(
    selection: ReadonlySet<NeuralTreeKey>,
  ): ReadonlyMap<NeuralTreeKey, NeuralTreeCheckboxState> {
    const states = new Map<NeuralTreeKey, NeuralTreeCheckboxState>();
    const resolve = (key: NeuralTreeKey): NeuralTreeCheckboxState => {
      const cached = states.get(key);
      if (cached) return cached;
      const entry = this.treeIndex().get(key);
      if (!entry || !this.isNodeSelectable(entry.node)) return 'unchecked';
      const childStates = entry.childKeys
        .filter((childKey) => {
          const child = this.treeIndex().get(childKey);
          return !!child && this.isNodeSelectable(child.node);
        })
        .map(resolve);
      const own = selection.has(key);
      const state: NeuralTreeCheckboxState = own
        ? 'checked'
        : childStates.some((child) => child !== 'unchecked')
          ? 'partial'
          : 'unchecked';
      states.set(key, state);
      return state;
    };
    for (const key of this.treeIndex().keys()) resolve(key);
    return states;
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

/** @deprecated Import `NeuralTree` instead. */
export { NeuralTree as TreeComponent };

function normalizeIconClass(value: string): string {
  const classes = value.trim().split(/\s+/).filter(Boolean);
  if (
    classes.some(
      (className) => className === 'nt' || className.startsWith('nt-'),
    )
  ) {
    return classes.includes('nt')
      ? classes.join(' ')
      : `nt ${classes.join(' ')}`;
  }
  return classes.join(' ');
}
