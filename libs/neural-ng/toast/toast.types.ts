export type NeuralToastPosition =
  | 'top-start'
  | 'top-center'
  | 'top-end'
  | 'middle-start'
  | 'middle-center'
  | 'middle-end'
  | 'bottom-start'
  | 'bottom-center'
  | 'bottom-end';

export interface NeuralToastConfig {
  readonly channel: string;
  readonly position: NeuralToastPosition;
  readonly ariaLabel: string;
  readonly closeLabel: string;
  readonly pauseOnInteraction: boolean;
  readonly showProgress: boolean;
  readonly swipeToDismiss: boolean;
  readonly swipeThreshold: number;
  readonly animated: boolean;
}

export type NeuralToastOptions = Partial<NeuralToastConfig>;

export interface NeuralToastClasses {
  /** The fixed-position region that owns the toast stack. */
  readonly root?: string;
  /** The wrapper for each rendered notification. */
  readonly item?: string;
  /** The notification article surface. */
  readonly message?: string;
  /** The semantic severity icon. */
  readonly icon?: string;
  /** The container that groups title and detail text. */
  readonly content?: string;
  /** The optional notification title. */
  readonly title?: string;
  /** The primary notification detail text. */
  readonly detail?: string;
  /** The dismiss button rendered for dismissible messages. */
  readonly closeButton?: string;
  /** The progress track rendered for timed messages. */
  readonly progressTrack?: string;
  /** The animated progress value inside the track. */
  readonly progressValue?: string;
  /** The visually hidden polite and assertive announcement regions. */
  readonly liveRegion?: string;
}
