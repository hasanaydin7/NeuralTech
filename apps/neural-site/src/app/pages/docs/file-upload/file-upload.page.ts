import { SiteOnThisPage } from '../../../shared/on-this-page';
import { ViewportScroller } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { NeuralButton } from '@neural-ng/core/button';
import {
  NeuralField,
  NeuralFieldHint,
  NeuralFieldLabel,
} from '@neural-ng/core/field';
import {
  NeuralFileUpload,
  type NeuralFileSelectionChange,
  type NeuralFileUploadClasses,
  type NeuralFileUploadValue,
} from '@neural-ng/core/file-upload';
import {
  NeuralTab,
  NeuralTabList,
  NeuralTabPanel,
  NeuralTabPanels,
  NeuralTabs,
  type NeuralTabsClasses,
  type NeuralTabValue,
} from '@neural-ng/core/tabs';
import { SiteAppearanceService } from '../../../core/site-appearance.service';
import { CodeView } from '../../../shared/code-view';
import { DesignTokenList } from '../../../shared/design-token-list';

type FileUploadDocView = 'component' | 'accessibility' | 'api' | 'tokens';

@Component({
  selector: 'app-file-upload-page',
  imports: [
    SiteOnThisPage,
    DesignTokenList,
    CodeView,
    FormField,
    FormsModule,
    NeuralButton,
    NeuralField,
    NeuralFieldHint,
    NeuralFieldLabel,
    NeuralFileUpload,
    NeuralTab,
    NeuralTabList,
    NeuralTabPanel,
    NeuralTabPanels,
    NeuralTabs,
    ReactiveFormsModule,
  ],
  templateUrl: './file-upload.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileUploadPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly viewportScroller = inject(ViewportScroller);
  readonly appearance = inject(SiteAppearanceService);

  readonly application = signal<{ attachments: NeuralFileUploadValue }>({
    attachments: [],
  });
  readonly applicationForm = form(this.application);
  readonly avatar = signal<NeuralFileUploadValue>([]);
  readonly constrainedFiles = signal<NeuralFileUploadValue>([]);
  readonly headlessFiles = signal<NeuralFileUploadValue>([]);
  readonly reactiveFiles = new FormControl<NeuralFileUploadValue>([], {
    nonNullable: true,
  });
  templateFiles: NeuralFileUploadValue = [];
  readonly eventStatus = signal('No selection event yet.');
  readonly uploadStatus = signal('HTTP upload remains application-owned.');

  readonly selectedView = signal<FileUploadDocView>(
    resolveFileUploadDocView(this.router.url),
  );
  readonly selectedViewIndex = computed(() =>
    ['component', 'accessibility', 'api', 'tokens'].indexOf(
      this.selectedView(),
    ),
  );
  readonly docTabClasses: NeuralTabsClasses = {
    root: 'min-w-0',
    list: 'relative isolate gap-1 overflow-x-auto rounded-[1.35rem] border border-white/20 bg-[color-mix(in_srgb,var(--site-surface)_76%,transparent)] p-1.5 shadow-[inset_0_1px_rgba(255,255,255,.28),0_12px_35px_rgba(15,23,42,.10)] backdrop-blur-[30px] backdrop-saturate-150',
    tab: 'relative z-10 !flex-1 gap-2 rounded-[1rem] px-3 py-2.5 text-xs font-bold text-[var(--site-text-muted)] transition-[color,transform] duration-300 hover:text-[var(--site-text)] active:scale-[.97] sm:px-4 sm:text-sm',
    activeTab: 'text-[var(--site-text)]',
    panels: 'min-w-0',
    panel:
      'min-w-0 !p-0 animate-[neural-doc-panel-soft-in_200ms_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animate-none',
  };

  readonly pageLinks: Record<
    FileUploadDocView,
    readonly (readonly [string, string])[]
  > = {
    component: [
      ['Import', 'import'],
      ['Multiple files', 'multiple'],
      ['Single file', 'single'],
      ['Angular Forms', 'forms'],
      ['Validation', 'validation'],
      ['States', 'states'],
      ['Labels and icons', 'labels-icons'],
      ['HTTP boundary', 'http-boundary'],
      ['Unstyled', 'unstyled'],
    ],
    accessibility: [
      ['Native semantics', 'native-semantics'],
      ['Names and status', 'names-status'],
      ['Keyboard', 'keyboard'],
      ['Security', 'security'],
    ],
    api: [
      ['Inputs', 'inputs'],
      ['Events', 'events'],
      ['Methods', 'methods'],
      ['Class slots', 'class-slots'],
      ['Value contract', 'value-contract'],
    ],
    tokens: [['Design tokens', 'design-tokens']],
  };

  readonly headlessClasses: NeuralFileUploadClasses = {
    root: 'grid gap-4 font-mono',
    dropzone:
      'grid min-h-40 place-items-center rounded-2xl border-2 border-dashed border-cyan-400/40 bg-slate-950 p-6 text-center text-cyan-100 transition data-[drag-active=true]:border-cyan-300',
    dropzoneText: 'grid justify-items-center gap-3',
    chooseButton:
      'rounded-xl bg-cyan-400 px-4 py-2 font-black text-slate-950 transition hover:bg-cyan-300',
    content: 'grid gap-3',
    fileList: 'grid gap-2',
    fileItem:
      'flex items-center justify-between gap-3 rounded-xl border border-cyan-400/25 bg-slate-950 px-4 py-3',
    fileInfo: 'grid min-w-0 text-left',
    fileName: 'truncate font-bold text-cyan-100',
    fileMeta: 'text-xs text-cyan-500',
    removeButton:
      'rounded-lg border border-cyan-400/25 px-3 py-1.5 text-cyan-300 hover:bg-cyan-400/10',
    clearButton:
      'justify-self-end rounded-lg border border-cyan-400/25 px-3 py-1.5 text-cyan-300 hover:bg-cyan-400/10',
    empty: 'text-sm text-cyan-600',
    message: 'text-xs text-cyan-500',
  };

  readonly importCode = `import {
  NeuralFileUpload,
  type NeuralFileUploadValue,
} from '@neural-ng/core/file-upload';`;

  readonly multipleCode = `<neural-field controlId="application-files" fluid>
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

  readonly formsCode = `<!-- Signal Forms -->
<neural-file-upload [formField]="applicationForm.attachments" />

<!-- Reactive Forms -->
<neural-file-upload [formControl]="reactiveFiles" />

<!-- Template-driven Forms -->
<neural-file-upload name="files" [(ngModel)]="templateFiles" />`;

  readonly validationCode = `<neural-file-upload
  [(value)]="files"
  accept=".pdf,image/png"
  [maxFileSize]="2 * 1024 * 1024"
  [maxFiles]="3"
  [allowDuplicates]="false"
  multiple
  (selectionChange)="selectionChanged($event)"
  (filesRejected)="rejected($event)"
/>`;

  readonly statesCode = `<neural-file-upload disabled />
<neural-file-upload readonly />
<neural-file-upload required invalid />
<neural-file-upload pending />
<neural-file-upload [showFileList]="false" />`;

  readonly labelsCode = `<neural-file-upload
  chooseFilesLabel="Browse assets"
  dropFilesLabel="Drop release assets here"
  clearFilesLabel="Remove all"
  emptyFilesLabel="No release assets"
  chooseIconClass="nt nt-file-text"
  removeIconClass="nt nt-x"
  clearIconClass="nt nt-trash"
  multiple
/>`;

  readonly httpCode = `const body = new FormData();
for (const file of attachments()) {
  body.append('attachments', file, file.name);
}

http.post('/api/applications', body, {
  reportProgress: true,
  observe: 'events',
});`;

  readonly unstyledCode = `<neural-file-upload
  [(value)]="files"
  [classes]="fileUploadClasses"
  accept=".pdf"
  multiple
  unstyled
  fluid
/>`;

  readonly inputs = [
    ['value', 'readonly File[]', '[]', 'Immutable selected-file model.'],
    ['accept', 'string', `''`, 'Native and client-side MIME/extension filter.'],
    ['multiple', 'boolean', 'false', 'Append multiple accepted files.'],
    [
      'maxFileSize',
      'number | undefined',
      'undefined',
      'Maximum bytes per file.',
    ],
    ['maxFiles', 'number | undefined', 'undefined', 'Maximum selected count.'],
    [
      'allowDuplicates',
      'boolean',
      'false',
      'Allows identical file identities.',
    ],
    ['disabled', 'boolean', 'false', 'Blocks every interaction.'],
    ['readonly', 'boolean', 'false', 'Shows selection but blocks mutations.'],
    ['required', 'boolean', 'false', 'Exposes required state and ARIA.'],
    ['invalid', 'boolean', 'false', 'Exposes invalid presentation and ARIA.'],
    ['pending', 'boolean', 'false', 'Exposes busy state.'],
    ['touched', 'boolean', 'false', 'External form-state hook.'],
    ['dirty', 'boolean', 'false', 'External form-state hook.'],
    ['fluid', 'boolean', 'false', 'Fills available inline width.'],
    ['showFileList', 'boolean', 'true', 'Shows selected file rows.'],
    ['name', 'string', `''`, 'Native file input name.'],
    ['capture', 'string', `''`, 'Native capture hint.'],
    ['uploadId', 'string', `''`, 'Explicit control ID outside Field.'],
    ['ariaLabel', 'string', `''`, 'Accessible name.'],
    ['ariaLabelledBy', 'string', `''`, 'Visible-label relationship.'],
    ['chooseFileLabel', 'string', `''`, 'Single chooser override.'],
    ['chooseFilesLabel', 'string', `''`, 'Multiple chooser override.'],
    ['dropFileLabel', 'string', `''`, 'Single drop text override.'],
    ['dropFilesLabel', 'string', `''`, 'Multiple drop text override.'],
    ['removeButtonLabel', 'string', `''`, 'Visible remove text override.'],
    ['clearFilesLabel', 'string', `''`, 'Clear action override.'],
    ['emptyFilesLabel', 'string', `''`, 'Empty state override.'],
    ['chooseIconClass', 'string', `''`, 'Chooser Neural Icon class.'],
    ['removeIconClass', 'string', `''`, 'Remove Neural Icon class.'],
    ['clearIconClass', 'string', `''`, 'Clear Neural Icon class.'],
    ['unstyled', 'boolean', 'false', 'Removes NeuralNg visual classes.'],
    ['fileUploadClass', 'string', `''`, 'Consumer root class.'],
    ['inputClass', 'string', `''`, 'Consumer native input class.'],
    ['dropzoneClassName', 'string', `''`, 'Consumer dropzone class.'],
    ['fileListClassName', 'string', `''`, 'Consumer list class.'],
    ['classes', 'NeuralFileUploadClasses', '{}', 'Typed visual slots.'],
  ] as const;

  readonly events = [
    ['valueChange', 'readonly File[]', 'Generated model output.'],
    [
      'selectionChange',
      'NeuralFileSelectionChange',
      'Accepted/rejected user selection.',
    ],
    ['filesRejected', 'NeuralFilesRejectedEvent', 'Focused rejection event.'],
    ['fileRemoved', 'NeuralFileRemoveEvent', 'User removed one file.'],
    ['cleared', 'NeuralFileClearEvent', 'User cleared the selection.'],
    ['touch', 'void', 'Blur or completed user selection.'],
  ] as const;

  readonly methods = [
    ['openFileDialog()', 'Opens the native file chooser.'],
    ['focus(options?)', 'Focuses the visible choose button.'],
    ['clear()', 'Clears programmatically without user-action events.'],
    ['reset()', 'Clears value and transient drag state.'],
    ['formatFileSize(bytes)', 'Formats bytes through the active locale.'],
  ] as const;

  readonly classSlots = [
    'root',
    'input',
    'dropzone',
    'dropzoneIcon',
    'dropzoneText',
    'chooseButton',
    'content',
    'fileList',
    'fileItem',
    'fileInfo',
    'fileName',
    'fileMeta',
    'removeButton',
    'removeIcon',
    'clearButton',
    'clearIcon',
    'empty',
    'message',
  ] as const;

  readonly tokens = [
    '--neural-file-upload-width',
    '--neural-file-upload-gap',
    '--neural-file-upload-color',
    '--neural-file-upload-color-readonly',
    '--neural-file-upload-font-family',
    '--neural-file-upload-font-size',
    '--neural-file-upload-line-height',
    '--neural-file-upload-dropzone-min-height',
    '--neural-file-upload-dropzone-padding',
    '--neural-file-upload-dropzone-color',
    '--neural-file-upload-dropzone-color-active',
    '--neural-file-upload-dropzone-background',
    '--neural-file-upload-dropzone-background-active',
    '--neural-file-upload-dropzone-border',
    '--neural-file-upload-dropzone-border-color-active',
    '--neural-file-upload-dropzone-border-color-invalid',
    '--neural-file-upload-radius',
    '--neural-file-upload-shadow',
    '--neural-file-upload-shadow-active',
    '--neural-file-upload-shadow-invalid',
    '--neural-file-upload-icon-gap',
    '--neural-file-upload-icon-color',
    '--neural-file-upload-icon-size',
    '--neural-file-upload-text-gap',
    '--neural-file-upload-text-color',
    '--neural-file-upload-button-min-height',
    '--neural-file-upload-button-padding',
    '--neural-file-upload-button-color',
    '--neural-file-upload-button-background',
    '--neural-file-upload-button-border',
    '--neural-file-upload-button-color-hover',
    '--neural-file-upload-button-background-hover',
    '--neural-file-upload-button-border-color-hover',
    '--neural-file-upload-button-radius',
    '--neural-file-upload-content-gap',
    '--neural-file-upload-file-gap',
    '--neural-file-upload-file-item-gap',
    '--neural-file-upload-file-item-padding',
    '--neural-file-upload-file-item-background',
    '--neural-file-upload-file-item-border',
    '--neural-file-upload-file-item-radius',
    '--neural-file-upload-file-info-gap',
    '--neural-file-upload-file-name-color',
    '--neural-file-upload-file-name-weight',
    '--neural-file-upload-file-meta-color',
    '--neural-file-upload-file-meta-font-size',
    '--neural-file-upload-action-gap',
    '--neural-file-upload-action-min-height',
    '--neural-file-upload-action-padding',
    '--neural-file-upload-action-color',
    '--neural-file-upload-action-background',
    '--neural-file-upload-action-border',
    '--neural-file-upload-action-color-hover',
    '--neural-file-upload-action-background-hover',
    '--neural-file-upload-action-radius',
    '--neural-file-upload-message-color',
    '--neural-file-upload-message-font-size',
    '--neural-file-upload-focus-ring',
    '--neural-file-upload-focus-ring-offset',
    '--neural-file-upload-disabled-opacity',
    '--neural-file-upload-transition',
  ] as const;

  constructor() {
    const subscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.selectedView.set(
          resolveFileUploadDocView(event.urlAfterRedirects),
        );
      }
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  selectionChanged(event: NeuralFileSelectionChange): void {
    this.eventStatus.set(
      `${event.addedFiles.length} added · ${event.rejectedFiles.length} rejected · ${event.value.length} selected`,
    );
  }

  prepareFormData(): void {
    const files = this.application().attachments;
    const body = new FormData();
    for (const file of files) body.append('attachments', file, file.name);
    this.uploadStatus.set(
      `Prepared FormData with ${files.length} file${files.length === 1 ? '' : 's'}.`,
    );
  }

  selectView(value: NeuralTabValue | null): void {
    if (!isFileUploadDocView(value) || value === this.selectedView()) return;
    this.selectedView.set(value);
    const suffix = value === 'component' ? '' : `/${value}`;
    void this.router.navigateByUrl(`/docs/components/file-upload${suffix}`);
  }

  openSection(fragment: string, event: Event): void {
    event.preventDefault();
    void this.router
      .navigate([], { relativeTo: this.route, fragment })
      .then(() => this.viewportScroller.scrollToAnchor(fragment));
  }
}

function resolveFileUploadDocView(url: string): FileUploadDocView {
  const path = url.split(/[?#]/, 1)[0];
  if (path.endsWith('/accessibility')) return 'accessibility';
  if (path.endsWith('/api')) return 'api';
  if (path.endsWith('/tokens')) return 'tokens';
  return 'component';
}

function isFileUploadDocView(
  value: NeuralTabValue | null,
): value is FileUploadDocView {
  return (
    value === 'component' ||
    value === 'accessibility' ||
    value === 'api' ||
    value === 'tokens'
  );
}
