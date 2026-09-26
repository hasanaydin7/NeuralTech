import { describe, expect, it } from 'vitest';
import { inspectStyleRisks } from './style-risks.js';

const templates = [
  { content: '<section class="palette" [hidden]="!open()"></section>' },
];
const scan = (content: string, path = 'src/styles.css') =>
  inspectStyleRisks([{ path, content }], templates);
describe('bounded CSS risk hints', () => {
  it('finds hidden bindings inside Angular control flow and reports scan limits', () => {
    expect(
      inspectStyleRisks(
        [{ path: 'a.css', content: '.palette{display:grid}' }],
        [
          {
            content:
              '@if (ready) { <div class="palette" [attr.hidden]="closed"></div> }',
          },
        ],
      ),
    ).toHaveLength(1);
    expect(
      scan('.unused { color:red; }'.repeat(2001)).some(
        (item) => item.code === 'NNP013',
      ),
    ).toBe(true);
  });
  it('warns for matching authored display and hidden', () => {
    expect(scan('.palette { display: grid; }')).toEqual([
      expect.objectContaining({
        code: 'NNP011',
        severity: 'warning',
        file: 'src/styles.css',
      }),
    ]);
    expect(scan('section.palette { display: flex !important; }')).toHaveLength(
      1,
    );
  });
  it('does not report unrelated, commented, hidden-excluding or non-display rules', () => {
    for (const css of [
      '.other { display:grid; }',
      '/* .palette { display:grid; } */',
      '.palette:not([hidden]) { display:grid; }',
      '.palette { color:red; }',
      '.palette { display:grid; display:none; }',
    ])
      expect(scan(css)).toEqual([]);
    expect(
      inspectStyleRisks(
        [{ path: 'a.css', content: '.palette {display:grid}' }],
        [{ content: '<!-- <div class="palette" hidden></div> -->' }],
      ),
    ).toEqual([]);
    expect(scan('.palette {display:grid}', 'style.scss')).toEqual([]);
  });
  it('does not claim that :where alone blocks Appearance', () => {
    expect(scan(':where(:root) { --neural-color-primary: red; }')).toEqual([]);
    expect(
      scan(':where(:root) { --neural-color-primary: red !important; }'),
    ).toEqual([
      expect.objectContaining({ code: 'NNP012', severity: 'warning' }),
    ]);
  });
});
