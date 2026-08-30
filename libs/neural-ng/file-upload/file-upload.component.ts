import {
  APP_ID,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injectable,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import {
  NEURAL_FIELD_CONTEXT,
  NEURAL_NG_CONFIG,
  NeuralLocaleService,
} from '@neural-ng/core';
import type {
  NeuralFileClearEvent,
  NeuralFileRejection,
  NeuralFileRejectionReason,
  NeuralFileRemoveEvent,
  NeuralFileSelectionChange,
  NeuralFilesRejectedEvent,
  NeuralFileUploadClasses,
  NeuralFileUploadValue,
} from './file-upload.types';

@Injectable({ providedIn: 'root' })
class NeuralFileUploadIdGenerator {
  private readonly appId = inject(APP_ID);
  private nextId = 0;

  next(): string {
    return `${this.appId}-neural-file-upload-${this.nextId++}`;
  }
}

@Component({
  selector: 'neural-file-upload',
  standalone: true,
  template: `
    <div
      [class]="rootClass()"
      [attr.data-drag-active]="dragActive() ? 'true' : null"
      [attr.data-disabled]="effectiveDisabled() ? 'true' : null"
      [attr.data-readonly]="effectiveReadonly() ? 'true' : null"
      [attr.data-invalid]="effectiveInvalid() ? 'true' : null"
      [attr.data-required]="effectiveRequired() ? 'true' : null"
      [attr.data-pending]="effectivePending() ? 'true' : null"
      [attr.data-touched]="touched() ? 'true' : null"
      [attr.data-dirty]="dirty() ? 'true' : null"
      [attr.data-empty]="files().length === 0 ? 'true' : null"
    >
      <input
        #fileInput
        type="file"
        [id]="controlId()"
        [class]="inputClassName()"
        [name]="name()"
        [accept]="accept()"
        [multiple]="multiple()"
        [disabled]="effectiveDisabled() || effectiveReadonly()"
        [attr.capture]="capture() || null"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-labelledby]="ariaLabelledBy() || null"
        [attr.aria-describedby]="describedBy()"
        [attr.aria-invalid]="effectiveInvalid() ? 'true' : null"
        [attr.aria-required]="effectiveRequired() ? 'true' : null"
        [attr.aria-busy]="effectivePending() ? 'true' : null"
        (change)="handleNativeSelection($event)"
        (blur)="touch.emit()"
      />

      <div
        [class]="dropzoneClass()"
        (dragenter)="handleDragEnter($event)"
        (dragover)="handleDragOver($event)"
        (dragleave)="handleDragLeave($event)"
        (drop)="handleDrop($event)"
      >
        @if (chooseIconClass()) {
          <i [class]="dropzoneIconClass()" aria-hidden="true"></i>
        }

        <div [class]="dropzoneTextClass()">
          <span>{{ dropLabel() }}</span>
          <button
            #chooseButton
            type="button"
            [class]="chooseButtonClass()"
            [disabled]="effectiveDisabled() || effectiveReadonly()"
            [attr.aria-controls]="controlId()"
            [attr.aria-describedby]="describedBy()"
            (click)="openFileDialog()"
          >
            {{ chooseLabel() }}
          </button>
        </div>
      </div>

      @if (showFileList()) {
        <div [class]="contentClass()">
          @if (files().length) {
            <ul [class]="fileListClass()" [attr.aria-label]="selectedSummary()">
              @for (
                file of files();
                track fileTrackKey(file, $index);
                let index = $index
              ) {
                <li [class]="fileItemClass()">
                  <div [class]="fileInfoClass()">
                    <span [class]="fileNameClass()" [title]="file.name">
                      {{ file.name }}
                    </span>
                    <span [class]="fileMetaClass()">
                      {{ formatFileSize(file.size) }}
                      @if (file.type) {
                        · {{ file.type }}
                      }
                    </span>
                  </div>

                  <button
                    type="button"
                    [class]="removeButtonClass()"
                    [disabled]="effectiveDisabled() || effectiveReadonly()"
                    [attr.aria-label]="removeLabel(file)"
                    (click)="handleRemove(index, $event)"
                  >
                    @if (removeIconClass()) {
                      <i [class]="removeIconClassName()" aria-hidden="true"></i>
                    }
                    <span>{{ removeButtonText() }}</span>
                  </button>
                </li>
              }
            </ul>

            <button
              type="button"
              [class]="clearButtonClass()"
              [disabled]="effectiveDisabled() || effectiveReadonly()"
              (click)="handleClear($event)"
            >
              @if (clearIconClass()) {
                <i [class]="clearIconClassName()" aria-hidden="true"></i>
              }
              <span>{{ clearLabel() }}</span>
            </button>
          } @else {
            <p [class]="emptyClass()">{{ emptyLabel() }}</p>
          }
        </div>
      }

      <span role="status" aria-live="polite" [class]="messageClass()">
        {{ announcement() }}
      </span>
    </div>
  `,
  styles: `
    :where(.neural-file-upload-host) {
      display: inline-block;
      min-width: 0;
      max-width: 100%;
    }
    :where(.neural-file-upload-host-fluid) {
      display: block;
      width: 100%;
    }
    :where(.neural-file-upload-root) {
      box-sizing: border-box;
      display: grid;
      min-width: 0;
      max-width: 100%;
    }
    :where(.neural-file-upload-base) {
      width: var(--neural-file-upload-width, 24rem);
      gap: var(--neural-file-upload-gap, 0.75rem);
      color: var(--neural-file-upload-color, inherit);
      font-family: var(--neural-file-upload-font-family, inherit);
      font-size: var(--neural-file-upload-font-size, 0.875rem);
    }
    :where(.neural-file-upload-fluid-base) {
      width: 100%;
    }
    :where(.neural-file-upload-input-root) {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
      border: 0;
    }
    :where(.neural-file-upload-dropzone-root) {
      box-sizing: border-box;
      display: grid;
      min-width: 0;
      place-items: center;
      text-align: center;
    }
    :where(.neural-file-upload-dropzone-base) {
      min-height: var(--neural-file-upload-dropzone-min-height, 9rem);
      padding: var(--neural-file-upload-dropzone-padding, 1.5rem);
      color: var(--neural-file-upload-dropzone-color, inherit);
      background: var(--neural-file-upload-dropzone-background, transparent);
      border: var(
        --neural-file-upload-dropzone-border,
        1px dashed currentColor
      );
      border-radius: var(--neural-file-upload-radius, 0.75rem);
      box-shadow: var(--neural-file-upload-shadow, none);
      transition: var(--neural-file-upload-transition, none);
    }
    :where(
      .neural-file-upload-root[data-drag-active='true']
        .neural-file-upload-dropzone-base
    ) {
      color: var(--neural-file-upload-dropzone-color-active, inherit);
      background: var(
        --neural-file-upload-dropzone-background-active,
        transparent
      );
      border-color: var(
        --neural-file-upload-dropzone-border-color-active,
        currentColor
      );
      box-shadow: var(--neural-file-upload-shadow-active, none);
    }
    :where(
      .neural-file-upload-root[data-invalid='true']
        .neural-file-upload-dropzone-base
    ) {
      border-color: var(
        --neural-file-upload-dropzone-border-color-invalid,
        currentColor
      );
      box-shadow: var(--neural-file-upload-shadow-invalid, none);
    }
    :where(.neural-file-upload-dropzone-icon-root) {
      display: inline-block;
    }
    :where(.neural-file-upload-dropzone-icon-base) {
      margin-block-end: var(--neural-file-upload-icon-gap, 0.75rem);
      color: var(--neural-file-upload-icon-color, currentColor);
      font-size: var(--neural-file-upload-icon-size, 1.5rem);
    }
    :where(.neural-file-upload-dropzone-text-root) {
      display: grid;
      justify-items: center;
    }
    :where(.neural-file-upload-dropzone-text-base) {
      gap: var(--neural-file-upload-text-gap, 0.625rem);
      color: var(--neural-file-upload-text-color, inherit);
      line-height: var(--neural-file-upload-line-height, 1.4);
    }
    :where(.neural-file-upload-choose-button-root),
    :where(.neural-file-upload-remove-button-root),
    :where(.neural-file-upload-clear-button-root) {
      box-sizing: border-box;
      font: inherit;
    }
    :where(.neural-file-upload-choose-button-base) {
      min-height: var(--neural-file-upload-button-min-height, 2.25rem);
      padding: var(--neural-file-upload-button-padding, 0.5rem 0.875rem);
      color: var(--neural-file-upload-button-color, inherit);
      background: var(--neural-file-upload-button-background, transparent);
      border: var(--neural-file-upload-button-border, 1px solid currentColor);
      border-radius: var(--neural-file-upload-button-radius, 0.5rem);
      cursor: pointer;
      transition: var(--neural-file-upload-transition, none);
    }
    :where(.neural-file-upload-choose-button-base:hover:not(:disabled)) {
      color: var(--neural-file-upload-button-color-hover, inherit);
      background: var(
        --neural-file-upload-button-background-hover,
        transparent
      );
      border-color: var(
        --neural-file-upload-button-border-color-hover,
        currentColor
      );
    }
    :where(.neural-file-upload-content-root) {
      box-sizing: border-box;
      min-width: 0;
    }
    :where(.neural-file-upload-content-base) {
      display: grid;
      gap: var(--neural-file-upload-content-gap, 0.625rem);
    }
    :where(.neural-file-upload-file-list-root) {
      box-sizing: border-box;
      min-width: 0;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    :where(.neural-file-upload-file-list-base) {
      display: grid;
      gap: var(--neural-file-upload-file-gap, 0.5rem);
    }
    :where(.neural-file-upload-file-item-root) {
      box-sizing: border-box;
      display: flex;
      min-width: 0;
      align-items: center;
      justify-content: space-between;
    }
    :where(.neural-file-upload-file-item-base) {
      gap: var(--neural-file-upload-file-item-gap, 0.75rem);
      padding: var(--neural-file-upload-file-item-padding, 0.625rem 0.75rem);
      background: var(--neural-file-upload-file-item-background, transparent);
      border: var(
        --neural-file-upload-file-item-border,
        1px solid currentColor
      );
      border-radius: var(--neural-file-upload-file-item-radius, 0.5rem);
    }
    :where(.neural-file-upload-file-info-root) {
      display: grid;
      min-width: 0;
      text-align: start;
    }
    :where(.neural-file-upload-file-info-base) {
      gap: var(--neural-file-upload-file-info-gap, 0.125rem);
    }
    :where(.neural-file-upload-file-name-root) {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    :where(.neural-file-upload-file-name-base) {
      color: var(--neural-file-upload-file-name-color, inherit);
      font-weight: var(--neural-file-upload-file-name-weight, 600);
    }
    :where(.neural-file-upload-file-meta-base) {
      color: var(--neural-file-upload-file-meta-color, inherit);
      font-size: var(--neural-file-upload-file-meta-font-size, 0.75rem);
    }
    :where(.neural-file-upload-remove-button-base),
    :where(.neural-file-upload-clear-button-base) {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--neural-file-upload-action-gap, 0.375rem);
      min-height: var(--neural-file-upload-action-min-height, 2rem);
      padding: var(--neural-file-upload-action-padding, 0.375rem 0.625rem);
      color: var(--neural-file-upload-action-color, inherit);
      background: var(--neural-file-upload-action-background, transparent);
      border: var(--neural-file-upload-action-border, 1px solid currentColor);
      border-radius: var(--neural-file-upload-action-radius, 0.375rem);
      cursor: pointer;
      transition: var(--neural-file-upload-transition, none);
    }
    :where(.neural-file-upload-remove-button-base:hover:not(:disabled)),
    :where(.neural-file-upload-clear-button-base:hover:not(:disabled)) {
      color: var(--neural-file-upload-action-color-hover, inherit);
      background: var(
        --neural-file-upload-action-background-hover,
        transparent
      );
    }
    :where(.neural-file-upload-clear-button-root) {
      justify-self: end;
    }
    :where(.neural-file-upload-empty-base),
    :where(.neural-file-upload-message-base) {
      margin: 0;
      color: var(--neural-file-upload-message-color, inherit);
      font-size: var(--neural-file-upload-message-font-size, 0.75rem);
    }
    :where(.neural-file-upload-message-root) {
      min-height: 1em;
    }
    :where(.neural-file-upload-choose-button-base:focus-visible),
    :where(.neural-file-upload-remove-button-base:focus-visible),
    :where(.neural-file-upload-clear-button-base:focus-visible) {
      outline: var(--neural-file-upload-focus-ring, 2px solid currentColor);
      outline-offset: var(--neural-file-upload-focus-ring-offset, 2px);
    }
    :where(.neural-file-upload-root[data-readonly='true']) {
      color: var(--neural-file-upload-color-readonly, inherit);
    }
    :where(.neural-file-upload-root[data-disabled='true']) {
      opacity: var(--neural-file-upload-disabled-opacity, 0.5);
    }
    :where(.neural-file-upload-root button:disabled) {
      cursor: default;
    }
    @media (prefers-reduced-motion: reduce) {
      :where(.neural-file-upload-dropzone-base),
      :where(.neural-file-upload-choose-button-base),
      :where(.neural-file-upload-remove-button-base),
      :where(.neural-file-upload-clear-button-base) {
        transition-duration: 0.01ms !important;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neural-file-upload-host',
    '[class.neural-file-upload-host-fluid]': 'effectiveFluid()',
  },
})
export class NeuralFileUpload
  implements FormValueControl<NeuralFileUploadValue>
{
  private readonly config = inject(NEURAL_NG_CONFIG);
  private readonly locale = inject(NeuralLocaleService);
  private readonly generatedId = inject(NeuralFileUploadIdGenerator).next();
  protected readonly field = inject(NEURAL_FIELD_CONTEXT, { optional: true });
  private readonly fileInput =
    viewChild.required<ElementRef<HTMLInputElement>>('fileInput');
  private readonly chooseButton =
    viewChild.required<ElementRef<HTMLButtonElement>>('chooseButton');
  private readonly dragDepth = signal(0);

  readonly value = model<NeuralFileUploadValue>([]);
  readonly accept = input('');
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly maxFileSize = input<number | undefined, unknown>(undefined, {
    transform: optionalPositiveNumberAttribute,
  });
  readonly maxFiles = input<number | undefined, unknown>(undefined, {
    transform: optionalPositiveIntegerAttribute,
  });
  readonly allowDuplicates = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly pending = input(false, { transform: booleanAttribute });
  readonly touched = input(false, { transform: booleanAttribute });
  readonly dirty = input(false, { transform: booleanAttribute });
  readonly fluid = input(false, { transform: booleanAttribute });
  readonly showFileList = input(true, { transform: booleanAttribute });
  readonly name = input('');
  readonly capture = input('');
  readonly uploadId = input('');
  readonly ariaLabel = input('');
  readonly ariaLabelledBy = input('');
  readonly chooseFileLabel = input('');
  readonly chooseFilesLabel = input('');
  readonly dropFileLabel = input('');
  readonly dropFilesLabel = input('');
  readonly removeButtonLabel = input('');
  readonly clearFilesLabel = input('');
  readonly emptyFilesLabel = input('');
  readonly chooseIconClass = input('');
  readonly removeIconClass = input('');
  readonly clearIconClass = input('');
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly fileUploadClass = input('');
  readonly inputClass = input('');
  readonly dropzoneClassName = input('');
  readonly fileListClassName = input('');
  readonly classes = input<NeuralFileUploadClasses>({});

  readonly selectionChange = output<NeuralFileSelectionChange>();
  readonly filesRejected = output<NeuralFilesRejectedEvent>();
  readonly fileRemoved = output<NeuralFileRemoveEvent>();
  readonly cleared = output<NeuralFileClearEvent>();
  readonly touch = output<void>();

  readonly announcement = signal('');
  readonly files = computed<NeuralFileUploadValue>(() => {
    const value = this.value();
    return Array.isArray(value) ? value : [];
  });
  readonly effectiveUnstyled = computed(
    () =>
      this.unstyled() ||
      this.field?.effectiveUnstyled() ||
      this.config.unstyled,
  );
  readonly effectiveFluid = computed(() => this.fluid() || this.field?.fluid());
  readonly effectiveDisabled = computed(
    () => this.disabled() || (this.field?.disabled() ?? false),
  );
  readonly effectiveReadonly = computed(
    () => this.readonly() || (this.field?.readonly() ?? false),
  );
  readonly effectiveRequired = computed(
    () => this.required() || (this.field?.required() ?? false),
  );
  readonly effectiveInvalid = computed(
    () => this.invalid() || (this.field?.invalid() ?? false),
  );
  readonly effectivePending = computed(
    () => this.pending() || (this.field?.pending() ?? false),
  );
  readonly controlId = computed(
    () => this.field?.controlId() || this.uploadId() || this.generatedId,
  );
  readonly describedBy = computed(
    () => this.field?.controlDescribedBy() || null,
  );
  readonly dragActive = computed(() => this.dragDepth() > 0);
  readonly messages = computed(() => this.locale.messages().fileUpload);
  readonly chooseLabel = computed(() =>
    this.multiple()
      ? this.chooseFilesLabel() || this.messages().chooseFiles
      : this.chooseFileLabel() || this.messages().chooseFile,
  );
  readonly dropLabel = computed(() =>
    this.multiple()
      ? this.dropFilesLabel() || this.messages().dropFiles
      : this.dropFileLabel() || this.messages().dropFile,
  );
  readonly clearLabel = computed(
    () => this.clearFilesLabel() || this.messages().clearFiles,
  );
  readonly emptyLabel = computed(
    () => this.emptyFilesLabel() || this.messages().empty,
  );
  readonly removeButtonText = computed(
    () => this.removeButtonLabel() || this.messages().remove,
  );
  readonly selectedSummary = computed(() =>
    this.formatSelectedSummary(this.files().length),
  );

  readonly rootClass = computed(() =>
    this.compose(
      'neural-file-upload-root',
      `neural-file-upload-base ${this.effectiveFluid() ? 'neural-file-upload-fluid-base' : ''}`,
      this.fileUploadClass(),
      this.classes().root,
    ),
  );
  readonly inputClassName = computed(() =>
    this.compose(
      'neural-file-upload-input-root',
      'neural-file-upload-input-base',
      this.inputClass(),
      this.classes().input,
    ),
  );
  readonly dropzoneClass = computed(() =>
    this.compose(
      'neural-file-upload-dropzone-root',
      'neural-file-upload-dropzone-base',
      this.dropzoneClassName(),
      this.classes().dropzone,
    ),
  );
  readonly dropzoneIconClass = computed(() =>
    this.compose(
      `neural-file-upload-dropzone-icon-root ${normalizeIconClass(this.chooseIconClass())}`,
      'neural-file-upload-dropzone-icon-base',
      this.classes().dropzoneIcon,
    ),
  );
  readonly dropzoneTextClass = computed(() =>
    this.compose(
      'neural-file-upload-dropzone-text-root',
      'neural-file-upload-dropzone-text-base',
      this.classes().dropzoneText,
    ),
  );
  readonly chooseButtonClass = computed(() =>
    this.compose(
      'neural-file-upload-choose-button-root',
      'neural-file-upload-choose-button-base',
      this.classes().chooseButton,
    ),
  );
  readonly contentClass = computed(() =>
    this.compose(
      'neural-file-upload-content-root',
      'neural-file-upload-content-base',
      this.classes().content,
    ),
  );
  readonly fileListClass = computed(() =>
    this.compose(
      'neural-file-upload-file-list-root',
      'neural-file-upload-file-list-base',
      this.fileListClassName(),
      this.classes().fileList,
    ),
  );
  readonly fileItemClass = computed(() =>
    this.compose(
      'neural-file-upload-file-item-root',
      'neural-file-upload-file-item-base',
      this.classes().fileItem,
    ),
  );
  readonly fileInfoClass = computed(() =>
    this.compose(
      'neural-file-upload-file-info-root',
      'neural-file-upload-file-info-base',
      this.classes().fileInfo,
    ),
  );
  readonly fileNameClass = computed(() =>
    this.compose(
      'neural-file-upload-file-name-root',
      'neural-file-upload-file-name-base',
      this.classes().fileName,
    ),
  );
  readonly fileMetaClass = computed(() =>
    this.compose(
      'neural-file-upload-file-meta-root',
      'neural-file-upload-file-meta-base',
      this.classes().fileMeta,
    ),
  );
  readonly removeButtonClass = computed(() =>
    this.compose(
      'neural-file-upload-remove-button-root',
      'neural-file-upload-remove-button-base',
      this.classes().removeButton,
    ),
  );
  readonly removeIconClassName = computed(() =>
    this.compose(
      `neural-file-upload-remove-icon-root ${normalizeIconClass(this.removeIconClass())}`,
      'neural-file-upload-remove-icon-base',
      this.classes().removeIcon,
    ),
  );
  readonly clearButtonClass = computed(() =>
    this.compose(
      'neural-file-upload-clear-button-root',
      'neural-file-upload-clear-button-base',
      this.classes().clearButton,
    ),
  );
  readonly clearIconClassName = computed(() =>
    this.compose(
      `neural-file-upload-clear-icon-root ${normalizeIconClass(this.clearIconClass())}`,
      'neural-file-upload-clear-icon-base',
      this.classes().clearIcon,
    ),
  );
  readonly emptyClass = computed(() =>
    this.compose(
      'neural-file-upload-empty-root',
      'neural-file-upload-empty-base',
      this.classes().empty,
    ),
  );
  readonly messageClass = computed(() =>
    this.compose(
      'neural-file-upload-message-root',
      'neural-file-upload-message-base',
      this.classes().message,
    ),
  );

  openFileDialog(): void {
    if (this.effectiveDisabled() || this.effectiveReadonly()) return;
    this.fileInput().nativeElement.click();
  }

  handleNativeSelection(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const files = Array.from(inputElement.files ?? []);
    this.processSelection(files, event);
    inputElement.value = '';
  }

  handleDragEnter(event: DragEvent): void {
    if (!this.canAcceptDrop(event)) return;
    event.preventDefault();
    if (this.isInternalDragTransition(event)) return;
    this.dragDepth.update((depth) => depth + 1);
  }

  handleDragOver(event: DragEvent): void {
    if (!this.canAcceptDrop(event)) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  }

  handleDragLeave(event: DragEvent): void {
    if (!this.dragActive()) return;
    event.preventDefault();
    if (this.isInternalDragTransition(event)) return;
    this.dragDepth.update((depth) => Math.max(0, depth - 1));
  }

  handleDrop(event: DragEvent): void {
    if (this.effectiveDisabled() || this.effectiveReadonly()) return;
    event.preventDefault();
    this.dragDepth.set(0);
    this.processSelection(Array.from(event.dataTransfer?.files ?? []), event);
  }

  handleRemove(index: number, event: Event): void {
    if (this.effectiveDisabled() || this.effectiveReadonly()) return;
    const currentFiles = this.files();
    const file = currentFiles[index];
    if (!file) return;
    const value = currentFiles.filter(
      (_, currentIndex) => currentIndex !== index,
    );
    this.value.set(value);
    this.announcement.set(
      this.locale.format(this.messages().removedFile, { fileName: file.name }),
    );
    this.fileRemoved.emit({ file, index, value, originalEvent: event });
    this.touch.emit();
  }

  handleClear(event: Event): void {
    if (this.effectiveDisabled() || this.effectiveReadonly()) return;
    const removedFiles = this.files();
    if (!removedFiles.length) return;
    this.value.set([]);
    this.clearNativeInput();
    this.announcement.set(this.messages().cleared);
    this.cleared.emit({ removedFiles, value: [], originalEvent: event });
    this.touch.emit();
  }

  focus(options?: FocusOptions): void {
    this.chooseButton().nativeElement.focus(options);
  }

  clear(): void {
    this.value.set([]);
    this.clearNativeInput();
    this.announcement.set('');
  }

  reset(): void {
    this.clear();
    this.dragDepth.set(0);
  }

  formatFileSize(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
    const unitIndex = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      units.length - 1,
    );
    const value = bytes / 1024 ** unitIndex;
    return `${new Intl.NumberFormat(this.locale.code(), {
      maximumFractionDigits: unitIndex === 0 ? 0 : 1,
    }).format(value)} ${units[unitIndex]}`;
  }

  removeLabel(file: File): string {
    return this.locale.format(this.messages().removeFile, {
      fileName: file.name,
    });
  }

  fileTrackKey(file: File, index: number): string {
    return `${fileIdentity(file)}:${index}`;
  }

  private processSelection(files: readonly File[], originalEvent: Event): void {
    if (!files.length || this.effectiveDisabled() || this.effectiveReadonly()) {
      return;
    }

    const currentFiles = this.files();
    const retainedFiles = this.multiple() ? currentFiles : [];
    const acceptedFiles: File[] = [];
    const rejectedFiles: NeuralFileRejection[] = [];
    const knownFiles = new Set(retainedFiles.map(fileIdentity));
    const limit = this.multiple() ? (this.maxFiles() ?? Infinity) : 1;

    for (const file of files) {
      const reasons: NeuralFileRejectionReason[] = [];
      if (!matchesAccept(file, this.accept())) reasons.push('file-type');
      if (
        this.maxFileSize() !== undefined &&
        file.size > (this.maxFileSize() as number)
      ) {
        reasons.push('file-size');
      }

      const identity = fileIdentity(file);
      if (!this.allowDuplicates() && knownFiles.has(identity)) {
        reasons.push('duplicate');
      }

      if (
        !reasons.length &&
        retainedFiles.length + acceptedFiles.length >= limit
      ) {
        reasons.push('file-count');
      }

      if (reasons.length) {
        rejectedFiles.push({ file, reasons });
        continue;
      }

      acceptedFiles.push(file);
      knownFiles.add(identity);
    }

    const value: NeuralFileUploadValue = acceptedFiles.length
      ? this.multiple()
        ? [...retainedFiles, ...acceptedFiles]
        : [acceptedFiles[0]]
      : currentFiles;

    if (acceptedFiles.length) this.value.set(value);

    this.announcement.set(
      this.buildSelectionAnnouncement(value.length, rejectedFiles),
    );

    const selectionEvent: NeuralFileSelectionChange = {
      value,
      addedFiles: acceptedFiles,
      rejectedFiles,
      originalEvent,
    };
    this.selectionChange.emit(selectionEvent);

    if (rejectedFiles.length) {
      this.filesRejected.emit({ rejectedFiles, originalEvent });
    }
    this.touch.emit();
  }

  private buildSelectionAnnouncement(
    selectedCount: number,
    rejectedFiles: readonly NeuralFileRejection[],
  ): string {
    const parts = [this.formatSelectedSummary(selectedCount)];
    for (const rejection of rejectedFiles) {
      for (const reason of rejection.reasons) {
        parts.push(this.formatRejection(rejection.file, reason));
      }
    }
    return parts.filter(Boolean).join(' ');
  }

  private formatSelectedSummary(count: number): string {
    const template =
      count === 1
        ? this.messages().selectedFile
        : this.messages().selectedFiles;
    return this.locale.format(template, { count });
  }

  private formatRejection(
    file: File,
    reason: NeuralFileRejectionReason,
  ): string {
    switch (reason) {
      case 'file-type':
        return this.locale.format(this.messages().invalidFileType, {
          fileName: file.name,
        });
      case 'file-size':
        return this.locale.format(this.messages().invalidFileSize, {
          fileName: file.name,
          maxSize: this.formatFileSize(this.maxFileSize() ?? 0),
        });
      case 'file-count':
        return this.locale.format(this.messages().maximumFilesExceeded, {
          fileName: file.name,
          count: this.multiple() ? (this.maxFiles() ?? 1) : 1,
        });
      case 'duplicate':
        return this.locale.format(this.messages().duplicateFile, {
          fileName: file.name,
        });
    }
  }

  private canAcceptDrop(event: DragEvent): boolean {
    if (this.effectiveDisabled() || this.effectiveReadonly()) return false;
    const types = Array.from(event.dataTransfer?.types ?? []);
    return types.length === 0 || types.includes('Files');
  }

  private isInternalDragTransition(event: DragEvent): boolean {
    const currentTarget = event.currentTarget;
    const relatedTarget = event.relatedTarget;
    return (
      currentTarget instanceof Node &&
      relatedTarget instanceof Node &&
      currentTarget.contains(relatedTarget)
    );
  }

  private clearNativeInput(): void {
    this.fileInput().nativeElement.value = '';
  }

  private compose(
    structural: string,
    visual: string,
    ...consumer: Array<string | undefined>
  ): string {
    return [structural, this.effectiveUnstyled() ? '' : visual, ...consumer]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(' ');
  }
}

/** @deprecated Use `NeuralFileUpload`. */
export { NeuralFileUpload as FileUploadComponent };

function matchesAccept(file: File, accept: string): boolean {
  const rules = accept
    .split(',')
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean);
  if (!rules.length) return true;

  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();

  return rules.some((rule) => {
    if (rule.startsWith('.')) return fileName.endsWith(rule);
    if (rule === '*/*') return true;
    if (rule.endsWith('/*')) {
      return fileType.startsWith(`${rule.slice(0, -1)}`);
    }
    return fileType === rule;
  });
}

function fileIdentity(file: File): string {
  return `${file.name}\u0000${file.size}\u0000${file.type}\u0000${file.lastModified}`;
}

function optionalPositiveNumberAttribute(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = numberAttribute(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function optionalPositiveIntegerAttribute(value: unknown): number | undefined {
  const parsed = optionalPositiveNumberAttribute(value);
  return parsed === undefined ? undefined : Math.max(1, Math.floor(parsed));
}

function normalizeIconClass(value: string): string {
  const normalized = value.trim();
  if (!normalized) return '';
  const classes = normalized.split(/\s+/);
  return classes.some((name) => name.startsWith('nt-')) &&
    !classes.includes('nt')
    ? `nt ${normalized}`
    : normalized;
}
