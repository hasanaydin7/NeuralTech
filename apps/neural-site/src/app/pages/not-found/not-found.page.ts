import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NeuralButton } from '@neural-ng/core/button';

@Component({
  selector: 'app-not-found-page',
  imports: [NeuralButton, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main
      class="mx-auto grid min-h-[calc(100dvh-4.5rem)] max-w-[90rem] place-items-center px-5 py-20 text-center"
    >
      <section class="max-w-xl">
        <p
          class="text-sm font-black uppercase tracking-[.18em] text-[var(--neural-color-primary)]"
        >
          404
        </p>
        <h1 class="mt-4 text-4xl font-black tracking-[-.04em] sm:text-5xl">
          This page is outside the graph.
        </h1>
        <p class="mt-5 leading-7 text-[var(--site-text-soft)]">
          The requested NeuralNg route does not exist or has moved.
        </p>
        <div class="mt-8 flex justify-center gap-3">
          <a routerLink="/"><neural-button label="Back home" /></a>
          <a routerLink="/docs/installation">
            <neural-button label="Read the docs" outlined />
          </a>
        </div>
      </section>
    </main>
  `,
})
export class NotFoundPage {}
