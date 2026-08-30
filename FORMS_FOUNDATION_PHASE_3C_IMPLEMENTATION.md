# Forms Foundation Phase 3C Implementation

## Scope

Phase 3C standardizes AutoComplete and MultiSelect on the shared
`FormValueControl` conformance path established for RadioGroup and Select.
Their public selectors, controlled models, option mapping, filtering, and
semantic event payloads remain compatible.

## Canonical contracts

```text
neural-auto-complete
→ FormValueControl<TValue | string | null>
→ value: TValue | string | null
→ query: string

neural-multi-select
→ FormValueControl<readonly TValue[]>
→ value: readonly TValue[]
→ filterValue: string
```

Editable query and filter state remain separate from the committed form value.

## Shared conformance suite

Both controls run through
`libs/neural-ng/testing/form-value-control-conformance.ts`, covering direct
binding, Signal Forms, Reactive Forms, template-driven Forms, programmatic
writes, user-only semantic events, readonly, disabled, required, touch,
`focus()`, and `reset()`.

## Runtime repairs

Readonly remains enabled and focusable, exposes `aria-readonly`, and may open
for option inspection. AutoComplete blocks input, option, clear, and
force-selection blur mutations. MultiSelect blocks option, chip, clear, and
select-all mutations. Programmatic writes and reset remain available.

AutoComplete's show-all action now reveals the complete option collection
instead of retaining the committed-label filter. Selecting the current option
does not emit a duplicate semantic event.

## Documentation and verification

Both documentation pages include live Signal Forms, Reactive Forms,
template-driven, and readonly examples. Playwright, package, and MCP contracts
pin the adapter and readonly behavior. The generated MCP catalog carries the
canonical forms contracts and model types.
