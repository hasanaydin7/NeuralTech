export interface NeuralSwitchChange {
  readonly checked: boolean;
  readonly previousChecked: boolean;
  readonly nativeEvent: Event;
}

export interface NeuralSwitchClasses {
  readonly root?: string;
  readonly input?: string;
  readonly track?: string;
  readonly checkedTrack?: string;
  readonly thumb?: string;
  readonly label?: string;
  readonly onLabel?: string;
  readonly offLabel?: string;
}
