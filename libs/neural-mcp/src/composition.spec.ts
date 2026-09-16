import { describe, expect, it } from 'vitest';
import { planUi } from './composition.js';

describe('Neural MCP composition intelligence', () => {
  it.each(['page', 'form'] as const)(
    'preserves a requested table inside an explicit %s composition',
    (kind) => {
      const plan = planUi({
        kind,
        goal: 'User management with search, role filter, table, pagination, row status, detail drawer and delete confirmation',
      });
      const ids = plan.components.map((component) => component.id);
      expect(plan.kind).toBe(kind);
      expect(ids).toEqual(
        expect.arrayContaining([
          'table',
          'neural-paginator',
          'button',
          'tag',
          'neural-drawer',
          'confirm-dialog',
        ]),
      );
      expect(new Set(ids).size).toBe(ids.length);
      expect(plan.imports['@neural-ng/core/table']).toContain('NeuralTable');
      expect(plan.imports['@neural-ng/core/paginator']).toContain(
        'NeuralPaginator',
      );
      expect(
        plan.sections.find((section) => section.id === 'content')?.components,
      ).toEqual(expect.arrayContaining(['table', 'neural-paginator']));
      expect(plan.state).toEqual(
        expect.arrayContaining(['rows', 'page', 'filters']),
      );
      expect(plan.state).toContain(
        kind === 'form' ? 'form value' : 'route/view state',
      );
      expect(plan.accessibility.join(' ')).toContain('column headers');
      expect(plan.implementationOrder.join(' ')).toContain(
        'table paginate only slices client rows',
      );
    },
  );

  it('does not mistake unrelated words for table intent', () => {
    const plan = planUi({ goal: 'A stable editable settings page' });
    expect(plan.kind).toBe('page');
    expect(plan.components.map((component) => component.id)).not.toContain(
      'table',
    );
    expect(plan.state).not.toContain('rows');
  });

  it('supports pagination without inventing a table for a card page', () => {
    const plan = planUi({
      kind: 'page',
      goal: 'Product cards with pagination',
    });
    expect(plan.components.map((component) => component.id)).toContain(
      'neural-paginator',
    );
    expect(plan.components.map((component) => component.id)).not.toContain(
      'table',
    );
  });
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
