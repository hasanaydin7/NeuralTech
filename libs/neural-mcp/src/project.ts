import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { basename, extname, join, relative, resolve } from 'node:path';
import { getComponentContract } from './catalog.js';
import { planUi } from './composition.js';
import { validateUsage } from './validation.js';
import type {
  NeuralConsistentUiSuggestion,
  NeuralProjectComponentUsage,
  NeuralProjectDiagnostic,
  NeuralProjectInspection,
} from './types.js';

const MAX_FILES = 400;
const MAX_FILE_BYTES = 256 * 1024;
const MAX_TOTAL_BYTES = 5 * 1024 * 1024;
const SOURCE_EXTENSIONS = new Set(['.ts', '.html', '.css', '.scss']);
const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.nx',
  '.angular',
  'coverage',
  'dist',
  'node_modules',
  'tmp',
]);

interface SourceRecord {
  readonly path: string;
  readonly content: string;
}

interface MutableUsage {
  readonly id: string;
  readonly className: string;
  readonly selector: string;
  readonly entryPoint: string;
  occurrences: number;
  readonly files: Set<string>;
}

export async function inspectNeuralProject(
  workspaceRoot = process.cwd(),
): Promise<NeuralProjectInspection> {
  const root = resolve(workspaceRoot);
  const diagnostics: NeuralProjectDiagnostic[] = [];
  const packageJson = await readPackageJson(root, diagnostics);
  const sourceResult = await readProjectSources(root);
  const imports = new Map<string, Set<string>>();
  const usages = new Map<string, MutableUsage>();
  const themes = new Set<string>();
  const providers = new Set<string>();
  let providerConfigured = false;
  let globalConfigConfigured = false;
  let unstyled = false;
  let rootImports = 0;
  let exactImports = 0;

  for (const source of sourceResult.sources) {
    for (const imported of extractImports(source.content)) {
      const values = imports.get(imported.entryPoint) ?? new Set<string>();
      for (const symbol of imported.symbols) values.add(symbol);
      imports.set(imported.entryPoint, values);
      if (imported.entryPoint === '@neural-ng/core') rootImports += 1;
      else exactImports += 1;
    }

    for (const match of source.content.matchAll(/<(neural-[a-z0-9-]+)\b/gi)) {
      const selector = match[1].toLowerCase();
      const contract = getComponentContract(selector);
      if (!contract) {
        continue;
      }
      const usage = usages.get(contract.id) ?? {
        id: contract.id,
        className: contract.className,
        selector: contract.selector,
        entryPoint: contract.entryPoint,
        occurrences: 0,
        files: new Set<string>(),
      };
      usage.occurrences += 1;
      usage.files.add(source.path);
      usages.set(contract.id, usage);
    }

    for (const theme of extractThemes(source.content)) themes.add(theme);
    for (const provider of source.content.matchAll(
      /\b(provideNeural[A-Z]\w*)\s*\(/g,
    )) {
      providers.add(provider[1]);
    }
    providerConfigured ||= /\bprovideNeuralAppearance\s*\(/.test(
      source.content,
    );
    globalConfigConfigured ||= /\bprovideNeuralNg\s*\(/.test(source.content);
    unstyled ||=
      /\bprovideNeuralNg\s*\(\s*\{[\s\S]{0,600}?unstyled\s*:\s*true/.test(
        source.content,
      );

    if (
      /\b(?:ColorModeService|NeuralColorModeService)\b/.test(source.content)
    ) {
      diagnostics.push({
        code: 'NNP004',
        severity: 'warning',
        message: 'Legacy color-mode service usage was detected.',
        file: source.path,
        suggestion:
          'Use NeuralAppearanceService as the single color-mode and palette owner.',
      });
    }
  }

  const projectImports = [...imports.values()].flatMap((symbols) => [
    ...symbols,
  ]);
  for (const source of sourceResult.sources) {
    if (!source.content.includes('<neural-')) continue;
    const validation = validateUsage({
      template: source.content,
      imports: projectImports,
      providers: [...providers],
    });
    for (const item of validation.diagnostics) {
      if (item.severity === 'info' || item.code === 'NNG002') continue;
      diagnostics.push({
        code: item.code,
        severity: item.severity,
        message: item.message,
        file: source.path,
        line: item.line,
        column: item.column,
        suggestion: item.suggestion,
      });
    }
  }

  const neuralPackages = collectNeuralPackages(packageJson);
  const angularVersion = dependencyVersion(packageJson, '@angular/core');
  const versionFamilies = new Set(
    Object.values(neuralPackages).map(normalizeVersionFamily).filter(Boolean),
  );
  if (versionFamilies.size > 1) {
    diagnostics.push({
      code: 'NNP002',
      severity: 'warning',
      message:
        'Installed @neural-ng packages do not share the same version family.',
      suggestion: 'Align NeuralNg package versions before generating new UI.',
    });
  }
  if (usages.size > 0 && themes.size === 0 && !unstyled) {
    diagnostics.push({
      code: 'NNP003',
      severity: 'warning',
      message:
        'NeuralNg components are used without a detected theme import or global unstyled mode.',
      suggestion:
        "Import '@neural-ng/core/themes/neutral.css' or deliberately configure unstyled mode.",
    });
  }
  for (const theme of themes) {
    if (theme === 'glass' || theme === 'mist' || theme === 'futuristic') {
      diagnostics.push({
        code: 'NNP005',
        severity: 'warning',
        message: `Experimental NeuralNg theme "${theme}" is active.`,
        suggestion:
          'Prefer neutral for production or continue with explicit unstyled ownership.',
      });
    }
  }

  const importStyle =
    rootImports && exactImports
      ? 'mixed'
      : exactImports
        ? 'exact-entry-points'
        : rootImports
          ? 'root-barrel'
          : 'unknown';
  if (importStyle === 'mixed') {
    diagnostics.push({
      code: 'NNP006',
      severity: 'info',
      message:
        'Mixed root-barrel and exact-entry-point NeuralNg imports were detected.',
      suggestion:
        'Keep configuration imports at @neural-ng/core and component imports at exact secondary entry points.',
    });
  }

  diagnostics.sort(compareDiagnostics);
  return {
    schemaVersion: 1,
    workspace: `${basename(root)}:${fingerprint(root)}`,
    framework: { angularVersion, neuralPackages },
    files: {
      scanned: sourceResult.sources.length,
      truncated: sourceResult.truncated,
      totalBytes: sourceResult.totalBytes,
    },
    components: [...usages.values()]
      .map(toComponentUsage)
      .sort(
        (left, right) =>
          right.occurrences - left.occurrences ||
          left.id.localeCompare(right.id, 'en'),
      ),
    imports: Object.fromEntries(
      [...imports.entries()]
        .sort(([left], [right]) => left.localeCompare(right, 'en'))
        .map(([entryPoint, symbols]) => [entryPoint, [...symbols].sort()]),
    ),
    themes: [...themes].sort(),
    appearance: { providerConfigured, globalConfigConfigured, unstyled },
    conventions: {
      importStyle,
      ...([...themes][0] ? { preferredTheme: [...themes][0] } : {}),
    },
    providers: [...providers].sort(),
    diagnostics,
  };
}

export async function suggestConsistentUi(
  goal: string,
  workspaceRoot = process.cwd(),
): Promise<NeuralConsistentUiSuggestion> {
  const [project, plan] = await Promise.all([
    inspectNeuralProject(workspaceRoot),
    Promise.resolve(planUi({ goal })),
  ]);
  const existing = new Set(project.components.map((component) => component.id));
  const selected = plan.components.map((component) => component.id);
  const reusedComponents = selected.filter((id) => existing.has(id));
  const introducedComponents = selected.filter((id) => !existing.has(id));
  const guidance = [
    reusedComponents.length
      ? `Reuse existing project patterns for: ${reusedComponents.join(', ')}.`
      : 'No selected primitive is currently used; establish one canonical example before repeating it.',
    project.conventions.preferredTheme
      ? `Keep the detected ${project.conventions.preferredTheme} theme.`
      : project.appearance.unstyled
        ? 'Keep styling ownership in the project because global unstyled mode is active.'
        : 'Adopt neutral theme or explicitly choose unstyled ownership before implementation.',
    project.conventions.importStyle === 'exact-entry-points'
      ? 'Continue exact secondary entry-point component imports.'
      : 'Use exact secondary entry points for new component imports.',
  ];

  return {
    schemaVersion: 1,
    plan,
    project,
    consistency: { reusedComponents, introducedComponents, guidance },
  };
}

async function readProjectSources(root: string): Promise<{
  sources: SourceRecord[];
  truncated: boolean;
  totalBytes: number;
}> {
  const sources: SourceRecord[] = [];
  let totalBytes = 0;
  let truncated = false;

  const visit = async (directory: string): Promise<void> => {
    if (truncated) return;
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }
    entries.sort((left, right) => left.name.localeCompare(right.name, 'en'));
    for (const entry of entries) {
      if (sources.length >= MAX_FILES || totalBytes >= MAX_TOTAL_BYTES) {
        truncated = true;
        return;
      }
      if (entry.isSymbolicLink()) continue;
      const absolute = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) await visit(absolute);
        continue;
      }
      if (!entry.isFile() || !SOURCE_EXTENSIONS.has(extname(entry.name)))
        continue;
      if (
        /\.(?:spec|test|stories)\.[^.]+$/.test(entry.name) ||
        entry.name.endsWith('.d.ts')
      )
        continue;
      let content: string;
      try {
        content = await readFile(absolute, 'utf8');
      } catch {
        continue;
      }
      const bytes = Buffer.byteLength(content);
      if (bytes > MAX_FILE_BYTES || totalBytes + bytes > MAX_TOTAL_BYTES) {
        truncated = true;
        continue;
      }
      totalBytes += bytes;
      sources.push({
        path: relative(root, absolute).replaceAll('\\', '/'),
        content,
      });
    }
  };

  await visit(root);
  return { sources, truncated, totalBytes };
}

async function readPackageJson(
  root: string,
  diagnostics: NeuralProjectDiagnostic[],
): Promise<Record<string, unknown>> {
  try {
    return JSON.parse(
      await readFile(join(root, 'package.json'), 'utf8'),
    ) as Record<string, unknown>;
  } catch {
    diagnostics.push({
      code: 'NNP000',
      severity: 'warning',
      message:
        'No readable package.json was found at the MCP process working directory.',
      suggestion:
        'Start the MCP server with the Angular workspace as its current working directory.',
    });
    return {};
  }
}

function extractImports(
  content: string,
): Array<{ entryPoint: string; symbols: string[] }> {
  const results: Array<{ entryPoint: string; symbols: string[] }> = [];
  const pattern =
    /import\s+(?:type\s+)?\{([\s\S]*?)\}\s+from\s+['"](@neural-ng\/core(?:\/[^'"]+)?)['"]/g;
  for (const match of content.matchAll(pattern)) {
    results.push({
      entryPoint: match[2],
      symbols: match[1]
        .split(',')
        .map(
          (value) =>
            value
              .trim()
              .replace(/^type\s+/, '')
              .split(/\s+as\s+/)[0],
        )
        .filter(Boolean),
    });
  }
  return results;
}

function extractThemes(content: string): string[] {
  const themes = new Set<string>();
  for (const match of content.matchAll(
    /@neural-ng\/core\/themes\/(?:experimental\/)?([a-z-]+)\.css/g,
  )) {
    themes.add(match[1]);
  }
  return [...themes];
}

function collectNeuralPackages(
  packageJson: Record<string, unknown>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const section of [
    'dependencies',
    'devDependencies',
    'peerDependencies',
  ]) {
    const dependencies = packageJson[section];
    if (
      !dependencies ||
      typeof dependencies !== 'object' ||
      Array.isArray(dependencies)
    )
      continue;
    for (const [name, version] of Object.entries(dependencies)) {
      if (name.startsWith('@neural-ng/') && typeof version === 'string')
        result[name] = version;
    }
  }
  return Object.fromEntries(
    Object.entries(result).sort(([left], [right]) =>
      left.localeCompare(right, 'en'),
    ),
  );
}

function dependencyVersion(
  packageJson: Record<string, unknown>,
  name: string,
): string | undefined {
  for (const section of [
    'dependencies',
    'devDependencies',
    'peerDependencies',
  ]) {
    const dependencies = packageJson[section];
    if (
      dependencies &&
      typeof dependencies === 'object' &&
      !Array.isArray(dependencies)
    ) {
      const value = (dependencies as Record<string, unknown>)[name];
      if (typeof value === 'string') return value;
    }
  }
  return undefined;
}

function normalizeVersionFamily(value: string): string {
  return /([0-9]+\.[0-9]+\.[0-9]+(?:-[a-z]+)?)/i.exec(value)?.[1] ?? value;
}

function toComponentUsage(value: MutableUsage): NeuralProjectComponentUsage {
  return { ...value, files: [...value.files].sort() };
}

function compareDiagnostics(
  left: NeuralProjectDiagnostic,
  right: NeuralProjectDiagnostic,
): number {
  const ranks = { error: 0, warning: 1, info: 2 } as const;
  return (
    ranks[left.severity] - ranks[right.severity] ||
    (left.file ?? '').localeCompare(right.file ?? '', 'en') ||
    left.code.localeCompare(right.code, 'en')
  );
}

function fingerprint(root: string): string {
  return createHash('sha256').update(root).digest('hex').slice(0, 12);
}
