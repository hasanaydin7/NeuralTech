import { readText } from './shared.mjs';

const navigation = await readText(
  'apps/neural-site/src/app/pages/docs/docs-layout.html',
);
const routes = await readText('apps/neural-site/src/app/app.routes.ts');

const navigationRoutes = new Set(
  [...navigation.matchAll(/routerLink="([^"]+)"/g)].map((match) => match[1]),
);
const configuredRoutes = new Set(
  [...routes.matchAll(/path:\s*'([^']+)'/g)]
    .map((match) => match[1])
    .filter((route) => route && route !== '**' && route !== 'docs')
    .map((route) => `/docs/${route}`),
);

const missingRoutes = [...navigationRoutes].filter(
  (route) => !configuredRoutes.has(route),
);

if (missingRoutes.length > 0) {
  throw new Error(
    `Navigation contains routes without lazy documentation pages:\n${missingRoutes
      .map((route) => `- ${route}`)
      .join('\n')}`,
  );
}

const componentRoutes = [...navigationRoutes].filter((route) =>
  route.startsWith('/docs/components/'),
);

console.log(
  `Neural docs coverage: ${navigationRoutes.size} navigable pages, ${componentRoutes.length} component pages, 0 missing routes.`,
);
