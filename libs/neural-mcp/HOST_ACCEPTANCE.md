# Real coding-agent acceptance: 2026-09-17

Result: **PASS for the user-management acceptance scenario**, not a claim that
all possible UI generation or accessibility cases are covered.

## Method

A fresh isolated consumer installed local tarballs for Core 0.1.0-beta.8,
MCP 1.0.0-rc.1 and Theme 0.1.0-beta.5 with Angular 22.0.7. A real Codex CLI
agent (gpt-6-astra, medium reasoning) connected to the installed MCP over stdio.
It could not read the curated fixture or library implementation and was instructed
not to install dependencies or change package source. It authored users.ts/html
using inspect_project, suggest_consistent_ui, contracts/examples and validate_usage.
The coordinator did not repair these generated files.

## Results and recoveries

- 13 MCP calls (12-call soft target exceeded by one).
- Final exact template with actual imports/providers: zero diagnostics.
- Empty-label icon button: rejected with NNG201.
- Strict Angular compilation: passed after one agent correction. A template
  reference resolved to NeuralInput instead of the native input; the agent
  replaced `.value` access with an Event handler and HTMLInputElement narrowing.
- Two validator argument-format retries: the agent first supplied the planning
  import map where imports_json requires an array of declaration names.
- Independent AOT compilation and headless Chromium passed: next page, search
  resetting pagination, role filtering, details drawer/Escape, cancellation
  preserving the row, and confirmation deleting the row. No pageerror events.
- The separate deterministic installed-consumer suite also passed, including
  read-only checks and exact installed-version/theme/contract verification.
- 105 unit tests and 17 evaluation tests passed on the updated source tree.

The previous run failed because it omitted visible pagination. That failure
remains recorded; a new run with corrected composition guidance produced
NeuralPaginator without coordinator edits. Compilation alone was not accepted.

## Artifact identity

SHA256 of the tested local MCP tarball (before this report was added):
`232CAC26C025F133EF3CD6D3CD1FF5B3097BBAC201A46F428087BEDB722129CA`

SHA256 of unmodified generated users.ts:
`811E2885AD1219D592AC14952D36F12D78EDE89ABA5A351819B67BF4F91E85F6`

SHA256 of unmodified generated users.html:
`52EF918CDC6BA4AB355EB89A61D8358ACD386D02196C5C0B13C7CC47A80E5E57`

Raw JSONL, prompt, agent report and generated files are retained in the local
`mcp-agent-discovery` evidence workspace (`host-run-20260917.jsonl` and
`host-acceptance-20260917/`). This is a human-reviewed host run, not a claim
that CI reruns a nondeterministic paid model. CI runs the deterministic
installed-consumer scenario with `npm run mcp:consumer:e2e`.

## Boundaries

Icon stylesheet installation/rendering was not visually verified. This run does
not certify SSR, every viewport, every assistive technology, or all project
layouts. TypeScript metadata inspection remains heuristic; validate_usage is
not a substitute for ngc and browser tests. Final feature-branch CI and review
remain required before merge. Publishing is a separate action.
