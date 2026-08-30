# Contributing to NeuralNg

Thanks for helping build NeuralNg.

## Before starting

Open an issue for broad API changes. Small bug fixes and documentation
improvements may go directly to a pull request. Keep each change focused and
preserve unrelated work in the repository.

## Development

```bash
npm ci
npm run dev
```

Use Node 24 and npm 11. Do not commit generated `dist`, Angular cache,
Playwright output or packed `.tgz` files.

## Component contract

Every public component must include:

- a standalone, Signal-native API and strict exported types;
- a dedicated secondary entry point, or a dedicated package for dependency-heavy
  foundations such as Editor;
- native semantics, keyboard behavior and accessible names;
- SSR-safe behavior and deterministic hydration output;
- local/global unstyled support and typed class slots;
- Neutral tokens plus Glass/Futuristic token compatibility;
- unit tests, demo documentation, Playwright coverage, README and `llms.txt`;
- a package-test assertion for public exports and packaged assets.

Use Neural Icons instead of introducing an unrelated icon runtime. Keep
Editor-only runtime dependencies and theme tokens inside `@neural-ng/editor`; do
not leak them into Core.

## Verification

```bash
npm run format:check
npm run lint
npm test
npm run build
npm run package:test
npm run e2e:chromium
```

Explain user-visible behavior and test evidence in pull requests. Call out
breaking API, accessibility, SSR, bundle-size or theme-token changes.
