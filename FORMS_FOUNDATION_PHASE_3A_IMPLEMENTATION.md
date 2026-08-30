# Forms Foundation Phase 3A Implementation

## Scope

Phase 3A establishes the reusable `FormValueControl<T>` conformance path and
moves `RadioGroupComponent` onto the canonical single-value choice contract.
`RadioComponent` remains an option owned by its group and is not exposed as an
independent form control.

## Canonical contract

```text
neural-radio-group
→ FormValueControl<TValue | null>
→ value: TValue | null
```

The public selector, model, data-option API, projected-option API, and
`selectionChange` payload remain unchanged.

## Shared conformance suite

`libs/neural-ng/testing/form-value-control-conformance.ts` is a test-only,
generic suite. A component-specific harness supplies DOM interaction and state
inspection while the suite standardizes:

- direct `[(value)]` binding;
- Signal Forms `[formField]`;
- Reactive Forms `[formControl]`;
- template-driven `[(ngModel)]`;
- programmatic writes without semantic user events;
- one semantic event for user interaction;
- readonly focus retention without mutation;
- native disabled and required state;
- touch when focus leaves the control;
- `focus()` and `reset()` behavior.

The helper is included by `tsconfig.spec.json` through the existing
`testing/**/*.ts` pattern and is not exported by `@neural-ng/core`.

## RadioGroup runtime repair

Readonly is now distinct from disabled:

- readonly groups keep native radio inputs enabled and preserve the roving tab
  stop;
- `aria-readonly="true"` is exposed on the `radiogroup`;
- pointer, Space, Arrow, Home, and End mutation are blocked;
- Field-provided readonly follows the same contract;
- disabled groups continue to use native disabled inputs.

Programmatic `value` writes and `reset()` do not emit `selectionChange`.
`selectionChange` remains a user-only event with pointer or keyboard source.

## Documentation and demo

The Radio documentation page now includes live Signal Forms, Reactive Forms,
and template-driven examples, a readonly state, and explicit accessibility
semantics. Playwright coverage verifies the three adapters and readonly pointer
and keyboard behavior.

The component README, package `llms.txt`, root project guidance, and changelog
were updated with the same contract.

## Package and MCP contracts

Package verification now checks that RadioGroup declarations contain
`FormValueControl`, do not contain `ControlValueAccessor`, and document all
three Forms adapters plus readonly semantics.

The Neural MCP catalog test pins:

```json
{
  "selector": "neural-radio-group",
  "formContract": "FormValueControl<TValue | null>",
  "models": [{ "name": "value", "type": "TValue | null" }]
}
```

The generated catalog was refreshed from the canonical source and
documentation files.

## Quality gate

```powershell
npx nx run neural-mcp:catalog-check --outputStyle=static
npx nx lint neural-ng --outputStyle=static
npx nx test neural-ng --outputStyle=static
npx nx build neural-ng --outputStyle=static
npx nx run neural-ng:package-test --outputStyle=static
npx nx build neural-demo --outputStyle=static
npx nx e2e neural-demo-e2e --outputStyle=static
npx nx lint neural-mcp --outputStyle=static
npx nx test neural-mcp --outputStyle=static
npx nx build neural-mcp --outputStyle=static
```
