#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import {
  buildThemeFromFile,
  DEFAULT_THEME_CONFIG,
  DEFAULT_THEME_OUTPUT,
  loadThemeRecipe,
  writeInitialThemeRecipe,
} from './file-system.js';
import { migrateThemeRecipe } from './migration-core.js';
import { validateThemeRecipe } from './validate.js';

const [command = 'help', ...args] = process.argv.slice(2);
const flags = parseFlags(args);

try {
  switch (command) {
    case 'init': {
      const path = await writeInitialThemeRecipe(
        flags.config ?? DEFAULT_THEME_CONFIG,
        readPreset(flags.preset),
      );
      console.log(`Created ${path}.`);
      console.log(
        'Next: run `neural-theme build` and import the generated CSS.',
      );
      break;
    }
    case 'validate': {
      const recipe = await loadThemeRecipe(
        flags.config ?? DEFAULT_THEME_CONFIG,
      );
      const result = await validateThemeRecipe(recipe);
      printDiagnostics(result.diagnostics);
      if (!result.valid) process.exitCode = 1;
      else console.log(`Theme recipe ${JSON.stringify(recipe.name)} is valid.`);
      break;
    }
    case 'build': {
      const result = await buildThemeFromFile({
        config: flags.config ?? DEFAULT_THEME_CONFIG,
        outputDirectory: flags.outDir ?? DEFAULT_THEME_OUTPUT,
      });
      console.log(`Built Neural theme ${JSON.stringify(result.summary.name)}.`);
      console.log(`Output: ${result.outputDirectory}`);
      for (const file of result.files) console.log(`- ${file}`);
      break;
    }
    case 'migrate': {
      const config = flags.config ?? DEFAULT_THEME_CONFIG;
      const source = await loadThemeRecipe(config);
      const migration = migrateThemeRecipe(source);
      const validation = await validateThemeRecipe(migration.recipe);
      printDiagnostics(validation.diagnostics);
      if (!validation.valid) {
        process.exitCode = 1;
        break;
      }
      const output = `${JSON.stringify(migration.recipe, null, 2)}\n`;
      if (flags.outputFile) {
        const outputPath = resolve(process.cwd(), flags.outputFile);
        await mkdir(dirname(outputPath), { recursive: true });
        await writeFile(outputPath, output, 'utf8');
        console.log(
          `Migrated schema v${migration.fromVersion} → v${migration.toVersion}: ${outputPath}`,
        );
      } else {
        process.stdout.write(output);
      }
      if (migration.changes.length > 0) {
        console.error(`Applied: ${migration.changes.join(', ')}`);
      }
      break;
    }
    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;
    default:
      throw new Error(
        `Unknown command ${JSON.stringify(command)}. Run \`neural-theme help\`.`,
      );
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

function parseFlags(values: readonly string[]): {
  config?: string;
  outDir?: string;
  outputFile?: string;
  preset?: string;
} {
  const result: {
    config?: string;
    outDir?: string;
    outputFile?: string;
    preset?: string;
  } = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === '--config' || value === '-c')
      result.config = requiredValue(values, ++index, value);
    else if (value === '--out-dir' || value === '-o')
      result.outDir = requiredValue(values, ++index, value);
    else if (value === '--out')
      result.outputFile = requiredValue(values, ++index, value);
    else if (value === '--preset' || value === '-p')
      result.preset = requiredValue(values, ++index, value);
    else throw new Error(`Unknown option ${JSON.stringify(value)}.`);
  }
  return result;
}

function readPreset(
  value: string | undefined,
): 'neutral' | 'glass' | 'mist' | 'futuristic' {
  const preset = value ?? 'neutral';
  if (
    preset === 'neutral' ||
    preset === 'glass' ||
    preset === 'mist' ||
    preset === 'futuristic'
  ) {
    return preset;
  }
  throw new Error(
    `Unknown preset ${JSON.stringify(preset)}. Use neutral, glass, mist, or futuristic.`,
  );
}

function requiredValue(
  values: readonly string[],
  index: number,
  option: string,
): string {
  const value = values[index];
  if (!value || value.startsWith('-'))
    throw new Error(`${option} requires a value.`);
  return value;
}

function printDiagnostics(
  diagnostics: readonly { severity: string; path: string; message: string }[],
): void {
  for (const diagnostic of diagnostics) {
    const line = `${diagnostic.severity.toUpperCase()} ${diagnostic.path}: ${diagnostic.message}`;
    if (diagnostic.severity === 'error') console.error(line);
    else console.warn(line);
  }
}

function printHelp(): void {
  console.log(`Neural theme compiler

Usage:
  neural-theme init [--config neural.theme.json] [--preset neutral|glass|mist|futuristic]
  neural-theme validate [--config neural.theme.json]
  neural-theme build [--config neural.theme.json] [--out-dir src/styles/generated]
  neural-theme migrate [--config legacy.theme.json] [--out neural.theme.json]

The compact JSON recipe expands into complete Core + Editor CSS, a token
interchange document, a diagnostic report, and a generated theme-name type.`);
}
