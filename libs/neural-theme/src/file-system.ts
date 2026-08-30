import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { compileTheme } from './compiler.js';
import type {
  NeuralThemeArtifacts,
  NeuralThemeBuildResult,
  NeuralThemePresetName,
  NeuralThemeRecipe,
} from './types.js';

export const DEFAULT_THEME_CONFIG = 'neural.theme.json';
export const DEFAULT_THEME_OUTPUT = 'src/styles/generated';

export async function loadThemeRecipe(
  path = DEFAULT_THEME_CONFIG,
): Promise<NeuralThemeRecipe> {
  const absolutePath = resolve(process.cwd(), path);
  let source: string;
  try {
    source = await readFile(absolutePath, 'utf8');
  } catch (error) {
    throw new Error(`Unable to read theme recipe at ${absolutePath}.`, {
      cause: error,
    });
  }
  try {
    return JSON.parse(
      stripTrailingCommas(stripJsonComments(source)),
    ) as NeuralThemeRecipe;
  } catch (error) {
    throw new Error(`Theme recipe ${absolutePath} is not valid JSON/JSONC.`, {
      cause: error,
    });
  }
}

export async function writeThemeArtifacts(
  artifacts: NeuralThemeArtifacts,
  outputDirectory = DEFAULT_THEME_OUTPUT,
): Promise<NeuralThemeBuildResult> {
  const absoluteDirectory = resolve(process.cwd(), outputDirectory);
  await mkdir(absoluteDirectory, { recursive: true });
  const files: Array<readonly [string, string]> = [
    [`${artifacts.name}.css`, artifacts.css],
  ];
  if (artifacts.enabledOutputs.tokens) {
    files.push([`${artifacts.name}.tokens.json`, artifacts.tokens]);
  }
  if (artifacts.enabledOutputs.report) {
    files.push([`${artifacts.name}.report.json`, artifacts.report]);
  }
  if (artifacts.enabledOutputs.types) {
    files.push([`${artifacts.name}.d.ts`, artifacts.types]);
  }
  for (const [filename, contents] of files) {
    await writeFile(join(absoluteDirectory, filename), contents, 'utf8');
  }
  return {
    outputDirectory: absoluteDirectory,
    files: files.map(([filename]) => join(absoluteDirectory, filename)),
    summary: artifacts.summary,
  };
}

export async function buildThemeFromFile(
  options: {
    readonly config?: string;
    readonly outputDirectory?: string;
  } = {},
): Promise<NeuralThemeBuildResult> {
  const recipe = await loadThemeRecipe(options.config);
  const artifacts = await compileTheme(recipe);
  return writeThemeArtifacts(artifacts, options.outputDirectory);
}

export async function writeInitialThemeRecipe(
  path = DEFAULT_THEME_CONFIG,
  preset: NeuralThemePresetName = 'neutral',
): Promise<string> {
  const absolutePath = resolve(process.cwd(), path);
  const schemaPath = './node_modules/@neural-ng/theme/schema.json';
  const recipe: NeuralThemeRecipe = {
    $schema: schemaPath,
    schemaVersion: 1,
    name: 'app',
    extends: preset,
    modes: {
      dark: 'auto',
    },
    output: {
      tailwind: true,
      tokens: true,
      report: true,
      types: true,
    },
    generator: {
      colorAlgorithm: 'neural-oklch-v1',
    },
  };
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, `${JSON.stringify(recipe, null, 2)}\n`, {
    encoding: 'utf8',
    flag: 'wx',
  });
  return absolutePath;
}

function stripJsonComments(source: string): string {
  let output = '';
  let inString = false;
  let escaped = false;
  let index = 0;
  while (index < source.length) {
    const character = source[index];
    const next = source[index + 1];
    if (inString) {
      output += character;
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') inString = false;
      index += 1;
      continue;
    }
    if (character === '"') {
      inString = true;
      output += character;
      index += 1;
      continue;
    }
    if (character === '/' && next === '/') {
      index += 2;
      while (index < source.length && source[index] !== '\n') index += 1;
      continue;
    }
    if (character === '/' && next === '*') {
      index += 2;
      while (
        index < source.length &&
        !(source[index] === '*' && source[index + 1] === '/')
      )
        index += 1;
      index += 2;
      continue;
    }
    output += character;
    index += 1;
  }
  return output;
}

function stripTrailingCommas(source: string): string {
  let output = '';
  let inString = false;
  let escaped = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (inString) {
      output += character;
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') {
      inString = true;
      output += character;
      continue;
    }
    if (character === ',') {
      let lookahead = index + 1;
      while (/\s/.test(source[lookahead] ?? '')) lookahead += 1;
      if (source[lookahead] === '}' || source[lookahead] === ']') continue;
    }
    output += character;
  }
  return output;
}
