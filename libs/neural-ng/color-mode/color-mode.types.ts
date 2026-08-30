export type NeuralColorMode = 'light' | 'dark' | 'system';

export type NeuralResolvedColorMode = Exclude<NeuralColorMode, 'system'>;

export interface NeuralColorModeConfig {
  readonly defaultMode: NeuralColorMode;
  readonly storageKey: string | null;
}

export type NeuralColorModeOptions = Partial<NeuralColorModeConfig>;
