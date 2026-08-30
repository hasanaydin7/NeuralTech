import { chmod, copyFile, mkdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import process from 'node:process';

const workspaceRoot = process.cwd();
const sourceRoot = resolve(workspaceRoot, 'libs/neural-mcp');
const outputRoot = resolve(workspaceRoot, 'dist/libs/neural-mcp');

await mkdir(outputRoot, { recursive: true });
for (const filename of ['package.json', 'README.md', 'llms.txt']) {
  await copyFile(join(sourceRoot, filename), join(outputRoot, filename));
}
await copyFile(join(workspaceRoot, 'LICENSE'), join(outputRoot, 'LICENSE'));
await rm(join(outputRoot, 'tsconfig.lib.tsbuildinfo'), { force: true });
await chmod(join(outputRoot, 'src/cli.js'), 0o755);

console.log('Prepared dist/libs/neural-mcp for npm packaging.');
