import { SiteOnThisPage } from '../../../shared/on-this-page';
import { ViewportScroller } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SiteAppearanceService } from '../../../core/site-appearance.service';
import { CodeView } from '../../../shared/code-view';

@Component({
  selector: 'app-ssr-hydration-page',
  imports: [SiteOnThisPage, CodeView],
  templateUrl: './ssr-hydration.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SsrHydrationPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);

  readonly pageLinks = [
    ['Rendering modes', 'modes'],
    ['Enable hydration', 'setup'],
    ['NeuralNg contract', 'contract'],
    ['Deterministic rendering', 'deterministic'],
    ['Browser-only work', 'browser-work'],
    ['Overlays', 'overlays'],
    ['Data transfer', 'data'],
    ['Incremental hydration', 'incremental'],
    ['Diagnostics', 'diagnostics'],
    ['Deployment checklist', 'checklist'],
  ] as const;

  readonly setupCode = `import { ApplicationConfig } from '@angular/core';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { provideNeuralNg } from '@neural-ng/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideNeuralNg({ direction: 'auto' }),
  ],
};`;

  readonly serverCode = `import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [provideServerRendering(withRoutes(serverRoutes))],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);`;

  readonly modesCode = `import { RenderMode, type ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'docs/**', renderMode: RenderMode.Prerender },
  { path: 'account/**', renderMode: RenderMode.Server },
  { path: 'admin/**', renderMode: RenderMode.Client },
];`;

  readonly deterministicCode = `<neural-field controlId="checkout-email">
  <label neuralFieldLabel>Email</label>
  <input neuralInput type="email" />
  <small neuralFieldHint>Receipt delivery address.</small>
</neural-field>

<neural-tabs tabsId="account-tabs" [(value)]="activeTab">
  ...
</neural-tabs>`;

  readonly browserCode = `import { Component, ElementRef, afterNextRender, viewChild } from '@angular/core';

@Component({ /* ... */ })
export class ChartPanel {
  readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  constructor() {
    afterNextRender(() => {
      // Runs in the browser after Angular has rendered.
      const width = this.canvas().nativeElement.getBoundingClientRect().width;
      this.initializeChart(width);
    });
  }
}`;

  readonly mismatchCode = `// Avoid during initial rendering:
readonly id = Math.random().toString(36);
readonly now = new Date();
readonly compact = window.innerWidth < 768;
readonly mode = localStorage.getItem('mode');

// Prefer stable inputs and browser-only enhancement:
readonly id = input.required<string>();
readonly initialTimestamp = input.required<string>();

afterNextRender(() => {
  this.restoreBrowserPreferences();
});`;

  readonly overlayCode = `<neural-select
  controlId="shipping-country"
  [options]="countries"
  appendTo="body"
/>

<neural-dialog #review ariaLabel="Review order">
  ...
</neural-dialog>`;

  readonly deferCode = `@defer (on viewport; hydrate on interaction) {
  <app-heavy-report />
} @placeholder {
  <neural-skeleton width="100%" height="18rem" />
}`;

  readonly diagnosticCode = `// Production-equivalent verification
npx nx build neural-site --configuration=production

// Then inspect the served HTML before JavaScript executes:
// 1. Content and accessible names are present.
// 2. Angular reports hydrated nodes without mismatch errors.
// 3. Event replay preserves early clicks.
// 4. No overlay, timer or global listener leaks after navigation.`;

  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}
