# Forms Foundation Phase 3D Implementation

## Scope

Phase 3D moves `TreeSelectComponent` onto the shared hierarchical
`FormValueControl` conformance path after Select, AutoComplete, and MultiSelect.
The public selector, nested option mapping, Tree composition, scalar and array
value modes, and semantic event payloads remain compatible.

## Canonical contract

```text
neural-tree-select
→ FormValueControl<NeuralTreeSelectValue<TValue>>
→ single: TValue | null
→ multiple / checkbox: readonly TValue[]
```

`expandedKeys` and `filterValue` remain controlled UI state. `value` is the only
Angular Forms model.

## Shared conformance suite

The TreeSelect harness now runs through
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

## Runtime repair

Readonly is now distinct from disabled:

- readonly TreeSelects keep the combobox enabled and in the tab order;
- `aria-readonly="true"` and a structural readonly data attribute are exposed;
- the popup may open for filtering, navigation, and branch expansion;
- Tree selection is disabled through `selectableNode` and guarded again at the
  TreeSelect event boundary;
- clear and chip-removal actions are disabled and guarded;
- Field-provided required and readonly state follow the same effective contract;
- disabled TreeSelects still cannot open and close if disabled while open.

Selecting the current single value again does not emit a duplicate semantic
event. Multiple-value chip removal now emits `selectionChange` and `unselected`
with the previous immutable value.

## Documentation and demo

The TreeSelect documentation page now includes live Signal Forms, Reactive
Forms, template-driven, and readonly examples. Playwright coverage verifies all
three adapters plus readonly pointer and keyboard protection.

The component README, package `llms.txt`, root project guidance, changelog, and
format-check scope carry the same contract.

## Package and MCP contracts

Package verification checks that TreeSelect declarations contain
`FormValueControl`, do not contain `ControlValueAccessor`, and document all
three Forms adapters plus readonly semantics.

The MCP catalog generator now parses nested generic Forms contracts correctly.
The catalog test pins:

```json
{
  "selector": "neural-tree-select",
  "formContract": "FormValueControl<NeuralTreeSelectValue<TValue>>",
  "models": [
    {
      "name": "value",
      "type": "NeuralTreeSelectValue<TValue>"
    },
    {
      "name": "expandedKeys",
      "type": "ReadonlySet<NeuralTreeKey>"
    },
    {
      "name": "filterValue",
      "type": "string"
    }
  ]
}
```

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
