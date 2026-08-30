import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  signal,
} from '@angular/core';
import { NeuralButton } from '@neural-ng/core/button';
import {
  MeterGroupComponent,
  type NeuralMeterGroupClasses,
  type NeuralMeterItem,
} from '@neural-ng/core/meter-group';
import { CodeExample } from '../../../shared/code-example/code-example';

@Component({
  selector: 'app-meter-group-page',
  imports: [NeuralButton, CodeExample, MeterGroupComponent],
  templateUrl: './meter-group.page.html',
  styleUrls: ['./meter-group.page.scss', '../shared-doc-page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeterGroupPage {
  readonly storage = signal<readonly NeuralMeterItem[]>([
    {
      label: 'Apps',
      value: 24,
      iconClass: 'nt nt-apps',
      valueText: '24 gigabytes used by apps',
    },
    {
      label: 'Media',
      value: 36,
      iconClass: 'nt nt-photo',
      valueText: '36 gigabytes used by media',
    },
    {
      label: 'System',
      value: 18,
      iconClass: 'nt nt-settings',
      valueText: '18 gigabytes used by the system',
    },
  ]);
  readonly channels: readonly NeuralMeterItem[] = [
    { label: 'Web', value: 42, color: '#2563eb' },
    { label: 'Mobile', value: 28, color: '#7c3aed' },
    { label: 'API', value: 16, color: '#0891b2' },
  ];
  readonly verticalItems: readonly NeuralMeterItem[] = [
    { label: 'CPU', value: 38, iconClass: 'nt nt-cpu' },
    { label: 'Memory', value: 31, iconClass: 'nt nt-database' },
    { label: 'Queue', value: 19, iconClass: 'nt nt-message' },
  ];
  readonly headlessClasses: NeuralMeterGroupClasses = {
    root: 'docs-headless-meter-group',
    meters: 'docs-headless-meter-group__meters',
    meter: 'docs-headless-meter-group__meter',
    labels: 'docs-headless-meter-group__labels',
    labelItem: 'docs-headless-meter-group__label-item',
    marker: 'docs-headless-meter-group__marker',
    icon: 'docs-headless-meter-group__icon',
    label: 'docs-headless-meter-group__label',
    value: 'docs-headless-meter-group__value',
  };
  readonly gigabytes = (value: number): string => `${value} GB`;

  readonly importCode = `import {
  MeterGroupComponent,
  type NeuralMeterItem,
} from '@neural-ng/core/meter-group';`;
  readonly basicCode = `<neural-meter-group
  [items]="storage()"
  ariaLabel="Storage usage"
  [valueFormatter]="gigabytes"
/>`;
  readonly layoutCode = `<neural-meter-group
  [items]="metrics"
  orientation="vertical"
  labelPosition="start"
  labelOrientation="vertical"
  ariaLabel="Runtime resources"
/>`;
  readonly customRangeCode = `<neural-meter-group
  [items]="channels"
  [max]="200"
  [valueFormatter]="gigabytes"
/>`;
  readonly headlessCode = `<neural-meter-group
  [items]="metrics"
  unstyled
  meterGroupClass="my-meter-group"
  [classes]="{
    meters: 'my-track',
    meter: 'my-meter',
    labels: 'my-labels'
  }"
/>`;

  addMediaUsage(): void {
    this.storage.update((items) =>
      items.map((item) =>
        item.label === 'Media'
          ? {
              ...item,
              value: Math.min(58, item.value + 4),
              valueText: `${Math.min(58, item.value + 4)} gigabytes used by media`,
            }
          : item,
      ),
    );
  }
}
