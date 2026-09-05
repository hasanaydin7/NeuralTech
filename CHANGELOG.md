## Mist Theme

- Added the experimental Mist Core and Editor theme with calm translucent surfaces, desaturated teal emphasis, restrained shadows, and light/dark modes.
- Added Mist to the theme compiler, CLI, package exports, MCP resources, demo playground, and topbar preset switcher.
- Added package, quality, service, navigation, and theme-switch regression coverage.

## Theme Foundation Phase 5

- Added release/preview preset quality governance and deterministic artifact baselines.
- Added conservative CSS override diagnostics for injection, malformed aliases, and invalid values.
- Added browser-safe versioned recipe migration and a non-destructive CLI migrate workflow.
- Added bounded Theme Studio undo/redo history and imported-recipe migration notices.
- Expanded package smoke coverage for quality metadata, migration, diagnostics, and exports.

## Theme Foundation Phase 4

- Added built-in Neutral, Glass, and Futuristic compiler presets.
- Added preset-aware CLI initialization and package exports.
- Added Theme Studio base preset selection and component-scoped sparse overrides.
- Added MCP preset resources and preset-aware recipe creation.

# Changelog

All notable changes to NeuralNg are documented here. Beta APIs may change
before the first stable release.

## Unreleased

### Added

- Added canonical, read-only `inspect_project` with schema-v2 Angular compiler
  template inspection, attribute-directive discovery, Neural Icons usage,
  summary metrics, explicit confidence and bounded relative-path evidence.
- Added schema-v2 `suggest_consistent_ui` decisions for component reuse, Core
  catalog alignment, exact import/provider deltas, theme ownership, bounded
  risks and next MCP validation calls.
- Added a versioned MCP beta-exit evaluation manifest, ten composition
  regressions, an existing-project user-management acceptance chain, and the
  `npm run mcp:eval` CI gate.

### Changed

- Retained `inspect_neuralng_project` as a compatibility alias while directing
  new coding agents to `inspect_project`.

## 0.1.0-beta.7 - 2026-08-31

### Changed

- Gave inline NeuralMenu the same expanded, collapsed, hover-expanded,
  responsive and RTL Sidebar shell behavior as NeuralPanelMenu.
- Allowed NeuralMenu and NeuralPanelMenu to share one Sidebar content region
  with aligned icon rails and a tokenized navigation gap.

### Fixed

- Kept inline NeuralMenu items anchored throughout the Sidebar collapse
  transition while leaving popup Menu geometry independent.
- Improved dark-mode contrast across the Sidebar documentation examples.

## 0.1.0-beta.6 - 2026-08-30

### Added

- Allowed Sidebar consumers to compose either NeuralMenu or NeuralPanelMenu
  navigation while preserving collapsed icon-rail flyouts and keyboard access.

### Fixed

- Kept collapsed Sidebar navigation icons aligned throughout the close
  transition instead of briefly shifting to the far edge.

## 0.1.0-beta.5 - 2026-08-25

### Fixed

- Cancelled a pending nested Sidebar flyout disclosure when the pointer moves
  to another menu item before `hoverOpenDelay` elapses.
- Reset the internal hover target after disclosure so the same nested branch
  can be closed and opened again without stale pointer state.

## 0.1.0-beta.4 - 2026-08-25

### Changed

- Nested parent items in a collapsed Sidebar flyout now disclose their
  logical-side child flyout on pointer hover after the configured
  `hoverOpenDelay`; top-level rail items remain explicit click targets.

### Fixed

- Clearing or replacing an expanded PanelMenu branch now removes every
  descendant key, so returning to a previously closed Sidebar flyout always
  starts from a clean nested state.
- Hovering between sibling nested branches closes the previous child flyout
  before opening the next one.

## 0.1.0-beta.3 - 2026-08-25

### Changed

- Changed nested PanelMenu branches inside a collapsed Sidebar icon rail to
  cascade into logical-side flyouts instead of expanding the parent flyout
  vertically.
- Added dedicated nested-flyout width and offset tokens plus an updated live
  Sidebar hierarchy example.

### Fixed

- Restored keyboard access to collapsed-rail flyouts when `openOnHover` is
  enabled; hover expansion and flyout disclosure now remain independent.
- Preserved nested flyout dismissal, focus, RTL/end-side placement and reduced
  motion behavior across deeper navigation levels.

## 0.1.0-beta.2 - 2026-08-24

### Added

- Added the responsive `@neural-ng/core/sidebar` application-shell primitive
  with icon, offcanvas and desktop modes, Menu and PanelMenu composition,
  controlled state, logical placement and typed class slots.
- Added collapsed icon-rail flyouts, optional hover expansion with configurable
  open/close delays, independent backdrop control and semantic hover events.
- Added Sidebar documentation, machine-readable contracts, theme tokens and
  regression coverage for interaction, focus and collapsed navigation.

### Fixed

- Prevented expanded PanelMenu groups from briefly rendering as a horizontal
  flyout while a hover-expanded Sidebar collapses back to its icon rail.

## 0.1.0-beta.1 - 2026-08-24

### Added

- Added the `@neural-ng/core/appearance` secondary entry point with a
  Signal-based application controller for primary and surface palettes,
  light/dark/system mode, logical direction, persistence and cross-tab sync.
- Added 13 built-in primary palettes, 20 built-in surface palettes, custom
  palette registration and Tailwind CSS v4 token integration.
- Added package-level README and `llms.txt` contracts for Appearance and
  exposed the new runtime entry point through the NeuralNg MCP catalog.

### Changed

- Migrated the documentation application's appearance picker to the public
  library API and standardized its DOM selectors on namespaced
  `data-neural-*` attributes.

## 0.1.0-beta.0 - 2026-08-22

### Added

- Angular 22+ standalone, Signal-first component library architecture.
- Tree-shakable `@neural-ng/core/*` secondary entry points.
- Standalone `@neural-ng/editor` package with package-managed Tiptap,
  ProseMirror, Floating UI and Yjs runtime dependencies.
- Neutral theme, experimental Glass/Futuristic themes and Tailwind v4 bridge.
- Neural Icons package with embedded Tabler-derived assets.
- Message API, Toast and accessible overlay infrastructure.
- Form, navigation, feedback and data-display beta components.
- Full Table beta with remote state, editing, grouping and persistence.
- DatePicker/TimePicker with localization, RTL, forms, accessibility,
  headless templates, SSR safety and native top-layer positioning.
- Lazy documentation application, package verification and Playwright suite.
- Read-only `@neural-ng/mcp-server` with generated component contracts, fixed
  documentation resources, deterministic discovery tools and stdio smoke tests.
- Shared `FormCheckboxControl` conformance coverage and complete Switch parity
  across Signal Forms, Reactive Forms and template-driven forms.
- Dedicated Button-style TriStateCheckbox documentation route with live
  nullable-model, Angular Forms, state, headless, migration, accessibility and
  API examples.
- Separate Checkbox and TriStateCheckbox demo routes and Playwright contracts.
- Shared `FormValueControl<T>` conformance coverage and RadioGroup parity across
  Signal Forms, Reactive Forms, template-driven Forms, readonly, disabled,
  touch, focus, reset and user-only selection events.
- Select parity on the shared `FormValueControl<TValue | null>` contract across
  direct binding, Signal Forms, Reactive Forms and template-driven Forms, with
  distinct readonly semantics, touch, focus, reset and user-only selection
  events.
- AutoComplete and MultiSelect parity on their canonical
  `FormValueControl<TValue | string | null>` and
  `FormValueControl<readonly TValue[]>` contracts across direct binding,
  Signal Forms, Reactive Forms and template-driven Forms, with inspectable
  readonly popups, touch, focus, reset and user-only selection events.
- TreeSelect parity on
  `FormValueControl<NeuralTreeSelectValue<TValue>>` across direct binding,
  Signal Forms, Reactive Forms and template-driven Forms, with inspectable
  readonly trees, immutable scalar/array values, touch, focus, reset and
  user-only selection events.
- Documentation Foundation Phase 1 with a four-package Angular + Tailwind starter,
  canonical Toast documentation, package-aware installation guidance, docs
  contract/example/coverage checks and dedicated Toast Playwright coverage.
- `@neural-ng/theme` Theme Foundation Phase 1 with compact JSON/JSONC recipes,
  deterministic OKLCH palette generation, a generated 1,348-token Core + Editor
  contract, sparse component overrides, Tailwind output and `init`, `validate`,
  `build` CLI workflows.
- Five-package starter integration that builds generated theme CSS before Angular
  start/build and keeps theme/MCP tooling out of the browser dependency graph.
- Theme Foundation Phase 2 with a browser-safe compiler entry point and a lazy
  Theme Studio for scoped Core + Editor previews, compact recipe editing,
  validation, import/export and downloadable CSS/token/report artifacts.
- Guided Theme Studio experience with brand presets, visual feel controls,
  category-based live previews, export readiness and an advanced-only JSON editor.
- Theme Foundation Phase 3 with low-token MCP resources and deterministic tools
  for compact recipe creation, validation, safe sparse edits, diffs, component-scoped
  token contracts and compiler summaries without sending full CSS through context.
