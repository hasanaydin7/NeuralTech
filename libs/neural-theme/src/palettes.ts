import { generateOklchPalette, type NeuralPalette } from './color.js';
import type {
  NeuralThemePaletteName,
  NeuralThemeSurfaceName,
} from './types.js';

export const primarySeeds: Readonly<Record<NeuralThemePaletteName, string>> = {
  blue: '#2563eb',
  indigo: '#4f46e5',
  violet: '#7c3aed',
  purple: '#9333ea',
  rose: '#e11d48',
  red: '#dc2626',
  orange: '#ea580c',
  amber: '#d97706',
  green: '#16a34a',
  emerald: '#059669',
  teal: '#0d9488',
  cyan: '#0891b2',
  sky: '#0284c7',
};

const exactPrimaryPalettes: Partial<
  Record<NeuralThemePaletteName, NeuralPalette>
> = {
  blue: palette([
    '#ffffff',
    '#eff6ff',
    '#dbeafe',
    '#bfdbfe',
    '#93c5fd',
    '#60a5fa',
    '#3b82f6',
    '#2563eb',
    '#1d4ed8',
    '#1e40af',
    '#1e3a8a',
    '#172554',
  ]),
};

export const surfacePalettes: Readonly<
  Record<NeuralThemeSurfaceName, NeuralPalette>
> = {
  slate: palette([
    '#ffffff',
    '#f8fafc',
    '#f1f5f9',
    '#e2e8f0',
    '#cbd5e1',
    '#94a3b8',
    '#64748b',
    '#475569',
    '#334155',
    '#1e293b',
    '#0f172a',
    '#020617',
  ]),
  gray: palette([
    '#ffffff',
    '#f9fafb',
    '#f3f4f6',
    '#e5e7eb',
    '#d1d5db',
    '#9ca3af',
    '#6b7280',
    '#4b5563',
    '#374151',
    '#1f2937',
    '#111827',
    '#030712',
  ]),
  zinc: palette([
    '#ffffff',
    '#fafafa',
    '#f4f4f5',
    '#e4e4e7',
    '#d4d4d8',
    '#a1a1aa',
    '#71717a',
    '#52525b',
    '#3f3f46',
    '#27272a',
    '#18181b',
    '#09090b',
  ]),
  neutral: palette([
    '#ffffff',
    '#fafafa',
    '#f5f5f5',
    '#e5e5e5',
    '#d4d4d4',
    '#a3a3a3',
    '#737373',
    '#525252',
    '#404040',
    '#262626',
    '#171717',
    '#0a0a0a',
  ]),
  stone: palette([
    '#ffffff',
    '#fafaf9',
    '#f5f5f4',
    '#e7e5e4',
    '#d6d3d1',
    '#a8a29e',
    '#78716c',
    '#57534e',
    '#44403c',
    '#292524',
    '#1c1917',
    '#0c0a09',
  ]),
};

export function resolvePrimaryPalette(value: string | undefined): {
  name: string;
  seed: string;
  palette: NeuralPalette;
} {
  const name = value ?? 'blue';
  const knownName = name as NeuralThemePaletteName;
  const seed = primarySeeds[knownName] ?? name;
  return {
    name,
    seed,
    palette: exactPrimaryPalettes[knownName] ?? generateOklchPalette(seed),
  };
}

export function resolveSurfacePalette(value: string | undefined): {
  name: string;
  seed: string;
  palette: NeuralPalette;
} {
  const name = value ?? 'slate';
  const known = surfacePalettes[name as NeuralThemeSurfaceName];
  if (known) return { name, seed: known[500], palette: known };
  return { name, seed: name, palette: generateOklchPalette(name, true) };
}

function palette(values: readonly string[]): NeuralPalette {
  const steps = [
    0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
  ] as const;
  return Object.fromEntries(
    steps.slice(1).map((step, index) => [step, values[index + 1]]),
  ) as unknown as NeuralPalette;
}
