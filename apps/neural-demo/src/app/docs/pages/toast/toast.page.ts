import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NeuralButton } from '@neural-ng/core/button';
import { NeuralColorModeService } from '@neural-ng/core/color-mode';
import {
  NeuralMessageService,
  type NeuralMessageRef,
  type NeuralMessageSeverity,
} from '@neural-ng/core/message';
import {
  ToastComponent,
  type NeuralToastPosition,
} from '@neural-ng/core/toast';
import { CodeView } from '../../../shared/code-view';

@Component({
  selector: 'app-toast-page',
  imports: [NeuralButton, CodeView, RouterLink, ToastComponent],
  templateUrl: './toast.page.html',
  styleUrls: ['./toast.page.scss', '../shared-doc-page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastPage {
  private readonly messages = inject(NeuralMessageService);
  private controlledRef: NeuralMessageRef | undefined;

  readonly resolvedMode = inject(NeuralColorModeService).resolvedMode;
  readonly position = signal<NeuralToastPosition>('top-end');
  readonly eventStatus = signal('No controlled notification yet.');
  readonly positions: readonly NeuralToastPosition[] = [
    'top-start',
    'top-center',
    'top-end',
    'middle-start',
    'middle-center',
    'middle-end',
    'bottom-start',
    'bottom-center',
    'bottom-end',
  ];

  readonly importCode = `import { ToastComponent, provideNeuralToast } from '@neural-ng/core/toast';
import { NeuralMessageService, provideNeuralMessages } from '@neural-ng/core/message';`;

  readonly setupCode = `import { ApplicationConfig } from '@angular/core';
import { provideNeuralNg } from '@neural-ng/core';
import { provideNeuralMessages } from '@neural-ng/core/message';
import { provideNeuralToast } from '@neural-ng/core/toast';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNeuralNg(),
    provideNeuralMessages({ maxVisible: 3 }),
    provideNeuralToast({
      position: 'top-end',
      showProgress: true,
    }),
  ],
};`;

  readonly basicCode = `import { Component, inject } from '@angular/core';
import { NeuralButton } from '@neural-ng/core/button';
import { NeuralMessageService } from '@neural-ng/core/message';
import { ToastComponent } from '@neural-ng/core/toast';

@Component({
  selector: 'app-save-action',
  imports: [NeuralButton, ToastComponent],
  template: \`
    <neural-toast />
    <neural-button (clicked)="save()">Save changes</neural-button>
  \`,
})
export class SaveActionComponent {
  private readonly messages = inject(NeuralMessageService);

  save(): void {
    this.messages.notify({
      severity: 'success',
      title: 'Saved',
      message: 'Changes were persisted.',
      duration: 5000,
    });
  }
}`;

  readonly lifetimeCode = `<neural-toast channel="progress-demo" showProgress />

this.messages.notify({
  channel: 'progress-demo',
  severity: 'info',
  title: 'Uploading',
  message: 'The timer and progress bar share one lifetime.',
  duration: 8000,
});

this.messages.notify({
  channel: 'progress-demo',
  severity: 'warning',
  title: 'Review required',
  message: 'Persistent messages use duration: null.',
  duration: null,
});`;

  readonly channelsCode = `<neural-toast channel="billing" position="top-end" />
<neural-toast channel="uploads" position="bottom-start" />

this.messages.notify({
  channel: 'billing',
  message: 'Invoice ready.',
});`;

  readonly configurationCode = `provideNeuralMessages({
  defaultChannel: 'global',
  defaultDuration: 5000,
  importantDuration: null,
  maxVisible: 3,
}),
provideNeuralToast({
  channel: 'global',
  position: 'top-end',
  showProgress: true,
  pauseOnInteraction: true,
  swipeToDismiss: true,
  swipeThreshold: 72,
  animated: true,
}),`;

  readonly headlessCode = `<neural-toast
  channel="product-events"
  position="bottom-start"
  toastClass="product-toast-stack"
  messageClass="product-toast"
  unstyled
/>

/* unstyled preserves timers, channels, accessibility and dismissal. */`;

  changePosition(event: Event): void {
    this.position.set(
      (event.target as HTMLSelectElement).value as NeuralToastPosition,
    );
  }

  showBasic(): void {
    this.messages.notify({
      severity: 'success',
      title: 'Saved',
      message: 'Changes were persisted.',
      channel: 'toast-docs',
      duration: 5000,
    });
  }

  showSeverity(severity: NeuralMessageSeverity): void {
    this.messages.notify({
      severity,
      title: severity[0].toUpperCase() + severity.slice(1),
      message: `A ${severity} notification from the shared Message API.`,
      channel: 'toast-docs',
      duration: severity === 'warning' || severity === 'error' ? null : 5000,
    });
  }

  showProgress(): void {
    this.messages.notify({
      severity: 'info',
      title: 'Uploading',
      message: 'Hover or focus pauses the timer and progress bar.',
      channel: 'toast-progress',
      duration: 8000,
    });
  }

  showPersistent(): void {
    this.messages.notify({
      severity: 'warning',
      title: 'Review required',
      message: 'This notification remains until it is dismissed.',
      channel: 'toast-progress',
      duration: null,
    });
  }

  showWithoutIcon(): void {
    this.messages.notify({
      severity: 'info',
      title: 'No decorative icon',
      message: 'The message contract is unchanged when icon=false.',
      channel: 'toast-no-icon',
      duration: 5000,
    });
  }

  showHeadless(): void {
    this.messages.notify({
      severity: 'success',
      title: 'Consumer-owned renderer',
      message: 'Only documentation classes own this visual surface.',
      channel: 'toast-headless',
      duration: 5000,
    });
  }

  showControlled(): void {
    this.controlledRef?.dismiss();
    this.controlledRef = this.messages.notify({
      severity: 'neutral',
      title: 'Controlled lifetime',
      message: 'Dismiss this message through its returned reference.',
      channel: 'toast-progress',
      duration: null,
    });
    this.eventStatus.set(`Created ${this.controlledRef.id}.`);
  }

  dismissControlled(): void {
    if (!this.controlledRef) {
      this.eventStatus.set('Create the controlled notification first.');
      return;
    }

    this.controlledRef.dismiss();
    this.eventStatus.set(
      `${this.controlledRef.id} closed with ${String(this.controlledRef.closeReason())}.`,
    );
    this.controlledRef = undefined;
  }

  clearDocsChannel(): void {
    this.messages.clear('toast-docs');
  }
}
