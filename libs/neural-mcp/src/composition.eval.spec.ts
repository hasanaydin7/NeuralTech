import { describe, expect, it } from 'vitest';
import { planUi } from './composition.js';

const scenarios = [
  {
    goal: 'Admin user table with search, role filter, status badge and detail drawer',
    expected: [
      'table',
      'neural-paginator',
      'neural-input',
      'select',
      'tag',
      'neural-drawer',
    ],
  },
  {
    goal: 'Registration form with password and terms checkbox',
    expected: [
      'neural-field',
      'neural-input',
      'neural-password',
      'checkbox',
      'button',
    ],
  },
  {
    goal: 'Application shell with a sidebar navigation rail',
    expected: ['neural-sidebar', 'neural-menu'],
  },
  {
    goal: 'Permission form with nullable inherited tri state',
    expected: ['tri-state-checkbox'],
    forbidden: ['checkbox'],
  },
  {
    goal: 'Form with a hierarchical tree picker',
    expected: ['tree-select'],
  },
  {
    goal: 'Profile form with avatar upload attachment and description',
    expected: ['neural-file-upload', 'textarea'],
  },
  {
    goal: 'Checkout form with currency amount and date',
    expected: ['neural-input-number', 'date-picker'],
  },
  {
    goal: 'Remote autocomplete search suggestion form',
    expected: ['auto-complete'],
  },
  {
    goal: 'Verification form with one time OTP code',
    expected: ['neural-input-otp'],
  },
  {
    goal: 'Settings form with a bounded range slider and mutually exclusive radio options',
    expected: ['slider', 'radio-group'],
  },
] as const;

describe('Neural MCP composition evaluation set', () => {
  for (const scenario of scenarios) {
    it(`selects the expected contracts for: ${scenario.goal}`, () => {
      const selected = planUi({ goal: scenario.goal }).components.map(
        (component) => component.id,
      );
      expect(selected).toEqual(expect.arrayContaining([...scenario.expected]));
      for (const forbidden of 'forbidden' in scenario
        ? scenario.forbidden
        : []) {
        expect(selected).not.toContain(forbidden);
      }
    });
  }
});
