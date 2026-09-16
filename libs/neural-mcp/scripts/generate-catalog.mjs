import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { format } from 'prettier';
import ts from 'typescript';

const scriptRoot = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(scriptRoot, '../../..');
const coreRoot = join(workspaceRoot, 'libs/neural-ng');
const outputPath = join(coreRoot, '../neural-mcp/src/generated/catalog.ts');
const iconOutputPath = join(coreRoot, '../neural-mcp/src/generated/icons.ts');
const iconMetadataPath = join(workspaceRoot, 'libs/neural-icons/metadata.json');
const iconManifestPath = join(workspaceRoot, 'libs/neural-icons/manifest.json');
const checkOnly = process.argv.includes('--check');

const [workspaceTsConfig, corePackage, iconMetadata, iconManifest] =
  await Promise.all([
    readJson(join(workspaceRoot, 'tsconfig.base.json')),
    readJson(join(coreRoot, 'package.json')),
    readJson(iconMetadataPath),
    readJson(iconManifestPath),
  ]);

const runtimeEntries = Object.keys(
  workspaceTsConfig.compilerOptions?.paths ?? {},
)
  .filter(
    (entry) =>
      entry === '@neural-ng/core' || entry.startsWith('@neural-ng/core/'),
  )
  .sort(compareText);
const publicDirectoryEntries = new Map(
  runtimeEntries
    .filter((entry) => entry.startsWith('@neural-ng/core/'))
    .map((entry) => [entry.slice('@neural-ng/core/'.length), entry]),
);

const sourceFiles = await listFiles(coreRoot);
const trackedFiles = new Set([
  join(workspaceRoot, 'tsconfig.base.json'),
  join(coreRoot, 'package.json'),
]);
const components = [];

for (const [directoryName, entryPoint] of publicDirectoryEntries) {
  if (directoryName.startsWith('locales/')) continue;

  const entryRoot = join(coreRoot, directoryName);
  const indexPath = join(entryRoot, 'index.ts');
  const indexSource = await readOptional(indexPath);
  if (!indexSource) continue;
  trackedFiles.add(indexPath);

  const readmePath = join(entryRoot, 'README.md');
  const llmsPath = join(entryRoot, 'llms.txt');
  const [readme, llms] = await Promise.all([
    readOptional(readmePath),
    readOptional(llmsPath),
  ]);
  if (readme !== undefined) trackedFiles.add(readmePath);
  if (llms !== undefined) trackedFiles.add(llmsPath);

  const exportedNames = parseNamedExports(indexSource);
  const exportAllFiles = parseExportAllFiles(indexSource);
  const summary = extractSummary(readme ?? llms ?? '', directoryName);
  const declarations = [];
  const classes = [];
  const typeAliases = [];
  const providers = [];

  for (const filePath of sourceFiles) {
    if (dirname(filePath) !== entryRoot) continue;
    const source = await readText(filePath);
    const fileStem = `./${basename(filePath, '.ts')}`;
    const publicFile = exportAllFiles.has(fileStem);

    for (const provider of parseProviders(source)) {
      const isPublic = exportedNames.has(provider.name) || publicFile;
      if (!isPublic || providers.some((item) => item.name === provider.name)) {
        continue;
      }
      trackedFiles.add(filePath);
      providers.push(provider);
    }

    for (const contract of parseClasses(source)) {
      const isPublic = exportedNames.has(contract.typeName) || publicFile;
      if (!isPublic) continue;
      trackedFiles.add(filePath);
      classes.push({
        ...contract,
        sourcePath: relative(workspaceRoot, filePath).replaceAll('\\', '/'),
      });
    }

    for (const alias of parseTypeAliases(source)) {
      const isPublic = exportedNames.has(alias.name) || publicFile;
      if (!isPublic || typeAliases.some((item) => item.name === alias.name)) {
        continue;
      }
      trackedFiles.add(filePath);
      typeAliases.push(alias);
    }

    if (!/\.ts$/.test(filePath) || /\.spec\.ts$/.test(filePath)) continue;
    const found = parseDeclarations(source);

    for (const declaration of found) {
      const isPublic = exportedNames.has(declaration.className) || publicFile;
      if (!isPublic) continue;

      trackedFiles.add(filePath);
      declarations.push({
        ...declaration,
        source,
        sourcePath: filePath,
      });
    }
  }

  const baseIds = declarations.map((declaration) =>
    canonicalDeclarationId(declaration.className),
  );
  const baseIdCounts = new Map();
  for (const baseId of baseIds) {
    baseIdCounts.set(baseId, (baseIdCounts.get(baseId) ?? 0) + 1);
  }
  const entryIds = declarations.map((declaration, index) => {
    const baseId = baseIds[index];
    if ((baseIdCounts.get(baseId) ?? 0) === 1) return baseId;
    return declaration.kind === 'directive' ? `${baseId}-directive` : baseId;
  });
  const templates = declarations
    .filter(
      (declaration) =>
        declaration.kind === 'directive' &&
        (declaration.className.includes('Template') ||
          declaration.selector.startsWith('ng-template[') ||
          Boolean(declaration.templateContext)),
    )
    .map((declaration) => ({
      name: stripSuffix(declaration.className),
      className: declaration.className,
      selector: declaration.selector,
      contextType: declaration.templateContext ?? 'unknown',
    }));
  const examples = extractExamples(readme ?? '');
  const documentationText = `${readme ?? ''}\n${llms ?? ''}`;
  const providerRequirements = extractProviderRequirements(documentationText);

  for (const [index, declaration] of declarations.entries()) {
    const id = entryIds[index];
    const formContract = detectFormContract(
      declaration.source,
      declaration.className,
    );
    const contractUri = `neural://components/${id}/contract`;
    const readmeUri = `neural://components/${id}/readme`;
    const llmsUri = `neural://components/${id}/llms`;
    components.push({
      schemaVersion: 2,
      id,
      name: stripSuffix(declaration.className),
      className: declaration.className,
      kind: declaration.kind,
      selector: declaration.selector,
      entryPoint,
      status:
        entryPoint === '@neural-ng/core/accordion' ||
        entryPoint === '@neural-ng/core/button' ||
        entryPoint === '@neural-ng/core/tabs' ||
        entryPoint === '@neural-ng/core/input' ||
        entryPoint === '@neural-ng/core/auto-complete' ||
        entryPoint === '@neural-ng/core/avatar' ||
        entryPoint === '@neural-ng/core/badge' ||
        entryPoint === '@neural-ng/core/breadcrumb' ||
        entryPoint === '@neural-ng/core/card' ||
        entryPoint === '@neural-ng/core/checkbox' ||
        entryPoint === '@neural-ng/core/confirm-dialog' ||
        entryPoint === '@neural-ng/core/data-view' ||
        entryPoint === '@neural-ng/core/date-picker' ||
        entryPoint === '@neural-ng/core/dialog' ||
        entryPoint === '@neural-ng/core/divider' ||
        entryPoint === '@neural-ng/core/drawer' ||
        entryPoint === '@neural-ng/core/field' ||
        entryPoint === '@neural-ng/core/file-upload' ||
        entryPoint === '@neural-ng/core/input-mask' ||
        entryPoint === '@neural-ng/core/input-number' ||
        entryPoint === '@neural-ng/core/input-otp' ||
        entryPoint === '@neural-ng/core/loading-overlay' ||
        entryPoint === '@neural-ng/core/menu' ||
        entryPoint === '@neural-ng/core/message' ||
        entryPoint === '@neural-ng/core/meter-group' ||
        entryPoint === '@neural-ng/core/multi-select' ||
        entryPoint === '@neural-ng/core/paginator' ||
        entryPoint === '@neural-ng/core/select' ||
        entryPoint === '@neural-ng/core/table' ||
        entryPoint === '@neural-ng/core/tag' ||
        entryPoint === '@neural-ng/core/textarea' ||
        entryPoint === '@neural-ng/core/toast' ||
        entryPoint === '@neural-ng/core/toolbar' ||
        entryPoint === '@neural-ng/core/tooltip' ||
        entryPoint === '@neural-ng/core/tree' ||
        entryPoint === '@neural-ng/core/tree-select' ||
        entryPoint === '@neural-ng/core/virtual-scroller'
          ? 'beta'
          : 'alpha',
      summary,
      ...(formContract ? { formContract } : {}),
      inputs: declaration.inputs,
      models: declaration.models,
      outputs: declaration.outputs,
      templates,
      providers,
      providerRequirements,
      methods: declaration.methods.filter((method) =>
        documentationText.includes(`${method.name}(`),
      ),
      typeAliases,
      examples,
      classes,
      relatedComponents: entryIds.filter((relatedId) => relatedId !== id),
      resources: {
        contract: contractUri,
        readme: readmeUri,
        llms: llmsUri,
      },
      sourceDirectory: relative(workspaceRoot, entryRoot).replaceAll('\\', '/'),
      readme: readme ?? '',
      llms: llms ?? '',
    });
  }
}

applyContractOverrides(components);
components.sort((left, right) => compareText(left.id, right.id));
assertUniqueIds(components);
assertDocumentedComponents(components);

const documentedExports = Object.keys(corePackage.exports ?? {}).sort(
  compareText,
);
const themes = documentedExports
  .filter((entry) => entry.startsWith('./themes/') && entry.endsWith('.css'))
  .map((entry) => ({
    id: entry.slice('./themes/'.length, -'.css'.length),
    exportPath: `@neural-ng/core/${entry.slice(2)}`,
    stability: entry.includes('/experimental/')
      ? 'experimental'
      : entry.endsWith('/tailwind.css')
        ? 'bridge'
        : 'stable',
  }));

const packageCatalog = {
  packageName: corePackage.name,
  version: corePackage.version,
  runtimeEntryPoints: runtimeEntries,
  documentedExports,
};
const sourceHash = await hashFiles([...trackedFiles]);
const generated = `// Generated by libs/neural-mcp/scripts/generate-catalog.mjs. Do not edit.\nimport type {\n  NeuralComponentDocument,\n  NeuralPackageCatalog,\n  NeuralThemeCatalogEntry,\n} from '../types.js';\n\nexport const GENERATED_SOURCE_HASH = ${JSON.stringify(sourceHash)};\n\nexport const GENERATED_COMPONENTS = ${JSON.stringify(components, null, 2)} satisfies readonly NeuralComponentDocument[];\n\nexport const GENERATED_PACKAGE_CATALOG = ${JSON.stringify(packageCatalog, null, 2)} satisfies NeuralPackageCatalog;\n\nexport const GENERATED_THEMES = ${JSON.stringify(themes, null, 2)} satisfies readonly NeuralThemeCatalogEntry[];\n`;

const coreIconNames = new Set(iconManifest.icons.map((icon) => icon.name));
const iconCatalog = {
  schemaVersion: 1,
  packageName: iconMetadata.package,
  packageVersion: iconMetadata.version,
  upstream: iconMetadata.upstream,
  totals: iconMetadata.totals,
  categories: iconMetadata.categories,
  icons: iconMetadata.icons.map((icon) => ({
    ...icon,
    core: coreIconNames.has(icon.name),
  })),
};
assertIconCatalog(iconCatalog);
const generatedIcons = await format(
  `// Generated by libs/neural-mcp/scripts/generate-catalog.mjs from libs/neural-icons metadata. Do not edit.\nimport type { NeuralIconCatalog } from '../types.js';\n\nexport const GENERATED_ICON_CATALOG = ${JSON.stringify(iconCatalog, null, 2)} satisfies NeuralIconCatalog;\n`,
  { parser: 'typescript', singleQuote: true },
);

const current = await readOptional(outputPath);
const currentIcons = await readOptional(iconOutputPath);
if (checkOnly) {
  if (current !== generated) {
    throw new Error(
      'Neural MCP catalog is stale. Run `node libs/neural-mcp/scripts/generate-catalog.mjs`.',
    );
  }
  if (currentIcons !== generatedIcons) {
    throw new Error(
      'Neural MCP icon catalog is stale. Run `node libs/neural-mcp/scripts/generate-catalog.mjs`.',
    );
  }
  console.log(
    `Neural MCP catalog is current: ${components.length} public declarations, ${runtimeEntries.length} runtime entry points, ${iconMetadata.totals.icons} icon variants.`,
  );
} else {
  await writeFile(outputPath, generated, 'utf8');
  await writeFile(iconOutputPath, generatedIcons, 'utf8');
  console.log(
    `Generated Neural MCP catalog: ${components.length} public declarations, ${runtimeEntries.length} runtime entry points, ${iconMetadata.totals.icons} icon variants.`,
  );
}

function assertIconCatalog(catalog) {
  if (
    catalog.packageName !== '@neural-ng/icons' ||
    catalog.totals.icons !== 6184 ||
    catalog.totals.outline !== 5130 ||
    catalog.totals.filled !== 1054 ||
    catalog.icons.length !== catalog.totals.outline
  ) {
    throw new Error('Unexpected Neural Icons metadata contract.');
  }
  const names = new Set();
  for (const icon of catalog.icons) {
    if (names.has(icon.name)) throw new Error(`Duplicate icon: ${icon.name}`);
    names.add(icon.name);
  }
}

function parseDeclarations(source) {
  const declarations = [];
  const sourceFile = ts.createSourceFile(
    'neural-public-api.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  for (const statement of sourceFile.statements) {
    if (!ts.isClassDeclaration(statement) || !statement.name) continue;

    const decorators = ts.canHaveDecorators(statement)
      ? (ts.getDecorators(statement) ?? [])
      : [];

    for (const decorator of decorators) {
      if (!ts.isCallExpression(decorator.expression)) continue;

      const decoratorName = decorator.expression.expression;
      if (!ts.isIdentifier(decoratorName)) continue;
      if (
        decoratorName.text !== 'Component' &&
        decoratorName.text !== 'Directive'
      ) {
        continue;
      }

      const metadata = decorator.expression.arguments[0];
      if (!metadata || !ts.isObjectLiteralExpression(metadata)) continue;

      const selectorProperty = metadata.properties.find(
        (property) =>
          ts.isPropertyAssignment(property) &&
          ((ts.isIdentifier(property.name) &&
            property.name.text === 'selector') ||
            (ts.isStringLiteral(property.name) &&
              property.name.text === 'selector')),
      );
      if (!selectorProperty || !ts.isPropertyAssignment(selectorProperty)) {
        continue;
      }

      const selector = selectorProperty.initializer;
      if (!ts.isStringLiteralLike(selector)) continue;

      declarations.push({
        className: statement.name.text,
        kind: decoratorName.text === 'Component' ? 'component' : 'directive',
        selector: selector.text,
        templateContext: parseTemplateContext(statement, sourceFile),
        ...parseSignalContracts(statement, sourceFile),
        methods: parsePublicMethods(statement, sourceFile),
      });
    }
  }

  return declarations;
}

function parseTemplateContext(classDeclaration, sourceFile) {
  for (const member of classDeclaration.members) {
    if (
      ts.isMethodDeclaration(member) &&
      member.name?.getText(sourceFile) === 'ngTemplateContextGuard' &&
      member.type &&
      ts.isTypePredicateNode(member.type)
    ) {
      return member.type.type?.getText(sourceFile) ?? 'unknown';
    }
    if (!ts.isPropertyDeclaration(member) || !member.initializer) continue;
    let contextType;
    const visit = (node) => {
      if (
        !contextType &&
        ts.isTypeReferenceNode(node) &&
        node.typeName.getText(sourceFile) === 'TemplateRef'
      ) {
        contextType = node.typeArguments?.[0]?.getText(sourceFile);
      }
      if (!contextType) ts.forEachChild(node, visit);
    };
    visit(member.initializer);
    if (contextType) return normalizeType(contextType);
  }
  return undefined;
}

function parseProviders(source) {
  const providers = [];
  const sourceFile = ts.createSourceFile(
    'neural-providers.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  for (const statement of sourceFile.statements) {
    if (!ts.isFunctionDeclaration(statement) || !statement.name) continue;
    if (!statement.name.text.startsWith('provideNeural')) continue;
    providers.push({
      name: statement.name.text,
      returnType: statement.type?.getText(sourceFile) ?? 'unknown',
      ...(readJsDoc(statement) ? { description: readJsDoc(statement) } : {}),
    });
  }
  return providers;
}

function parsePublicMethods(classDeclaration, sourceFile) {
  const methods = [];
  for (const member of classDeclaration.members) {
    if (!ts.isMethodDeclaration(member) || !member.name) continue;
    const name = member.name.getText(sourceFile);
    if (!/^[A-Za-z_$][\w$]*$/.test(name) || name.startsWith('ng')) continue;
    const modifiers = new Set(member.modifiers?.map((item) => item.kind) ?? []);
    if (
      modifiers.has(ts.SyntaxKind.PrivateKeyword) ||
      modifiers.has(ts.SyntaxKind.ProtectedKeyword) ||
      modifiers.has(ts.SyntaxKind.StaticKeyword)
    ) {
      continue;
    }
    const parameters = member.parameters
      .map((parameter) => parameter.getText(sourceFile))
      .join(', ');
    const returnType = member.type?.getText(sourceFile) ?? 'unknown';
    methods.push({
      name,
      signature: `${name}(${parameters}): ${returnType}`,
      returnType: normalizeType(returnType),
      ...(readJsDoc(member) ? { description: readJsDoc(member) } : {}),
    });
  }
  return methods;
}

function extractProviderRequirements(documentation) {
  const priorities = { supported: 0, optional: 1, required: 2 };
  const requirements = new Map();
  for (const rawLine of documentation.replace(/\r\n/g, '\n').split('\n')) {
    const line = rawLine.trim();
    const names = [...line.matchAll(/\b(provideNeural[A-Z]\w*)\s*\(/g)].map(
      (match) => match[1],
    );
    for (const name of names) {
      const normalized = line.toLowerCase();
      const requirement = /\brequired\b|\bmust\b/.test(normalized)
        ? 'required'
        : /\boptional\b/.test(normalized)
          ? 'optional'
          : 'supported';
      const current = requirements.get(name);
      if (
        !current ||
        priorities[requirement] > priorities[current.requirement]
      ) {
        requirements.set(name, { name, requirement, evidence: line });
      }
    }
  }
  return [...requirements.values()].sort((left, right) =>
    compareText(left.name, right.name),
  );
}

function extractExamples(markdown) {
  const examples = [];
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  let heading = 'Usage';
  for (let index = 0; index < lines.length; index += 1) {
    const headingMatch = /^(#{2,4})\s+(.+)$/.exec(lines[index]);
    if (headingMatch?.[2]) {
      heading = headingMatch[2].replace(/`/g, '').trim();
      continue;
    }
    const fence = /^```([a-zA-Z0-9_-]*)\s*$/.exec(lines[index]);
    if (!fence) continue;
    const code = [];
    index += 1;
    while (index < lines.length && !/^```\s*$/.test(lines[index])) {
      code.push(lines[index]);
      index += 1;
    }
    const value = code.join('\n').trim();
    if (!value) continue;
    examples.push({
      title: heading,
      language: fence[1] || 'text',
      code: value,
    });
  }
  return examples;
}

function parseSignalContracts(classDeclaration, sourceFile) {
  const inputs = [];
  const models = [];
  const outputs = [];

  for (const member of classDeclaration.members) {
    if (!ts.isPropertyDeclaration(member) || !member.initializer) continue;
    if (
      !ts.isIdentifier(member.name) ||
      !ts.isCallExpression(member.initializer)
    ) {
      continue;
    }

    const call = member.initializer;
    const signalKind = getSignalKind(call.expression);
    if (!signalKind) continue;

    const name = member.name.text;
    const description = readJsDoc(member) || undefined;
    const typeArgument = call.typeArguments?.[0]?.getText(sourceFile);
    const required = signalKind === 'input.required';
    const optionsIndex = signalKind === 'output' || required ? 0 : 1;
    const options = call.arguments[optionsIndex];
    const bindingName = readStringProperty(options, 'alias') ?? name;

    if (signalKind === 'output') {
      outputs.push({
        name,
        bindingName,
        type: typeArgument ? normalizeType(typeArgument) : 'void',
        ...(description ? { description } : {}),
      });
      continue;
    }

    const defaultExpression = required ? undefined : call.arguments[0];
    const type = typeArgument
      ? normalizeType(typeArgument)
      : inferExpressionType(defaultExpression, sourceFile);
    const defaultValue = defaultExpression?.getText(sourceFile);

    if (signalKind === 'model') {
      models.push({
        name,
        bindingName,
        type,
        ...(defaultValue ? { defaultValue } : {}),
        ...(description ? { description } : {}),
      });
      continue;
    }

    const transform = readExpressionProperty(options, 'transform', sourceFile);
    inputs.push({
      name,
      bindingName,
      type,
      required,
      ...(defaultValue ? { defaultValue } : {}),
      ...(transform ? { transform } : {}),
      ...(description ? { description } : {}),
    });
  }

  return { inputs, models, outputs };
}

function getSignalKind(expression) {
  if (ts.isIdentifier(expression)) {
    if (expression.text === 'input') return 'input';
    if (expression.text === 'model') return 'model';
    if (expression.text === 'output') return 'output';
  }
  if (
    ts.isPropertyAccessExpression(expression) &&
    ts.isIdentifier(expression.expression) &&
    expression.expression.text === 'input' &&
    expression.name.text === 'required'
  ) {
    return 'input.required';
  }
  return undefined;
}

function readStringProperty(expression, name) {
  const value = readObjectProperty(expression, name);
  return value && ts.isStringLiteralLike(value) ? value.text : undefined;
}

function readExpressionProperty(expression, name, sourceFile) {
  return readObjectProperty(expression, name)?.getText(sourceFile);
}

function readObjectProperty(expression, name) {
  if (!expression || !ts.isObjectLiteralExpression(expression))
    return undefined;
  const property = expression.properties.find(
    (candidate) =>
      ts.isPropertyAssignment(candidate) &&
      ((ts.isIdentifier(candidate.name) && candidate.name.text === name) ||
        (ts.isStringLiteralLike(candidate.name) &&
          candidate.name.text === name)),
  );
  return property && ts.isPropertyAssignment(property)
    ? property.initializer
    : undefined;
}

function inferExpressionType(expression, sourceFile) {
  if (!expression) return 'unknown';
  if (
    expression.kind === ts.SyntaxKind.TrueKeyword ||
    expression.kind === ts.SyntaxKind.FalseKeyword
  ) {
    return 'boolean';
  }
  if (ts.isNumericLiteral(expression)) return 'number';
  if (ts.isStringLiteralLike(expression)) return 'string';
  if (expression.kind === ts.SyntaxKind.NullKeyword) return 'null';
  if (ts.isArrayLiteralExpression(expression)) return 'readonly unknown[]';
  return inferLiteralType(expression.getText(sourceFile));
}

function parseClasses(source) {
  const contracts = [];
  const sourceFile = ts.createSourceFile(
    'neural-classes.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  for (const statement of sourceFile.statements) {
    if (!ts.isInterfaceDeclaration(statement)) continue;
    if (!statement.name.text.endsWith('Classes')) continue;
    if (!hasExportModifier(statement)) continue;

    contracts.push({
      typeName: statement.name.text,
      slots: statement.members.filter(ts.isPropertySignature).map((member) => ({
        name: member.name.getText(sourceFile).replace(/^['"]|['"]$/g, ''),
        type: member.type?.getText(sourceFile) ?? 'unknown',
        description:
          readJsDoc(member) ||
          `Classes applied to the ${humanize(member.name.getText(sourceFile))} element.`,
      })),
    });
  }

  return contracts;
}

function parseTypeAliases(source) {
  const aliases = [];
  const sourceFile = ts.createSourceFile(
    'neural-types.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  for (const statement of sourceFile.statements) {
    if (!ts.isTypeAliasDeclaration(statement)) continue;
    aliases.push({
      name: statement.name.text,
      type: normalizeType(statement.type.getText(sourceFile)),
    });
  }
  return aliases;
}

function hasExportModifier(node) {
  return (
    node.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    ) ?? false
  );
}

function readJsDoc(node) {
  return ts
    .getJSDocCommentsAndTags(node)
    .map((item) => item.comment)
    .filter((comment) => typeof comment === 'string')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function humanize(value) {
  return value
    .replace(/^['"]|['"]$/g, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .toLowerCase();
}

function parseNamedExports(source) {
  const names = new Set();
  const pattern = /export\s+(?:type\s+)?\{([\s\S]*?)\}\s*from/g;
  let match;
  while ((match = pattern.exec(source))) {
    for (const item of match[1].split(',')) {
      const name = item
        .trim()
        .split(/\s+as\s+/)[0]
        ?.trim();
      if (name && !name.startsWith('type '))
        names.add(name.replace(/^type\s+/, ''));
    }
  }
  return names;
}

function parseExportAllFiles(source) {
  return new Set(
    [...source.matchAll(/export\s+\*\s+from\s+['"]([^'"]+)['"]/g)].map(
      (match) => match[1],
    ),
  );
}

function detectFormContract(source, className) {
  const start = findClassStart(source, className);
  if (start < 0) return undefined;
  const signature = source.slice(start, start + 900).replace(/\s+/g, ' ');
  if (/implements FormCheckboxControl\b/.test(signature)) {
    return 'FormCheckboxControl';
  }
  const marker = 'implements FormValueControl';
  const markerIndex = signature.indexOf(marker);
  if (markerIndex < 0) return undefined;
  const generic = readBalanced(
    signature,
    markerIndex + marker.length,
    '<',
    '>',
  );
  return generic
    ? `FormValueControl<${normalizeType(generic.content)}>`
    : undefined;
}

function readBalanced(source, start, open, close) {
  const openIndex = source.indexOf(open, start);
  if (openIndex < 0) return undefined;
  let depth = 0;
  for (let index = openIndex; index < source.length; index += 1) {
    const character = source[index];
    if (character === open) depth += 1;
    else if (character === close) {
      depth -= 1;
      if (depth === 0) {
        return {
          content: source.slice(openIndex + 1, index),
          end: index,
        };
      }
    }
  }
  return undefined;
}

function applyContractOverrides(records) {
  const overrides = new Map([
    [
      'NeuralCheckbox',
      {
        formContract: 'FormCheckboxControl',
        models: [{ name: 'checked', type: 'boolean' }],
      },
    ],
    [
      'NeuralTriStateCheckbox',
      {
        formContract: 'FormValueControl<boolean | null>',
        models: [{ name: 'value', type: 'boolean | null' }],
      },
    ],
  ]);

  for (const record of records) {
    const override = overrides.get(record.className);
    if (override) Object.assign(record, override);
  }
}

function extractSummary(source, fallback) {
  const normalized = source.replace(/\r\n/g, '\n');
  const paragraphs = normalized.split(/\n\s*\n/);
  for (const paragraph of paragraphs) {
    const text = paragraph
      .split('\n')
      .map((line) => line.trim())
      .filter(
        (line) =>
          line &&
          !line.startsWith('#') &&
          !line.startsWith('```') &&
          !/^[A-Z][A-Z -]+$/.test(line),
      )
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (text.length >= 20) return text;
  }
  return `NeuralNg ${fallback} public API.`;
}

function normalizeType(value) {
  return value
    .replace(/\s+/g, ' ')
    .replace(/\s*\|\s*/g, ' | ')
    .trim();
}

function inferLiteralType(value) {
  if (value === 'true' || value === 'false') return 'boolean';
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return 'number';
  if (/^['"`]/.test(value)) return 'string';
  if (value === 'null') return 'null';
  return 'unknown';
}

function stripSuffix(value) {
  return value.replace(/(?:Component|Directive)$/, '');
}

function canonicalDeclarationId(className) {
  const stableIds = new Map([
    ['NeuralAccordion', 'accordion'],
    ['NeuralAccordionContent', 'accordion-content'],
    ['NeuralAccordionHeader', 'accordion-header'],
    ['NeuralAccordionPanel', 'accordion-panel'],
    ['NeuralButton', 'button'],
    ['NeuralSelect', 'select'],
    ['NeuralAutoComplete', 'auto-complete'],
    ['NeuralAvatar', 'avatar'],
    ['NeuralAvatarGroup', 'avatar-group'],
    ['NeuralBadge', 'badge'],
    ['NeuralBadgeDirective', 'badge-directive'],
    ['NeuralBreadcrumb', 'breadcrumb'],
    ['NeuralBreadcrumbItemComponent', 'breadcrumb-item'],
    ['NeuralBreadcrumbSeparatorTemplate', 'breadcrumb-separator-template'],
    ['NeuralCard', 'card'],
    ['NeuralCardHeader', 'card-header'],
    ['NeuralCardBody', 'card-body'],
    ['NeuralCardFooter', 'card-footer'],
    ['NeuralCheckbox', 'checkbox'],
    ['NeuralTriStateCheckbox', 'tri-state-checkbox'],
    ['NeuralConfirmDialog', 'confirm-dialog'],
    ['NeuralDataView', 'data-view'],
    ['NeuralDatePicker', 'date-picker'],
    ['NeuralMultiSelect', 'multi-select'],
    ['NeuralRadioGroup', 'radio-group'],
    ['NeuralSlider', 'slider'],
    ['NeuralSwitch', 'switch'],
    ['NeuralTable', 'table'],
    ['NeuralTag', 'tag'],
    ['NeuralTextarea', 'textarea'],
    ['NeuralToolbar', 'toolbar'],
    ['NeuralToolbarCenter', 'toolbar-center'],
    ['NeuralToolbarEnd', 'toolbar-end'],
    ['NeuralToolbarSeparator', 'toolbar-separator'],
    ['NeuralToolbarStart', 'toolbar-start'],
    ['NeuralTooltip', 'tooltip'],
    ['NeuralTree', 'tree'],
    ['NeuralTreeSelect', 'tree-select'],
    ['NeuralVirtualScroller', 'virtual-scroller'],
    ['NeuralTabs', 'tabs'],
    ['NeuralTabList', 'tab-list'],
    ['NeuralTab', 'tab'],
    ['NeuralTabPanels', 'tab-panels'],
    ['NeuralTabPanel', 'tab-panel'],
    ['NeuralToast', 'toast'],
  ]);
  return stableIds.get(className) ?? toKebabCase(stripSuffix(className));
}

function findClassStart(source, className) {
  const escapedName = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return source.search(new RegExp(`\\bclass\\s+${escapedName}\\b`));
}

function toKebabCase(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

function assertUniqueIds(records) {
  const seen = new Map();
  for (const record of records) {
    const previous = seen.get(record.id);
    if (previous) {
      throw new Error(
        `Duplicate Neural MCP component id ${record.id}: ${previous} and ${record.className}.`,
      );
    }
    seen.set(record.id, record.className);
  }
}

function assertDocumentedComponents(records) {
  const missing = records
    .filter((record) => !record.readme.trim() || !record.llms.trim())
    .map((record) => {
      const documents = [
        !record.readme.trim() ? 'README.md' : undefined,
        !record.llms.trim() ? 'llms.txt' : undefined,
      ].filter(Boolean);
      return `${record.id}: ${documents.join(', ')}`;
    });
  if (missing.length > 0) {
    throw new Error(
      `Neural MCP catalog requires component documentation:
${missing.join('\n')}`,
    );
  }
}

async function listFiles(root) {
  const files = [];
  const entries = await readdir(root, { withFileTypes: true });
  entries.sort((left, right) => compareText(left.name, right.name));

  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(path)));
    else files.push(path);
  }
  return files;
}

async function hashFiles(paths) {
  const hash = createHash('sha256');
  for (const path of paths.sort(compareText)) {
    hash.update(relative(workspaceRoot, path).replaceAll('\\', '/'));
    hash.update('\0');
    hash.update(await readText(path));
    hash.update('\0');
  }
  return hash.digest('hex');
}

async function readJson(path) {
  return JSON.parse(await readText(path));
}

async function readOptional(path) {
  try {
    return await readText(path);
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }
}

async function readText(path) {
  return normalizeText(await readFile(path, 'utf8'));
}

function normalizeText(value) {
  return value.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
}

function compareText(left, right) {
  return left.localeCompare(right, 'en');
}
