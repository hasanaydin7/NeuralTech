# NeuralNg Localization

Signal-based runtime localization for NeuralNg components.

## Configure

```ts
import { provideNeuralNg } from '@neural-ng/core';
import { neuralTr } from '@neural-ng/core/locales/tr';

export const appConfig: ApplicationConfig = {
  providers: [provideNeuralNg({ locale: neuralTr })],
};
```

English is the built-in fallback. Locale packs are independent secondary entry
points, so applications bundle only the locales they import.

## Official locale packs

| Language             | Locale  | Import                          |
| -------------------- | ------- | ------------------------------- |
| English              | `en-US` | `@neural-ng/core/locales/en`    |
| Turkish              | `tr-TR` | `@neural-ng/core/locales/tr`    |
| German               | `de-DE` | `@neural-ng/core/locales/de`    |
| French               | `fr-FR` | `@neural-ng/core/locales/fr`    |
| Spanish              | `es-ES` | `@neural-ng/core/locales/es`    |
| Portuguese (Brazil)  | `pt-BR` | `@neural-ng/core/locales/pt-br` |
| Arabic               | `ar-SA` | `@neural-ng/core/locales/ar`    |
| Chinese (Simplified) | `zh-CN` | `@neural-ng/core/locales/zh-cn` |

Every official pack implements the complete current message contract. Arabic
also supplies `direction: 'rtl'`; `direction: 'auto'` applies that direction to
the document through `NeuralNgService`.

## Runtime switching

```ts
import { NeuralLocaleService } from '@neural-ng/core/i18n';
import { neuralEn } from '@neural-ng/core/locales/en';
import { neuralTr } from '@neural-ng/core/locales/tr';

const locale = inject(NeuralLocaleService);
locale.use(neuralTr);
locale.use(neuralEn);
```

`locale`, `code`, `direction`, and `messages` are readonly Signals. Components
that consume the service update without application reload.

## Custom locale

```ts
const productLocale: NeuralLocale = {
  code: 'de-DE',
  direction: 'ltr',
  messages: {
    common: {
      clear: 'Leeren',
    },
  },
};
```

Message groups and individual messages are partial. Missing values fall back
to English. Placeholder interpolation is text-only and preserves unknown
placeholders.

## Precedence

Component-level label or locale inputs override the active NeuralNg locale.
The active locale overrides the English fallback.

## SSR and direction

Configure the same initial locale on server and browser. NeuralNg does not read
`navigator.language`, because environment-dependent defaults can cause
hydration differences.

Locale packs expose `direction`. With `provideNeuralNg({ direction: 'auto' })`,
`NeuralNgService` follows the active locale and applies `html[dir]`. An explicit
`ltr` or `rtl` configuration wins over the locale. Components use logical CSS
properties and inherit direction.
