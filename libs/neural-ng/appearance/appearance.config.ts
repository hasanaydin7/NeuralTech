import { InjectionToken } from '@angular/core';
import {
  NEURAL_PRIMARY_PALETTES,
  NEURAL_SURFACE_PALETTES,
} from './appearance.palettes';
import type {
  NeuralAppearanceConfig,
  NeuralAppearanceOptions,
  NeuralPrimaryPaletteDefinition,
  NeuralSurfacePaletteDefinition,
} from './appearance.types';

export const DEFAULT_NEURAL_APPEARANCE_CONFIG: NeuralAppearanceConfig =
  Object.freeze({
    primary: 'blue',
    surface: 'slate',
    mode: 'system',
    direction: 'auto',
    storageKey: 'neural-appearance',
    primaryPalettes: NEURAL_PRIMARY_PALETTES,
    surfacePalettes: NEURAL_SURFACE_PALETTES,
  });

export const NEURAL_APPEARANCE_CONFIG =
  new InjectionToken<NeuralAppearanceConfig>('NEURAL_APPEARANCE_CONFIG', {
    factory: () => DEFAULT_NEURAL_APPEARANCE_CONFIG,
  });

export function resolveNeuralAppearanceConfig(
  options: NeuralAppearanceOptions,
): NeuralAppearanceConfig {
  const primaryPalettes = mergePalettes(
    NEURAL_PRIMARY_PALETTES as readonly NeuralPrimaryPaletteDefinition[],
    options.primaryPalettes ?? [],
  );
  const surfacePalettes = mergePalettes(
    NEURAL_SURFACE_PALETTES as readonly NeuralSurfacePaletteDefinition[],
    options.surfacePalettes ?? [],
  );
  const config: NeuralAppearanceConfig = {
    primary: options.primary ?? DEFAULT_NEURAL_APPEARANCE_CONFIG.primary,
    surface: options.surface ?? DEFAULT_NEURAL_APPEARANCE_CONFIG.surface,
    mode: options.mode ?? DEFAULT_NEURAL_APPEARANCE_CONFIG.mode,
    direction: options.direction ?? DEFAULT_NEURAL_APPEARANCE_CONFIG.direction,
    storageKey:
      options.storageKey === undefined
        ? DEFAULT_NEURAL_APPEARANCE_CONFIG.storageKey
        : options.storageKey,
    primaryPalettes,
    surfacePalettes,
  };
  assertMode(config.mode);
  assertDirection(config.direction);
  assertStorageKey(config.storageKey);
  assertPalette(config.primary, primaryPalettes, 'primary');
  assertPalette(config.surface, surfacePalettes, 'surface');
  return Object.freeze(config);
}

function mergePalettes<T extends { readonly value: string }>(
  defaults: readonly T[],
  custom: readonly T[],
): readonly T[] {
  const palettes = new Map(defaults.map((palette) => [palette.value, palette]));
  for (const palette of custom) {
    if (!palette.value.trim())
      throw new Error('NeuralNg palette value must not be empty.');
    palettes.set(palette.value, palette);
  }
  return Object.freeze([...palettes.values()]);
}

function assertPalette(
  value: string,
  palettes: readonly (
    | NeuralPrimaryPaletteDefinition
    | NeuralSurfacePaletteDefinition
  )[],
  kind: string,
): void {
  if (!palettes.some((palette) => palette.value === value)) {
    throw new Error(
      'NeuralNg appearance ' +
        kind +
        ' palette "' +
        value +
        '" is not registered.',
    );
  }
}

function assertMode(mode: string): void {
  if (mode !== 'light' && mode !== 'dark' && mode !== 'system') {
    throw new Error(
      'NeuralNg appearance mode must be light, dark, or system; received "' +
        mode +
        '".',
    );
  }
}

function assertDirection(direction: string): void {
  if (direction !== 'auto' && direction !== 'ltr' && direction !== 'rtl') {
    throw new Error(
      'NeuralNg appearance direction must be auto, ltr, or rtl; received "' +
        direction +
        '".',
    );
  }
}

function assertStorageKey(storageKey: string | null): void {
  if (storageKey !== null && !storageKey.trim()) {
    throw new Error(
      'NeuralNg appearance storageKey must be a non-empty string or null.',
    );
  }
}
