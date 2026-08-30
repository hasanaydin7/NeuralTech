import { isHexColor } from './color.js';
import { toKebabCase } from './naming.js';
import { primarySeeds, surfacePalettes } from './palettes.js';
import {
  NEURAL_THEME_RECIPE_VERSION,
  type NeuralThemeContract,
  type NeuralThemeDiagnostic,
  type NeuralThemeRecipe,
  type NeuralThemeValidationResult,
} from './types.js';

const PRESETS = new Set(['neutral', 'glass', 'mist', 'futuristic']);
const DENSITIES = new Set(['compact', 'comfortable', 'spacious']);
const RADII = new Set(['none', 'small', 'medium', 'large', 'xlarge']);
const BORDERS = new Set(['none', 'subtle', 'default', 'strong']);
const ELEVATIONS = new Set(['none', 'soft', 'default', 'strong']);
const MOTIONS = new Set(['reduced', 'fast', 'default', 'slow']);
const TYPOGRAPHY_SCALES = new Set(['compact', 'default', 'large']);
const COLOR_KEYS = new Set([
  'primary',
  'surface',
  'info',
  'success',
  'warning',
  'danger',
  'error',
]);
const MODE_KEYS = new Set([
  'primary',
  'surface',
  'surfaceHover',
  'surfaceActive',
  'text',
  'textStrong',
  'textMuted',
  'border',
  'borderHover',
  'borderActive',
  'info',
  'success',
  'warning',
  'danger',
  'error',
]);

export function validateThemeRecipeWithContract(
  input: unknown,
  contract: NeuralThemeContract,
): NeuralThemeValidationResult {
  const diagnostics: NeuralThemeDiagnostic[] = [];
  if (!isRecord(input)) {
    return invalid('recipe.type', '$', 'Theme recipe must be a JSON object.');
  }

  const recipe = input as Partial<NeuralThemeRecipe>;
  if (
    typeof recipe.name !== 'string' ||
    !/^[a-z][a-z0-9-]*$/.test(recipe.name)
  ) {
    error(
      diagnostics,
      'recipe.name',
      'name',
      'Theme name must use lowercase kebab-case and start with a letter.',
    );
  }
  if (
    recipe.schemaVersion !== undefined &&
    recipe.schemaVersion !== NEURAL_THEME_RECIPE_VERSION
  ) {
    error(
      diagnostics,
      'recipe.version',
      'schemaVersion',
      `Only schemaVersion ${NEURAL_THEME_RECIPE_VERSION} is supported.`,
    );
  }
  if (recipe.extends !== undefined && !PRESETS.has(recipe.extends)) {
    error(
      diagnostics,
      'recipe.extends',
      'extends',
      'extends must be one of: neutral, glass, mist, futuristic.',
    );
  }

  validateEnum(diagnostics, recipe.density, DENSITIES, 'density');
  validateEnum(diagnostics, recipe.elevation, ELEVATIONS, 'elevation');
  validateEnum(diagnostics, recipe.motion, MOTIONS, 'motion');
  validateColorRecipe(diagnostics, recipe.color);

  if (recipe.typography !== undefined) {
    if (!isRecord(recipe.typography)) {
      error(
        diagnostics,
        'recipe.typography',
        'typography',
        'typography must be an object.',
      );
    } else {
      validateOptionalString(
        diagnostics,
        recipe.typography.sans,
        'typography.sans',
      );
      validateOptionalString(
        diagnostics,
        recipe.typography.mono,
        'typography.mono',
      );
      validateEnum(
        diagnostics,
        recipe.typography.scale,
        TYPOGRAPHY_SCALES,
        'typography.scale',
      );
    }
  }

  if (recipe.shape !== undefined) {
    if (!isRecord(recipe.shape)) {
      error(diagnostics, 'recipe.shape', 'shape', 'shape must be an object.');
    } else {
      if (
        recipe.shape.radius !== undefined &&
        typeof recipe.shape.radius !== 'string'
      ) {
        error(
          diagnostics,
          'recipe.radius',
          'shape.radius',
          'shape.radius must be a preset or CSS value.',
        );
      } else if (
        typeof recipe.shape.radius === 'string' &&
        !RADII.has(recipe.shape.radius) &&
        !looksLikeCssValue(recipe.shape.radius)
      ) {
        error(
          diagnostics,
          'recipe.radius',
          'shape.radius',
          'Custom radius must be a CSS length such as 0.75rem.',
        );
      }
      validateEnum(diagnostics, recipe.shape.border, BORDERS, 'shape.border');
    }
  }

  validateModes(diagnostics, recipe.modes);

  const tokenNames = new Set(contract.tokens.map((token) => token.name));
  if (recipe.components !== undefined) {
    if (!isRecord(recipe.components)) {
      error(
        diagnostics,
        'recipe.components',
        'components',
        'components must be an object.',
      );
    } else {
      for (const [component, values] of Object.entries(recipe.components)) {
        const normalizedComponent = toKebabCase(component);
        if (!contract.components[normalizedComponent]) {
          error(
            diagnostics,
            'recipe.component.unknown',
            `components.${component}`,
            `Unknown theme component ${JSON.stringify(component)}.`,
          );
          continue;
        }
        if (!isRecord(values)) {
          error(
            diagnostics,
            'recipe.component.type',
            `components.${component}`,
            'Component overrides must be an object.',
          );
          continue;
        }
        for (const [property, value] of Object.entries(values)) {
          const tokenName = `--neural-${normalizedComponent}-${toKebabCase(property)}`;
          if (!tokenNames.has(tokenName)) {
            error(
              diagnostics,
              'recipe.component.token',
              `components.${component}.${property}`,
              `Unknown component token ${tokenName}.`,
            );
          }
          validateTokenValue(
            diagnostics,
            value,
            `components.${component}.${property}`,
            tokenNames,
          );
        }
      }
    }
  }

  if (recipe.tokens !== undefined) {
    if (!isRecord(recipe.tokens)) {
      error(
        diagnostics,
        'recipe.tokens',
        'tokens',
        'tokens must be an object.',
      );
    } else {
      for (const [name, value] of Object.entries(recipe.tokens)) {
        if (!name.startsWith('--neural-')) {
          error(
            diagnostics,
            'recipe.token.name',
            `tokens.${name}`,
            'Advanced token names must start with --neural-.',
          );
        } else if (!tokenNames.has(name)) {
          error(
            diagnostics,
            'recipe.token.unknown',
            `tokens.${name}`,
            `Unknown Neural token ${name}.`,
          );
        }
        validateTokenValue(diagnostics, value, `tokens.${name}`, tokenNames);
      }
    }
  }

  if (
    recipe.generator?.colorAlgorithm !== undefined &&
    recipe.generator.colorAlgorithm !== 'neural-oklch-v1'
  ) {
    error(
      diagnostics,
      'recipe.generator.algorithm',
      'generator.colorAlgorithm',
      'Only neural-oklch-v1 is supported.',
    );
  }

  return {
    valid: !diagnostics.some((diagnostic) => diagnostic.severity === 'error'),
    diagnostics,
  };
}

function validateColorRecipe(
  diagnostics: NeuralThemeDiagnostic[],
  value: NeuralThemeRecipe['color'],
): void {
  if (value === undefined) return;
  if (!isRecord(value)) {
    error(diagnostics, 'recipe.color', 'color', 'color must be an object.');
    return;
  }
  for (const [name, color] of Object.entries(value)) {
    if (!COLOR_KEYS.has(name)) {
      error(
        diagnostics,
        'recipe.color.key',
        `color.${name}`,
        `Unknown color recipe key ${name}.`,
      );
      continue;
    }
    if (typeof color !== 'string') {
      error(
        diagnostics,
        'recipe.color.value',
        `color.${name}`,
        'Color values must be a palette name or hex color.',
      );
      continue;
    }
    if (name === 'primary' && (color in primarySeeds || isHexColor(color)))
      continue;
    if (name === 'surface' && (color in surfacePalettes || isHexColor(color)))
      continue;
    if (!isHexColor(color)) {
      error(
        diagnostics,
        'recipe.color.hex',
        `color.${name}`,
        'Custom colors must use three- or six-digit hex syntax.',
      );
    }
  }
}

function validateModes(
  diagnostics: NeuralThemeDiagnostic[],
  modes: NeuralThemeRecipe['modes'],
): void {
  if (modes === undefined) return;
  if (!isRecord(modes)) {
    error(diagnostics, 'recipe.modes', 'modes', 'modes must be an object.');
    return;
  }
  for (const [modeName, mode] of Object.entries(modes)) {
    if (modeName !== 'light' && modeName !== 'dark') {
      error(
        diagnostics,
        'recipe.mode.name',
        `modes.${modeName}`,
        `Unknown mode ${modeName}.`,
      );
      continue;
    }
    if (modeName === 'dark' && mode === 'auto') continue;
    if (!isRecord(mode)) {
      error(
        diagnostics,
        'recipe.mode.type',
        `modes.${modeName}`,
        'Mode must be an object or dark: "auto".',
      );
      continue;
    }
    for (const [key, color] of Object.entries(mode)) {
      if (!MODE_KEYS.has(key)) {
        error(
          diagnostics,
          'recipe.mode.key',
          `modes.${modeName}.${key}`,
          `Unknown mode color ${key}.`,
        );
      } else if (typeof color !== 'string' || !isHexColor(color)) {
        error(
          diagnostics,
          'recipe.mode.color',
          `modes.${modeName}.${key}`,
          'Mode colors must use hex syntax.',
        );
      }
    }
  }
}

function validateTokenValue(
  diagnostics: NeuralThemeDiagnostic[],
  value: unknown,
  path: string,
  knownTokens: ReadonlySet<string>,
): void {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      error(
        diagnostics,
        'recipe.token.number',
        path,
        'Numeric token values must be finite.',
      );
    }
    return;
  }
  if (typeof value !== 'string') {
    error(
      diagnostics,
      'recipe.token.value',
      path,
      'Token values must be strings or numbers.',
    );
    return;
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    error(
      diagnostics,
      'recipe.token.css.empty',
      path,
      'CSS token values cannot be empty.',
    );
    return;
  }
  if (normalized.length > 512) {
    error(
      diagnostics,
      'recipe.token.css.length',
      path,
      'CSS token values are limited to 512 characters.',
    );
  }
  const containsControlCharacter = [...normalized].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 0x1f || code === 0x7f;
  });
  if (
    normalized.includes(';') ||
    containsControlCharacter ||
    /\/\*|\*\//.test(normalized)
  ) {
    error(
      diagnostics,
      'recipe.token.css.unsafe',
      path,
      'CSS token values cannot contain declaration delimiters, comments, or control characters.',
    );
  }
  if (/(?:url|expression)\s*\(|@import|javascript:/i.test(normalized)) {
    error(
      diagnostics,
      'recipe.token.css.external',
      path,
      'External URLs, expressions, imports, and script-like CSS values are not allowed.',
    );
  }
  if (!hasBalancedDelimiters(normalized)) {
    error(
      diagnostics,
      'recipe.token.css.syntax',
      path,
      'CSS token value has unbalanced parentheses, brackets, or quotes.',
    );
  }

  const aliases = [...normalized.matchAll(/\{([^{}]+)\}/g)];
  const remainder = normalized.replace(/\{[^{}]+\}/g, '');
  if (/[{}]/.test(remainder)) {
    error(
      diagnostics,
      'recipe.token.alias.syntax',
      path,
      'Token aliases must use balanced {path.to.token} syntax.',
    );
  }
  for (const match of aliases) {
    const alias = match[1]?.trim() ?? '';
    const token = aliasToToken(alias);
    if (
      !alias ||
      (!knownTokens.has(token) && !token.startsWith('--neural-color-'))
    ) {
      error(
        diagnostics,
        'recipe.token.alias.unknown',
        path,
        `Unknown token alias {${alias}}.`,
      );
    }
  }
}

function aliasToToken(path: string): string {
  if (path.startsWith('--neural-')) return path;
  const parts = path.split('.').filter(Boolean);
  if (parts[0] === 'components') parts.shift();
  if (parts[0] === 'color') {
    return `--neural-color-${parts.slice(1).map(toKebabCase).join('-')}`;
  }
  return `--neural-${parts.map(toKebabCase).join('-')}`;
}

function hasBalancedDelimiters(value: string): boolean {
  const stack: string[] = [];
  let quote: '"' | "'" | null = null;
  let escaped = false;
  for (const character of value) {
    if (quote) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === '(' || character === '[') stack.push(character);
    else if (character === ')' || character === ']') {
      const expected = character === ')' ? '(' : '[';
      if (stack.pop() !== expected) return false;
    }
  }
  return quote === null && stack.length === 0;
}

function validateOptionalString(
  diagnostics: NeuralThemeDiagnostic[],
  value: unknown,
  path: string,
): void {
  if (
    value !== undefined &&
    (typeof value !== 'string' || value.trim() === '')
  ) {
    error(diagnostics, 'recipe.string', path, 'Expected a non-empty string.');
  }
}

function validateEnum(
  diagnostics: NeuralThemeDiagnostic[],
  value: unknown,
  allowed: ReadonlySet<string>,
  path: string,
): void {
  if (
    value !== undefined &&
    (typeof value !== 'string' || !allowed.has(value))
  ) {
    error(
      diagnostics,
      'recipe.enum',
      path,
      `Expected one of: ${[...allowed].join(', ')}.`,
    );
  }
}

function looksLikeCssValue(value: string): boolean {
  return /^(?:0|\d*\.?\d+(?:px|rem|em|%|ch|vw|vh))$/i.test(value.trim());
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function error(
  diagnostics: NeuralThemeDiagnostic[],
  code: string,
  path: string,
  message: string,
): void {
  diagnostics.push({ severity: 'error', code, path, message });
}

function invalid(
  code: string,
  path: string,
  message: string,
): NeuralThemeValidationResult {
  return {
    valid: false,
    diagnostics: [{ severity: 'error', code, path, message }],
  };
}
