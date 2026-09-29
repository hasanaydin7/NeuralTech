import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { promisify } from 'node:util';
import { chromium, firefox, webkit, expect } from '@playwright/test';

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run through npm/Nx.');
const temporaryRoot = resolve('tmp');
await mkdir(temporaryRoot, { recursive: true });
const consumer = await mkdtemp(join(temporaryRoot, 'icons-browser-'));
assert(consumer.startsWith(temporaryRoot + sep));
const execute = promisify(execFile);
const npm = (args) =>
  execute(process.execPath, [npmCli, ...args], {
    cwd: consumer,
    timeout: 120000,
    maxBuffer: 4 * 1024 * 1024,
  });
let server;
try {
  const packed = JSON.parse(
    (await npm(['pack', resolve('dist/libs/neural-icons'), '--json'])).stdout,
  )[0];
  const files = new Set(packed.files.map((file) => file.path));
  for (const file of [
    'LICENSE',
    'THIRD_PARTY_NOTICES.md',
    'metadata.json',
    'manifest.json',
    'outline.css',
    'filled.css',
    'all.css',
    'icons.css',
    'brands.css',
  ])
    assert(files.has(file), `Missing packed file ${file}`);
  assert(
    ![...files].some((file) => file.startsWith('scripts/')),
    'Build scripts leaked into package',
  );
  await writeFile(
    join(consumer, 'package.json'),
    JSON.stringify({
      name: 'icons-browser-consumer',
      private: true,
      dependencies: { '@neural-ng/icons': `file:./${packed.filename}` },
    }),
  );
  await npm(['install', '--ignore-scripts', '--no-audit', '--no-fund']);
  const packageRoot = join(consumer, 'node_modules/@neural-ng/icons');
  const metadata = JSON.parse(
    await readFile(join(packageRoot, 'metadata.json'), 'utf8'),
  );
  const cssFiles = [
    'icons.css',
    'outline.css',
    'filled.css',
    'all.css',
    'brands.css',
  ];
  for (const category of metadata.categories) {
    if (category.outline) cssFiles.push(`categories/${category.name}.css`);
    if (category.filled)
      cssFiles.push(`categories/filled/${category.name}.css`);
  }
  const assets = new Map(
    await Promise.all(
      cssFiles.map(async (file) => [
        `/${file}`,
        await readFile(join(packageRoot, file)),
      ]),
    ),
  );
  server = createServer((request, response) => {
    const url = new URL(request.url, 'http://localhost');
    if (assets.has(url.pathname)) {
      response.writeHead(200, { 'Content-Type': 'text/css' });
      response.end(assets.get(url.pathname));
      return;
    }
    if (url.pathname !== '/' && url.pathname !== '/blocked') {
      response.writeHead(404);
      response.end();
      return;
    }
    const entry = url.searchParams.get('entry') ?? 'icons.css';
    if (!cssFiles.includes(entry)) {
      response.writeHead(400);
      response.end();
      return;
    }
    response.writeHead(200, {
      'Content-Type': 'text/html',
      'Content-Security-Policy': `default-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self'${url.pathname === '/blocked' ? '' : ' data:'};`,
    });
    response.end(
      `<!doctype html><html lang="en"><head><link rel="stylesheet" href="/${entry}"></head><body style="color:rgb(17,83,149);font-size:32px"><button aria-label="Profile"><i class="nt nt-user" aria-hidden="true"></i></button><span id="normal" class="nt nt-user" aria-hidden="true"></span><span id="filled" class="nt nt-filled-user" aria-hidden="true"></span><span id="spin" class="nt nt-loader-3 nt-spin" aria-hidden="true"></span><span id="reverse" class="nt nt-loader-3 nt-spin-reverse" aria-hidden="true"></span><span id="dual" class="nt nt-loader-3 nt-spin-dual" style="--nt-spin-duration:2s;--nt-spin-inner-duration:0.5s" aria-hidden="true"></span><span id="fallback" class="nt nt-user nt-spin-dual" aria-hidden="true"></span></body></html>`,
    );
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const names = process.env.NEURAL_ICONS_BROWSERS?.split(',') ?? ['chromium'];
  for (const name of names) {
    console.log(`Checking ${name} packed consumer...`);
    const engine = { chromium, firefox, webkit }[name];
    assert(engine, `Unknown browser ${name}`);
    const browser = await engine.launch();
    try {
      const page = await browser.newPage();
      const errors = [];
      const remote = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('request', (request) => {
        if (
          !request.url().startsWith(origin) &&
          !request.url().startsWith('data:')
        )
          remote.push(request.url());
      });
      await page.addInitScript(() => {
        window.iconViolations = [];
        document.addEventListener('securitypolicyviolation', (event) =>
          window.iconViolations.push({
            directive: event.effectiveDirective,
            uri: event.blockedURI,
          }),
        );
      });
      await page.goto(origin);
      await expect(page.getByRole('button', { name: 'Profile' })).toBeVisible();
      await expect(page.locator('#normal')).toHaveCSS('width', '32px');
      await expect(page.locator('#normal')).toHaveCSS('height', '32px');
      await expect(page.locator('#normal')).toHaveCSS(
        'background-color',
        'rgb(17, 83, 149)',
      );
      await expect(page.locator('#spin')).toHaveCSS(
        'animation-direction',
        'normal',
      );
      await expect(page.locator('#reverse')).toHaveCSS(
        'animation-direction',
        'reverse',
      );
      await expect(page.locator('#fallback')).toHaveCSS(
        'animation-name',
        'nt-spin',
      );
      const layers = await page.locator('#dual').evaluate((el) =>
        ['::before', '::after'].map((pseudo) => {
          const s = getComputedStyle(el, pseudo);
          return {
            mask: s.maskImage || s.webkitMaskImage,
            direction: s.animationDirection,
            duration: s.animationDuration,
            color: s.backgroundColor,
          };
        }),
      );
      assert(
        layers.every(
          (layer) =>
            layer.mask.includes('data:image/svg+xml') &&
            layer.color === 'rgb(17, 83, 149)',
        ),
      );
      assert.equal(layers[0].direction, 'normal');
      assert.equal(layers[1].direction, 'reverse');
      assert.equal(layers[0].duration, '2s');
      assert.equal(layers[1].duration, '0.5s');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      for (const id of ['spin', 'reverse', 'fallback'])
        await expect(page.locator(`#${id}`)).toHaveCSS(
          'animation-name',
          'none',
        );
      assert.deepEqual(
        await page
          .locator('#dual')
          .evaluate((el) =>
            ['::before', '::after'].map(
              (p) => getComputedStyle(el, p).animationName,
            ),
          ),
        ['none', 'none'],
      );
      await page.goto(`${origin}/?entry=all.css`);
      console.log(`${name}: motion passed; checking catalog styles`);
      const missing = await page.evaluate((icons) => {
        const container = document.createElement('div');
        container.style.display = 'none';
        document.body.append(container);
        const classes = icons.flatMap((icon) =>
          icon.styles.map(
            (style) => `nt-${style === 'filled' ? 'filled-' : ''}${icon.name}`,
          ),
        );
        const elements = classes.map((className) => {
          const el = document.createElement('i');
          el.className = `nt ${className}`;
          container.append(el);
          return el;
        });
        return classes.filter((className, index) => {
          const el = elements[index];
          const style = getComputedStyle(el);
          const mask = style.maskImage || style.webkitMaskImage;
          return !mask?.includes('data:image/svg+xml');
        });
      }, metadata.icons);
      assert.deepEqual(missing, [], `${name}: missing full-catalog masks`);
      assert.deepEqual(
        await page.evaluate(() => window.iconViolations),
        [],
        'Allowed data CSP must render without violations',
      );
      await page.goto(`${origin}/blocked`);
      await expect
        .poll(() =>
          page.evaluate(() =>
            window.iconViolations.some(
              (event) => event.directive === 'img-src' && event.uri === 'data',
            ),
          ),
        )
        .toBe(true);
      assert.deepEqual(errors, []);
      assert.deepEqual(remote, []);
      console.log(
        `PASS ${name}: packed consumer, 6184 masks, inherited color/size, dual/reverse/fallback, reduced motion and CSP`,
      );
    } finally {
      await browser.close();
    }
  }
} finally {
  if (server) await new Promise((resolve) => server.close(resolve));
  // consumer is a freshly allocated child of the validated repository tmp root.
  await rm(consumer, { recursive: true, force: true });
}
