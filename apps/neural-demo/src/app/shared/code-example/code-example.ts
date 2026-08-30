import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  inject,
  input,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-code-example',
  templateUrl: './code-example.html',
  styleUrl: './code-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeExample {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly code = input.required<string>();
  readonly label = input('Code example');
  readonly language = input('text');
  readonly copied = signal(false);

  async copy(): Promise<void> {
    if (!this.isBrowser || !navigator.clipboard) return;

    try {
      await navigator.clipboard.writeText(this.code());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1600);
    } catch {
      this.copied.set(false);
    }
  }
}
