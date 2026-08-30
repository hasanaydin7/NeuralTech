# Theme Foundation Phase 5 — Quality, Governance, and Release Hardening

## Outcome

Phase 5 turns the compact theme pipeline into a release-governed workflow. It
adds deterministic preset snapshots, explicit quality metadata, conservative
CSS override validation, versioned recipe migration, Theme Studio edit history,
and package export smoke coverage.

## Preset quality gate

Each built-in preset now declares centrally generated governance metadata:

- `quality.status`: `release` or `preview`;
- `minimumPrimarySurfaceContrast`;
- explicitly allowed compiler diagnostic codes.

Neutral is release quality. Glass and Futuristic remain experimental preview
presets. `neural-theme:quality-check` compiles every preset through the public
browser entry point and verifies:

- no blocking diagnostics;
- no diagnostic outside the preset allow-list;
- no diagnostics at all for a release-quality preset;
- deterministic CSS, tokens, report hashes and artifact sizes;
- the expected 1,348-token public contract.

The committed baseline is:

```text
libs/neural-theme/assets/presets/quality-baseline.json
```

Intentional visual changes require an explicit baseline review and update.
`package-test` depends on this quality gate, and `nx-release-publish` depends on `package-test`, so the same checks guard package publication.

## Override diagnostics

Component and exact-token override values are validated before CSS generation.
Validation rejects:

- empty or non-finite values;
- declaration delimiters and control characters;
- external `url()` values, `@import`, `expression()` and `javascript:`;
- unbalanced parentheses, brackets, or quotes;
- malformed or unknown `{token.alias}` references;
- values longer than 512 characters.

This keeps sparse overrides expressive while preventing generated declaration
injection and moving compiler failures into structured diagnostics.

## Recipe migration

The browser-safe `migrateThemeRecipe()` API upgrades the version-0 preview
shape to schema version 1. It maps:

```text
preset              → extends
colors              → color
radius              → shape.radius
componentOverrides  → components
tokenOverrides      → tokens
```

Unknown properties are preserved for normal validation instead of being
silently removed. New CLI workflow:

```bash
npx neural-theme migrate --config legacy.theme.json
npx neural-theme migrate --config legacy.theme.json --out neural.theme.json
```

Without `--out`, migrated JSON is printed to stdout and no file is overwritten.
Theme Studio uses the same API for imported JSON and displays the migration
summary.

## Theme Studio history

Theme Studio now keeps a bounded 50-change undo/redo history. All guided edits,
component overrides, imported recipes, JSON edits and reset actions participate.
Reset remains reversible, redo is cleared by a new branch, and history controls
are disabled when unavailable.

## Public package changes

New public API and artifact:

```text
migrateThemeRecipe()
NeuralThemeRecipeMigrationResult
NeuralThemePresetQuality
NeuralThemePresetQualityStatus
@neural-ng/theme/presets/quality-baseline.json
```

Package smoke coverage verifies migration, governance metadata, unsafe CSS
rejection, unknown alias rejection, and the new exported baseline.

## Verification

Recommended repository checks:

```bash
npx nx run neural-theme:contract-check --outputStyle=static
npx nx build neural-theme --outputStyle=static
npx nx run neural-theme:quality-check --outputStyle=static
npx nx run neural-theme:package-test --outputStyle=static
npm run theme:release-check
npx nx build neural-mcp --outputStyle=static
npx nx build neural-demo --outputStyle=static
```
