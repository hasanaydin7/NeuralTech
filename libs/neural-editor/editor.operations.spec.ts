import { Editor } from '@tiptap/core';
import { UniqueID } from '@tiptap/extension-unique-id';
import StarterKit from '@tiptap/starter-kit';
import {
  applyNeuralEditorOperations,
  createNeuralEditorOperationBatch,
  findNeuralEditorNodeById,
  validateNeuralEditorOperations,
} from './editor.operations';

const NODE_ID_ATTRIBUTE = 'neuralId';

describe('Editor structured operations', () => {
  function createEditor() {
    let revision = 0;
    const element = document.createElement('div');
    document.body.append(element);
    const editor = new Editor({
      element,
      extensions: [
        StarterKit,
        UniqueID.configure({
          attributeName: NODE_ID_ATTRIBUTE,
          types: ['paragraph', 'heading'],
          generateID: ({ node, pos }) => `${node.type.name}-${pos}`,
        }),
      ],
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            attrs: { neuralId: 'paragraph-intro' },
            content: [{ type: 'text', text: 'Original' }],
          },
        ],
      },
      onTransaction: ({ transaction }) => {
        if (transaction.docChanged) revision++;
      },
    });
    return {
      editor,
      revision: () => revision,
      destroy: () => {
        editor.destroy();
        element.remove();
      },
    };
  }

  it('applies node-addressed operations as one transaction', () => {
    const context = createEditor();
    const batch = createNeuralEditorOperationBatch(
      [
        {
          type: 'replace',
          target: { nodeId: 'paragraph-intro' },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Rewritten' }],
            },
          ],
        },
        {
          type: 'insert',
          target: { nodeId: 'paragraph-intro' },
          position: 'after',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Added' }],
            },
          ],
        },
      ],
      context.revision(),
      { id: 'batch-1' },
    );

    const validation = validateNeuralEditorOperations(context.editor, batch, {
      nodeIdAttribute: NODE_ID_ATTRIBUTE,
      currentRevision: context.revision,
      editable: () => true,
    });
    expect(validation.valid).toBe(true);

    const result = applyNeuralEditorOperations(context.editor, batch, {
      nodeIdAttribute: NODE_ID_ATTRIBUTE,
      currentRevision: context.revision,
      editable: () => true,
    });

    expect(result.status).toBe('applied');
    expect(context.editor.getText()).toContain('Rewritten');
    expect(context.editor.getText()).toContain('Added');
    expect(
      findNeuralEditorNodeById(
        context.editor.state.doc,
        'paragraph-intro',
        NODE_ID_ATTRIBUTE,
      )?.node.content?.[0]?.text,
    ).toBe('Rewritten');
    context.destroy();
  });

  it('does not dispatch partial changes when one operation is invalid', () => {
    const context = createEditor();
    const before = context.editor.getJSON();
    const batch = createNeuralEditorOperationBatch(
      [
        {
          type: 'replace',
          target: { nodeId: 'paragraph-intro' },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Would be partial' }],
            },
          ],
        },
        {
          type: 'delete',
          target: { nodeId: 'missing-node' },
        },
      ],
      context.revision(),
      { id: 'batch-invalid' },
    );

    const result = applyNeuralEditorOperations(context.editor, batch, {
      nodeIdAttribute: NODE_ID_ATTRIBUTE,
      currentRevision: context.revision,
      editable: () => true,
    });

    expect(result.status).toBe('rejected');
    expect(context.editor.getJSON()).toEqual(before);
    context.destroy();
  });

  it('rejects revision conflicts before building a transaction', () => {
    const context = createEditor();
    const batch = createNeuralEditorOperationBatch(
      [
        {
          type: 'delete',
          target: { nodeId: 'paragraph-intro' },
        },
      ],
      context.revision() + 1,
      { id: 'batch-stale' },
    );

    const result = applyNeuralEditorOperations(context.editor, batch, {
      nodeIdAttribute: NODE_ID_ATTRIBUTE,
      currentRevision: context.revision,
      editable: () => true,
    });

    expect(result.status).toBe('conflict');
    expect(context.editor.getText()).toBe('Original');
    context.destroy();
  });
});
