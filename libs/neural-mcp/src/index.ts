export {
  getCatalogSourceHash,
  getComponentContract,
  getPackageCatalog,
  listComponents,
  listThemes,
  recommendComponents,
  searchComponents,
} from './catalog.js';
export { listNeuralResources, readNeuralResource } from './resources.js';
export { createNeuralMcpServer, serveNeuralMcpStdio } from './server.js';
export {
  compileThemeRecipeJson,
  createThemeRecipe,
  diffThemeRecipeJson,
  editThemeRecipeJson,
  formatJson as formatThemeJson,
  getThemeComponentContract,
  listThemeComponentIds,
  loadNeuralThemeRuntime,
  NEURAL_THEME_AI_GUIDE,
  NEURAL_THEME_SCHEMA_GUIDE,
  NEUTRAL_THEME_RECIPE,
  parseThemeRecipeJson,
  validateThemeRecipeJson,
} from './theme.js';
export type {
  NeuralCatalogKind,
  NeuralComponentContract,
  NeuralComponentModel,
  NeuralComponentResources,
  NeuralPackageCatalog,
  NeuralResourceContents,
  NeuralResourceDescriptor,
  NeuralSearchMatch,
  NeuralThemeCatalogEntry,
} from './types.js';

export type {
  NeuralThemeArtifacts,
  NeuralThemeDiagnostic,
  NeuralThemeRecipe,
  NeuralThemeRecipeCreateInput,
  NeuralThemeRecipeDiffEntry,
  NeuralThemeRecipePatch,
  NeuralThemeRuntime,
  NeuralThemeSummary,
  NeuralThemeTokenContractEntry,
  NeuralThemeValidationResult,
} from './theme.js';
