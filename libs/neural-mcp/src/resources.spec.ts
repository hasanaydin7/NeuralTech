import { describe, expect, it } from 'vitest';
import { listNeuralResources, readNeuralResource } from './resources.js';

describe('Neural MCP resources', () => {
  it('lists fixed read-only resources in deterministic order', () => {
    const resources = listNeuralResources();
    const uris = resources.map((resource) => resource.uri);

    expect(resources.length).toBeGreaterThan(240);
    expect(uris).toEqual(
      [...uris].sort((left, right) => left.localeCompare(right, 'en')),
    );
    expect(uris).toContain('neural://catalog');
    expect(uris).toContain('neural://server/capabilities');
    expect(uris).toContain('neural://components/tri-state-checkbox/contract');
    expect(uris).toContain('neural://themes/schema');
    expect(uris).toContain('neural://themes/presets/neutral');
    expect(uris).toContain('neural://themes/presets/mist');
    expect(uris).toContain('neural://themes/ai-guide');
  });

  it('reads component docs and contracts without filesystem paths', () => {
    const contract = readNeuralResource(
      'neural://components/tri-state-checkbox/contract',
    );
    const llms = readNeuralResource('neural://components/checkbox/llms');

    expect(contract?.mimeType).toBe('application/json');
    expect(contract?.text).toContain('FormValueControl<boolean | null>');
    expect(llms?.text).toContain('Do not add triState back');
    expect(
      readNeuralResource('neural://components/../../package.json'),
    ).toBeUndefined();
  });

  it('exposes package and theme catalogs', () => {
    const capabilities = JSON.parse(
      readNeuralResource('neural://server/capabilities')?.text ?? '{}',
    );
    expect(capabilities.schemaVersion).toBe(1);
    expect(capabilities.toolGroups.composition).toContain('plan_ui');
    expect(capabilities.toolGroups.correctness).toContain('validate_usage');
    expect(capabilities.projectInspectionLimits.pathArgumentAccepted).toBe(
      false,
    );
    expect(capabilities.guarantees.writesProjectFiles).toBe(false);
    expect(
      capabilities.deprecatedTools.get_component_contract.replacement,
    ).toBe('get_component');
    expect(readNeuralResource('neural://package/exports')?.text).toContain(
      '@neural-ng/core/date-picker',
    );
    expect(readNeuralResource('neural://themes/catalog')?.text).toContain(
      '@neural-ng/core/themes/neutral.css',
    );
    expect(readNeuralResource('neural://themes/catalog')?.text).toContain(
      '@neural-ng/theme',
    );
    expect(readNeuralResource('neural://themes/schema')?.text).toContain(
      'compact sparse JSON recipe',
    );
    expect(
      readNeuralResource('neural://themes/presets/neutral')?.text,
    ).toContain('"name": "neutral"');
    expect(readNeuralResource('neural://themes/presets/mist')?.text).toContain(
      '"name": "mist"',
    );
    expect(readNeuralResource('neural://themes/presets')?.text).toContain(
      '"quality": "release"',
    );
    expect(readNeuralResource('neural://themes/ai-guide')?.text).toContain(
      'Never emit the resolved 1,348-token graph',
    );
  });
});
