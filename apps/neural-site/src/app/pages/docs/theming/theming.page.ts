import { SiteOnThisPage } from '../../../shared/on-this-page';
import { ViewportScroller } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NeuralButton } from '@neural-ng/core/button';
import { SiteAppearanceService } from '../../../core/site-appearance.service';
import {
  PALETTE_STEPS,
  SITE_PRIMARY_PALETTES,
  SITE_SURFACE_PALETTES,
  type SitePrimaryPalette,
  type SiteSurfacePalette,
} from '../../../core/site-palettes';
import { CodeView } from '../../../shared/code-view';

@Component({
  selector: 'app-theming-page',
  imports: [SiteOnThisPage, CodeView, NeuralButton],
  templateUrl: './theming.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemingPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);

  readonly primaryPalettes = SITE_PRIMARY_PALETTES;
  readonly surfacePalettes = SITE_SURFACE_PALETTES;
  readonly paletteSteps = PALETTE_STEPS;

  readonly pageLinks = [
    ['Theme layers', 'layers'],
    ['Live palettes', 'palettes'],
    ['Primitive tokens', 'primitives'],
    ['Semantic tokens', 'semantic'],
    ['Theme compiler', 'compiler'],
    ['Component overrides', 'overrides'],
    ['Tailwind CSS', 'tailwind'],
    ['Production guidance', 'presets'],
  ] as const;

  readonly importCode = `@import '@neural-ng/core/themes/neutral.css';
@import '@neural-ng/icons/icons.css';`;

  readonly appearanceCode = `import { provideNeuralAppearance } from '@neural-ng/core/appearance';

export const appConfig = {
  providers: [
    provideNeuralAppearance({
      primary: 'blue',
      surface: 'slate',
      mode: 'system',
      direction: 'auto',
    }),
  ],
};`;

  readonly primitiveCode = `:root {
  --neural-color-primary-50: #eef2ff;
  --neural-color-primary-100: #e0e7ff;
  --neural-color-primary-200: #c7d2fe;
  --neural-color-primary-300: #a5b4fc;
  --neural-color-primary-400: #818cf8;
  --neural-color-primary-500: #6366f1;
  --neural-color-primary-600: #4f46e5;
  --neural-color-primary-700: #4338ca;
  --neural-color-primary-800: #3730a3;
  --neural-color-primary-900: #312e81;
  --neural-color-primary-950: #1e1b4b;
}`;

  readonly recipeCode = `{
  "$schema": "./node_modules/@neural-ng/theme/schema.json",
  "schemaVersion": 1,
  "name": "agent-workspace",
  "extends": "neutral",
  "color": {
    "primary": "violet",
    "surface": "zinc",
    "success": "#16a34a",
    "warning": "#ca8a04",
    "error": "#dc2626"
  },
  "shape": { "radius": "medium", "border": "default" },
  "density": "comfortable",
  "elevation": "soft",
  "motion": "default",
  "modes": { "dark": "auto" }
}`;

  readonly cliCode = `npm install --save-dev @neural-ng/theme
npx neural-theme init
npx neural-theme validate
npx neural-theme build`;

  readonly generatedImportCode = `@import 'tailwindcss';
@import '@neural-ng/icons/icons.css';
@import './styles/generated/agent-workspace.css';`;

  readonly overrideCode = `{
  "components": {
    "button": {
      "radius": "1rem",
      "primaryBackground": "{color.primary}"
    },
    "toast": {
      "messageRadius": "1rem",
      "progressHeight": "0.25rem"
    }
  }
}`;

  readonly cssOverrideCode = `.checkout-actions {
  --neural-button-radius: 999px;
  --neural-button-primary-background: var(--neural-color-primary-700);
}`;

  readonly tailwindCode = `@import 'tailwindcss';
@import '@neural-ng/core/themes/neutral.css';
@import '@neural-ng/core/themes/tailwind.css';
@import '@neural-ng/icons/icons.css';

@custom-variant dark (
  &:where([data-neural-mode='dark'], [data-neural-mode='dark'] *)
);`;

  setPrimary(primary: SitePrimaryPalette): void {
    this.appearance.setPrimary(primary);
  }

  setSurface(surface: SiteSurfacePalette): void {
    this.appearance.setSurface(surface);
  }

  swatchClass(selected: boolean): string {
    return [
      'grid size-9 cursor-pointer place-items-center rounded-full border-2 border-white/80',
      'bg-[var(--swatch)] shadow-[0_0_0_1px_rgba(15,23,42,.24)] transition hover:scale-110',
      selected
        ? 'ring-2 ring-[var(--neural-color-primary)] ring-offset-2 ring-offset-[var(--site-surface)]'
        : '',
    ].join(' ');
  }

  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}
