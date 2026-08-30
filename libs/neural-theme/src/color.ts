const PALETTE_STEPS = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
] as const;
const LIGHTNESS = [
  0.97, 0.93, 0.87, 0.79, 0.7, 0.61, 0.52, 0.44, 0.36, 0.28, 0.2,
] as const;
const CHROMA_SCALE = [
  0.2, 0.34, 0.52, 0.72, 0.9, 1, 0.98, 0.9, 0.8, 0.68, 0.5,
] as const;

export type NeuralPalette = Readonly<
  Record<(typeof PALETTE_STEPS)[number], string>
>;

interface Oklch {
  readonly l: number;
  readonly c: number;
  readonly h: number;
}

export function isHexColor(value: string): boolean {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
}

export function normalizeHex(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!isHexColor(normalized)) {
    throw new Error(
      `Expected a three- or six-digit hex color, received ${JSON.stringify(value)}.`,
    );
  }
  if (normalized.length === 4) {
    return `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`;
  }
  return normalized;
}

export function generateOklchPalette(
  seed: string,
  neutral = false,
): NeuralPalette {
  const base = hexToOklch(normalizeHex(seed));
  const maximumChroma = neutral
    ? Math.min(0.035, Math.max(0.008, base.c * 0.35))
    : Math.min(0.29, Math.max(0.08, base.c * 1.08));
  const entries = PALETTE_STEPS.map((step, index) => {
    const chroma = maximumChroma * CHROMA_SCALE[index];
    return [
      step,
      oklchToHex({ l: LIGHTNESS[index], c: chroma, h: base.h }),
    ] as const;
  });
  return Object.fromEntries(entries) as unknown as NeuralPalette;
}

export function setOklchLightness(color: string, lightness: number): string {
  const value = hexToOklch(normalizeHex(color));
  return oklchToHex({ ...value, l: clamp(lightness, 0, 1) });
}

export function contrastRatio(first: string, second: string): number {
  const left = relativeLuminance(normalizeHex(first));
  const right = relativeLuminance(normalizeHex(second));
  const lighter = Math.max(left, right);
  const darker = Math.min(left, right);
  return (lighter + 0.05) / (darker + 0.05);
}

function hexToOklch(hex: string): Oklch {
  const [r, g, b] = hexToRgb(hex).map(srgbToLinear);
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const lRoot = Math.cbrt(l);
  const mRoot = Math.cbrt(m);
  const sRoot = Math.cbrt(s);
  const lightness =
    0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot;
  const a = 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot;
  const bValue =
    0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot;
  const chroma = Math.sqrt(a * a + bValue * bValue);
  const hue = ((Math.atan2(bValue, a) * 180) / Math.PI + 360) % 360;
  return { l: lightness, c: chroma, h: hue };
}

function oklchToHex(value: Oklch): string {
  let chroma = value.c;
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const rgb = oklchToSrgb({ ...value, c: chroma });
    if (rgb.every((channel) => channel >= -0.00001 && channel <= 1.00001)) {
      return rgbToHex(rgb.map((channel) => clamp(channel, 0, 1)));
    }
    chroma *= 0.88;
  }
  return rgbToHex(
    oklchToSrgb({ ...value, c: 0 }).map((channel) => clamp(channel, 0, 1)),
  );
}

function oklchToSrgb(value: Oklch): number[] {
  const angle = (value.h * Math.PI) / 180;
  const a = value.c * Math.cos(angle);
  const b = value.c * Math.sin(angle);
  const lRoot = value.l + 0.3963377774 * a + 0.2158037573 * b;
  const mRoot = value.l - 0.1055613458 * a - 0.0638541728 * b;
  const sRoot = value.l - 0.0894841775 * a - 1.291485548 * b;
  const l = lRoot ** 3;
  const m = mRoot ** 3;
  const s = sRoot ** 3;
  return [
    linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

function hexToRgb(hex: string): number[] {
  return [1, 3, 5].map(
    (offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255,
  );
}

function rgbToHex(rgb: number[]): string {
  return `#${rgb
    .map((channel) =>
      Math.round(channel * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

function srgbToLinear(value: number): number {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(value: number): number {
  return value <= 0.0031308
    ? value * 12.92
    : 1.055 * value ** (1 / 2.4) - 0.055;
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(srgbToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
