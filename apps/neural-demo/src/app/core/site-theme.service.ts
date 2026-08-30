import { Injectable, computed, signal } from '@angular/core';

export type SiteTheme = 'neutral' | 'glass' | 'mist' | 'futuristic';
export type SitePrimaryPalette =
  | 'blue'
  | 'emerald'
  | 'green'
  | 'lime'
  | 'orange'
  | 'amber'
  | 'yellow'
  | 'cyan'
  | 'sky'
  | 'teal'
  | 'indigo'
  | 'violet'
  | 'purple'
  | 'fuchsia'
  | 'pink'
  | 'rose';

export interface SiteSurfaceScale {
  readonly 0: string;
  readonly 50: string;
  readonly 100: string;
  readonly 200: string;
  readonly 300: string;
  readonly 400: string;
  readonly 500: string;
  readonly 600: string;
  readonly 700: string;
  readonly 800: string;
  readonly 900: string;
  readonly 950: string;
}

interface SiteSurfacePaletteOption {
  readonly value: string;
  readonly label: string;
  readonly palette: SiteSurfaceScale;
}

export const SITE_SURFACE_PALETTES = [
  {
    value: 'slate',
    label: 'Slate',
    palette: {
      0: '#ffffff',
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
  },
  {
    value: 'gray',
    label: 'Gray',
    palette: {
      0: '#ffffff',
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712',
    },
  },
  {
    value: 'zinc',
    label: 'Zinc',
    palette: {
      0: '#ffffff',
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b',
      950: '#09090b',
    },
  },
  {
    value: 'neutral',
    label: 'Neutral',
    palette: {
      0: '#ffffff',
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      950: '#0a0a0a',
    },
  },
  {
    value: 'stone',
    label: 'Stone',
    palette: {
      0: '#ffffff',
      50: '#fafaf9',
      100: '#f5f5f4',
      200: '#e7e5e4',
      300: '#d6d3d1',
      400: '#a8a29e',
      500: '#78716c',
      600: '#57534e',
      700: '#44403c',
      800: '#292524',
      900: '#1c1917',
      950: '#0c0a09',
    },
  },
  {
    value: 'soho',
    label: 'Soho',
    palette: {
      0: '#ffffff',
      50: '#ececec',
      100: '#dedfdf',
      200: '#c4c4c6',
      300: '#adaeb0',
      400: '#97979b',
      500: '#7f8084',
      600: '#6a6b70',
      700: '#55565b',
      800: '#3f4046',
      900: '#2c2c34',
      950: '#16161d',
    },
  },
  {
    value: 'viva',
    label: 'Viva',
    palette: {
      0: '#ffffff',
      50: '#f3f3f3',
      100: '#e7e7e8',
      200: '#cfd0d0',
      300: '#b7b8b9',
      400: '#9fa1a1',
      500: '#87898a',
      600: '#6e7173',
      700: '#565a5b',
      800: '#3e4244',
      900: '#262b2c',
      950: '#0e1315',
    },
  },
  {
    value: 'ocean',
    label: 'Ocean',
    palette: {
      0: '#ffffff',
      50: '#fbfcfc',
      100: '#F7F9F8',
      200: '#EFF3F2',
      300: '#DADEDD',
      400: '#B1B7B6',
      500: '#828787',
      600: '#5F7274',
      700: '#415B61',
      800: '#29444E',
      900: '#183240',
      950: '#0c1920',
    },
  },
  {
    value: 'sand',
    label: 'Sand',
    palette: {
      0: '#ffffff',
      50: '#fdfcfb',
      100: '#f9f7f4',
      200: '#f0ece6',
      300: '#e1dad1',
      400: '#c7bfb4',
      500: '#9c958c',
      600: '#877e73',
      700: '#645d55',
      800: '#423d37',
      900: '#27231f',
      950: '#141210',
    },
  },
  {
    value: 'charcoal',
    label: 'Charcoal',
    palette: {
      0: '#ffffff',
      50: '#f4f4f5',
      100: '#e5e7eb',
      200: '#d1d5db',
      300: '#9ca3af',
      400: '#6b7280',
      500: '#4a4f58',
      600: '#374151',
      700: '#1f2937',
      800: '#111827',
      900: '#0b1220',
      950: '#050812',
    },
  },
  {
    value: 'carbon',
    label: 'Carbon',
    palette: {
      0: '#ffffff',
      50: '#f2f2f2',
      100: '#d9d9d9',
      200: '#bfbfbf',
      300: '#8c8c8c',
      400: '#595959',
      500: '#3a3a3a',
      600: '#2a2a2a',
      700: '#1f1f1f',
      800: '#151515',
      900: '#0d0d0d',
      950: '#080808',
    },
  },
  {
    value: 'ash',
    label: 'Ash',
    palette: {
      0: '#ffffff',
      50: '#fafafa',
      100: '#f0f0f0',
      200: '#e0e0e0',
      300: '#c2c2c2',
      400: '#a3a3a3',
      500: '#7a7a7a',
      600: '#5f5f5f',
      700: '#444444',
      800: '#2c2c2c',
      900: '#1a1a1a',
      950: '#0f0f0f',
    },
  },
  {
    value: 'midnight',
    label: 'Midnight',
    palette: {
      0: '#ffffff',
      50: '#eef2f7',
      100: '#dbe4f0',
      200: '#b6c7e0',
      300: '#8fa3cc',
      400: '#667db4',
      500: '#5a6575',
      600: '#394a7d',
      700: '#2c3961',
      800: '#1e2745',
      900: '#12172b',
      950: '#0a0d18',
    },
  },
  {
    value: 'graphite',
    label: 'Graphite',
    palette: {
      0: '#ffffff',
      50: '#f7f7f7',
      100: '#e3e3e3',
      200: '#cfcfcf',
      300: '#b1b1b1',
      400: '#8f8f8f',
      500: '#6e6e6e',
      600: '#555555',
      700: '#3f3f3f',
      800: '#2b2b2b',
      900: '#1a1a1a',
      950: '#0f0f0f',
    },
  },
  {
    value: 'ocean-deep',
    label: 'Ocean Deep',
    palette: {
      0: '#ffffff',
      50: '#f6fbfc',
      100: '#edf7f8',
      200: '#d6eaee',
      300: '#b6d5db',
      400: '#8fb7c0',
      500: '#6b7e86',
      600: '#4f7a87',
      700: '#3b5f6b',
      800: '#27444e',
      900: '#162d36',
      950: '#0b171c',
    },
  },
  {
    value: 'ocean-ink',
    label: 'Ocean Ink',
    palette: {
      0: '#ffffff',
      50: '#f3f7f9',
      100: '#e2edf1',
      200: '#c5dbe2',
      300: '#9bbfc9',
      400: '#6f9fb0',
      500: '#5b707a',
      600: '#3d6575',
      700: '#2f4e5c',
      800: '#203740',
      900: '#14252c',
      950: '#0a1317',
    },
  },
  {
    value: 'slate-soft',
    label: 'Slate Soft',
    palette: {
      0: '#ffffff',
      50: '#f9fbfc',
      100: '#f1f5f9',
      200: '#e3e8ef',
      300: '#cfd7e3',
      400: '#aeb9cc',
      500: '#8b95a6',
      600: '#6c7890',
      700: '#515b6e',
      800: '#363e4d',
      900: '#1f2530',
      950: '#11151d',
    },
  },
  {
    value: 'slate-cold',
    label: 'Slate Cold',
    palette: {
      0: '#ffffff',
      50: '#f8fafc',
      100: '#eef2f7',
      200: '#dde3eb',
      300: '#c2cad6',
      400: '#9da7b8',
      500: '#7c8797',
      600: '#616b82',
      700: '#4a5266',
      800: '#333a4b',
      900: '#1f2432',
      950: '#121621',
    },
  },
  {
    value: 'midnight-blue',
    label: 'Midnight Blue',
    palette: {
      0: '#ffffff',
      50: '#eef3f8',
      100: '#dce6f1',
      200: '#b9cde4',
      300: '#93acd3',
      400: '#6b88bd',
      500: '#5b6b82',
      600: '#3d5587',
      700: '#2f4168',
      800: '#202c48',
      900: '#141b2c',
      950: '#0a0e18',
    },
  },
  {
    value: 'midnight-graphite',
    label: 'Midnight Graphite',
    palette: {
      0: '#ffffff',
      50: '#f1f3f5',
      100: '#dfe3e8',
      200: '#c2c8d0',
      300: '#9aa2ad',
      400: '#6f7884',
      500: '#4f5661',
      600: '#3b4049',
      700: '#2b2f36',
      800: '#1e2126',
      900: '#14161a',
      950: '#0b0c0f',
    },
  },
] as const satisfies readonly SiteSurfacePaletteOption[];

export type SiteSurfacePalette =
  (typeof SITE_SURFACE_PALETTES)[number]['value'];

const PRIMARY_COLORS: Record<SitePrimaryPalette, string> = {
  blue: '#3b82f6',
  emerald: '#10b981',
  green: '#22c55e',
  lime: '#84cc16',
  orange: '#f97316',
  amber: '#f59e0b',
  yellow: '#eab308',
  cyan: '#06b6d4',
  sky: '#0ea5e9',
  teal: '#4f747b',
  indigo: '#6366f1',
  violet: '#8b5cf6',
  purple: '#a855f7',
  fuchsia: '#d946ef',
  pink: '#ec4899',
  rose: '#f43f5e',
};

const SURFACE_PALETTE_BY_NAME = Object.fromEntries(
  SITE_SURFACE_PALETTES.map(({ value, palette }) => [value, palette]),
) as Record<SiteSurfacePalette, SiteSurfaceScale>;

const SITE_THEME_DEFAULTS: Readonly<
  Record<SiteTheme, { primary: SitePrimaryPalette; surface: SiteSurfacePalette }>
> = {
  neutral: { primary: 'blue', surface: 'slate' },
  glass: { primary: 'indigo', surface: 'slate' },
  mist: { primary: 'teal', surface: 'slate-soft' },
  futuristic: { primary: 'fuchsia', surface: 'ocean-deep' },
};

@Injectable({ providedIn: 'root' })
export class SiteThemeService {
  readonly theme = signal<SiteTheme>('neutral');
  readonly primary = signal<SitePrimaryPalette>('blue');
  readonly surface = signal<SiteSurfacePalette>('slate');
  readonly primaryColor = computed(() => PRIMARY_COLORS[this.primary()]);
  readonly surfaceScale = computed(
    () => SURFACE_PALETTE_BY_NAME[this.surface()],
  );
  readonly surfaceColor = computed(() => this.surfaceScale()[500]);

  set(theme: SiteTheme): void {
    this.theme.set(theme);
  }

  applyPreset(theme: SiteTheme): void {
    const defaults = SITE_THEME_DEFAULTS[theme];
    this.theme.set(theme);
    this.primary.set(defaults.primary);
    this.surface.set(defaults.surface);
  }

  setPrimary(primary: SitePrimaryPalette): void {
    this.primary.set(primary);
  }

  setSurface(surface: SiteSurfacePalette): void {
    this.surface.set(surface);
  }
}
