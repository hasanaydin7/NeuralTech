import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import process from 'node:process';

const workspaceRoot = process.cwd();
const outputRoot = resolve(workspaceRoot, 'dist/libs/neural-theme');
const baselinePath = resolve(
  workspaceRoot,
  'libs/neural-theme/assets/presets/quality-baseline.json',
);
const update = process.argv.includes('--update');

const api = await import(
  pathToFileURL(resolve(outputRoot, 'src/browser.js')).href
);
const presets = api.listThemePresets();
const snapshots = [];

for (const preset of presets) {
  const recipe = {
    schemaVersion: 1,
    name: `quality-${preset.id}`,
    extends: preset.id,
    modes: { dark: 'auto' },
    output: { tailwind: false, tokens: true, report: true, types: true },
  };
  const validation = api.validateThemeRecipe(recipe);
  if (!validation.valid) {
    throw new Error(
      `${preset.id} preset recipe is invalid: ${JSON.stringify(validation.diagnostics)}`,
    );
  }

  const artifacts = api.compileTheme(recipe, {
    includeTailwind: false,
    scope: 'theme',
  });
  const report = JSON.parse(artifacts.report);
  const diagnostics = [...(report.diagnostics ?? [])].sort((left, right) =>
    `${left.code}:${left.path}`.localeCompare(
      `${right.code}:${right.path}`,
      'en',
    ),
  );
  const errors = diagnostics.filter(
    (diagnostic) => diagnostic.severity === 'error',
  );
  if (errors.length > 0) {
    throw new Error(
      `${preset.id} preset emitted blocking diagnostics: ${JSON.stringify(errors)}`,
    );
  }

  const allowed = new Set(preset.quality.allowedDiagnosticCodes);
  const unexpected = diagnostics.filter(
    (diagnostic) => !allowed.has(diagnostic.code),
  );
  if (unexpected.length > 0) {
    throw new Error(
      `${preset.id} preset emitted ungoverned diagnostics: ${JSON.stringify(unexpected)}`,
    );
  }
  if (preset.quality.status === 'release' && diagnostics.length > 0) {
    throw new Error(
      `${preset.id} is release quality but emitted diagnostics: ${JSON.stringify(diagnostics)}`,
    );
  }

  snapshots.push({
    id: preset.id,
    stability: preset.stability,
    quality: preset.quality,
    sourceHash: artifacts.summary.sourceHash,
    contractTokens: report.contract.tokens,
    diagnostics: diagnostics.map(({ severity, code, path }) => ({
      severity,
      code,
      path,
    })),
    artifacts: {
      cssBytes: Buffer.byteLength(artifacts.css),
      cssSha256: digest(artifacts.css),
      tokensBytes: Buffer.byteLength(artifacts.tokens),
      tokensSha256: digest(artifacts.tokens),
      reportSha256: digest(artifacts.report),
    },
  });
}

const baseline = `${JSON.stringify({ version: 1, presets: snapshots }, null, 2)}\n`;
if (update) {
  await writeFile(baselinePath, baseline, 'utf8');
  console.log(`Updated ${baselinePath}.`);
} else {
  let current = '';
  try {
    current = await readFile(baselinePath, 'utf8');
  } catch {
    throw new Error(
      'Theme quality baseline is missing. Run `node libs/neural-theme/scripts/check-quality.mjs --update` after building neural-theme.',
    );
  }
  if (normalize(current) !== baseline) {
    throw new Error(
      'Theme preset quality baseline is stale. Review the generated artifact changes, then run `node libs/neural-theme/scripts/check-quality.mjs --update`.',
    );
  }
  console.log(
    `Neural theme quality gate passed for ${snapshots.length} presets (${snapshots.map((entry) => entry.id).join(', ')}).`,
  );
}

function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

function normalize(value) {
  return value.replace(/\r\n/g, '\n');
}
