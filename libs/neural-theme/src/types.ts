export const NEURAL_THEME_RECIPE_VERSION = 1 as const;

export type NeuralThemePresetName = 'neutral' | 'glass' | 'mist' | 'futuristic';
export type NeuralThemePresetStability = 'stable' | 'experimental';
export type NeuralThemePresetQualityStatus = 'release' | 'preview';

export type NeuralThemeDensity = 'compact' | 'comfortable' | 'spacious';
export type NeuralThemeRadius =
  | 'none'
  | 'small'
  | 'medium'
  | 'large'
  | 'xlarge';
export type NeuralThemeBorder = 'none' | 'subtle' | 'default' | 'strong';
export type NeuralThemeElevation = 'none' | 'soft' | 'default' | 'strong';
export type NeuralThemeMotion = 'reduced' | 'fast' | 'default' | 'slow';
export type NeuralThemeTypographyScale = 'compact' | 'default' | 'large';
export type NeuralThemePaletteName =
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'purple'
  | 'rose'
  | 'red'
  | 'orange'
  | 'amber'
  | 'green'
  | 'emerald'
  | 'teal'
  | 'cyan'
  | 'sky';
export type NeuralThemeSurfaceName =
  | 'slate'
  | 'gray'
  | 'zinc'
  | 'neutral'
  | 'stone';

export interface NeuralThemeRecipe {
  readonly $schema?: string;
  readonly schemaVersion?: typeof NEURAL_THEME_RECIPE_VERSION;
  readonly name: string;
  readonly extends?: NeuralThemePresetName;
  readonly description?: string;
  readonly color?: NeuralThemeColorRecipe;
  readonly typography?: NeuralThemeTypographyRecipe;
  readonly shape?: NeuralThemeShapeRecipe;
  readonly density?: NeuralThemeDensity;
  readonly elevation?: NeuralThemeElevation;
  readonly motion?: NeuralThemeMotion;
  readonly modes?: NeuralThemeModesRecipe;
  readonly components?: Readonly<
    Record<string, Readonly<Record<string, NeuralThemeTokenValue>>>
  >;
  readonly tokens?: Readonly<Record<string, NeuralThemeTokenValue>>;
  readonly output?: NeuralThemeOutputRecipe;
  readonly generator?: NeuralThemeGeneratorRecipe;
}

export interface NeuralThemeRecipeMigrationResult {
  readonly fromVersion: 0 | typeof NEURAL_THEME_RECIPE_VERSION;
  readonly toVersion: typeof NEURAL_THEME_RECIPE_VERSION;
  readonly changed: boolean;
  readonly changes: readonly string[];
  readonly recipe: NeuralThemeRecipe;
}

export interface NeuralThemeColorRecipe {
  readonly primary?: NeuralThemePaletteName | string;
  readonly surface?: NeuralThemeSurfaceName | string;
  readonly info?: string;
  readonly success?: string;
  readonly warning?: string;
  readonly danger?: string;
  readonly error?: string;
}

export interface NeuralThemeTypographyRecipe {
  readonly sans?: string;
  readonly mono?: string;
  readonly scale?: NeuralThemeTypographyScale;
}

export interface NeuralThemeShapeRecipe {
  readonly radius?: NeuralThemeRadius | string;
  readonly border?: NeuralThemeBorder;
}

export interface NeuralThemeModeRecipe {
  readonly primary?: string;
  readonly surface?: string;
  readonly surfaceHover?: string;
  readonly surfaceActive?: string;
  readonly text?: string;
  readonly textStrong?: string;
  readonly textMuted?: string;
  readonly border?: string;
  readonly borderHover?: string;
  readonly borderActive?: string;
  readonly info?: string;
  readonly success?: string;
  readonly warning?: string;
  readonly danger?: string;
  readonly error?: string;
}

export interface NeuralThemeModesRecipe {
  readonly dark?: 'auto' | NeuralThemeModeRecipe;
  readonly light?: NeuralThemeModeRecipe;
}

export interface NeuralThemeOutputRecipe {
  readonly tailwind?: boolean;
  readonly tokens?: boolean;
  readonly report?: boolean;
  readonly types?: boolean;
}

export interface NeuralThemeGeneratorRecipe {
  readonly colorAlgorithm?: 'neural-oklch-v1';
}

export type NeuralThemeTokenValue = string | number;

export interface NeuralThemeTokenContractModeValues {
  readonly base?: string;
  readonly dark?: string;
  readonly compact?: string;
  readonly spacious?: string;
}

export interface NeuralThemeTokenContractEntry {
  readonly name: string;
  readonly component: string;
  readonly source: 'core' | 'editor' | 'shared';
  readonly modes: NeuralThemeTokenContractModeValues;
}

export interface NeuralThemeContract {
  readonly version: 1;
  readonly preset: 'neutral';
  readonly sourceHash: string;
  readonly generatedFrom: readonly string[];
  readonly stats: {
    readonly tokens: number;
    readonly coreTokens: number;
    readonly editorTokens: number;
    readonly sharedTokens: number;
    readonly components: number;
  };
  readonly components: Readonly<Record<string, readonly string[]>>;
  readonly tokens: readonly NeuralThemeTokenContractEntry[];
}

export type NeuralThemeDiagnosticSeverity = 'error' | 'warning';

export interface NeuralThemeDiagnostic {
  readonly severity: NeuralThemeDiagnosticSeverity;
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface NeuralThemeValidationResult {
  readonly valid: boolean;
  readonly diagnostics: readonly NeuralThemeDiagnostic[];
}

export interface NeuralThemePresetQuality {
  readonly status: NeuralThemePresetQualityStatus;
  readonly minimumPrimarySurfaceContrast: number;
  readonly allowedDiagnosticCodes: readonly string[];
}

export interface NeuralThemePresetDefinition {
  readonly id: NeuralThemePresetName;
  readonly label: string;
  readonly description: string;
  readonly stability: NeuralThemePresetStability;
  readonly primary: string;
  readonly surface: string;
  readonly density: NeuralThemeDensity;
  readonly radius: string;
  readonly elevation: NeuralThemeElevation;
  readonly motion: NeuralThemeMotion;
  readonly sourceHash: string;
  readonly baseTokens: Readonly<Record<string, string>>;
  readonly darkTokens: Readonly<Record<string, string>>;
}

export interface NeuralThemePresetSummary {
  readonly id: NeuralThemePresetName;
  readonly label: string;
  readonly description: string;
  readonly stability: NeuralThemePresetStability;
  readonly quality: NeuralThemePresetQuality;
  readonly primary: string;
  readonly surface: string;
  readonly density: NeuralThemeDensity;
  readonly radius: string;
  readonly elevation: NeuralThemeElevation;
  readonly motion: NeuralThemeMotion;
}

export interface NeuralThemeCompileOptions {
  readonly includeTailwind?: boolean;
  /** Limit generated selectors to a data-neural-theme scope instead of :root. */
  readonly scope?: 'root' | 'theme';
}

export interface NeuralThemeArtifacts {
  readonly name: string;
  readonly css: string;
  readonly tokens: string;
  readonly report: string;
  readonly types: string;
  readonly enabledOutputs: {
    readonly tokens: boolean;
    readonly report: boolean;
    readonly types: boolean;
  };
  readonly summary: NeuralThemeSummary;
}

export interface NeuralThemeSummary {
  readonly name: string;
  readonly extends: NeuralThemePresetName;
  readonly primary: string;
  readonly surface: string;
  readonly density: NeuralThemeDensity;
  readonly radius: string;
  readonly elevation: NeuralThemeElevation;
  readonly motion: NeuralThemeMotion;
  readonly quality: NeuralThemePresetQuality;
  readonly modes: readonly ('light' | 'dark')[];
  readonly componentOverrides: readonly string[];
  readonly tokenOverrides: number;
  readonly sourceHash: string;
}

export interface NeuralThemeBuildResult {
  readonly outputDirectory: string;
  readonly files: readonly string[];
  readonly summary: NeuralThemeSummary;
}
