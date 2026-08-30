export type NeuralSkeletonShape = 'rectangle' | 'rounded' | 'circle';
export type NeuralSkeletonAnimation = 'pulse' | 'wave' | 'none';

export interface NeuralSkeletonClasses {
  readonly root?: string;
  readonly effect?: string;
}
