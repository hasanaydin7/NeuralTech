import {
  NeuralTypeaheadController,
  findNextEnabledOption,
  matchesNeuralOption,
  readNeuralOptionPath,
  resolveNeuralOption,
  resolveNeuralVirtualRange,
} from './option-utils';

describe('shared option primitives', () => {
  it('resolves nested paths and preserves primitive fallback values', () => {
    expect(
      readNeuralOptionPath({ meta: { name: 'Signals' } }, 'meta.name'),
    ).toBe('Signals');
    expect(
      resolveNeuralOption('Angular', 0, { idPrefix: 'option' }),
    ).toMatchObject({ label: 'Angular', value: 'Angular' });
    expect(
      resolveNeuralOption({ meta: { id: 7, name: 'Angular' } }, 1, {
        idPrefix: 'option',
        labelPath: 'meta.name',
        valuePath: 'meta.id',
      }),
    ).toMatchObject({ id: 'option-1', label: 'Angular', value: 7 });
  });

  it('shares locale-aware filtering and disabled navigation', () => {
    const options = [
      { label: 'Disabled', disabled: true },
      { label: 'İstanbul', disabled: false },
    ];
    expect(
      matchesNeuralOption(
        { city: 'İstanbul' },
        'İstanbul',
        'istanbul',
        'city',
        'startsWith',
        'tr-TR',
      ),
    ).toBe(true);
    expect(findNextEnabledOption(options, -1, 1)).toBe(1);
    const typeahead = new NeuralTypeaheadController();
    expect(typeahead.push('i', options, 'tr-TR')).toBe(1);
    typeahead.destroy();
  });

  it('calculates a clamped overscanned virtual range without DOM state', () => {
    expect(
      resolveNeuralVirtualRange({
        itemCount: 1000,
        itemSize: 40,
        viewportSize: 240,
        scrollOffset: 4000,
        overscan: 2,
      }),
    ).toEqual({
      start: 98,
      end: 108,
      offsetBefore: 3920,
      offsetAfter: 35680,
      totalSize: 40000,
    });
  });
});
