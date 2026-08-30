# Forms Foundation Phase 3B Implementation

## Scope

Phase 3B moves `SelectComponent` onto the shared single-value
`FormValueControl<TValue | null>` conformance path established in Phase 3A. The
public selector, nullable `value` model, data-option API, projected-option API,
and semantic event payloads remain unchanged.

## Canonical contract

```text
neural-select
→ FormValueControl<TValue | null>
→ value: TValue | null
```

`OptionComponent` remains an option owned by Select and is not an independent
form control.

## Shared conformance suite

The Select harness now runs through
`libs/neural-ng/testing/form-value-control-conformance.ts`, standardizing:

- direct `[(value)]` binding;
- Signal Forms `[formField]`;
- Reactive Forms `[formControl]`;
- template-driven `[(ngModel)]`;
- programmatic writes without semantic user events;
- one semantic event for a changed user selection;
- readonly focus retention without mutation;
- disabled and required state;
- touch when focus leaves the control;
- `focus()` and `reset()` behavior.

## Select runtime repair

Readonly is now distinct from disabled:

- readonly Selects keep the native button enabled and preserve the tab stop;
- `aria-readonly="true"` and a structural readonly data attribute are exposed;
- pointer, keyboard, and clear mutation are blocked;
- the popup may still open so the current option set can be inspected;
- Field-provided readonly follows the same contract;
- disabled Selects continue to use the native disabled button state.

Programmatic `value` writes and `reset()` do not emit `selectionChange`.
Selecting the current value again closes the panel without emitting a duplicate
semantic event.

## Documentation and demo

The Select documentation page now includes live Signal Forms, Reactive Forms,
and template-driven examples, a readonly state, and explicit accessibility
semantics. Playwright coverage verifies all three adapters and readonly pointer
and keyboard behavior.

The component README, package `llms.txt`, root project guidance, and changelog
carry the same contract.

## Package and MCP contracts

Package verification checks that Select declarations contain
`FormValueControl`, do not contain `ControlValueAccessor`, and document all
three Forms adapters plus readonly semantics.

The Neural MCP catalog test pins:

```json
{
  "selector": "neural-select",
  "formContract": "FormValueControl<TValue | null>",
  "models": [{ "name": "value", "type": "TValue | null" }]
}
```

The generated catalog is refreshed from the canonical source and documentation
files.

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
