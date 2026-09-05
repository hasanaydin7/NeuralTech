# NeuralNg MCP roadmap

The MCP server becomes an Angular UI expert agent interface in this order. A
stage is complete only when its behavior is covered by deterministic tests and
packaged-host verification where applicable.

1. [x] Contract Generator V2
2. [x] `get_component` and `get_component_examples`
3. [x] Capability and composition graph
4. [x] `plan_ui`
5. [x] Angular parser-based `validate_usage`
6. [x] Icon catalog and `search_icons`
7. [x] Read-only `inspect_project`
8. [x] `suggest_consistent_ui`
9. [x] Evaluation package
10. [ ] `1.0.0-rc.1`

Step 5 parses Angular templates with `@angular/compiler`, returns parser
metadata in usage-validation schema v2, recognizes element and attribute
selectors, and covers control flow, two-way bindings, native DOM bindings,
syntax failures, accessibility, imports, and providers in deterministic and
packaged-host tests.

Step 6 generates its catalog from the published Neural Icons metadata and
curated manifest. It covers all 6,184 variants, returns bounded semantic search
results with exact classes and CSS imports, and excludes brand icons by default.

Step 7 inspects external and inline Angular templates with the same compiler-AST
validator used by `validate_usage`. It reports package declarations, workspace
kind, imports, providers, themes, Appearance ownership, component and icon
usage, bounded relative-path evidence, summary counts, confidence, limitations,
and actionable diagnostics without accepting a caller-controlled path.

Step 8 returns a focused schema-v2 consistency contract instead of repeating the
complete inspection payload. It makes evidence-backed reuse/introduce decisions,
partitions exact import and required-provider deltas, preserves detected theme or
unstyled ownership, checks the declared Core version against the generated
catalog, surfaces bounded project risks, and names the next contract/example and
validation calls.

Step 9 adds a versioned beta-exit manifest and a dedicated `neural-mcp:eval`
target. The CI gate covers ten composition regressions plus the complete
existing-project user-management chain: version/theme/pattern detection,
contract-backed planning, exact imports, valid template acceptance, and
rejection of invented APIs, inaccessible icon actions, and missing providers.

Step 10 is in progress. `1.0.0-rc.1` package, registry and runtime metadata are
aligned, release notes are drafted, and a packed artifact is verified locally.
The checkbox remains open until that exact artifact completes the acceptance
scenario inside a separately launched coding-agent host and the branch CI is
green. Preparation does not authorize npm publication or a merge to `main`.

## Beta exit acceptance scenario

The server must reliably complete this request:

> Design a user-management screen for my existing Angular project with
> filtering, a table, pagination, a detail drawer, and delete confirmation.

For that scenario it must:

- understand the project's NeuralNg version;
- detect its theme and existing usage patterns;
- recommend the correct component composition;
- return exact imports and API contracts;
- validate the template produced by the coding agent;
- catch accessibility and provider errors;
- reject invented NeuralNg APIs; and
- return a structured, versioned contract.

Do not merge, tag `1.0.0-rc.1`, or publish a stable release until the complete
scenario passes in the evaluation package and in a real coding-agent host.
