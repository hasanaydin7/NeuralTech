import { loadThemeContract } from './contract.js';
import type { NeuralThemeValidationResult } from './types.js';
import { validateThemeRecipeWithContract } from './validate-core.js';

export { validateThemeRecipeWithContract } from './validate-core.js';

export async function validateThemeRecipe(
  input: unknown,
): Promise<NeuralThemeValidationResult> {
  return validateThemeRecipeWithContract(input, await loadThemeContract());
}
