import {
  NEURAL_THEME_RECIPE_VERSION,
  type NeuralThemeRecipe,
  type NeuralThemeRecipeMigrationResult,
} from './types.js';

const LEGACY_KEYS = new Set([
  'version',
  'preset',
  'colors',
  'radius',
  'componentOverrides',
  'tokenOverrides',
]);

/**
 * Upgrade a compact recipe to the current schema without compiling it.
 *
 * Version 0 was the pre-schema preview shape used by early Theme Studio
 * prototypes. Unknown properties are preserved so validation can report them
 * instead of silently discarding author intent.
 */
export function migrateThemeRecipe(
  input: unknown,
): NeuralThemeRecipeMigrationResult {
  if (!isRecord(input)) {
    throw new TypeError('Theme recipe migration requires a JSON object.');
  }

  const source = cloneRecord(input);
  const declaredVersion = readDeclaredVersion(source);
  if (declaredVersion > NEURAL_THEME_RECIPE_VERSION) {
    throw new Error(
      `Theme recipe schemaVersion ${declaredVersion} is newer than supported version ${NEURAL_THEME_RECIPE_VERSION}.`,
    );
  }

  const usesLegacyVersionKey =
    'version' in source && !('schemaVersion' in source);
  const hasLegacyKeys = Object.keys(source).some(
    (key) => key !== 'version' && LEGACY_KEYS.has(key),
  );
  const hasLegacyShape =
    declaredVersion === 0 || usesLegacyVersionKey || hasLegacyKeys;
  const fromVersion =
    declaredVersion === 0 ||
    usesLegacyVersionKey ||
    (!('schemaVersion' in source) && hasLegacyKeys)
      ? 0
      : NEURAL_THEME_RECIPE_VERSION;
  const changes: string[] = [];

  if (hasLegacyShape) {
    moveIfMissing(source, 'preset', 'extends', changes);
    moveIfMissing(source, 'colors', 'color', changes);
    moveIfMissing(source, 'componentOverrides', 'components', changes);
    moveIfMissing(source, 'tokenOverrides', 'tokens', changes);

    if (source['radius'] !== undefined) {
      const shape = isRecord(source['shape'])
        ? cloneRecord(source['shape'])
        : {};
      if (shape['radius'] === undefined) {
        shape['radius'] = source['radius'];
        changes.push('radius → shape.radius');
      } else {
        changes.push('removed radius because shape.radius already exists');
      }
      source['shape'] = shape;
      delete source['radius'];
    }

    if ('version' in source) {
      delete source['version'];
      changes.push('removed legacy version');
    }
  }

  if (source['schemaVersion'] !== NEURAL_THEME_RECIPE_VERSION) {
    source['schemaVersion'] = NEURAL_THEME_RECIPE_VERSION;
    changes.push(`schemaVersion → ${NEURAL_THEME_RECIPE_VERSION}`);
  }

  return {
    fromVersion,
    toVersion: NEURAL_THEME_RECIPE_VERSION,
    changed: changes.length > 0,
    changes,
    recipe: source as unknown as NeuralThemeRecipe,
  };
}

function readDeclaredVersion(source: Record<string, unknown>): number {
  const value = source['schemaVersion'] ?? source['version'];
  if (value === undefined) return NEURAL_THEME_RECIPE_VERSION;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error('Theme recipe version must be a non-negative integer.');
  }
  return value;
}

function moveIfMissing(
  source: Record<string, unknown>,
  legacyKey: string,
  currentKey: string,
  changes: string[],
): void {
  if (!(legacyKey in source)) return;
  if (source[currentKey] === undefined) {
    source[currentKey] = source[legacyKey];
    changes.push(`${legacyKey} → ${currentKey}`);
  } else {
    changes.push(`removed ${legacyKey} because ${currentKey} already exists`);
  }
  delete source[legacyKey];
}

function cloneRecord(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]),
  );
}

function cloneValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(cloneValue);
  if (isRecord(value)) return cloneRecord(value);
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
