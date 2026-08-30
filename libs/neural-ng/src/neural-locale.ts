import {
  Injectable,
  InjectionToken,
  computed,
  inject,
  signal,
  type EnvironmentProviders,
  makeEnvironmentProviders,
} from '@angular/core';

export type NeuralTextDirection = 'ltr' | 'rtl';
export type NeuralFirstDayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface NeuralCommonMessages {
  readonly clear: string;
  readonly close: string;
  readonly loading: string;
  readonly enterFullscreen: string;
  readonly exitFullscreen: string;
}

export interface NeuralPaginatorMessages {
  readonly navigation: string;
  readonly firstPage: string;
  readonly previousPage: string;
  readonly nextPage: string;
  readonly lastPage: string;
  readonly page: string;
  readonly pageSize: string;
  readonly report: string;
}

export interface NeuralInputNumberMessages {
  readonly increment: string;
  readonly decrement: string;
  readonly invalidValue: string;
}

export interface NeuralPasswordMessages {
  readonly show: string;
  readonly hide: string;
  readonly empty: string;
  readonly weak: string;
  readonly medium: string;
  readonly strong: string;
  readonly capsLock: string;
}

export interface NeuralFileUploadMessages {
  readonly chooseFile: string;
  readonly chooseFiles: string;
  readonly dropFile: string;
  readonly dropFiles: string;
  readonly selectedFile: string;
  readonly selectedFiles: string;
  readonly remove: string;
  readonly removeFile: string;
  readonly removedFile: string;
  readonly clearFiles: string;
  readonly cleared: string;
  readonly empty: string;
  readonly invalidFileType: string;
  readonly invalidFileSize: string;
  readonly maximumFilesExceeded: string;
  readonly duplicateFile: string;
}

export interface NeuralEditorMessages {
  readonly toolbar: string;
  readonly content: string;
  readonly placeholder: string;
  readonly undo: string;
  readonly redo: string;
  readonly paragraph: string;
  readonly heading1: string;
  readonly heading2: string;
  readonly heading3: string;
  readonly bold: string;
  readonly italic: string;
  readonly underline: string;
  readonly strike: string;
  readonly code: string;
  readonly bulletList: string;
  readonly orderedList: string;
  readonly taskList: string;
  readonly taskChecked: string;
  readonly taskUnchecked: string;
  readonly blockquote: string;
  readonly codeBlock: string;
  readonly alignLeft: string;
  readonly alignCenter: string;
  readonly alignRight: string;
  readonly alignJustify: string;
  readonly textColor: string;
  readonly highlight: string;
  readonly removeTextColor: string;
  readonly removeHighlight: string;
  readonly table: string;
  readonly insertTable: string;
  readonly deleteTable: string;
  readonly addRowBefore: string;
  readonly addRowAfter: string;
  readonly deleteRow: string;
  readonly addColumnBefore: string;
  readonly addColumnAfter: string;
  readonly deleteColumn: string;
  readonly mergeCells: string;
  readonly splitCell: string;
  readonly toggleHeaderRow: string;
  readonly link: string;
  readonly linkUrl: string;
  readonly linkPlaceholder: string;
  readonly applyLink: string;
  readonly removeLink: string;
  readonly bubbleMenu: string;
  readonly floatingMenu: string;
  readonly linkPopover: string;
  readonly closeLinkPopover: string;
  readonly slashMenu: string;
  readonly mentionMenu: string;
  readonly commandPalette: string;
  readonly commandPalettePlaceholder: string;
  readonly suggestionLoading: string;
  readonly slashEmpty: string;
  readonly mentionEmpty: string;
  readonly commandPaletteEmpty: string;
  readonly aiAsk: string;
  readonly aiRewrite: string;
  readonly aiReview: string;
  readonly aiProposal: string;
  readonly aiPrevious: string;
  readonly aiNext: string;
  readonly aiAccept: string;
  readonly aiReject: string;
  readonly aiChangeProgress: string;
  readonly insertImage: string;
  readonly removeImage: string;
  readonly horizontalRule: string;
  readonly clearFormatting: string;
  readonly characterCount: string;
  readonly wordCount: string;
  readonly collaborationPanel: string;
  readonly collaborationDisabled: string;
  readonly collaborationConnecting: string;
  readonly collaborationConnected: string;
  readonly collaborationSynced: string;
  readonly collaborationDisconnected: string;
  readonly collaborationError: string;
  readonly presence: string;
  readonly you: string;
  readonly comments: string;
  readonly commentPlaceholder: string;
  readonly addComment: string;
  readonly noComments: string;
  readonly openComment: string;
  readonly resolvedComment: string;
  readonly resolveComment: string;
  readonly reopenComment: string;
  readonly deleteComment: string;
  readonly trackedChanges: string;
  readonly noTrackedChanges: string;
  readonly insertion: string;
  readonly deletion: string;
  readonly acceptChange: string;
  readonly rejectChange: string;
  readonly acceptAllChanges: string;
  readonly rejectAllChanges: string;
  readonly versionHistory: string;
  readonly snapshotLabelPlaceholder: string;
  readonly createSnapshot: string;
  readonly noSnapshots: string;
  readonly untitledSnapshot: string;
  readonly restoreSnapshot: string;
  readonly deleteSnapshot: string;
}

export interface NeuralInputOtpMessages {
  readonly groupLabel: string;
  readonly characterLabel: string;
}

export interface NeuralInputMaskMessages {
  readonly inputLabel: string;
  readonly incomplete: string;
}

export interface NeuralAutoCompleteMessages {
  readonly placeholder: string;
  readonly empty: string;
  readonly loading: string;
  readonly clear: string;
  readonly dropdown: string;
}

export interface NeuralMultiSelectMessages {
  readonly placeholder: string;
  readonly filterPlaceholder: string;
  readonly empty: string;
  readonly loading: string;
  readonly selectedItems: string;
  readonly selectAll: string;
  readonly clear: string;
  readonly dropdown: string;
  readonly remove: string;
}

export interface NeuralConfirmDialogMessages {
  readonly header: string;
  readonly accept: string;
  readonly reject: string;
}

export interface NeuralTreeMessages {
  readonly navigation: string;
  readonly expand: string;
  readonly collapse: string;
  readonly empty: string;
  readonly loading: string;
  readonly loadError: string;
  readonly retry: string;
}

export interface NeuralDatePickerMessages {
  readonly chooseDate: string;
  readonly chooseTime: string;
  readonly changeDate: string;
  readonly changeTime: string;
  readonly changeDateTime: string;
  readonly previousMonth: string;
  readonly nextMonth: string;
  readonly chooseMonth: string;
  readonly previousYear: string;
  readonly nextYear: string;
  readonly chooseYear: string;
  readonly previousYears: string;
  readonly nextYears: string;
  readonly yearInput: string;
  readonly weekNumber: string;
  readonly weekNumberHeader: string;
  readonly calendar: string;
  readonly today: string;
  readonly now: string;
  readonly hour: string;
  readonly minute: string;
  readonly second: string;
  readonly period: string;
  readonly invalidTime: string;
  readonly apply: string;
  readonly cancel: string;
}

export interface NeuralTableMessages {
  readonly loading: string;
  readonly empty: string;
  readonly error: string;
  readonly selectAll: string;
  readonly selectAllPage: string;
  readonly selectAllFiltered: string;
  readonly selectAllRows: string;
  readonly rowExpansion: string;
  readonly selectRow: string;
  readonly expandRow: string;
  readonly collapseRow: string;
  readonly expandGroup: string;
  readonly collapseGroup: string;
  readonly sortAscending: string;
  readonly sortDescending: string;
  readonly clearSort: string;
  readonly filter: string;
  readonly filterFrom: string;
  readonly filterTo: string;
  readonly filterAll: string;
  readonly filterTrue: string;
  readonly filterFalse: string;
  readonly resizeColumn: string;
  readonly reorderColumn: string;
  readonly columnMoved: string;
  readonly editValidationFailed: string;
}

export interface NeuralLocaleMessages {
  readonly common: NeuralCommonMessages;
  readonly autoComplete: NeuralAutoCompleteMessages;
  readonly multiSelect: NeuralMultiSelectMessages;
  readonly confirmDialog: NeuralConfirmDialogMessages;
  readonly tree: NeuralTreeMessages;
  readonly paginator: NeuralPaginatorMessages;
  readonly inputNumber: NeuralInputNumberMessages;
  readonly password: NeuralPasswordMessages;
  readonly fileUpload: NeuralFileUploadMessages;
  readonly editor: NeuralEditorMessages;
  readonly inputOtp: NeuralInputOtpMessages;
  readonly inputMask: NeuralInputMaskMessages;
  readonly datePicker: NeuralDatePickerMessages;
  readonly table: NeuralTableMessages;
}

export interface NeuralLocale {
  readonly code: string;
  readonly direction: NeuralTextDirection;
  readonly firstDayOfWeek?: NeuralFirstDayOfWeek;
  readonly messages?: {
    readonly common?: Partial<NeuralCommonMessages>;
    readonly autoComplete?: Partial<NeuralAutoCompleteMessages>;
    readonly multiSelect?: Partial<NeuralMultiSelectMessages>;
    readonly confirmDialog?: Partial<NeuralConfirmDialogMessages>;
    readonly tree?: Partial<NeuralTreeMessages>;
    readonly paginator?: Partial<NeuralPaginatorMessages>;
    readonly inputNumber?: Partial<NeuralInputNumberMessages>;
    readonly password?: Partial<NeuralPasswordMessages>;
    readonly fileUpload?: Partial<NeuralFileUploadMessages>;
    readonly editor?: Partial<NeuralEditorMessages>;
    readonly inputOtp?: Partial<NeuralInputOtpMessages>;
    readonly inputMask?: Partial<NeuralInputMaskMessages>;
    readonly datePicker?: Partial<NeuralDatePickerMessages>;
    readonly table?: Partial<NeuralTableMessages>;
  };
}

export interface NeuralResolvedLocale {
  readonly code: string;
  readonly direction: NeuralTextDirection;
  readonly firstDayOfWeek: NeuralFirstDayOfWeek;
  readonly messages: NeuralLocaleMessages;
}

export type NeuralMessageParameters = Readonly<Record<string, string | number>>;

export const NEURAL_EN_LOCALE: NeuralLocale = Object.freeze({
  code: 'en-US',
  direction: 'ltr',
  firstDayOfWeek: 0,
  messages: {
    common: {
      clear: 'Clear',
      close: 'Close',
      loading: 'Loading',
      enterFullscreen: 'Enter full screen',
      exitFullscreen: 'Exit full screen',
    },
    autoComplete: {
      placeholder: 'Search',
      empty: 'No results found',
      loading: 'Loading suggestions',
      clear: 'Clear value',
      dropdown: 'Show suggestions',
    },
    multiSelect: {
      placeholder: 'Select options',
      filterPlaceholder: 'Search options',
      empty: 'No options found',
      loading: 'Loading options',
      selectedItems: '{count} items selected',
      selectAll: 'Select all',
      clear: 'Clear selection',
      dropdown: 'Show options',
      remove: 'Remove {label}',
    },
    confirmDialog: {
      header: 'Confirmation',
      accept: 'Confirm',
      reject: 'Cancel',
    },
    tree: {
      navigation: 'Tree',
      expand: 'Expand {label}',
      collapse: 'Collapse {label}',
      empty: 'No nodes found',
      loading: 'Loading tree',
      loadError: 'Could not load children.',
      retry: 'Retry',
    },
    paginator: {
      navigation: 'Pagination',
      firstPage: 'First page',
      previousPage: 'Previous page',
      nextPage: 'Next page',
      lastPage: 'Last page',
      page: 'Page {page}',
      pageSize: 'Items per page',
      report: 'Showing {start} to {end} of {total} items',
    },
    inputNumber: {
      increment: 'Increase value',
      decrement: 'Decrease value',
      invalidValue: 'Enter a valid number',
    },
    password: {
      show: 'Show password',
      hide: 'Hide password',
      empty: 'Enter a password',
      weak: 'Weak password',
      medium: 'Medium password',
      strong: 'Strong password',
      capsLock: 'Caps Lock is on',
    },
    fileUpload: {
      chooseFile: 'Choose file',
      chooseFiles: 'Choose files',
      dropFile: 'Drop a file here',
      dropFiles: 'Drop files here',
      selectedFile: '{count} file selected',
      selectedFiles: '{count} files selected',
      remove: 'Remove',
      removeFile: 'Remove {fileName}',
      removedFile: '{fileName} was removed.',
      clearFiles: 'Clear files',
      cleared: 'Selected files were cleared.',
      empty: 'No files selected',
      invalidFileType: '{fileName} has an unsupported file type.',
      invalidFileSize: '{fileName} exceeds the maximum size of {maxSize}.',
      maximumFilesExceeded:
        'Only {count} files can be selected. {fileName} was not added.',
      duplicateFile: '{fileName} is already selected.',
    },
    editor: {
      toolbar: 'Formatting toolbar',
      content: 'Rich text editor',
      placeholder: 'Write something…',
      undo: 'Undo',
      redo: 'Redo',
      paragraph: 'Paragraph',
      heading1: 'Heading 1',
      heading2: 'Heading 2',
      heading3: 'Heading 3',
      bold: 'Bold',
      italic: 'Italic',
      underline: 'Underline',
      strike: 'Strikethrough',
      code: 'Inline code',
      bulletList: 'Bullet list',
      orderedList: 'Numbered list',
      taskList: 'Task list',
      taskChecked: 'Mark task as incomplete',
      taskUnchecked: 'Mark task as complete',
      blockquote: 'Blockquote',
      codeBlock: 'Code block',
      alignLeft: 'Align left',
      alignCenter: 'Align center',
      alignRight: 'Align right',
      alignJustify: 'Justify',
      textColor: 'Text color',
      highlight: 'Highlight color',
      removeTextColor: 'Remove text color',
      removeHighlight: 'Remove highlight',
      table: 'Table',
      insertTable: 'Insert table',
      deleteTable: 'Delete table',
      addRowBefore: 'Add row before',
      addRowAfter: 'Add row after',
      deleteRow: 'Delete row',
      addColumnBefore: 'Add column before',
      addColumnAfter: 'Add column after',
      deleteColumn: 'Delete column',
      mergeCells: 'Merge cells',
      splitCell: 'Split cell',
      toggleHeaderRow: 'Toggle header row',
      link: 'Link',
      linkUrl: 'Link URL',
      linkPlaceholder: 'https://example.com',
      applyLink: 'Apply link',
      removeLink: 'Remove link',
      bubbleMenu: 'Selection formatting',
      floatingMenu: 'Insert block',
      linkPopover: 'Edit link',
      closeLinkPopover: 'Close',
      slashMenu: 'Insert block',
      mentionMenu: 'Mention a person',
      commandPalette: 'Command palette',
      commandPalettePlaceholder: 'Search commands',
      suggestionLoading: 'Loading suggestions',
      slashEmpty: 'No matching commands',
      mentionEmpty: 'No matching mentions',
      commandPaletteEmpty: 'No matching commands',
      aiAsk: 'Ask AI',
      aiRewrite: 'Rewrite selection with AI',
      aiReview: 'Review AI proposal',
      aiProposal: 'AI proposal',
      aiPrevious: 'Previous',
      aiNext: 'Next',
      aiAccept: 'Accept',
      aiReject: 'Reject',
      aiChangeProgress: 'Change {current} of {total}',
      insertImage: 'Insert image',
      removeImage: 'Remove image',
      horizontalRule: 'Horizontal rule',
      clearFormatting: 'Clear formatting',
      characterCount: '{count} characters',
      wordCount: '{count} words',
      collaborationPanel: 'Collaboration and review',
      collaborationDisabled: 'Collaboration disabled',
      collaborationConnecting: 'Connecting…',
      collaborationConnected: 'Connected',
      collaborationSynced: 'Synced',
      collaborationDisconnected: 'Disconnected',
      collaborationError: 'Collaboration error',
      presence: 'People in this document',
      you: 'you',
      comments: 'Comments',
      commentPlaceholder: 'Comment on the current selection',
      addComment: 'Add comment',
      noComments: 'No comments yet.',
      openComment: 'Open comment',
      resolvedComment: 'Resolved comment',
      resolveComment: 'Resolve',
      reopenComment: 'Reopen',
      deleteComment: 'Delete comment',
      trackedChanges: 'Tracked changes',
      noTrackedChanges: 'No pending changes.',
      insertion: 'Insertion',
      deletion: 'Deletion',
      acceptChange: 'Accept change',
      rejectChange: 'Reject change',
      acceptAllChanges: 'Accept all',
      rejectAllChanges: 'Reject all',
      versionHistory: 'Version snapshots',
      snapshotLabelPlaceholder: 'Snapshot label',
      createSnapshot: 'Create snapshot',
      noSnapshots: 'No snapshots yet.',
      untitledSnapshot: 'Untitled snapshot',
      restoreSnapshot: 'Restore',
      deleteSnapshot: 'Delete snapshot',
    },
    inputOtp: {
      groupLabel: 'One-time verification code',
      characterLabel: 'Character {current} of {total}',
    },
    inputMask: {
      inputLabel: 'Formatted input',
      incomplete: 'Complete the required format',
    },
    datePicker: {
      chooseDate: 'Choose date',
      chooseTime: 'Choose time',
      changeDate: 'Change date, {value}',
      changeTime: 'Change time, {value}',
      changeDateTime: 'Change date and time, {value}',
      previousMonth: 'Previous month',
      nextMonth: 'Next month',
      chooseMonth: 'Choose month',
      previousYear: 'Previous year',
      nextYear: 'Next year',
      chooseYear: 'Choose year',
      previousYears: 'Previous years',
      nextYears: 'Next years',
      yearInput: 'Go to year',
      weekNumber: 'Week {week}',
      weekNumberHeader: 'Wk',
      calendar: 'Calendar',
      today: 'Today',
      now: 'Now',
      hour: 'Hour',
      minute: 'Minute',
      second: 'Second',
      period: 'AM or PM',
      invalidTime: 'Enter a valid time',
      apply: 'Apply',
      cancel: 'Cancel',
    },
    table: {
      loading: 'Loading data',
      empty: 'No data found',
      error: 'Data could not be loaded',
      selectAll: 'Select all visible rows',
      selectAllPage: 'Select all rows on this page',
      selectAllFiltered: 'Select all filtered rows',
      selectAllRows: 'Select all rows',
      rowExpansion: 'Row expansion',
      selectRow: 'Select row {row}',
      expandRow: 'Expand row {row}',
      collapseRow: 'Collapse row {row}',
      expandGroup: 'Expand group {group}',
      collapseGroup: 'Collapse group {group}',
      sortAscending: 'Sort {column} ascending',
      sortDescending: 'Sort {column} descending',
      clearSort: 'Clear sorting for {column}',
      filter: 'Filter {column}',
      filterFrom: 'Filter {column} from',
      filterTo: 'Filter {column} to',
      filterAll: 'All',
      filterTrue: 'Yes',
      filterFalse: 'No',
      resizeColumn: 'Resize {column}',
      reorderColumn: 'Reorder {column}',
      columnMoved: '{column} moved to position {position}',
      editValidationFailed: 'Validation failed.',
    },
  },
});

export const NEURAL_LOCALE = new InjectionToken<NeuralLocale>('NEURAL_LOCALE', {
  factory: () => NEURAL_EN_LOCALE,
});

@Injectable({ providedIn: 'root' })
export class NeuralLocaleService {
  private readonly activeLocale = signal(
    resolveNeuralLocale(inject(NEURAL_LOCALE)),
  );

  readonly locale = this.activeLocale.asReadonly();
  readonly code = computed(() => this.activeLocale().code);
  readonly direction = computed(() => this.activeLocale().direction);
  readonly messages = computed(() => this.activeLocale().messages);

  use(locale: NeuralLocale): void {
    this.activeLocale.set(resolveNeuralLocale(locale));
  }

  format(template: string, parameters: NeuralMessageParameters = {}): string {
    return formatNeuralMessage(template, parameters);
  }
}

export function provideNeuralLocale(
  locale: NeuralLocale,
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: NEURAL_LOCALE, useValue: locale },
  ]);
}

export function resolveNeuralLocale(
  locale: NeuralLocale,
): NeuralResolvedLocale {
  const fallback = NEURAL_EN_LOCALE.messages as NeuralLocaleMessages;
  return Object.freeze({
    code: normalizeLocaleCode(locale.code),
    direction: locale.direction,
    firstDayOfWeek: normalizeFirstDayOfWeek(locale.firstDayOfWeek),
    messages: Object.freeze({
      common: Object.freeze({
        ...fallback.common,
        ...locale.messages?.common,
      }),
      autoComplete: Object.freeze({
        ...fallback.autoComplete,
        ...locale.messages?.autoComplete,
      }),
      multiSelect: Object.freeze({
        ...fallback.multiSelect,
        ...locale.messages?.multiSelect,
      }),
      confirmDialog: Object.freeze({
        ...fallback.confirmDialog,
        ...locale.messages?.confirmDialog,
      }),
      tree: Object.freeze({
        ...fallback.tree,
        ...locale.messages?.tree,
      }),
      paginator: Object.freeze({
        ...fallback.paginator,
        ...locale.messages?.paginator,
      }),
      inputNumber: Object.freeze({
        ...fallback.inputNumber,
        ...locale.messages?.inputNumber,
      }),
      password: Object.freeze({
        ...fallback.password,
        ...locale.messages?.password,
      }),
      fileUpload: Object.freeze({
        ...fallback.fileUpload,
        ...locale.messages?.fileUpload,
      }),
      editor: Object.freeze({
        ...fallback.editor,
        ...locale.messages?.editor,
      }),
      inputOtp: Object.freeze({
        ...fallback.inputOtp,
        ...locale.messages?.inputOtp,
      }),
      inputMask: Object.freeze({
        ...fallback.inputMask,
        ...locale.messages?.inputMask,
      }),
      datePicker: Object.freeze({
        ...fallback.datePicker,
        ...locale.messages?.datePicker,
      }),
      table: Object.freeze({
        ...fallback.table,
        ...locale.messages?.table,
      }),
    }),
  });
}

function normalizeFirstDayOfWeek(
  value: NeuralFirstDayOfWeek | undefined,
): NeuralFirstDayOfWeek {
  return value === undefined ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > 6
    ? 0
    : value;
}

export function formatNeuralMessage(
  template: string,
  parameters: NeuralMessageParameters = {},
): string {
  return template.replace(/\{([a-zA-Z][\w]*)\}/g, (placeholder, key) =>
    Object.prototype.hasOwnProperty.call(parameters, key)
      ? String(parameters[key])
      : placeholder,
  );
}

function normalizeLocaleCode(code: string): string {
  const normalized = code.trim();
  if (!normalized) return 'en-US';
  try {
    return Intl.getCanonicalLocales(normalized)[0] ?? 'en-US';
  } catch {
    return 'en-US';
  }
}
