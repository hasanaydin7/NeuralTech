import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  NeuralNgService,
  type NeuralDensity,
  type NeuralDirection,
} from '@neural-ng/core';
import { NeuralButton } from '@neural-ng/core/button';
import { NeuralColorModeService } from '@neural-ng/core/color-mode';
import { CodeView } from '../../../shared/code-view';

interface PaletteStep {
  readonly value: string;
  readonly className: string;
}

@Component({
  selector: 'app-theming-page',
  imports: [NeuralButton, CodeView, RouterLink],
  templateUrl: './theming.page.html',
  styleUrls: ['../shared-doc-page.scss', './theming.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemingPage {
  readonly neuralNg = inject(NeuralNgService);
  readonly resolvedMode = inject(NeuralColorModeService).resolvedMode;

  readonly primarySteps: readonly PaletteStep[] = [
    { value: '50', className: 'bg-primary-50 text-primary-950' },
    { value: '100', className: 'bg-primary-100 text-primary-950' },
    { value: '200', className: 'bg-primary-200 text-primary-950' },
    { value: '300', className: 'bg-primary-300 text-primary-950' },
    { value: '400', className: 'bg-primary-400 text-primary-950' },
    { value: '500', className: 'bg-primary-500 text-white' },
    { value: '600', className: 'bg-primary-600 text-white' },
    { value: '700', className: 'bg-primary-700 text-white' },
    { value: '800', className: 'bg-primary-800 text-white' },
    { value: '900', className: 'bg-primary-900 text-white' },
    { value: '950', className: 'bg-primary-950 text-white' },
  ];

  readonly surfaceSteps: readonly PaletteStep[] = [
    { value: '0', className: 'bg-surface-0 text-surface-950' },
    { value: '50', className: 'bg-surface-50 text-surface-950' },
    { value: '100', className: 'bg-surface-100 text-surface-950' },
    { value: '200', className: 'bg-surface-200 text-surface-950' },
    { value: '300', className: 'bg-surface-300 text-surface-950' },
    { value: '400', className: 'bg-surface-400 text-surface-950' },
    { value: '500', className: 'bg-surface-500 text-white' },
    { value: '600', className: 'bg-surface-600 text-white' },
    { value: '700', className: 'bg-surface-700 text-white' },
    { value: '800', className: 'bg-surface-800 text-white' },
    { value: '900', className: 'bg-surface-900 text-white' },
    { value: '950', className: 'bg-surface-950 text-white' },
  ];

  readonly tailwindCode = `@import 'tailwindcss';
@import '@neural-ng/core/themes/neutral.css';
@import '@neural-ng/core/themes/tailwind.css';

/* NeuralNg owns its namespaced attribute, not Tailwind's generic .dark class. */
@custom-variant dark (&:where(
  [data-neural-mode='dark'],
  [data-neural-mode='dark'] *
));`;

  readonly utilityCode = `<section class="bg-surface-50 text-surface-900 dark:bg-surface-900 dark:text-surface-50">
  <button class="bg-primary-600 hover:bg-primary-700 text-white">
    Continue
  </button>
</section>`;

  readonly globalConfigCode = `provideNeuralNg({
  direction: 'auto', // follows the active NeuralNg locale
  density: 'comfortable',
});

const neuralNg = inject(NeuralNgService);
neuralNg.setDirection('rtl');
neuralNg.setDensity('compact');`;

  setDirection(direction: NeuralDirection): void {
    this.neuralNg.setDirection(direction);
  }

  setDensity(density: NeuralDensity): void {
    this.neuralNg.setDensity(density);
  }
}
