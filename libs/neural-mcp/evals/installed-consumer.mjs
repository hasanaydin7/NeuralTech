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
import { promisify } from 'node:util';
import { build } from 'esbuild';
import { chromium, expect } from '@playwright/test';
import { createStdioClient } from './stdio-client.mjs';

const execute = promisify(execFile);
const root = process.cwd();
const npmCli = process.env['npm_execpath'];
if (!npmCli) throw new Error('Run through npm or Nx.');
const temporaryRoot = resolve(root, 'tmp');
await mkdir(temporaryRoot, { recursive: true });
const consumer = await mkdtemp(join(temporaryRoot, 'mcp-installed-consumer-'));
if (!consumer.startsWith(temporaryRoot + sep))
  throw new Error('Unsafe cleanup path');
let browser;
let server;
let client;
const run = (file, args) =>
  execute(process.execPath, [file, ...args], {
    cwd: consumer,
    timeout: 180_000,
    maxBuffer: 5 * 1024 * 1024,
  });
try {
  const packed = await run(npmCli, [
    'pack',
    resolve(root, 'dist/libs/neural-ng'),
    '--pack-destination',
    consumer,
    '--json',
  ]);
  const tarball = JSON.parse(packed.stdout)[0]?.filename;
  if (!tarball) throw new Error('Core packing failed.');
  const dependencies = {};
  for (const name of [
    '@angular/common',
    '@angular/core',
    '@angular/compiler',
    '@angular/compiler-cli',
    '@angular/forms',
    '@angular/router',
    '@angular/platform-browser',
    'typescript',
    'rxjs',
    'tslib',
  ]) {
    dependencies[name] = JSON.parse(
      await readFile(join(root, 'node_modules', name, 'package.json'), 'utf8'),
    ).version;
  }
  dependencies['@neural-ng/core'] = `file:./${tarball}`;
  for (const [name, directory] of [
    ['@neural-ng/mcp-server', 'neural-mcp'],
    ['@neural-ng/theme', 'neural-theme'],
  ]) {
    const result = await run(npmCli, [
      'pack',
      resolve(root, 'dist/libs', directory),
      '--pack-destination',
      consumer,
      '--json',
    ]);
    const archive = JSON.parse(result.stdout)[0]?.filename;
    if (!archive) throw new Error(`No archive for ${name}`);
    dependencies[name] = `file:./${archive}`;
  }
  await writeFile(
    join(consumer, 'package.json'),
    JSON.stringify({
      name: 'mcp-installed-consumer',
      private: true,
      type: 'module',
      dependencies,
    }),
  );
  await run(npmCli, ['install', '--ignore-scripts', '--no-audit', '--no-fund']);
  console.log(
    'Installed the Core tarball and pinned Angular dependencies in an isolated consumer.',
  );
  for (const file of ['users.ts', 'users.html']) {
    await copyFile(
      join(root, 'libs/neural-mcp/evals/consumer', file),
      join(consumer, file),
    );
  }
  await writeFile(
    join(consumer, 'styles.css'),
    "@import '@neural-ng/core/themes/neutral.css';\n",
  );
  const observedFiles = [
    'users.ts',
    'users.html',
    'package.json',
    'styles.css',
  ];
  const before = await Promise.all(
    observedFiles.map((file) => readFile(join(consumer, file), 'utf8')),
  );
  client = createStdioClient(
    join(consumer, 'node_modules/@neural-ng/mcp-server/src/cli.js'),
    consumer,
  );
  await client.request('initialize', {
    protocolVersion: '2025-11-25',
    capabilities: {},
    clientInfo: {
      name: 'neural-installed-consumer-acceptance',
      version: '1.0.0',
    },
  });
  client.notify('notifications/initialized', {});
  const tool = async (name, args = {}) => {
    const result = await client.request('tools/call', {
      name,
      arguments: args,
    });
    if (result.isError) throw new Error(`${name}: ${JSON.stringify(result)}`);
    return result.structuredContent;
  };
  const core = JSON.parse(
    await readFile(
      join(consumer, 'node_modules/@neural-ng/core/package.json'),
      'utf8',
    ),
  );
  const inspection = (await tool('inspect_project')).inspection;
  expect(inspection.framework.installedCoreVersion).toBe(core.version);
  expect(inspection.framework.installedAngularVersion).toBe(
    dependencies['@angular/core'],
  );
  expect(inspection.themes).toContain('neutral');
  const suggestion = (
    await tool('suggest_consistent_ui', {
      goal: 'User management table with search, role filter, pagination, detail drawer and delete confirmation',
      kind: 'table',
    })
  ).suggestion;
  expect(suggestion.compatibility.status).toBe('aligned');
  expect(suggestion.compatibility.installedCoreVersion).toBe(core.version);
  expect(suggestion.plan.components.map((component) => component.id)).toEqual(
    expect.arrayContaining([
      'table',
      'neural-paginator',
      'select',
      'neural-drawer',
      'confirm-dialog',
      'button',
    ]),
  );
  for (const component of suggestion.plan.components) {
    const contract = (
      await tool('get_component', {
        component: component.id,
        detail: 'standard',
      })
    ).component;
    expect(contract.className).toBe(component.className);
    expect(suggestion.plan.imports[component.entryPoint]).toContain(
      contract.className,
    );
  }
  const examples = await tool('get_component_examples', {
    component: 'table',
    limit: 2,
  });
  expect(examples.examples.length).toBeGreaterThan(0);
  const cell = (
    await tool('get_component', {
      component: 'NeuralTableCellDirective',
      detail: 'standard',
    })
  ).component;
  const imports = [
    ...Object.values(suggestion.plan.imports).flat(),
    cell.className,
  ];
  const validation = (
    await tool('validate_usage', {
      template: before[1],
      imports_json: JSON.stringify(imports),
      providers_json: JSON.stringify(
        suggestion.plan.providers.map((provider) => provider.name),
      ),
    })
  ).validation;
  expect(validation.diagnostics).toEqual([]);
  const invalid = (
    await tool('validate_usage', {
      template: '<neural-button icon="nt nt-trash" ariaLabel="" />',
      imports_json: '["NeuralButton"]',
    })
  ).validation;
  expect(invalid.valid).toBe(false);
  expect(invalid.diagnostics).toContainEqual(
    expect.objectContaining({ code: 'NNG201' }),
  );
  expect(
    await Promise.all(
      observedFiles.map((file) => readFile(join(consumer, file), 'utf8')),
    ),
  ).toEqual(before);
  await client.close();
  client = undefined;
  console.log(
    'Packed MCP passed stdio project/version/theme, composition, exact contracts, examples, validation and read-only checks.',
  );
  await writeFile(
    join(consumer, 'main.ts'),
    `import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { UsersPage } from './users';
bootstrapApplication(UsersPage).catch(error => { console.error(error); });`,
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
        skipLibCheck: true,
        types: [],
        lib: ['ES2022', 'DOM'],
        outDir: './out',
        rootDir: '.',
      },
      angularCompilerOptions: {
        strictTemplates: true,
        strictInjectionParameters: true,
      },
      files: ['main.ts', 'users.ts'],
    }),
  );
  await run(
    join(consumer, 'node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js'),
    ['-p', 'tsconfig.json'],
  );
  console.log(
    'Installed-package consumer passed strict Angular compilation (no workspace path aliases).',
  );
  await build({
    entryPoints: [join(consumer, 'out/main.js')],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    outfile: join(consumer, 'app.js'),
    logLevel: 'silent',
  });
  const assets = new Map([
    [
      '/',
      {
        type: 'text/html',
        body: '<!doctype html><html lang="en"><head><title>MCP acceptance</title><link rel="stylesheet" href="/style.css"></head><body><neural-mcp-eval-users></neural-mcp-eval-users><script type="module" src="/app.js"></script></body></html>',
      },
    ],
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
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const table = page.getByRole('table', { name: 'Users' });
  await expect(table.getByText('Ada', { exact: true })).toBeVisible();
  await expect(table.getByText('Grace', { exact: true })).toBeVisible();
  await expect(table.getByText('Linus', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(table.getByText('Linus', { exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Search users' }).fill('Ada');
  await expect(table.getByText('Ada', { exact: true })).toBeVisible();
  await expect(table.getByText('Linus', { exact: true })).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Search users' }).fill('');
  await page.getByRole('combobox', { name: 'Filter by role' }).click();
  await page.getByRole('option', { name: 'Member', exact: true }).click();
  await expect(table.getByText('Ada', { exact: true })).toHaveCount(0);
  await expect(table.getByText('Grace', { exact: true })).toBeVisible();
  const grace = table.getByRole('row').filter({ hasText: 'Grace' });
  await grace.getByRole('button', { name: 'View user details' }).click();
  const drawer = page.getByRole('dialog', { name: 'User details' });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText('Grace', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await grace.getByRole('button', { name: 'Delete user', exact: true }).click();
  const confirmation = page.getByRole('dialog', { name: 'Delete user?' });
  await expect(confirmation).toBeVisible();
  await expect(table.getByText('Grace', { exact: true })).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(confirmation).toBeHidden();
  await expect(table.getByText('Grace', { exact: true })).toBeVisible();
  await grace.getByRole('button', { name: 'Delete user', exact: true }).click();
  await confirmation
    .getByRole('button', { name: 'Confirm', exact: true })
    .click();
  await expect(confirmation).toBeHidden();
  await expect(table.getByText('Grace', { exact: true })).toHaveCount(0);
  await expect(table.getByText('Linus', { exact: true })).toBeVisible();
  if (errors.length) throw new Error(`Browser errors: ${errors.join('\n')}`);
  console.log(
    'Chromium passed: pagination, search/page reset, role filter, details/Escape, delete cancel and accept.',
  );
} finally {
  await client?.close();
  await browser?.close();
  if (server) await new Promise((resolve) => server.close(resolve));
  await rm(consumer, { recursive: true, force: true });
}
