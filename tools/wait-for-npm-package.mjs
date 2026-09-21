import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Read-only polling: never retries npm publish or changes a dist-tag.
export async function waitForPackage(
  { name, version },
  {
    timeoutMs = 600_000,
    intervalMs = 15_000,
    requestTimeoutMs = 10_000,
    fetchMetadata = fetch,
    now = Date.now,
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    log = console.log,
  } = {},
) {
  if (!name || !version)
    throw new Error('Package name and version are required.');
  const spec = `${name}@${version}`;
  const url = `https://registry.npmjs.org/${encodeURIComponent(name)}/${encodeURIComponent(version)}`;
  const deadline = now() + timeoutMs;
  let lastStatus = 'not checked';
  for (let attempt = 1; now() < deadline; attempt++) {
    let response;
    try {
      response = await fetchMetadata(url, {
        headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
        signal: AbortSignal.timeout(
          Math.max(1, Math.min(requestTimeoutMs, deadline - now())),
        ),
      });
      if (response.ok) {
        const metadata = await response.json();
        if (metadata.name === name && metadata.version === version) {
          log(`Available: ${spec} (attempt ${attempt}).`);
          return;
        }
        lastStatus =
          'metadata does not yet match the requested package/version';
      } else {
        lastStatus = `HTTP ${response.status}`;
        await response.body?.cancel();
      }
    } catch (error) {
      lastStatus = `request failed (${error.name})`;
    }
    if (
      response &&
      !response.ok &&
      ![404, 429].includes(response.status) &&
      response.status < 500
    ) {
      throw new Error(
        `Cannot check ${spec}: ${lastStatus}. Check registry access.`,
      );
    }
    const remaining = deadline - now();
    if (remaining <= 0) break;
    log(
      `Waiting for ${spec}: ${lastStatus}; ${Math.ceil(remaining / 1000)}s remaining.`,
    );
    await sleep(Math.min(intervalMs, remaining));
  }
  throw new Error(
    `${spec} is not available after ${timeoutMs / 1000}s (${lastStatus}). ` +
      'npm may still be processing the accepted upload. Do not republish it. ' +
      'Once it is available, run the Publish MCP Registry metadata workflow on main.',
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const manifest = JSON.parse(
      readFileSync('libs/neural-mcp/package.json', 'utf8'),
    );
    await waitForPackage(manifest);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
