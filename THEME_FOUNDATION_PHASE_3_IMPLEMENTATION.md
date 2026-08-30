# Theme Foundation Phase 3 Implementation

## Scope

Theme Foundation Phase 3 connects the compact `@neural-ng/theme` compiler to
`@neural-ng/mcp-server` without turning the MCP process into a project-writing
agent. All operations remain deterministic, read-only and filesystem-free.

## Theme resources

The MCP server now publishes fixed, token-efficient resources:

- `neural://themes/schema`
- `neural://themes/presets`
- `neural://themes/presets/neutral`
- `neural://themes/ai-guide`

The schema resource is a compact authoring guide rather than a dump of the full
resolved Core and Editor token graph.

## Theme tools

Six read-only tools were added:

- `create_theme_recipe`
- `validate_theme_recipe`
- `edit_theme_recipe`
- `diff_theme_recipes`
- `get_component_theme_contract`
- `compile_theme_recipe`

Together with the three existing component-discovery tools, the server exposes
nine deterministic tools.

## Low-token contract

The MCP workflow intentionally transports only:

- compact recipes;
- sparse dotted-path edits;
- changed paths;
- one component's theme contract at a time;
- compiler summaries, diagnostics and artifact byte sizes.

`compile_theme_recipe` does not return full CSS, token JSON or generated type
artifacts. Those files are written by the existing CLI:

```bash
npx neural-theme build
```

## Safety

Sparse edits are bounded and reject:

- prototype-related path segments;
- invalid dotted paths;
- paths deeper than eight segments;
- patches containing more than 64 changes;
- recipe JSON larger than 64,000 characters.

The MCP server still does not:

- write user files;
- execute shell commands;
- install packages;
- access the network;
- accept arbitrary filesystem paths.

## Package relationship

`@neural-ng/mcp-server` now depends on the matching
`@neural-ng/theme@0.1.0-beta.0` release. Angular packages remain independent of
both tooling packages and no MCP or theme compiler code enters the browser
bundle.

## Verification coverage

The implementation adds coverage for:

- recipe creation and validation;
- sparse edit safety;
- deterministic compact diffs;
- compiler summaries without artifact bodies;
- component-scoped contracts with optional defaults;
- fixed theme resources;
- packed installation of both Theme and MCP packages;
- stdio resource reads and theme tool calls.

## Quality commands

```bash
npx nx run neural-theme:contract-check --outputStyle=static
npx nx build neural-theme --outputStyle=static
npx nx lint neural-mcp --outputStyle=static
npx nx test neural-mcp --outputStyle=static
npx nx build neural-mcp --outputStyle=static
npx nx run neural-mcp:package-test --outputStyle=static
npx nx run neural-mcp:mcp-smoke --outputStyle=static
```
