export type NeuralPasswordStrength = 'empty' | 'weak' | 'medium' | 'strong';

export interface NeuralPasswordStrengthChange {
  readonly value: string;
  readonly score: number;
  readonly strength: NeuralPasswordStrength;
}

export interface NeuralPasswordClasses {
  readonly root?: string;
  readonly inputGroup?: string;
  readonly input?: string;
  readonly toggle?: string;
  readonly toggleIcon?: string;
  readonly feedback?: string;
  readonly meter?: string;
  readonly meterBar?: string;
  readonly strengthLabel?: string;
  readonly capsLock?: string;
}
