import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import {
  acceptNeuralEditorTrackedChange,
  createNeuralEditorReviewExtensions,
  readNeuralEditorTrackedChanges,
  rejectNeuralEditorTrackedChange,
} from './editor.review';

function createReviewEditor() {
  return new Editor({
    extensions: [
      StarterKit,
      ...createNeuralEditorReviewExtensions({
        commentsEnabled: () => true,
        onCommentActivated: () => undefined,
        trackedChangesEnabled: () => true,
        currentUser: () => ({
          id: 'reviewer-1',
          name: 'Ada Lovelace',
          color: '#2563eb',
        }),
      }),
    ],
    content: '<p>Review</p>',
  });
}

describe('Editor tracked changes', () => {
  it('records and rejects a local insertion', () => {
    const editor = createReviewEditor();
    editor.commands.setTextSelection(7);
    editor.commands.insertContent(' me');

    const [change] = readNeuralEditorTrackedChanges(editor);
    expect(change?.kind).toBe('insertion');
    expect(change?.userId).toBe('reviewer-1');

    const changeId = requireChangeId(change);
    expect(rejectNeuralEditorTrackedChange(editor, changeId)).toBe(true);
    expect(editor.getText()).toBe('Review');
    editor.destroy();
  });

  it('keeps a deletion visible until it is accepted', () => {
    const editor = createReviewEditor();
    editor.commands.setTextSelection({ from: 1, to: 7 });
    editor.commands.deleteSelection();

    const [change] = readNeuralEditorTrackedChanges(editor);
    expect(change?.kind).toBe('deletion');
    expect(editor.getText()).toBe('Review');

    const changeId = requireChangeId(change);
    expect(acceptNeuralEditorTrackedChange(editor, changeId)).toBe(true);
    expect(editor.getText()).toBe('');
    editor.destroy();
  });
});
function requireChangeId(
  change: ReturnType<typeof readNeuralEditorTrackedChanges>[number] | undefined,
): string {
  if (!change) throw new Error('Expected a tracked change.');
  return change.id;
}
