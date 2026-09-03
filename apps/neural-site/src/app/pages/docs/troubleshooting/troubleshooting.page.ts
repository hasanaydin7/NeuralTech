import { SiteOnThisPage } from '../../../shared/on-this-page';
import { ViewportScroller } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SiteAppearanceService } from '../../../core/site-appearance.service';
import { CodeView } from '../../../shared/code-view';

@Component({
  selector: 'app-troubleshooting-page',
  imports: [SiteOnThisPage, CodeView],
  templateUrl: './troubleshooting.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TroubleshootingPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);

  readonly pageLinks = [
    ['Start here', 'start'],
    ['Component not recognized', 'imports'],
    ['Missing icons', 'icons'],
    ['Theme and color', 'theme'],
    ['Overlay placement', 'overlay'],
    ['Forms', 'forms'],
    ['SSR and hydration', 'ssr'],
    ['Interaction and focus', 'interaction'],
    ['Version conflicts', 'versions'],
    ['Minimal reproduction', 'reproduction'],
  ] as const;

  readonly importCode = `import { NeuralSelect } from '@neural-ng/core/select';

@Component({
  imports: [NeuralSelect],
  template: \`<neural-select [options]="cities" />\`,
})
export class ShippingForm {}`;

  readonly iconCode = `/* Always include the icon base and curated set */
@import '@neural-ng/icons/icons.css';

/* If an icon is not curated, add its category */
@import '@neural-ng/icons/categories/development.css';

/* Complete catalog: largest option */
/* @import '@neural-ng/icons/all.css'; */`;

  readonly themeCode = `@import 'tailwindcss';
@import '@neural-ng/core/themes/neutral.css';
@import '@neural-ng/core/themes/tailwind.css';
@import '@neural-ng/icons/icons.css';

@custom-variant dark (
  &:where([data-neural-mode='dark'], [data-neural-mode='dark'] *)
);`;

  readonly overlayCode = `<neural-select
  [options]="countries"
  appendTo="body"
  ariaLabel="Country"
/>

<neural-date-picker
  [(value)]="deliveryDate"
  appendTo="body"
/>`;

  readonly reportCode = `NeuralNg: 0.1.0-beta.8
Angular: 22.x
Node: <version used to build or render>
Browser: <name and exact version>
Rendering: CSR | SSR | prerender + hydration
Mode: styled | unstyled
Direction: LTR | RTL

Expected:
Actual:
Minimal template:
Console or hydration error:`;

  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}
