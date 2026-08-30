import { Injectable, signal } from '@angular/core';
import type {
  NeuralConfirmation,
  NeuralConfirmationCloseReason,
  NeuralConfirmationInput,
  NeuralConfirmationRef,
  NeuralConfirmationResult,
} from './confirm-dialog.types';

@Injectable({ providedIn: 'root' })
export class NeuralConfirmationService {
  private readonly state = signal<readonly NeuralConfirmation[]>([]);
  private readonly refs = new Map<string, NeuralConfirmationRefState>();
  private nextId = 0;

  readonly confirmations = this.state.asReadonly();

  confirm(input: NeuralConfirmationInput): NeuralConfirmationRef {
    const confirmation = this.normalize(input);
    const replaced = this.confirmation(confirmation.key);
    if (replaced) this.complete(replaced.id, 'dismissed', 'replaced');

    const refState = new NeuralConfirmationRefState(confirmation.id, (id) =>
      this.complete(id, 'dismissed', 'api'),
    );
    this.refs.set(confirmation.id, refState);
    this.state.update((items) => [...items, confirmation]);
    return refState.ref;
  }

  confirmation(key = 'default'): NeuralConfirmation | null {
    return this.state().find((item) => item.key === key) ?? null;
  }

  async runAction(id: string, action: 'accept' | 'reject'): Promise<boolean> {
    const confirmation = this.find(id);
    if (!confirmation) return false;
    const handler =
      action === 'accept' ? confirmation.accept : confirmation.reject;
    return (await handler?.()) !== false;
  }

  complete(
    id: string,
    result: NeuralConfirmationResult,
    reason: NeuralConfirmationCloseReason,
  ): boolean {
    const confirmation = this.find(id);
    if (!confirmation) return false;
    this.state.update((items) => items.filter((item) => item.id !== id));
    this.refs.get(id)?.close(result, reason);
    this.refs.delete(id);
    confirmation.onClose?.({ confirmation, result, reason });
    return true;
  }

  close(key = 'default'): boolean {
    const confirmation = this.confirmation(this.normalizeKey(key));
    return confirmation
      ? this.complete(confirmation.id, 'dismissed', 'api')
      : false;
  }

  private find(id: string): NeuralConfirmation | undefined {
    return this.state().find((item) => item.id === id);
  }

  private normalize(input: NeuralConfirmationInput): NeuralConfirmation {
    const message = input.message.trim();
    if (!message) {
      throw new Error('NeuralNg confirmation: message cannot be empty.');
    }
    const key = this.normalizeKey(input.key ?? 'default');
    const header = input.header?.trim();
    const iconClass = input.iconClass?.trim();
    const acceptLabel = input.acceptLabel?.trim();
    const rejectLabel = input.rejectLabel?.trim();

    return Object.freeze({
      ...input,
      id: `neural-confirmation-${++this.nextId}`,
      key,
      message,
      ...(header ? { header } : { header: undefined }),
      ...(iconClass ? { iconClass } : { iconClass: undefined }),
      ...(acceptLabel ? { acceptLabel } : { acceptLabel: undefined }),
      ...(rejectLabel ? { rejectLabel } : { rejectLabel: undefined }),
    });
  }

  private normalizeKey(key: string): string {
    const normalized = key.trim();
    if (!normalized) {
      throw new Error('NeuralNg confirmation: key cannot be empty.');
    }
    return normalized;
  }
}

class NeuralConfirmationRefState {
  private readonly closedState = signal(false);
  private readonly resultState = signal<NeuralConfirmationResult | null>(null);
  private readonly closeReasonState =
    signal<NeuralConfirmationCloseReason | null>(null);

  readonly ref: NeuralConfirmationRef;

  constructor(id: string, dismiss: (id: string) => void) {
    this.ref = Object.freeze({
      id,
      closed: this.closedState.asReadonly(),
      result: this.resultState.asReadonly(),
      closeReason: this.closeReasonState.asReadonly(),
      dismiss: () => dismiss(id),
    });
  }

  close(
    result: NeuralConfirmationResult,
    reason: NeuralConfirmationCloseReason,
  ): void {
    this.resultState.set(result);
    this.closeReasonState.set(reason);
    this.closedState.set(true);
  }
}
