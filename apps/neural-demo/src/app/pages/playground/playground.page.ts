import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  PLATFORM_ID,
  ViewEncapsulation,
  signal,
} from '@angular/core';
import { FormField, email, form, required } from '@angular/forms/signals';
import { NeuralButton } from '@neural-ng/core/button';
import {
  NeuralCard,
  NeuralCardBody,
  NeuralCardFooter,
  NeuralCardHeader,
  type NeuralCardClasses,
} from '@neural-ng/core/card';
import {
  NeuralColorModeService,
  type NeuralColorMode,
} from '@neural-ng/core/color-mode';
import {
  FieldComponent,
  FieldControlDirective,
  FieldErrorDirective,
  FieldHintDirective,
  FieldLabelDirective,
} from '@neural-ng/core/field';
import { NeuralInput } from '@neural-ng/core/input';
import {
  NeuralMessageService,
  type NeuralMessageSeverity,
} from '@neural-ng/core/message';
import {
  PaginatorComponent,
  type NeuralPageChange,
  type NeuralPaginatorLabels,
} from '@neural-ng/core/paginator';
import {
  TabComponent,
  TabListComponent,
  TabPanelComponent,
  TabPanelsComponent,
  TabsComponent,
  type NeuralTabsClasses,
  type NeuralTabValue,
} from '@neural-ng/core/tabs';
import {
  NeuralToastTemplateDirective,
  ToastComponent,
  type NeuralToastPosition,
} from '@neural-ng/core/toast';
import { SiteThemeService } from '../../core/site-theme.service';

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

@Component({
  imports: [
    NeuralButton,
    NeuralCard,
    NeuralCardHeader,
    NeuralCardBody,
    NeuralCardFooter,
    FieldComponent,
    FieldControlDirective,
    FieldErrorDirective,
    FieldHintDirective,
    FieldLabelDirective,
    NeuralInput,
    FormField,
    PaginatorComponent,
    TabsComponent,
    TabListComponent,
    TabComponent,
    TabPanelsComponent,
    TabPanelComponent,
    ToastComponent,
    NeuralToastTemplateDirective,
  ],
  selector: 'app-playground-page',
  templateUrl: './playground.page.html',
  styleUrl: './playground.page.scss',
  encapsulation: ViewEncapsulation.None,
})
export class PlaygroundPage {
  private readonly messages = inject(NeuralMessageService);
  private readonly siteTheme = inject(SiteThemeService);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly iconStylesheetLinks = new Map<string, HTMLLinkElement>();
  private readonly queueDemoTimers = new Set<ReturnType<typeof setTimeout>>();

  readonly colorMode = inject(NeuralColorModeService);
  readonly colorModes: readonly NeuralColorMode[] = ['light', 'dark', 'system'];
  readonly iconMetadata = signal<IconCatalog | null>(null);
  readonly iconCatalogReady = import('@neural-ng/icons/metadata.json').then(
    ({ default: metadata }) => {
      this.iconMetadata.set(metadata as IconCatalog);
    },
  );
  readonly iconTotals = computed(
    () =>
      this.iconMetadata()?.totals ?? {
        icons: 0,
        outline: 0,
        filled: 0,
      },
  );
  readonly iconCategories = computed(
    () => this.iconMetadata()?.categories ?? [],
  );
  readonly iconQuery = signal('');
  readonly iconStyle = signal<IconStyle>('outline');
  readonly iconCategory = signal('all');
  readonly iconPageIndex = signal(0);
  readonly iconPageSize = signal(48);
  readonly iconPageSizeOptions = [24, 48, 96] as const;
  readonly iconPaginatorLabels: Partial<NeuralPaginatorLabels> = {
    navigation: 'İkon sayfaları',
    firstPage: 'İlk ikon sayfası',
    previousPage: 'Önceki ikon sayfası',
    nextPage: 'Sonraki ikon sayfası',
    lastPage: 'Son ikon sayfası',
    page: 'İkon sayfası {page}',
    pageSize: 'Sayfa başına ikon',
  };
  readonly headlessPaginatorIndex = signal(0);
  readonly headlessPaginatorSize = signal(5);
  readonly headlessPaginatorLabels: Partial<NeuralPaginatorLabels> = {
    navigation: 'Headless demo pages',
    firstPage: 'First headless page',
    previousPage: 'Previous headless page',
    nextPage: 'Next headless page',
    lastPage: 'Last headless page',
    page: 'Headless page {page}',
    pageSize: 'Demo items per page',
  };
  readonly headlessPaginatorClasses = {
    list: 'demo-headless-paginator-list',
    navigationButton: 'demo-headless-paginator-button',
    pageButton: 'demo-headless-paginator-button',
    activePageButton: 'demo-headless-paginator-active',
    ellipsis: 'demo-headless-paginator-ellipsis',
    report: 'demo-headless-paginator-report',
    pageSize: 'demo-headless-paginator-size',
    pageSizeSelect: 'demo-headless-paginator-select',
  } as const;
  readonly headlessCardClasses: NeuralCardClasses = {
    root: 'demo-headless-card',
    header: 'demo-headless-card-header',
    body: 'demo-headless-card-body',
    footer: 'demo-headless-card-footer',
  };
  readonly inputModel = signal({ email: 'developer@neural.ng' });
  readonly inputForm = form(this.inputModel, (path) => {
    required(path.email, { message: 'Email is required.' });
    email(path.email, { message: 'Enter a valid email address.' });
  });
  readonly activeTab = signal<NeuralTabValue | null>('overview');
  readonly manualTab = signal<NeuralTabValue | null>('activity');
  readonly headlessTab = signal<NeuralTabValue | null>('markup');
  readonly headlessTabsClasses: NeuralTabsClasses = {
    root: 'demo-headless-tabs',
    list: 'demo-headless-tab-list',
    tab: 'demo-headless-tab',
    activeTab: 'demo-headless-tab-active',
    panels: 'demo-headless-tab-panels',
    panel: 'demo-headless-tab-panel',
  };
  readonly copiedIcon = signal<string | null>(null);
  readonly availableIconCategories = computed(() => {
    const countKey = this.iconStyle();
    return this.iconCategories().filter((category) => category[countKey] > 0);
  });
  readonly matchingIcons = computed(() => {
    const query = this.iconQuery().trim().toLocaleLowerCase('en-US');
    const style = this.iconStyle();
    const category = this.iconCategory();

    return (this.iconMetadata()?.icons ?? []).filter(
      (icon) =>
        icon.styles.includes(style) &&
        (category === 'all' || icon.category === category) &&
        (query.length === 0 || icon.name.includes(query)),
    );
  });
  readonly visibleIcons = computed(() => {
    const startIndex = this.iconPageIndex() * this.iconPageSize();
    return this.matchingIcons().slice(
      startIndex,
      startIndex + this.iconPageSize(),
    );
  });
  readonly iconStylesheets = computed(() => {
    const style = this.iconStyle();
    const categories = new Set(
      this.visibleIcons().map((icon) => icon.category),
    );
    const directory = style === 'filled' ? 'categories/filled' : 'categories';
    const visibleStylesheets = [...categories].map(
      (category) => `/neural-icons/${directory}/${category}.css`,
    );
    return [
      ...new Set([
        ...visibleStylesheets,
        '/neural-icons/categories/system.css',
      ]),
    ];
  });
  readonly currentTheme = this.siteTheme.theme;
  readonly toastPosition = signal<NeuralToastPosition>('top-end');
  readonly toastPositions: readonly NeuralToastPosition[] = [
    'top-start',
    'top-center',
    'top-end',
    'middle-start',
    'middle-center',
    'middle-end',
    'bottom-start',
    'bottom-center',
    'bottom-end',
  ];
  readonly isLoading = signal(false);
  readonly lastAction = signal('No interaction yet');

  constructor() {
    effect(() => this.loadIconStylesheets(this.iconStylesheets()));
    inject(DestroyRef).onDestroy(() => {
      this.cancelQueueDemo();
      for (const link of this.iconStylesheetLinks.values()) {
        link.remove();
      }
      this.iconStylesheetLinks.clear();
    });
  }

  changeTheme(theme: 'neutral' | 'glass' | 'mist' | 'futuristic'): void {
    this.siteTheme.applyPreset(theme);
  }

  changeColorMode(mode: NeuralColorMode): void {
    this.colorMode.set(mode);
    this.lastAction.set(
      `Color mode: ${mode} (${this.colorMode.resolvedMode()})`,
    );
  }

  changeToastPosition(event: Event): void {
    const position = (event.target as HTMLSelectElement).value;

    if (this.toastPositions.includes(position as NeuralToastPosition)) {
      this.toastPosition.set(position as NeuralToastPosition);
    }
  }

  changeIconQuery(event: Event): void {
    this.iconPageIndex.set(0);
    this.iconQuery.set((event.target as HTMLInputElement).value);
  }

  changeIconStyle(event: Event): void {
    const style = (event.target as HTMLSelectElement).value as IconStyle;
    if (style !== 'outline' && style !== 'filled') {
      return;
    }

    this.iconStyle.set(style);
    this.iconPageIndex.set(0);
    const activeCategory = this.iconCategories().find(
      (category) => category.name === this.iconCategory(),
    );
    if (activeCategory && activeCategory[style] === 0) {
      this.iconCategory.set('all');
    }
  }

  changeIconCategory(event: Event): void {
    this.iconPageIndex.set(0);
    this.iconCategory.set((event.target as HTMLSelectElement).value);
  }

  handleIconPageChange(event: NeuralPageChange): void {
    this.lastAction.set(
      `Icon page ${event.pageIndex + 1}: ${event.startIndex}–${event.endIndex}`,
    );
  }

  iconClass(icon: IconCatalogEntry): string {
    const prefix = this.iconStyle() === 'filled' ? 'nt-filled-' : 'nt-';
    return `nt ${prefix}${icon.name}`;
  }

  async copyIconClass(icon: IconCatalogEntry): Promise<void> {
    const iconClass = this.iconClass(icon);
    const clipboard = globalThis.navigator?.clipboard;
    if (!clipboard) {
      this.lastAction.set(`Clipboard unavailable: ${iconClass}`);
      return;
    }

    try {
      await clipboard.writeText(iconClass);
      this.copiedIcon.set(iconClass);
      this.lastAction.set(`Copied ${iconClass}`);
    } catch {
      this.lastAction.set(`Clipboard permission denied: ${iconClass}`);
    }
  }

  toggleLoading(): void {
    this.lastAction.set('Loading started');
    this.isLoading.set(true);
    setTimeout(() => {
      this.isLoading.set(false);
      this.lastAction.set('Loading finished');
      this.messages.notify({
        severity: 'success',
        title: 'Kaydedildi',
        message: 'Buton işlemi başarıyla tamamlandı.',
      });
    }, 2000);
  }

  showMessage(severity: NeuralMessageSeverity): void {
    const examples: Record<
      NeuralMessageSeverity,
      { readonly title: string; readonly message: string }
    > = {
      primary: {
        title: 'Birincil',
        message: 'Birincil eylem bildirimi.',
      },
      secondary: {
        title: 'İkincil',
        message: 'İkincil eylem bildirimi.',
      },
      neutral: { title: 'Bildirim', message: 'Nötr bir sistem mesajı.' },
      info: { title: 'Bilgi', message: 'Yeni bir güncelleme mevcut.' },
      success: { title: 'Başarılı', message: 'İşlem başarıyla tamamlandı.' },
      warning: {
        title: 'Dikkat',
        message: 'Bu mesaj varsayılan olarak kalıcı.',
      },
      error: { title: 'Hata', message: 'İşlem tamamlanamadı.' },
    };

    this.messages.notify({ severity, ...examples[severity] });
    this.lastAction.set(`${severity} message sent`);
  }

  showNonDismissibleMessage(): void {
    this.messages.notify({
      severity: 'info',
      title: 'Otomatik kapanır',
      message: 'Kapatma butonu olmayan dört saniyelik mesaj.',
      duration: 4000,
      dismissible: false,
    });
    this.lastAction.set('Non-dismissible message sent');
  }

  showHeadlessMessage(): void {
    this.messages.notify({
      severity: 'success',
      title: 'Unstyled channel',
      message: 'Bu görünüm tamamen demo uygulamasının CSS sınıfıyla çizildi.',
      channel: 'unstyled-demo',
    });
    this.lastAction.set('Unstyled channel message sent');
  }

  showTemplateMessage(): void {
    this.messages.notify({
      severity: 'warning',
      title: 'Custom template',
      message: 'İçerik NeuralToastTemplateDirective tarafından çiziliyor.',
      channel: 'template-demo',
      duration: 8000,
    });
    this.lastAction.set('Custom template message sent');
  }

  demonstrateOverflow(): void {
    this.cancelQueueDemo();
    this.messages.clear('queue-demo');

    const sendQueueMessage = (index: number): void => {
      this.messages.notify({
        severity: 'info',
        title: `Kuyruk mesajı ${index}`,
        message: 'Aynı kanalda yalnızca son üç mesaj tutulur.',
        channel: 'queue-demo',
        duration: null,
      });
    };

    sendQueueMessage(1);
    this.lastAction.set('Queue demo started; messages arrive one by one');

    for (let index = 2; index <= 4; index += 1) {
      const timer = setTimeout(
        () => {
          this.queueDemoTimers.delete(timer);
          sendQueueMessage(index);

          if (index === 4) {
            this.lastAction.set(
              'Fourth message removed the oldest queue message',
            );
          }
        },
        (index - 1) * 600,
      );

      this.queueDemoTimers.add(timer);
    }
  }

  clearMessages(channel?: string): void {
    if (channel === undefined || channel === 'queue-demo') {
      this.cancelQueueDemo();
    }

    this.messages.clear(channel);
    this.lastAction.set(
      channel ? `${channel} channel cleared` : 'All messages cleared',
    );
  }

  logClick(name: string): void {
    this.lastAction.set(name);
    console.log(`${name} button clicked!`);
  }

  handleSubmit(event: SubmitEvent): void {
    event.preventDefault();
    this.lastAction.set('Native form submitted');
    this.messages.notify({
      severity: 'success',
      title: 'Form gönderildi',
      message: 'Native submit davranışı çalıştı.',
    });
  }

  private cancelQueueDemo(): void {
    for (const timer of this.queueDemoTimers) {
      clearTimeout(timer);
    }
    this.queueDemoTimers.clear();
  }

  private loadIconStylesheets(stylesheets: readonly string[]): void {
    if (!this.isBrowser) {
      return;
    }

    for (const href of stylesheets) {
      if (this.iconStylesheetLinks.has(href)) {
        continue;
      }

      const link = this.document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.dataset['neuralIconCatalog'] = '';
      this.document.head.append(link);
      this.iconStylesheetLinks.set(href, link);
    }
  }
}
