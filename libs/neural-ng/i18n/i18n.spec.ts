import { TestBed } from '@angular/core/testing';
import { provideNeuralNg } from '../src/neural-ng.config';
import {
  NEURAL_EN_LOCALE,
  NeuralLocaleService,
  formatNeuralMessage,
  resolveNeuralLocale,
  type NeuralLocale,
  type NeuralLocaleMessages,
} from '../src/neural-locale';
import { neuralAr } from '../locales/ar';
import { neuralDe } from '../locales/de';
import { neuralEs } from '../locales/es';
import { neuralFr } from '../locales/fr';
import { neuralPtBr } from '../locales/pt-br';
import { neuralTr } from '../locales/tr';
import { neuralZhCn } from '../locales/zh-cn';

const officialLocales: readonly NeuralLocale[] = [
  NEURAL_EN_LOCALE,
  neuralTr,
  neuralDe,
  neuralFr,
  neuralEs,
  neuralPtBr,
  neuralAr,
  neuralZhCn,
];

describe('Neural localization', () => {
  it('starts with the English fallback locale', () => {
    TestBed.configureTestingModule({});
    const locale = TestBed.inject(NeuralLocaleService);

    expect(locale.code()).toBe('en-US');
    expect(locale.direction()).toBe('ltr');
    expect(locale.messages().paginator.nextPage).toBe('Next page');
  });

  it('accepts an initial locale through provideNeuralNg', () => {
    TestBed.configureTestingModule({
      providers: [provideNeuralNg({ locale: neuralTr })],
    });
    const locale = TestBed.inject(NeuralLocaleService);

    expect(locale.code()).toBe('tr-TR');
    expect(locale.messages().inputNumber.increment).toBe('Değeri artır');
  });

  it('switches locale reactively at runtime', () => {
    TestBed.configureTestingModule({});
    const locale = TestBed.inject(NeuralLocaleService);

    locale.use(neuralTr);

    expect(locale.code()).toBe('tr-TR');
    expect(locale.messages().paginator.navigation).toBe('Sayfalama');
  });

  it('deep-merges partial custom messages over English fallback', () => {
    const locale = resolveNeuralLocale({
      code: 'de-de',
      direction: 'ltr',
      messages: {
        common: { clear: 'Leeren' },
      },
    });

    expect(locale.code).toBe('de-DE');
    expect(locale.messages.common.clear).toBe('Leeren');
    expect(locale.messages.common.loading).toBe('Loading');
    expect(locale.messages.paginator.nextPage).toBe('Next page');
  });

  it('formats known placeholders and preserves unknown ones', () => {
    expect(
      formatNeuralMessage('{start}–{end} / {total} {unknown}', {
        start: 1,
        end: 10,
        total: 42,
      }),
    ).toBe('1–10 / 42 {unknown}');
  });

  it('ships complete official packs with the same placeholders as English', () => {
    const fallback = NEURAL_EN_LOCALE.messages as NeuralLocaleMessages;

    for (const candidate of officialLocales) {
      const resolved = resolveNeuralLocale(candidate);
      expect(resolved.code).toBe(candidate.code);

      for (const [group, fallbackGroup] of Object.entries(fallback)) {
        const translatedGroup = resolved.messages[
          group as keyof NeuralLocaleMessages
        ] as unknown as Record<string, string>;

        for (const [key, fallbackMessage] of Object.entries(
          fallbackGroup as Record<string, string>,
        )) {
          const translatedMessage = translatedGroup[key];
          expect(translatedMessage.trim().length).toBeGreaterThan(0);
          expect(messagePlaceholders(translatedMessage)).toEqual(
            messagePlaceholders(fallbackMessage),
          );
        }
      }
    }
  });

  it('ships Arabic as RTL and preserves locale-specific week starts', () => {
    expect(resolveNeuralLocale(neuralAr).direction).toBe('rtl');
    expect(resolveNeuralLocale(neuralAr).firstDayOfWeek).toBe(0);
    expect(resolveNeuralLocale(neuralDe).firstDayOfWeek).toBe(1);
    expect(resolveNeuralLocale(neuralPtBr).firstDayOfWeek).toBe(0);
  });
});

function messagePlaceholders(message: string): readonly string[] {
  return [...message.matchAll(/\{([^{}]+)\}/g)]
    .map((match) => match[1] ?? '')
    .sort();
}
