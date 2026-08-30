import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  template: `
    <main class="not-found">
      <span>404</span>
      <h1>This route has not been generated yet.</h1>
      <p>Return to the NeuralNg landing page or browse the documentation.</p>
      <div>
        <a routerLink="/">Home</a>
        <a routerLink="/docs/getting-started/installation">Documentation</a>
      </div>
    </main>
  `,
  styles: `
    .not-found {
      display: grid;
      place-items: center;
      min-height: calc(100vh - 10rem);
      padding: 2rem;
      text-align: center;
    }

    span {
      color: var(--neural-color-info);
      font:
        700 0.8rem ui-monospace,
        monospace;
      letter-spacing: 0.15em;
    }

    h1 {
      max-width: 18ch;
      margin: 0.75rem 0;
      font-size: clamp(2rem, 6vw, 4rem);
    }

    p {
      color: var(--neural-color-text-muted);
    }

    div {
      display: flex;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    a {
      padding: 0.65rem 0.9rem;
      color: var(--neural-color-text);
      border: 1px solid var(--neural-color-border);
      border-radius: 0.5rem;
      text-decoration: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {}
