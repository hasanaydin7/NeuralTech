import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import {
  NeuralBadge,
  NeuralBadgeDirective,
  type NeuralBadgeClasses,
} from '@neural-ng/core/badge';
import { NeuralButton } from '@neural-ng/core/button';
import { NeuralColorModeService } from '@neural-ng/core/color-mode';
import { CodeView } from '../../../shared/code-view';

@Component({
  selector: 'app-badge-page',
  imports: [NeuralBadge, NeuralBadgeDirective, NeuralButton, CodeView],
  templateUrl: './badge.page.html',
  styleUrls: ['./badge.page.scss', '../shared-doc-page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgePage {
  readonly resolvedMode = inject(NeuralColorModeService).resolvedMode;

  readonly notifications = signal(98);

  readonly headlessClasses: NeuralBadgeClasses = {
    root: 'docs-headless-badge',
    value: 'docs-headless-badge__value',
    content: 'docs-headless-badge__content',
  };

  readonly importCode = `import { NeuralBadge } from '@neural-ng/core/badge';`;

  readonly countCode = `
    <neural-badge value="New" />
    <neural-badge [value]="8" severity="info" />
    <neural-badge [value]="128" [max]="99" severity="error" />
    <neural-badge [value]="0" severity="neutral" />
    <neural-badge [value]="-2" severity="warning" />`;

  readonly semanticCode = `
    <neural-badge value="Neutral" />
    <neural-badge value="Primary" severity="primary" />
    <neural-badge value="Secondary" severity="secondary" />
    <neural-badge value="Info" severity="info" />
    <neural-badge value="Success" severity="success" />
    <neural-badge value="Warning" severity="warning" />
    <neural-badge value="Error" severity="error" />`;

  readonly dotCode = `
    <neural-badge value="SM" size="small" />
    <neural-badge value="MD" />
    <neural-badge value="LG" size="large" />
    <neural-badge dot size="small" severity="success" ariaLabel="Service online" />
    <neural-badge dot severity="warning" ariaLabel="Action pending" />
    <neural-badge severity="success">
      <i class="nt nt-check" aria-hidden="true"></i>
      Verified
    </neural-badge>`;

  readonly liveCode = `
    import { Component } from '@angular/core';
    import { NeuralBadge } from '@neural-ng/core/badge';

    @Component({
      selector: 'neural-badge-example',
      imports: [NeuralBadge],
      template: \`
      <neural-button class="w-full" (clicked)="increment()">Add notification</neural-button>
        <neural-badge [value]="notifications()" [max]="99" severity="info" ariaLive="polite" />
      \`
    })
    export class BadgeExampleComponent {
      readonly notifications = signal(98);
      
      increment(): void {
        this.notifications.update((value) => value + 1);
      }
    }`;

  readonly directiveCode = `
    import { Component } from '@angular/core';
    import { NeuralBadge, NeuralBadgeDirective } from '@neural-ng/core/badge';

    @Component({
      selector: 'neural-badge-example',
      imports: [NeuralBadge, NeuralBadgeDirective],
      template: \`
        <button class="badge-anchor-demo__icon" type="button" aria-label="Notifications, 8 unread" [neuralBadge]="8"
          neuralBadgePosition="top-end" neuralBadgeSeverity="error">
          <i class="nt nt-bell" aria-hidden="true"></i>
        </button>

        <span class="badge-anchor-demo__avatar" aria-label="NeuralNg profile, online" neuralBadge="" neuralBadgeDot
          neuralBadgePosition="bottom-end" neuralBadgeSeverity="success" neuralBadgeAriaLabel="Online">
          NN
        </span>

        <span class="badge-anchor-demo__label" [neuralBadge]="3" neuralBadgePosition="end" neuralBadgeSeverity="info">
          Messages
        </span>
      \`,
      styles: \`
        .badge-anchor-demo__icon {
          font: inherit;
          font-size: 1.125rem;
          cursor: pointer;
        }

        .badge-anchor-demo__avatar {
          font-weight: 800;
        }

        .badge-anchor-demo__label {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          min-height: 2.75rem;
          padding-inline: 1rem;
          color: var(--neural-color-text-strong);
          background: var(--neural-color-surface);
          border: 1px solid var(--neural-color-border);
          border-radius: var(--neural-radius-md);
          font-weight: 700;
        }
      \`
    })
    export class BadgeExampleComponent {}`;

  readonly headlessCode = `
    import { Component } from '@angular/core';
    import { NeuralBadge, NeuralBadgeDirective, type NeuralBadgeClasses } from '@neural-ng/core/badge';

    @Component({
      selector: 'neural-badge-example',
      imports: [NeuralBadge, NeuralBadgeDirective],
      template: \`
      <neural-badge value="AI" unstyled badgeClass="docs-headless-badge--custom"
            [classes]="headlessClasses" />
      \`,
      styles: \`
      \`
    })
    export class BadgeExampleComponent {
      readonly headlessClasses: NeuralBadgeClasses = {
        root: 'docs-headless-badge',
        value: 'docs-headless-badge__value',
        content: 'docs-headless-badge__content',
      };
    }
  `;

  increment(): void {
    this.notifications.update((value) => value + 1);
  }
}
