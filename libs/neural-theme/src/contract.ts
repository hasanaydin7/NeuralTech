import { readFile } from 'node:fs/promises';
import { toKebabCase } from './naming.js';
import { getThemePresetQuality } from './preset-quality.js';
import type {
  NeuralThemeContract,
  NeuralThemePresetDefinition,
  NeuralThemePresetName,
  NeuralThemePresetSummary,
  NeuralThemeTokenContractEntry,
} from './types.js';

let contractPromise: Promise<NeuralThemeContract> | undefined;
let presetsPromise:
  | Promise<
      Readonly<Record<NeuralThemePresetName, NeuralThemePresetDefinition>>
    >
  | undefined;

export function loadThemeContract(): Promise<NeuralThemeContract> {
  contractPromise ??= readJson<NeuralThemeContract>(
    new URL('../assets/contracts/neutral.tokens.json', import.meta.url),
  );
  return contractPromise;
}

export function loadThemePresets(): Promise<
  Readonly<Record<NeuralThemePresetName, NeuralThemePresetDefinition>>
> {
  presetsPromise ??= readJson<
    Readonly<Record<NeuralThemePresetName, NeuralThemePresetDefinition>>
  >(new URL('../assets/presets/built-ins.json', import.meta.url));
  return presetsPromise;
}

export async function listThemePresets(): Promise<
  readonly NeuralThemePresetSummary[]
> {
  const presets = await loadThemePresets();
  return Object.values(presets)
    .map(toPresetSummary)
    .sort((left, right) => left.id.localeCompare(right.id, 'en'));
}

export async function getThemePreset(
  preset: NeuralThemePresetName,
): Promise<NeuralThemePresetSummary | undefined> {
  const presets = await loadThemePresets();
  const definition = presets[preset];
  return definition ? toPresetSummary(definition) : undefined;
}

export async function getComponentThemeContract(
  component: string,
): Promise<readonly NeuralThemeTokenContractEntry[]> {
  const contract = await loadThemeContract();
  const normalized = toKebabCase(component);
  return contract.tokens.filter((token) => token.component === normalized);
}

export async function listThemeComponents(): Promise<readonly string[]> {
  const contract = await loadThemeContract();
  return Object.keys(contract.components).sort((left, right) =>
    left.localeCompare(right, 'en'),
  );
}

export { toKebabCase } from './naming.js';

function toPresetSummary(
  preset: NeuralThemePresetDefinition,
): NeuralThemePresetSummary {
  return {
    id: preset.id,
    label: preset.label,
    description: preset.description,
    stability: preset.stability,
    quality: getThemePresetQuality(preset.id),
    primary: preset.primary,
    surface: preset.surface,
    density: preset.density,
    radius: preset.radius,
    elevation: preset.elevation,
    motion: preset.motion,
  };
}

async function readJson<T>(url: URL): Promise<T> {
  return JSON.parse(await readFile(url, 'utf8')) as T;
}
