import { SiteOnThisPage } from '../../../shared/on-this-page';
import { DOCUMENT, ViewportScroller, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NeuralField, NeuralFieldLabel } from '@neural-ng/core/field';
import { NeuralInput } from '@neural-ng/core/input';
import {
  NeuralPaginator,
  type NeuralPageChange,
  type NeuralPaginatorLabels,
} from '@neural-ng/core/paginator';
import { NeuralSelect, type NeuralSelectChange } from '@neural-ng/core/select';
import { SiteAppearanceService } from '../../../core/site-appearance.service';
import { CodeView } from '../../../shared/code-view';

type IconStyle = 'outline' | 'filled';

interface IconCatalogEntry {
  readonly name: string;
  readonly category: string;
  readonly styles: readonly IconStyle[];
  readonly effects?: readonly 'spin-dual'[];
}

interface IconCatalogCategory {
  readonly name: string;
  readonly outline: number;
  readonly filled: number;
}

interface IconCatalog {
  readonly totals: {
    readonly icons: number;
    readonly outline: number;
    readonly filled: number;
  };
  readonly categories: readonly IconCatalogCategory[];
  readonly icons: readonly IconCatalogEntry[];
}

interface SelectOption<T extends string> {
  readonly label: string;
  readonly value: T;
}

@Component({
  selector: 'app-icons-page',
  imports: [
    SiteOnThisPage,
    CodeView,
    NeuralField,
    NeuralFieldLabel,
    NeuralInput,
    NeuralPaginator,
    NeuralSelect,
  ],
  templateUrl: './icons.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconsPage {
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  private readonly stylesheetLinks = new Map<string, HTMLLinkElement>();
  private copiedTimer?: ReturnType<typeof setTimeout>;

  readonly appearance = inject(SiteAppearanceService);
  readonly metadata = signal<IconCatalog | null>(null);
  readonly query = signal('');
  readonly style = signal<IconStyle>('outline');
  readonly category = signal('all');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(48);
  readonly copiedIcon = signal<string | null>(null);

  readonly pageLinks = [
    ['Install', 'install'],
    ['Import size', 'imports'],
    ['Class API', 'usage'],
    ['Icon catalog', 'catalog'],
    ['Motion', 'motion'],
    ['Accessibility', 'accessibility'],
    ['Content Security Policy', 'csp'],
  ] as const;
  readonly pageSizeOptions = [24, 48, 72, 96] as const;
  readonly paginatorLabels: Partial<NeuralPaginatorLabels> = {
    navigation: 'Icon catalog pages',
    firstPage: 'First icon page',
    previousPage: 'Previous icon page',
    nextPage: 'Next icon page',
    lastPage: 'Last icon page',
    page: 'Icon page {page}',
    pageSize: 'Icons per page',
  };

  readonly totals = computed(
    () => this.metadata()?.totals ?? { icons: 0, outline: 0, filled: 0 },
  );
  readonly styleOptions = computed<readonly SelectOption<IconStyle>[]>(() => [
    { label: `Outline (${this.totals().outline})`, value: 'outline' },
    { label: `Filled (${this.totals().filled})`, value: 'filled' },
  ]);
  readonly categoryOptions = computed<readonly SelectOption<string>[]>(() => {
    const metadata = this.metadata();
    const style = this.style();
    if (!metadata) return [{ label: 'All categories (0)', value: 'all' }];
    return [
      { label: `All categories (${metadata.totals[style]})`, value: 'all' },
      ...metadata.categories
        .filter((entry) => entry[style] > 0)
        .map((entry) => ({
          label: `${formatCategory(entry.name)} (${entry[style]})`,
          value: entry.name,
        })),
    ];
  });
  readonly matchingIcons = computed(() => {
    const query = this.query().trim().toLocaleLowerCase('en-US');
    const style = this.style();
    const category = this.category();
    return (this.metadata()?.icons ?? []).filter(
      (icon) =>
        icon.styles.includes(style) &&
        (category === 'all' || icon.category === category) &&
        (query.length === 0 || icon.name.includes(query)),
    );
  });
  readonly visibleIcons = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.matchingIcons().slice(start, start + this.pageSize());
  });
  readonly requiredStylesheets = computed(() => {
    const directory =
      this.style() === 'filled' ? 'categories/filled' : 'categories';
    return [...new Set(this.visibleIcons().map((icon) => icon.category))].map(
      (category) => `/neural-icons/${directory}/${category}.css`,
    );
  });

  readonly installCode = `npm install @neural-ng/icons`;
  readonly importsCode = `/* Curated production set */
@import '@neural-ng/icons/icons.css';

/* One category */
@import '@neural-ng/icons/categories/system.css';

/* Complete outline + filled catalog */
@import '@neural-ng/icons/all.css';`;
  readonly usageCode = `<i class="nt nt-user" aria-hidden="true"></i>
<i class="nt nt-search text-2xl text-primary-500" aria-hidden="true"></i>
<i class="nt nt-circle-check text-4xl text-emerald-500" aria-hidden="true"></i>`;
  readonly motionCode = `<i class="nt nt-spinner nt-spin" aria-hidden="true"></i>
<i class="nt nt-spinner nt-spin-reverse" aria-hidden="true"></i>
<i class="nt nt-loader-3 nt-spin-dual" aria-hidden="true"></i>`;
  readonly accessibilityCode = `<button type="button" aria-label="Open profile">
  <i class="nt nt-user" aria-hidden="true"></i>
</button>`;
  readonly cspCode = `Content-Security-Policy: img-src 'self' data:;`;

  constructor() {
    void import('@neural-ng/icons/metadata.json').then(({ default: value }) =>
      this.metadata.set(value as IconCatalog),
    );
    effect(() => this.loadStylesheets(this.requiredStylesheets()));
    this.destroyRef.onDestroy(() => {
      if (this.copiedTimer) clearTimeout(this.copiedTimer);
      for (const link of this.stylesheetLinks.values()) link.remove();
      this.stylesheetLinks.clear();
    });
  }

  changeQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.pageIndex.set(0);
  }

  changeStyle(event: NeuralSelectChange): void {
    if (event.value !== 'outline' && event.value !== 'filled') return;
    this.style.set(event.value);
    const selectedCategory = this.metadata()?.categories.find(
      (entry) => entry.name === this.category(),
    );
    if (selectedCategory && selectedCategory[event.value] === 0) {
      this.category.set('all');
    }
    this.pageIndex.set(0);
  }

  changeCategory(event: NeuralSelectChange): void {
    if (typeof event.value !== 'string') return;
    this.category.set(event.value);
    this.pageIndex.set(0);
  }

  changePage(event: NeuralPageChange): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  iconClass(icon: IconCatalogEntry): string {
    return `nt ${this.style() === 'filled' ? 'nt-filled-' : 'nt-'}${icon.name}`;
  }

  iconMarkup(icon: IconCatalogEntry): string {
    return `<i class="${this.iconClass(icon)}" aria-hidden="true"></i>`;
  }

  async copyIcon(icon: IconCatalogEntry): Promise<void> {
    const markup = this.iconMarkup(icon);
    try {
      await globalThis.navigator?.clipboard?.writeText(markup);
      this.copiedIcon.set(this.iconClass(icon));
      if (this.copiedTimer) clearTimeout(this.copiedTimer);
      this.copiedTimer = setTimeout(() => this.copiedIcon.set(null), 1400);
    } catch {
      this.copiedIcon.set(null);
    }
  }

  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }

  private loadStylesheets(stylesheets: readonly string[]): void {
    if (!this.browser) return;
    for (const href of stylesheets) {
      if (this.stylesheetLinks.has(href)) continue;
      const link = this.document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.dataset['neuralIconsDocs'] = '';
      this.document.head.append(link);
      this.stylesheetLinks.set(href, link);
    }
  }
}

function formatCategory(value: string): string {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
