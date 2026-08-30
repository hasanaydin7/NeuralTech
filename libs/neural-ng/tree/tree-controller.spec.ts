import {
  collectExpandableTreeKeys,
  filterNeuralTree,
  flattenNeuralTree,
  mapNeuralTreeOptions,
  NeuralTreeController,
} from './tree-controller';
import type { NeuralTreeNode } from './tree.types';

describe('Tree controller', () => {
  const nodes: readonly NeuralTreeNode[] = [
    {
      key: 'docs',
      label: 'Docs',
      children: [
        { key: 'api', label: 'API' },
        { key: 'guide', label: 'Guide' },
      ],
    },
    { key: 'lazy', label: 'Lazy', leaf: false },
  ];

  it('flattens only visible descendants with stable hierarchy metadata', () => {
    const collapsed = flattenNeuralTree(nodes, new Set());
    expect(collapsed.map((item) => item.key)).toEqual(['docs', 'lazy']);
    const expanded = flattenNeuralTree(nodes, new Set(['docs']));
    expect(expanded.map((item) => item.key)).toEqual([
      'docs',
      'api',
      'guide',
      'lazy',
    ]);
    expect(expanded[1]).toMatchObject({
      level: 2,
      parentKey: 'docs',
      posInSet: 1,
      setSize: 2,
      path: ['docs', 'api'],
    });
  });

  it('collects eager and declared lazy branches', () => {
    expect([...collectExpandableTreeKeys(nodes)]).toEqual(['docs', 'lazy']);
  });

  it('rejects duplicate keys and cyclic data', () => {
    expect(() =>
      flattenNeuralTree(
        [
          { key: 'same', label: 'One' },
          { key: 'same', label: 'Two' },
        ],
        new Set(),
      ),
    ).toThrow(/duplicate key/);
    expect(() =>
      flattenNeuralTree(
        [
          {
            key: 'collapsed',
            label: 'Collapsed',
            children: [
              { key: 'hidden-duplicate', label: 'One' },
              { key: 'hidden-duplicate', label: 'Two' },
            ],
          },
        ],
        new Set(),
      ),
    ).toThrow(/duplicate key/);
    const cyclic: { key: string; label: string; children?: unknown[] } = {
      key: 'cycle',
      label: 'Cycle',
    };
    cyclic.children = [cyclic];
    expect(() =>
      flattenNeuralTree(
        cyclic.children as readonly NeuralTreeNode[],
        new Set(['cycle']),
      ),
    ).toThrow(/cycle/);
  });

  it('filters immutably in lenient and strict modes with nested fields', () => {
    const frozen = Object.freeze([
      Object.freeze({
        key: 'team',
        label: 'Team',
        data: Object.freeze({ meta: Object.freeze({ owner: 'Ada' }) }),
        children: Object.freeze([
          Object.freeze({ key: 'design', label: 'Design' }),
          Object.freeze({ key: 'engineering', label: 'Engineering' }),
        ]),
      }),
    ]) satisfies readonly NeuralTreeNode<{ meta?: { owner: string } }>[];
    const nested = filterNeuralTree(frozen, 'ada', {
      fields: ['data.meta.owner'],
    });
    expect(nested.nodes[0]?.children).toHaveLength(2);
    expect(nested.matchedKeys.has('team')).toBe(true);
    const strict = filterNeuralTree(frozen, 'team', { mode: 'strict' });
    expect(strict.nodes[0]?.children).toHaveLength(0);
    expect(frozen[0]?.children).toHaveLength(2);
  });

  it('maps arbitrary option paths and resolves reusable controller state', () => {
    const mapped = mapNeuralTreeOptions(
      [
        {
          id: 1,
          meta: { title: 'Root' },
          items: [{ id: 2, meta: { title: 'Child' }, items: [] }],
        },
      ],
      {
        optionLabel: 'meta.title',
        optionValue: 'id',
        optionChildren: 'items',
      },
    );
    expect(mapped[0]).toMatchObject({ key: 1, label: 'Root' });
    expect(mapped[0]?.children?.[0]).toMatchObject({ key: 2, label: 'Child' });
    const resolved = new NeuralTreeController().resolve(mapped, {
      expandedKeys: new Set([1]),
      selectionKeys: new Set([2]),
      filterValue: 'child',
    });
    expect(resolved.visibleNodes.map((item) => item.key)).toEqual([1, 2]);
    expect(resolved.selectionKeys.has(2)).toBe(true);
  });

  it('separates a stable option key from an object form value', () => {
    const mapped = mapNeuralTreeOptions(
      [{ id: 'agent', label: 'Agent', value: { scope: 'global' } }],
      { optionKey: 'id', optionValue: 'value' },
    );
    expect(mapped[0]).toMatchObject({ key: 'agent', label: 'Agent' });
  });
});
