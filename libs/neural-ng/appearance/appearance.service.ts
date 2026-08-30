import { isPlatformBrowser } from '@angular/common';
import {
  DestroyRef,
  DOCUMENT,
  Injectable,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NeuralNgService, type NeuralDirection } from '@neural-ng/core';
import {
  NeuralColorModeService,
  type NeuralColorMode,
} from '@neural-ng/core/color-mode';
import { NEURAL_APPEARANCE_CONFIG } from './appearance.config';
import {
  NEURAL_PRIMARY_STEPS,
  NEURAL_SURFACE_STEPS,
  type NeuralAppearanceSnapshot,
} from './appearance.types';

@Injectable({ providedIn: 'root' })
export class NeuralAppearanceService {
  private readonly config = inject(NEURAL_APPEARANCE_CONFIG);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly neuralNg = inject(NeuralNgService);
  private readonly colorMode = inject(NeuralColorModeService);
  private readonly primaryState = signal(this.config.primary);
  private readonly surfaceState = signal(this.config.surface);
  private initialized = false;

  readonly primary = this.primaryState.asReadonly();
  readonly surface = this.surfaceState.asReadonly();
  readonly mode = this.colorMode.preference;
  readonly resolvedMode = this.colorMode.resolvedMode;
  readonly isDark = this.colorMode.isDark;
  readonly direction = this.neuralNg.direction;
  readonly resolvedDirection = this.neuralNg.resolvedDirection;
  readonly primaryPalettes = this.config.primaryPalettes;
  readonly surfacePalettes = this.config.surfacePalettes;
  readonly snapshot = computed<NeuralAppearanceSnapshot>(() => ({
    primary: this.primaryState(),
    surface: this.surfaceState(),
    mode: this.colorMode.preference(),
    resolvedMode: this.colorMode.resolvedMode(),
    direction: this.neuralNg.direction(),
  }));

  constructor() {
    inject(DestroyRef).onDestroy(() =>
      this.document.defaultView?.removeEventListener(
        'storage',
        this.handleStorageChange,
      ),
    );
    this.initialize();
  }

  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;
    let primary = this.config.primary;
    let surface = this.config.surface;
    let direction = this.config.direction;
    if (this.isBrowser) {
      primary = this.readStoredPalette(
        'primary',
        primary,
        this.primaryPalettes,
      );
      surface = this.readStoredPalette(
        'surface',
        surface,
        this.surfacePalettes,
      );
      direction = this.readStoredDirection(direction);
    }
    this.applyPrimary(primary);
    this.applySurface(surface);
    this.neuralNg.setDirection(direction);
    if (this.isBrowser) {
      this.document.defaultView?.addEventListener(
        'storage',
        this.handleStorageChange,
      );
    }
  }

  setPrimary(primary: string): void {
    this.assertRegistered(primary, this.primaryPalettes, 'primary');
    this.applyPrimary(primary);
    this.writeStored('primary', primary);
  }

  setSurface(surface: string): void {
    this.assertRegistered(surface, this.surfacePalettes, 'surface');
    this.applySurface(surface);
    this.writeStored('surface', surface);
  }

  setMode(mode: NeuralColorMode): void {
    this.colorMode.set(mode);
  }

  toggleMode(): void {
    this.colorMode.set(
      this.colorMode.resolvedMode() === 'dark' ? 'light' : 'dark',
    );
  }

  setDirection(direction: NeuralDirection): void {
    this.neuralNg.setDirection(direction);
    this.writeStored('direction', direction);
  }

  setRtl(enabled: boolean): void {
    this.setDirection(enabled ? 'rtl' : 'ltr');
  }

  reset(): void {
    this.colorMode.reset();
    this.applyPrimary(this.config.primary);
    this.applySurface(this.config.surface);
    this.neuralNg.setDirection(this.config.direction);
    this.removeStored('primary');
    this.removeStored('surface');
    this.removeStored('direction');
  }

  private applyPrimary(value: string): void {
    const palette = this.findPalette(value, this.primaryPalettes);
    this.primaryState.set(value);
    if (!this.isBrowser) return;
    const root = this.document.documentElement;
    root.dataset['neuralPrimary'] = value;
    for (const step of NEURAL_PRIMARY_STEPS) {
      root.style.setProperty(
        '--neural-color-primary-' + step,
        palette.scale?.[step] ?? primaryStep(palette.color, step),
      );
    }
  }

  private applySurface(value: string): void {
    const palette = this.findPalette(value, this.surfacePalettes);
    this.surfaceState.set(value);
    if (!this.isBrowser) return;
    const root = this.document.documentElement;
    root.dataset['neuralSurface'] = value;
    for (const step of NEURAL_SURFACE_STEPS) {
      root.style.setProperty(
        '--neural-color-surface-' + step,
        palette.scale[step],
      );
    }
  }

  private readonly handleStorageChange = (event: StorageEvent): void => {
    if (event.key === this.storageKey('primary')) {
      const primary = event.newValue ?? this.config.primary;
      if (this.hasPalette(primary, this.primaryPalettes))
        this.applyPrimary(primary);
    } else if (event.key === this.storageKey('surface')) {
      const surface = event.newValue ?? this.config.surface;
      if (this.hasPalette(surface, this.surfacePalettes))
        this.applySurface(surface);
    } else if (event.key === this.storageKey('direction')) {
      const direction = event.newValue ?? this.config.direction;
      if (direction === 'auto' || direction === 'ltr' || direction === 'rtl') {
        this.neuralNg.setDirection(direction);
      }
    }
  };

  private readStoredPalette<T extends { readonly value: string }>(
    kind: string,
    fallback: string,
    palettes: readonly T[],
  ): string {
    const value = this.readStored(kind);
    return value && this.hasPalette(value, palettes) ? value : fallback;
  }

  private readStoredDirection(fallback: NeuralDirection): NeuralDirection {
    const value = this.readStored('direction');
    return value === 'auto' || value === 'ltr' || value === 'rtl'
      ? value
      : fallback;
  }

  private readStored(kind: string): string | null {
    const key = this.storageKey(kind);
    if (!key || !this.isBrowser) return null;
    try {
      return this.document.defaultView?.localStorage.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  private writeStored(kind: string, value: string): void {
    const key = this.storageKey(kind);
    if (!key || !this.isBrowser) return;
    try {
      this.document.defaultView?.localStorage.setItem(key, value);
    } catch {
      // Appearance remains functional when storage is unavailable.
    }
  }

  private removeStored(kind: string): void {
    const key = this.storageKey(kind);
    if (!key || !this.isBrowser) return;
    try {
      this.document.defaultView?.localStorage.removeItem(key);
    } catch {
      // Appearance remains functional when storage is unavailable.
    }
  }

  private storageKey(kind: string): string | null {
    return this.config.storageKey === null
      ? null
      : this.config.storageKey + '-' + kind;
  }

  private findPalette<T extends { readonly value: string }>(
    value: string,
    palettes: readonly T[],
  ): T {
    const palette = palettes.find((candidate) => candidate.value === value);
    if (!palette)
      throw new Error(
        'NeuralNg appearance palette "' + value + '" is not registered.',
      );
    return palette;
  }

  private hasPalette<T extends { readonly value: string }>(
    value: string,
    palettes: readonly T[],
  ): boolean {
    return palettes.some((palette) => palette.value === value);
  }

  private assertRegistered<T extends { readonly value: string }>(
    value: string,
    palettes: readonly T[],
    kind: string,
  ): void {
    if (!this.hasPalette(value, palettes)) {
      throw new Error(
        'NeuralNg appearance ' +
          kind +
          ' palette "' +
          value +
          '" is not registered.',
      );
    }
  }
}

function primaryStep(color: string, step: number): string {
  const mixes: Readonly<Record<number, string>> = {
    50: 'color-mix(in srgb, ' + color + ' 7%, white)',
    100: 'color-mix(in srgb, ' + color + ' 14%, white)',
    200: 'color-mix(in srgb, ' + color + ' 28%, white)',
    300: 'color-mix(in srgb, ' + color + ' 48%, white)',
    400: 'color-mix(in srgb, ' + color + ' 74%, white)',
    500: color,
    600: 'color-mix(in srgb, ' + color + ' 86%, black)',
    700: 'color-mix(in srgb, ' + color + ' 72%, black)',
    800: 'color-mix(in srgb, ' + color + ' 58%, black)',
    900: 'color-mix(in srgb, ' + color + ' 42%, black)',
    950: 'color-mix(in srgb, ' + color + ' 28%, black)',
  };
  return mixes[step] ?? color;
}
