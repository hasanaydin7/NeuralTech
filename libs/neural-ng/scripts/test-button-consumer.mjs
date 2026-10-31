import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { build } from 'esbuild';
import { chromium, expect } from '@playwright/test';
import { assertButtonIntegration } from './button-consumer/assertions.mjs';
import { assertButtonVisualContract } from './button-visual-acceptance.mjs';
import { assertButtonBrowserZoom } from './button-zoom-acceptance.mjs';

const root = process.cwd();
const npmCli = process.env['npm_execpath'];
if (!npmCli) throw new Error('Run through npm or Nx.');
const temporaryRoot = resolve(root, 'tmp');
await mkdir(temporaryRoot, { recursive: true });
const consumer = await mkdtemp(join(temporaryRoot, 'button-consumer-'));
if (!consumer.startsWith(temporaryRoot + sep))
  throw new Error('Unsafe cleanup path');
const execute = promisify(execFile);
const run = (file, args) =>
  execute(process.execPath, [file, ...args], {
    cwd: consumer,
    timeout: 180_000,
    maxBuffer: 5 * 1024 * 1024,
  });
let browser;
let server;
try {
  const packed = await run(npmCli, [
    'pack',
    resolve(root, 'dist/libs/neural-ng'),
    '--pack-destination',
    consumer,
    '--json',
  ]);
  const archive = JSON.parse(packed.stdout)[0]?.filename;
  if (!archive) throw new Error('Core packing failed');
  let angularVersion = process.env['NEURAL_CORE_ANGULAR_VERSION'];
  if (angularVersion === 'latest-22') {
    const result = await run(npmCli, [
      'view',
      '@angular/core@22',
      'version',
      '--json',
    ]);
    const versions = JSON.parse(result.stdout);
    angularVersion = (Array.isArray(versions) ? versions : [versions])
      .filter((v) => /^22\.\d+\.\d+$/.test(v))
      .sort((a, b) => {
        const x = a.split('.').map(Number),
          y = b.split('.').map(Number);
        return x[1] - y[1] || x[2] - y[2];
      })
      .at(-1);
    if (!angularVersion) throw new Error('No stable Angular 22 version found');
  }
  if (angularVersion && !/^22\.\d+\.\d+$/.test(angularVersion))
    throw new Error('Expected exact stable Angular 22 version');
  const dependencies = {};
  for (const name of [
    '@angular/common',
    '@angular/core',
    '@angular/compiler',
    '@angular/compiler-cli',
    '@angular/forms',
    '@angular/router',
    '@angular/platform-browser',
    '@angular/platform-server',
    'typescript',
    'rxjs',
    'tslib',
  ]) {
    dependencies[name] = JSON.parse(
      await readFile(join(root, 'node_modules', name, 'package.json'), 'utf8'),
    ).version;
    if (angularVersion && name.startsWith('@angular/'))
      dependencies[name] = angularVersion;
  }
  dependencies['@neural-ng/core'] = `file:./${archive}`;
  await writeFile(
    join(consumer, 'package.json'),
    JSON.stringify({
      name: 'button-package-consumer',
      private: true,
      type: 'module',
      dependencies,
    }),
  );
  await run(npmCli, ['install', '--ignore-scripts', '--no-audit', '--no-fund']);
  console.log(
    `Installed packed Core with Angular ${dependencies['@angular/core']} and TypeScript ${dependencies.typescript}.`,
  );
  for (const file of ['app.ts', 'client.ts', 'server.ts'])
    await copyFile(
      join(root, 'libs/neural-ng/scripts/button-consumer', file),
      join(consumer, file),
    );
  await writeFile(
    join(consumer, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
        module: 'ES2022',
        moduleResolution: 'bundler',
        experimentalDecorators: true,
        strict: true,
        skipLibCheck: false,
        types: [],
        lib: ['ES2022', 'DOM'],
        outDir: './out',
        rootDir: '.',
      },
      angularCompilerOptions: {
        strictTemplates: true,
        strictInjectionParameters: true,
      },
      files: ['app.ts', 'client.ts', 'server.ts'],
    }),
  );
  const ngc = join(
    consumer,
    'node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js',
  );
  await run(ngc, ['-p', 'tsconfig.json']);
  await writeFile(
    join(consumer, 'negative.ts'),
    `import {Component} from '@angular/core';
import {NeuralButton} from '@neural-ng/core/button';
@Component({imports:[NeuralButton],template:'<neural-button [imaginaryNeuralInput]="true" [label]="42" />'})
export class InvalidButton {}`,
  );
  await writeFile(
    join(consumer, 'tsconfig.negative.json'),
    JSON.stringify({
      extends: './tsconfig.json',
      compilerOptions: { noEmit: true },
      files: ['negative.ts'],
    }),
  );
  let diagnostics = '';
  try {
    await run(ngc, ['-p', 'tsconfig.negative.json']);
  } catch (e) {
    diagnostics = `${e.stdout ?? ''}\n${e.stderr ?? ''}`;
  }
  if (
    !diagnostics.includes('NG8002') ||
    !diagnostics.includes('imaginaryNeuralInput') ||
    !/Type 'number' is not assignable to type 'string/.test(diagnostics)
  )
    throw new Error(
      `Invalid Button compiler canary not rejected: ${diagnostics}`,
    );
  console.log(
    'Strict installed Button templates and both negative compiler canaries passed.',
  );
  await build({
    entryPoints: [join(consumer, 'out/server.js')],
    bundle: true,
    packages: 'external',
    format: 'esm',
    platform: 'node',
    outfile: join(consumer, 'server.mjs'),
    logLevel: 'silent',
  });
  await build({
    entryPoints: [join(consumer, 'out/client.js')],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    outfile: join(consumer, 'app.js'),
    logLevel: 'silent',
  });
  const { render } = await import(
    pathToFileURL(join(consumer, 'server.mjs')).href
  );
  const html = await render(
    '<!doctype html><html lang="en"><head><title>Button package acceptance</title><link rel="stylesheet" href="/style.css"></head><body><neural-ssr-consumer></neural-ssr-consumer><script type="module" src="/app.js"></script></body></html>',
  );
  expect(html).toContain('ngh=');
  const assets = new Map([
    ['/', { type: 'text/html', body: html }],
    [
      '/app.js',
      {
        type: 'text/javascript',
        body: await readFile(join(consumer, 'app.js')),
      },
    ],
    [
      '/style.css',
      {
        type: 'text/css',
        body: await readFile(
          join(consumer, 'node_modules/@neural-ng/core/themes/neutral.css'),
        ),
      },
    ],
  ]);
  server = createServer((request, response) => {
    if (request.url === '/favicon.ico') {
      response.writeHead(204);
      response.end();
      return;
    }
    const asset = assets.get(request.url);
    response.writeHead(asset ? 200 : 404, {
      'Content-Type': asset?.type ?? 'text/plain',
    });
    response.end(asset?.body ?? 'Not found');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await page.route('**/app.js', async (route) => {
    await gate;
    await route.continue();
  });
  const navigation = page.goto(`http://127.0.0.1:${server.address().port}/`, {
    waitUntil: 'load',
  });
  await expect(
    page.getByRole('button', { name: 'Save settings', exact: true }),
  ).toHaveAttribute('type', 'button');
  await expect(page.locator('#button-matrix [data-case]')).toHaveCount(49);
  await page.evaluate(() => {
    window.ssrNodes = Array.from(
      document.querySelectorAll('button,input,[role="group"]'),
    );
    window.ssrIds = window.ssrNodes.map((n) => n.id);
  });
  release();
  await navigation;
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  // whenStable can precede event-replay cleanup. Do not interact with SSR-only
  // listeners while the latest Angular hydration implementation is still replaying.
  await expect(page.locator('neural-ssr-consumer [jsaction]')).toHaveCount(0);
  expect(
    await page.evaluate(() => {
      const nodes = Array.from(
        document.querySelectorAll('button,input,[role="group"]'),
      );
      return (
        nodes.length === window.ssrNodes.length &&
        nodes.every(
          (n, i) => n === window.ssrNodes[i] && n.id === window.ssrIds[i],
        )
      );
    }),
  ).toBe(true);
  const ids = await page
    .locator('[id]')
    .evaluateAll((nodes) => nodes.map((n) => n.id));
  expect(new Set(ids).size).toBe(ids.length);
  await assertButtonIntegration(page);
  expect(errors).toEqual([]);
  const artifacts = join(
    root,
    'tmp/button-acceptance',
    dependencies['@angular/core'],
  );
  await assertButtonBrowserZoom(page.url(), consumer, artifacts);
  await assertButtonVisualContract(page, artifacts);
  expect(errors).toEqual([]);
  console.log(
    'Button family installed-package acceptance passed without source aliases or unrelated component fixtures.',
  );
} finally {
  await browser?.close();
  if (server) await new Promise((resolve) => server.close(resolve));
  await rm(consumer, { recursive: true, force: true });
}
