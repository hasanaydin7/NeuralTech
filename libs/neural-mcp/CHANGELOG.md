# Changelog

All notable changes to `@neural-ng/mcp-server` are documented here.

## 1.0.0-rc.1 - Unreleased

### Added

- Added schema-versioned component contracts generated from the public Angular
  source, including Signals, templates, providers, methods, examples, public
  type aliases, and typed class slots.
- Added contract-backed page, form, and table composition planning with exact
  imports, provider requirements, state ownership, accessibility checks, and
  implementation order.
- Added Angular compiler AST-based template validation with schema-v2 parser
  metadata and stable diagnostics for syntax, public contract, import,
  provider, and accessibility errors.
- Added bounded, pathless, symlink-safe project inspection and project-consistent
  UI planning.
- Added a generated 6,184-variant Neural Icons catalog and `search_icons` with
  semantic UI-intent matching, style/category filters, exact classes, minimal
  CSS imports, brand opt-in, and accessibility guidance.
- Added `neural://server/capabilities` for machine-readable tool groups, schema
  versions, safety guarantees, scan limits, and compatibility guidance.
- Added canonical schema-v2 `inspect_project`, project-aware schema-v2
  `suggest_consistent_ui`, and a CI-enforced beta-exit evaluation manifest.

### Changed

- Positioned the server as a read-only Angular UI expert interface rather than
  a component catalog wrapper.
- Added structured, versioned error envelopes to tool failures.
- Injected the runtime server version from package metadata during packaging and
  added tarball tests that prevent package, registry, and runtime version drift.

### Compatibility

- Retained all existing public tool names, including the legacy
  `get_component_contract` tool. New clients should prefer `get_component`.
- Retained `inspect_neuralng_project` as an alias while new clients use
  `inspect_project`.
- The RC exposes 20 read-only tools. It requires Node.js 24.x and validates
  Angular 22 templates.

### Verification

- Passed 76 deterministic unit tests and 13 versioned beta-exit evaluations.
- Passed package contract validation and packed stdio MCP initialization,
  resource discovery, tool listing, project inspection, consistency planning,
  usage validation, icon search, and theme compilation.

### Known RC boundary

- The generated component contract catalog currently covers `@neural-ng/core`.
  Project inspection inventories `@neural-ng/editor` imports but leaves unknown
  separate-package selectors explicit until Editor joins Contract Generator V2.
