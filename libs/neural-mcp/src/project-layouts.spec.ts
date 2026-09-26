import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { inspectNeuralProject } from './project.js';

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe('project layout acceptance matrix', () => {
  it.each([
    ['angular.json', 'angular-cli', 'src/app'],
    ['nx.json', 'nx', 'apps/admin/src/app'],
    ['project.json', 'angular-package', 'src/lib'],
  ])(
    'inspects %s with Core + Editor without changing source',
    async (config, kind, sourcePath) => {
      const root = await mkdtemp(join(tmpdir(), 'neural-layout-'));
      roots.push(root);
      const source = join(root, sourcePath);
      await mkdir(source, { recursive: true });
      await writeFile(join(root, config), '{}');
      const manifest = JSON.stringify({
        dependencies: {
          '@angular/core': '22.1.7',
          '@neural-ng/core': '0.1.0-beta.8',
          '@neural-ng/editor': '0.1.0-beta.2',
        },
      });
      await writeFile(join(root, 'package.json'), manifest);
      for (const [name, version] of [
        ['core', '0.1.0-beta.8'],
        ['editor', '0.1.0-beta.2'],
      ]) {
        const directory = join(root, 'node_modules/@neural-ng', name);
        await mkdir(directory, { recursive: true });
        await writeFile(
          join(directory, 'package.json'),
          JSON.stringify({ name: `@neural-ng/${name}`, version }),
        );
      }
      const template = '<neural-button label="Save" /><neural-editor />';
      await writeFile(join(source, 'screen.html'), template);
      await writeFile(
        join(source, 'screen.ts'),
        `import { Component } from '@angular/core';
import { NeuralButton } from '@neural-ng/core/button';
import { NeuralEditor } from '@neural-ng/editor';
@Component({imports:[NeuralButton, NeuralEditor], templateUrl:'./screen.html'}) export class Screen {}`,
      );
      const result = await inspectNeuralProject(root);
      expect(result.workspaceConfig.kind).toBe(kind);
      expect(result.framework.installedEditorVersion).toBe('0.1.0-beta.2');
      expect(result.components.map((item) => item.entryPoint)).toEqual(
        expect.arrayContaining(['@neural-ng/core/button', '@neural-ng/editor']),
      );
      expect(
        result.diagnostics.filter((item) => item.severity === 'error'),
      ).toEqual([]);
      expect(result.analysis.compilationVerified).toBe(false);
      expect(await readFile(join(root, 'package.json'), 'utf8')).toBe(manifest);
      expect(await readFile(join(source, 'screen.html'), 'utf8')).toBe(
        template,
      );
    },
  );
});
