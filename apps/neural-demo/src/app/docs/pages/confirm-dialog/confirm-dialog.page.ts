import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { NeuralButton } from '@neural-ng/core/button';
import { NeuralColorModeService } from '@neural-ng/core/color-mode';
import {
  NeuralConfirmDialog,
  NeuralConfirmationService,
  type NeuralConfirmDialogClasses,
} from '@neural-ng/core/confirm-dialog';
import { CodeView } from '../../../shared/code-view';

@Component({
  selector: 'app-confirm-dialog-page',
  imports: [NeuralButton, NeuralConfirmDialog, CodeView],
  templateUrl: './confirm-dialog.page.html',
  styleUrls: ['../shared-doc-page.scss', './confirm-dialog.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ConfirmDialogPage {
  private readonly confirmation = inject(NeuralConfirmationService);
  readonly resolvedMode = inject(NeuralColorModeService).resolvedMode;
  readonly lastResult = signal('none');
  readonly asyncStatus = signal('Ready');
  readonly headlessClasses: NeuralConfirmDialogClasses = {
    root: 'docs-headless-confirm',
    header: 'docs-headless-confirm__header',
    icon: 'docs-headless-confirm__icon',
    title: 'docs-headless-confirm__title',
    body: 'docs-headless-confirm__body',
    message: 'docs-headless-confirm__message',
    footer: 'docs-headless-confirm__footer',
    acceptButton: 'docs-headless-confirm__accept',
    rejectButton: 'docs-headless-confirm__reject',
  };

  readonly importCode = `import {
  NeuralConfirmDialog,
  NeuralConfirmationService,
} from '@neural-ng/core/confirm-dialog';`;
  readonly basicCode = `<neural-confirm-dialog />

confirmation.confirm({
  header: 'Delete project?',
  message: 'This action cannot be undone.',
  accept: () => removeProject(),
});`;
  readonly asyncCode = `confirmation.confirm({
  key: 'publish',
  message: 'Publish the current release?',
  accept: async () => {
    const valid = await validateRelease();
    return valid; // false keeps the dialog open
  },
});`;
  readonly headlessCode = `<neural-confirm-dialog
  key="headless"
  unstyled
  [classes]="classes"
/>`;

  confirmDelete(): void {
    this.confirmation.confirm({
      header: 'Delete Neural workspace?',
      message:
        'Members will immediately lose access. This action cannot be undone.',
      iconClass: 'nt-trash',
      acceptLabel: 'Delete workspace',
      onClose: ({ result, reason }) =>
        this.lastResult.set(`${result} · ${reason}`),
    });
  }

  confirmPublish(): void {
    this.asyncStatus.set('Waiting for confirmation');
    let attempt = 0;
    this.confirmation.confirm({
      key: 'publish',
      header: 'Publish release?',
      message:
        'The first validation attempt intentionally fails and keeps this dialog open.',
      iconClass: 'nt-sparkles',
      acceptLabel: 'Validate and publish',
      accept: async () => {
        this.asyncStatus.set('Validating…');
        await new Promise((resolve) => setTimeout(resolve, 450));
        attempt += 1;
        if (attempt === 1) {
          this.asyncStatus.set('Validation failed · try once more');
          return false;
        }
        this.asyncStatus.set('Release published');
        return true;
      },
      reject: () => this.asyncStatus.set('Publishing cancelled'),
    });
  }

  confirmHeadless(): void {
    this.confirmation.confirm({
      key: 'headless',
      header: 'Agent authorization',
      message: 'Allow the agent to apply the generated workspace changes?',
      iconClass: 'nt-sparkles',
      acceptLabel: 'Authorize',
    });
  }
}
