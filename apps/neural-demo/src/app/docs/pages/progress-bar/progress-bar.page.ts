import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  signal,
} from '@angular/core';
import { NeuralButton } from '@neural-ng/core/button';
import {
  ProgressBarComponent,
  type NeuralProgressBarClasses,
} from '@neural-ng/core/progress-bar';
import { CodeExample } from '../../../shared/code-example/code-example';

@Component({
  selector: 'app-progress-bar-page',
  imports: [NeuralButton, ProgressBarComponent, CodeExample],
  templateUrl: './progress-bar.page.html',
  styleUrls: ['./progress-bar.page.scss', '../shared-doc-page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressBarPage {
  readonly progress = signal(36);
  readonly headlessClasses: NeuralProgressBarClasses = {
    root: 'docs-headless-progress',
    track: 'docs-headless-progress__track',
    buffer: 'docs-headless-progress__buffer',
    value: 'docs-headless-progress__value',
    label: 'docs-headless-progress__label',
  };

  readonly importCode = `import {
  ProgressBarComponent,
  type NeuralProgressBarClasses,
} from '@neural-ng/core/progress-bar';`;
  readonly determinateCode = `<neural-progress-bar
  [value]="progress()"
  ariaLabel="Upload progress"
/>`;
  readonly bufferCode = `<neural-progress-bar
  [value]="35"
  [bufferValue]="68"
  ariaLabel="Video playback buffer"
/>`;
  readonly indeterminateCode = `<neural-progress-bar
  mode="indeterminate"
  label="Loading"
  ariaLabel="Loading search results"
/>`;
  readonly localizedCode = `<neural-progress-bar
  [value]="7"
  [max]="10"
  label="7 / 10 dosya"
  ariaValueText="10 dosyanın 7 tanesi tamamlandı"
  ariaLabel="Dosya yükleme ilerlemesi"
/>`;
  readonly headlessCode = `<neural-progress-bar
  [value]="64"
  unstyled
  progressClass="my-progress"
  [classes]="{
    track: 'my-track',
    value: 'my-value',
    label: 'my-label'
  }"
/>`;

  decrease(): void {
    this.progress.update((value) => Math.max(0, value - 10));
  }

  increase(): void {
    this.progress.update((value) => Math.min(100, value + 10));
  }

  reset(): void {
    this.progress.set(0);
  }
}
