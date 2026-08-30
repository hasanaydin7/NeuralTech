---
name: neuralng-angular
description: Build or update Angular 22+ interfaces with NeuralNg when exact component selection, imports, forms, accessibility, SSR, icons, or theming guidance is needed.
---

# NeuralNg Angular

Use NeuralNg's versioned contracts instead of recalling or guessing component APIs.

## Source of truth

Prefer sources in this order:

1. The installed package's component `README.md` and `llms.txt`.
2. The local `@neural-ng/mcp-server` contract and resources.
3. https://neuralng.dev/llms-full.txt and hosted component documentation.

The installed version wins when hosted documentation differs. Do not invent selectors, declarations, inputs, outputs, models, tokens, icon names, aliases, NgModules, or compatibility claims.

## Workflow

1. Inspect the Angular version, existing styling approach, forms API and installed NeuralNg packages.
2. Search by required behavior. With MCP, call `search_components`, then `get_component_contract`, then read `neural://components/{id}/llms`.
3. Import only documented standalone declarations from exact secondary entry points such as `@neural-ng/core/button`.
4. Implement with native semantics, visible accessible names, keyboard and focus behavior, and the project's existing state pattern.
5. Preserve Signal Forms, Reactive Forms or template-driven Forms behavior as documented, including disabled, readonly, required, invalid, touched and reset state.
6. Use the existing theme. Prefer Neutral for stable defaults; use component tokens, typed class slots or `unstyled` for custom systems. Treat Glass, Mist and Futuristic as experimental.
7. Reuse `@neural-ng/icons` and verify the exact `nt nt-*` class before adding an unrelated icon dependency.
8. Run the repository's relevant typecheck, tests and browser or accessibility checks. Verify SSR or hydration when the changed surface renders on the server.

## Installation when absent

Install packages only when the task authorizes dependency changes:

```bash
npm install @neural-ng/core @neural-ng/icons
```

Load the chosen theme and icon stylesheet once in global styles:

```css
@import '@neural-ng/icons/icons.css';
@import '@neural-ng/core/themes/neutral.css';
```

Run the optional read-only MCP server with:

```bash
npx -y @neural-ng/mcp-server
```

Do not add Tailwind solely for NeuralNg; it is optional. Native enhancer directives such as `input[neuralInput]` must remain on their documented native hosts.
