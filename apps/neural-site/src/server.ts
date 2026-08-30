import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
const prerenderManifestPath = resolve(
  serverDistFolder,
  '../prerendered-routes.json',
);
let cachedPrerenderedRoutes: ReadonlySet<string> | undefined;

const app = express();
app.disable('x-powered-by');
const configuredHosts = (process.env['NG_ALLOWED_HOSTS'] ?? '')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean);
const angularApp = new AngularNodeAppEngine({
  allowedHosts: [...new Set(['localhost', '127.0.0.1', ...configuredHosts])],
});

app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  );
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains',
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

app.get('/robots.txt', (req, res) => {
  res
    .type('text/plain')
    .send(`User-agent: *\nAllow: /\nSitemap: ${siteOrigin(req)}/sitemap.xml\n`);
});

app.get('/healthz', (_req, res) => {
  res.type('text/plain').send('ok');
});

app.get('/sitemap.xml', (req, res) => {
  const origin = siteOrigin(req);
  const urls = [...prerenderedRoutes()]
    .filter((route) => route !== '/404')
    .sort()
    .map((route) => `  <url><loc>${origin}${escapeXml(route)}</loc></url>`)
    .join('\n');
  res
    .type('application/xml')
    .send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    );
});

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/**', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1h',
    index: false,
    redirect: false,
    setHeaders: (res, path) => {
      if (/[-.][A-Z0-9]{8,}\.(?:css|js)$/i.test(path)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use('/**', (req, res, next) => {
  const route = normalizeRoute(
    new URL(req.originalUrl, 'http://localhost').pathname,
  );
  const knownRoutes = prerenderedRoutes();
  const knownRoute = knownRoutes.size === 0 || knownRoutes.has(route);
  angularApp
    .handle(req)
    .then(async (response) => {
      if (!response) {
        const notFoundHtml = readFileSync(
          resolve(browserDistFolder, '404', 'index.html'),
          'utf8',
        );
        const notFoundResponse = await secureHtmlResponse(
          new Response(notFoundHtml, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
            status: 404,
            statusText: 'Not Found',
          }),
          siteOrigin(req),
          route,
          true,
        );
        return writeResponseToNodeResponse(notFoundResponse, res);
      }
      const statusResponse = knownRoute
        ? response
        : new Response(response.body, {
            headers: response.headers,
            status: 404,
            statusText: 'Not Found',
          });
      const output = await secureHtmlResponse(
        statusResponse,
        siteOrigin(req),
        route,
        !knownRoute || route === '/404',
      );
      return writeResponseToNodeResponse(output, res);
    })
    .catch(next);
});

function prerenderedRoutes(): ReadonlySet<string> {
  if (cachedPrerenderedRoutes) return cachedPrerenderedRoutes;
  if (!existsSync(prerenderManifestPath)) return new Set<string>();
  const manifest = JSON.parse(readFileSync(prerenderManifestPath, 'utf8')) as {
    routes: Record<string, unknown>;
  };
  cachedPrerenderedRoutes = new Set(Object.keys(manifest.routes));
  return cachedPrerenderedRoutes;
}

function normalizeRoute(path: string): string {
  if (path === '/') return path;
  return path.replace(/\/+$/, '') || '/';
}

function siteOrigin(req: express.Request): string {
  const configured = process.env['NEURAL_SITE_ORIGIN']?.trim();
  return (configured || `${req.protocol}://${req.get('host')}`).replace(
    /\/+$/,
    '',
  );
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function secureHtmlResponse(
  response: Response,
  origin: string,
  route: string,
  notFound: boolean,
): Promise<Response> {
  if (!response.headers.get('content-type')?.includes('text/html')) {
    return response;
  }
  const html = publicSeoMetadata(
    await response.text(),
    origin,
    route,
    notFound,
  );
  const hashes = inlineScriptHashes(html);
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.set('Content-Security-Policy', securityPolicy(hashes));
  return new Response(html, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
}

function publicSeoMetadata(
  source: string,
  origin: string,
  route: string,
  notFound: boolean,
): string {
  const html = source
    .replace(/<link\b[^>]*\brel=["']canonical["'][^>]*>\s*/gi, '')
    .replace(
      /<meta\b[^>]*(?:property=["']og:(?:url|image)["']|name=["']twitter:image["'])[^>]*>\s*/gi,
      '',
    );

  if (notFound) {
    return html.replace(
      /<meta\b[^>]*\bname=["']robots["'][^>]*>/i,
      '<meta name="robots" content="noindex, follow">',
    );
  }

  const canonical = escapeHtmlAttribute(`${origin}${route}`);
  const socialImage = escapeHtmlAttribute(`${origin}/img/dark-landing.webp`);
  const tags = [
    `<link rel="canonical" href="${canonical}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:image" content="${socialImage}">`,
    `<meta name="twitter:image" content="${socialImage}">`,
  ].join('');
  return html.replace('</head>', `${tags}</head>`);
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inlineScriptHashes(html: string): string[] {
  const hashes = new Set<string>();
  const pattern = /<script\b(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html))) {
    hashes.add(
      `'sha256-${createHash('sha256').update(match[1], 'utf8').digest('base64')}'`,
    );
  }
  return [...hashes];
}

function securityPolicy(scriptHashes: readonly string[]): string {
  const criticalCssHandlerHash = `'sha256-${createHash('sha256')
    .update("this.media='all'", 'utf8')
    .digest('base64')}'`;
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "connect-src 'self'",
    "font-src 'self' data:",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data:",
    "object-src 'none'",
    `script-src 'self' 'unsafe-hashes' ${criticalCssHandlerHash} ${scriptHashes.join(' ')}`.trim(),
    "style-src 'self' 'unsafe-inline'",
    'upgrade-insecure-requests',
  ].join('; ');
}

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the host and port defined by `HOST` and `PORT`, defaulting to 0.0.0.0:4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const host = process.env['HOST'] || '0.0.0.0';
  const port = Number.parseInt(process.env['PORT'] || '4000', 10);
  app.listen(port, host, () => {
    console.log(`Node Express server listening on http://${host}:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
