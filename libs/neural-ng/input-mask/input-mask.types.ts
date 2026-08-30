export type NeuralInputMaskSlot = '9' | 'a' | '*';

export interface NeuralInputMaskCompleteEvent {
  readonly value: string;
  readonly rawValue: string;
  readonly formattedValue: string;
}

export interface NeuralInputMaskClasses {
  readonly root?: string;
  readonly input?: string;
}
