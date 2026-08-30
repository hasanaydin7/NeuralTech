# Theme Foundation Phase 2 — Theme Studio

## Status

Implemented on top of Theme Foundation Phase 1.

## Goal

Provide a visual theme authoring surface without creating a second theme engine
or exposing the full 1,348-token graph as the authoring format.

## Browser-safe compiler

`@neural-ng/theme/browser` embeds the generated Neutral contract and Core,
Editor and Tailwind templates as deterministic TypeScript assets. It reuses the
same resolver, palette generation, validation and artifact generation functions
as the Node CLI while excluding filesystem and process APIs.

New compiler option:

```ts
compileTheme(recipe, {
  includeTailwind: false,
  scope: 'theme',
});
```

`scope: 'theme'` removes `:root` selectors. This lets Theme Studio inject the
full generated Core + Editor CSS without changing the documentation shell.

The contract generator now owns `src/browser-assets.ts`; `contract-check` fails
when the embedded browser assets do not match the canonical Neutral CSS and
token contract.

## Theme Studio

Route:

```text
/docs/tools/theme-studio
```

Features:

- compact recipe controls for primary/surface/status colors, radius, border,
  density, typography scale, elevation and motion;
- isolated light/dark Core + Editor preview;
- editable JSON recipe with immediate schema and contract validation;
- JSON recipe import;
- recipe, generated CSS, DTCG-style tokens and report downloads;
- integration snippet copy action;
- compiler summary and contrast diagnostics;
- navigation and Theming-guide discovery links.

The studio remains a lazy documentation route, so its embedded token contract
and templates do not increase the initial application bundle.

## Package contract

`@neural-ng/theme` now exports:

```text
@neural-ng/theme          Node CLI/filesystem API
@neural-ng/theme/browser  browser-safe compiler API
```

The package smoke script verifies the browser export, absence of direct Node
built-in imports, theme-only selector output, and full recipe compilation.

## Deferred work

- component-scoped advanced token editor;
- preset marketplace and persistence;
- image/color extraction;
- MCP theme write and diff tools;
- collaborative/cloud theme storage;
- dedicated visual regression suite.
