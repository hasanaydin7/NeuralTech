import { readFile } from 'node:fs/promises';

const siteOrigin = 'https://neuralng.dev';
const sitemapUrl = `${siteOrigin}/sitemap.xml`;
const keyLocation = `${siteOrigin}/indexnow-key.txt`;
const endpoint = 'https://api.indexnow.org/indexnow';
const dryRun = process.argv.includes('--dry-run');

const key = (
  await readFile(
    new URL('../apps/neural-site/public/indexnow-key.txt', import.meta.url),
    'utf8',
  )
).trim();

if (!/^[a-f0-9-]{8,128}$/.test(key)) {
  throw new Error(
    'The IndexNow key must contain 8-128 hexadecimal characters.',
  );
}

const sitemapResponse = await fetch(sitemapUrl, {
  headers: { 'user-agent': 'NeuralNg-IndexNow/1.0' },
});
if (!sitemapResponse.ok) {
  throw new Error(
    `Could not read ${sitemapUrl}: HTTP ${sitemapResponse.status}.`,
  );
}

const sitemap = await sitemapResponse.text();
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
  match[1].replaceAll('&amp;', '&'),
);

if (urlList.length === 0 || urlList.length > 10_000) {
  throw new Error(`Unexpected IndexNow URL count: ${urlList.length}.`);
}

for (const value of urlList) {
  if (new URL(value).origin !== siteOrigin) {
    throw new Error(`Refusing to submit an external URL: ${value}`);
  }
}

if (dryRun) {
  console.log(`IndexNow dry run: ${urlList.length} NeuralNg URLs are valid.`);
} else {
  const keyResponse = await fetch(keyLocation, { cache: 'no-store' });
  if (!keyResponse.ok || (await keyResponse.text()).trim() !== key) {
    throw new Error(
      `The deployed IndexNow key is not available at ${keyLocation}.`,
    );
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: new URL(siteOrigin).hostname,
      key,
      keyLocation,
      urlList,
    }),
  });

  if (!response.ok && response.status !== 202) {
    throw new Error(
      `IndexNow rejected the submission: HTTP ${response.status} ${await response.text()}`,
    );
  }

  console.log(
    `Submitted ${urlList.length} NeuralNg URLs to IndexNow (HTTP ${response.status}).`,
  );
}
