# Documentation Foundation Phase 1

## Scope

This phase turns documentation into a verified product surface rather than a
set of disconnected prose pages. It introduces one clean consumer template,
one canonical component documentation pilot and three deterministic docs checks.

## Official four-package starter

`templates/neural-starter` is an Angular 22 + Tailwind v4 application that uses
only installed package entry points:

- `@neural-ng/core`
- `@neural-ng/icons`
- `@neural-ng/editor`
- `@neural-ng/mcp-server` as a development dependency

The starter demonstrates Core forms controls, Toast, the Icons CSS package, the
structured Editor, light/dark mode and an MCP configuration that executes the
installed `neural-ng-mcp` binary with `npx --no-install`.

It intentionally contains no `libs/`, `dist/libs/` or workspace-relative imports.
Its README documents both registry-alpha installation and unpublished local
`.tgz` installation.

## Canonical Toast pilot

The Toast page now follows the common docs-page structure and covers:

1. package imports
2. application providers
3. basic notification flow
4. semantic severity
5. finite and persistent lifetimes
6. progress, interaction pausing and returned references
7. channels and logical positions
8. global versus local configuration
9. icons and unstyled ownership
10. accessibility
11. component and message API tables

The examples use the real `NeuralMessageService`, `ToastComponent`,
`provideNeuralMessages()` and `provideNeuralToast()` public contracts. A new
Playwright spec verifies the route, finite progress, persistent dismissal,
logical position changes, returned references, icon-free rendering and unstyled
ownership.

## Installation guide

The Getting Started installation page now documents all four packages, their
runtime/devDependency boundary, local tarball validation, Tailwind v4/PostCSS,
theme and icon imports, providers, MCP configuration and the official starter.

## Documentation contracts

`tools/neural-docs` adds the following Nx targets:

```text
neural-docs:contract-check
neural-docs:example-check
neural-docs:coverage
neural-docs:verify
```

The initial contract checks:

- package names and documentation routes
- required starter files
- canonical Toast route, page sections, README and llms.txt
- Core README/llms package exports
- package-only imports and theme assets in examples
- correct dependency placement for all four packages
- installed MCP executable configuration
- navigation routes backed by lazy route declarations

The manifest is deliberately small in Phase 1. Additional components should be
promoted into `pilots` only after their pages are rebuilt to the same standard.

## Verification

Run:

```powershell
npx nx run neural-docs:contract-check --outputStyle=static
npx nx run neural-docs:example-check --outputStyle=static
npx nx run neural-docs:coverage --outputStyle=static
npx nx build neural-demo --outputStyle=static
npx playwright test --config=apps/neural-demo-e2e/playwright.config.mts apps/neural-demo-e2e/src/toast.spec.ts --workers=1 --timeout=60000 --reporter=line
```

For the external starter, install the four packed artifacts inside a copy of
`templates/neural-starter`, then run:

```powershell
npm run build
npm run test:e2e
npm run mcp
```
