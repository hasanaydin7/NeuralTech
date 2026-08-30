import { ViewportScroller } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

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
          @for (link of links(); track link[1]) {
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

  readonly links = input.required<readonly OnThisPageLink[]>();

  open(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}
