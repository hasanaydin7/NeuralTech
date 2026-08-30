export type NeuralDividerOrientation = 'horizontal' | 'vertical';
export type NeuralDividerAlign = 'start' | 'center' | 'end';
export type NeuralDividerType = 'solid' | 'dashed' | 'dotted';

export interface NeuralDividerClasses {
  readonly root?: string;
  readonly before?: string;
  readonly content?: string;
  readonly after?: string;
}
