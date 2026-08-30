import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { NeuralButton } from '@neural-ng/core/button';
import { NeuralColorModeService } from '@neural-ng/core/color-mode';
import { NeuralInput } from '@neural-ng/core/input';
import {
  NeuralToolbar,
  NeuralToolbarCenter,
  NeuralToolbarEnd,
  NeuralToolbarSeparator,
  NeuralToolbarStart,
  type NeuralToolbarClasses,
} from '@neural-ng/core/toolbar';
import { CodeView } from '../../../shared/code-view';

@Component({
  selector: 'app-toolbar-page',
  imports: [
    NeuralButton,
    CodeView,
    NeuralInput,
    NeuralToolbar,
    NeuralToolbarCenter,
    NeuralToolbarEnd,
    NeuralToolbarSeparator,
    NeuralToolbarStart,
  ],
  templateUrl: './toolbar.page.html',
  styleUrls: ['../shared-doc-page.scss', './toolbar.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ToolbarPage {
  readonly resolvedMode = inject(NeuralColorModeService).resolvedMode;
  readonly lastAction = signal('Ready');
  readonly focusedAction = signal('none');
  readonly headlessClasses: NeuralToolbarClasses = {
    root: 'docs-headless-toolbar',
    start: 'docs-headless-toolbar__section',
    center: 'docs-headless-toolbar__section docs-headless-toolbar__center',
    end: 'docs-headless-toolbar__section',
    separator: 'docs-headless-toolbar__separator',
  };

  readonly importCode = `import {
  NeuralToolbar,
  NeuralToolbarStart,
  NeuralToolbarCenter,
  NeuralToolbarEnd,
  NeuralToolbarSeparator,
} from '@neural-ng/core/toolbar';`;
  readonly basicCode = `<neural-toolbar ariaLabel="Document actions">
  <neural-toolbar-start>...</neural-toolbar-start>
  <neural-toolbar-separator />
  <neural-toolbar-center>...</neural-toolbar-center>
  <neural-toolbar-end>...</neural-toolbar-end>
</neural-toolbar>`;
  readonly keyboardCode = `<neural-toolbar
  orientation="vertical"
  ariaLabel="Formatting actions"
  (focusChanged)="focused.set($event.element.textContent)"
>
  ...
</neural-toolbar>`;
  readonly headlessCode = `<neural-toolbar unstyled [classes]="classes">
  <neural-toolbar-start>...</neural-toolbar-start>
  <neural-toolbar-end>...</neural-toolbar-end>
</neural-toolbar>`;

  run(action: string): void {
    this.lastAction.set(action);
  }
}
