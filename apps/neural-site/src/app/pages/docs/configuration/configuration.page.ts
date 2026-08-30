import { SiteOnThisPage } from '../../../shared/on-this-page';
import { ViewportScroller } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  NeuralNgService,
  type NeuralDensity,
  type NeuralDirection,
} from '@neural-ng/core';
import { NeuralButton } from '@neural-ng/core/button';
import { SiteAppearanceService } from '../../../core/site-appearance.service';
import { CodeView } from '../../../shared/code-view';

@Component({
  selector: 'app-configuration-page',
  imports: [SiteOnThisPage, CodeView, NeuralButton],
  templateUrl: './configuration.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigurationPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);
  readonly neuralNg = inject(NeuralNgService);
  readonly densities: readonly NeuralDensity[] = [
    'compact',
    'comfortable',
    'spacious',
  ];

  readonly pageLinks = [
    ['Provider setup', 'provider'],
    ['Defaults', 'defaults'],
    ['Live configuration', 'live'],
    ['Runtime API', 'runtime'],
    ['Appearance', 'color-mode'],
    ['DOM contract', 'dom-contract'],
    ['Headless mode', 'headless'],
    ['SSR notes', 'ssr'],
  ] as const;

  readonly providerCode = `import { ApplicationConfig } from '@angular/core';
import { provideNeuralNg } from '@neural-ng/core';
import { provideNeuralAppearance } from '@neural-ng/core/appearance';
import { neuralTr } from '@neural-ng/core/locales/tr';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNeuralNg({
      locale: neuralTr,
      direction: 'auto',
      density: 'comfortable',
      unstyled: false,
    }),
    provideNeuralAppearance({
      primary: 'violet',
      surface: 'slate',
      mode: 'system',
      direction: 'auto',
      storageKey: 'product-appearance',
    }),
  ],
};`;

  readonly runtimeCode = `import { Component, inject } from '@angular/core';
import { NeuralNgService } from '@neural-ng/core';

@Component({
  selector: 'app-preferences',
  template: \`
    <output>
      {{ neural.direction() }} /
      {{ neural.resolvedDirection() }} /
      {{ neural.density() }}
    </output>
  \`,
})
export class Preferences {
  readonly neural = inject(NeuralNgService);

  useCompactRtl(): void {
    this.neural.setDirection('rtl');
    this.neural.setDensity('compact');
  }

  reset(): void {
    this.neural.reset();
  }
}`;

  readonly colorModeCode = `import { Component, inject } from '@angular/core';
import { NeuralAppearanceService } from '@neural-ng/core/appearance';

@Component({
  selector: 'app-appearance-picker',
  template: \`
    <neural-button label="Violet" (clicked)="appearance.setPrimary('violet')" />
    <neural-button label="Dark" (clicked)="appearance.setMode('dark')" />
    <neural-button label="RTL" (clicked)="appearance.setDirection('rtl')" />
    <output>
      {{ appearance.primary() }} /
      {{ appearance.surface() }} /
      {{ appearance.resolvedMode() }}
    </output>
  \`,
})
export class AppearancePicker {
  readonly appearance = inject(NeuralAppearanceService);
}`;

  readonly domCode = `<html
  dir="rtl"
  data-neural-direction="rtl"
  data-neural-density="compact"
  data-neural-mode="dark"
  data-neural-primary="violet"
  data-neural-surface="slate"
  data-neural-theme="neutral"
>
  ...
</html>`;

  readonly headlessCode = `import { ApplicationConfig } from '@angular/core';
import { provideNeuralNg } from '@neural-ng/core';

export const appConfig: ApplicationConfig = {
  providers: [provideNeuralNg({ unstyled: true })],
};`;

  setDirection(direction: Exclude<NeuralDirection, 'auto'>): void {
    this.appearance.setDirection(direction);
  }

  setDensity(density: NeuralDensity): void {
    this.neuralNg.setDensity(density);
  }

  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}
