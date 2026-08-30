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
  NeuralDrawer,
  NeuralDrawerBody,
  NeuralDrawerFooter,
  NeuralDrawerHeader,
  NeuralDrawerInitialFocus,
  type NeuralDrawerClasses,
  type NeuralDrawerPosition,
} from '@neural-ng/core/drawer';
import { NeuralInput } from '@neural-ng/core/input';
import { CodeView } from '../../../shared/code-view';

@Component({
  selector: 'app-drawer-page',
  imports: [
    NeuralButton,
    CodeView,
    NeuralDrawer,
    NeuralDrawerBody,
    NeuralDrawerFooter,
    NeuralDrawerHeader,
    NeuralDrawerInitialFocus,
    NeuralInput,
  ],
  templateUrl: './drawer.page.html',
  styleUrls: ['../shared-doc-page.scss', './drawer.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class DrawerPage {
  readonly resolvedMode = inject(NeuralColorModeService).resolvedMode;
  readonly position = signal<NeuralDrawerPosition>('end');
  readonly lastClose = signal('none');
  readonly headlessClasses: NeuralDrawerClasses = {
    root: 'docs-headless-drawer',
    header: 'docs-headless-drawer__header',
    body: 'docs-headless-drawer__body',
    footer: 'docs-headless-drawer__footer',
    closeButton: 'docs-headless-drawer__close',
    closeIcon: 'docs-headless-drawer__close-icon',
  };

  readonly importCode = `import {
  NeuralDrawer,
  NeuralDrawerHeader,
  NeuralDrawerBody,
  NeuralDrawerFooter,
} from '@neural-ng/core/drawer';`;
  readonly basicCode = `<neural-button (clicked)="drawer.show()">Open settings</neural-button>

<neural-drawer #drawer position="end" ariaLabelledby="settings-title">
  <neural-drawer-header>
    <h2 id="settings-title">Workspace settings</h2>
  </neural-drawer-header>
  <neural-drawer-body>...</neural-drawer-body>
  <neural-drawer-footer>...</neural-drawer-footer>
</neural-drawer>`;
  readonly positionsCode = `<neural-drawer [position]="position" />

<!-- position: 'start' | 'end' | 'top' | 'bottom' -->`;
  readonly headlessCode = `<neural-drawer
  unstyled
  [classes]="classes"
  ariaLabelledby="headless-title"
/>`;
}
