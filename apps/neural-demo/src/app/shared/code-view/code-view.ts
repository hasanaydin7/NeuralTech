import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  afterRenderEffect,
  booleanAttribute,
  computed,
  inject,
  input,
  numberAttribute,
  signal,
  viewChild,
} from '@angular/core';

import * as Prism from 'prismjs';

import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-typescript';
import 'prismjs/plugins/line-numbers/prism-line-numbers';
import 'prismjs/plugins/line-highlight/prism-line-highlight';
import { NeuralTooltip } from '@neural-ng/core/tooltip';

export type CodeExampleTheme = 'dark' | 'light';

export type CodeExampleLanguage =
  | 'angular'
  | 'bash'
  | 'css'
  | 'html'
  | 'java'
  | 'javascript'
  | 'json'
  | 'markup'
  | 'scss'
  | 'shell'
  | 'sql'
  | 'ts'
  | 'typescript';

type CopyState = 'idle' | 'copied' | 'error';

const LANGUAGE_ALIASES: Record<CodeExampleLanguage, string> = {
  angular: 'typescript',
  bash: 'bash',
  css: 'css',
  html: 'markup',
  java: 'java',
  javascript: 'javascript',
  json: 'json',
  markup: 'markup',
  scss: 'scss',
  shell: 'bash',
  sql: 'sql',
  ts: 'typescript',
  typescript: 'typescript',
};

const LANGUAGE_LABELS: Record<CodeExampleLanguage, string> = {
  angular: 'Angular',
  bash: 'Bash',
  css: 'CSS',
  html: 'HTML',
  java: 'Java',
  javascript: 'JavaScript',
  json: 'JSON',
  markup: 'HTML',
  scss: 'SCSS',
  shell: 'Shell',
  sql: 'SQL',
  ts: 'TypeScript',
  typescript: 'TypeScript',
};

@Component({
  // The public docs primitive intentionally uses this concise selector.
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'code-view',
  templateUrl: './code-view.html',
  styleUrl: './code-view.scss',
  imports: [NeuralTooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'code-example-host',
  },
})
export class CodeView {
  readonly label = input('Code example');
  readonly copied = signal(false);

  // Gösterilecek kaynak kod.
  readonly code = input.required<string>();
  readonly preview = input(false, { transform: booleanAttribute });

  /**
   * Syntax highlighting dili.
   */
  readonly language = input<CodeExampleLanguage>('typescript');

  /**
   * Üst çubukta gösterilecek dosya adı.
   */
  readonly fileName = input('');

  /**
   * Dosya adı verilmezse gösterilecek başlık.
   */
  readonly title = input('Code example');

  readonly theme = input<CodeExampleTheme>('dark');
  readonly showLineNumbers = input(true, { transform: booleanAttribute });
  readonly startLine = input(1, { transform: numberAttribute });
  readonly wrap = input(false, { transform: booleanAttribute });
  readonly dedent = input(true, { transform: booleanAttribute });
  readonly maxHeight = input('38rem');

  /**
   * Örnekler:
   * [highlightedLines]="[3, 4, 8]"
   * highlightedLines="3-5,8"
   */
  readonly highlightedLines = input<readonly number[] | string>([]);

  readonly copyLabel = input('Copy');
  readonly copiedLabel = input('Copied');
  readonly copyErrorLabel = input('Error');

  private readonly destroyRef = inject(DestroyRef);
  private readonly codeElement =
    viewChild<ElementRef<HTMLElement>>('codeElement');

  private copyResetTimer: ReturnType<typeof setTimeout> | undefined;

  readonly copyState = signal<CopyState>('idle');

  isCodeVisible = signal(false);

  toggleCode(): void {
    this.isCodeVisible.update((visible) => !visible);
  }

  readonly formattedCode = computed(() =>
    normalizeCode(this.code(), this.dedent()),
  );

  readonly prismLanguage = computed(
    () => LANGUAGE_ALIASES[this.language()] ?? 'typescript',
  );

  readonly languageClass = computed(() => `language-${this.prismLanguage()}`);

  readonly languageLabel = computed(
    () => LANGUAGE_LABELS[this.language()] ?? this.language(),
  );

  readonly displayTitle = computed(
    () => this.fileName().trim() || this.title().trim(),
  );

  readonly highlightedLineRange = computed(() => {
    const value = this.highlightedLines();

    if (typeof value !== 'string') {
      return [...new Set(value)]
        .filter((line) => Number.isInteger(line) && line > 0)
        .sort((a, b) => a - b)
        .join(',');
    }

    return value.trim();
  });

  readonly copyButtonText = computed(() => {
    switch (this.copyState()) {
      case 'copied':
        return this.copiedLabel();
      case 'error':
        return this.copyErrorLabel();
      default:
        return this.copyLabel();
    }
  });

  constructor() {
    /**
     * Angular template DOM'u güncelledikten sonra Prism'in aynı DOM üzerinde
     * syntax highlighting ve satır numarası üretmesini sağlarız.
     */
    afterRenderEffect({
      write: () => {
        // Effect'in yalnızca ilgili signal değerleri değiştiğinde tekrar çalışması için okunur.
        this.formattedCode();
        this.prismLanguage();
        this.showLineNumbers();
        this.startLine();
        this.wrap();
        this.highlightedLineRange();

        const codeElement = this.codeElement();
        if (codeElement) {
          Prism.highlightElement(codeElement.nativeElement);
        }
      },
    });

    this.destroyRef.onDestroy(() => {
      if (this.copyResetTimer) {
        clearTimeout(this.copyResetTimer);
      }
    });
  }

  async copyCode(): Promise<void> {
    try {
      await writeToClipboard(this.formattedCode());
      this.setTemporaryCopyState('copied');
    } catch {
      this.setTemporaryCopyState('error');
    }
  }

  private setTemporaryCopyState(state: Exclude<CopyState, 'idle'>): void {
    this.copyState.set(state);

    if (this.copyResetTimer) {
      clearTimeout(this.copyResetTimer);
    }

    this.copyResetTimer = setTimeout(() => {
      this.copyState.set('idle');
    }, 1800);
  }
}

function normalizeCode(source: string, shouldDedent: boolean): string {
  const normalized = source
    .replace(/\r\n?/g, '\n')
    .replace(/^\n/, '')
    .replace(/\n[ \t]*$/, '');

  if (!shouldDedent) {
    return normalized;
  }

  const lines = normalized.split('\n');
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0);

  if (nonEmptyLines.length === 0) {
    return '';
  }

  const minimumIndent = Math.min(
    ...nonEmptyLines.map((line) => line.match(/^[ \t]*/)?.[0].length ?? 0),
  );

  if (minimumIndent === 0) {
    return normalized;
  }

  return lines
    .map((line) => (line.trim() ? line.slice(minimumIndent) : ''))
    .join('\n');
}

async function writeToClipboard(value: string): Promise<void> {
  if (globalThis.navigator?.clipboard?.writeText) {
    await globalThis.navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.inset = '-9999px';

  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand('copy');
  textarea.remove();

  if (!copied) {
    throw new Error('Clipboard API is not available.');
  }
}
