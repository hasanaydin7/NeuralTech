import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { provideNeuralNg } from '../src/neural-ng.config';
import { NeuralFileUpload } from './file-upload.component';
import type {
  NeuralFileClearEvent,
  NeuralFileRemoveEvent,
  NeuralFileSelectionChange,
  NeuralFilesRejectedEvent,
  NeuralFileUploadValue,
} from './file-upload.types';

@Component({
  imports: [NeuralFileUpload],
  template: `<neural-file-upload
    uploadId="documents"
    name="documents"
    accept=".pdf,image/*"
    [(value)]="files"
    [multiple]="multiple()"
    [maxFileSize]="maxFileSize()"
    [maxFiles]="maxFiles()"
    [readonly]="readonly()"
    [unstyled]="unstyled()"
    fluid
    (selectionChange)="selectionEvents.push($event)"
    (filesRejected)="rejectionEvents.push($event)"
    (fileRemoved)="removeEvents.push($event)"
    (cleared)="clearEvents.push($event)"
    (touch)="touches.update((count) => count + 1)"
  />`,
})
class Host {
  readonly files = signal<NeuralFileUploadValue>([]);
  readonly multiple = signal(false);
  readonly maxFileSize = signal<number | undefined>(undefined);
  readonly maxFiles = signal<number | undefined>(undefined);
  readonly readonly = signal(false);
  readonly unstyled = signal(false);
  readonly touches = signal(0);
  readonly selectionEvents: NeuralFileSelectionChange[] = [];
  readonly rejectionEvents: NeuralFilesRejectedEvent[] = [];
  readonly removeEvents: NeuralFileRemoveEvent[] = [];
  readonly clearEvents: NeuralFileClearEvent[] = [];
}

@Component({
  imports: [NeuralFileUpload, FormField, FormsModule, ReactiveFormsModule],
  template: `
    <neural-file-upload [formControl]="reactiveFiles" />
    <neural-file-upload name="templateFiles" [(ngModel)]="templateFiles" />
    <neural-file-upload [formField]="uploadForm.files" />
  `,
})
class FormsHost {
  readonly reactiveFiles = new FormControl<NeuralFileUploadValue>([], {
    nonNullable: true,
  });
  templateFiles: NeuralFileUploadValue = [];
  readonly model = signal<{ files: NeuralFileUploadValue }>({ files: [] });
  readonly uploadForm = form(this.model);
}

function last<T>(values: readonly T[]): T | undefined {
  return values[values.length - 1];
}

describe('NeuralFileUpload', () => {
  async function createHost(globalUnstyled = false) {
    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideNeuralNg({ unstyled: globalUnstyled })],
    }).compileComponents();
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return fixture;
  }

  it('keeps native file semantics and replaces the value in single mode', async () => {
    const fixture = await createHost();
    const input = fixture.nativeElement.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const documentFile = createFile('contract.pdf', 4, 'application/pdf');

    expect(input.id).toBe('documents');
    expect(input.name).toBe('documents');
    expect(input.accept).toBe('.pdf,image/*');
    expect(input.multiple).toBe(false);

    selectFiles(input, [documentFile]);
    fixture.detectChanges();

    expect(fixture.componentInstance.files()).toEqual([documentFile]);
    expect(input.value).toBe('');
    expect(last(fixture.componentInstance.selectionEvents)?.addedFiles).toEqual(
      [documentFile],
    );
    expect(fixture.componentInstance.touches()).toBe(1);
    expect(
      fixture.nativeElement.querySelector('.neural-file-upload-file-name-root')
        .textContent,
    ).toContain('contract.pdf');
  });

  it('validates type, size, duplicate identity, and count deterministically', async () => {
    const fixture = await createHost();
    fixture.componentInstance.multiple.set(true);
    fixture.componentInstance.maxFileSize.set(5);
    fixture.componentInstance.maxFiles.set(2);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const first = createFile('first.pdf', 4, 'application/pdf', 1);
    const duplicate = createFile('first.pdf', 4, 'application/pdf', 1);
    const tooLarge = createFile('large.png', 6, 'image/png', 2);
    const wrongType = createFile('notes.txt', 2, 'text/plain', 3);
    const second = createFile('photo.png', 4, 'image/png', 4);
    const overLimit = createFile('third.pdf', 3, 'application/pdf', 5);

    selectFiles(input, [
      first,
      duplicate,
      tooLarge,
      wrongType,
      second,
      overLimit,
    ]);
    fixture.detectChanges();

    expect(fixture.componentInstance.files()).toEqual([first, second]);
    const rejected = last(
      fixture.componentInstance.rejectionEvents,
    )?.rejectedFiles;
    expect(rejected?.map((entry) => entry.reasons)).toEqual([
      ['duplicate'],
      ['file-size'],
      ['file-type'],
      ['file-count'],
    ]);
    expect(last(fixture.componentInstance.selectionEvents)?.value).toEqual([
      first,
      second,
    ]);
  });

  it('supports drag and drop without adding HTTP behavior', async () => {
    const fixture = await createHost();
    fixture.componentInstance.multiple.set(true);
    fixture.detectChanges();
    const file = createFile('dropped.pdf', 3, 'application/pdf');
    const dropzone = fixture.nativeElement.querySelector(
      '.neural-file-upload-dropzone-root',
    ) as HTMLElement;

    const enter = createDragEvent('dragenter', [file]);
    dropzone.dispatchEvent(enter);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.neural-file-upload-root').dataset
        .dragActive,
    ).toBe('true');

    const drop = createDragEvent('drop', [file]);
    dropzone.dispatchEvent(drop);
    fixture.detectChanges();
    expect(drop.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.files()).toEqual([file]);
    expect(
      fixture.nativeElement.querySelector('.neural-file-upload-root').dataset
        .dragActive,
    ).toBeUndefined();
  });

  it('removes and clears immutable values through user events', async () => {
    const fixture = await createHost();
    const first = createFile('first.pdf', 1, 'application/pdf');
    const second = createFile('second.pdf', 1, 'application/pdf');
    fixture.componentInstance.multiple.set(true);
    fixture.componentInstance.files.set([first, second]);
    fixture.detectChanges();

    const original = fixture.componentInstance.files();
    const removeButton = fixture.nativeElement.querySelector(
      '.neural-file-upload-remove-button-root',
    ) as HTMLButtonElement;
    removeButton.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.files()).toEqual([second]);
    expect(fixture.componentInstance.files()).not.toBe(original);
    expect(last(fixture.componentInstance.removeEvents)?.file).toBe(first);

    const clearButton = fixture.nativeElement.querySelector(
      '.neural-file-upload-clear-button-root',
    ) as HTMLButtonElement;
    clearButton.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.files()).toEqual([]);
    expect(last(fixture.componentInstance.clearEvents)?.removedFiles).toEqual([
      second,
    ]);
  });

  it('blocks readonly interaction and keeps structural hooks in unstyled mode', async () => {
    const fixture = await createHost(true);
    const existing = createFile('readonly.pdf', 1, 'application/pdf');
    fixture.componentInstance.files.set([existing]);
    fixture.componentInstance.readonly.set(true);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const choose = fixture.nativeElement.querySelector(
      '.neural-file-upload-choose-button-root',
    ) as HTMLButtonElement;
    const remove = fixture.nativeElement.querySelector(
      '.neural-file-upload-remove-button-root',
    ) as HTMLButtonElement;

    expect(input.disabled).toBe(true);
    expect(choose.disabled).toBe(true);
    expect(remove.disabled).toBe(true);
    expect(
      fixture.nativeElement
        .querySelector('.neural-file-upload-root')
        .classList.contains('neural-file-upload-base'),
    ).toBe(false);
  });

  it('binds Reactive, template-driven, and Signal Forms through one file array model', async () => {
    await TestBed.configureTestingModule({
      imports: [FormsHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(FormsHost);
    fixture.detectChanges();
    await fixture.whenStable();

    const reactive = createFile('reactive.pdf', 1, 'application/pdf');
    const template = createFile('template.pdf', 1, 'application/pdf');
    const signalFile = createFile('signal.pdf', 1, 'application/pdf');
    fixture.componentInstance.reactiveFiles.setValue([reactive]);
    fixture.componentInstance.templateFiles = [template];
    fixture.componentInstance.model.set({ files: [signalFile] });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const names = Array.from(
      fixture.nativeElement.querySelectorAll('neural-file-upload'),
      (upload: Element) =>
        upload
          .querySelector('.neural-file-upload-file-name-root')
          ?.textContent?.trim(),
    );
    expect(names).toEqual(['reactive.pdf', 'template.pdf', 'signal.pdf']);
  });
});

function createFile(
  name: string,
  size: number,
  type: string,
  lastModified = 1,
): File {
  return new File([new Uint8Array(size)], name, { type, lastModified });
}

function selectFiles(input: HTMLInputElement, files: readonly File[]): void {
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: createFileList(files),
  });
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function createFileList(files: readonly File[]): FileList {
  return {
    ...files,
    length: files.length,
    item: (index: number) => files[index] ?? null,
  } as FileList;
}

function createDragEvent(type: string, files: readonly File[]): DragEvent {
  const event = new Event(type, {
    bubbles: true,
    cancelable: true,
  }) as DragEvent;
  Object.defineProperty(event, 'dataTransfer', {
    configurable: true,
    value: {
      files: createFileList(files),
      types: ['Files'],
      dropEffect: 'none',
    },
  });
  return event;
}
