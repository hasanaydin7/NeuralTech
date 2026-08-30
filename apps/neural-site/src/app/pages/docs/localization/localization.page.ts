import { SiteOnThisPage } from '../../../shared/on-this-page';
import { ViewportScroller } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NeuralButton } from '@neural-ng/core/button';
import { NeuralLocaleService, type NeuralLocale } from '@neural-ng/core/i18n';
import { neuralAr } from '@neural-ng/core/locales/ar';
import { neuralDe } from '@neural-ng/core/locales/de';
import { neuralEn } from '@neural-ng/core/locales/en';
import { neuralEs } from '@neural-ng/core/locales/es';
import { neuralFr } from '@neural-ng/core/locales/fr';
import { neuralPtBr } from '@neural-ng/core/locales/pt-br';
import { neuralTr } from '@neural-ng/core/locales/tr';
import { neuralZhCn } from '@neural-ng/core/locales/zh-cn';
import { NeuralPaginator } from '@neural-ng/core/paginator';
import { SiteAppearanceService } from '../../../core/site-appearance.service';
import { CodeView } from '../../../shared/code-view';

@Component({
  selector: 'app-localization-page',
  imports: [SiteOnThisPage, CodeView, NeuralButton, NeuralPaginator],
  templateUrl: './localization.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocalizationPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  private readonly destroyRef = inject(DestroyRef);
  readonly appearance = inject(SiteAppearanceService);
  readonly locale = inject(NeuralLocaleService);
  private readonly initialLocale = this.locale.locale();

  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly report = computed(() =>
    this.locale.format(this.locale.messages().paginator.report, {
      start: 1,
      end: 10,
      total: 137,
    }),
  );

  readonly supportedLocales = [
    { name: 'English', short: 'EN', entry: 'en', locale: neuralEn },
    { name: 'Türkçe', short: 'TR', entry: 'tr', locale: neuralTr },
    { name: 'Deutsch', short: 'DE', entry: 'de', locale: neuralDe },
    { name: 'Français', short: 'FR', entry: 'fr', locale: neuralFr },
    { name: 'Español', short: 'ES', entry: 'es', locale: neuralEs },
    {
      name: 'Português (Brasil)',
      short: 'PT',
      entry: 'pt-br',
      locale: neuralPtBr,
    },
    { name: 'العربية', short: 'AR', entry: 'ar', locale: neuralAr },
    {
      name: '简体中文',
      short: 'ZH',
      entry: 'zh-cn',
      locale: neuralZhCn,
    },
  ] as const;

  readonly pageLinks = [
    ['Initial locale', 'initial'],
    ['Live switching', 'runtime'],
    ['Locale signals', 'signals'],
    ['Custom locales', 'custom'],
    ['Fallback and precedence', 'fallback'],
    ['Direction', 'direction'],
    ['Dates and numbers', 'intl'],
    ['SSR and hydration', 'ssr'],
  ] as const;

  readonly initialCode = `import { ApplicationConfig } from '@angular/core';
import { provideNeuralNg } from '@neural-ng/core';
import { neuralTr } from '@neural-ng/core/locales/tr';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNeuralNg({
      locale: neuralTr,
      direction: 'auto',
    }),
  ],
};`;

  readonly runtimeCode = `import { Component, inject } from '@angular/core';
import { NeuralLocaleService } from '@neural-ng/core/i18n';
import { neuralEn } from '@neural-ng/core/locales/en';
import { neuralTr } from '@neural-ng/core/locales/tr';
import { neuralAr } from '@neural-ng/core/locales/ar';

@Component({
  selector: 'app-language-picker',
  template: \`
    <button type="button" (click)="locale.use(neuralEn)">English</button>
    <button type="button" (click)="locale.use(neuralTr)">Türkçe</button>
    <button type="button" (click)="locale.use(neuralAr)">العربية</button>
  \`,
})
export class LanguagePicker {
  readonly locale = inject(NeuralLocaleService);
  readonly neuralEn = neuralEn;
  readonly neuralTr = neuralTr;
  readonly neuralAr = neuralAr;
}`;

  readonly signalsCode = `readonly locale = inject(NeuralLocaleService);

// All values update reactively after locale.use(...)
this.locale.locale();    // NeuralResolvedLocale
this.locale.code();      // "en-US" | "tr-TR" | ...
this.locale.direction(); // "ltr" | "rtl"
this.locale.messages();  // Fully resolved message groups

this.locale.format(
  this.locale.messages().paginator.report,
  { start: 1, end: 10, total: 137 },
);`;

  readonly customCode = `import type { NeuralLocale } from '@neural-ng/core/i18n';

export const productArabic: NeuralLocale = {
  code: 'ar-SA',
  direction: 'rtl',
  firstDayOfWeek: 0,
  messages: {
    common: {
      clear: 'مسح',
      close: 'إغلاق',
    },
    paginator: {
      nextPage: 'الصفحة التالية',
      previousPage: 'الصفحة السابقة',
    },
  },
};`;

  readonly overrideCode = `<neural-paginator
  [totalItems]="137"
  [labels]="{
    navigation: 'Search result pages',
    nextPage: 'Show newer results'
  }"
/>`;

  readonly intlCode = `const currency = new Intl.NumberFormat(locale.code(), {
  style: 'currency',
  currency: 'TRY',
}).format(1250);

const month = new Intl.DateTimeFormat(locale.code(), {
  month: 'long',
  year: 'numeric',
}).format(new Date(2026, 7, 1));`;

  constructor() {
    this.destroyRef.onDestroy(() => this.locale.use(this.initialLocale));
  }

  useLocale(locale: NeuralLocale): void {
    this.locale.use(locale);
    this.pageIndex.set(0);
  }

  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}
