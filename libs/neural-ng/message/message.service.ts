import { Injectable, inject, signal } from '@angular/core';
import { NEURAL_MESSAGES_CONFIG, validateDuration } from './message.config';
import type {
  NeuralMessageRecord,
  NeuralMessageDismissReason,
  NeuralMessageInput,
  NeuralMessageRef,
  NeuralMessageSeverity,
} from './message.types';

@Injectable()
export class NeuralMessageService {
  private readonly config = inject(NEURAL_MESSAGES_CONFIG);
  private readonly messageState = signal<readonly NeuralMessageRecord[]>([]);
  private readonly refs = new Map<string, NeuralMessageRefState>();
  private nextId = 0;

  readonly messages = this.messageState.asReadonly();

  notify(input: NeuralMessageInput): NeuralMessageRef {
    const message = this.createMessage(input);
    const refState = new NeuralMessageRefState(message.id, (id) => {
      this.dismiss(id, 'api');
    });

    this.refs.set(message.id, refState);
    this.removeOverflow(message.channel);
    this.messageState.update((messages) => [...messages, message]);

    return refState.ref;
  }

  dismiss(
    id: string,
    reason: NeuralMessageDismissReason = 'api'
  ): boolean {
    if (!this.refs.has(id)) {
      return false;
    }

    this.messageState.update((messages) =>
      messages.filter((message) => message.id !== id)
    );
    this.closeRef(id, reason);
    return true;
  }

  clear(channel?: string): void {
    const normalizedChannel = channel?.trim();

    if (channel !== undefined && !normalizedChannel) {
      throw new Error('NeuralNg messages: channel cannot be empty.');
    }

    const messagesToClose = normalizedChannel
      ? this.messageState().filter(
          (message) => message.channel === normalizedChannel
        )
      : this.messageState();

    if (messagesToClose.length === 0) {
      return;
    }

    const ids = new Set(messagesToClose.map((message) => message.id));
    this.messageState.update((messages) =>
      messages.filter((message) => !ids.has(message.id))
    );

    for (const id of ids) {
      this.closeRef(id, 'clear');
    }
  }

  private createMessage(input: NeuralMessageInput): NeuralMessageRecord {
    const message = input.message.trim();
    const channel = (input.channel ?? this.config.defaultChannel).trim();
    const severity = input.severity ?? 'neutral';
    const duration =
      input.duration === undefined
        ? this.defaultDurationForSeverity(severity)
        : input.duration;

    if (!message) {
      throw new Error('NeuralNg messages: message cannot be empty.');
    }

    if (!channel) {
      throw new Error('NeuralNg messages: channel cannot be empty.');
    }

    validateDuration(duration, 'duration');

    const title = input.title?.trim();

    return Object.freeze({
      id: `neural-message-${++this.nextId}`,
      severity,
      ...(title ? { title } : {}),
      message,
      channel,
      duration,
      dismissible: input.dismissible ?? true,
      ...(input.data === undefined ? {} : { data: input.data }),
    });
  }

  private defaultDurationForSeverity(
    severity: NeuralMessageSeverity
  ): number | null {
    return severity === 'warning' || severity === 'error'
      ? this.config.importantDuration
      : this.config.defaultDuration;
  }

  private removeOverflow(channel: string): void {
    const channelMessages = this.messageState().filter(
      (message) => message.channel === channel
    );
    const overflowCount = channelMessages.length - this.config.maxVisible + 1;

    if (overflowCount <= 0) {
      return;
    }

    for (const message of channelMessages.slice(0, overflowCount)) {
      this.dismiss(message.id, 'overflow');
    }
  }

  private closeRef(id: string, reason: NeuralMessageDismissReason): void {
    const refState = this.refs.get(id);

    if (!refState) {
      return;
    }

    refState.close(reason);
    this.refs.delete(id);
  }
}

class NeuralMessageRefState {
  private readonly closedState = signal(false);
  private readonly closeReasonState = signal<NeuralMessageDismissReason | null>(
    null
  );

  readonly ref: NeuralMessageRef;

  constructor(id: string, dismiss: (id: string) => void) {
    this.ref = Object.freeze({
      id,
      closed: this.closedState.asReadonly(),
      closeReason: this.closeReasonState.asReadonly(),
      dismiss: () => dismiss(id),
    });
  }

  close(reason: NeuralMessageDismissReason): void {
    this.closeReasonState.set(reason);
    this.closedState.set(true);
  }
}
