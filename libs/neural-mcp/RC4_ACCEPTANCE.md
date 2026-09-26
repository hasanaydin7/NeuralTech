# Published rc.4 acceptance — 2026-09-26

Result: PASS for the user-management scenario, with agent corrections and
two recoverable tool-discovery/usability findings. This is not stable approval.

## Artifact and method

An isolated consumer installed npm MCP 1.0.0-rc.4, Core 0.1.0-beta.8,
Editor 0.1.0-beta.2, Theme 0.1.0-beta.5 and Icons 0.1.0-beta.0. Angular
dependencies were pinned to the installed workspace versions in its lockfile.
A fresh Codex CLI session connected to that installed MCP over stdio. The
prompt prohibited reading implementation/curated fixtures or modifying library
code and dependencies. The agent authored users.ts/html without coordinator
repairs. Session JSONL, prompt, lockfile, compiler output and screenshot remain
in the local `mcp-v1-acceptance` evidence directory.

## Results

- 33 MCP calls, including resource discovery. The run requested broader resource
  output than necessary; this is not an efficiency or latency benchmark.
- Installed Core/Editor versions and neutral theme detected. Empty-query
  discovery and native object/array arguments exercised.
- Editor lookup using `editor` failed; `NeuralEditor` succeeded, with exact
  package identity and zero diagnostics for a valid Editor template.
- The agent guessed `options.extends` for create_theme_recipe. The tool rejected
  it; the agent recovered with `{}`. Branch fixes add the short alias and clearer
  option guidance. These changes were not part of the published artifact tested.
- Final exact template passed MCP validation. Empty-label icon action rejected
  with NNG201. Strict Angular compilation initially found NeuralInput reference
  `.value` misuse and unknown table-row contexts. The agent corrected both with
  proper narrowing; the next compilation passed without permissive schemas/any.
- Independent Chromium passed next page, search resetting pagination, role
  filtering, drawer/Escape, focus restoration, cancellation preserving a row,
  confirmed deletion, last-page correction and empty-result recovery.
- Both row-action icons had non-empty SVG masks, nonzero dimensions and painted
  backgrounds. Screenshot inspection confirmed visible eye/trash glyphs.
- No browser pageerror events were observed.

The initial harness stylesheet used an invalid Icons subpath. The coordinator
corrected its own styles.css to the public outline.css export before browser
verification, without changing the agent's users.ts/html. Two matrix-harness
errors (Windows ESM URL and inspection envelope access) were likewise corrected;
neither was an MCP product failure.

## Layout and regression checks

- Published rc.4 stdio inspection passed Angular CLI `src/app`, Nx
  `apps/admin/src/app`, and Angular package `src/lib` fixtures with Core+Editor.
  Fixtures use installed-package metadata copies; they are inspection tests, not
  three independently compiled applications. Source stayed unchanged.
- The source suite adds the same three layouts and a companion alias regression.
  All 148 unit tests passed. MCP and demo-E2E lint passed.
- Popover geometry now retries the unchanged 2px alignment condition after
  visibility, avoiding a sample taken during its enter transition. Eight repeated
  Chromium cases passed before the combined follow-up run.
- The Button test incorrectly expected Glass's #020617 after selecting Mist.
  Actual Mist token and computed background are #17252a. The old assertion could
  pass before transition completion. The expectation is corrected, not relaxed.
- The combined Button/Popover run then passed all 16 cases (eight repetitions
  each). Packed stdio smoke passed with the new `editor` alias and actionable
  invalid-theme-option error, along with all existing protocol checks.

## Evidence hashes (SHA256)

Published npm MCP integrity (SHA512):
`sha512-NYYDyoKXUPI0eANFAtJD9aS5HwQrE8NPAAuEFOBySDoVPuMbkrd4J7mCdPIydvcM1PuEwqe6cTIkBNDAQoaaZg==`

- users.ts: `55B63E4087435833F3C90DF3D780156DDE045FCD9B2AF0A96BA57E197E426051`
- users.html: `79C44B4748FF74C0913B8A4EF3C94DEB0FA402E8C8687CAFF4752D89EE4BD0AC`
- host-run.jsonl: `B3FAAF5B7D70025B97737F137FB53F486764B1084FFDE3B65DDF8786DCDAE59C`

## Remaining release gate

Verify the post-rc.4 changes in a packed candidate, complete branch CI/review,
and make an explicit stable-release decision. This report does not certify
Appearance switching (deferred by product decision), full CSS cascade analysis,
SSR/hydration, all viewport/assistive-technology combinations or arbitrary UI.
The older HOST_ACCEPTANCE.md remains historical rc.1 evidence.
