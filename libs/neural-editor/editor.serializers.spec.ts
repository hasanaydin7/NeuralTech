import {
  editorDocumentFromHtml,
  editorDocumentToHtml,
  editorDocumentToText,
  editorDocumentWithNodeIds,
} from './editor.serializers';
import type { NeuralEditorDocument } from './editor.types';

describe('Editor serializers', () => {
  const document: NeuralEditorDocument = {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2, textAlign: 'center' },
        content: [{ type: 'text', text: 'NeuralNg' }],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Structured ' },
          {
            type: 'text',
            text: 'editor',
            marks: [
              { type: 'bold' },
              { type: 'textStyle', attrs: { color: '#2563eb' } },
              { type: 'highlight', attrs: { color: '#fef08a' } },
            ],
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Assigned to ' },
          { type: 'mention', attrs: { id: 'ada', label: 'Ada Lovelace' } },
        ],
      },
      {
        type: 'taskList',
        content: [
          {
            type: 'taskItem',
            attrs: { checked: true },
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Ship alpha 2.1' }],
              },
            ],
          },
        ],
      },
      {
        type: 'image',
        attrs: {
          src: 'https://cdn.example.com/editor.png',
          alt: 'Editor screenshot',
          title: 'NeuralNg Editor',
        },
      },
      {
        type: 'table',
        content: [
          {
            type: 'tableRow',
            content: [
              {
                type: 'tableHeader',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Feature' }],
                  },
                ],
              },
              {
                type: 'tableHeader',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Status' }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  it('round-trips alignment, color, highlight, tasks, and tables through HTML', () => {
    const html = editorDocumentToHtml(document);
    expect(html).toContain('text-align: center');
    expect(html).toContain('color: #2563eb');
    expect(html).toContain('<mark');
    expect(html).toContain('data-type="taskList"');
    expect(html).toContain('data-neural-editor-mention');
    expect(html).toContain('Ada Lovelace');
    expect(html).toContain('<img');
    expect(html).toContain('https://cdn.example.com/editor.png');
    expect(html).toContain('<table');

    const restored = editorDocumentFromHtml(html);
    expect(restored.type).toBe('doc');
    expect(editorDocumentToHtml(restored)).toContain('<table');
  });

  it('adds node IDs for persistence while omitting them from HTML by default', () => {
    let counter = 0;
    const identified = editorDocumentWithNodeIds(document, {
      generateId: ({ nodeType }) => `${nodeType}-${++counter}`,
    });
    const headingId = identified.content?.[0]?.attrs?.['neuralId'];

    expect(headingId).toBe('heading-1');
    expect(editorDocumentToHtml(identified)).not.toContain('heading-1');
    expect(
      editorDocumentToHtml(identified, { includeNodeIds: true }),
    ).toContain('heading-1');
  });

  it('derives readable plain text from advanced nodes', () => {
    expect(editorDocumentToText(document)).toContain('NeuralNg');
    expect(editorDocumentToText(document)).toContain('@Ada Lovelace');
    expect(editorDocumentToText(document)).toContain('Ship alpha 2.1');
    expect(editorDocumentToText(document)).toContain('Editor screenshot');
    expect(editorDocumentToText(document)).toContain('Feature\tStatus');
  });
});
