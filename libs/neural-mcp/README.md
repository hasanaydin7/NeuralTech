# @neural-ng/mcp-server

Read-only Model Context Protocol server for NeuralNg component discovery,
contracts, package exports, documentation and compact theme recipe workflows.

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

Component and package resources:

- `neural://catalog`
- `neural://package/exports`
- `neural://components/{id}/contract`
- `neural://components/{id}/readme`
- `neural://components/{id}/llms`

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

### `get_component_contract`

Resolves a component by catalog id, class name, selector or public entry point.

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
