import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { validateUsage } from '../src/validation.js';

function compile(mode: string): Promise<{ code: number; output: string }> {
  return new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      [fileURLToPath(new URL('./compile-consumer.mjs', import.meta.url)), mode],
      { timeout: 90_000, maxBuffer: 2 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error && typeof error.code !== 'number') {
          reject(error);
          return;
        }
        if (!stdout.trim()) {
          reject(new Error(stderr || 'Compiler returned no diagnostics'));
          return;
        }
        resolve({ code: error?.code ?? 0, output: stdout });
      },
    );
  });
}

describe('Real Angular consumer compilation', () => {
  it('compiles the connected user-management fixture under strictTemplates', async () => {
    const template = await readFile(
      new URL('./consumer/users.html', import.meta.url),
      'utf8',
    );
    const validation = validateUsage({
      template,
      imports: [
        'NeuralButton',
        'NeuralConfirmDialog',
        'NeuralDrawer',
        'NeuralInput',
        'NeuralPaginator',
        'NeuralSelect',
        'NeuralTable',
        'NeuralTableCellDirective',
        'NeuralToolbar',
      ],
    });
    expect(validation.diagnostics).toEqual([]);
    const result = await compile('valid');
    expect(result.output).toBe('[]');
    expect(result.code).toBe(0);
  }, 100_000);

  it('proves strict input type checking is active with an invalid paginator value', async () => {
    const result = await compile('invalid-type');
    expect(result.code).toBe(1);
    expect(JSON.parse(result.output)).toContainEqual(
      expect.objectContaining({
        message: expect.stringContaining("not assignable to type 'number'"),
      }),
    );
  }, 100_000);

  it('rejects a missing standalone import instead of hiding it with a schema', async () => {
    const result = await compile('missing-import');
    expect(result.code).toBe(1);
    expect(JSON.parse(result.output)).toContainEqual(
      expect.objectContaining({
        message: expect.stringContaining(
          "'neural-paginator' is not a known element",
        ),
      }),
    );
  }, 100_000);
});
