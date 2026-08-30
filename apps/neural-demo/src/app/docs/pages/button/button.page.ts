import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { NeuralButton } from '@neural-ng/core/button';
import { CodeView } from '../../../shared/code-view';
import { NeuralColorModeService } from '@neural-ng/core/color-mode';

@Component({
  selector: 'app-button-page',
  imports: [NeuralButton, CodeView],
  templateUrl: './button.page.html',
  styleUrls: ['./button.page.scss', '../shared-doc-page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonPage {
  readonly resolvedMode = inject(NeuralColorModeService).resolvedMode;
  readonly eventStatus = signal('No interaction yet.');

  readonly basicCode = `
  import { Component } from '@angular/core';
  import { NeuralButton } from '@neural-ng/core/button';

  @Component({
    selector: 'neural-button-example',
    imports: [NeuralButton],
    template: \`
      <neural-button (clicked)="noteClick()">Save Changes</neural-button>
    \`
  })
  export class ButtonExampleComponent {}
    `;

  readonly severityCode = `
  <neural-button severity="primary">Primary</neural-button>
  <neural-button severity="secondary">Secondary</neural-button>
  <neural-button severity="neutral">Neutral</neural-button>
  <neural-button severity="info">Info</neural-button>
  <neural-button severity="success">Success</neural-button>
  <neural-button severity="warning">Warning</neural-button>
  <neural-button severity="error">Error</neural-button>
  `;
  readonly stateCode = `
  import { Component } from '@angular/core';
  import { NeuralButton } from '@neural-ng/core/button';

  @Component({
    selector: 'neural-button-example',
    imports: [NeuralButton],
    template: \`
      <neural-button [disabled]="true">Disabled</neural-button>
      <neural-button [loading]="true" loadingLabel="Saving">Save</neural-button>
    \`
  })
  export class ButtonExampleComponent {}
  `;

  readonly headlessCode = `
  import { Component } from '@angular/core';
  import { NeuralButton } from '@neural-ng/core/button';

  @Component({
    selector: 'neural-button-example',
    imports: [NeuralButton],
    template: \`
      <neural-button [unstyled]="true" buttonClass="docs-headless-button" (clicked)="noteClick()">
        Complete Setup
      </neural-button>
    \`,
    styles: \`
      .docs-headless-button {
        padding: 0.7rem 1rem;
        color: #f0fdf4;
        background: #14532d;
        border: 2px dashed #4ade80;
        border-radius: 0.35rem;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }

      .docs-headless-button:focus-visible {
        outline: 2px solid #86efac;
        outline-offset: 3px;
      }
	  \`
  })
  export class ButtonExampleComponent {}`;

  readonly importCode = `
    import { NeuralButton } from '@neural-ng/core/button';
  `;

  readonly badgeInline = `
  import { Component } from '@angular/core';
  import { NeuralButton } from '@neural-ng/core/button';

  @Component({
    selector: 'neural-button-example',
    imports: [NeuralButton],
    template: \`
      <neural-button [badge]="128" [badgeMax]="99" badgePosition="start" badgeSeverity="info">
        Inbox
	    </neural-button>
      <neural-button [badge]="12" badgePosition="end" badgeSeverity="error">
        Notifications
      </neural-button>
      <neural-button [badge]="0" badgePosition="end" badgeSeverity="success">
        Completed
      </neural-button>
    \`
  })
  export class ButtonExampleComponent {}
  `;

  readonly badgeOutline = `
  import { Component } from '@angular/core';
  import { NeuralButton } from '@neural-ng/core/button';

  @Component({
    selector: 'neural-button-example',
    imports: [NeuralButton],
    template: \`
      <neural-button [badge]="3" badgePosition="top-start" badgeSeverity="error" 
        buttonClass="button-badge-icon-demo">
        <i class="nt nt-bell" aria-hidden="true"></i>
      </neural-button>
      <neural-button [badge]="8" badgePosition="top-end" badgeSeverity="error"
        buttonClass="button-badge-icon-demo">
        <i class="nt nt-bell" aria-hidden="true"></i>
      </neural-button>
      <neural-button [badge]="2" badgePosition="bottom-start" badgeSeverity="info"
        buttonClass="button-badge-icon-demo">
        <i class="nt nt-bell" aria-hidden="true"></i>
      </neural-button>
      <neural-button [badge]="5" badgePosition="bottom-end" badgeSeverity="info"
        buttonClass="button-badge-icon-demo">
        <i class="nt nt-bell" aria-hidden="true"></i>
      </neural-button>
    \`,
    styles: \`
      .button-badge-icon-demo {
        width: 2.75rem;
        height: 2.75rem;
        padding: 0;
        font-size: 1.125rem;
      }
	  \`
  })
  export class ButtonExampleComponent {}`;

  noteClick(): void {
    this.eventStatus.set('clicked emitted a native MouseEvent.');
  }
}
