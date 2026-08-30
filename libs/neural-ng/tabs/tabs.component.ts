import {
  APP_ID,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injectable,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChildren,
  effect,
  forwardRef,
  inject,
  input,
  isDevMode,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { NEURAL_NG_CONFIG } from '@neural-ng/core';
import type {
  NeuralTabsActivationMode,
  NeuralTabsClasses,
  NeuralTabsOrientation,
  NeuralTabValue,
} from './tabs.types';

@Injectable({ providedIn: 'root' })
class NeuralTabsIdGenerator {
  private readonly appId = inject(APP_ID);
  private nextId = 0;

  next(): string {
    return `${this.appId}-neural-tabs-${this.nextId++}`;
  }
}

@Component({
  selector: 'neural-tabs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-tabs-host' },
  template: `
    <div
      [class]="rootClass()"
      [attr.data-orientation]="orientation()"
      [attr.data-activation]="activationMode()"
    >
      <ng-content />
    </div>
  `,
  styles: `
    :where(.neural-tabs-host),
    :where(.neural-tabs-section-host) {
      display: contents;
    }

    :where(.neural-tabs-root) {
      box-sizing: border-box;
      display: flex;
      min-width: 0;
      flex-direction: column;
    }

    :where(.neural-tabs-root[data-orientation='vertical']) {
      flex-direction: row;
      align-items: stretch;
    }

    :where(.neural-tab-list-root) {
      box-sizing: border-box;
      display: flex;
      min-width: 0;
      max-width: 100%;
      overflow-x: auto;
      overflow-y: hidden;
      overscroll-behavior-inline: contain;
      scroll-snap-type: inline proximity;
      -webkit-overflow-scrolling: touch;
    }

    :where(.neural-tab-list-root[aria-orientation='vertical']) {
      flex-direction: column;
      overflow-x: hidden;
      overflow-y: auto;
      overscroll-behavior-block: contain;
      scroll-snap-type: block proximity;
    }

    :where(.neural-tab-root) {
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      min-width: 0;
      scroll-snap-align: nearest;
    }

    :where(.neural-tab-panels-root),
    :where(.neural-tab-panel-root) {
      box-sizing: border-box;
      min-width: 0;
    }

    :where(.neural-tab-panel-root[hidden]) {
      display: none !important;
    }

    :where(.neural-tabs-base) {
      gap: var(--neural-tabs-gap, 0);
      color: var(--neural-tabs-color, inherit);
      font-family: var(--neural-tabs-font-family, inherit);
    }

    :where(.neural-tabs-base[data-orientation='vertical']) {
      gap: var(--neural-tabs-vertical-gap, 1rem);
    }

    :where(.neural-tab-list-base) {
      gap: var(--neural-tabs-list-gap, 0.25rem);
      padding: var(--neural-tabs-list-padding, 0);
      border-bottom: var(--neural-tabs-list-border, none);
      scrollbar-color: var(--neural-tabs-scrollbar-color, currentColor)
        transparent;
      scrollbar-width: var(--neural-tabs-scrollbar-width, thin);
    }

    :where(.neural-tab-list-base[aria-orientation='vertical']) {
      border-bottom: 0;
      border-inline-end: var(--neural-tabs-list-border, none);
    }

    :where(.neural-tab-base) {
      position: relative;
      gap: var(--neural-tab-gap, 0.5rem);
      padding: var(--neural-tab-padding, 0.75rem 1rem);
      color: var(--neural-tab-color, inherit);
      background: var(--neural-tab-background, transparent);
      border: var(--neural-tab-border, 0);
      border-radius: var(--neural-tab-radius, 0.5rem 0.5rem 0 0);
      font: inherit;
      font-size: var(--neural-tab-font-size, 0.875rem);
      font-weight: var(--neural-tab-font-weight, 600);
      line-height: var(--neural-tab-line-height, 1.25);
      transition: var(--neural-tab-transition, all 150ms ease);
      cursor: pointer;
    }

    :where(.neural-tab-base)::after {
      position: absolute;
      inset-block-end: calc(-1 * var(--neural-tab-indicator-offset, 1px));
      inset-inline: var(--neural-tab-indicator-inset, 0.75rem);
      height: var(--neural-tab-indicator-size, 2px);
      background: var(--neural-tab-indicator-color, currentColor);
      border-radius: var(--neural-tab-indicator-radius, 999px);
      content: '';
      transform: scaleX(0);
      transform-origin: center;
      transition: transform var(--neural-tab-indicator-duration, 150ms)
        var(--neural-tab-indicator-easing, ease);
    }

    :where(
      .neural-tab-list-base[aria-orientation='vertical'] .neural-tab-base
    )::after {
      inset-block: var(--neural-tab-indicator-inset, 0.75rem);
      inset-inline-start: auto;
      inset-inline-end: calc(-1 * var(--neural-tab-indicator-offset, 1px));
      width: var(--neural-tab-indicator-size, 2px);
      height: auto;
      transform: scaleY(0);
    }

    :where(.neural-tab-base:hover:not(:disabled)) {
      color: var(--neural-tab-color-hover, inherit);
      background: var(--neural-tab-background-hover, transparent);
      border-color: var(--neural-tab-border-color-hover, transparent);
    }

    :where(.neural-tab-base:focus-visible) {
      outline: var(--neural-tab-focus-ring, 2px solid currentColor);
      outline-offset: var(--neural-tab-focus-ring-offset, 2px);
    }

    :where(.neural-tab-active-base) {
      color: var(--neural-tab-active-color, inherit);
      background: var(--neural-tab-active-background, transparent);
      border-color: var(--neural-tab-active-border-color, currentColor);
    }

    :where(.neural-tab-active-base)::after {
      transform: scaleX(1);
    }

    :where(
      .neural-tab-list-base[aria-orientation='vertical'] .neural-tab-active-base
    )::after {
      transform: scaleY(1);
    }

    :where(.neural-tab-disabled-base) {
      opacity: var(--neural-tab-disabled-opacity, 0.5);
      cursor: not-allowed;
    }

    :where(.neural-tab-icon) {
      flex: 0 0 auto;
    }

    :where(.neural-tab-panels-base) {
      flex: 1 1 auto;
    }

    :where(.neural-tab-panel-base) {
      padding: var(--neural-tab-panel-padding, 1rem 0);
      color: var(--neural-tab-panel-color, inherit);
      outline: none;
    }

    :where(.neural-tab-panel-base:not([hidden])) {
      animation: neural-tab-panel-enter
        var(--neural-tab-panel-enter-duration, 160ms)
        var(--neural-tab-panel-enter-easing, ease-out) both;
    }

    :where(.neural-tab-panel-base:focus-visible) {
      outline: var(--neural-tab-focus-ring, 2px solid currentColor);
      outline-offset: var(--neural-tab-focus-ring-offset, 2px);
    }

    @keyframes neural-tab-panel-enter {
      from {
        opacity: 0;
        transform: translateY(var(--neural-tab-panel-enter-distance, 0.25rem));
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      :where(.neural-tab-base),
      :where(.neural-tab-base)::after {
        transition-duration: 0.01ms !important;
      }

      :where(.neural-tab-panel-base:not([hidden])) {
        animation: none;
      }
    }
  `,
})
export class NeuralTabs {
  private readonly neuralConfig = inject(NEURAL_NG_CONFIG);
  private readonly generatedId = inject(NeuralTabsIdGenerator).next();
  private readonly focusedValue = signal<NeuralTabValue | null>(null);
  private lastValidationSignature = '';
  private compositionValidationScheduled = false;

  readonly value = model<NeuralTabValue | null>(null);
  readonly orientation = input<NeuralTabsOrientation>('horizontal');
  readonly activationMode = input<NeuralTabsActivationMode>('automatic');
  readonly tabsId = input(this.generatedId);
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly tabsClass = input('');
  readonly classes = input<NeuralTabsClasses>({});

  readonly tabs = contentChildren<NeuralTab>(
    forwardRef(() => NeuralTab),
    { descendants: true },
  );
  readonly panels = contentChildren<NeuralTabPanel>(
    forwardRef(() => NeuralTabPanel),
    { descendants: true },
  );
  readonly initializedTabs = computed(() =>
    this.tabs().filter((tab) => tab.isInitialized()),
  );
  readonly initializedPanels = computed(() =>
    this.panels().filter((panel) => panel.isInitialized()),
  );
  readonly enabledTabs = computed(() =>
    this.initializedTabs().filter((tab) => !tab.disabled()),
  );
  readonly effectiveValue = computed<NeuralTabValue | null>(() => {
    const current = this.value();
    const initializedTabs = this.initializedTabs();
    if (initializedTabs.length === 0) return current;
    const selected = initializedTabs.find(
      (tab) => !tab.disabled() && Object.is(tab.value(), current),
    );
    return selected?.value() ?? this.enabledTabs()[0]?.value() ?? null;
  });
  readonly rovingValue = computed<NeuralTabValue | null>(() => {
    const focused = this.focusedValue();
    return this.enabledTabs().some((tab) => Object.is(tab.value(), focused))
      ? focused
      : this.effectiveValue();
  });
  readonly effectiveUnstyled = computed(
    () => this.unstyled() || this.neuralConfig.unstyled,
  );
  readonly rootClass = computed(() =>
    this.composeClass(
      'neural-tabs-root',
      'neural-tabs-base',
      this.tabsClass(),
      this.classes().root,
    ),
  );

  constructor() {
    effect(() => {
      const resolvedValue = this.effectiveValue();
      if (!Object.is(this.value(), resolvedValue)) {
        this.value.set(resolvedValue);
      }
      if (
        !this.enabledTabs().some((tab) =>
          Object.is(tab.value(), this.focusedValue()),
        )
      ) {
        this.focusedValue.set(resolvedValue);
      }
    });

    effect(() => {
      if (!isDevMode()) return;
      this.initializedTabs();
      this.initializedPanels();
      this.scheduleCompositionValidation();
    });
  }

  isActive(value: NeuralTabValue): boolean {
    return Object.is(this.effectiveValue(), value);
  }

  isRoving(value: NeuralTabValue): boolean {
    return Object.is(this.rovingValue(), value);
  }

  tabId(value: NeuralTabValue): string {
    return `${this.normalizedId()}-tab-${this.indexFor(value)}`;
  }

  panelId(value: NeuralTabValue): string {
    return `${this.normalizedId()}-panel-${this.indexFor(value)}`;
  }

  select(tab: NeuralTab): void {
    if (tab.disabled()) return;
    this.focusedValue.set(tab.value());
    this.value.set(tab.value());
  }

  noteFocus(tab: NeuralTab): void {
    if (tab.disabled()) return;
    this.focusedValue.set(tab.value());
    if (this.activationMode() === 'automatic') {
      this.value.set(tab.value());
    }
  }

  handleKeydown(event: KeyboardEvent, current: NeuralTab): void {
    if (current.disabled()) return;
    const tabs = this.enabledTabs();
    const currentIndex = tabs.indexOf(current);
    if (currentIndex < 0) return;

    let targetIndex: number | null = null;
    const isVertical = this.orientation() === 'vertical';
    const isRtl = this.isRtl(event.currentTarget);

    if (event.key === 'Home') targetIndex = 0;
    if (event.key === 'End') targetIndex = tabs.length - 1;
    if (isVertical && event.key === 'ArrowDown') {
      targetIndex = (currentIndex + 1) % tabs.length;
    }
    if (isVertical && event.key === 'ArrowUp') {
      targetIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    }
    if (!isVertical && event.key === 'ArrowRight') {
      targetIndex =
        (currentIndex + (isRtl ? -1 : 1) + tabs.length) % tabs.length;
    }
    if (!isVertical && event.key === 'ArrowLeft') {
      targetIndex =
        (currentIndex + (isRtl ? 1 : -1) + tabs.length) % tabs.length;
    }

    if (targetIndex !== null) {
      event.preventDefault();
      const target = tabs[targetIndex];
      this.focusedValue.set(target.value());
      if (this.activationMode() === 'automatic') {
        this.value.set(target.value());
      }
      target.focus();
      return;
    }

    if (
      this.activationMode() === 'manual' &&
      (event.key === 'Enter' || event.key === ' ')
    ) {
      event.preventDefault();
      this.select(current);
    }
  }

  composeSlotClass(
    slot: Exclude<keyof NeuralTabsClasses, 'root'>,
    structural: string,
    visual: string,
    localClass = '',
    stateClass = '',
  ): string {
    return this.composeClass(
      structural,
      visual,
      this.classes()[slot],
      localClass,
      stateClass,
    );
  }

  private normalizedId(): string {
    return this.tabsId().trim().replace(/\s+/g, '-') || this.generatedId;
  }

  private indexFor(value: NeuralTabValue): number {
    const index = this.initializedTabs().findIndex((tab) =>
      Object.is(tab.value(), value),
    );
    return index < 0 ? 0 : index;
  }

  private isRtl(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) return false;
    const view = target.ownerDocument.defaultView;
    return view?.getComputedStyle(target).direction === 'rtl';
  }

  private scheduleCompositionValidation(): void {
    if (this.compositionValidationScheduled) return;
    this.compositionValidationScheduled = true;

    queueMicrotask(() => {
      this.compositionValidationScheduled = false;
      this.validateComposition(
        this.initializedTabs().map((tab) => tab.value()),
        this.initializedPanels().map((panel) => panel.value()),
      );
    });
  }

  private validateComposition(
    tabValues: readonly NeuralTabValue[],
    panelValues: readonly NeuralTabValue[],
  ): void {
    if (tabValues.length === 0 && panelValues.length === 0) return;

    const issues = [
      ...duplicateValues(tabValues).map(
        (value) => `duplicate tab value ${formatValue(value)}`,
      ),
      ...duplicateValues(panelValues).map(
        (value) => `duplicate panel value ${formatValue(value)}`,
      ),
      ...uniqueValues(tabValues)
        .filter(
          (value) => !panelValues.some((panel) => Object.is(panel, value)),
        )
        .map((value) => `tab ${formatValue(value)} has no matching panel`),
      ...uniqueValues(panelValues)
        .filter((value) => !tabValues.some((tab) => Object.is(tab, value)))
        .map((value) => `panel ${formatValue(value)} has no matching tab`),
    ];
    const signature = issues.join('|');
    if (!signature) {
      this.lastValidationSignature = '';
      return;
    }
    if (signature === this.lastValidationSignature) return;

    this.lastValidationSignature = signature;
    console.warn(`[NeuralNg Tabs] Invalid composition: ${issues.join('; ')}.`);
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

@Component({
  selector: 'neural-tab-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-tabs-section-host' },
  template: `
    <div
      role="tablist"
      [class]="computedClass()"
      [attr.aria-label]="effectiveAriaLabel()"
      [attr.aria-labelledby]="normalizedAriaLabelledby()"
      [attr.aria-orientation]="tabs.orientation()"
    >
      <ng-content />
    </div>
  `,
})
export class NeuralTabList {
  protected readonly tabs = inject(NeuralTabs, { host: true });
  readonly ariaLabel = input('Tabs');
  readonly ariaLabelledby = input<string | null>(null);
  readonly listClass = input('');

  readonly normalizedAriaLabelledby = computed(
    () => this.ariaLabelledby()?.trim() || null,
  );
  readonly effectiveAriaLabel = computed(() =>
    this.normalizedAriaLabelledby() ? null : this.ariaLabel().trim() || 'Tabs',
  );
  readonly computedClass = computed(() =>
    this.tabs.composeSlotClass(
      'list',
      'neural-tab-list-root',
      'neural-tab-list-base',
      this.listClass(),
    ),
  );
}

@Component({
  selector: 'neural-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-tabs-section-host' },
  template: `
    <button
      #button
      type="button"
      role="tab"
      [id]="tabs.tabId(value())"
      [class]="computedClass()"
      [disabled]="disabled()"
      [attr.aria-disabled]="disabled() ? 'true' : null"
      [attr.aria-selected]="tabs.isActive(value())"
      [attr.aria-controls]="tabs.panelId(value())"
      [tabIndex]="tabs.isRoving(value()) && !disabled() ? 0 : -1"
      (click)="tabs.select(this)"
      (focus)="tabs.noteFocus(this)"
      (keydown)="tabs.handleKeydown($event, this)"
    >
      @if (iconClass().trim()) {
        <i [class]="computedIconClass()" aria-hidden="true"></i>
      }
      <ng-content />
    </button>
  `,
})
export class NeuralTab {
  protected readonly tabs = inject(NeuralTabs, { host: true });
  private readonly button =
    viewChild.required<ElementRef<HTMLButtonElement>>('button');

  private readonly initialized = signal(false);
  readonly value = input.required<NeuralTabValue>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly iconClass = input('');
  readonly tabClass = input('');

  readonly computedClass = computed(() =>
    this.tabs.composeSlotClass(
      'tab',
      'neural-tab-root',
      'neural-tab-base',
      this.tabClass(),
      [
        this.tabs.isActive(this.value())
          ? this.tabs.composeSlotClass(
              'activeTab',
              'neural-tab-active-root',
              'neural-tab-active-base',
            )
          : '',
        this.disabled()
          ? this.tabs.composeSlotClass(
              'disabledTab',
              'neural-tab-disabled-root',
              'neural-tab-disabled-base',
            )
          : '',
      ]
        .filter(Boolean)
        .join(' '),
    ),
  );
  readonly computedIconClass = computed(() =>
    joinClasses('neural-tab-icon', normalizeIconClass(this.iconClass().trim())),
  );

  ngOnInit(): void {
    this.initialized.set(true);
  }

  isInitialized(): boolean {
    return this.initialized();
  }

  focus(): void {
    this.button().nativeElement.focus();
  }
}

@Component({
  selector: 'neural-tab-panels',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-tabs-section-host' },
  template: `<div [class]="computedClass()"><ng-content /></div>`,
})
export class NeuralTabPanels {
  private readonly tabs = inject(NeuralTabs, { host: true });
  readonly panelsClass = input('');
  readonly computedClass = computed(() =>
    this.tabs.composeSlotClass(
      'panels',
      'neural-tab-panels-root',
      'neural-tab-panels-base',
      this.panelsClass(),
    ),
  );
}

@Component({
  selector: 'neural-tab-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-tabs-section-host' },
  template: `
    <section
      role="tabpanel"
      [id]="tabs.panelId(value())"
      [class]="computedClass()"
      [hidden]="!tabs.isActive(value())"
      [attr.aria-labelledby]="tabs.tabId(value())"
      [tabIndex]="tabs.isActive(value()) && focusable() ? 0 : -1"
    >
      <ng-content />
    </section>
  `,
})
export class NeuralTabPanel {
  protected readonly tabs = inject(NeuralTabs, { host: true });
  private readonly initialized = signal(false);
  readonly value = input.required<NeuralTabValue>();
  readonly focusable = input(true, { transform: booleanAttribute });
  readonly panelClass = input('');
  readonly computedClass = computed(() =>
    this.tabs.composeSlotClass(
      'panel',
      'neural-tab-panel-root',
      'neural-tab-panel-base',
      this.panelClass(),
    ),
  );

  ngOnInit(): void {
    this.initialized.set(true);
  }

  isInitialized(): boolean {
    return this.initialized();
  }
}

function normalizeIconClass(value: string): string {
  if (!value) return '';
  const classes = value.split(/\s+/);
  const usesNeuralIcon = classes.some((className) =>
    className.startsWith('nt-'),
  );
  return usesNeuralIcon && !classes.includes('nt') ? `nt ${value}` : value;
}

function joinClasses(...classes: string[]): string {
  return classes
    .map((value) => value.trim())
    .filter(Boolean)
    .join(' ');
}

function uniqueValues(
  values: readonly NeuralTabValue[],
): readonly NeuralTabValue[] {
  return values.filter(
    (value, index) =>
      values.findIndex((candidate) => Object.is(candidate, value)) === index,
  );
}

function duplicateValues(
  values: readonly NeuralTabValue[],
): readonly NeuralTabValue[] {
  return uniqueValues(values).filter(
    (value) =>
      values.filter((candidate) => Object.is(candidate, value)).length > 1,
  );
}

function formatValue(value: NeuralTabValue): string {
  return typeof value === 'string' ? `"${value}"` : `${value}`;
}

/** @deprecated Import and use `NeuralTabs` instead. */
export { NeuralTabs as TabsComponent };
/** @deprecated Import and use `NeuralTabList` instead. */
export { NeuralTabList as TabListComponent };
/** @deprecated Import and use `NeuralTab` instead. */
export { NeuralTab as TabComponent };
/** @deprecated Import and use `NeuralTabPanels` instead. */
export { NeuralTabPanels as TabPanelsComponent };
/** @deprecated Import and use `NeuralTabPanel` instead. */
export { NeuralTabPanel as TabPanelComponent };
