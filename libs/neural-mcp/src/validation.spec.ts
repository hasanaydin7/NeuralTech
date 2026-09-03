import { describe, expect, it } from 'vitest';
import { validateUsage } from './validation.js';

describe('Neural MCP usage validation', () => {
  it('rejects an inaccessible icon-only button', () => {
    const result = validateUsage({
      template: '<neural-button icon="trash"></neural-button>',
      imports: ['NeuralButton'],
    });

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: 'NNG201', severity: 'error' }),
    );
  });

  it('reports unknown bindings, missing required inputs and invalid literals', () => {
    const result = validateUsage({
      template:
        '<neural-button severity="danger" [wat]="value">Save</neural-button>\n<neural-option />',
      imports: ['NeuralButton'],
    });

    expect(result.diagnostics.map((item) => item.code)).toEqual(
      expect.arrayContaining(['NNG002', 'NNG003', 'NNG004', 'NNG101']),
    );
  });

  it('returns exact imports and required providers for valid selectors', () => {
    const result = validateUsage({
      template:
        '<neural-toast /><neural-button ariaLabel="Save" icon="save" />',
      imports: ['NeuralButton', 'NeuralToast'],
      providers: [],
    });

    expect(result.suggestedProviders).toContainEqual(
      expect.objectContaining({
        name: 'provideNeuralMessages',
        requirement: 'required',
      }),
    );
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: 'NNG102', severity: 'error' }),
    );
  });

  it('warns about duplicate toast channels', () => {
    const result = validateUsage({
      template:
        '<neural-toast channel="billing" /><neural-toast channel="billing" />',
      imports: ['NeuralToast'],
      providers: ['provideNeuralMessages'],
    });

    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: 'NNG202', severity: 'warning' }),
    );
  });
});
