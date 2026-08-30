import { SiteOnThisPage } from '../../../shared/on-this-page';
import { ViewportScroller } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SiteAppearanceService } from '../../../core/site-appearance.service';
import { CodeView } from '../../../shared/code-view';

@Component({
  selector: 'app-versioning-compatibility-page',
  imports: [SiteOnThisPage, CodeView],
  templateUrl: './versioning-compatibility.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VersioningCompatibilityPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);

  readonly pageLinks = [
    ['Current contract', 'current'],
    ['Package matrix', 'packages'],
    ['Angular majors', 'angular'],
    ['Runtime environments', 'runtime'],
    ['Browsers', 'browsers'],
    ['Release channels', 'channels'],
    ['Semantic versioning', 'semver'],
    ['Support boundary', 'boundary'],
  ] as const;

  readonly peerCode = `{
  "peerDependencies": {
    "@angular/common": "^22.0.0",
    "@angular/core": "^22.0.0",
    "@angular/forms": "^22.0.0",
    "@angular/router": "^22.0.0"
  },
  "peerDependenciesMeta": {
    "@angular/forms": { "optional": true },
    "@angular/router": { "optional": true }
  }
}`;

  readonly runtimeRequirements = [
    [
      'Angular application',
      "Follow the official Node.js and TypeScript matrix for your application's Angular major.",
    ],
    [
      'MCP Server',
      'The @neural-ng/mcp executable currently requires Node.js 24.x.',
    ],
    [
      'Theme CLI',
      'The @neural-ng/theme executable currently requires Node.js 24.x.',
    ],
  ] as const;

  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}
