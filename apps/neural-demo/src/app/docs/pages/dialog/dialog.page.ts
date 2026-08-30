import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  signal,
} from '@angular/core';
import { NeuralButton } from '@neural-ng/core/button';
import {
  NeuralDialog,
  NeuralDialogBody,
  NeuralDialogFooter,
  NeuralDialogHeader,
  NeuralDialogInitialFocus,
  type NeuralDialogClasses,
} from '@neural-ng/core/dialog';
import { NeuralInput } from '@neural-ng/core/input';
import { CodeExample } from '../../../shared/code-example/code-example';

@Component({
  selector: 'app-dialog-page',
  imports: [
    NeuralButton,
    CodeExample,
    NeuralDialog,
    NeuralDialogBody,
    NeuralDialogFooter,
    NeuralDialogHeader,
    NeuralDialogInitialFocus,
    NeuralInput,
  ],
  templateUrl: './dialog.page.html',
  styleUrls: ['./dialog.page.scss', '../shared-doc-page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogPage {
  readonly lastCloseReason = signal('none');
  readonly controlledOpen = signal(false);
  readonly headlessClasses: NeuralDialogClasses = {
    root: 'docs-headless-dialog',
    header: 'docs-headless-dialog__header',
    body: 'docs-headless-dialog__body',
    footer: 'docs-headless-dialog__footer',
    closeButton: 'docs-headless-dialog__close',
  };
  readonly importCode = `import {
  NeuralDialog,
  NeuralDialogHeader,
  NeuralDialogBody,
  NeuralDialogFooter,
  NeuralDialogInitialFocus,
} from '@neural-ng/core/dialog';`;
  readonly basicCode = `<neural-button (clicked)="dialog.show()">Open dialog</neural-button>

<neural-dialog
  #dialog
  ariaLabelledby="profile-dialog-title"
  ariaDescribedby="profile-dialog-description"
  (closed)="lastReason.set($event.reason)"
>
  <neural-dialog-header>
    <h2 id="profile-dialog-title">Edit profile</h2>
  </neural-dialog-header>
  <neural-dialog-body>
    <p id="profile-dialog-description">Update your display name.</p>
    <input neuralInput neuralDialogInitialFocus aria-label="Display name" />
  </neural-dialog-body>
  <neural-dialog-footer>
    <neural-button (clicked)="dialog.close()">Cancel</neural-button>
    <neural-button (clicked)="dialog.close('api', 'saved')">Save</neural-button>
  </neural-dialog-footer>
</neural-dialog>`;
}
