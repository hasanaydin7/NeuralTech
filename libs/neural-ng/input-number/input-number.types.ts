export type NeuralInputNumberMode = 'decimal' | 'currency';

export type NeuralInputNumberCommitSource =
  | 'blur'
  | 'enter'
  | 'keyboard'
  | 'button';

export interface NeuralInputNumberCommit {
  readonly value: number | null;
  readonly previousValue: number | null;
  readonly source: NeuralInputNumberCommitSource;
}

export interface NeuralInputNumberClasses {
  readonly root?: string;
  readonly input?: string;
  readonly decrementButton?: string;
  readonly incrementButton?: string;
  readonly buttonIcon?: string;
}
