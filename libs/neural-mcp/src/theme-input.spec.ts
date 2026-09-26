import { describe, expect, it } from 'vitest';
import {
  resolveThemeObject,
  resolveThemeJson,
  themeObjectFields,
} from './theme-input.js';
import { z } from 'zod/v4';

describe('native theme inputs', () => {
  it('advertises an object without requiring JSON double encoding', () => {
    const schema = z.toJSONSchema(z.object(themeObjectFields('recipe')));
    expect(schema.properties?.['recipe']).toMatchObject({ type: 'object' });
  });
  it('preserves native and legacy parity including nested key order', () => {
    const recipe = { name: 'test', tokens: { a: 'x', b: 'y' } };
    expect(resolveThemeObject({ recipe }, 'recipe')).toEqual(recipe);
    expect(
      resolveThemeObject({ recipe_json: JSON.stringify(recipe) }, 'recipe'),
    ).toEqual(recipe);
    expect(
      resolveThemeObject(
        { recipe, recipe_json: '{"tokens":{"b":"y","a":"x"},"name":"test"}' },
        'recipe',
      ),
    ).toEqual(recipe);
    expect(JSON.parse(resolveThemeJson({ recipe }, 'recipe'))).toEqual(recipe);
  });
  it('rejects conflicts, malformed legacy and missing required objects', () => {
    expect(() =>
      resolveThemeObject({ recipe: {}, recipe_json: '{"name":"x"}' }, 'recipe'),
    ).toThrow('conflict');
    expect(() =>
      resolveThemeObject({ recipe: {}, recipe_json: '{' }, 'recipe'),
    ).toThrow('must encode an object');
    expect(() => resolveThemeObject({}, 'recipe')).toThrow('Provide recipe');
    expect(resolveThemeObject({}, 'options', true)).toEqual({});
  });
  it.each([null, [], 'text', 123])('rejects non-object %j', (value) => {
    expect(() => resolveThemeObject({ recipe: value }, 'recipe')).toThrow();
    expect(() =>
      resolveThemeObject({ recipe_json: JSON.stringify(value) }, 'recipe'),
    ).toThrow();
  });
});
