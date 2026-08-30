import { isPlatformBrowser } from '@angular/common';
import {
  DOCUMENT,
  Injectable,
  InjectionToken,
  PLATFORM_ID,
  REQUEST,
  inject,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

const HOME_DESCRIPTION =
  'An Angular UI library built for AI coding agents and developers, with typed standalone components, Signals, accessibility, llms.txt contracts and MCP discovery.';

export const SITE_ORIGIN = new InjectionToken<string>('NEURAL_SITE_ORIGIN', {
  providedIn: 'root',
  factory: () => '',
});

@Injectable({ providedIn: 'root' })
export class SiteSeoService {
  private readonly document = inject(DOCUMENT);
  private readonly meta = inject(Meta);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly request = inject(REQUEST, { optional: true });
  private readonly router = inject(Router);
  private readonly siteOrigin = inject(SITE_ORIGIN);
  private readonly title = inject(Title);

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.update());
  }

  private update(): void {
    const path = this.router.url.split(/[?#]/, 1)[0] || '/';
    const title = this.routeTitle() || this.title.getTitle() || 'NeuralNg';
    const notFound = title.startsWith('Page not found');
    const description = this.description(path, title);
    const canonical = this.absoluteUrl(path);
    const socialImage = this.absoluteUrl('/img/dark-landing.webp');

    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({
      name: 'robots',
      content: notFound ? 'noindex, follow' : 'index, follow',
    });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: 'NeuralNg' });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({
      name: 'twitter:card',
      content: 'summary_large_image',
    });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    if (canonical && socialImage) {
      this.meta.updateTag({ property: 'og:url', content: canonical });
      this.meta.updateTag({ property: 'og:image', content: socialImage });
      this.meta.updateTag({ name: 'twitter:image', content: socialImage });

      let link = this.document.head.querySelector<HTMLLinkElement>(
        'link[rel="canonical"]',
      );
      if (!link) {
        link = this.document.createElement('link');
        link.rel = 'canonical';
        this.document.head.append(link);
      }
      link.setAttribute('href', canonical);
    }
  }

  private description(path: string, title: string): string {
    if (path === '/') return HOME_DESCRIPTION;
    if (path === '/404' || title.startsWith('Page not found'))
      return 'The requested NeuralNg page could not be found.';
    const subject = title.replace(/\s+—\s+NeuralNg$/, '');
    return `Build ${subject} in Angular with NeuralNg: typed standalone APIs, Signals, accessibility, examples, tokens and guidance for AI coding agents.`;
  }

  private routeTitle(): string | undefined {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) route = route.firstChild;
    return typeof route.title === 'string' ? route.title : undefined;
  }

  private absoluteUrl(path: string): string | undefined {
    if (this.siteOrigin) return new URL(path, this.siteOrigin).href;
    const requestUrl = this.request ? new URL(this.request.url) : undefined;
    if (
      requestUrl &&
      (requestUrl.hostname === 'localhost' ||
        requestUrl.hostname === '127.0.0.1')
    ) {
      return undefined;
    }
    if (!requestUrl && !isPlatformBrowser(this.platformId)) return undefined;
    const requestOrigin = requestUrl?.origin ?? this.document.location?.origin;
    const origin =
      requestOrigin && requestOrigin !== 'null'
        ? requestOrigin
        : this.document.baseURI;
    return new URL(path, origin).href;
  }
}
