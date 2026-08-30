import { readFile } from 'node:fs/promises';
import {
  compileThemeWithAssets,
  NeuralThemeRecipeError,
} from './compiler-core.js';
import { loadThemeContract, loadThemePresets } from './contract.js';
import type {
  NeuralThemeArtifacts,
  NeuralThemeCompileOptions,
  NeuralThemeRecipe,
} from './types.js';

export { NeuralThemeRecipeError } from './compiler-core.js';

export async function compileTheme(
  recipe: NeuralThemeRecipe,
  options: NeuralThemeCompileOptions = {},
): Promise<NeuralThemeArtifacts> {
  const [contract, presets, coreTemplate, editorTemplate, tailwindTemplate] =
    await Promise.all([
      loadThemeContract(),
      loadThemePresets(),
      readAsset('../assets/templates/core-neutral.css'),
      readAsset('../assets/templates/editor-neutral.css'),
      readAsset('../assets/templates/tailwind.css'),
    ]);
  return compileThemeWithAssets(
    recipe,
    { contract, presets, coreTemplate, editorTemplate, tailwindTemplate },
    options,
  );
}

async function readAsset(path: string): Promise<string> {
  return readFile(new URL(path, import.meta.url), 'utf8');
}
