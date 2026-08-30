import {
  BUILT_IN_THEME_PRESETS,
  CORE_NEUTRAL_TEMPLATE,
  EDITOR_NEUTRAL_TEMPLATE,
  NEUTRAL_THEME_CONTRACT,
  TAILWIND_TEMPLATE,
} from './browser-assets.js';
import {
  compileThemeWithAssets,
  NeuralThemeRecipeError,
} from './compiler-core.js';
import { migrateThemeRecipe } from './migration-core.js';
import { toKebabCase } from './naming.js';
import { getThemePresetQuality } from './preset-quality.js';
import type {
  NeuralThemeArtifacts,
  NeuralThemeCompileOptions,
  NeuralThemePresetName,
  NeuralThemePresetQuality,
  NeuralThemePresetQualityStatus,
  NeuralThemePresetSummary,
  NeuralThemeRecipe,
  NeuralThemeRecipeMigrationResult,
  NeuralThemeTokenContractEntry,
  NeuralThemeValidationResult,
} from './types.js';
import { validateThemeRecipeWithContract } from './validate-core.js';

const assets = {
  contract: NEUTRAL_THEME_CONTRACT,
  coreTemplate: CORE_NEUTRAL_TEMPLATE,
  editorTemplate: EDITOR_NEUTRAL_TEMPLATE,
  tailwindTemplate: TAILWIND_TEMPLATE,
  presets: BUILT_IN_THEME_PRESETS,
} as const;

export { NeuralThemeRecipeError, migrateThemeRecipe };

export function compileTheme(
  recipe: NeuralThemeRecipe,
  options: NeuralThemeCompileOptions = {},
): NeuralThemeArtifacts {
  return compileThemeWithAssets(recipe, assets, options);
}

export function validateThemeRecipe(
  input: unknown,
): NeuralThemeValidationResult {
  return validateThemeRecipeWithContract(input, NEUTRAL_THEME_CONTRACT);
}

export function listThemePresets(): readonly NeuralThemePresetSummary[] {
  return Object.values(BUILT_IN_THEME_PRESETS)
    .map((preset) => ({
      id: preset.id,
      label: preset.label,
      description: preset.description,
      stability: preset.stability,
      quality: getThemePresetQuality(preset.id),
      primary: preset.primary,
      surface: preset.surface,
      density: preset.density,
      radius: preset.radius,
      elevation: preset.elevation,
      motion: preset.motion,
    }))
    .sort((left, right) => left.id.localeCompare(right.id, 'en'));
}

export function getThemePreset(
  preset: NeuralThemePresetName,
): NeuralThemePresetSummary | undefined {
  return listThemePresets().find((entry) => entry.id === preset);
}

export function listThemeComponents(): readonly string[] {
  return Object.keys(NEUTRAL_THEME_CONTRACT.components).sort((left, right) =>
    left.localeCompare(right, 'en'),
  );
}

export function getComponentThemeContract(
  component: string,
): readonly NeuralThemeTokenContractEntry[] {
  const normalized = toKebabCase(component);
  return NEUTRAL_THEME_CONTRACT.tokens.filter(
    (token) => token.component === normalized,
  );
}

export { NEURAL_THEME_RECIPE_VERSION } from './types.js';
export type {
  NeuralThemeArtifacts,
  NeuralThemeCompileOptions,
  NeuralThemeDiagnostic,
  NeuralThemePresetName,
  NeuralThemePresetQuality,
  NeuralThemePresetQualityStatus,
  NeuralThemePresetSummary,
  NeuralThemeRecipe,
  NeuralThemeRecipeMigrationResult,
  NeuralThemeSummary,
  NeuralThemeTokenContractEntry,
  NeuralThemeValidationResult,
} from './types.js';
