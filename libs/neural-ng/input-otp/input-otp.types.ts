export type NeuralInputOtpMode = 'numeric' | 'alphanumeric';

export interface NeuralInputOtpCompleteEvent {
  readonly value: string;
}

export interface NeuralInputOtpClasses {
  readonly root?: string;
  readonly group?: string;
  readonly input?: string;
  readonly separator?: string;
}
