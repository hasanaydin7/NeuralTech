import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { describeDesignToken } from './design-token-description';

@Component({
  selector: 'site-design-token-list',
  template: `
    <div class="grid gap-3 sm:grid-cols-2">
      @for (token of tokens(); track token) {
        <div
          class="rounded-xl border border-[var(--site-border)] bg-[var(--site-surface)] p-4 backdrop-blur-xl"
        >
          <code class="break-all text-xs text-blue-500">{{ token }}</code>
          <p class="mt-2 text-sm leading-6 text-[var(--site-text-soft)]">
            {{ describe(token) }}
          </p>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesignTokenList {
  readonly tokens = input.required<readonly string[]>();
  protected readonly describe = describeDesignToken;
}
