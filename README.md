# NeuralNg

AI-first, headless and Signal-native UI components for Angular 22+.

[![CI](https://github.com/hasanaydin7/NeuralTech/actions/workflows/ci.yml/badge.svg)](https://github.com/hasanaydin7/NeuralTech/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@neural-ng/core.svg)](https://www.npmjs.com/package/@neural-ng/core)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

[Documentation](https://neuralng.dev) · [Installation](https://neuralng.dev/docs/getting-started/installation) · [Security](./SECURITY.md) · [Contributing](./CONTRIBUTING.md)

NeuralNg serves human developers and code-generating agents with standalone
components, strict types, accessible native semantics, SSR-safe behavior and
tree-shakable secondary entry points.

> Status: `0.1.0-beta.6`. Public APIs may change before the stable release.

## Packages

- `@neural-ng/core`: components, services, localization and theme tokens.
- `@neural-ng/editor`: structured, AI-native and collaboration-ready Editor.
- `@neural-ng/icons`: framework-independent `nt nt-*` CSS mask icons.
- `@neural-ng/theme`: compact recipe compiler for complete Core and Editor themes.
- `@neural-ng/mcp-server`: read-only MCP discovery plus compact theme recipe creation, validation, diff and compile summaries.

```ts
import { NeuralButton, NeuralButtonGroup } from '@neural-ng/core/button';
import { AutoCompleteComponent } from '@neural-ng/core/auto-complete';
import { NeuralDatePicker } from '@neural-ng/core/date-picker';
import { TableComponent } from '@neural-ng/core/table';
import { EditorComponent } from '@neural-ng/editor';
```

```bash
npm install -D @neural-ng/theme
npx neural-theme init
npx neural-theme build
```

```css
@import '@neural-ng/icons/icons.css';
@import './styles/generated/app.css';
```

## Principles

- AI-ready README and `llms.txt` context beside every public component.
- Local/global headless mode with `unstyled` and typed class slots.
- Structural hooks -> component tokens -> theme -> consumer classes.
- Signal Forms, Reactive Forms and template-driven Forms where applicable.
- Native ARIA, keyboard and focus behavior.
- SSR and deterministic hydration without unsafe browser globals.

## Forms foundation

Binary Checkbox and Switch implement `FormCheckboxControl` with one boolean
`checked` model. Tri-state Checkbox uses a separate
`FormValueControl<boolean | null>` contract. RadioGroup and Select use the
shared `FormValueControl<TValue | null>` conformance path for single-value
choice controls. AutoComplete, MultiSelect, and TreeSelect extend the same
contract to editable suggestions, immutable arrays, and hierarchical scalar or
array values. These controls share coverage for Signal Forms, Reactive Forms,
template-driven Forms, readonly inspection, disabled, touch, programmatic
writes, focus, reset and semantic user events.

## Run tasks

Use Node 24 and npm 11.

```bash
npm ci
npm run dev
```

The demo is served from `http://localhost:4200`.

## Included beta foundations

Accordion, AutoComplete, Avatar, Badge, Breadcrumb, Button, Card, Checkbox,
TriStateCheckbox, DatePicker, Dialog, Divider, Field, Input, InputNumber,
LoadingOverlay, Menu, MeterGroup, MultiSelect, Paginator, PanelMenu, Popover,
ProgressBar, ProgressSpinner, Radio, Select, Skeleton, Switch, Table, Tabs, Tag,
Textarea, Toast, Tooltip, Message API, localization, color mode, themes and
Neural Icons.

## Repository layout

```text
apps/neural-site       Production documentation and landing application
apps/neural-site-e2e   Production-site Playwright coverage
apps/neural-demo       Component contract and regression laboratory
apps/neural-demo-e2e   Exhaustive component interaction coverage
libs/neural-ng         @neural-ng/core sources and package documentation
libs/neural-editor     @neural-ng/editor sources and package documentation
libs/neural-icons      @neural-ng/icons generator and embedded icon assets
libs/neural-mcp        @neural-ng/mcp-server catalog, resources, tools and CLI
libs/neural-theme      @neural-ng/theme recipe schema, token contract, compiler and CLI
templates/neural-starter  Clean five-package Angular + Tailwind consumer template
tools/neural-docs       Contract, example and route coverage verification
```

`neural-demo` remains a non-production verification application while its
broader component scenarios and documentation-contract checks are migrated to
`neural-site`. New public documentation belongs in `neural-site`.

## Themes

`@neural-ng/theme` expands a compact `neural.theme.json` recipe into complete
Core + Editor CSS, a Tailwind v4 bridge, token interchange JSON, diagnostics and
a generated theme-name type. The compiler validates sparse component overrides
against 1,348 public theme tokens without requiring humans or AI agents to
author the full graph. Neutral remains the stable source contract; Glass and
Futuristic remain experimental handwritten presets during the migration phase.

The lazy `/docs/tools/theme-studio` route uses `@neural-ng/theme/browser` to
compile the same recipe and token contract inside a theme-only scope. It can
preview Core and Editor together, validate imported recipes, and export recipe,
CSS, token and diagnostic artifacts without Node APIs in the browser chunk.

## Quality commands

```bash
npm run format:check
npm run lint
npm test
npm run build
npm run package:test
npm run package:smoke
npm run mcp:smoke
npm run docs:verify
npm run theme:contract
npm run theme:build
npm run theme:validate
npm run e2e:chromium
```

The Angular smoke test packs generated npm artifacts and compiles a minimal
external consumer. `npm run mcp:smoke` separately packs the MCP server, installs
it into an isolated consumer, and verifies resources and tools over stdio.
`npm run docs:verify` checks package-to-route contracts, installable example
imports, starter configuration and documentation navigation coverage.

## Contributing and security

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a change. Report
security issues privately through the process in [SECURITY.md](./SECURITY.md).

## License

NeuralNg is released under the [MIT License](./LICENSE).
