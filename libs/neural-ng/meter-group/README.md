# MeterGroup

`NeuralMeterGroup` displays multiple scalar measurements within one known
range. Each segment remains an independently named ARIA meter.

```ts
import { NeuralMeterGroup, type NeuralMeterItem } from '@neural-ng/core/meter-group';
```

```ts
readonly storage: readonly NeuralMeterItem[] = [
  { label: 'Apps', value: 24, iconClass: 'nt nt-apps' },
  { label: 'Media', value: 36, color: '#7c3aed', valueText: '36 GB used' },
  { label: 'System', value: 18 },
];
```

```html
<neural-meter-group [items]="storage" ariaLabel="Storage usage" />
```

MeterGroup is for measurements such as capacity, resource usage, or scores. Use
ProgressBar for task completion and loading progress.

## API

- `items`: readonly `NeuralMeterItem[]`; each item has `label`, `value`, and
  optional `color`, `iconClass`, and `valueText`.
- `min`, `max`: shared numeric range; defaults `0` and `100`.
- `orientation`: `horizontal | vertical`; default `horizontal`.
- `labelPosition`: `start | end`; default `end`.
- `labelOrientation`: `horizontal | vertical`; default `horizontal`.
- `showLabels`, `showValues`: default `true`.
- `valueFormatter`: optional `(value, item) => string` for visible values.
- `ariaLabel`, `ariaLabelledBy`: optional name for the containing group.
- `unstyled`, `meterGroupClass`, and typed `classes` slots.

Every item renders `role="meter"` with bounded `aria-valuemin`,
`aria-valuemax`, and `aria-valuenow`. Visible labels are referenced through
`aria-labelledby`; hidden labels become direct `aria-label` values. When item
totals exceed the visual capacity, later segments are clipped while their ARIA
values remain accurate.

Theme tokens use the `--neural-meter-group-*` prefix.

Current maturity: **Beta**. `MeterGroupComponent` remains as a deprecated
compatibility alias; new code should use `NeuralMeterGroup`.
