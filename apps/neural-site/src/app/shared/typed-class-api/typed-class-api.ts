import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import {
  SITE_TYPED_CLASS_CONTRACTS,
  type SiteTypedClassContract,
} from './typed-class-contracts.generated';

@Component({
  selector: 'site-typed-class-api',
  template: `
    @if (contracts().length) {
      <section
        id="class-slots"
        class="mx-auto max-w-[84rem] scroll-mt-28 px-5 pb-16 lg:px-10 lg:pb-20"
        aria-labelledby="typed-class-api-title"
      >
        <div class="border-t border-[var(--site-border)] pt-12">
          <p class="text-xs font-black tracking-[0.16em] text-blue-500">
            TYPED STYLING API
          </p>
          <h2
            id="typed-class-api-title"
            class="mt-3 text-3xl font-black tracking-[-0.03em]"
          >
            Classes contract
          </h2>
          <p class="mt-4 max-w-4xl leading-7 text-[var(--site-text-soft)]">
            The <code>classes</code> input accepts the typed contracts below.
            Every property is an optional class string merged onto one owned
            element; structural and accessibility behavior stay intact. Use
            <code>unstyled</code> when you want to remove NeuralNg's visual
            classes while retaining these consumer classes.
          </p>

          @for (contract of contracts(); track contract.typeName) {
            <article
              class="mt-10 overflow-hidden rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] backdrop-blur-xl"
            >
              <header
                class="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--site-border)] p-5 sm:p-6"
              >
                <div>
                  <h3 class="font-mono text-lg font-black text-blue-500">
                    {{ contract.typeName }}
                  </h3>
                  <p class="mt-2 text-sm text-[var(--site-text-muted)]">
                    Used by <code>{{ contract.entryPoint }}</code>
                  </p>
                </div>
                <code
                  class="rounded-lg border border-[var(--site-border)] px-3 py-2 text-xs"
                >
                  &#123; [slot]?: string &#125;
                </code>
              </header>

              <div class="overflow-x-auto">
                <table class="w-full min-w-[52rem] text-left text-sm">
                  <thead
                    class="text-xs uppercase tracking-wider text-[var(--site-text-muted)]"
                  >
                    <tr>
                      <th class="p-4">Slot</th>
                      <th class="p-4">Value</th>
                      <th class="p-4">Target</th>
                      <th class="p-4">Applied</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[var(--site-border)]">
                    @for (slot of contract.slots; track slot.name) {
                      <tr class="align-top">
                        <td class="p-4 font-mono font-bold text-blue-500">
                          {{ slot.name }}
                        </td>
                        <td class="p-4 font-mono text-xs">{{ slot.type }}</td>
                        <td
                          class="max-w-xl p-4 leading-6 text-[var(--site-text-soft)]"
                        >
                          {{ slot.description }}
                        </td>
                        <td class="p-4 text-xs text-[var(--site-text-muted)]">
                          {{ slot.availability }}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </article>
          }

          <div
            class="mt-8 rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-5"
          >
            <h3 class="font-black">Usage</h3>
            <pre
              class="mt-4 overflow-x-auto text-sm"
            ><code>{{ usageExample() }}</code></pre>
          </div>
        </div>
      </section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteTypedClassApi {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly currentUrl = signal(this.router.url);

  readonly contracts = computed<readonly SiteTypedClassContract[]>(() => {
    const route = resolveComponentApiRoute(this.currentUrl());
    return route
      ? SITE_TYPED_CLASS_CONTRACTS.filter(
          (contract) => contract.route === route,
        )
      : [];
  });

  readonly usageExample = computed(() => {
    const contract = this.contracts()[0];
    if (!contract) return '';
    const slots = contract.slots.slice(0, 2);
    const properties = slots
      .map((slot) => `  ${slot.name}: 'your-classes'`)
      .join(',\n');
    return `readonly classes: ${contract.typeName} = {\n${properties}\n};`;
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
}

export function resolveComponentApiRoute(url: string): string | null {
  const path = url.split(/[?#]/, 1)[0];
  const match = /^\/docs\/components\/([^/]+)\/api\/?$/.exec(path);
  return match?.[1] ?? null;
}
