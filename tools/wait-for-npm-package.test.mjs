import assert from 'node:assert/strict';
import test from 'node:test';
import { waitForPackage } from './wait-for-npm-package.mjs';

const manifest = { name: '@neural-ng/mcp-server', version: '1.0.0-rc.2' };
const available = () => new Response(JSON.stringify(manifest));

function harness(responses, extra = {}) {
  let time = 0;
  let calls = 0;
  const options = {
    timeoutMs: 100,
    intervalMs: 20,
    now: () => time,
    sleep: async (ms) => {
      time += ms;
    },
    log: () => {},
    fetchMetadata: async (url, init) => {
      assert.equal(
        url,
        'https://registry.npmjs.org/%40neural-ng%2Fmcp-server/1.0.0-rc.2',
      );
      assert.ok(init.signal instanceof AbortSignal);
      assert.equal(init.headers['Cache-Control'], 'no-cache');
      return responses[Math.min(calls++, responses.length - 1)]();
    },
    ...extra,
  };
  return { options, calls: () => calls, time: () => time };
}

test('already available package needs one read', async () => {
  const h = harness([available]);
  await waitForPackage(manifest, h.options);
  assert.equal(h.calls(), 1);
});

test('processing, rate limiting, server and network failures recover', async () => {
  const h = harness([
    () => new Response('', { status: 404 }),
    () => new Response('', { status: 429 }),
    () => new Response('', { status: 503 }),
    () => {
      throw new TypeError('Network error');
    },
    available,
  ]);
  await waitForPackage(manifest, h.options);
  assert.equal(h.calls(), 5);
});

test('wrong metadata is not accepted as a published package', async () => {
  const h = harness([
    () => new Response(JSON.stringify({ ...manifest, version: '1.0.0-rc.1' })),
    available,
  ]);
  await waitForPackage(manifest, h.options);
  assert.equal(h.calls(), 2);
});

test('deadline is bounded and explains metadata-only recovery', async () => {
  const h = harness([() => new Response('', { status: 404 })], {
    intervalMs: 30,
  });
  await assert.rejects(
    waitForPackage(manifest, h.options),
    /Do not republish.*Publish MCP Registry metadata/,
  );
  assert.equal(h.time(), 100);
  assert.equal(h.calls(), 4);
});

test('authentication failures fail immediately', async () => {
  const h = harness([() => new Response('', { status: 403 })]);
  await assert.rejects(waitForPackage(manifest, h.options), /HTTP 403/);
  assert.equal(h.calls(), 1);
});

test('default processing window is ten minutes, with no real waiting', async () => {
  const h = harness([() => new Response('', { status: 404 })]);
  delete h.options.timeoutMs;
  delete h.options.intervalMs;
  await assert.rejects(waitForPackage(manifest, h.options), /after 600s/);
  assert.equal(h.time(), 600_000);
  assert.equal(h.calls(), 40);
});

test('a timed-out registry request is retried', async () => {
  const h = harness([
    () => {
      throw new DOMException('Timeout', 'TimeoutError');
    },
    available,
  ]);
  await waitForPackage(manifest, h.options);
  assert.equal(h.calls(), 2);
});
