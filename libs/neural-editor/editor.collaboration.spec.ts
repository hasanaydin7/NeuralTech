import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { applyUpdate, Doc, encodeStateAsUpdate } from 'yjs';
import {
  createNeuralEditorCommentMessage,
  createNeuralEditorCommentRepository,
  createNeuralEditorCommentThread,
  createNeuralEditorSnapshot,
  readNeuralEditorPresence,
} from './editor.collaboration';
import type {
  NeuralEditorCollaborationProvider,
  NeuralEditorCollaborationUser,
} from './editor.types';

const USER: NeuralEditorCollaborationUser = {
  id: 'user-1',
  name: 'Ada Lovelace',
  color: '#2563eb',
};

describe('Editor collaboration foundation', () => {
  it('stores comment threads in the shared Yjs document', () => {
    const document = new Doc();
    const config = { document, commentsField: 'comments' };
    const first = createNeuralEditorCommentRepository(config);
    const second = createNeuralEditorCommentRepository(config);
    const thread = createNeuralEditorCommentThread(
      'Review this paragraph.',
      USER,
    );

    first.set(thread);

    expect(second.get(thread.id)).toEqual(thread);
    expect(second.list()).toEqual([thread]);
  });

  it('merges concurrent comment replies through nested Yjs arrays', () => {
    const firstDocument = new Doc();
    const secondDocument = new Doc();
    const first = createNeuralEditorCommentRepository({
      document: firstDocument,
      commentsField: 'comments',
    });
    const second = createNeuralEditorCommentRepository({
      document: secondDocument,
      commentsField: 'comments',
    });
    const thread = createNeuralEditorCommentThread('Start review.', USER);
    first.set(thread);
    applyUpdate(secondDocument, encodeStateAsUpdate(firstDocument));

    const firstReply = createNeuralEditorCommentMessage(
      'Reply from Ada.',
      USER,
    );
    const secondReply = createNeuralEditorCommentMessage('Reply from Grace.', {
      id: 'user-2',
      name: 'Grace Hopper',
      color: '#9333ea',
    });
    first.appendMessage(thread.id, firstReply);
    second.appendMessage(thread.id, secondReply);

    const firstUpdate = encodeStateAsUpdate(firstDocument);
    const secondUpdate = encodeStateAsUpdate(secondDocument);
    applyUpdate(firstDocument, secondUpdate);
    applyUpdate(secondDocument, firstUpdate);

    const firstMessages = first
      .get(thread.id)
      ?.messages.map((message) => message.id);
    const secondMessages = second
      .get(thread.id)
      ?.messages.map((message) => message.id);
    expect(new Set(firstMessages)).toEqual(
      new Set([thread.messages[0]?.id, firstReply.id, secondReply.id]),
    );
    expect(new Set(secondMessages)).toEqual(new Set(firstMessages));
  });

  it('normalizes provider awareness into deterministic presence entries', () => {
    const provider: NeuralEditorCollaborationProvider = {
      awareness: {
        clientID: 7,
        states: new Map([
          [7, { user: USER }],
          [
            8,
            { user: { id: 'user-2', name: 'Grace Hopper', color: '#9333ea' } },
          ],
        ]),
        setLocalStateField: () => undefined,
        on: () => undefined,
        off: () => undefined,
      },
    };

    const presence = readNeuralEditorPresence(provider, USER);

    expect(presence.map((entry) => entry.user.id)).toEqual([
      'user-1',
      'user-2',
    ]);
    expect(presence[0]?.local).toBe(true);
  });

  it('creates portable snapshots without coupling persistence to a provider', () => {
    const editor = new Editor({
      extensions: [StarterKit],
      content: '<p>Snapshot content</p>',
    });
    const thread = createNeuralEditorCommentThread('Keep this note.', USER);

    const snapshot = createNeuralEditorSnapshot(
      editor,
      [thread],
      USER,
      4,
      'Review checkpoint',
    );

    expect(snapshot.schemaVersion).toBe(1);
    expect(snapshot.label).toBe('Review checkpoint');
    expect(snapshot.revision).toBe(4);
    expect(snapshot.comments).toEqual([thread]);
    expect(snapshot.document.type).toBe('doc');
    editor.destroy();
  });
});
