import { ViewportScroller } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

import { SITE_TYPED_CLASS_CONTRACTS } from '../typed-class-api/typed-class-contracts.generated';

export type OnThisPageLink = readonly [label: string, fragment: string];

@Component({
  selector: 'site-on-this-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'hidden xl:sticky xl:top-[7rem] xl:block xl:max-h-[calc(100dvh-8.5rem)] xl:self-start xl:overflow-y-auto xl:overscroll-contain xl:pr-1',
  },
  template: `
    <aside aria-label="On this page">
      <div>
        <p
          class="text-[.65rem] font-black uppercase tracking-[.16em] text-blue-500"
        >
          On this page
        </p>
        <nav class="mt-4 border-l border-[var(--site-border)]">
          @for (link of visibleLinks(); track link[1]) {
            <a
              [attr.href]="'#' + link[1]"
              (click)="open(link[1], $event)"
              class="block border-l border-transparent px-4 py-2 text-sm text-[var(--site-text-muted)] transition hover:border-blue-500 hover:text-[var(--site-text)]"
            >
              {{ link[0] }}
            </a>
          }
        </nav>
      </div>
    </aside>
  `,
})
export class SiteOnThisPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  private readonly destroyRef = inject(DestroyRef);
  private readonly currentUrl = signal(this.router.url);

  readonly links = input.required<readonly OnThisPageLink[]>();
  readonly visibleLinks = computed<readonly OnThisPageLink[]>(() => {
    const links = this.links();
    if (links.some((link) => link[1] === 'class-slots')) return links;

    const componentRoute = resolveComponentApiRoute(this.currentUrl());
    return componentRoute &&
      SITE_TYPED_CLASS_CONTRACTS.some(
        (contract) => contract.route === componentRoute,
      )
      ? [...links, ['Class slots', 'class-slots']]
      : links;
  });

  constructor() {
    const subscription = this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
      )
      .subscribe((event) => this.currentUrl.set(event.urlAfterRedirects));
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  open(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}

function resolveComponentApiRoute(url: string): string | null {
  const path = url.split(/[?#]/, 1)[0];
  const match = /^\/docs\/components\/([^/]+)\/api\/?$/.exec(path);
  return match?.[1] ?? null;
}
