export type NeuralMeterGroupOrientation = 'horizontal' | 'vertical';
export type NeuralMeterGroupLabelPosition = 'start' | 'end';
export type NeuralMeterGroupLabelOrientation = 'horizontal' | 'vertical';

export interface NeuralMeterItem {
  readonly label: string;
  readonly value: number;
  readonly color?: string;
  readonly iconClass?: string;
  readonly valueText?: string;
}

export type NeuralMeterValueFormatter = (
  value: number,
  item: NeuralMeterItem,
) => string;

export interface NeuralMeterGroupClasses {
  readonly root?: string;
  readonly meters?: string;
  readonly meter?: string;
  readonly labels?: string;
  readonly labelItem?: string;
  readonly marker?: string;
  readonly icon?: string;
  readonly label?: string;
  readonly value?: string;
}
