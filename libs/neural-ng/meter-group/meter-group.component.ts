import {
  APP_ID,
  ChangeDetectionStrategy,
  Component,
  Injectable,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
  numberAttribute,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NEURAL_NG_CONFIG } from '@neural-ng/core';
import type {
  NeuralMeterGroupClasses,
  NeuralMeterGroupLabelOrientation,
  NeuralMeterGroupLabelPosition,
  NeuralMeterGroupOrientation,
  NeuralMeterItem,
  NeuralMeterValueFormatter,
} from './meter-group.types';

interface NeuralMeterViewItem extends NeuralMeterItem {
  readonly normalizedLabel: string;
  readonly normalizedValue: number;
  readonly percentage: number;
  readonly visiblePercentage: number;
  readonly palette: number;
}

@Injectable({ providedIn: 'root' })
class NeuralMeterGroupIdGenerator {
  private readonly appId = inject(APP_ID);
  private nextId = 0;

  next(): string {
    return `${this.appId}-neural-meter-group-${this.nextId++}`;
  }
}

@Component({
  selector: 'neural-meter-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'neural-meter-group-host' },
  template: `
    <div
      [class]="rootClass()"
      role="group"
      [attr.data-orientation]="orientation()"
      [attr.data-label-position]="labelPosition()"
      [attr.data-label-orientation]="labelOrientation()"
      [attr.aria-label]="resolvedAriaLabel()"
      [attr.aria-labelledby]="normalizedAriaLabelledBy()"
    >
      @if (showLabels() && labelPosition() === 'start') {
        <ng-container [ngTemplateOutlet]="labelsTemplate" />
      }

      <div [class]="metersClass()">
        @for (item of viewItems(); track $index; let index = $index) {
          <span
            [class]="meterClass(item)"
            role="meter"
            [attr.aria-labelledby]="showLabels() ? labelId(index) : null"
            [attr.aria-label]="showLabels() ? null : item.normalizedLabel"
            [attr.aria-valuemin]="safeMin()"
            [attr.aria-valuemax]="safeMax()"
            [attr.aria-valuenow]="item.normalizedValue"
            [attr.aria-valuetext]="normalizedValueText(item)"
            [attr.data-index]="index"
            [style.inline-size.%]="
              orientation() === 'horizontal' ? item.visiblePercentage : null
            "
            [style.block-size.%]="
              orientation() === 'vertical' ? item.visiblePercentage : null
            "
            [style.--neural-meter-group-item-color]="item.color ?? null"
          ></span>
        }
      </div>

      @if (showLabels() && labelPosition() === 'end') {
        <ng-container [ngTemplateOutlet]="labelsTemplate" />
      }
    </div>

    <ng-template #labelsTemplate>
      <ul [class]="labelsClass()">
        @for (item of viewItems(); track $index; let index = $index) {
          <li [class]="labelItemClass()">
            @if (normalizedIconClass(item)) {
              <i
                [class]="iconClass(item)"
                [style.color]="item.color ?? null"
                aria-hidden="true"
              ></i>
            } @else {
              <span
                [class]="markerClass(item)"
                [style.--neural-meter-group-item-color]="item.color ?? null"
                aria-hidden="true"
              ></span>
            }
            <span [class]="labelClass()" [attr.id]="labelId(index)">
              {{ item.normalizedLabel }}
            </span>
            @if (showValues()) {
              <span [class]="valueClass()">
                {{ formattedValue(item) }}
              </span>
            }
          </li>
        }
      </ul>
    </ng-template>
  `,
  imports: [NgTemplateOutlet],
  styles: `
    :where(.neural-meter-group-host) {
      display: block;
      width: 100%;
    }

    :where(
      .neural-meter-group-root,
      .neural-meter-group-meters-root,
      .neural-meter-group-meter-root,
      .neural-meter-group-labels-root,
      .neural-meter-group-label-item-root,
      .neural-meter-group-marker-root,
      .neural-meter-group-icon-root,
      .neural-meter-group-label-root,
      .neural-meter-group-value-root
    ) {
      box-sizing: border-box;
    }

    :where(.neural-meter-group-root) {
      display: flex;
      min-width: 0;
    }

    :where(.neural-meter-group-horizontal-root) {
      flex-direction: column;
    }

    :where(.neural-meter-group-vertical-root) {
      flex-direction: row;
      align-items: stretch;
      min-height: var(--neural-meter-group-vertical-height, 12rem);
    }

    :where(.neural-meter-group-meters-root) {
      display: flex;
      flex: 0 0 auto;
      overflow: hidden;
    }

    :where(.neural-meter-group-horizontal-root)
      > :where(.neural-meter-group-meters-root) {
      width: 100%;
      min-height: var(--neural-meter-group-height, 0.875rem);
    }

    :where(.neural-meter-group-vertical-root)
      > :where(.neural-meter-group-meters-root) {
      flex-direction: column-reverse;
      width: var(--neural-meter-group-vertical-width, 1rem);
      min-height: 100%;
    }

    :where(.neural-meter-group-meter-root) {
      display: block;
      flex: 0 0 auto;
      min-width: 0;
      min-height: 0;
    }

    :where(.neural-meter-group-meters-base) {
      background: var(--neural-meter-group-track-background, Canvas);
      border: var(--neural-meter-group-track-border, 0 solid transparent);
      border-radius: var(--neural-meter-group-radius, 999px);
      box-shadow: var(--neural-meter-group-shadow, none);
    }

    :where(.neural-meter-group-meter-base) {
      background: var(
        --neural-meter-group-item-color,
        var(--neural-meter-group-color-1, currentColor)
      );
      transition:
        inline-size var(--neural-meter-group-transition-duration, 180ms)
          var(--neural-meter-group-transition-easing, ease-out),
        block-size var(--neural-meter-group-transition-duration, 180ms)
          var(--neural-meter-group-transition-easing, ease-out);
    }

    :where(.neural-meter-group-palette-1-base) {
      --neural-meter-group-item-color: var(
        --neural-meter-group-color-1,
        #2563eb
      );
    }
    :where(.neural-meter-group-palette-2-base) {
      --neural-meter-group-item-color: var(
        --neural-meter-group-color-2,
        #7c3aed
      );
    }
    :where(.neural-meter-group-palette-3-base) {
      --neural-meter-group-item-color: var(
        --neural-meter-group-color-3,
        #0891b2
      );
    }
    :where(.neural-meter-group-palette-4-base) {
      --neural-meter-group-item-color: var(
        --neural-meter-group-color-4,
        #16a34a
      );
    }
    :where(.neural-meter-group-palette-5-base) {
      --neural-meter-group-item-color: var(
        --neural-meter-group-color-5,
        #d97706
      );
    }
    :where(.neural-meter-group-palette-6-base) {
      --neural-meter-group-item-color: var(
        --neural-meter-group-color-6,
        #dc2626
      );
    }

    :where(.neural-meter-group-labels-root) {
      display: flex;
      min-width: 0;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    :where(.neural-meter-group-labels-horizontal-root) {
      flex-flow: row wrap;
    }

    :where(.neural-meter-group-labels-vertical-root) {
      flex-direction: column;
    }

    :where(.neural-meter-group-labels-base) {
      gap: var(--neural-meter-group-labels-gap, 0.75rem 1rem);
      color: var(--neural-meter-group-label-color, CanvasText);
      font-family: var(--neural-meter-group-font-family, inherit);
      font-size: var(--neural-meter-group-font-size, 0.8125rem);
      line-height: var(--neural-meter-group-line-height, 1.35);
    }

    :where(.neural-meter-group-root[data-label-position='start'])
      > :where(.neural-meter-group-labels-root) {
      margin-block-end: var(--neural-meter-group-label-gap, 0.75rem);
    }

    :where(.neural-meter-group-root[data-label-position='end'])
      > :where(.neural-meter-group-labels-root) {
      margin-block-start: var(--neural-meter-group-label-gap, 0.75rem);
    }

    :where(.neural-meter-group-vertical-root[data-label-position='start'])
      > :where(.neural-meter-group-labels-root) {
      margin: 0;
      margin-inline-end: var(--neural-meter-group-label-gap, 0.75rem);
    }

    :where(.neural-meter-group-vertical-root[data-label-position='end'])
      > :where(.neural-meter-group-labels-root) {
      margin: 0;
      margin-inline-start: var(--neural-meter-group-label-gap, 0.75rem);
    }

    :where(.neural-meter-group-label-item-root) {
      display: inline-flex;
      min-width: 0;
      align-items: center;
    }

    :where(.neural-meter-group-label-item-base) {
      gap: var(--neural-meter-group-label-item-gap, 0.4375rem);
    }

    :where(.neural-meter-group-marker-root) {
      display: block;
      flex: 0 0 auto;
    }

    :where(.neural-meter-group-marker-base) {
      width: var(--neural-meter-group-marker-size, 0.625rem);
      height: var(--neural-meter-group-marker-size, 0.625rem);
      background: var(
        --neural-meter-group-item-color,
        var(--neural-meter-group-color-1, currentColor)
      );
      border-radius: var(--neural-meter-group-marker-radius, 999px);
    }

    :where(.neural-meter-group-icon-root) {
      flex: 0 0 auto;
    }

    :where(.neural-meter-group-icon-base) {
      color: var(
        --neural-meter-group-item-color,
        var(--neural-meter-group-color-1, currentColor)
      );
      font-size: var(--neural-meter-group-icon-size, 1rem);
    }

    :where(.neural-meter-group-label-base) {
      overflow: hidden;
      font-weight: var(--neural-meter-group-label-font-weight, 600);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    :where(.neural-meter-group-value-base) {
      color: var(--neural-meter-group-value-color, CanvasText);
      font-variant-numeric: tabular-nums;
      font-weight: var(--neural-meter-group-value-font-weight, 700);
    }

    @media (prefers-reduced-motion: reduce) {
      :where(.neural-meter-group-meter-root) {
        transition: none;
      }
    }
  `,
})
export class NeuralMeterGroup {
  private readonly config = inject(NEURAL_NG_CONFIG);
  private readonly generatedId = inject(NeuralMeterGroupIdGenerator).next();

  readonly items = input<readonly NeuralMeterItem[]>([]);
  readonly min = input(0, { transform: numberAttribute });
  readonly max = input(100, { transform: numberAttribute });
  readonly orientation = input<NeuralMeterGroupOrientation>('horizontal');
  readonly labelPosition = input<NeuralMeterGroupLabelPosition>('end');
  readonly labelOrientation =
    input<NeuralMeterGroupLabelOrientation>('horizontal');
  readonly showLabels = input(true, { transform: booleanAttribute });
  readonly showValues = input(true, { transform: booleanAttribute });
  readonly valueFormatter = input<NeuralMeterValueFormatter | null>(null);
  readonly ariaLabel = input<string | null>(null);
  readonly ariaLabelledBy = input<string | null>(null);
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly meterGroupClass = input('');
  readonly classes = input<NeuralMeterGroupClasses>({});

  readonly effectiveUnstyled = computed(
    () => this.unstyled() || this.config.unstyled,
  );
  readonly safeMin = computed(() =>
    Number.isFinite(this.min()) ? this.min() : 0,
  );
  readonly safeMax = computed(() => {
    const min = this.safeMin();
    const max = this.max();
    return Number.isFinite(max) && max > min ? max : min + 100;
  });
  readonly viewItems = computed<readonly NeuralMeterViewItem[]>(() => {
    const range = this.safeMax() - this.safeMin();
    let remaining = 100;

    return this.items().map((item, index) => {
      const value = Number.isFinite(item.value) ? item.value : this.safeMin();
      const normalizedValue = Math.min(
        this.safeMax(),
        Math.max(this.safeMin(), value),
      );
      const percentage = ((normalizedValue - this.safeMin()) / range) * 100;
      const visiblePercentage = Math.min(remaining, percentage);
      remaining = Math.max(0, remaining - visiblePercentage);

      return {
        ...item,
        normalizedLabel: item.label.trim() || `Meter ${index + 1}`,
        normalizedValue,
        percentage,
        visiblePercentage,
        palette: (index % 6) + 1,
      };
    });
  });
  readonly normalizedAriaLabelledBy = computed(
    () => this.ariaLabelledBy()?.trim() || null,
  );
  readonly resolvedAriaLabel = computed(() =>
    this.normalizedAriaLabelledBy() ? null : this.ariaLabel()?.trim() || null,
  );
  readonly rootClass = computed(() =>
    [
      this.compose(
        'neural-meter-group-root',
        'neural-meter-group-base',
        this.meterGroupClass(),
        this.classes().root,
      ),
      `neural-meter-group-${this.orientation()}-root`,
      this.visualClass(`neural-meter-group-${this.orientation()}-base`),
    ]
      .filter(Boolean)
      .join(' '),
  );
  readonly metersClass = computed(() =>
    this.compose(
      'neural-meter-group-meters-root',
      'neural-meter-group-meters-base',
      this.classes().meters,
    ),
  );
  readonly labelsClass = computed(() =>
    [
      this.compose(
        'neural-meter-group-labels-root',
        'neural-meter-group-labels-base',
        this.classes().labels,
      ),
      `neural-meter-group-labels-${this.labelOrientation()}-root`,
      this.visualClass(
        `neural-meter-group-labels-${this.labelOrientation()}-base`,
      ),
    ]
      .filter(Boolean)
      .join(' '),
  );
  readonly labelItemClass = computed(() =>
    this.compose(
      'neural-meter-group-label-item-root',
      'neural-meter-group-label-item-base',
      this.classes().labelItem,
    ),
  );
  readonly labelClass = computed(() =>
    this.compose(
      'neural-meter-group-label-root',
      'neural-meter-group-label-base',
      this.classes().label,
    ),
  );
  readonly valueClass = computed(() =>
    this.compose(
      'neural-meter-group-value-root',
      'neural-meter-group-value-base',
      this.classes().value,
    ),
  );

  meterClass(item: NeuralMeterViewItem): string {
    return [
      this.compose(
        'neural-meter-group-meter-root',
        'neural-meter-group-meter-base',
        this.classes().meter,
      ),
      item.color
        ? ''
        : this.visualClass(`neural-meter-group-palette-${item.palette}-base`),
    ]
      .filter(Boolean)
      .join(' ');
  }

  markerClass(item: NeuralMeterViewItem): string {
    return [
      this.compose(
        'neural-meter-group-marker-root',
        'neural-meter-group-marker-base',
        this.classes().marker,
      ),
      item.color
        ? ''
        : this.visualClass(`neural-meter-group-palette-${item.palette}-base`),
    ]
      .filter(Boolean)
      .join(' ');
  }

  iconClass(item: NeuralMeterViewItem): string {
    return [
      this.compose(
        'neural-meter-group-icon-root',
        'neural-meter-group-icon-base',
        this.normalizedIconClass(item) ?? '',
        this.classes().icon,
      ),
      item.color
        ? ''
        : this.visualClass(`neural-meter-group-palette-${item.palette}-base`),
    ]
      .filter(Boolean)
      .join(' ');
  }

  normalizedIconClass(item: NeuralMeterItem): string | null {
    return item.iconClass?.trim() || null;
  }

  normalizedValueText(item: NeuralMeterViewItem): string | null {
    return item.valueText?.trim() || null;
  }

  formattedValue(item: NeuralMeterViewItem): string {
    const formatter = this.valueFormatter();
    if (formatter) return formatter(item.normalizedValue, item);
    return `${Math.round(item.percentage)}%`;
  }

  labelId(index: number): string {
    return `${this.generatedId}-label-${index}`;
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

/** @deprecated Import and use `NeuralMeterGroup` instead. */
export { NeuralMeterGroup as MeterGroupComponent };
