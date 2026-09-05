# @neural-ng/mcp-server

Read-only Angular UI expert interface for NeuralNg component discovery,
contract-backed composition, usage validation, project-consistent guidance and
compact theme workflows.

The server is separate from `@neural-ng/core`. Angular applications never load
an MCP runtime in the browser. Theme tools return recipes, validation results,
diffs and compile summaries; they do not write files or execute shell commands.

## Run

```bash
npx -y @neural-ng/mcp-server
```

Generic MCP client configuration:

```json
{
  "command": "npx",
  "args": ["-y", "@neural-ng/mcp-server"]
}
```

The process uses stdio. Standard output is reserved for MCP JSON-RPC messages;
fatal diagnostics are written to standard error.

## Resources

Agent capability discovery:

- `neural://server/capabilities` — versioned tool groups, result schemas,
  inspection limits, safety guarantees and compatibility guidance

Component and package resources:

- `neural://catalog`
- `neural://package/exports`
- `neural://components/{id}/contract`
- `neural://components/{id}/readme`
- `neural://components/{id}/llms`

Icon resources:

- `neural://icons/catalog` — compact package totals, categories, versions and
  brand-search policy; use `search_icons` for bounded matches

Theme resources:

- `neural://themes/catalog`
- `neural://themes/schema`
- `neural://themes/presets`
- `neural://themes/presets/neutral`
- `neural://themes/presets/glass`
- `neural://themes/presets/mist`
- `neural://themes/presets/futuristic`
- `neural://themes/ai-guide`

Component resources are registered as fixed URIs. The server does not accept a
filesystem path and does not read arbitrary files.

## Component tools

### `search_components`

Searches public selectors, entry points, summaries, README files and `llms.txt`
guidance.

```json
{
  "query": "date calendar localized",
  "limit": 5
}
```

### `get_component`

Returns the schema-versioned Angular API contract used by coding agents. The
`standard` detail level includes Signal inputs, models and outputs, typed
template contexts, required providers, class contract names and the available
example count without sending full documentation through the context window.

```json
{
  "component": "neural-select",
  "detail": "standard"
}
```

Use `detail: "summary"` during discovery and `detail: "full"` only when every
class slot and embedded example is required. Results are returned as both MCP
text content and `structuredContent`.

### `get_component_examples`

Returns a bounded list of published examples with their documentation heading,
language and code.

```json
{
  "component": "neural-table",
  "limit": 3
}
```

### `get_component_contract`

Legacy full-contract lookup retained for existing clients. New integrations
should use `get_component` so they can select a token-efficient detail level.

```json
{
  "component": "neural-tri-state-checkbox"
}
```

### `recommend_components`

Uses deterministic intent matching. It does not invoke another model or a
network service.

```json
{
  "goal": "nullable inherited permission checkbox",
  "limit": 3
}
```

## Icon intelligence

### `search_icons`

Searches all 6,184 outline and filled Neural Icons variants by exact name,
category, or common UI intent. Results are bounded and include the exact `nt`
class, the smallest valid CSS import, ready-to-use markup, supported effects,
and accessibility guidance. Brand icons are excluded by default.

```json
{
  "query": "delete user",
  "style": "outline",
  "limit": 10,
  "include_brands": false
}
```

Use `style: "filled"` only when the returned icon lists filled support. Pass a
category to narrow the deterministic search. Set `include_brands: true` only
when the product explicitly needs a trademarked brand glyph.

## Composition intelligence

### `plan_ui`

Turns a product requirement into a contract-backed NeuralNg composition. The
result contains selected primitives and reasons, exact standalone imports,
provider requirements, structural regions, state ownership, accessibility
checks, implementation order, and component ids that can be passed directly to
`get_component_examples`.

```json
{
  "goal": "Admin user management with search, role filter, table and detail drawer",
  "kind": "auto"
}
```

`kind` accepts `auto`, `form`, `page`, or `table`. Auto detection is
deterministic; it does not call another model or network service.

### Structure-specific planners

Use `suggest_form_structure`, `suggest_page_structure`, or
`suggest_table_structure` when the outer interaction shape is already known.
Each accepts a non-empty `goal` and returns the same versioned plan contract as
`plan_ui` with the corresponding kind fixed.

## Contract correctness

### `validate_usage`

Parses an Angular template with `@angular/compiler` and checks the resulting AST
against the generated NeuralNg public contracts. It understands Angular control
flow, structural directives, interpolation, property/event/two-way bindings,
custom elements, and NeuralNg attribute selectors on native elements. It
reports stable diagnostic codes with source positions for Angular syntax
errors, unknown selectors or bindings, missing required inputs, invalid literal
unions (including exported type aliases), inaccessible icon-only buttons,
missing standalone imports, required providers, and duplicate Toast channels.

```json
{
  "template": "<neural-button icon=\"trash\"></neural-button>",
  "imports_json": "[\"NeuralButton\"]",
  "providers_json": "[]"
}
```

The schema-v2 result includes `valid`, parser identity and version, syntax
status, diagnostics, exact suggested imports grouped by entry point, and
provider requirements. `NNG000` identifies Angular parse failures before
contract validation. Informational missing-import diagnostics do not make a
template invalid; error diagnostics do.

## Project-aware tools

### `inspect_project`

Inspects the Angular workspace used as the MCP process working directory and
returns declared Angular/NeuralNg package versions, workspace kind, summary
counts, used selectors and occurrence locations, icon classes and stylesheets,
imports grouped by entry point, configured providers, theme and Appearance
setup, inferred conventions, and actionable diagnostics. External templates,
inline component templates and attribute directives are parsed with
`@angular/compiler`; invented APIs and accessibility failures therefore use the
same diagnostics as `validate_usage`.

The scan is read-only and accepts no filesystem path. It skips dependencies,
build output, VCS data, tests, declarations, and symlinks. Work is bounded to
400 source files, 256 KiB per file, and 5 MiB in total; the result explicitly
reports truncation and analysis confidence. Absolute paths are not returned,
and component/icon evidence is capped at 25 relative paths per item while
`filesOmitted` preserves the omitted count. Package versions are declarations
from the workspace `package.json`, not claims about runtime resolution.
Diagnostics validate selectors and APIs present in the generated MCP catalog;
an unknown selector from a separate package remains visible instead of being
silently treated as valid.

`inspect_neuralng_project` remains as a compatibility alias and returns the
same schema-v2 result. New agents should call `inspect_project`.

### `suggest_consistent_ui`

Combines `inspect_project` with the composition engine. It identifies
which planned primitives already have a project convention, which ones are new,
and how to preserve the detected theme, unstyled ownership, and import style.
The schema-v2 result includes per-component relative-path evidence, exact import
reuse/add partitions, required-provider deltas, declared Core versus catalog
version alignment, bounded project risks, and explicit next calls to
`get_component_examples` and `validate_usage`. It returns focused project context
rather than duplicating the full `inspect_project` result.

```json
{
  "goal": "Add a searchable project table with a detail drawer",
  "kind": "table"
}
```

## Compact theme tools

The theme workflow intentionally operates on the small recipe rather than the
resolved 1,348-token Core and Editor graph.

### `create_theme_recipe`

```json
{
  "name": "violet-workspace",
  "options_json": "{\"preset\":\"glass\",\"primary\":\"#7c3aed\",\"radius\":\"large\"}"
}
```

### `validate_theme_recipe`

```json
{
  "recipe_json": "{\"schemaVersion\":1,\"name\":\"violet-workspace\",\"extends\":\"neutral\"}"
}
```

### `edit_theme_recipe`

Applies a bounded, prototype-safe sparse patch and validates the result. Theme
validation rejects declaration injection, external CSS URLs, malformed aliases,
and unknown component tokens before compilation.

```json
{
  "recipe_json": "{\"schemaVersion\":1,\"name\":\"violet-workspace\",\"extends\":\"neutral\"}",
  "patch_json": "{\"set\":{\"color.primary\":\"#7c3aed\",\"shape.radius\":\"large\"}}"
}
```

### `diff_theme_recipes`

Returns only changed dotted recipe paths instead of repeating both recipes.

### `get_component_theme_contract`

Returns one component's supported theme properties. Use `detail: "names"` by
default and request `detail: "defaults"` only when current mode values are
needed.

```json
{
  "component": "toast",
  "detail": "names"
}
```

### Recipe versions and quality metadata

Theme MCP tools author schema version 1. Early preview recipes should first be
migrated with `neural-theme migrate` or `migrateThemeRecipe()` from
`@neural-ng/theme`; MCP remains read-only and does not rewrite user files.
Preset resources include stability and quality governance metadata so agents can
prefer `release` baselines unless the user explicitly requests a preview style.

### `compile_theme_recipe`

Runs the real `@neural-ng/theme` compiler and returns validation diagnostics,
summary data, artifact byte sizes and integration instructions. It deliberately
does not send full CSS or token artifacts through the model context. Generate
those files with:

```bash
npx neural-theme build
```

## Catalog source

The committed component catalog is generated from:

- `tsconfig.base.json` public `@neural-ng/core/*` paths;
- each public secondary entry point's `index.ts`;
- public Angular component and directive selectors;
- package exports, README files and `llms.txt` files.

Regenerate and verify it with:

```bash
npx nx run neural-mcp:catalog
npx nx run neural-mcp:catalog-check
```

## Quality commands

```bash
npx nx lint neural-mcp
npx nx test neural-mcp
npx nx build neural-mcp
npx nx run neural-mcp:package-test
npx nx run neural-mcp:mcp-smoke
```

`mcp-smoke` packs both `@neural-ng/theme` and the MCP server, installs them into
an isolated temporary consumer, initializes stdio MCP, reads component and theme
resources, then calls component discovery and compact theme compiler tools.
