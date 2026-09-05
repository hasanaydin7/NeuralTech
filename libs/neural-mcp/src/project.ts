import { createHash } from 'node:crypto';
import { access, readdir, readFile } from 'node:fs/promises';
import { basename, extname, join, posix, relative, resolve } from 'node:path';
import { getComponentContract } from './catalog.js';
import { planUi } from './composition.js';
import { getIconCatalog } from './icons.js';
import { validateUsage } from './validation.js';
import type {
  NeuralConsistentUiSuggestion,
  NeuralProjectComponentUsage,
  NeuralProjectDiagnostic,
  NeuralProjectInspection,
  NeuralProjectTemplateInspection,
} from './types.js';

const MAX_FILES = 400;
const MAX_FILE_BYTES = 256 * 1024;
const MAX_TOTAL_BYTES = 5 * 1024 * 1024;
const MAX_EVIDENCE_FILES = 25;
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

interface MutableIconUsage {
  readonly name: string;
  readonly style: 'outline' | 'filled';
  readonly className: string;
  occurrences: number;
  readonly files: Set<string>;
}

interface ProjectTemplate {
  readonly file: string;
  readonly kind: 'external' | 'inline';
  readonly owner?: string;
  readonly content: string;
  readonly lineOffset: number;
  readonly imports?: readonly string[];
}

interface ComponentMetadata {
  readonly content: string;
  readonly offset: number;
  readonly imports?: readonly string[];
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
  const iconUsages = new Map<string, MutableIconUsage>();
  const iconStylesheets = new Set<string>();
  const knownIcons = new Set(getIconCatalog().icons.map((icon) => icon.name));
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
      else if (imported.entryPoint.startsWith('@neural-ng/core/'))
        exactImports += 1;
    }

    for (const theme of extractThemes(source.content)) themes.add(theme);
    for (const stylesheet of extractIconStylesheets(source.content)) {
      iconStylesheets.add(stylesheet);
    }
    collectIconUsages(source, knownIcons, iconUsages, diagnostics);
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
  const templates = extractProjectTemplates(sourceResult.sources);
  const templateInspections: NeuralProjectTemplateInspection[] = [];
  for (const template of templates) {
    const templateImports = template.imports ?? projectImports;
    const validation = validateUsage({
      template: template.content,
      imports: templateImports,
      providers: [...providers],
    });
    for (const componentUsage of validation.componentUsages) {
      const contract = getComponentContract(componentUsage.id);
      if (!contract) continue;
      const usage = usages.get(contract.id) ?? {
        id: contract.id,
        className: contract.className,
        selector: contract.selector,
        entryPoint: contract.entryPoint,
        occurrences: 0,
        files: new Set<string>(),
      };
      usage.occurrences += componentUsage.occurrences;
      usage.files.add(template.file);
      usages.set(contract.id, usage);
    }
    templateInspections.push({
      file: template.file,
      kind: template.kind,
      ...(template.owner ? { owner: template.owner } : {}),
      importsSource: template.imports
        ? ('component-metadata' as const)
        : ('workspace-fallback' as const),
      components: validation.components,
      valid: validation.valid,
    });
    for (const item of validation.diagnostics) {
      if (item.severity === 'info') continue;
      diagnostics.push({
        code: item.code,
        severity: item.severity,
        message: item.message,
        file: template.file,
        line: item.line + template.lineOffset,
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
  const componentUsages = [...usages.values()]
    .map(toComponentUsage)
    .sort(
      (left, right) =>
        right.occurrences - left.occurrences ||
        left.id.localeCompare(right.id, 'en'),
    );
  const sortedTemplates = templateInspections.sort((left, right) =>
    left.file.localeCompare(right.file, 'en'),
  );
  const sortedIconUsages = [...iconUsages.values()]
    .map(toIconUsage)
    .sort(
      (left, right) =>
        right.occurrences - left.occurrences ||
        left.name.localeCompare(right.name, 'en'),
    );
  const diagnosticCounts = {
    errors: diagnostics.filter((item) => item.severity === 'error').length,
    warnings: diagnostics.filter((item) => item.severity === 'warning').length,
    info: diagnostics.filter((item) => item.severity === 'info').length,
  };
  const workspaceConfig = await detectWorkspaceConfig(root, packageJson);
  return {
    schemaVersion: 2,
    workspace: `${basename(root)}:${fingerprint(root)}`,
    workspaceConfig,
    framework: {
      angularVersion,
      neuralPackages,
      versionSource: 'package.json',
    },
    analysis: {
      engine: '@angular/compiler',
      confidence: sourceResult.truncated ? 'partial' : 'complete',
      limitations: [
        'Static inspection does not execute Angular code, providers, or dynamic imports.',
        'Templates without discoverable component metadata use workspace-wide NeuralNg imports as a fallback.',
        'Selector and API diagnostics cover component contracts present in the generated MCP catalog; unknown separate-package selectors remain explicit.',
      ],
    },
    files: {
      scanned: sourceResult.sources.length,
      truncated: sourceResult.truncated,
      totalBytes: sourceResult.totalBytes,
    },
    summary: {
      componentKinds: componentUsages.length,
      componentOccurrences: componentUsages.reduce(
        (total, usage) => total + usage.occurrences,
        0,
      ),
      templateCount: sortedTemplates.length,
      invalidTemplates: sortedTemplates.filter((template) => !template.valid)
        .length,
      iconKinds: sortedIconUsages.length,
      iconOccurrences: sortedIconUsages.reduce(
        (total, usage) => total + usage.occurrences,
        0,
      ),
      diagnostics: diagnosticCounts,
    },
    components: componentUsages,
    templates: sortedTemplates,
    icons: {
      ...(neuralPackages['@neural-ng/icons']
        ? { packageVersion: neuralPackages['@neural-ng/icons'] }
        : {}),
      stylesheets: [...iconStylesheets].sort(),
      usages: sortedIconUsages,
    },
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

function extractProjectTemplates(
  sources: readonly SourceRecord[],
): ProjectTemplate[] {
  const external = new Map<string, ProjectTemplate>();
  const inline: ProjectTemplate[] = [];
  for (const source of sources) {
    if (extname(source.path) === '.html') {
      external.set(source.path, {
        file: source.path,
        kind: 'external',
        content: source.content,
        lineOffset: 0,
      });
    }
  }

  for (const source of sources) {
    if (extname(source.path) !== '.ts') continue;
    for (const metadata of extractComponentMetadata(source.content)) {
      for (const match of metadata.content.matchAll(
        /\btemplateUrl\s*:\s*['"]([^'"]+)['"]/g,
      )) {
        const templateUrl = match[1];
        if (!templateUrl) continue;
        const path = posix.normalize(
          posix.join(posix.dirname(source.path), templateUrl),
        );
        const current = external.get(path);
        if (!current) continue;
        external.set(path, {
          ...current,
          owner: source.path,
          ...(metadata.imports ? { imports: metadata.imports } : {}),
        });
      }

      for (const match of metadata.content.matchAll(
        /\btemplate\s*:\s*(?:`([\s\S]*?)`|'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)")/g,
      )) {
        const content = match[1] ?? match[2] ?? match[3];
        if (content === undefined || !containsNeuralTemplateSyntax(content))
          continue;
        const contentOffset =
          metadata.offset + (match.index ?? 0) + match[0].indexOf(content);
        inline.push({
          file: source.path,
          kind: 'inline',
          owner: source.path,
          content,
          lineOffset: countLinesBefore(source.content, contentOffset),
          ...(metadata.imports ? { imports: metadata.imports } : {}),
        });
      }
    }
  }

  return [
    ...[...external.values()].filter(
      (template) =>
        template.owner || containsNeuralTemplateSyntax(template.content),
    ),
    ...inline,
  ].sort(
    (left, right) =>
      left.file.localeCompare(right.file, 'en') ||
      left.kind.localeCompare(right.kind, 'en'),
  );
}

function extractComponentMetadata(content: string): ComponentMetadata[] {
  const results: ComponentMetadata[] = [];
  const pattern = /@Component\s*\(/g;
  for (const match of content.matchAll(pattern)) {
    const open = (match.index ?? 0) + match[0].lastIndexOf('(');
    const close = findClosingDelimiter(content, open, '(', ')');
    if (close === -1) continue;
    const offset = open + 1;
    const metadata = content.slice(offset, close);
    const imports = extractStandaloneImports(metadata);
    results.push({
      content: metadata,
      offset,
      ...(imports ? { imports } : {}),
    });
  }
  return results;
}

function findClosingDelimiter(
  content: string,
  openIndex: number,
  open: string,
  close: string,
): number {
  let depth = 0;
  let quote: "'" | '"' | '`' | undefined;
  let escaped = false;
  for (let index = openIndex; index < content.length; index += 1) {
    const character = content[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = undefined;
      continue;
    }
    if (character === "'" || character === '"' || character === '`') {
      quote = character;
      continue;
    }
    if (character === open) depth += 1;
    else if (character === close) {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function containsNeuralTemplateSyntax(content: string): boolean {
  return /<neural-[a-z0-9-]+\b|\sneural[A-Z][A-Za-z0-9]*\b/i.test(content);
}

function extractStandaloneImports(content: string): string[] | undefined {
  const match = /\bimports\s*:\s*\[([\s\S]{0,8000}?)\]/.exec(content);
  if (!match) return undefined;
  return [
    ...new Set(
      [...match[1].matchAll(/\b[A-Z][A-Za-z0-9_$]*\b/g)].map((item) => item[0]),
    ),
  ].sort();
}

function extractIconStylesheets(content: string): string[] {
  return [
    ...new Set(
      [
        ...content.matchAll(/@neural-ng\/icons(?:\/([a-z0-9/.-]+\.css))?/gi),
      ].map((match) => match[1] ?? 'icons.css'),
    ),
  ];
}

function collectIconUsages(
  source: SourceRecord,
  knownIcons: ReadonlySet<string>,
  usages: Map<string, MutableIconUsage>,
  diagnostics: NeuralProjectDiagnostic[],
): void {
  if (extname(source.path) !== '.html' && extname(source.path) !== '.ts')
    return;
  for (const match of source.content.matchAll(
    /\bnt\s+nt-(filled-)?([a-z0-9]+(?:-[a-z0-9]+)*)\b/gi,
  )) {
    const filled = Boolean(match[1]);
    const name = match[2]?.toLowerCase();
    if (
      !name ||
      name === 'spin' ||
      name === 'spin-reverse' ||
      name === 'spin-dual' ||
      name === 'filled'
    ) {
      continue;
    }
    const className = `nt-${filled ? 'filled-' : ''}${name}`;
    if (!knownIcons.has(name)) {
      const location = sourceLocation(source.content, match.index ?? 0);
      diagnostics.push({
        code: 'NNP008',
        severity: 'error',
        message: `Unknown Neural Icons class "${className}" was detected.`,
        file: source.path,
        ...location,
        suggestion:
          'Use search_icons and copy an exact returned class and stylesheet import.',
      });
      continue;
    }
    const key = `${filled ? 'filled' : 'outline'}:${name}`;
    const usage = usages.get(key) ?? {
      name,
      style: filled ? ('filled' as const) : ('outline' as const),
      className: `nt ${className}`,
      occurrences: 0,
      files: new Set<string>(),
    };
    usage.occurrences += 1;
    usage.files.add(source.path);
    usages.set(key, usage);
  }
}

async function detectWorkspaceConfig(
  root: string,
  packageJson: Record<string, unknown>,
): Promise<NeuralProjectInspection['workspaceConfig']> {
  const [hasNx, hasAngular, hasProject, lockManager] = await Promise.all([
    pathExists(join(root, 'nx.json')),
    pathExists(join(root, 'angular.json')),
    pathExists(join(root, 'project.json')),
    detectLockManager(root),
  ]);
  const declaredPackageManager =
    typeof packageJson['packageManager'] === 'string'
      ? packageJson['packageManager'].split('@')[0]
      : undefined;
  return {
    kind: hasNx
      ? 'nx'
      : hasAngular
        ? 'angular-cli'
        : hasProject
          ? 'angular-package'
          : 'unknown',
    ...(declaredPackageManager || lockManager
      ? { packageManager: declaredPackageManager ?? lockManager }
      : {}),
  };
}

async function detectLockManager(root: string): Promise<string | undefined> {
  for (const [file, manager] of [
    ['pnpm-lock.yaml', 'pnpm'],
    ['yarn.lock', 'yarn'],
    ['package-lock.json', 'npm'],
    ['bun.lock', 'bun'],
    ['bun.lockb', 'bun'],
  ] as const) {
    if (await pathExists(join(root, file))) return manager;
  }
  return undefined;
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function countLinesBefore(content: string, offset: number): number {
  return content.slice(0, offset).split('\n').length - 1;
}

function sourceLocation(
  content: string,
  offset: number,
): { line: number; column: number } {
  const lines = content.slice(0, offset).split('\n');
  return { line: lines.length, column: (lines.at(-1)?.length ?? 0) + 1 };
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
    /import\s+(?:type\s+)?\{([\s\S]*?)\}\s+from\s+['"](@neural-ng\/(?:core(?:\/[^'"]+)?|editor))['"]/g;
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
  const files = [...value.files].sort();
  return {
    ...value,
    files: files.slice(0, MAX_EVIDENCE_FILES),
    filesOmitted: Math.max(0, files.length - MAX_EVIDENCE_FILES),
  };
}

function toIconUsage(value: MutableIconUsage) {
  const files = [...value.files].sort();
  return {
    ...value,
    files: files.slice(0, MAX_EVIDENCE_FILES),
    filesOmitted: Math.max(0, files.length - MAX_EVIDENCE_FILES),
  };
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
