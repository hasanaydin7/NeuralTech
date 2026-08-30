import { SiteOnThisPage } from '../../../shared/on-this-page';
import { ViewportScroller } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SiteAppearanceService } from '../../../core/site-appearance.service';
import { CodeView } from '../../../shared/code-view';

@Component({
  selector: 'app-performance-bundling-page',
  imports: [SiteOnThisPage, CodeView],
  templateUrl: './performance-bundling.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerformanceBundlingPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);

  readonly pageLinks = [
    ['Granular imports', 'imports'],
    ['Lazy features', 'lazy'],
    ['Icon payload', 'icons'],
    ['Large collections', 'collections'],
    ['Zoneless Angular', 'zoneless'],
    ['SSR and loading', 'rendering'],
    ['Bundle budgets', 'budgets'],
    ['Checklist', 'checklist'],
  ] as const;

  readonly importsCode = `import { NeuralButton } from '@neural-ng/core/button';
import { NeuralSelect } from '@neural-ng/core/select';
import { NeuralTable } from '@neural-ng/core/table';

// Dependency-heavy editing stays outside @neural-ng/core.
import { NeuralEditor } from '@neural-ng/editor';`;

  readonly lazyCode = `export const routes: Routes = [
  {
    path: 'reports',
    loadComponent: () =>
      import('./reports/reports.page').then(m => m.ReportsPage),
  },
];

// Inside a template:
@defer (on viewport) {
  <app-large-data-grid />
} @placeholder {
  <neural-skeleton width="100%" height="20rem" />
}`;

  readonly iconCode = `/* Curated application essentials */
@import '@neural-ng/icons/icons.css';

/* Add only a required category */
@import '@neural-ng/icons/categories/charts.css';

/* Use only when the application truly needs the complete catalog */
/* @import '@neural-ng/icons/all.css'; */`;

  readonly zonelessCode = `import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideNeuralNg } from '@neural-ng/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideNeuralNg(),
  ],
};`;

  readonly budgetCode = `"budgets": [
  {
    "type": "initial",
    "maximumWarning": "500kb",
    "maximumError": "1mb"
  },
  {
    "type": "anyComponentStyle",
    "maximumWarning": "20kb",
    "maximumError": "24kb"
  }
]`;

  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}
