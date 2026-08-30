import type { Editor } from '@tiptap/core';
import { Array as YArray, Map as YMap, type Doc } from 'yjs';
import type {
  NeuralEditorCollaborationConfig,
  NeuralEditorCollaborationPresence,
  NeuralEditorCollaborationProvider,
  NeuralEditorCollaborationStatus,
  NeuralEditorCollaborationUser,
  NeuralEditorCommentMessage,
  NeuralEditorCommentThread,
  NeuralEditorDocument,
  NeuralEditorSnapshot,
} from './editor.types';
import { cloneNeuralEditorDocument, fromTiptapJson } from './editor.utils';

export const NEURAL_EDITOR_DEFAULT_COMMENT_FIELD = 'neuralEditorComments';

export interface NeuralEditorCommentRepository {
  list(): readonly NeuralEditorCommentThread[];
  get(threadId: string): NeuralEditorCommentThread | null;
  set(thread: NeuralEditorCommentThread): void;
  appendMessage(
    threadId: string,
    message: NeuralEditorCommentMessage,
  ): NeuralEditorCommentThread | null;
  setResolved(
    threadId: string,
    resolved: boolean,
    updatedAt: string,
  ): NeuralEditorCommentThread | null;
  delete(threadId: string): boolean;
  subscribe(listener: () => void): () => void;
  destroy(): void;
}

export function createNeuralEditorCommentRepository(
  collaboration: NeuralEditorCollaborationConfig | null,
): NeuralEditorCommentRepository {
  if (collaboration) {
    return new YjsNeuralEditorCommentRepository(
      collaboration.document,
      collaboration.commentsField ?? NEURAL_EDITOR_DEFAULT_COMMENT_FIELD,
    );
  }
  return new LocalNeuralEditorCommentRepository();
}

export async function prepareNeuralEditorCollaboration(
  config: NeuralEditorCollaborationConfig,
  onStatus: (status: NeuralEditorCollaborationStatus) => void,
): Promise<void> {
  const provider = config.provider;
  if (!provider) {
    onStatus('synced');
    return;
  }

  if (config.waitForSync === false) {
    if (config.connectOnInit !== false) {
      onStatus('connecting');
      provider.connect?.();
    }
    onStatus(provider.synced === true ? 'synced' : 'connected');
    return;
  }

  if (provider.synced === true) {
    onStatus('synced');
    return;
  }

  if (config.whenSynced) {
    if (config.connectOnInit !== false) {
      onStatus('connecting');
      provider.connect?.();
    }
    await config.whenSynced();
    onStatus('synced');
    return;
  }

  const synchronized = waitForProviderSync(
    provider,
    config.syncTimeout ?? 15_000,
  );
  if (config.connectOnInit !== false) {
    onStatus('connecting');
    provider.connect?.();
  }
  await synchronized;
  onStatus('synced');
}

export function subscribeNeuralEditorProvider(
  provider: NeuralEditorCollaborationProvider | undefined,
  callbacks: {
    readonly status: (status: NeuralEditorCollaborationStatus) => void;
    readonly synced: () => void;
    readonly presence: () => void;
  },
): () => void {
  if (!provider) return () => undefined;

  const disposers: Array<() => void> = [];
  const add = (event: string, listener: (...args: unknown[]) => void) => {
    if (!provider.on || !provider.off) return;
    provider.on(event, listener);
    disposers.push(() => provider.off?.(event, listener));
  };

  add('status', (payload) => {
    const status = readProviderStatus(payload);
    if (status) callbacks.status(status);
  });
  add('connect', () => callbacks.status('connected'));
  add('disconnect', () => callbacks.status('disconnected'));
  add('error', () => callbacks.status('error'));
  add('connection-error', () => callbacks.status('error'));
  add('synced', () => {
    callbacks.status('synced');
    callbacks.synced();
  });
  add('sync', (value) => {
    if (value === true || readBooleanProperty(value, 'state')) {
      callbacks.status('synced');
      callbacks.synced();
    }
  });

  const awareness = provider.awareness;
  if (awareness) {
    const listener = () => callbacks.presence();
    awareness.on('update', listener);
    awareness.on('change', listener);
    disposers.push(() => {
      awareness.off('update', listener);
      awareness.off('change', listener);
    });
  }

  return () => {
    for (const dispose of disposers.splice(0)) dispose();
  };
}

export function readNeuralEditorPresence(
  provider: NeuralEditorCollaborationProvider | undefined,
  localUser: NeuralEditorCollaborationUser | null,
): readonly NeuralEditorCollaborationPresence[] {
  const states =
    provider?.awareness?.getStates?.() ?? provider?.awareness?.states;
  if (!states) return localUser ? [toPresence(0, localUser, true)] : [];

  const clientId = provider?.awareness?.clientID;
  const presence = [...states.entries()].map(([id, state]) => {
    const stateRecord = isRecord(state) ? state : {};
    const candidate = isRecord(stateRecord['user']) ? stateRecord['user'] : {};
    const user = normalizeCollaborationUser(candidate, `user-${id}`);
    return toPresence(id, user, id === clientId);
  });

  if (
    localUser &&
    !presence.some((entry) => entry.local || entry.user.id === localUser.id)
  ) {
    presence.unshift(toPresence(clientId ?? 0, localUser, true));
  }

  return presence.sort((left, right) => {
    if (left.local !== right.local) return left.local ? -1 : 1;
    return left.user.name.localeCompare(right.user.name);
  });
}

export function createNeuralEditorCommentThread(
  text: string,
  user: NeuralEditorCollaborationUser,
  threadId = createCollaborationId('comment'),
): NeuralEditorCommentThread {
  const message = createNeuralEditorCommentMessage(text, user);
  const now = message.createdAt;
  return {
    id: threadId,
    resolved: false,
    createdAt: now,
    updatedAt: now,
    createdBy: user.id,
    messages: [message],
  };
}

export function createNeuralEditorCommentMessage(
  text: string,
  user: NeuralEditorCollaborationUser,
): NeuralEditorCommentMessage {
  const normalized = text.trim();
  if (!normalized) throw new TypeError('Comment text cannot be empty.');
  return {
    id: createCollaborationId('message'),
    text: normalized,
    createdAt: new Date().toISOString(),
    user: {
      id: user.id,
      name: user.name,
      color: user.color,
      avatarUrl: user.avatarUrl,
    },
  };
}

export function createNeuralEditorSnapshot(
  editor: Editor,
  comments: readonly NeuralEditorCommentThread[],
  user: NeuralEditorCollaborationUser | null,
  revision: number,
  label?: string,
): NeuralEditorSnapshot {
  const createdAt = new Date().toISOString();
  return {
    schemaVersion: 1,
    id: createCollaborationId('snapshot'),
    label: label?.trim() || undefined,
    createdAt,
    createdBy: user
      ? { id: user.id, name: user.name, color: user.color }
      : undefined,
    revision,
    document: cloneNeuralEditorDocument(fromTiptapJson(editor.getJSON())),
    comments: comments.map(cloneCommentThread),
  };
}

export function cloneSnapshotDocument(
  snapshot: NeuralEditorSnapshot,
): NeuralEditorDocument {
  return cloneNeuralEditorDocument(snapshot.document);
}

export function createCollaborationId(prefix: string): string {
  const suffix =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${suffix}`;
}

export function normalizeCollaborationUser(
  value: Readonly<Record<string, unknown>>,
  fallbackId = 'anonymous',
): NeuralEditorCollaborationUser {
  const id = stringValue(value['id']) || fallbackId;
  return {
    id,
    name: stringValue(value['name']) || id,
    color: normalizeColor(stringValue(value['color']) || '#2563eb'),
    avatarUrl: stringValue(value['avatarUrl']) || undefined,
    metadata: isRecord(value['metadata']) ? value['metadata'] : undefined,
  };
}

function waitForProviderSync(
  provider: NeuralEditorCollaborationProvider,
  timeout: number,
): Promise<void> {
  if (!provider.on || !provider.off) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      provider.off?.('synced', onSynced);
      provider.off?.('sync', onSync);
      provider.off?.('error', onError);
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    };
    const onSynced = () => finish();
    const onSync = (value: unknown) => {
      if (value === true || readBooleanProperty(value, 'state')) finish();
    };
    const onError = (value: unknown) =>
      finish(
        value instanceof Error
          ? value
          : new Error('Collaboration provider failed.'),
      );
    const timer = setTimeout(
      () =>
        finish(new Error(`Collaboration sync timed out after ${timeout}ms.`)),
      Math.max(0, timeout),
    );
    provider.on?.('synced', onSynced);
    provider.on?.('sync', onSync);
    provider.on?.('error', onError);
  });
}

function readProviderStatus(
  value: unknown,
): NeuralEditorCollaborationStatus | null {
  const candidate =
    typeof value === 'string'
      ? value
      : isRecord(value) && typeof value['status'] === 'string'
        ? value['status']
        : null;
  switch (candidate) {
    case 'connecting':
    case 'connected':
    case 'disconnected':
    case 'synced':
    case 'error':
      return candidate;
    default:
      return null;
  }
}

function readBooleanProperty(value: unknown, property: string): boolean {
  return isRecord(value) && value[property] === true;
}

function toPresence(
  clientId: number,
  user: NeuralEditorCollaborationUser,
  local: boolean,
): NeuralEditorCollaborationPresence {
  return { clientId, user, local };
}

function cloneCommentThread(
  thread: NeuralEditorCommentThread,
): NeuralEditorCommentThread {
  return {
    ...thread,
    messages: thread.messages.map(cloneCommentMessage),
  };
}

class LocalNeuralEditorCommentRepository
  implements NeuralEditorCommentRepository
{
  private readonly threads = new Map<string, NeuralEditorCommentThread>();
  private readonly listeners = new Set<() => void>();

  list(): readonly NeuralEditorCommentThread[] {
    return [...this.threads.values()].map(cloneCommentThread).sort(sortThreads);
  }

  get(threadId: string): NeuralEditorCommentThread | null {
    const thread = this.threads.get(threadId);
    return thread ? cloneCommentThread(thread) : null;
  }

  set(thread: NeuralEditorCommentThread): void {
    this.threads.set(thread.id, cloneCommentThread(thread));
    this.emit();
  }

  appendMessage(
    threadId: string,
    message: NeuralEditorCommentMessage,
  ): NeuralEditorCommentThread | null {
    const current = this.threads.get(threadId);
    if (!current) return null;
    const updated: NeuralEditorCommentThread = {
      ...current,
      updatedAt: message.createdAt,
      messages: [...current.messages, cloneCommentMessage(message)],
    };
    this.threads.set(threadId, updated);
    this.emit();
    return cloneCommentThread(updated);
  }

  setResolved(
    threadId: string,
    resolved: boolean,
    updatedAt: string,
  ): NeuralEditorCommentThread | null {
    const current = this.threads.get(threadId);
    if (!current) return null;
    const updated: NeuralEditorCommentThread = {
      ...current,
      resolved,
      updatedAt,
    };
    this.threads.set(threadId, updated);
    this.emit();
    return cloneCommentThread(updated);
  }

  delete(threadId: string): boolean {
    const deleted = this.threads.delete(threadId);
    if (deleted) this.emit();
    return deleted;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  destroy(): void {
    this.listeners.clear();
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }
}

class YjsNeuralEditorCommentRepository
  implements NeuralEditorCommentRepository
{
  private readonly shared: YMap<YMap<unknown> | NeuralEditorCommentThread>;
  private readonly listeners = new Set<() => void>();
  private readonly observer = () => this.emit();

  constructor(
    private readonly document: Doc,
    field: string,
  ) {
    this.shared = document.getMap<YMap<unknown> | NeuralEditorCommentThread>(
      field,
    );
    this.shared.observeDeep(this.observer);
  }

  list(): readonly NeuralEditorCommentThread[] {
    const threads: NeuralEditorCommentThread[] = [];
    for (const [threadId, value] of this.shared.entries()) {
      const thread = readSharedCommentThread(threadId, value);
      if (thread) threads.push(thread);
    }
    return threads.sort(sortThreads);
  }

  get(threadId: string): NeuralEditorCommentThread | null {
    return readSharedCommentThread(threadId, this.shared.get(threadId));
  }

  set(thread: NeuralEditorCommentThread): void {
    this.document.transact(() => {
      const sharedThread = this.ensureSharedThread(thread.id);
      writeSharedCommentThread(sharedThread, thread);
    }, this);
  }

  appendMessage(
    threadId: string,
    message: NeuralEditorCommentMessage,
  ): NeuralEditorCommentThread | null {
    if (!this.shared.has(threadId)) return null;
    this.document.transact(() => {
      const sharedThread = this.ensureSharedThread(threadId);
      const messages = ensureSharedMessages(sharedThread);
      messages.push([cloneCommentMessage(message)]);
      sharedThread.set('updatedAt', message.createdAt);
    }, this);
    return this.get(threadId);
  }

  setResolved(
    threadId: string,
    resolved: boolean,
    updatedAt: string,
  ): NeuralEditorCommentThread | null {
    if (!this.shared.has(threadId)) return null;
    this.document.transact(() => {
      const sharedThread = this.ensureSharedThread(threadId);
      sharedThread.set('resolved', resolved);
      sharedThread.set('updatedAt', updatedAt);
    }, this);
    return this.get(threadId);
  }

  delete(threadId: string): boolean {
    if (!this.shared.has(threadId)) return false;
    this.shared.delete(threadId);
    return true;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  destroy(): void {
    this.shared.unobserveDeep(this.observer);
    this.listeners.clear();
  }

  private ensureSharedThread(threadId: string): YMap<unknown> {
    const current = this.shared.get(threadId);
    if (current instanceof YMap) return current;

    const sharedThread = new YMap<unknown>();
    this.shared.set(threadId, sharedThread);
    if (current) writeSharedCommentThread(sharedThread, current);
    else sharedThread.set('id', threadId);
    return sharedThread;
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }
}

function readSharedCommentThread(
  threadId: string,
  value: YMap<unknown> | NeuralEditorCommentThread | undefined,
): NeuralEditorCommentThread | null {
  if (!value) return null;
  if (!(value instanceof YMap)) return cloneCommentThread(value);

  const messagesValue = value.get('messages');
  const messages =
    messagesValue instanceof YArray
      ? messagesValue.toArray().map(normalizeCommentMessage).filter(isDefined)
      : Array.isArray(messagesValue)
        ? messagesValue.map(normalizeCommentMessage).filter(isDefined)
        : [];
  const createdAt = stringValue(value.get('createdAt'));
  const updatedAt = stringValue(value.get('updatedAt')) || createdAt;
  return {
    id: stringValue(value.get('id')) || threadId,
    resolved: value.get('resolved') === true,
    createdAt,
    updatedAt,
    createdBy: stringValue(value.get('createdBy')),
    messages,
  };
}

function writeSharedCommentThread(
  target: YMap<unknown>,
  thread: NeuralEditorCommentThread,
): void {
  target.set('id', thread.id);
  target.set('resolved', thread.resolved);
  target.set('createdAt', thread.createdAt);
  target.set('updatedAt', thread.updatedAt);
  target.set('createdBy', thread.createdBy);
  const messages = ensureSharedMessages(target);
  if (messages.length) messages.delete(0, messages.length);
  if (thread.messages.length) {
    messages.push(thread.messages.map(cloneCommentMessage));
  }
}

function ensureSharedMessages(
  thread: YMap<unknown>,
): YArray<NeuralEditorCommentMessage> {
  const current = thread.get('messages');
  if (current instanceof YArray) {
    return current as YArray<NeuralEditorCommentMessage>;
  }
  const messages = new YArray<NeuralEditorCommentMessage>();
  thread.set('messages', messages);
  if (Array.isArray(current) && current.length) {
    messages.push(current.map(normalizeCommentMessage).filter(isDefined));
  }
  return messages;
}

function normalizeCommentMessage(
  value: unknown,
): NeuralEditorCommentMessage | null {
  if (!isRecord(value)) return null;
  const userValue = isRecord(value['user']) ? value['user'] : {};
  const id = stringValue(value['id']);
  const text = stringValue(value['text']);
  const createdAt = stringValue(value['createdAt']);
  const userId = stringValue(userValue['id']);
  if (!id || !text || !createdAt || !userId) return null;
  return {
    id,
    text,
    createdAt,
    user: {
      id: userId,
      name: stringValue(userValue['name']) || userId,
      color: normalizeColor(stringValue(userValue['color']) || '#2563eb'),
      avatarUrl: stringValue(userValue['avatarUrl']) || undefined,
    },
  };
}

function cloneCommentMessage(
  message: NeuralEditorCommentMessage,
): NeuralEditorCommentMessage {
  return {
    ...message,
    user: { ...message.user },
  };
}

function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

function sortThreads(
  left: NeuralEditorCommentThread,
  right: NeuralEditorCommentThread,
): number {
  return right.updatedAt.localeCompare(left.updatedAt);
}

function normalizeColor(value: string): string {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : '#2563eb';
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
