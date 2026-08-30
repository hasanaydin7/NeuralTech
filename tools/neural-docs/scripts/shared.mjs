import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
export const workspaceRoot = path.resolve(scriptDirectory, '../../..');

export function resolveWorkspace(relativePath) {
  const normalized = relativePath.replaceAll('\\', '/');
  const resolved = path.resolve(workspaceRoot, normalized);
  const relative = path.relative(workspaceRoot, resolved);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(
      `Documentation path escapes the workspace: ${relativePath}`,
    );
  }

  return resolved;
}

export async function readText(relativePath) {
  return readFile(resolveWorkspace(relativePath), 'utf8');
}

export async function readJson(relativePath) {
  return JSON.parse(await readText(relativePath));
}

export async function assertFile(relativePath) {
  const details = await stat(resolveWorkspace(relativePath)).catch(() => null);
  if (!details?.isFile()) {
    throw new Error(`Required documentation file is missing: ${relativePath}`);
  }
}

export function assertIncludes(source, expected, context) {
  if (!source.includes(expected)) {
    throw new Error(`${context} must include ${JSON.stringify(expected)}.`);
  }
}

export function routePath(route) {
  return route.replace(/^\/docs\//, '');
}
