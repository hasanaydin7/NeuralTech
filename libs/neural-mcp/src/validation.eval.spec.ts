import { describe, expect, it } from 'vitest';
import { validateUsage } from './validation.js';

const invalidCases = [
  ['icon-only button', '<neural-button icon="trash" />', 'NNG201'],
  ['unknown selector', '<neural-made-up />', 'NNG001'],
  ['unknown attribute directive', '<section neuralMadeUp></section>', 'NNG001'],
  [
    'Angular template syntax error',
    '<neural-button><div></neural-button>',
    'NNG000',
  ],
  [
    'unknown binding',
    '<neural-button [madeUp]="true">Save</neural-button>',
    'NNG002',
  ],
  [
    'missing required option value',
    '<neural-option>One</neural-option>',
    'NNG003',
  ],
  [
    'invalid aliased severity',
    '<neural-button severity="danger">Save</neural-button>',
    'NNG004',
  ],
  ['duplicate toast channel', '<neural-toast /><neural-toast />', 'NNG202'],
] as const;

describe('Neural MCP correctness evaluation set', () => {
  for (const [name, template, diagnosticCode] of invalidCases) {
    it(`detects ${name}`, () => {
      const result = validateUsage({
        template,
        providers: ['provideNeuralMessages'],
      });
      expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toContain(
        diagnosticCode,
      );
    });
  }

  it('accepts a labeled icon button without contract errors', () => {
    const result = validateUsage({
      template: '<neural-button icon="save" ariaLabel="Save changes" />',
      imports: ['NeuralButton'],
    });
    expect(result.valid).toBe(true);
  });

  it('accepts known Angular structural and global attributes', () => {
    const result = validateUsage({
      template:
        '<neural-button *ngIf="ready" class="primary" [attr.data-id]="id">Save</neural-button>',
      imports: ['NeuralButton'],
    });
    expect(
      result.diagnostics.filter((diagnostic) => diagnostic.code === 'NNG002'),
    ).toEqual([]);
  });

  it('accepts a native NeuralInput composition without DOM false positives', () => {
    const result = validateUsage({
      template:
        '<input neuralInput [disabled]="disabled()" (change)="changed($event)" aria-label="Search" />',
      imports: ['NeuralInput'],
    });
    expect(result.valid).toBe(true);
    expect(result.components).toContain('neural-input');
  });
});
