import { describe, expect, it } from 'vitest';
import { planUi } from './composition.js';

describe('Neural MCP composition intelligence', () => {
  it('plans an admin table with filters and contextual details', () => {
    const plan = planUi({
      goal: 'Admin user management with search, role filter, table, row status, detail drawer and delete confirmation',
    });

    expect(plan.kind).toBe('table');
    expect(plan.components.map((component) => component.id)).toEqual(
      expect.arrayContaining([
        'table',
        'neural-paginator',
        'neural-input',
        'select',
        'neural-drawer',
        'confirm-dialog',
        'tag',
      ]),
    );
    expect(
      plan.sections.find((section) => section.id === 'details')?.components,
    ).toContain('neural-drawer');
    expect(plan.imports['@neural-ng/core/table']).toContain('NeuralTable');
    expect(plan.accessibility.join(' ')).toContain('destructive target');
  });

  it('plans nullable form state without degrading it to a binary checkbox', () => {
    const plan = planUi({
      kind: 'form',
      goal: 'Permission form with inherited nullable state and save feedback',
    });

    expect(plan.components.map((component) => component.id)).toContain(
      'tri-state-checkbox',
    );
    expect(plan.components.map((component) => component.id)).not.toContain(
      'checkbox',
    );
    expect(plan.state).toContain('validation status');
  });

  it('carries required providers from selected component contracts', () => {
    const plan = planUi({
      goal: 'Page that shows a toast notification after save',
    });

    expect(plan.providers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'provideNeuralMessages',
          requirement: 'required',
        }),
      ]),
    );
  });
});
