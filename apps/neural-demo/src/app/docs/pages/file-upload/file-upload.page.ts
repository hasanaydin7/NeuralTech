import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { NeuralColorModeService } from '@neural-ng/core/color-mode';
import {
  FieldComponent,
  FieldHintDirective,
  FieldLabelDirective,
} from '@neural-ng/core/field';
import {
  FileUploadComponent,
  type NeuralFileSelectionChange,
  type NeuralFileUploadClasses,
  type NeuralFileUploadValue,
} from '@neural-ng/core/file-upload';
import { CodeView } from '../../../shared/code-view';

@Component({
  selector: 'app-file-upload-page',
  imports: [
    CodeView,
    FieldComponent,
    FieldHintDirective,
    FieldLabelDirective,
    FileUploadComponent,
    FormField,
  ],
  templateUrl: './file-upload.page.html',
  styleUrls: ['../shared-doc-page.scss', './file-upload.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class FileUploadPage {
  readonly resolvedMode = inject(NeuralColorModeService).resolvedMode;
  readonly application = signal<{ attachments: NeuralFileUploadValue }>({
    attachments: [],
  });
  readonly applicationForm = form(this.application);
  readonly avatar = signal<NeuralFileUploadValue>([]);
  readonly headlessFiles = signal<NeuralFileUploadValue>([]);
  readonly eventStatus = signal('No files selected.');
  readonly submitStatus = signal('HTTP upload stays in application code.');
  readonly headlessClasses: NeuralFileUploadClasses = {
    root: 'docs-file-upload-headless',
    dropzone: 'docs-file-upload-headless__dropzone',
    dropzoneText: 'docs-file-upload-headless__text',
    chooseButton: 'docs-file-upload-headless__choose',
    content: 'docs-file-upload-headless__content',
    fileList: 'docs-file-upload-headless__list',
    fileItem: 'docs-file-upload-headless__item',
    fileInfo: 'docs-file-upload-headless__info',
    fileName: 'docs-file-upload-headless__name',
    fileMeta: 'docs-file-upload-headless__meta',
    removeButton: 'docs-file-upload-headless__remove',
    clearButton: 'docs-file-upload-headless__clear',
    empty: 'docs-file-upload-headless__empty',
    message: 'docs-file-upload-headless__message',
  };

  readonly importCode = `import { FileUploadComponent } from '@neural-ng/core/file-upload';`;
  readonly basicCode = `<neural-field controlId="application-files" fluid>
  <label neuralFieldLabel>Supporting files</label>
  <neural-file-upload
    [formField]="applicationForm.attachments"
    accept=".pdf,image/*"
    [maxFileSize]="10 * 1024 * 1024"
    [maxFiles]="5"
    multiple
    fluid
  />
  <small neuralFieldHint>PDF or image, up to 10 MB each.</small>
</neural-field>`;
  readonly singleCode = `<neural-file-upload
  ariaLabel="Profile image"
  accept="image/png,image/jpeg"
  [(value)]="avatar"
  fluid
/>`;
  readonly formDataCode = `const body = new FormData();
for (const file of attachments()) {
  body.append('attachments', file, file.name);
}

http.post('/api/applications', body);`;
  readonly headlessCode = `<neural-file-upload
  [(value)]="files"
  [classes]="fileUploadClasses"
  accept=".pdf"
  multiple
  unstyled
  fluid
/>`;

  selectionChanged(event: NeuralFileSelectionChange): void {
    this.eventStatus.set(
      `${event.addedFiles.length} added · ${event.rejectedFiles.length} rejected · ${event.value.length} selected`,
    );
  }

  prepareFormData(): void {
    const files = this.application().attachments;
    const body = new FormData();
    for (const file of files) body.append('attachments', file, file.name);
    this.submitStatus.set(
      `Prepared FormData with ${files.length} file${files.length === 1 ? '' : 's'}.`,
    );
  }
}
