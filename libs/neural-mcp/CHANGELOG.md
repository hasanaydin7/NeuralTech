# Changelog

All notable changes to `@neural-ng/mcp-server` are documented here.

## 1.0.0-rc.4 - 2026-09-26

- Generate Editor API contracts from its own public entry point and sources;
  include independent package identity and project version warnings.
- Accept native theme objects alongside legacy JSON strings, rejecting conflicts.
- Browse a bounded component list with omitted or empty search queries.
- Add heuristic CSS warnings for hidden/display and root token priority risks,
  explicitly without claiming computed-style or runtime validation.

## 1.0.0-rc.3 - 2026-09-24

### Added

- Native `imports` and `providers` arrays for `validate_usage`, with legacy
  JSON-string compatibility and explicit rejection of conflicting inputs.
- Advertised output schemas and runtime result validation for all 20 tools,
  with schema snapshots and packaged stdio compatibility checks.
- Separate project scan coverage and heuristic semantic confidence, plus
  installed-versus-declared version evidence, contract trust limits and
  required verification actions.

## 1.0.0-rc.2 - 2026-09-19

### Fixed

- Raised the Angular template parser dependency floor to `^22.1.7`.
- Updated agent setup documentation and reproducible installation examples.
- Verified packed-package project inspection, composition, validation, strict
  Angular compilation and the Chromium user-management acceptance scenario.

This remains a release candidate, not the final 1.0 release.

## 1.0.0-rc.1 - 2026-09-17

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

- Passed 105 deterministic unit tests and 17 versioned beta-exit evaluations.
- Passed installed Core/MCP/Theme stdio, strict Angular compilation, and Chromium
  acceptance. A separate real coding-agent run produced the screen without manual
  fixture repairs and passed pagination, search, role filter, details, and delete
  cancellation/confirmation (see `HOST_ACCEPTANCE.md`).
- Passed package contract validation and packed stdio MCP initialization,
  resource discovery, tool listing, project inspection, consistency planning,
  usage validation, icon search, and theme compilation.

### Known RC boundary

- Template validation is not full TypeScript type checking or runtime testing.
  Project TypeScript import/provider/theme extraction remains heuristic.
  The real-host exercise required one compiler correction and two validator
  argument-format retries; icon rendering was not visually verified.

- The generated component contract catalog currently covers `@neural-ng/core`.
  Project inspection inventories `@neural-ng/editor` imports but leaves unknown
  separate-package selectors explicit until Editor joins Contract Generator V2.
