import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from '@angular/core';
import {
  NeuralProgressSpinner,
  type NeuralProgressSpinnerClasses,
} from '@neural-ng/core/progress-spinner';
import { CodeExample } from '../../../shared/code-example/code-example';

@Component({
  selector: 'app-progress-spinner-page',
  imports: [NeuralProgressSpinner, CodeExample],
  templateUrl: './progress-spinner.page.html',
  styleUrls: ['./progress-spinner.page.scss', '../shared-doc-page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressSpinnerPage {
  readonly headlessClasses: NeuralProgressSpinnerClasses = {
    root: 'docs-headless-spinner',
    svg: 'docs-headless-spinner__svg',
    track: 'docs-headless-spinner__track',
    indicator: 'docs-headless-spinner__indicator',
    label: 'docs-headless-spinner__label',
  };

  readonly importCode = `import {
  NeuralProgressSpinner,
  type NeuralProgressSpinnerClasses,
} from '@neural-ng/core/progress-spinner';`;
  readonly basicCode = `<neural-progress-spinner />

<neural-progress-spinner
  ariaLabel="Loading search results"
/>`;
  readonly labelCode = `<neural-progress-spinner
  size="large"
  severity="success"
  label="Uploading..."
  ariaValueText="Preparing file 3 of 8"
/>`;
  readonly motionCode = `<neural-progress-spinner
  [strokeWidth]="3"
  [speed]="1200"
  severity="warning"
  ariaLabel="Connecting"
/>`;
  readonly headlessCode = `<neural-progress-spinner
  unstyled
  spinnerClass="my-spinner"
  [classes]="{
    svg: 'my-svg',
    track: 'my-track',
    indicator: 'my-indicator',
    label: 'my-label'
  }"
  label="Building"
/>`;
}
