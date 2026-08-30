# NeuralNg 0.1.0 Beta

NeuralNg is now public: an AI-first, headless and Signal-native Angular 22+ UI system designed first for coding agents and fully usable by human developers.

## Highlights

- 51 documented Angular components with exact secondary entry points
- 6,184 framework-independent Neural Icons
- strict TypeScript, Signals, Angular Forms and deterministic hydration
- native accessibility and keyboard contracts
- stable Neutral theme plus unstyled and typed class-slot workflows
- read-only MCP discovery and compact theme tooling
- package-level and component-level `llms.txt` context
- a portable NeuralNg Agent Skill

## Install

```bash
npm install @neural-ng/core @neural-ng/icons
```

```css
@import '@neural-ng/icons/icons.css';
@import '@neural-ng/core/themes/neutral.css';
```

Run the MCP server:

```bash
npx -y @neural-ng/mcp-server
```

Documentation: https://neuralng.dev

The project is in beta. Public APIs may change before the first stable release; Neutral or `unstyled` is recommended for production-sensitive customization.
