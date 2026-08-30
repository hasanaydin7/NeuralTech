import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NeuralButton } from '@neural-ng/core/button';
import {
  NeuralMessageService,
  type NeuralMessageRef,
} from '@neural-ng/core/message';
import { ToastComponent } from '@neural-ng/core/toast';
import { CodeExample } from '../../../shared/code-example/code-example';

@Component({
  selector: 'app-message-api-page',
  imports: [NeuralButton, CodeExample, ToastComponent],
  templateUrl: './message-api.page.html',
  styleUrls: ['./message-api.page.scss', '../shared-doc-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageApiPage {
  readonly messages = inject(NeuralMessageService);
  readonly channelMessages = computed(() =>
    this.messages
      .messages()
      .filter((message) => message.channel === 'message-api-docs'),
  );
  readonly lastRef = signal<NeuralMessageRef | null>(null);
  readonly lastRefStatus = computed(() => {
    const ref = this.lastRef();
    if (!ref) return 'No message reference yet';
    return ref.closed()
      ? `${ref.id} closed by ${ref.closeReason()}`
      : `${ref.id} is active`;
  });
  readonly importCode = `import {
  NeuralMessageService,
  provideNeuralMessages,
} from '@neural-ng/core/message';`;
  readonly notifyCode = `const ref = messages.notify({
  severity: 'success',
  title: 'Saved',
  message: 'Changes were persisted.',
  channel: 'account',
});

ref.closed();
ref.closeReason();
ref.dismiss();`;

  notify(duration: number | null): void {
    this.lastRef.set(
      this.messages.notify({
        severity: duration === null ? 'warning' : 'success',
        title: duration === null ? 'Persistent message' : 'Saved',
        message:
          duration === null
            ? 'This message remains until it is dismissed.'
            : 'This message closes automatically.',
        channel: 'message-api-docs',
        duration,
      }),
    );
  }

  dismissLast(): void {
    this.lastRef()?.dismiss();
  }

  clear(): void {
    this.messages.clear('message-api-docs');
  }
}
