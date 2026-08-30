import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { NeuralColorModeService } from '@neural-ng/core/color-mode';
import {
  PopoverCloseDirective,
  PopoverComponent,
  PopoverInitialFocusDirective,
  PopoverTriggerDirective,
  type NeuralPopoverCloseEvent,
  type NeuralPopoverOpenEvent,
  type NeuralPopoverPosition,
} from '@neural-ng/core/popover';
import { CodeView } from '../../../shared/code-view';

@Component({
  selector: 'app-popover-page',
  imports: [
    CodeView,
    PopoverCloseDirective,
    PopoverComponent,
    PopoverInitialFocusDirective,
    PopoverTriggerDirective,
  ],
  templateUrl: './popover.page.html',
  styleUrls: ['../shared-doc-page.scss', './popover.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PopoverPage {
  readonly resolvedMode = inject(NeuralColorModeService).resolvedMode;
  readonly controlledOpen = signal(false);
  readonly lastEvent = signal('No interaction yet.');
  readonly activePosition = signal<NeuralPopoverPosition>('bottom-start');
  readonly positions: readonly NeuralPopoverPosition[] = [
    'top',
    'top-start',
    'top-end',
    'bottom',
    'bottom-start',
    'bottom-end',
    'left',
    'right',
  ];

  readonly basicCode = `<button
  type="button"
  [neuralPopoverTriggerFor]="account"
  popoverPosition="bottom-end"
>
  Account
</button>

<neural-popover #account ariaLabel="Account panel">
  <h3>Neural Admin</h3>
  <button type="button" neuralPopoverClose>Close</button>
</neural-popover>`;

  readonly focusCode = `<button
  type="button"
  [neuralPopoverTriggerFor]="formPanel"
  [popoverFocusOnOpen]="'first'"
>
  Edit profile
</button>

<neural-popover #formPanel role="dialog" ariaLabel="Edit profile">
  <input neuralInput neuralPopoverInitialFocus />
</neural-popover>`;

  readonly headlessCode = `<neural-popover
  #headlessPanel
  unstyled
  popoverClass="my-panel"
  [classes]="{
    content: 'my-content',
    arrow: 'my-arrow'
  }"
>
  Consumer-owned visual layer
</neural-popover>`;

  handleOpened(event: NeuralPopoverOpenEvent): void {
    this.activePosition.set(event.position);
    this.lastEvent.set(`Opened at ${event.position}.`);
  }

  handleClosed(event: NeuralPopoverCloseEvent): void {
    this.lastEvent.set(`Closed by ${event.reason}.`);
  }
}
