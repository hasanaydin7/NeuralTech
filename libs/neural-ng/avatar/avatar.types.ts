export type NeuralAvatarSize =
  | 'extra-small'
  | 'small'
  | 'medium'
  | 'large'
  | 'extra-large';
export type NeuralAvatarShape = 'circle' | 'rounded' | 'square';
export type NeuralAvatarImageFit = 'cover' | 'contain';
export type NeuralAvatarLoading = 'eager' | 'lazy';
export type NeuralAvatarDecoding = 'sync' | 'async' | 'auto';
export type NeuralAvatarFetchPriority = 'high' | 'low' | 'auto';

export interface NeuralAvatarClasses {
  readonly root?: string;
  readonly image?: string;
  readonly fallback?: string;
  readonly initials?: string;
  readonly icon?: string;
  readonly content?: string;
}

export interface NeuralAvatarGroupClasses {
  readonly root?: string;
  readonly overflow?: string;
}
