import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { inspectNeuralProject, suggestConsistentUi } from './project.js';

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe('Neural MCP project awareness', () => {
  it('detects installed packages, exact imports, appearance, theme and component usage', async () => {
    const root = await createWorkspace();
    const inspection = await inspectNeuralProject(root);

    expect(inspection.framework.angularVersion).toBe('^22.0.0');
    expect(inspection.framework.neuralPackages['@neural-ng/core']).toBe(
      '0.1.0-beta.8',
    );
    expect(inspection.themes).toContain('neutral');
    expect(inspection.appearance.providerConfigured).toBe(true);
    expect(inspection.conventions.importStyle).toBe('exact-entry-points');
    expect(inspection.components).toContainEqual(
      expect.objectContaining({ id: 'button', occurrences: 1 }),
    );
  });

  it('adapts a UI plan to components already used by the project', async () => {
    const root = await createWorkspace();
    const suggestion = await suggestConsistentUi(
      'Page with toolbar and save button',
      root,
    );

    expect(suggestion.consistency.reusedComponents).toContain('button');
    expect(suggestion.consistency.introducedComponents).toContain('toolbar');
    expect(suggestion.consistency.guidance.join(' ')).toContain('neutral');
  });

  it('runs correctness diagnostics across existing project templates', async () => {
    const root = await createWorkspace(
      '<neural-button icon="trash"></neural-button>',
    );
    const inspection = await inspectNeuralProject(root);

    expect(inspection.diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'NNG201',
        file: 'src/app/app.html',
        line: 1,
      }),
    );
  });
});

async function createWorkspace(
  template = '<neural-button label="Save" />',
): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'neural-project-'));
  roots.push(root);
  await mkdir(join(root, 'src', 'app'), { recursive: true });
  await writeFile(
    join(root, 'package.json'),
    JSON.stringify({
      dependencies: {
        '@angular/core': '^22.0.0',
        '@neural-ng/core': '0.1.0-beta.8',
      },
    }),
  );
  await writeFile(
    join(root, 'src', 'styles.css'),
    "@import '@neural-ng/core/themes/neutral.css';\n",
  );
  await writeFile(
    join(root, 'src', 'app', 'app.ts'),
    "import { NeuralButton } from '@neural-ng/core/button';\nimport { provideNeuralAppearance } from '@neural-ng/core/appearance';\nconst providers = [provideNeuralAppearance()];\n",
  );
  await writeFile(join(root, 'src', 'app', 'app.html'), template);
  return root;
}
