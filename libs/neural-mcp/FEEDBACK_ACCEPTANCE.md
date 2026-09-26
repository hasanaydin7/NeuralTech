# RC.3 feedback follow-up — 2026-09-25

Status: verification record for the rc.4 release candidate. This is not a stable-release approval
or a fresh coding-agent host report. HOST_ACCEPTANCE.md remains the historical
rc.1 evidence and was not rewritten.

## Changes verified

- Source-generated Core and Editor contracts: 158 public declarations in total.
  Editor resolves through its real entry point, typed classes and API fields.
  Unknown Editor bindings still fail; unknown selectors are not suppressed.
  Installed Editor metadata and independent version mismatch warnings are tested.
- Native theme objects and legacy JSON strings produce equivalent results.
  Packed stdio tests exercise all five affected theme tools, conflict errors,
  bounded empty/omitted-query discovery, Editor lookup and template validation.
- Angular AST-based hidden-element discovery plus bounded external CSS hints.
  Warnings do not evaluate the cascade or prove runtime failures. Tests cover
  comments, unrelated/excluded selectors, Angular control flow, root token
  priority and scan limits. Plain :where(:root) is not treated as an error.

## Local verification

- 144 unit tests across 13 files passed.
- 17 evaluation tests passed, including Angular compilation checks.
- TypeScript, lint and package contract checks passed.
- Packed MCP stdio smoke passed.
- Deterministic isolated Angular consumer passed strict compilation and Chromium
  pagination, filter/search reset, details/Escape, delete cancellation/acceptance.

The deterministic consumer is not a new paid/model-driven agent test, and its
existing user-management fixture does not certify Editor rendering or every
theme/layout. The reported 5–20ms latency and specific CSS byte count were not
independently benchmarked here.

## Still required for stable

- Reproduce the remaining Appearance case in its source project.
- Verify actual icon rendering and Appearance/overlay interactions in a browser.
- Repeat real-agent acceptance against the selected release artifact and cover
  additional project layouts; record hashes and limitations.
- Pass branch CI/review before merge and approve stable publication separately.

Template validation reduces API mistakes; it does not guarantee Angular type
checking, compilation, full accessibility, runtime correctness or zero hallucinations.

## Editor Ctrl+K follow-up — 2026-09-26

The user clarified that the stuck overlay is Editor's built-in command palette.
The existing demo interaction test passed before the fix, so that result alone
did not reproduce the reported failure. A separate Chromium document loading
only the component's exact structural CSS reproduced it: hidden=true still
computed display:grid and one layout rectangle. After adding the component's
explicit hidden rule, the same false/true visibility cycle computed none/grid/none
with 0/1/0 rectangles. The fix is in Editor, not merely an MCP warning or a
consumer stylesheet workaround. The demo regression checks Ctrl+K, Escape,
focus restoration, backdrop dismissal and command selection.

Both Chromium regressions passed after the fix, as did all 31 Editor unit tests
and the Editor/MCP lint checks. These checks preceded release preparation.

## Release preparation — 2026-09-26

The selected versions are MCP 1.0.0-rc.4 and Editor 0.1.0-beta.2. Landing examples
now document native inputs, Editor contracts and CSS inspection limits. All 144
MCP unit tests, Editor package checks and the landing Chromium documentation
regression passed after the version updates. Publication remains subject to CI
and review; this record does not approve stable 1.0 or claim the Appearance case
is fixed.
