import { z } from 'zod/v4';

const names = z.array(z.string().trim().min(1));
export const validationInputSchema = z.object({
  template: z.string().min(1),
  imports: names
    .optional()
    .describe('Standalone declaration names, e.g. ["NeuralButton"].'),
  providers: names.optional().describe('Configured provider names.'),
  imports_json: z
    .string()
    .optional()
    .describe('Deprecated JSON-encoded array; prefer imports.'),
  providers_json: z
    .string()
    .optional()
    .describe('Deprecated JSON-encoded array; prefer providers.'),
});

export function resolveValidationInput(input: Record<string, unknown>) {
  const parsed = validationInputSchema.parse(input);
  function resolve(key: 'imports' | 'providers'): string[] {
    const typed = parsed[key];
    const legacy = parsed[`${key}_json`];
    let decoded: string[] | undefined;
    if (legacy !== undefined) {
      try {
        decoded = names.parse(JSON.parse(legacy));
      } catch {
        throw new TypeError(
          `${key}_json must be a JSON array of non-empty names; prefer ${key}: ["Name"].`,
        );
      }
    }
    if (typed && decoded) {
      const canonical = (values: string[]) =>
        JSON.stringify([...new Set(values)].sort());
      if (canonical(typed) !== canonical(decoded)) {
        throw new TypeError(
          `${key} and ${key}_json conflict. Send ${key} only or equivalent arrays.`,
        );
      }
    }
    return typed ?? decoded ?? [];
  }
  return {
    template: parsed.template,
    imports: resolve('imports'),
    providers: resolve('providers'),
  };
}
