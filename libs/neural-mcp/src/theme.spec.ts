import { describe, expect, it } from 'vitest';
import * as themeRuntimeModule from '@neural-ng/theme/browser';
import {
  compileThemeRecipeJson,
  createThemeRecipe,
  diffThemeRecipeJson,
  editThemeRecipeJson,
  formatJson,
  getThemeComponentContract,
  validateThemeRecipeJson,
  type NeuralThemeRuntime,
} from './theme.js';

const themeRuntime = themeRuntimeModule as unknown as NeuralThemeRuntime;

describe('Neural MCP theme tools', () => {
  it('creates and compiles recipes from built-in presets', async () => {
    const recipe = createThemeRecipe({
      name: 'glass-workspace',
      preset: 'glass',
    });
    const result = await compileThemeRecipeJson(
      formatJson(recipe),
      themeRuntime,
    );

    expect(recipe.extends).toBe('glass');
    expect(result.valid).toBe(true);
    expect(result.summary?.extends).toBe('glass');
    expect(result.summary?.quality.status).toBe('preview');
  });

  it('creates and validates a compact sparse recipe', async () => {
    const recipe = createThemeRecipe({
      name: 'violet-workspace',
      primary: '#7c3aed',
      surface: 'slate',
      radius: 'large',
      density: 'comfortable',
    });
    const result = await validateThemeRecipeJson(
      formatJson(recipe),
      themeRuntime,
    );

    expect(result.validation.valid).toBe(true);
    expect(result.recipe).toMatchObject({
      name: 'violet-workspace',
      color: { primary: '#7c3aed', surface: 'slate' },
      shape: { radius: 'large' },
    });
    expect(formatJson(recipe)).not.toContain('components');
  });

  it('applies safe sparse edits and rejects prototype paths', async () => {
    const source = formatJson(createThemeRecipe({ name: 'workspace' }));
    const edited = await editThemeRecipeJson(
      source,
      JSON.stringify({
        set: {
          'color.primary': '#0f766e',
          'shape.radius': 'xlarge',
        },
      }),
      themeRuntime,
    );
    const unsafe = await editThemeRecipeJson(
      source,
      JSON.stringify({ set: { '__proto__.polluted': true } }),
      themeRuntime,
    );

    expect(edited.validation.valid).toBe(true);
    expect(edited.recipe).toMatchObject({
      color: { primary: '#0f766e' },
      shape: { radius: 'xlarge' },
    });
    expect(unsafe.validation.valid).toBe(false);
    expect(unsafe.validation.diagnostics[0]?.code).toBe('recipe.patch');
  });

  it('diffs only changed compact recipe paths', () => {
    const left = formatJson(createThemeRecipe({ name: 'workspace' }));
    const right = formatJson(
      createThemeRecipe({
        name: 'workspace',
        primary: '#2563eb',
        density: 'compact',
      }),
    );

    expect(diffThemeRecipeJson(left, right)).toEqual([
      { path: 'color.primary', after: '#2563eb' },
      { path: 'density', after: 'compact' },
    ]);
  });

  it('compiles summary metadata without returning the full artifact bodies', async () => {
    const result = await compileThemeRecipeJson(
      formatJson(
        createThemeRecipe({
          name: 'ocean',
          primary: '#0369a1',
          surface: 'slate',
        }),
      ),
      themeRuntime,
    );

    expect(result.valid).toBe(true);
    expect(result.summary?.name).toBe('ocean');
    expect(result.artifacts?.css.bytes).toBeGreaterThan(10_000);
    expect(result).not.toHaveProperty('css');
    expect(result.integration?.cssImport).toContain('ocean.css');
  });

  it('returns component-scoped theme contracts with optional defaults', async () => {
    const names = await getThemeComponentContract(
      'button',
      false,
      themeRuntime,
    );
    const defaults = await getThemeComponentContract(
      'button',
      true,
      themeRuntime,
    );

    expect(names.tokenCount).toBeGreaterThan(20);
    expect(names.properties[0]).not.toHaveProperty('defaults');
    expect(defaults.properties[0]).toHaveProperty('defaults');
    expect(
      defaults.properties.some(
        (property) => property['token'] === '--neural-button-radius',
      ),
    ).toBe(true);
  });
});
