import {
  chmod,
  copyFile,
  mkdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { join, resolve } from 'node:path';
import process from 'node:process';

const workspaceRoot = process.cwd();
const sourceRoot = resolve(workspaceRoot, 'libs/neural-mcp');
const outputRoot = resolve(workspaceRoot, 'dist/libs/neural-mcp');

await mkdir(outputRoot, { recursive: true });
for (const filename of [
  'package.json',
  'README.md',
  'CHANGELOG.md',
  'llms.txt',
  'server.json',
]) {
  await copyFile(join(sourceRoot, filename), join(outputRoot, filename));
}
await copyFile(join(workspaceRoot, 'LICENSE'), join(outputRoot, 'LICENSE'));
const packageJson = JSON.parse(
  await readFile(join(sourceRoot, 'package.json'), 'utf8'),
);
const compiledServerPath = join(outputRoot, 'src/server.js');
const compiledServer = await readFile(compiledServerPath, 'utf8');
const versionPlaceholder = '__NEURAL_MCP_PACKAGE_VERSION__';
if (!compiledServer.includes(versionPlaceholder)) {
  throw new Error('Compiled MCP server is missing the version placeholder.');
}
await writeFile(
  compiledServerPath,
  compiledServer.replaceAll(versionPlaceholder, packageJson.version),
  'utf8',
);
await rm(join(outputRoot, 'tsconfig.lib.tsbuildinfo'), { force: true });
await chmod(join(outputRoot, 'src/cli.js'), 0o755);

console.log('Prepared dist/libs/neural-mcp for npm packaging.');
