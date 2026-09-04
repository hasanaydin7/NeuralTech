# Changelog

All notable changes to `@neural-ng/mcp-server` are documented here.

## 0.1.0-beta.7 - Unreleased

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
- Added `neural://server/capabilities` for machine-readable tool groups, schema
  versions, safety guarantees, scan limits, and compatibility guidance.

### Changed

- Positioned the server as a read-only Angular UI expert interface rather than
  a component catalog wrapper.
- Added structured, versioned error envelopes to tool failures.
- Injected the runtime server version from package metadata during packaging and
  added tarball tests that prevent package, registry, and runtime version drift.

### Compatibility

- Retained all existing public tool names, including the legacy
  `get_component_contract` tool. New clients should prefer `get_component`.
- Retained the 18-tool public surface while the 1.0 acceptance scenario and
  remaining roadmap stages are completed.
