# `@neural-ng/theme`

Compact, deterministic theme compiler for the headless NeuralNg component and
editor packages. A small JSON/JSONC recipe expands into the complete Core and
Editor token graph instead of requiring consumers or AI agents to author more
than one thousand CSS custom properties.

## Install

```sh
npm install --save-dev @neural-ng/theme
```

## Start a recipe

```sh
npx neural-theme init
npx neural-theme init --preset glass
npx neural-theme init --preset mist
npx neural-theme init --preset futuristic
```

This creates `neural.theme.json`:

```json
{
  "$schema": "./node_modules/@neural-ng/theme/schema.json",
  "schemaVersion": 1,
  "name": "app",
  "extends": "neutral",
  "color": {
    "primary": "blue",
    "surface": "slate",
    "success": "#16a34a",
    "warning": "#ca8a04",
    "error": "#dc2626"
  },
  "shape": {
    "radius": "medium",
    "border": "default"
  },
  "density": "comfortable",
  "elevation": "soft",
  "motion": "default",
  "modes": {
    "dark": "auto"
  }
}
```

Named primary palettes and custom hex seeds are expanded with the versioned
`neural-oklch-v1` algorithm. `surface` accepts `slate`, `gray`, `zinc`,
`neutral`, `stone`, or a custom hex seed.

## Validate and build

```sh
npx neural-theme validate
npx neural-theme build

# Upgrade an early preview recipe without overwriting the source file.
npx neural-theme migrate --config legacy.theme.json --out neural.theme.json
```

The default output directory is `src/styles/generated`:

```text
app.css
app.tokens.json
app.report.json
app.d.ts
```

Import only the generated theme and Icons from the application stylesheet:

```css
@import 'tailwindcss';
@import '@neural-ng/icons/icons.css';
@import './styles/generated/app.css';
```

The generated CSS already contains the complete Core token graph, Editor token
graph, dark mode contract, density selectors, and optional Tailwind v4 bridge.
Do not also import the Core or Editor Neutral themes.

Activate a mode or a scoped theme with namespaced data attributes:

```html
<html data-neural-theme="app" data-neural-mode="dark"></html>
```

## Built-in presets

`extends` accepts `neutral`, `glass`, `mist`, or `futuristic`. Glass, Mist, and
Futuristic are experimental visual baselines compiled through the same Core and
Editor token contract as Neutral. Mist uses desaturated teal accents, restrained
shadows, and translucent blur surfaces intended for long working sessions. A preset recipe remains compact:

```json
{
  "schemaVersion": 1,
  "name": "workspace",
  "extends": "glass",
  "modes": { "dark": "auto" }
}
```

Public preset recipes are exported from `@neural-ng/theme/presets/*.json`, and
`listThemePresets()` exposes the catalog to browser and Node tooling.

## Sparse component overrides

Use camelCase property names; the compiler validates them against the generated
token contract:

```json
{
  "components": {
    "button": {
      "radius": "1rem",
      "primaryBackground": "{color.primary}"
    },
    "toast": {
      "messageRadius": "1rem",
      "progressHeight": "0.25rem"
    }
  }
}
```

Advanced users may address exact public custom properties:

```json
{
  "tokens": {
    "--neural-editor-toolbar-background": "{color.surface.50}"
  }
}
```

Unknown components and token names fail validation. Token references remain
compact and compile to CSS `var()` aliases. Override values are also checked for
empty values, malformed aliases, unbalanced delimiters, declaration injection,
external URLs, imports and script-like CSS before compilation.

## Programmatic API

```ts
import { compileTheme, listThemePresets, migrateThemeRecipe, validateThemeRecipe, type NeuralThemeRecipe } from '@neural-ng/theme';

const recipe: NeuralThemeRecipe = {
  name: 'company',
  color: { primary: '#7c3aed', surface: 'zinc' },
};

const migrated = migrateThemeRecipe(recipe);
const validation = await validateThemeRecipe(migrated.recipe);
const artifacts = validation.valid ? await compileTheme(migrated.recipe) : undefined;
```

## Recipe migration

`migrateThemeRecipe()` is browser-safe and upgrades the early version-0 preview
shape into schema version 1. It maps `preset`, `colors`, `radius`,
`componentOverrides`, and `tokenOverrides` without silently dropping unknown
properties. Theme Studio applies the same migration when importing JSON and
shows the performed changes. The CLI prints migrated JSON to stdout unless
`--out` is provided, so source files are never overwritten implicitly.

## Preset quality governance

Every built-in preset declares a quality status, minimum primary-to-surface
contrast floor, and explicitly allowed diagnostic codes. Neutral is `release`
quality; Glass, Mist, and Futuristic remain `preview` quality while their
public stability is experimental.

```sh
npx nx run neural-theme:quality-check
```

The quality gate compiles all presets through the browser-safe compiler, rejects
blocking or ungoverned diagnostics, and compares deterministic CSS, token, and
report hashes against `presets/quality-baseline.json`. Review intentional visual
changes before updating that baseline.

## Authoring and interchange

`neural.theme.json` is the canonical low-token authoring format. The generated
`*.tokens.json` document is a full token interchange artifact with DTCG-style
`$type`, `$value`, and `$extensions` fields. `*.report.json` contains the compact
AI summary, source contract hash, token counts, output names, and diagnostics.

## Current boundaries

- `extends` supports `neutral`, `glass`, `mist`, and `futuristic`; the latter three remain experimental.
- The default entry point remains Node tooling for CLI and filesystem output.
- Visual tools must use `@neural-ng/theme/browser`, which contains no Node APIs.
- Core and Editor have no runtime dependency on this package.
- Theme Studio exposes component-scoped sparse overrides, not a raw 1,348-token editor.
- Theme Studio keeps a bounded 50-change undo/redo history and makes reset undoable.
- Marketplace distribution and third-party preset loading remain later phases.

## Browser-safe compiler

Theme Studio and other visual tools use the dedicated browser entry point. It
contains the same resolver, validation rules, token contract, and Neutral
templates as the CLI without importing Node filesystem APIs:

```ts
import { compileTheme, listThemePresets, migrateThemeRecipe, validateThemeRecipe } from '@neural-ng/theme/browser';

const validation = validateThemeRecipe(recipe);
const artifacts = validation.valid ? compileTheme(recipe, { includeTailwind: false, scope: 'theme' }) : undefined;
```

`scope: 'theme'` removes `:root` selectors so generated preview CSS cannot alter
the documentation shell or another theme scope.

## MCP and AI workflow

`@neural-ng/mcp-server` exposes compact recipe resources and read-only tools for
creation, validation, sparse edits, diffs, component-scoped contracts and compile
summaries. The MCP layer never returns the full resolved token graph by default.
Use the CLI to write artifacts:

```bash
npx neural-theme build
```
