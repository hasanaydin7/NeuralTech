import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { NeuralColorModeService } from '@neural-ng/core/color-mode';
import {
  NeuralSliderRangeValue,
  SliderComponent,
  type NeuralSliderClasses,
} from '@neural-ng/core/slider';
import { CodeView } from '../../../shared/code-view';

@Component({
  selector: 'app-slider-page',
  imports: [CodeView, FormField, SliderComponent],
  templateUrl: './slider.page.html',
  styleUrls: ['../shared-doc-page.scss', './slider.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SliderPage {
  readonly resolvedMode = inject(NeuralColorModeService).resolvedMode;
  readonly settings = signal({ volume: 45 });
  readonly settingsForm = form(this.settings);
  readonly temperature = signal(22);
  readonly vertical = signal(65);
  readonly headless = signal(72);
  rangeValue: NeuralSliderRangeValue = [20, 80];
  readonly classes: NeuralSliderClasses = {
    root: 'docs-slider-headless',
    input: 'docs-slider-headless__input',
    value: 'docs-slider-headless__value',
  };
  readonly importCode = `import { SliderComponent } from '@neural-ng/core/slider';`;
  readonly basicCode = `<neural-slider [formField]="settingsForm.volume" [step]="5" showValue fluid />`;
  readonly variantsCode = `<neural-slider [(value)]="temperature" [min]="16" [max]="30" showValue />\n<neural-slider [(value)]="level" orientation="vertical" showValue />`;
  readonly headlessCode = `<neural-slider [(value)]="value" [classes]="classes" showValue unstyled fluid />`;
}
