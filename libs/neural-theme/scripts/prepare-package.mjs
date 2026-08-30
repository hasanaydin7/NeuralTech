import { chmod, copyFile, cp, mkdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import process from 'node:process';

const workspaceRoot = process.cwd();
const sourceRoot = resolve(workspaceRoot, 'libs/neural-theme');
const outputRoot = resolve(workspaceRoot, 'dist/libs/neural-theme');

await mkdir(outputRoot, { recursive: true });
for (const filename of ['package.json', 'README.md', 'llms.txt']) {
  await copyFile(join(sourceRoot, filename), join(outputRoot, filename));
}
await copyFile(join(workspaceRoot, 'LICENSE'), join(outputRoot, 'LICENSE'));
await cp(join(sourceRoot, 'assets'), join(outputRoot, 'assets'), {
  recursive: true,
});
await copyFile(
  join(sourceRoot, 'assets/schema.json'),
  join(outputRoot, 'schema.json'),
);
await mkdir(join(outputRoot, 'presets'), { recursive: true });
for (const preset of ['neutral', 'glass', 'mist', 'futuristic']) {
  await copyFile(
    join(sourceRoot, `assets/presets/${preset}.recipe.json`),
    join(outputRoot, `presets/${preset}.json`),
  );
}
await copyFile(
  join(sourceRoot, 'assets/presets/catalog.json'),
  join(outputRoot, 'presets/catalog.json'),
);
await copyFile(
  join(sourceRoot, 'assets/presets/quality-baseline.json'),
  join(outputRoot, 'presets/quality-baseline.json'),
);
await mkdir(join(outputRoot, 'contracts'), { recursive: true });
await copyFile(
  join(sourceRoot, 'assets/contracts/neutral.tokens.json'),
  join(outputRoot, 'contracts/neutral.tokens.json'),
);
await rm(join(outputRoot, 'tsconfig.lib.tsbuildinfo'), { force: true });
await chmod(join(outputRoot, 'src/cli.js'), 0o755);

console.log('Prepared dist/libs/neural-theme for npm packaging.');
