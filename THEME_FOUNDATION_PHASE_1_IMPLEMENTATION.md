# Theme Foundation Phase 1 Implementation

## Goal

Turn the headless Core and Editor token contracts into a consumer-facing theme
workflow that remains compact for humans and AI agents. Consumers author a
small JSON/JSONC recipe; `@neural-ng/theme` expands it into the complete theme
surface.

## Published package

```text
@neural-ng/theme@0.1.0-beta.0
```

The package is Node-only build tooling. It is a `devDependency`; Core and Editor
do not depend on it at runtime and Angular applications do not import it.

## Compact recipe

The canonical source is `neural.theme.json`. It supports:

- a versioned JSON Schema;
- `extends: "neutral"`;
- named or custom primary and surface colors;
- typography family and scale;
- radius and border profiles;
- compact, comfortable and spacious density;
- elevation and motion profiles;
- automatic or explicit dark mode overrides;
- sparse component overrides;
- exact advanced `--neural-*` overrides;
- compact aliases such as `{color.primary}` and `{button.radius}`.

Unknown components and token names fail validation instead of silently emitting
unused CSS.

## Token contract

`generate-contract.mjs` reads the real Core Neutral, Editor Neutral and Tailwind
bridge sources. It normalizes line endings, generates deterministic template
assets and writes a public contract containing:

```text
1,348 unique public tokens
1,219 Core tokens
129 Editor tokens
43 component/foundation groups
source SHA-256
base, dark, compact and spacious values
```

`neural-theme:contract-check` fails when the generated contract or bundled
source templates are stale.

## Compiler

The compiler:

1. validates the compact recipe;
2. loads the generated Neutral token contract;
3. expands named/custom palettes with `neural-oklch-v1`;
4. applies semantic, typography, radius, density, elevation and motion rules;
5. validates sparse component and exact token overrides;
6. scopes complete Core and Editor CSS to the generated theme name;
7. includes the Tailwind v4 bridge when enabled;
8. emits compact diagnostics and an AI-readable summary.

The Neutral preset preserves the existing stable Neutral values. Custom hex
seeds use a deterministic, versioned OKLCH palette algorithm so the same recipe
produces the same output.

## Outputs

A build writes:

```text
<name>.css
<name>.tokens.json
<name>.report.json
<name>.d.ts
```

- CSS contains the full Core + Editor token graph, dark mode, density selectors
  and optional Tailwind bridge.
- Token JSON uses DTCG-style `$type`, `$value` and `$extensions` fields.
- Report JSON contains contract counts, source hash, diagnostics and the compact
  theme summary.
- Type declarations expose the generated theme name.

## CLI

```text
neural-theme init
neural-theme validate
neural-theme build
```

Optional flags:

```text
--config / -c
--out-dir / -o
```

Default build output is `src/styles/generated`.

## Consumer integration

The official starter is now a five-package template. It installs Theme Compiler
and MCP Server as development dependencies, builds `neural.theme.json` before
Angular start/build, and imports only:

```css
@import 'tailwindcss';
@import '@neural-ng/icons/icons.css';
@import './styles/generated/starter.css';
```

It no longer imports Core and Editor Neutral CSS beside generated CSS.

## MCP integration

`neural://themes/catalog` now includes `@neural-ng/theme` as a tooling entry so
agents can discover the compact compiler without adding the package to browser
code. Theme recipe generation/edit tools remain intentionally deferred to the
later MCP theme phase.

## Nx targets

```text
neural-theme:contract
neural-theme:contract-check
neural-theme:build
neural-theme:validate-preset
neural-theme:package-test
```

Root scripts also expose `theme:contract`, `theme:build` and `theme:validate`.

## Phase 1 boundaries

- Only the Neutral source contract can be extended.
- Glass and Futuristic remain experimental handwritten presets.
- Visual Theme Studio is deferred to Theme Foundation Phase 2.
- MCP create/validate/diff theme tools are deferred to Theme Foundation Phase 3.
- Full application unit and browser suites were intentionally not part of this
  fast foundation pass; contract generation, strict TypeScript build, package
  preparation, package smoke and documentation checks remain available.
