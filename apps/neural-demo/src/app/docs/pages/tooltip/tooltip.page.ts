import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from '@angular/core';
import {
  NeuralTooltip,
  type NeuralTooltipClasses,
  type NeuralTooltipPosition,
} from '@neural-ng/core/tooltip';
import { CodeExample } from '../../../shared/code-example/code-example';

@Component({
  selector: 'app-tooltip-page',
  imports: [CodeExample, NeuralTooltip],
  templateUrl: './tooltip.page.html',
  styleUrls: ['./tooltip.page.scss', '../shared-doc-page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipPage {
  readonly positions: readonly NeuralTooltipPosition[] = [
    'top',
    'top-start',
    'top-end',
    'bottom',
    'bottom-start',
    'bottom-end',
    'left',
    'right',
  ];
  readonly headlessClasses: NeuralTooltipClasses = {
    root: 'docs-headless-tooltip',
    content: 'docs-headless-tooltip__content',
    arrow: 'docs-headless-tooltip__arrow',
  };
  readonly importCode = `import { NeuralTooltip } from '@neural-ng/core/tooltip';`;
  readonly basicCode = `<button neuralTooltip="Delete account">
  Delete
</button>`;
  readonly positionCode = `<button
  neuralTooltip="Aligned to the logical start"
  tooltipPosition="bottom-start"
>
  Bottom start
</button>`;
  readonly headlessCode = `<button
  neuralTooltip="Consumer-owned visual layer"
  unstyled
  [classes]="{
    root: 'my-tooltip',
    content: 'my-tooltip__content',
    arrow: 'my-tooltip__arrow'
  }"
>
  Headless tooltip
</button>`;
}
