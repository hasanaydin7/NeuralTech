import { describe, expect, it } from 'vitest';
import {
  resolveValidationInput,
  validationInputSchema,
} from './validation-input.js';
import { validateUsage } from './validation.js';

describe('validator input compatibility', () => {
  const template = '<neural-button icon="trash" ariaLabel="Delete" />';
  it('supports typed arrays and retains equivalent legacy results', () => {
    const typed = resolveValidationInput({
      template,
      imports: ['NeuralButton'],
      providers: [],
    });
    const legacy = resolveValidationInput({
      template,
      imports_json: '["NeuralButton"]',
      providers_json: '[]',
    });
    expect(typed).toEqual(legacy);
    expect(validateUsage(typed)).toEqual(validateUsage(legacy));
  });
  it('retains default empty arrays', () => {
    expect(resolveValidationInput({ template })).toEqual({
      template,
      imports: [],
      providers: [],
    });
  });
  it('accepts equivalent duplicate/order/whitespace-normalized names', () => {
    expect(
      resolveValidationInput({
        template,
        imports: [' B ', 'A'],
        imports_json: '["A","B","B"]',
      }).imports,
    ).toEqual(['B', 'A']);
  });
  it.each(['imports', 'providers'])(
    'rejects conflicting %s representations',
    (key) => {
      expect(() =>
        resolveValidationInput({
          template,
          [key]: ['A'],
          [`${key}_json`]: '["B"]',
        }),
      ).toThrow(/conflict/);
      expect(() =>
        resolveValidationInput({
          template,
          [key]: [],
          [`${key}_json`]: '["B"]',
        }),
      ).toThrow(/conflict/);
    },
  );
  it.each([{}, [42], [''], ['   '], 'NeuralButton', null])(
    'rejects invalid array input %j',
    (value) => {
      expect(
        validationInputSchema.safeParse({ template, imports: value }).success,
      ).toBe(false);
    },
  );
  it.each(['{', '{}', '[1]', '[""]', 'null'])(
    'rejects invalid legacy input %s',
    (value) => {
      expect(() =>
        resolveValidationInput({ template, imports_json: value }),
      ).toThrow(/JSON array/);
    },
  );
  it('does not ignore a malformed legacy field even when typed input exists', () => {
    expect(() =>
      resolveValidationInput({ template, imports: ['A'], imports_json: '{}' }),
    ).toThrow(/JSON array/);
  });
});
