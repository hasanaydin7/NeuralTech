export type NeuralTabValue = string | number;
export type NeuralTabsOrientation = 'horizontal' | 'vertical';
export type NeuralTabsActivationMode = 'automatic' | 'manual';

export interface NeuralTabsClasses {
  readonly root?: string;
  readonly list?: string;
  readonly tab?: string;
  readonly activeTab?: string;
  readonly disabledTab?: string;
  readonly panels?: string;
  readonly panel?: string;
}
