import { appendFileSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const checkOnly = process.argv.includes('--check');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npmExecPath = process.env.npm_execpath;

if (
  !checkOnly &&
  (process.env.GITHUB_ACTIONS !== 'true' ||
    !process.env.GITHUB_REF_NAME?.startsWith('npm-release-'))
) {
  throw new Error(
    'Publishing is only allowed from an npm-release-* tag in GitHub Actions.',
  );
}

const packages = [
  ['@neural-ng/theme', 'libs/neural-theme'],
  ['@neural-ng/icons', 'libs/neural-icons'],
  ['@neural-ng/core', 'libs/neural-ng'],
  ['@neural-ng/editor', 'libs/neural-editor'],
  ['@neural-ng/mcp-server', 'libs/neural-mcp'],
];

function runNpm(args, options = {}) {
  if (process.platform === 'win32' && npmExecPath) {
    return spawnSync(process.execPath, [npmExecPath, ...args], options);
  }

  return spawnSync(npmCommand, args, {
    ...options,
    shell: process.platform === 'win32',
  });
}

function readManifest(directory) {
  return JSON.parse(readFileSync(resolve(directory, 'package.json'), 'utf8'));
}

function inspectPublishedVersion(name, version) {
  const result = runNpm(['view', `${name}@${version}`, 'version', '--json'], {
    encoding: 'utf8',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status === 0) {
    return true;
  }

  const output = `${result.stdout}\n${result.stderr}`;
  if (output.includes('E404') || output.includes('404 Not Found')) {
    return false;
  }

  throw new Error(
    `Could not inspect ${name}@${version} on npm.\n${output.trim()}`,
  );
}

function publish(directory) {
  const result = runNpm(
    [
      'publish',
      resolve('dist', directory),
      '--access',
      'public',
      '--tag',
      'latest',
    ],
    { stdio: 'inherit' },
  );

  if (result.status !== 0) {
    throw new Error(`npm publish failed for dist/${directory}.`);
  }
}

const results = [];

for (const [expectedName, directory] of packages) {
  const sourceManifest = readManifest(directory);
  const outputManifest = readManifest(resolve('dist', directory));

  if (
    sourceManifest.name !== expectedName ||
    outputManifest.name !== expectedName
  ) {
    throw new Error(`Unexpected package name for ${directory}.`);
  }

  if (sourceManifest.version !== outputManifest.version) {
    throw new Error(
      `${expectedName} source version ${sourceManifest.version} does not match ` +
        `built version ${outputManifest.version}.`,
    );
  }

  const spec = `${expectedName}@${sourceManifest.version}`;
  if (inspectPublishedVersion(expectedName, sourceManifest.version)) {
    console.log(`skip ${spec}: already published`);
    results.push(`- Skipped \`${spec}\` (already published)`);
    continue;
  }

  if (checkOnly) {
    console.log(`ready ${spec}`);
    results.push(`- Ready \`${spec}\``);
    continue;
  }

  console.log(`publish ${spec}`);
  publish(directory);
  results.push(`- Published \`${spec}\` with the \`latest\` dist-tag`);
}

const readyCount = results.filter(
  (result) => !result.includes('Skipped'),
).length;
if (readyCount === 0) {
  throw new Error('No unpublished package version was found for this release.');
}

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `## npm release\n\n${results.join('\n')}\n`,
  );
}
