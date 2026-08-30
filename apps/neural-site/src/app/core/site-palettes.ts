import {
  NEURAL_PRIMARY_PALETTES,
  NEURAL_SURFACE_PALETTES,
  NEURAL_SURFACE_STEPS,
  type NeuralPrimaryPalette,
  type NeuralSurfacePalette,
  type NeuralSurfaceScale,
  type NeuralSurfaceStep,
} from '@neural-ng/core/appearance';

export const PALETTE_STEPS = NEURAL_SURFACE_STEPS;
export const SITE_PRIMARY_PALETTES = NEURAL_PRIMARY_PALETTES;
export const SITE_SURFACE_PALETTES = NEURAL_SURFACE_PALETTES;
export type PaletteStep = NeuralSurfaceStep;
export type SitePrimaryPalette = NeuralPrimaryPalette;
export type SiteSurfacePalette = NeuralSurfacePalette;
export type SiteSurfaceScale = NeuralSurfaceScale;
