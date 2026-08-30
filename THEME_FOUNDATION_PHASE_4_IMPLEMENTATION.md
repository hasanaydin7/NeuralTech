# Theme Foundation Phase 4 Implementation

## Scope

Theme Foundation Phase 4 promotes the existing Neutral, Glass, and Futuristic
visual systems into the compact theme compiler and adds component-scoped sparse
overrides to Theme Studio.

## Built-in presets

`@neural-ng/theme` now supports:

- `neutral` — stable baseline;
- `glass` — experimental translucent baseline;
- `futuristic` — experimental high-contrast baseline.

Recipes remain compact:

```json
{
  "schemaVersion": 1,
  "name": "workspace",
  "extends": "glass",
  "modes": { "dark": "auto" }
}
```

The contract generator reads the existing Core and Editor preset CSS sources,
normalizes their token declarations, removes values already supplied by Neutral,
and commits deterministic base/dark preset maps. User recipes never need to
repeat those maps.

## Compiler behavior

The compiler now resolves in this order:

1. Neutral Core and Editor templates;
2. selected built-in preset token baseline;
3. high-level recipe color, typography, shape, density, elevation, and motion;
4. mode overrides;
5. component-scoped sparse overrides;
6. exact advanced token overrides.

This preserves the old experimental theme appearance while allowing a user to
start from Glass or Futuristic and override only one decision.

## Package and CLI

New public exports:

```text
@neural-ng/theme/presets/catalog.json
@neural-ng/theme/presets/neutral.json
@neural-ng/theme/presets/glass.json
@neural-ng/theme/presets/futuristic.json
```

CLI initialization supports:

```bash
npx neural-theme init --preset neutral
npx neural-theme init --preset glass
npx neural-theme init --preset futuristic
```

Node and browser APIs expose `listThemePresets()` and `getThemePreset()`.

## Theme Studio

The Brand tab now distinguishes:

- complete base preset selection;
- optional brand color directions layered over the base.

The Feel tab now includes an advanced component tuning accordion. Users select
one documented component, one documented token, and one CSS value or alias.
Only that sparse override is stored in `components` within the exported recipe.
The full token graph remains hidden.

## MCP

The MCP server now publishes compact resources for all three built-in presets:

```text
neural://themes/presets/neutral
neural://themes/presets/glass
neural://themes/presets/futuristic
```

`create_theme_recipe` accepts `preset` inside `options_json` while preserving the
read-only, deterministic, low-token workflow.

## Compatibility

- Existing Neutral recipes compile unchanged.
- Existing experimental Core and Editor CSS files remain available.
- Generated themes still contain complete Core, Editor, dark-mode, and optional
  Tailwind outputs.
- Glass and Futuristic remain explicitly experimental.
