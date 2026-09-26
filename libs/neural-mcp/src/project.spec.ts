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
  it('recognizes installed Editor and warns independently for its version mismatch', async () => {
    const root = await createWorkspace('<neural-editor />', ['NeuralEditor']);
    const directory = join(root, 'node_modules', '@neural-ng', 'editor');
    await mkdir(directory, { recursive: true });
    await writeFile(
      join(directory, 'package.json'),
      JSON.stringify({ name: '@neural-ng/editor', version: '0.1.0-beta.2' }),
    );
    const result = await inspectNeuralProject(root);
    expect(result.framework.installedEditorVersion).toBe('0.1.0-beta.2');
    expect(
      result.components.some(
        (component) => component.entryPoint === '@neural-ng/editor',
      ),
    ).toBe(true);
    expect(
      result.diagnostics.some(
        (item) => item.code === 'NNG001' || item.code === 'NNP010',
      ),
    ).toBe(false);
    await writeFile(
      join(directory, 'package.json'),
      JSON.stringify({ name: '@neural-ng/editor', version: '0.1.0-beta.0' }),
    );
    expect(
      (await inspectNeuralProject(root)).diagnostics.some(
        (item) => item.code === 'NNP010',
      ),
    ).toBe(true);
  });
  it('surfaces CSS warnings without claiming compilation or runtime verification', async () => {
    const root = await createWorkspace(
      '<div class="palette" [hidden]="closed"></div>',
    );
    await writeFile(
      join(root, 'src', 'styles.css'),
      '.palette { display: grid; }',
    );
    const result = await inspectNeuralProject(root);
    expect(result.diagnostics.some((item) => item.code === 'NNP011')).toBe(
      true,
    );
    expect(result.analysis.compilationVerified).toBe(false);
  });
  it('separates declaration alignment from verified installed version evidence', async () => {
    const root = await createWorkspace();
    const declared = await suggestConsistentUi('Save button', root);
    expect(declared.compatibility.status).toBe('aligned');
    expect(declared.compatibility.evidenceSource).toBe('declared');
    expect(declared.compatibility.contractUsability).toBe('review-required');
    expect(declared.projectContext.semanticConfidence).toBe('heuristic');
    expect(declared.projectContext.compilationVerified).toBe(false);
    const directory = join(root, 'node_modules', '@neural-ng', 'core');
    await mkdir(directory, { recursive: true });
    await writeFile(
      join(directory, 'package.json'),
      JSON.stringify({
        name: '@neural-ng/core',
        version: declared.compatibility.catalogCoreVersion,
      }),
    );
    const installed = await suggestConsistentUi('Save button', root);
    expect(installed.compatibility.evidenceSource).toBe('installed');
    expect(installed.compatibility.contractUsability).toBe('verified-version');
    expect(installed.compatibility.unverifiedAspects).toContain(
      'runtime behavior and complete accessibility compliance',
    );
    expect(installed.projectContext.compilationVerified).toBe(false);
  });

  it('does not claim authoritative APIs when Core is missing', async () => {
    const root = await createWorkspace();
    await writeFile(join(root, 'package.json'), '{}');
    const result = await suggestConsistentUi('Save button', root);
    expect(result.compatibility.contractUsability).toBe('unavailable');
    expect(result.compatibility.evidenceSource).toBe('missing');
    expect(result.compatibility.requiredActions.length).toBeGreaterThan(0);
  });

  it('prefers installed Core metadata over the dependency declaration', async () => {
    const root = await createWorkspace();
    const directory = join(root, 'node_modules', '@neural-ng', 'core');
    await mkdir(directory, { recursive: true });
    await writeFile(
      join(directory, 'package.json'),
      JSON.stringify({ name: '@neural-ng/core', version: '0.1.0-beta.7' }),
    );
    const inspection = await inspectNeuralProject(root);
    expect(inspection.framework.installedCoreVersion).toBe('0.1.0-beta.7');
    const suggestion = await suggestConsistentUi('Save button', root);
    expect(suggestion.compatibility).toEqual(
      expect.objectContaining({
        declaredCoreVersion: '0.1.0-beta.8',
        installedCoreVersion: '0.1.0-beta.7',
        status: 'review',
      }),
    );
  });

  it.each(['null', '[]', 'true'])(
    'reports an invalid package manifest without crashing: %s',
    async (manifest) => {
      const root = await createWorkspace();
      await writeFile(join(root, 'package.json'), manifest);
      const inspection = await inspectNeuralProject(root);
      expect(inspection.diagnostics).toContainEqual(
        expect.objectContaining({ code: 'NNP000' }),
      );
    },
  );

  it('excludes oversized sources and reports partial inspection', async () => {
    const root = await createWorkspace();
    await writeFile(
      join(root, 'src', 'oversized.ts'),
      'x'.repeat(256 * 1024 + 1),
    );
    const inspection = await inspectNeuralProject(root);
    expect(inspection.analysis.confidence).toBe('partial');
    expect(inspection.analysis.scanCoverage).toBe('partial');
    expect(inspection.analysis.semanticConfidence).toBe('insufficient');
    expect(inspection.analysis.compilationVerified).toBe(false);
  });

  it('applies the read limit to the package manifest as well', async () => {
    const root = await createWorkspace();
    await writeFile(
      join(root, 'package.json'),
      JSON.stringify({ padding: 'x'.repeat(256 * 1024) }),
    );
    const inspection = await inspectNeuralProject(root);
    expect(inspection.diagnostics).toContainEqual(
      expect.objectContaining({ code: 'NNP000' }),
    );
  });

  it('does not require independently released NeuralNg packages to share a version', async () => {
    const inspection = await inspectNeuralProject(await createWorkspace());
    expect(inspection.framework.neuralPackages['@neural-ng/icons']).toBe(
      '0.1.0-beta.0',
    );
    expect(inspection.diagnostics).not.toContainEqual(
      expect.objectContaining({ code: 'NNP002' }),
    );
  });

  it.each([
    '^0.1.0-beta.8',
    '~0.1.0-beta.8',
    '>=0.1.0-beta.8',
    'file:../core-0.1.0-beta.8',
    'latest',
  ])('requires resolved-version review for %s', async (version) => {
    const root = await createWorkspace();
    await writeFile(
      join(root, 'package.json'),
      JSON.stringify({
        dependencies: {
          '@angular/core': '^22.0.0',
          '@neural-ng/core': version,
        },
      }),
    );
    const suggestion = await suggestConsistentUi('Save button', root);
    expect(suggestion.compatibility.status).toBe('review');
    expect(suggestion.compatibility.contractUsability).toBe('review-required');
    expect(suggestion.compatibility.unverifiedAspects).toContain(
      'installed-version-specific selectors, inputs, outputs, imports and providers',
    );
  });

  it('detects installed packages, exact imports, appearance, theme and component usage', async () => {
    const root = await createWorkspace();
    const inspection = await inspectNeuralProject(root);

    expect(inspection.schemaVersion).toBe(2);
    expect(inspection.workspaceConfig).toEqual({
      kind: 'angular-cli',
      packageManager: 'npm',
    });
    expect(inspection.analysis.engine).toBe('@angular/compiler');
    expect(inspection.analysis.confidence).toBe('complete');
    expect(inspection.analysis.scanCoverage).toBe('complete');
    expect(inspection.analysis.semanticConfidence).toBe('heuristic');
    expect(inspection.analysis.metadataStrategy).toBe('static-heuristic');
    expect(inspection.analysis.compilationVerified).toBe(false);
    expect(inspection.framework.angularVersion).toBe('^22.0.0');
    expect(inspection.framework.versionSource).toBe('package.json');
    expect(inspection.framework.neuralPackages['@neural-ng/core']).toBe(
      '0.1.0-beta.8',
    );
    expect(inspection.themes).toContain('neutral');
    expect(inspection.appearance.providerConfigured).toBe(true);
    expect(inspection.conventions.importStyle).toBe('exact-entry-points');
    expect(inspection.imports['@neural-ng/core/button']).toEqual([
      'NeuralButton',
    ]);
    expect(inspection.components).toContainEqual(
      expect.objectContaining({ id: 'button', occurrences: 1 }),
    );
    expect(inspection.summary).toEqual(
      expect.objectContaining({
        componentKinds: 1,
        componentOccurrences: 1,
        templateCount: 1,
      }),
    );
    expect(inspection.templates).toContainEqual(
      expect.objectContaining({
        file: 'src/app/app.html',
        owner: 'src/app/app.ts',
        importsSource: 'component-metadata',
      }),
    );
  });

  it('adapts a UI plan to components already used by the project', async () => {
    const root = await createWorkspace();
    const suggestion = await suggestConsistentUi(
      'Page with toolbar and save button',
      root,
    );

    expect(suggestion.schemaVersion).toBe(2);
    expect(suggestion.compatibility).toEqual(
      expect.objectContaining({ status: 'aligned' }),
    );
    expect(suggestion.projectContext).toEqual(
      expect.objectContaining({
        inspectionSchemaVersion: 2,
        confidence: 'complete',
        theme: { mode: 'detected', name: 'neutral' },
      }),
    );
    expect(suggestion.consistency.reusedComponents).toContain('button');
    expect(suggestion.consistency.introducedComponents).toContain('toolbar');
    expect(suggestion.consistency.components).toContainEqual(
      expect.objectContaining({
        id: 'button',
        decision: 'reuse',
        occurrences: 1,
        evidence: ['src/app/app.html'],
      }),
    );
    expect(suggestion.consistency.imports.reuse).toEqual(
      expect.objectContaining({
        '@neural-ng/core/button': ['NeuralButton'],
      }),
    );
    expect(suggestion.consistency.imports.add).toHaveProperty(
      '@neural-ng/core/toolbar',
    );
    expect(suggestion.consistency.theme.decision).toBe('preserve');
    expect(suggestion.consistency.guidance.join(' ')).toContain('neutral');
    expect(suggestion.consistency.nextTools.at(-1)).toContain('validate_usage');
  });

  it('returns required provider deltas and a forced plan kind', async () => {
    const root = await createWorkspace();
    const suggestion = await suggestConsistentUi(
      'Show a toast after saving the form',
      root,
      'form',
    );

    expect(suggestion.plan.kind).toBe('form');
    expect(suggestion.consistency.providers.add).toContain(
      'provideNeuralMessages',
    );
    expect(suggestion.consistency.guidance.join(' ')).toContain(
      'provideNeuralMessages',
    );
  });

  it('requires version review when project and catalog prereleases differ', async () => {
    const root = await createWorkspace();
    await writeFile(
      join(root, 'package.json'),
      JSON.stringify({
        dependencies: {
          '@angular/core': '^22.0.0',
          '@neural-ng/core': '0.1.0-beta.7',
        },
      }),
    );

    const suggestion = await suggestConsistentUi('Save button', root);

    expect(suggestion.compatibility).toEqual(
      expect.objectContaining({
        declaredCoreVersion: '0.1.0-beta.7',
        catalogCoreVersion: '0.1.0-beta.8',
        status: 'review',
      }),
    );
  });

  it('prioritizes risks from files that contain selected components', async () => {
    const root = await createWorkspace(
      '<neural-button icon="trash"></neural-button>',
    );
    const suggestion = await suggestConsistentUi('Save button', root);

    expect(suggestion.consistency.risks[0]).toEqual(
      expect.objectContaining({
        code: 'NNG201',
        evidence: 'src/app/app.html:1',
      }),
    );
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

  it('detects attribute directives and invented component bindings through the Angular AST', async () => {
    const root = await createWorkspace(
      '<input neuralInput aria-label="Search" />\n<neural-button [madeUp]="true">Save</neural-button>',
      ['NeuralButton', 'NeuralInput'],
    );
    const inspection = await inspectNeuralProject(root);

    expect(inspection.components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'button' }),
        expect.objectContaining({ id: 'neural-input' }),
      ]),
    );
    expect(inspection.diagnostics).toContainEqual(
      expect.objectContaining({ code: 'NNG002', file: 'src/app/app.html' }),
    );
  });

  it('inspects inline Angular templates with their owning component imports', async () => {
    const root = await createWorkspace('<p>External shell</p>');
    await writeFile(
      join(root, 'src', 'app', 'inline.ts'),
      "import { Component } from '@angular/core';\nimport { NeuralButton } from '@neural-ng/core/button';\n@Component({ imports: [NeuralButton], template: `<neural-button label=\"Run\" />` })\nexport class InlineComponent {}\n",
    );

    const inspection = await inspectNeuralProject(root);

    expect(inspection.templates).toContainEqual(
      expect.objectContaining({
        file: 'src/app/inline.ts',
        kind: 'inline',
        owner: 'src/app/inline.ts',
        components: ['button'],
      }),
    );
  });

  it('inventories imports from the separate editor package without hiding its catalog boundary', async () => {
    const root = await createWorkspace();
    await writeFile(
      join(root, 'src', 'app', 'editor.ts'),
      "import { NeuralEditor, type NeuralEditorDocument } from '@neural-ng/editor';\nexport const editor = NeuralEditor;\n",
    );

    const inspection = await inspectNeuralProject(root);

    expect(inspection.imports['@neural-ng/editor']).toEqual([
      'NeuralEditor',
      'NeuralEditorDocument',
    ]);
    expect(inspection.analysis.limitations.join(' ')).toContain(
      'generated MCP catalog',
    );
  });

  it('keeps imports isolated between multiple component decorators', async () => {
    const root = await createWorkspace('<p>External shell</p>');
    await writeFile(
      join(root, 'src', 'app', 'siblings.ts'),
      "import { Component } from '@angular/core';\nimport { NeuralButton } from '@neural-ng/core/button';\nimport { NeuralTag } from '@neural-ng/core/tag';\n@Component({ imports: [NeuralButton], template: `<neural-button label=\"Run\" />` }) export class First {}\n@Component({ imports: [NeuralTag], template: `<neural-tag value=\"Ready\" />` }) export class Second {}\n",
    );

    const inspection = await inspectNeuralProject(root);
    const siblings = inspection.templates.filter(
      (template) => template.file === 'src/app/siblings.ts',
    );

    expect(siblings).toHaveLength(2);
    expect(siblings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ components: ['button'], valid: true }),
        expect.objectContaining({ components: ['tag'], valid: true }),
      ]),
    );
  });

  it('reports exact icon usage, stylesheet conventions and invented icon classes', async () => {
    const root = await createWorkspace(
      '<neural-button label="Delete" icon="nt nt-trash" />\n<i class="nt nt-filled-bell" aria-hidden="true"></i>\n<i class="nt nt-definitely-not-a-neural-icon-xyz"></i>',
    );
    await writeFile(
      join(root, 'src', 'styles.css'),
      "@import '@neural-ng/core/themes/neutral.css';\n@import '@neural-ng/icons/categories/system.css';\n",
    );

    const inspection = await inspectNeuralProject(root);

    expect(inspection.icons.packageVersion).toBe('0.1.0-beta.0');
    expect(inspection.icons.stylesheets).toContain('categories/system.css');
    expect(inspection.icons.usages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'trash', style: 'outline' }),
        expect.objectContaining({ name: 'bell', style: 'filled' }),
      ]),
    );
    expect(inspection.diagnostics).toContainEqual(
      expect.objectContaining({ code: 'NNP008', severity: 'error' }),
    );
  });

  it('ignores an incomplete filled icon prefix used to compose class names', async () => {
    const root = await createWorkspace(
      '<neural-button label="Save" icon="nt nt-save" />',
    );
    await writeFile(
      join(root, 'src', 'app', 'icons.ts'),
      "const prefix = active ? 'nt-filled-' : 'nt-';\n",
    );

    const inspection = await inspectNeuralProject(root);

    expect(inspection.diagnostics).not.toContainEqual(
      expect.objectContaining({
        code: 'NNP008',
        message: expect.stringContaining('nt-filled'),
      }),
    );
  });

  it('caps repeated evidence paths while preserving aggregate counts', async () => {
    const root = await createWorkspace();
    for (let index = 0; index < 30; index += 1) {
      await writeFile(
        join(root, 'src', 'app', `usage-${index}.html`),
        '<neural-button label="Save" />',
      );
    }

    const inspection = await inspectNeuralProject(root);
    const button = inspection.components.find((item) => item.id === 'button');

    expect(button?.occurrences).toBe(31);
    expect(button?.files).toHaveLength(25);
    expect(button?.filesOmitted).toBe(6);
    expect(inspection.summary.componentOccurrences).toBe(31);
  });
});

async function createWorkspace(
  template = '<neural-button label="Save" />',
  componentImports = ['NeuralButton'],
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
        '@neural-ng/icons': '0.1.0-beta.0',
      },
    }),
  );
  await writeFile(join(root, 'angular.json'), '{}');
  await writeFile(join(root, 'package-lock.json'), '{}');
  await writeFile(
    join(root, 'src', 'styles.css'),
    "@import '@neural-ng/core/themes/neutral.css';\n",
  );
  await writeFile(
    join(root, 'src', 'app', 'app.ts'),
    `import { Component } from '@angular/core';\nimport { NeuralButton } from '@neural-ng/core/button';\nimport { NeuralInput } from '@neural-ng/core/input';\nimport { provideNeuralAppearance } from '@neural-ng/core/appearance';\n@Component({ imports: [${componentImports.join(', ')}], templateUrl: './app.html' })\nexport class App {}\nconst providers = [provideNeuralAppearance()];\n`,
  );
  await writeFile(join(root, 'src', 'app', 'app.html'), template);
  return root;
}
