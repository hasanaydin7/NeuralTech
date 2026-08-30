import type { NeuralDirection } from '@neural-ng/core';
import type {
  NeuralColorMode,
  NeuralResolvedColorMode,
} from '@neural-ng/core/color-mode';

export const NEURAL_PRIMARY_STEPS = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
] as const;
export const NEURAL_SURFACE_STEPS = [
  0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
] as const;

export type NeuralPrimaryStep = (typeof NEURAL_PRIMARY_STEPS)[number];
export type NeuralSurfaceStep = (typeof NEURAL_SURFACE_STEPS)[number];
export type NeuralPrimaryScale = Readonly<Record<NeuralPrimaryStep, string>>;
export type NeuralSurfaceScale = Readonly<Record<NeuralSurfaceStep, string>>;

export interface NeuralPrimaryPaletteDefinition {
  readonly value: string;
  readonly label: string;
  readonly color: string;
  readonly scale?: NeuralPrimaryScale;
}

export interface NeuralSurfacePaletteDefinition {
  readonly value: string;
  readonly label: string;
  readonly color: string;
  readonly scale: NeuralSurfaceScale;
}

export interface NeuralAppearanceOptions {
  readonly primary?: string;
  readonly surface?: string;
  readonly mode?: NeuralColorMode;
  readonly direction?: NeuralDirection;
  readonly storageKey?: string | null;
  readonly primaryPalettes?: readonly NeuralPrimaryPaletteDefinition[];
  readonly surfacePalettes?: readonly NeuralSurfacePaletteDefinition[];
}

export interface NeuralAppearanceConfig {
  readonly primary: string;
  readonly surface: string;
  readonly mode: NeuralColorMode;
  readonly direction: NeuralDirection;
  readonly storageKey: string | null;
  readonly primaryPalettes: readonly NeuralPrimaryPaletteDefinition[];
  readonly surfacePalettes: readonly NeuralSurfacePaletteDefinition[];
}

export interface NeuralAppearanceSnapshot {
  readonly primary: string;
  readonly surface: string;
  readonly mode: NeuralColorMode;
  readonly resolvedMode: NeuralResolvedColorMode;
  readonly direction: NeuralDirection;
}
