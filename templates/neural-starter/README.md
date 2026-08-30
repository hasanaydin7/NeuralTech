# Neural Starter

A clean Angular 22 + Tailwind v4 consumer template for the complete NeuralNg
suite:

- `@neural-ng/core`
- `@neural-ng/icons`
- `@neural-ng/editor`
- `@neural-ng/theme` as build-time tooling
- `@neural-ng/mcp-server` as a development tool

## Registry install

```bash
npm install @neural-ng/core@alpha @neural-ng/icons@alpha @neural-ng/editor@alpha
npm install --save-dev @neural-ng/theme@alpha @neural-ng/mcp-server@alpha
npm install
npm run theme:validate
npm run build
npm run test:e2e
```

## Local tarball install

When validating unpublished builds, install all five packed files into a clean
copy outside the NeuralTech workspace:

```powershell
npm install `
  D:\NeuralTech-Packages\neural-ng-core-0.1.0-beta.0.tgz `
  D:\NeuralTech-Packages\neural-ng-icons-0.1.0-beta.0.tgz `
  D:\NeuralTech-Packages\neural-ng-editor-0.1.0-beta.0.tgz

npm install --save-dev `
  D:\NeuralTech-Packages\neural-ng-theme-0.1.0-beta.0.tgz `
  D:\NeuralTech-Packages\neural-ng-mcp-server-0.1.0-beta.0.tgz
```

No source import from the NeuralTech workspace is allowed. The template must
build only from installed package exports and assets.

## Theme workflow

`neural.theme.json` is the compact source. `npm run theme:build` expands it into
complete Core + Editor CSS in `src/styles/generated/starter.css`.

```bash
npm run theme:validate
npm run theme:build
```

The application stylesheet imports Tailwind, Icons and the generated theme:

```css
@import 'tailwindcss';
@import '@neural-ng/icons/icons.css';
@import './styles/generated/starter.css';
```

Do not also import Core or Editor Neutral CSS; generated theme CSS already
contains both token contracts and the Tailwind bridge.

## MCP

`mcp.json` starts the installed `neural-ng-mcp` executable without downloading
another package:

```json
{
  "command": "npx",
  "args": ["--no-install", "neural-ng-mcp"]
}
```
