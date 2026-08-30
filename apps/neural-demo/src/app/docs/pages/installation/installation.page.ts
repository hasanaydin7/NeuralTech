import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NeuralColorModeService } from '@neural-ng/core/color-mode';
import { CodeView } from '../../../shared/code-view';

@Component({
  selector: 'app-installation-page',
  imports: [RouterLink, CodeView],
  templateUrl: './installation.page.html',
  styleUrl: '../shared-doc-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstallationPage {
  readonly resolvedMode = inject(NeuralColorModeService).resolvedMode;

  readonly installCommand = `npm install @neural-ng/core @neural-ng/icons @neural-ng/editor
npm install --save-dev @neural-ng/theme @neural-ng/mcp-server`;

  readonly localTarballCommand = `npm install \\
  D:\\NeuralTech-Packages\\neural-ng-core-0.1.0-beta.0.tgz \\
  D:\\NeuralTech-Packages\\neural-ng-icons-0.1.0-beta.0.tgz \\
  D:\\NeuralTech-Packages\\neural-ng-editor-0.1.0-beta.0.tgz

npm install --save-dev \\
  D:\\NeuralTech-Packages\\neural-ng-theme-0.1.0-beta.0.tgz \\
  D:\\NeuralTech-Packages\\neural-ng-mcp-server-0.1.0-beta.0.tgz`;

  readonly tailwindInstall = `npm install --save-dev tailwindcss @tailwindcss/postcss postcss`;

  readonly postcssConfig = `{
  "plugins": {
    "@tailwindcss/postcss": {}
  }
}`;

  readonly themeCommands = `npx neural-theme init
npx neural-theme validate
npx neural-theme build`;

  readonly themeRecipe = `{
  "$schema": "./node_modules/@neural-ng/theme/schema.json",
  "schemaVersion": 1,
  "name": "app",
  "extends": "neutral",
  "color": {
    "primary": "#7c3aed",
    "surface": "slate"
  },
  "shape": {
    "radius": "large",
    "border": "default"
  },
  "density": "comfortable",
  "modes": {
    "dark": "auto"
  }
}`;

  readonly globalStyles = `@import 'tailwindcss';
@import '@neural-ng/icons/icons.css';
@import './styles/generated/app.css';

@custom-variant dark (
  &:where([data-neural-mode='dark'], [data-neural-mode='dark'] *)
);`;

  readonly providerCode = `import { ApplicationConfig } from '@angular/core';
import { provideNeuralNg } from '@neural-ng/core';
import { provideNeuralColorMode } from '@neural-ng/core/color-mode';
import { provideNeuralMessages } from '@neural-ng/core/message';
import { provideNeuralToast } from '@neural-ng/core/toast';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNeuralNg(),
    provideNeuralColorMode({ defaultMode: 'system' }),
    provideNeuralMessages({ maxVisible: 3 }),
    provideNeuralToast({ showProgress: true }),
  ],
};`;

  readonly mcpConfig = `{
  "mcpServers": {
    "neural-ng": {
      "command": "npx",
      "args": ["--no-install", "neural-ng-mcp"]
    }
  }
}`;

  readonly firstSurfaceCode = `import { Component, inject } from '@angular/core';
import { NeuralButton } from '@neural-ng/core/button';
import { NeuralMessageService } from '@neural-ng/core/message';
import { ToastComponent } from '@neural-ng/core/toast';

@Component({
  selector: 'app-root',
  imports: [NeuralButton, ToastComponent],
  template: \`
    <neural-toast showProgress />
    <neural-button severity="primary" (clicked)="notify()">
      Verify installation
    </neural-button>
  \`,
})
export class App {
  private readonly messages = inject(NeuralMessageService);

  notify(): void {
    this.messages.notify({
      severity: 'success',
      message: 'NeuralNg is installed.',
      duration: 5000,
    });
  }
}`;
}
