/* global chrome */
import { chromium, expect } from '@playwright/test';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';

// A new temporary Chromium profile only; never connects to the user's browser.
export async function assertButtonBrowserZoom(
  url,
  temporaryConsumer,
  artifacts,
) {
  const extension = fileURLToPath(
    new URL('./button-consumer/zoom-extension/', import.meta.url),
  );
  const context = await chromium.launchPersistentContext(
    join(temporaryConsumer, 'zoom-profile'),
    {
      channel: 'chromium',
      headless: true,
      viewport: { width: 1280, height: 900 },
      args: [
        `--disable-extensions-except=${extension}`,
        `--load-extension=${extension}`,
      ],
    },
  );
  try {
    const worker =
      context.serviceWorkers()[0] ??
      (await context.waitForEvent('serviceworker'));
    const page = await context.newPage();
    await page.goto(url);
    await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
    const initialWidth = await page.evaluate(() => innerWidth);
    const zoom = await worker.evaluate(async (url) => {
      const tab = (await chrome.tabs.query({})).find((tab) => tab.url === url);
      if (!tab?.id) throw new Error('Isolated local acceptance tab not found');
      await chrome.tabs.setZoom(tab.id, 2);
      return chrome.tabs.getZoom(tab.id);
    }, page.url());
    expect(zoom).toBe(2);
    await expect
      .poll(() => page.evaluate(() => innerWidth))
      .toBeLessThan(initialWidth * 0.55);
    const matrix = page.locator('#button-matrix');
    const viewportWidth = await page.evaluate(() => innerWidth);
    const geometry = await matrix.locator('button').evaluateAll((buttons) =>
      buttons.map((el) => ({
        left: el.getBoundingClientRect().left,
        right: el.getBoundingClientRect().right,
        overflow: el.scrollWidth - el.clientWidth,
      })),
    );
    expect(geometry).toHaveLength(147);
    for (const box of geometry) {
      expect(box.left).toBeGreaterThanOrEqual(-1);
      expect(box.right).toBeLessThanOrEqual(viewportWidth + 1);
      expect(box.overflow).toBeLessThanOrEqual(1);
    }
    await mkdir(artifacts, { recursive: true });
    await matrix.screenshot({
      path: join(artifacts, 'matrix-browser-zoom-200.png'),
      animations: 'disabled',
    });
    console.log(
      `Real Chromium tab zoom ${zoom * 100}%: CSS viewport ${initialWidth} -> ${viewportWidth}px, 147 Button controls reflow without clipping passed.`,
    );
  } finally {
    await context.close();
  }
}
