import { describe, expect, it } from 'vitest';
import { validateUsage } from './validation.js';
import {
  getComponentContract,
  getComponentExamples,
  getPackageCatalog,
  listComponents,
  recommendComponents,
  searchComponents,
} from './catalog.js';

describe('Neural MCP catalog', () => {
  it('validates Editor APIs rather than merely suppressing unknown selectors', () => {
    const valid = validateUsage({
      template:
        '<neural-editor><ng-template neuralEditorToolbar></ng-template></neural-editor>',
      imports: ['NeuralEditor', 'NeuralEditorToolbarTemplate'],
    });
    expect(
      valid.diagnostics.some(
        (item) => item.code === 'NNG001' || item.code === 'NNG002',
      ),
    ).toBe(false);
    const invalid = validateUsage({
      template: '<neural-editor [inventedApi]="true" />',
      imports: ['NeuralEditor'],
    });
    expect(invalid.diagnostics.some((item) => item.code === 'NNG002')).toBe(
      true,
    );
    expect(
      validateUsage({ template: '<neural-imaginary />' }).diagnostics.some(
        (item) => item.code === 'NNG001',
      ),
    ).toBe(true);
  });
  it('browses a deterministic bounded catalog without a search term', () => {
    expect(searchComponents('', 3)).toHaveLength(3);
    expect(searchComponents('   ', 3)).toEqual(searchComponents('', 3));
    expect(searchComponents('', 999)).toHaveLength(20);
  });
  it('generates editor contracts with independent package identity', () => {
    const editor = getComponentContract('neural-editor');
    expect(editor).toMatchObject({
      entryPoint: '@neural-ng/editor',
      packageName: '@neural-ng/editor',
      packageVersion: '0.1.0-beta.2',
    });
    expect(editor?.inputs.length).toBeGreaterThan(10);
    expect(
      editor?.classes.some((item) => item.typeName === 'NeuralEditorClasses'),
    ).toBe(true);
    expect(
      searchComponents('rich text editor', 5).some(
        (match) => match.component.selector === 'neural-editor',
      ),
    ).toBe(true);
  });
  it('explains that table pagination needs separately rendered controls', () => {
    const paginate = getComponentContract('table')?.inputs.find(
      (input) => input.bindingName === 'paginate',
    );
    expect(paginate?.description).toContain('Does not render paging');
    expect(paginate?.description).toContain('@neural-ng/core/paginator');
    expect(paginate?.description).toContain('pageIndex/pageSize');
  });
  it('covers public NeuralNg declarations and runtime entry points', () => {
    const components = listComponents();
    const packageCatalog = getPackageCatalog();

    expect(components.length).toBeGreaterThan(80);
    expect(packageCatalog.runtimeEntryPoints).toContain(
      '@neural-ng/core/checkbox',
    );
    expect(
      components.every((component) =>
        [packageCatalog, ...(packageCatalog.companionPackages ?? [])].some(
          (pkg) => pkg.runtimeEntryPoints.includes(component.entryPoint),
        ),
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

  it('publishes typed class slots from the public source contract', () => {
    const select = getComponentContract('neural-select');
    const selectClasses = select?.classes.find(
      (contract) => contract.typeName === 'NeuralSelectClasses',
    );

    expect(selectClasses?.slots).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'root', type: 'string' }),
        expect.objectContaining({ name: 'panel', type: 'string' }),
        expect.objectContaining({ name: 'option', type: 'string' }),
      ]),
    );
    expect(selectClasses?.slots.every((slot) => slot.description)).toBe(true);
  });

  it('publishes structured Signal input, model and output contracts', () => {
    expect(getComponentContract('neural-button')).toMatchObject({
      schemaVersion: 2,
      inputs: expect.arrayContaining([
        {
          name: 'size',
          bindingName: 'size',
          type: 'NeuralButtonSize',
          required: false,
          defaultValue: "'medium'",
        },
        expect.objectContaining({
          name: 'rounded',
          type: 'boolean',
          transform: 'booleanAttribute',
        }),
      ]),
      outputs: expect.arrayContaining([
        expect.objectContaining({
          name: 'clicked',
          bindingName: 'clicked',
          type: 'MouseEvent',
        }),
      ]),
    });

    expect(getComponentContract('neural-select')).toMatchObject({
      inputs: expect.arrayContaining([
        expect.objectContaining({
          name: 'options',
          type: 'readonly TOption[]',
          defaultValue: '[]',
        }),
      ]),
      models: expect.arrayContaining([
        expect.objectContaining({
          name: 'value',
          bindingName: 'value',
          type: 'TValue | null',
          defaultValue: 'null',
        }),
      ]),
      outputs: expect.arrayContaining([
        expect.objectContaining({
          name: 'selectionChange',
          type: 'NeuralSelectChange<TValue, TOption>',
        }),
      ]),
    });

    expect(getComponentContract('neural-option')).toMatchObject({
      inputs: expect.arrayContaining([
        expect.objectContaining({
          name: 'value',
          required: true,
          type: 'unknown',
        }),
      ]),
    });
  });

  it('publishes typed templates, providers and executable documentation examples', () => {
    expect(getComponentContract('neural-table')).toMatchObject({
      templates: expect.arrayContaining([
        expect.objectContaining({
          className: 'NeuralTableCellDirective',
          selector: 'ng-template[neuralTableCell]',
          contextType: 'NeuralTableCellContext<T>',
        }),
      ]),
    });
    expect(getComponentContract('neural-toast')).toMatchObject({
      providers: expect.arrayContaining([
        expect.objectContaining({ name: 'provideNeuralToast' }),
      ]),
      providerRequirements: expect.arrayContaining([
        expect.objectContaining({
          name: 'provideNeuralMessages',
          requirement: 'required',
        }),
        expect.objectContaining({
          name: 'provideNeuralToast',
          requirement: 'optional',
        }),
      ]),
    });
    expect(getComponentContract('neural-table')).toMatchObject({
      methods: expect.arrayContaining([
        expect.objectContaining({
          name: 'startRowEdit',
          returnType: 'void',
        }),
        expect.objectContaining({
          name: 'saveEdit',
          returnType: 'Promise<boolean>',
        }),
      ]),
    });
    const examples = getComponentExamples('neural-select', 10);
    expect(examples.length).toBeGreaterThan(1);
    expect(
      examples.some((example) => example.code.includes('<neural-select')),
    ).toBe(true);
  });

  it('searches deterministically', () => {
    const first = searchComponents('date calendar', 5);
    const second = searchComponents('date calendar', 5);

    expect(first).toEqual(second);
    expect(first[0]?.component.id).toBe('date-picker');
  });

  it('gives canonical component ids priority over shared entry-point aliases', () => {
    expect(getComponentContract('table')?.className).toBe('NeuralTable');
    expect(getComponentContract('select')?.className).toBe('NeuralSelect');
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
