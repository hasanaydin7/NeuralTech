import { z } from 'zod/v4';

const jsonObject = z.record(z.string(), z.json());
export function themeObjectFields(name: string) {
  return {
    [name]: jsonObject
      .optional()
      .describe(`Native ${name} object (preferred).`),
    [`${name}_json`]: z
      .string()
      .optional()
      .describe(`Legacy JSON-encoded ${name}; prefer ${name}.`),
  };
}

// Compare object keys independently of JSON serialization order. Array order matters.
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export function resolveThemeObject(
  input: Record<string, unknown>,
  name: string,
  optional = false,
): Record<string, unknown> {
  const native =
    input[name] === undefined ? undefined : jsonObject.parse(input[name]);
  let legacy: Record<string, unknown> | undefined;
  if (input[`${name}_json`] !== undefined) {
    try {
      legacy = jsonObject.parse(
        JSON.parse(z.string().parse(input[`${name}_json`])),
      );
    } catch {
      throw new TypeError(
        `${name}_json must encode an object; prefer the native ${name} object.`,
      );
    }
  }
  if (
    native !== undefined &&
    legacy !== undefined &&
    canonical(native) !== canonical(legacy)
  ) {
    throw new TypeError(
      `${name} and ${name}_json conflict. Send only ${name} or equivalent objects.`,
    );
  }
  const value = native ?? legacy;
  if (value === undefined && !optional)
    throw new TypeError(`Provide ${name} (object) or legacy ${name}_json.`);
  return value ?? {};
}

export function resolveThemeJson(
  input: Record<string, unknown>,
  name: string,
): string {
  return JSON.stringify(resolveThemeObject(input, name));
}
