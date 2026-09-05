import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getComponentContract } from '../src/catalog.js';
import { planUi } from '../src/composition.js';
import { suggestConsistentUi } from '../src/project.js';
import { validateUsage } from '../src/validation.js';

interface EvaluationScenario {
  readonly id: string;
  readonly goal: string;
  readonly kind: 'table';
  readonly expectedComponents: readonly string[];
  readonly requiredGates: readonly string[];
}

interface EvaluationManifest {
  readonly schemaVersion: 1;
  readonly suite: string;
  readonly compositionCases: readonly {
    readonly id: string;
    readonly goal: string;
    readonly expected: readonly string[];
    readonly forbidden?: readonly string[];
  }[];
  readonly scenarios: readonly EvaluationScenario[];
}

let workspace = '';
let manifest: EvaluationManifest;

beforeAll(async () => {
  manifest = JSON.parse(
    await readFile(new URL('./manifest.json', import.meta.url), 'utf8'),
  ) as EvaluationManifest;
  workspace = await createAcceptanceWorkspace();
});

afterAll(async () => {
  if (workspace) await rm(workspace, { recursive: true, force: true });
});

describe('MCP beta-exit evaluation package', () => {
  it('publishes a versioned acceptance manifest with every required gate', () => {
    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.suite).toBe('mcp-beta-exit');
    expect(manifest.scenarios[0]?.requiredGates).toEqual(
      expect.arrayContaining([
        'project-version',
        'theme-and-patterns',
        'composition',
        'exact-contracts',
        'valid-template',
        'accessibility-rejection',
        'provider-rejection',
        'invented-api-rejection',
      ]),
    );
  });

  it.each(Array.from({ length: 10 }, (_, index) => index))(
    'passes deterministic composition regression case %s',
    (index) => {
      const evaluation = manifest.compositionCases[index];
      expect(evaluation, `missing composition case ${index}`).toBeDefined();
      const selected = planUi({ goal: evaluation.goal }).components.map(
        (component) => component.id,
      );
      expect(selected, evaluation.id).toEqual(
        expect.arrayContaining([...evaluation.expected]),
      );
      for (const forbidden of evaluation.forbidden ?? []) {
        expect(selected, evaluation.id).not.toContain(forbidden);
      }
    },
  );

  it('completes the existing-project user-management planning chain', async () => {
    const scenario = manifest.scenarios[0];
    expect(scenario).toBeDefined();
    const suggestion = await suggestConsistentUi(
      scenario.goal,
      workspace,
      scenario.kind,
    );
    const selected = suggestion.plan.components.map(
      (component) => component.id,
    );

    expect(suggestion.schemaVersion).toBe(2);
    expect(suggestion.projectContext.angularVersion).toBe('^22.0.0');
    expect(suggestion.compatibility).toEqual(
      expect.objectContaining({
        status: 'aligned',
        declaredCoreVersion: '0.1.0-beta.8',
        catalogCoreVersion: '0.1.0-beta.8',
      }),
    );
    expect(suggestion.projectContext.theme).toEqual({
      mode: 'detected',
      name: 'neutral',
    });
    expect(selected).toEqual(
      expect.arrayContaining([...scenario.expectedComponents]),
    );
    expect(suggestion.consistency.reusedComponents).toEqual(
      expect.arrayContaining(['table', 'neural-input']),
    );
    expect(suggestion.consistency.introducedComponents).toEqual(
      expect.arrayContaining(['select', 'neural-drawer', 'confirm-dialog']),
    );

    for (const component of suggestion.plan.components) {
      const contract = getComponentContract(component.id);
      expect(contract, `missing contract for ${component.id}`).toBeDefined();
      expect(suggestion.plan.imports[component.entryPoint]).toContain(
        component.className,
      );
    }

    const validation = validateUsage({
      template: validUserManagementTemplate,
      imports: Object.values(suggestion.plan.imports).flat(),
      providers: suggestion.plan.providers.map((provider) => provider.name),
    });
    expect(validation.syntax.valid).toBe(true);
    expect(validation.valid).toBe(true);
    expect(validation.summary.errors).toBe(0);
  });

  it('rejects invented APIs, inaccessible icon actions and missing providers', () => {
    const inventedApi = validateUsage({
      template: '<neural-table [columns]="columns" [inventedRows]="users" />',
      imports: ['NeuralTable'],
    });
    expect(inventedApi.diagnostics).toContainEqual(
      expect.objectContaining({ code: 'NNG002', severity: 'error' }),
    );

    const inaccessibleAction = validateUsage({
      template: '<neural-button icon="nt nt-trash" />',
      imports: ['NeuralButton'],
    });
    expect(inaccessibleAction.diagnostics).toContainEqual(
      expect.objectContaining({ code: 'NNG201', severity: 'error' }),
    );

    const missingProvider = validateUsage({
      template: '<neural-toast />',
      imports: ['NeuralToast'],
      providers: [],
    });
    expect(missingProvider.diagnostics).toContainEqual(
      expect.objectContaining({ severity: 'error' }),
    );
    expect(missingProvider.suggestedProviders).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'provideNeuralMessages' }),
      ]),
    );
  });
});

const validUserManagementTemplate = `
<neural-toolbar ariaLabel="User management actions">
  <input neuralInput aria-label="Search users" />
  <neural-select [options]="roles" ariaLabel="Filter by role" />
</neural-toolbar>
<neural-table [columns]="columns" [value]="users" rowKey="id" ariaLabel="Users" />
<neural-paginator [totalItems]="total" [(pageIndex)]="pageIndex" [(pageSize)]="pageSize" />
<neural-drawer [(open)]="detailsOpen" ariaLabel="User details" />
<neural-confirm-dialog />
`;

async function createAcceptanceWorkspace(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'neural-mcp-eval-'));
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
    "@import '@neural-ng/core/themes/neutral.css';\n@import '@neural-ng/icons/icons.css';\n",
  );
  await writeFile(
    join(root, 'src', 'app', 'users.ts'),
    `import { Component } from '@angular/core';
import { NeuralInput } from '@neural-ng/core/input';
import { NeuralTable } from '@neural-ng/core/table';
@Component({ imports: [NeuralInput, NeuralTable], templateUrl: './users.html' })
export class UsersPage {}`,
  );
  await writeFile(
    join(root, 'src', 'app', 'users.html'),
    '<input neuralInput aria-label="Search users" /><neural-table [columns]="columns" [value]="users" ariaLabel="Users" />',
  );
  return root;
}
