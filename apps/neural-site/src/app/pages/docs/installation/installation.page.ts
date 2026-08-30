import { SiteOnThisPage } from '../../../shared/on-this-page';
import { ViewportScroller } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SiteAppearanceService } from '../../../core/site-appearance.service';
import { CodeView } from '../../../shared/code-view';

@Component({
  selector: 'app-installation-page',
  imports: [SiteOnThisPage, CodeView, RouterLink],
  templateUrl: './installation.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstallationPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);

  readonly pageLinks = [
    ['Prerequisites', 'prerequisites'],
    ['Install packages', 'packages'],
    ['Add styles', 'styles'],
    ['Configure Angular', 'configuration'],
    ['Use a component', 'first-component'],
    ['Tailwind CSS', 'tailwind'],
    ['Headless mode', 'headless'],
  ] as const;

  readonly npmCode = `npm install @neural-ng/core @neural-ng/icons`;
  readonly pnpmCode = `pnpm add @neural-ng/core @neural-ng/icons`;
  readonly yarnCode = `yarn add @neural-ng/core @neural-ng/icons`;
  readonly stylesCode = `@import '@neural-ng/core/themes/neutral.css';
@import '@neural-ng/icons/icons.css';`;
  readonly configCode = `import { ApplicationConfig } from '@angular/core';
import { provideNeuralNg } from '@neural-ng/core';
import { provideNeuralAppearance } from '@neural-ng/core/appearance';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNeuralNg({
      direction: 'auto',
      density: 'comfortable',
    }),
    provideNeuralAppearance({
      primary: 'blue',
      surface: 'slate',
      mode: 'system',
      direction: 'auto',
      storageKey: 'product-appearance',
    }),
  ],
};`;
  readonly componentCode = `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NeuralButton } from '@neural-ng/core/button';

@Component({
  selector: 'app-save-action',
  imports: [NeuralButton],
  template: \`
    <neural-button
      label="Save changes"
      icon="nt nt-check"
      (clicked)="save()"
    />
  \`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveAction {
  save(): void {
    // Persist your changes.
  }
}`;
  readonly tailwindCode = `@import 'tailwindcss';
@import '@neural-ng/core/themes/neutral.css';
@import '@neural-ng/core/themes/tailwind.css';
@import '@neural-ng/icons/icons.css';

@custom-variant dark (
  &:where([data-neural-mode='dark'], [data-neural-mode='dark'] *)
);`;
  readonly headlessCode = `import { ApplicationConfig } from '@angular/core';
import { provideNeuralNg } from '@neural-ng/core';

export const appConfig: ApplicationConfig = {
  providers: [provideNeuralNg({ unstyled: true })],
};`;

  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}
