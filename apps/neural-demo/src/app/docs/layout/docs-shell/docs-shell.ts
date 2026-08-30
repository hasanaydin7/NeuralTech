import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DOCS_NAVIGATION } from '../../navigation';

@Component({
  selector: 'app-docs-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './docs-shell.html',
  styleUrl: './docs-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsShell {
  readonly navigation = DOCS_NAVIGATION;
  readonly navigationOpen = signal(false);

  closeNavigation(): void {
    this.navigationOpen.set(false);
  }
}
