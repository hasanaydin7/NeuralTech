import type { NeuralMessageRecord } from '@neural-ng/core/message';

export interface NeuralToastTemplateContext {
  readonly $implicit: NeuralMessageRecord;
  readonly message: NeuralMessageRecord;
  readonly dismiss: () => void;
  readonly paused: boolean;
  readonly remaining: number | null;
  readonly progress: number | null;
}
