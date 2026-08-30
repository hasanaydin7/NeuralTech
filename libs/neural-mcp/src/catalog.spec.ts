import { describe, expect, it } from 'vitest';
import {
  getComponentContract,
  getPackageCatalog,
  listComponents,
  recommendComponents,
  searchComponents,
} from './catalog.js';

describe('Neural MCP catalog', () => {
  it('covers public NeuralNg declarations and runtime entry points', () => {
    const components = listComponents();
    const packageCatalog = getPackageCatalog();

    expect(components.length).toBeGreaterThan(80);
    expect(packageCatalog.runtimeEntryPoints).toContain(
      '@neural-ng/core/checkbox',
    );
    expect(
      components.every((component) =>
        packageCatalog.runtimeEntryPoints.includes(component.entryPoint),
      ),
    ).toBe(true);
  });

  it('preserves the canonical Forms contracts', () => {
    expect(getComponentContract('neural-checkbox')).toMatchObject({
      id: 'checkbox',
      formContract: 'FormCheckboxControl',
      models: [{ name: 'checked', type: 'boolean' }],
    });
    expect(getComponentContract('NeuralTriStateCheckbox')).toMatchObject({
      id: 'tri-state-checkbox',
      formContract: 'FormValueControl<boolean | null>',
      models: [{ name: 'value', type: 'boolean | null' }],
    });
    expect(getComponentContract('neural-switch')).toMatchObject({
      id: 'switch',
      formContract: 'FormCheckboxControl',
      models: [{ name: 'checked', type: 'boolean' }],
    });
    expect(getComponentContract('neural-radio-group')).toMatchObject({
      id: 'radio-group',
      formContract: 'FormValueControl<TValue | null>',
      models: [{ name: 'value', type: 'TValue | null' }],
    });
    expect(getComponentContract('neural-select')).toMatchObject({
      id: 'select',
      formContract: 'FormValueControl<TValue | null>',
      models: [{ name: 'value', type: 'TValue | null' }],
    });
    expect(getComponentContract('neural-auto-complete')).toMatchObject({
      id: 'auto-complete',
      className: 'NeuralAutoComplete',
      status: 'beta',
      formContract: 'FormValueControl<TValue | string | null>',
      models: [
        { name: 'value', type: 'TValue | string | null' },
        { name: 'query', type: 'string' },
      ],
    });
    expect(getComponentContract('neural-multi-select')).toMatchObject({
      id: 'multi-select',
      formContract: 'FormValueControl<readonly TValue[]>',
      models: [
        { name: 'value', type: 'readonly TValue[]' },
        { name: 'filterValue', type: 'string' },
      ],
    });
    expect(getComponentContract('neural-tree-select')).toMatchObject({
      id: 'tree-select',
      formContract: 'FormValueControl<NeuralTreeSelectValue<TValue>>',
      models: [
        { name: 'value', type: 'NeuralTreeSelectValue<TValue>' },
        { name: 'expandedKeys', type: 'ReadonlySet<NeuralTreeKey>' },
        { name: 'filterValue', type: 'string' },
      ],
    });
  });

  it('publishes canonical Beta identity primitives', () => {
    expect(getComponentContract('neural-avatar')).toMatchObject({
      id: 'avatar',
      className: 'NeuralAvatar',
      status: 'beta',
    });
    expect(getComponentContract('neural-avatar-group')).toMatchObject({
      id: 'avatar-group',
      className: 'NeuralAvatarGroup',
      status: 'beta',
    });
  });

  it('searches deterministically', () => {
    const first = searchComponents('date calendar', 5);
    const second = searchComponents('date calendar', 5);

    expect(first).toEqual(second);
    expect(first[0]?.component.id).toBe('date-picker');
  });

  it('recommends tri-state checkbox for nullable inherited permission', () => {
    const matches = recommendComponents(
      'nullable inherited permission checkbox',
    );

    expect(matches[0]?.component.id).toBe('tri-state-checkbox');
    expect(matches[0]?.reason).toContain('boolean | null');
  });

  it('rejects traversal-like and unknown references', () => {
    expect(getComponentContract('../../package.json')).toBeUndefined();
    expect(getComponentContract('not-a-neural-component')).toBeUndefined();
  });
});
