#!/usr/bin/env node
import { serveNeuralMcpStdio } from './server.js';

serveNeuralMcpStdio().catch((error: unknown) => {
  const message =
    error instanceof Error ? (error.stack ?? error.message) : String(error);
  console.error(`NeuralNg MCP server failed: ${message}`);
  process.exitCode = 1;
});
