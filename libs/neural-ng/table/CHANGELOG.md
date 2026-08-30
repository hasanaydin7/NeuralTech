# NeuralNg Table changelog

## 0.1.0-beta.0

Initial feature-complete Table beta.

### Included

- Native table semantics with signal inputs/models, standalone imports, SSR,
  hydration, localization, headless mode, class slots, and design tokens.
- Client and remote data contracts with stable sorting, global/column filters,
  pagination, complete state events, and stale-request identity guards.
- Single/multiple selection, radio/checkbox controls, row click, range and
  modifier selection, disabled rows, keyboard navigation, scoped select-all,
  and remote key-only selection.
- Cell and row editing with immutable drafts, typed editor templates, async
  validation, accessible errors/loading, save/cancel lifecycle events, and
  Neural Input, Select, Checkbox, and InputNumber integration.
- Scrolling, sticky columns/header/footer, resize, visibility, column ordering,
  grouped headers, typed summaries, row grouping, expansion, native rowspan,
  nested paths, and aggregation helpers.
- Versioned JSON state, URL-safe serialization, local/session persistence,
  custom async adapters, ordered/coalesced writes, SSR-safe restore, and
  skeleton loading rows.
- Regression coverage for async races, component destruction, bounded
  allocation, and large key-based selections.

### Verification gate

- Unit and component tests.
- Library lint, Angular package build, package-content validation, and
  production SSR/prerender build.
- Chromium, Firefox, and WebKit Table E2E coverage.
- Automated axe scans plus native semantic and keyboard assertions.

### Deferred

- Virtual scrolling.
- Tree table.
- Data export.
- Column context menus.
- Server-owned grouping.
- Responsive card conversion.

Beta consumers should pin `0.1.0-beta.0`; compatibility is not guaranteed
until the stable release.
