import {
  assertFile,
  assertIncludes,
  readJson,
  readText,
  routePath,
} from './shared.mjs';

const contract = await readJson('tools/neural-docs/docs-contract.json');
const navigation = await readText(
  'apps/neural-site/src/app/pages/docs/docs-layout.html',
);
const routes = await readText('apps/neural-site/src/app/app.routes.ts');
const coreManifest = await readJson('libs/neural-ng/package.json');

for (const packageContract of contract.packages) {
  await assertFile(packageContract.manifest);
  const manifest = await readJson(packageContract.manifest);

  if (manifest.name !== packageContract.name) {
    throw new Error(
      `${packageContract.manifest} publishes ${manifest.name}; expected ${packageContract.name}.`,
    );
  }

  assertIncludes(
    navigation,
    `routerLink="${packageContract.docsRoute}"`,
    `${packageContract.name} navigation`,
  );
}

for (const requiredFile of contract.starter.requiredFiles) {
  await assertFile(`${contract.starter.root}/${requiredFile}`);
}

for (const pilot of contract.pilots) {
  await Promise.all([
    assertFile(pilot.page),
    assertFile(pilot.controller),
    assertFile(pilot.readme),
    assertFile(pilot.llms),
  ]);

  assertIncludes(
    navigation,
    `routerLink="${pilot.route}"`,
    `${pilot.id} navigation`,
  );
  assertIncludes(
    routes,
    `path: '${routePath(pilot.route).replace(/^components\//, 'components/')}'`,
    `${pilot.id} route`,
  );

  const page = await readText(pilot.page);
  for (const section of pilot.requiredSections) {
    assertIncludes(page, `id="${section}"`, `${pilot.id} documentation page`);
  }

  const secondary = pilot.entryPoint.replace('@neural-ng/core/', './');
  if (!coreManifest.exports?.[`${secondary}/README.md`]) {
    throw new Error(`${pilot.entryPoint} does not export its README.`);
  }
  if (!coreManifest.exports?.[`${secondary}/llms.txt`]) {
    throw new Error(`${pilot.entryPoint} does not export its llms.txt.`);
  }
}

console.log(
  `Neural docs contract is current: ${contract.packages.length} packages, ${contract.pilots.length} canonical pilot.`,
);
