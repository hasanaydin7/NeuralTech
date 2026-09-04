# NeuralNg MCP roadmap

The MCP server becomes an Angular UI expert agent interface in this order. A
stage is complete only when its behavior is covered by deterministic tests and
packaged-host verification where applicable.

1. [x] Contract Generator V2
2. [x] `get_component` and `get_component_examples`
3. [x] Capability and composition graph
4. [x] `plan_ui`
5. [x] Angular parser-based `validate_usage`
6. [ ] Icon catalog and `search_icons`
7. [ ] Read-only `inspect_project`
8. [ ] `suggest_consistent_ui`
9. [ ] Evaluation package
10. [ ] `1.0.0-rc.1`

Step 5 parses Angular templates with `@angular/compiler`, returns parser
metadata in usage-validation schema v2, recognizes element and attribute
selectors, and covers control flow, two-way bindings, native DOM bindings,
syntax failures, accessibility, imports, and providers in deterministic and
packaged-host tests.

Steps 7 and 8 have bounded early implementations. They remain incomplete until
the icon contracts are integrated and the acceptance scenario is evaluated end
to end.

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
