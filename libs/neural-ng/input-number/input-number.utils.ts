export interface NeuralNumberParser {
  parse(value: string): number | null;
  isPotentialNumber(value: string): boolean;
}

export function createNumberParser(locale: string): NeuralNumberParser {
  const formatter = new Intl.NumberFormat(locale, { useGrouping: true });
  const parts = formatter.formatToParts(-12345.6);
  const group = parts.find((part) => part.type === 'group')?.value ?? ',';
  const decimal = parts.find((part) => part.type === 'decimal')?.value ?? '.';
  const minus = parts.find((part) => part.type === 'minusSign')?.value ?? '-';
  const numerals = new Intl.NumberFormat(locale, {
    useGrouping: false,
  }).format(9876543210);
  const digits = new Map(
    [...numerals].reverse().map((digit, index) => [digit, String(index)]),
  );
  const normalize = (value: string): string =>
    [...value.trim()]
      .map((character) => digits.get(character) ?? character)
      .join('')
      .split(group)
      .join('')
      .replace(decimal, '.')
      .replace(minus, '-')
      .replace(/[\s\u00a0\u202f]/g, '');

  return {
    isPotentialNumber(value: string): boolean {
      return /^[+-]?(?:\d*(?:\.\d*)?)?$/.test(normalize(value));
    },
    parse(value: string): number | null {
      const normalized = normalize(value);

      if (!normalized) return null;
      if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) {
        return null;
      }

      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    },
  };
}

export function clampNumber(
  value: number,
  min: number | null,
  max: number | null,
): number {
  return Math.min(max ?? Infinity, Math.max(min ?? -Infinity, value));
}

export function stepNumber(
  value: number | null,
  direction: -1 | 1,
  step: number,
  min: number | null,
  max: number | null,
): number {
  const origin = value ?? min ?? 0;
  const precision = Math.max(
    decimalPlaces(origin),
    decimalPlaces(step),
    decimalPlaces(min ?? 0),
  );
  const factor = 10 ** Math.min(precision, 12);
  const stepped =
    (Math.round(origin * factor) + direction * Math.round(step * factor)) /
    factor;
  return clampNumber(stepped, min, max);
}

export function normalizeFinite(
  value: number | null | undefined,
): number | null {
  return value != null && Number.isFinite(value) ? value : null;
}

export function normalizeStep(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function decimalPlaces(value: number): number {
  const [, fraction = '', exponent = '0'] =
    value.toString().match(/(?:\.(\d+))?(?:e([+-]?\d+))?$/i) ?? [];
  return Math.max(0, fraction.length - Number(exponent));
}
