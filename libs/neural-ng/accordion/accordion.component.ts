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
  forwardRef,
  inject,
  input,
  isDevMode,
  model,
  output,
  viewChild,
  viewChildren,
} from '@angular/core';
import { NEURAL_NG_CONFIG } from '@neural-ng/core';
import type {
  NeuralAccordionClasses,
  NeuralAccordionInteractionSource,
  NeuralAccordionModelValue,
  NeuralAccordionPanelChange,
  NeuralAccordionValue,
  NeuralResolvedAccordionItem,
} from './accordion.types';

@Injectable({ providedIn: 'root' })
class NeuralAccordionIdGenerator {
  private readonly appId = inject(APP_ID);
  private nextId = 0;

  next(): string {
    return `${this.appId}-neural-accordion-${this.nextId++}`;
  }
}

@Component({
  selector: 'neural-accordion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-accordion-host' },
  template: `
    <div [id]="normalizedId()" [class]="rootClass()">
      @if (dataItems().length > 0) {
        @for (item of dataItems(); track item.value; let index = $index) {
          <section
            [class]="panelClass(item.disabled, isExpanded(item.value))"
            [attr.data-expanded]="isExpanded(item.value) ? 'true' : null"
            [attr.data-disabled]="
              effectiveDisabled(item.disabled) ? 'true' : null
            "
          >
            <h3 [class]="headerClass()">
              <button
                #dataTrigger
                type="button"
                [id]="triggerId(index)"
                [class]="triggerClass()"
                [disabled]="effectiveDisabled(item.disabled)"
                [attr.aria-expanded]="isExpanded(item.value)"
                [attr.aria-controls]="contentId(index)"
                (click)="toggleData(item, interactionSource($event))"
                (keydown)="handleKeydown($event, index)"
              >
                <span [class]="labelClass()">{{ item.label }}</span>
                <span
                  [class]="iconClass(isExpanded(item.value))"
                  aria-hidden="true"
                ></span>
              </button>
            </h3>
            <div
              role="region"
              [id]="contentId(index)"
              [class]="contentClass(isExpanded(item.value))"
              [attr.aria-labelledby]="triggerId(index)"
              [attr.aria-hidden]="!isExpanded(item.value)"
              [attr.inert]="isExpanded(item.value) ? null : ''"
            >
              <div class="neural-accordion-content-clip-root">
                <div [class]="contentInnerClass()">{{ item.content }}</div>
              </div>
            </div>
          </section>
        }
      } @else {
        <ng-content />
      }
    </div>
  `,
  styles: `
    :where(.neural-accordion-host),
    :where(.neural-accordion-section-host) {
      display: contents;
    }

    :where(.neural-accordion-root),
    :where(.neural-accordion-panel-root),
    :where(.neural-accordion-header-root),
    :where(.neural-accordion-content-root),
    :where(.neural-accordion-content-clip-root),
    :where(.neural-accordion-content-inner-root) {
      box-sizing: border-box;
      min-width: 0;
    }

    :where(.neural-accordion-root) {
      display: flex;
      flex-direction: column;
    }

    :where(.neural-accordion-header-root) {
      margin: 0;
    }

    :where(.neural-accordion-trigger-root) {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      min-width: 0;
      text-align: start;
    }

    :where(.neural-accordion-label-root) {
      min-width: 0;
    }

    :where(.neural-accordion-icon-root) {
      flex: 0 0 auto;
    }

    :where(.neural-accordion-content-root) {
      display: grid;
      grid-template-rows: 0fr;
      visibility: hidden;
    }

    :where(.neural-accordion-content-expanded-root) {
      grid-template-rows: 1fr;
      visibility: visible;
    }

    :where(.neural-accordion-content-clip-root) {
      min-height: 0;
      overflow: hidden;
    }

    :where(.neural-accordion-base) {
      gap: var(--neural-accordion-gap, 0.5rem);
      color: var(--neural-accordion-color, inherit);
      font-family: var(--neural-accordion-font-family, inherit);
    }

    :where(.neural-accordion-panel-base) {
      overflow: clip;
      background: var(--neural-accordion-panel-background, transparent);
      border: var(--neural-accordion-panel-border, 1px solid currentColor);
      border-radius: var(--neural-accordion-panel-radius, 0.5rem);
      box-shadow: var(--neural-accordion-panel-shadow, none);
      transition: var(--neural-accordion-panel-transition, none);
    }

    :where(.neural-accordion-panel-expanded-base) {
      background: var(
        --neural-accordion-panel-background-expanded,
        transparent
      );
      border-color: var(
        --neural-accordion-panel-border-color-expanded,
        currentColor
      );
      box-shadow: var(--neural-accordion-panel-shadow-expanded, none);
    }

    :where(.neural-accordion-panel-disabled-base) {
      opacity: var(--neural-accordion-disabled-opacity, 0.5);
    }

    :where(.neural-accordion-trigger-base) {
      gap: var(--neural-accordion-trigger-gap, 0.75rem);
      padding: var(--neural-accordion-trigger-padding, 1rem);
      color: var(--neural-accordion-trigger-color, inherit);
      background: var(--neural-accordion-trigger-background, transparent);
      border: 0;
      font: inherit;
      font-size: var(--neural-accordion-trigger-font-size, 0.9375rem);
      font-weight: var(--neural-accordion-trigger-font-weight, 650);
      line-height: var(--neural-accordion-trigger-line-height, 1.35);
      cursor: pointer;
      transition: var(--neural-accordion-trigger-transition, none);
    }

    :where(.neural-accordion-trigger-base:hover:not(:disabled)) {
      color: var(--neural-accordion-trigger-color-hover, inherit);
      background: var(--neural-accordion-trigger-background-hover, transparent);
    }

    :where(.neural-accordion-trigger-base[aria-expanded='true']) {
      color: var(
        --neural-accordion-trigger-color-expanded,
        var(--neural-accordion-trigger-color, inherit)
      );
      background: var(
        --neural-accordion-trigger-background-expanded,
        var(--neural-accordion-trigger-background, transparent)
      );
    }

    :where(.neural-accordion-trigger-base:focus-visible) {
      outline: var(--neural-accordion-focus-ring, 2px solid currentColor);
      outline-offset: var(--neural-accordion-focus-ring-offset, -2px);
    }

    :where(.neural-accordion-trigger-base:disabled) {
      cursor: not-allowed;
    }

    :where(.neural-accordion-icon-base) {
      width: var(--neural-accordion-icon-size, 0.625rem);
      height: var(--neural-accordion-icon-size, 0.625rem);
      color: var(--neural-accordion-icon-color, currentColor);
      border: solid currentColor;
      border-width: 0 0.125rem 0.125rem 0;
      transform: rotate(45deg);
      transition: transform var(--neural-accordion-icon-duration, 160ms)
        var(--neural-accordion-icon-easing, ease);
    }

    :where(.neural-accordion-icon-expanded-base) {
      color: var(
        --neural-accordion-icon-color-expanded,
        var(--neural-accordion-icon-color, currentColor)
      );
      transform: rotate(-135deg);
    }

    :where(.neural-accordion-content-base) {
      transition:
        grid-template-rows var(--neural-accordion-content-duration, 180ms)
          var(--neural-accordion-content-easing, ease),
        visibility 0s var(--neural-accordion-content-duration, 180ms);
    }

    :where(.neural-accordion-content-expanded-base) {
      transition:
        grid-template-rows var(--neural-accordion-content-duration, 180ms)
          var(--neural-accordion-content-easing, ease),
        visibility 0s;
    }

    :where(.neural-accordion-content-inner-base) {
      padding: var(--neural-accordion-content-padding, 0 1rem 1rem);
      color: var(--neural-accordion-content-color, inherit);
      font-size: var(--neural-accordion-content-font-size, 0.875rem);
      line-height: var(--neural-accordion-content-line-height, 1.55);
    }

    @media (prefers-reduced-motion: reduce) {
      :where(.neural-accordion-panel-base),
      :where(.neural-accordion-trigger-base),
      :where(.neural-accordion-icon-base),
      :where(.neural-accordion-content-base) {
        transition-duration: 0.01ms !important;
      }
    }
  `,
})
export class NeuralAccordion<TItem = unknown> {
  private readonly neuralConfig = inject(NEURAL_NG_CONFIG);
  private readonly generatedId = inject(NeuralAccordionIdGenerator).next();
  private warnedAboutMixedSources = false;
  private warnedAboutDuplicates = false;
  private readonly dataTriggers =
    viewChildren<ElementRef<HTMLButtonElement>>('dataTrigger');

  readonly items = input<readonly TItem[]>([]);
  readonly itemLabel = input('label');
  readonly itemValue = input('value');
  readonly itemContent = input('content');
  readonly itemDisabled = input('disabled');
  readonly value = model<NeuralAccordionModelValue>(null);
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly collapsible = input(true, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly accordionId = input(this.generatedId);
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly accordionClass = input('');
  readonly classes = input<NeuralAccordionClasses>({});
  readonly panels = contentChildren<NeuralAccordionPanel>(
    forwardRef(() => NeuralAccordionPanel),
  );
  readonly headers = contentChildren<NeuralAccordionHeader>(
    forwardRef(() => NeuralAccordionHeader),
    { descendants: true },
  );
  readonly panelChange = output<NeuralAccordionPanelChange>();

  readonly effectiveUnstyled = computed(
    () => this.unstyled() || this.neuralConfig.unstyled,
  );
  readonly normalizedId = computed(
    () => this.accordionId().trim().replace(/\s+/g, '-') || this.generatedId,
  );
  readonly dataItems = computed<readonly NeuralResolvedAccordionItem<TItem>[]>(
    () => {
      const items = this.items();
      if (items.length > 0 && this.panels().length > 0) {
        this.warnAboutMixedSources();
      }
      const resolved = items.map((item, index) => {
        const rawValue = readProperty(item, this.itemValue());
        const value =
          typeof rawValue === 'string' || typeof rawValue === 'number'
            ? rawValue
            : index;
        return {
          value,
          label: String(readProperty(item, this.itemLabel()) ?? item),
          content: String(readProperty(item, this.itemContent()) ?? ''),
          disabled: Boolean(readProperty(item, this.itemDisabled()) ?? false),
          source: item,
        };
      });
      this.warnAboutDuplicateValues(resolved.map((item) => item.value));
      return resolved;
    },
  );
  readonly rootClass = computed(() =>
    this.compose(
      'neural-accordion-root',
      'neural-accordion-base',
      this.accordionClass(),
      this.classes().root,
    ),
  );

  isExpanded(panelValue: NeuralAccordionValue): boolean {
    return this.openValues().some((value) => Object.is(value, panelValue));
  }

  effectiveDisabled(panelDisabled: boolean): boolean {
    return this.disabled() || panelDisabled;
  }

  toggleData(
    item: NeuralResolvedAccordionItem<TItem>,
    source: NeuralAccordionInteractionSource,
  ): void {
    if (this.effectiveDisabled(item.disabled)) return;
    this.commit(item.value, source);
  }

  toggleProjected(
    panel: NeuralAccordionPanel,
    source: NeuralAccordionInteractionSource,
  ): void {
    if (this.effectiveDisabled(panel.disabled())) return;
    this.commit(panel.value(), source);
  }

  handleKeydown(event: KeyboardEvent, index: number): void {
    const entries = this.entryList();
    if (entries[index]?.disabled) return;
    let target = -1;
    if (event.key === 'ArrowDown') target = this.nextEnabled(index, 1);
    else if (event.key === 'ArrowUp') target = this.nextEnabled(index, -1);
    else if (event.key === 'Home') target = this.nextEnabled(-1, 1, false);
    else if (event.key === 'End') {
      target = this.nextEnabled(entries.length, -1, false);
    }
    if (target < 0) return;
    event.preventDefault();
    this.focusAt(target);
  }

  interactionSource(event: MouseEvent): NeuralAccordionInteractionSource {
    return event.detail === 0 ? 'keyboard' : 'pointer';
  }

  projectedIndex(panel: NeuralAccordionPanel): number {
    return this.panels().indexOf(panel);
  }

  triggerId(index: number): string {
    return `${this.normalizedId()}-trigger-${index}`;
  }

  contentId(index: number): string {
    return `${this.normalizedId()}-content-${index}`;
  }

  panelClass(disabled: boolean, expanded: boolean, localClass = ''): string {
    return this.compose(
      'neural-accordion-panel-root',
      [
        'neural-accordion-panel-base',
        expanded ? 'neural-accordion-panel-expanded-base' : '',
        disabled ? 'neural-accordion-panel-disabled-base' : '',
      ].join(' '),
      this.classes().panel,
      expanded ? this.classes().expandedPanel : '',
      disabled ? this.classes().disabledPanel : '',
      localClass,
    );
  }

  headerClass(localClass = ''): string {
    return this.compose(
      'neural-accordion-header-root',
      'neural-accordion-header-base',
      this.classes().header,
      localClass,
    );
  }

  triggerClass(localClass = ''): string {
    return this.compose(
      'neural-accordion-trigger-root',
      'neural-accordion-trigger-base',
      this.classes().trigger,
      localClass,
    );
  }

  labelClass(): string {
    return this.compose(
      'neural-accordion-label-root',
      'neural-accordion-label-base',
      this.classes().label,
    );
  }

  iconClass(expanded: boolean): string {
    return this.compose(
      'neural-accordion-icon-root',
      `neural-accordion-icon-base ${
        expanded ? 'neural-accordion-icon-expanded-base' : ''
      }`,
      this.classes().icon,
    );
  }

  contentClass(expanded: boolean, localClass = ''): string {
    return this.compose(
      `neural-accordion-content-root ${
        expanded ? 'neural-accordion-content-expanded-root' : ''
      }`,
      `neural-accordion-content-base ${
        expanded ? 'neural-accordion-content-expanded-base' : ''
      }`,
      this.classes().content,
      localClass,
    );
  }

  contentInnerClass(): string {
    return this.compose(
      'neural-accordion-content-inner-root',
      'neural-accordion-content-inner-base',
      this.classes().contentInner,
    );
  }

  private openValues(): readonly NeuralAccordionValue[] {
    const current = this.value();
    return Array.isArray(current)
      ? current
      : current === null
        ? []
        : [current as NeuralAccordionValue];
  }

  private commit(
    panelValue: NeuralAccordionValue,
    source: NeuralAccordionInteractionSource,
  ): void {
    const previousValue = this.value();
    const expanded = this.isExpanded(panelValue);
    let nextValue: NeuralAccordionModelValue;

    if (this.multiple()) {
      const current = this.openValues();
      nextValue = expanded
        ? current.filter((value) => !Object.is(value, panelValue))
        : [...current, panelValue];
    } else if (expanded) {
      if (!this.collapsible()) return;
      nextValue = null;
    } else {
      nextValue = panelValue;
    }

    this.value.set(nextValue);
    this.panelChange.emit({
      panelValue,
      expanded: !expanded,
      value: nextValue,
      previousValue,
      source,
    });
  }

  private entryList(): readonly { disabled: boolean }[] {
    if (this.dataItems().length > 0) {
      return this.dataItems().map((item) => ({
        disabled: this.effectiveDisabled(item.disabled),
      }));
    }
    return this.panels().map((panel) => ({
      disabled: this.effectiveDisabled(panel.disabled()),
    }));
  }

  private focusAt(index: number): void {
    const data = this.dataTriggers()[index];
    if (data) {
      data.nativeElement.focus();
      return;
    }
    this.headers()[index]?.focus();
  }

  private nextEnabled(current: number, direction: 1 | -1, wrap = true): number {
    const entries = this.entryList();
    if (entries.length === 0) return -1;
    let index = current;
    for (let count = 0; count < entries.length; count += 1) {
      index += direction;
      if (wrap) index = (index + entries.length) % entries.length;
      else if (index < 0 || index >= entries.length) return -1;
      if (!entries[index]?.disabled) return index;
    }
    return -1;
  }

  private warnAboutMixedSources(): void {
    if (!isDevMode() || this.warnedAboutMixedSources) return;
    this.warnedAboutMixedSources = true;
    console.warn(
      'NeuralNg Accordion: use either [items] or neural-accordion-panel children. [items] is used when both are present.',
    );
  }

  private warnAboutDuplicateValues(
    values: readonly NeuralAccordionValue[],
  ): void {
    if (!isDevMode() || this.warnedAboutDuplicates) return;
    const duplicate = values.find(
      (value, index) =>
        values.findIndex((candidate) => Object.is(candidate, value)) !== index,
    );
    if (duplicate === undefined) return;
    this.warnedAboutDuplicates = true;
    console.warn(
      `NeuralNg Accordion: duplicate panel value "${duplicate}". Values must be unique.`,
    );
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

@Component({
  selector: 'neural-accordion-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-accordion-section-host' },
  template: `
    <section
      [class]="computedClass()"
      [attr.data-expanded]="expanded() ? 'true' : null"
      [attr.data-disabled]="effectiveDisabled() ? 'true' : null"
    >
      <ng-content />
    </section>
  `,
})
export class NeuralAccordionPanel {
  protected readonly accordion = inject(NeuralAccordion, { host: true });
  readonly value = input.required<NeuralAccordionValue>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly panelClass = input('');
  readonly expanded = computed(() => this.accordion.isExpanded(this.value()));
  readonly effectiveDisabled = computed(() =>
    this.accordion.effectiveDisabled(this.disabled()),
  );
  readonly computedClass = computed(() =>
    this.accordion.panelClass(
      this.effectiveDisabled(),
      this.expanded(),
      this.panelClass(),
    ),
  );
}

@Component({
  selector: 'neural-accordion-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-accordion-section-host' },
  template: `
    <h3 [class]="computedHeaderClass()">
      <button
        #trigger
        type="button"
        [id]="triggerId()"
        [class]="computedTriggerClass()"
        [disabled]="panel.effectiveDisabled()"
        [attr.aria-expanded]="panel.expanded()"
        [attr.aria-controls]="contentId()"
        (click)="
          accordion.toggleProjected(panel, accordion.interactionSource($event))
        "
        (keydown)="accordion.handleKeydown($event, index())"
      >
        <span [class]="accordion.labelClass()"><ng-content /></span>
        <span
          [class]="accordion.iconClass(panel.expanded())"
          aria-hidden="true"
        ></span>
      </button>
    </h3>
  `,
})
export class NeuralAccordionHeader {
  protected readonly accordion = inject(NeuralAccordion, { host: true });
  protected readonly panel = inject(NeuralAccordionPanel, { host: true });
  private readonly trigger =
    viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  readonly headerClass = input('');
  readonly triggerClass = input('');
  readonly index = computed(() => this.accordion.projectedIndex(this.panel));
  readonly triggerId = computed(() => this.accordion.triggerId(this.index()));
  readonly contentId = computed(() => this.accordion.contentId(this.index()));
  readonly computedHeaderClass = computed(() =>
    this.accordion.headerClass(this.headerClass()),
  );
  readonly computedTriggerClass = computed(() =>
    this.accordion.triggerClass(this.triggerClass()),
  );

  focus(): void {
    this.trigger().nativeElement.focus();
  }
}

@Component({
  selector: 'neural-accordion-content',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-accordion-section-host' },
  template: `
    <div
      role="region"
      [id]="contentId()"
      [class]="computedClass()"
      [attr.aria-labelledby]="triggerId()"
      [attr.aria-hidden]="!panel.expanded()"
      [attr.inert]="panel.expanded() ? null : ''"
    >
      <div class="neural-accordion-content-clip-root">
        <div [class]="accordion.contentInnerClass()"><ng-content /></div>
      </div>
    </div>
  `,
})
export class NeuralAccordionContent {
  protected readonly accordion = inject(NeuralAccordion, { host: true });
  protected readonly panel = inject(NeuralAccordionPanel, { host: true });
  readonly contentClass = input('');
  readonly index = computed(() => this.accordion.projectedIndex(this.panel));
  readonly triggerId = computed(() => this.accordion.triggerId(this.index()));
  readonly contentId = computed(() => this.accordion.contentId(this.index()));
  readonly computedClass = computed(() =>
    this.accordion.contentClass(this.panel.expanded(), this.contentClass()),
  );
}

function readProperty(value: unknown, property: string): unknown {
  if (
    value === null ||
    value === undefined ||
    typeof value !== 'object' ||
    !property
  ) {
    return undefined;
  }
  return (value as Record<string, unknown>)[property];
}

/** @deprecated Import and use `NeuralAccordion` instead. */
export { NeuralAccordion as AccordionComponent };
/** @deprecated Import and use `NeuralAccordionPanel` instead. */
export { NeuralAccordionPanel as AccordionPanelComponent };
/** @deprecated Import and use `NeuralAccordionHeader` instead. */
export { NeuralAccordionHeader as AccordionHeaderComponent };
/** @deprecated Import and use `NeuralAccordionContent` instead. */
export { NeuralAccordionContent as AccordionContentComponent };
