# Forms Foundation Phase 2 Implementation

## Scope

Phase 2 establishes one reusable binary forms conformance suite and applies it
to both `CheckboxComponent` and `SwitchComponent`. Switch keeps its existing
public API and is locked to the same `FormCheckboxControl` behavior as binary
Checkbox.

## Canonical Switch contract

```ts
SwitchComponent implements FormCheckboxControl
checked: boolean
```

```html
<neural-switch [(checked)]="notifications">
  Notifications
</neural-switch>
```

Switch remains binary. Nullable or mixed domain state belongs to
`neural-tri-state-checkbox` and its `value: boolean | null` contract.

## Shared conformance suite

The test-only helper lives at:

```text
libs/neural-ng/testing/form-checkbox-control-conformance.ts
```

It is not exported from `@neural-ng/core` and does not enter the runtime bundle.
The suite validates the same behavior for Checkbox and Switch:

- direct `checked` model binding;
- Signal Forms through `[formField]`;
- Reactive Forms through `[formControl]`;
- template-driven Forms through `[(ngModel)]`;
- programmatic writes without semantic `stateChange` output;
- one semantic event for one user change;
- readonly remains focusable and blocks mutation;
- disabled uses the native disabled state;
- required reaches the native checkbox;
- `touch` is emitted from native blur;
- public `focus()` and `reset()` behavior;
- reset does not masquerade as a user event.

The helper consumes a component-specific harness, so future binary controls can
reuse the same contract without sharing component internals.

## Switch coverage

`switch.component.spec.ts` now binds Switch through every Angular Forms adapter
and runs the shared suite. Existing native switch semantics, labels, unstyled
mode and Field composition tests remain in place.

`checkbox.component.spec.ts` also runs the same suite. Its existing tri-state
coverage remains separate because `FormValueControl<boolean | null>` is a
different contract.

## Demo and browser coverage

The Switch documentation page includes live Signal Forms, Reactive Forms and
`ngModel` examples. Playwright verifies that all three adapters write user
changes back to their owning model in Chromium, Firefox and WebKit.

## Package and MCP contracts

Package verification now requires the Switch declaration to preserve
`FormCheckboxControl`, rejects a leaked `ControlValueAccessor`, and checks that
README/llms documentation names all three Forms adapters.

The generated MCP catalog continues to expose:

```json
{
  "id": "switch",
  "selector": "neural-switch",
  "formContract": "FormCheckboxControl",
  "models": [{ "name": "checked", "type": "boolean" }]
}
```

A catalog unit test now locks that contract explicitly.

## Public API impact

No breaking public API change is introduced.

- `neural-switch` remains the selector.
- `checked` remains the only value model.
- `checkedChange`, `stateChange` and `touch` remain unchanged.
- No `ControlValueAccessor` or `NG_VALUE_ACCESSOR` is added.
- The shared conformance helper is test-only.

## Validation commands

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
