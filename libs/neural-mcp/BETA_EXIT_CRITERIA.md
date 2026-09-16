# NeuralNg MCP beta exit criteria

The MCP package must not be merged to `main`, release-tagged, or published from
the Contract V2 branch until every required gate below is green. Release
candidate metadata may be prepared on the branch for tarball host verification.

## Roadmap gates

- [x] Contract Generator V2 is generated from public Angular source.
- [x] Component discovery returns versioned contracts and bounded examples.
- [x] The capability/composition graph is contract-backed.
- [x] `plan_ui` returns exact imports, providers, state, accessibility checks,
      and implementation order.
- [x] `validate_usage` uses the Angular compiler AST and exposes
      usage-validation schema v2.
- [x] The Neural Icons catalog and `search_icons` are implemented and tested.
- [x] Read-only `inspect_project` uses Angular template parsing, is bounded, pathless and
      integrated with component, validation and icon contracts.
- [x] `suggest_consistent_ui` returns schema-v2 component evidence, version
      alignment, import/provider deltas, theme ownership, bounded risks and next
      validation calls without duplicating the complete inspection payload.
- [x] The versioned acceptance evaluation package passes deterministically and
      is enforced in CI with `npm run mcp:eval`.
- [x] `1.0.0-rc.1` metadata, release notes, packed artifact, and real coding-agent
      host verification are completed together.

The detailed order and acceptance scenario are maintained in `ROADMAP.md`.

## End-to-end acceptance

The deterministic evaluation suite covers planning and template contracts; its
synthetic workspace and template fixtures do not prove a working application.
Before release, separately verify:

- [x] The source-backed user-management consumer fixture compiles with the real
      Angular compiler under `strictTemplates`; wrong paginator input types and
      missing standalone imports fail compilation. These checks run in `mcp:eval`.

- [x] An isolated consumer with installed Core/MCP/Theme tarballs compiles with
      Angular strict template checking. Its imports/APIs are checked against the
      packed MCP's returned contracts over stdio (`npm run mcp:consumer:e2e`).
- [x] Filtering, pagination, row-detail actions, and delete confirmation are
      connected and exercised in the user-management screen.
- [x] A coding-agent host uses the packed candidate to inspect that project,
      plan the screen, obtain contracts, and validate its generated template.

Passing unit tests or fixture evaluations must not be reported as completing
these application and host gates.

The lightweight `mcp:eval` compile fixture resolves workspace source entry points.
The separate `mcp:consumer:e2e` gate installs tarballs without workspace aliases,
checks project versions/theme/composition/contracts/validation and read-only
behavior over stdio, then compiles and exercises the same screen in Chromium.
This uses a curated fixture and a deterministic protocol client, not a coding
agent generating a screen. The separate real coding-agent host evidence is
recorded in [HOST_ACCEPTANCE.md](HOST_ACCEPTANCE.md).

### Real host verification follow-up (2026-09-17)

The isolated coding agent used the packed MCP over stdio, created its own
user-management screen, passed final template validation and the negative
icon-only accessibility check, and passed strict Angular compilation after one
correction. Independent Chromium verification **failed pagination**: the agent
enabled table `paginate` but did not render a paginator. Search, role filtering,
drawer/Escape, and delete cancellation/acceptance passed a separate diagnostic
run. Compilation and zero validator diagnostics are not behavioral acceptance.

The discovered planning gap is now regression-tested: explicit page/form plans
retain requested table and paginator regions, table state and accessibility
guidance. Planning guidance and the generated table `paginate` input description
now distinguish row slicing from visible paging controls. A fresh packed-candidate
host run subsequently passed the complete browser scenario on 2026-09-17;
the original failed agent output was not repaired or relabeled as successful.

## Final integration gate

- [ ] CI is green for the final feature-branch commit, including the new
      installed-consumer browser job. Local successes do not satisfy this gate.

Project inspection uses heuristic TypeScript import/provider/theme extraction;
it is not a TypeScript semantic compiler. Template validation does not prove
expression types, runtime behavior, or complete accessibility compliance.

## Release rule

Do not infer readiness from a successful build alone. Merge only after the unchecked
items are completed and reviewed. Publishing remains a separate, explicit action.
