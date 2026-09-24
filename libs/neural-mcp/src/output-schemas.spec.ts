import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { getToolOutputSchema, toolOutputSchemas } from './output-schemas.js';
import {
  getComponentContract,
  getComponentExamples,
  listComponents,
  searchComponents,
  recommendComponents,
} from './catalog.js';
import { planUi } from './composition.js';
import { searchIcons } from './icons.js';
import { validateUsage } from './validation.js';
import { inspectNeuralProject, suggestConsistentUi } from './project.js';
import {
  createThemeRecipe,
  validateThemeRecipeJson,
  editThemeRecipeJson,
  diffThemeRecipeJson,
  getThemeComponentContract,
  compileThemeRecipeJson,
} from './theme.js';
import { registerContractTool } from './server.js';

describe('tool output contracts', () => {
  it('publishes stable JSON schemas for all 20 tools', () => {
    expect(Object.keys(toolOutputSchemas)).toHaveLength(20);
    const schemas = Object.fromEntries(
      Object.entries(toolOutputSchemas).map(([name, schema]) => [
        name,
        z.toJSONSchema(schema),
      ]),
    );
    for (const schema of Object.values(schemas))
      expect(schema.type).toBe('object');
    expect(schemas).toMatchSnapshot();
  });
  it('validates every component and rejects corrupted known fields', () => {
    for (const component of listComponents())
      expect(
        toolOutputSchemas.get_component_contract.safeParse({ component })
          .success,
        component.id,
      ).toBe(true);
    const component = getComponentContract('button');
    assert(component);
    expect(
      toolOutputSchemas.get_component.safeParse({
        component: { ...component, inputs: [{ name: 'x', required: 'yes' }] },
      }).success,
    ).toBe(false);
    expect(
      toolOutputSchemas.get_component_contract.safeParse({
        component: { ...component, schemaVersion: 999 },
      }).success,
    ).toBe(false);
  });
  it('validates actual outputs for every tool and invalid theme results', async () => {
    const root = await mkdtemp(join(tmpdir(), 'neural-output-contract-'));
    try {
      await writeFile(
        join(root, 'package.json'),
        JSON.stringify({ dependencies: { '@neural-ng/core': '0.1.0-beta.8' } }),
      );
      const component = getComponentContract('button');
      assert(component);
      const recipe = createThemeRecipe({
        name: 'contract-test',
        preset: 'neutral',
      });
      const recipeJson = JSON.stringify(recipe);
      const outputs: Record<string, unknown> = {
        search_components: { matches: searchComponents('button', 2) },
        recommend_components: {
          matches: recommendComponents('Save button', 2),
        },
        get_component: { component },
        get_component_contract: { component },
        get_component_examples: {
          component,
          examples: getComponentExamples('button', 1),
        },
        search_icons: { icons: searchIcons('search', { limit: 2 }) },
        validate_usage: {
          validation: validateUsage({
            template: '<neural-button icon="trash" />',
          }),
        },
        inspect_project: { inspection: await inspectNeuralProject(root) },
        suggest_consistent_ui: {
          suggestion: await suggestConsistentUi('User table', root),
        },
        create_theme_recipe: {
          recipe,
          validation: (await validateThemeRecipeJson(recipeJson)).validation,
        },
        validate_theme_recipe: await validateThemeRecipeJson(recipeJson),
        edit_theme_recipe: await editThemeRecipeJson(
          recipeJson,
          '{"set":{"color.primary":"blue"}}',
        ),
        diff_theme_recipes: {
          changes: diffThemeRecipeJson(recipeJson, '{"name":"other"}'),
        },
        get_component_theme_contract: await getThemeComponentContract(
          'button',
          true,
        ),
        compile_theme_recipe: await compileThemeRecipeJson(recipeJson),
      };
      outputs['inspect_neuralng_project'] = outputs['inspect_project'];
      for (const name of [
        'plan_ui',
        'suggest_form_structure',
        'suggest_page_structure',
        'suggest_table_structure',
      ])
        outputs[name] = { plan: planUi({ goal: 'User management table' }) };
      expect(Object.keys(outputs).sort()).toEqual(
        Object.keys(toolOutputSchemas).sort(),
      );
      for (const [name, output] of Object.entries(outputs))
        expect(getToolOutputSchema(name).safeParse(output).success, name).toBe(
          true,
        );
      expect(
        toolOutputSchemas.validate_theme_recipe.safeParse(
          await validateThemeRecipeJson('{'),
        ).success,
      ).toBe(true);
      expect(
        toolOutputSchemas.compile_theme_recipe.safeParse(
          await compileThemeRecipeJson('{'),
        ).success,
      ).toBe(true);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
  it('guards output and errors at registration', async () => {
    let handler:
      | ((input: Record<string, unknown>) => Promise<Record<string, unknown>>)
      | undefined;
    let config: Record<string, unknown> | undefined;
    const fake = {
      registerResource: () => undefined,
      registerTool: (
        _name: string,
        options: Record<string, unknown>,
        callback: NonNullable<typeof handler>,
      ) => {
        config = options;
        handler = callback;
      },
    };
    registerContractTool(fake, 'plan_ui', {}, async () => ({
      structuredContent: { plan: { goal: 'private-data' } },
    }));
    expect(config?.['outputSchema']).toBe(toolOutputSchemas.plan_ui);
    assert(handler);
    const malformed = await handler({});
    expect(malformed['isError']).toBe(true);
    expect(JSON.stringify(malformed)).not.toContain('private-data');
    const error = {
      isError: true,
      structuredContent: { error: { schemaVersion: 1, message: 'Bad input' } },
    };
    registerContractTool(fake, 'plan_ui', {}, async () => error);
    assert(handler);
    expect(await handler({})).toEqual(error);
    expect(() => getToolOutputSchema('invented')).toThrow(
      /Missing output contract/,
    );
  });
});
