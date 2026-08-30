import { DOCUMENT, isPlatformBrowser } from '@angular/common';
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
import {
  PaginatorComponent,
  type NeuralPaginatorLabels,
} from '@neural-ng/core/paginator';
import { CodeView } from '../../../shared/code-view';
import { NeuralColorModeService } from '@neural-ng/core/color-mode';
import { SelectComponent, NeuralSelectChange } from '@neural-ng/core/select';
import { NeuralInput } from '@neural-ng/core/input';
import { FieldComponent, FieldLabelDirective } from '@neural-ng/core/field';


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

interface CategoryOption {
  readonly label: string;
  readonly value: string;
}

@Component({
  selector: 'app-icons-page',
  imports: [
    PaginatorComponent,
    CodeView,
    SelectComponent,
    NeuralInput,
    FieldComponent,
    FieldLabelDirective,
  ],
  templateUrl: './icons.page.html',
  styleUrls: ['./icons.page.scss', '../shared-doc-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconsPage {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly stylesheetLinks = new Map<string, HTMLLinkElement>();

  readonly resolvedMode = inject(NeuralColorModeService).resolvedMode;

  readonly metadata = signal<IconCatalog | null>(null);
  readonly query = signal('');
  readonly style = signal<IconStyle>('outline');
  readonly category = signal('all');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(48);
  readonly copiedClass = signal<string | null>(null);
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

  readonly totals = computed(() =>
    this.metadata()?.totals ?? {
      icons: 0,
      outline: 0,
      filled: 0,
    },
  );

  readonly styles = computed(() => {
    const totals = this.totals();
    return [
      {
        label: `Outline (${totals.outline})`,
        style: 'outline' as const,
      },
      {
        label: `Filled (${totals.filled})`,
        style: 'filled' as const,
      },
    ];
  });

  readonly categoryOptions = computed<readonly CategoryOption[]>(() => {
    const metadata = this.metadata();
    const style = this.style();

    if (!metadata) {
      return [
        {
          label: 'All categories (0)',
          value: 'all',
        },
      ];
    }

    return [
      {
        label: `All categories (${metadata.totals[style]})`,
        value: 'all',
      },
      ...metadata.categories
        .filter((category) => category[style] > 0)
        .map((category) => ({
          label: `${category.name} (${category[style]})`,
          value: category.name,
        })),
    ];
  });

  readonly availableCategories = computed(() => {
    const style = this.style();
    return (this.metadata()?.categories ?? []).filter(
      (category) => category[style] > 0,
    );
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
    const categories = new Set(
      this.visibleIcons().map((icon) => icon.category),
    );

    return [
      '/neural-icons/categories/shapes.css',
      ...[...categories].map(
        (category) => `/neural-icons/${directory}/${category}.css`,
      ),
    ];
  });

readonly copiedIcon = signal<string | null>(null);

private copiedIconTimer?: number;

async copyIconClass(icon: IconCatalogEntry): Promise<void> {
  const className = this.iconClass(icon);

  try {
    await navigator.clipboard.writeText(className);

    this.copiedIcon.set(className);

    if (this.copiedIconTimer) {
      window.clearTimeout(this.copiedIconTimer);
    }

    this.copiedIconTimer = window.setTimeout(() => {
      this.copiedIcon.set(null);
    }, 1400);
  } catch {
    this.copiedIcon.set(null);
  }
}

  readonly installCommand = 'npm install @neural-ng/icons';
  readonly coreImport = "@import '@neural-ng/icons/icons.css';";
  readonly fullImport = "@import '@neural-ng/icons/all.css';";
  readonly classExample = `
    <i class="nt nt-user size-small" aria-hidden="true"></i>
    <i class="nt nt-heart size-medium color-accent" aria-hidden="true"></i>
    <i class="nt nt-circle-check size-large color-success" aria-hidden="true"></i>`;
  readonly categoryExample =
    "@import '@neural-ng/icons/categories/system.css';";

  constructor() {
    void import('@neural-ng/icons/metadata.json').then(
      ({ default: metadata }) => {
        this.metadata.set(metadata as IconCatalog);
      },
    );

    effect(() => this.loadStylesheets(this.requiredStylesheets()));
    inject(DestroyRef).onDestroy(() => {
      for (const link of this.stylesheetLinks.values()) {
        link.remove();
      }
      this.stylesheetLinks.clear();
    });
  }

  changeQuery(event: Event): void {
    this.pageIndex.set(0);
    this.copiedClass.set(null);
    this.query.set((event.target as HTMLInputElement).value);
  }

  changeStyle(event: NeuralSelectChange): void {
    const value = event.value;

    if (value !== 'outline' && value !== 'filled') {
      return;
    }

    this.style.set(value);
    this.pageIndex.set(0);
    this.copiedClass.set(null);

    const activeCategory = this.metadata()?.categories.find(
      (category) => category.name === this.category(),
    );

    if (activeCategory && activeCategory[value] === 0) {
      this.category.set('all');
    }
  }

  changeCategory(event: NeuralSelectChange): void {
    const value = event.value;

    if (typeof value !== 'string') {
      return;
    }

    this.category.set(value);
    this.pageIndex.set(0);
    this.copiedClass.set(null);
  }

  iconClass(icon: IconCatalogEntry): string {
    const prefix = this.style() === 'filled' ? 'nt-filled-' : 'nt-';
    return `nt ${prefix}${icon.name}`;
  }

  // async copyIconClass(icon: IconCatalogEntry): Promise<void> {
  //   const iconClass = this.iconClass(icon);
  //   const clipboard = globalThis.navigator?.clipboard;

  //   if (!clipboard) {
  //     this.copiedClass.set(`Copy manually: ${iconClass}`);
  //     return;
  //   }

  //   try {
  //     await clipboard.writeText(iconClass);
  //     this.copiedClass.set(iconClass);
  //   } catch {
  //     this.copiedClass.set(`Copy manually: ${iconClass}`);
  //   }
  // }

  private loadStylesheets(stylesheets: readonly string[]): void {
    if (!this.isBrowser) return;

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
