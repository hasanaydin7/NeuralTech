import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NeuralButton } from '@neural-ng/core/button';
import { NeuralLocaleService } from '@neural-ng/core/i18n';
import { neuralEn } from '@neural-ng/core/locales/en';
import { neuralTr } from '@neural-ng/core/locales/tr';
import { CodeView } from '../../../shared/code-view';
import { NeuralColorModeService } from '@neural-ng/core/color-mode';

@Component({
  selector: 'app-localization-page',
  imports: [NeuralButton, CodeView],
  templateUrl: './localization.page.html',
  styleUrls: ['./localization.page.scss', '../shared-doc-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocalizationPage {
  readonly locale = inject(NeuralLocaleService);
  readonly resolvedMode = inject(NeuralColorModeService).resolvedMode;
  
  readonly providerCode = `
    import { ApplicationConfig } from '@angular/core';
    import { provideNeuralNg } from '@neural-ng/core';
    import { neuralEn } from '@neural-ng/core/locales/en';

    export const appConfig: ApplicationConfig = {
      providers: [
        provideNeuralNg(),
        provideNeuralNg({ locale: neuralEn });
      ],
    };`;
  readonly runtimeCode = `const locale = inject(NeuralLocaleService);
locale.use(neuralTr);`;

  useEnglish(): void {
    this.locale.use(neuralEn);
  }

  useTurkish(): void {
    this.locale.use(neuralTr);
  }
}
