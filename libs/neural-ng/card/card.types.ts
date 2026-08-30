export type NeuralCardRole = 'article' | 'region' | 'group' | 'presentation';

export interface NeuralCardClasses {
  readonly root?: string;
  readonly header?: string;
  readonly body?: string;
  readonly footer?: string;
}
