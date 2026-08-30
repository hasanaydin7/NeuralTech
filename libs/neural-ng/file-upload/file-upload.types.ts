export type NeuralFileUploadValue = readonly File[];

export type NeuralFileRejectionReason =
  | 'file-type'
  | 'file-size'
  | 'file-count'
  | 'duplicate';

export interface NeuralFileRejection {
  readonly file: File;
  readonly reasons: readonly NeuralFileRejectionReason[];
}

export interface NeuralFileSelectionChange {
  readonly value: NeuralFileUploadValue;
  readonly addedFiles: readonly File[];
  readonly rejectedFiles: readonly NeuralFileRejection[];
  readonly originalEvent: Event;
}

export interface NeuralFilesRejectedEvent {
  readonly rejectedFiles: readonly NeuralFileRejection[];
  readonly originalEvent: Event;
}

export interface NeuralFileRemoveEvent {
  readonly file: File;
  readonly index: number;
  readonly value: NeuralFileUploadValue;
  readonly originalEvent: Event;
}

export interface NeuralFileClearEvent {
  readonly removedFiles: readonly File[];
  readonly value: NeuralFileUploadValue;
  readonly originalEvent: Event;
}

export interface NeuralFileUploadClasses {
  readonly root?: string;
  readonly input?: string;
  readonly dropzone?: string;
  readonly dropzoneIcon?: string;
  readonly dropzoneText?: string;
  readonly chooseButton?: string;
  readonly content?: string;
  readonly fileList?: string;
  readonly fileItem?: string;
  readonly fileInfo?: string;
  readonly fileName?: string;
  readonly fileMeta?: string;
  readonly removeButton?: string;
  readonly removeIcon?: string;
  readonly clearButton?: string;
  readonly clearIcon?: string;
  readonly empty?: string;
  readonly message?: string;
}
