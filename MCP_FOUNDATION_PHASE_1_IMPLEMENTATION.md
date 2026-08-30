# MCP Foundation Phase 1 Implementation

## Status

Complete: read-only NeuralNg discovery server and deterministic catalog.

## Published package

```text
@neural-ng/mcp-server
```

Run it over stdio:

```bash
npx -y @neural-ng/mcp-server
```

The MCP package is independent from `@neural-ng/core`, `@neural-ng/editor`, and
`@neural-ng/icons`. Angular application bundles do not receive MCP runtime
dependencies.

## Catalog source of truth

`libs/neural-mcp/scripts/generate-catalog.mjs` derives the committed catalog
from repository contracts rather than maintaining a second hand-written
component database:

1. `tsconfig.base.json` public `@neural-ng/core/*` paths;
2. each secondary entry point's `index.ts` public exports;
3. public Angular component and directive selectors;
4. `libs/neural-ng/package.json` documented exports and themes;
5. component README and `llms.txt` content.

The generator stores a SHA-256 source digest and `catalog-check` fails when the
committed output is stale.

Catalog generation also fails when a public component entry point has no
`README.md` or `llms.txt`.

Checkbox-specific overrides lock the repaired contracts:

```text
neural-checkbox
FormCheckboxControl
checked: boolean

neural-tri-state-checkbox
FormValueControl<boolean | null>
value: boolean | null
```

## MCP resources

Fixed resource URIs are registered at server creation:

```text
neural://catalog
neural://package/exports
neural://themes/catalog
neural://components/{id}/contract
neural://components/{id}/readme
neural://components/{id}/llms
```

The server does not convert URI segments into filesystem paths. Unknown and
traversal-like URIs cannot read files.

## MCP tools

All Phase 1 tools are read-only, deterministic, idempotent, and closed-world:

- `search_components`
- `get_component_contract`
- `recommend_components`

`recommend_components` is rule-based. It makes no model call and performs no
network request.

## Transport and protocol

The CLI uses the official TypeScript MCP SDK v2 and its `serveStdio` entry.
Standard output is reserved for JSON-RPC protocol traffic. Fatal startup errors
are written to standard error.

Published runtime dependencies:

```text
@modelcontextprotocol/server 2.0.0
zod ^4.3.5
```

The workspace source compiles without coupling Angular packages to either
runtime. The published MCP package declares and installs them for consumers.

## Tests

Unit coverage verifies:

- public catalog and entry-point coverage;
- binary and tri-state checkbox contracts;
- deterministic search ordering;
- nullable permission recommendation;
- fixed resources and traversal rejection;
- package export and theme resources.

Package verification checks the built npm shape, executable shebang,
dependencies, no Angular runtime dependency, catalog size, and public API.

The stdio smoke test:

1. packs the built npm package;
2. installs it in an isolated temporary consumer;
3. launches the published CLI;
4. performs MCP initialization;
5. lists tools and resources;
6. reads the tri-state contract resource;
7. calls `recommend_components`;
8. rejects non-JSON protocol output on stdout.

## Quality commands

```bash
npx nx run neural-mcp:catalog-check --outputStyle=static
npx nx lint neural-mcp --outputStyle=static
npx nx test neural-mcp --outputStyle=static
npx nx build neural-mcp --outputStyle=static
npx nx run neural-mcp:package-test --outputStyle=static
npx nx run neural-mcp:mcp-smoke --outputStyle=static
```

## Deferred from Phase 1

The following remain intentionally out of scope until component contracts are
more stable:

- project-aware validation;
- code generation;
- automated migrations;
- repository writes or shell execution;
- package installation tools;
- HTTP deployment and authorization;
- remote network access.
