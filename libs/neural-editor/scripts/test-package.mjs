import { execFile } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import process from 'node:process';

const execute = promisify(execFile);
const workspaceRoot = process.cwd();
const packageRoot = resolve(
  workspaceRoot,
  process.argv[2] ?? 'dist/libs/neural-editor',
);
const packageJson = await readJson('package.json');

assert(packageJson.name === '@neural-ng/editor', 'Unexpected package name.');
assert(
  packageJson.version === '0.1.0-beta.0',
  'Unexpected alpha package version.',
);
assert(packageJson.license === 'MIT', 'Editor package must declare MIT.');
for (const peer of ['@angular/common', '@angular/core', '@angular/forms']) {
  assert(
    packageJson.peerDependencies?.[peer]?.startsWith('^22.'),
    `Angular 22 peer is required: ${peer}`,
  );
}
assert(
  packageJson.peerDependencies?.['@neural-ng/core'] === '^0.1.0-beta.0',
  'Core must be a required compatible peer.',
);
assert(
  !packageJson.peerDependenciesMeta?.['@neural-ng/core']?.optional,
  'Core peer must not be optional.',
);

const runtimeDependencies = [
  '@floating-ui/dom',
  '@tiptap/core',
  '@tiptap/extension-bubble-menu',
  '@tiptap/extension-collaboration',
  '@tiptap/extension-collaboration-caret',
  '@tiptap/extension-floating-menu',
  '@tiptap/extension-highlight',
  '@tiptap/extension-image',
  '@tiptap/extension-list',
  '@tiptap/extension-mention',
  '@tiptap/extension-table',
  '@tiptap/extension-text-align',
  '@tiptap/extension-text-style',
  '@tiptap/extension-unique-id',
  '@tiptap/extensions',
  '@tiptap/html',
  '@tiptap/pm',
  '@tiptap/starter-kit',
  '@tiptap/suggestion',
  '@tiptap/y-tiptap',
  'yjs',
];
for (const dependency of runtimeDependencies) {
  assert(
    packageJson.dependencies?.[dependency],
    `Missing bundled Editor runtime dependency: ${dependency}`,
  );
  assert(
    !packageJson.peerDependencies?.[dependency],
    `Editor runtime must not remain a peer dependency: ${dependency}`,
  );
}
for (const dependency of Object.keys({
  ...packageJson.dependencies,
  ...packageJson.peerDependencies,
})) {
  assert(
    !dependency.startsWith('@tiptap-pro/'),
    `Forbidden Tiptap Pro dependency: ${dependency}`,
  );
}

for (const entryPoint of [
  '.',
  './README.md',
  './API_FREEZE.md',
  './MIGRATION.md',
  './llms.txt',
  './LICENSE',
  './THIRD_PARTY_NOTICES.md',
  './themes/neutral.css',
  './themes/tailwind.css',
  './themes/experimental/glass.css',
  './themes/experimental/mist.css',
  './themes/experimental/futuristic.css',
]) {
  const definition = packageJson.exports?.[entryPoint];
  assert(definition, `Missing package export: ${entryPoint}`);
  for (const target of Object.values(definition))
    await access(join(packageRoot, target));
}

const types = await read('types/neural-ng-editor.d.ts');
for (const symbol of [
  'EditorComponent',
  'NeuralEditorMessages',
  'EditorSlashMenuTemplateDirective',
  'EditorMentionMenuTemplateDirective',
  'EditorCommandPaletteTemplateDirective',
  'EditorAiReviewTemplateDirective',
  'NeuralEditorAiReviewTemplateContext',
  'NeuralEditorSuggestionMenuTemplateContext',
  'NeuralEditorCommandPaletteTemplateContext',
  'createNeuralEditorDefaultSlashCommands',
  'createNeuralEditorDefaultCommandPaletteItems',
  'NeuralEditorSlashCommand',
  'NeuralEditorMentionItem',
  'NeuralEditorCommandPaletteItem',
  'NeuralEditorSuggestionProvider',
  'NeuralEditorCommandExecutedEvent',
  'NeuralEditorMentionSelectedEvent',
  'NeuralEditorOperation',
  'NeuralEditorOperationBatch',
  'NeuralEditorOperationApplyResult',
  'NeuralEditorOperationValidationResult',
  'NeuralEditorNodeSnapshot',
  'NeuralEditorNodeIdGenerator',
  'NeuralEditorOperationsAppliedEvent',
  'NeuralEditorOperationsRejectedEvent',
  'NeuralEditorOperationConflictEvent',
  'NeuralEditorAiAction',
  'NeuralEditorSelectionSnapshot',
  'NeuralEditorAiRequestOptions',
  'NeuralEditorAiRequest',
  'NeuralEditorAiRequestEvent',
  'NeuralEditorAiRequestCancelledEvent',
  'NeuralEditorAiProposal',
  'NeuralEditorAiReviewState',
  'NeuralEditorAiPreviewError',
  'NeuralEditorAiPreviewErrorCode',
  'NeuralEditorAiPreviewResult',
  'NeuralEditorAiProposalEvent',
  'NeuralEditorAiProposalAcceptedEvent',
  'NeuralEditorAiProposalRejectedEvent',
  'NeuralEditorAiProposalRejectionReason',
  'NeuralEditorAiConflictEvent',
  'NeuralEditorAiConflictReason',
  'NeuralEditorCollaborationConfig',
  'NeuralEditorCollaborationProvider',
  'NeuralEditorCollaborationUser',
  'NeuralEditorCollaborationPresence',
  'NeuralEditorCollaborationStatus',
  'NeuralEditorCommentThread',
  'NeuralEditorTrackedChange',
  'NeuralEditorSnapshot',
  'createNeuralEditorCommentThread',
  'createNeuralEditorCommentMessage',
  'createNeuralEditorSnapshot',
  'readNeuralEditorPresence',
  'EditorToolbarTemplateDirective',
  'EditorBubbleMenuTemplateDirective',
  'EditorFloatingMenuTemplateDirective',
  'EditorLinkPopoverTemplateDirective',
  'NeuralEditorDocument',
  'NeuralEditorNode',
  'NeuralEditorController',
  'NeuralEditorClasses',
  'NeuralEditorToolbarItem',
  'NeuralEditorToolbarColorItem',
  'NeuralEditorToolbarTableItem',
  'NeuralEditorColorOption',
  'NeuralEditorTextAlign',
  'NeuralEditorTableOptions',
  'NeuralEditorImageAttributes',
  'NeuralEditorImageInsertRequestEvent',
  'NeuralEditorMenuAppendTo',
  'NeuralEditorUpdateEvent',
  'NEURAL_EDITOR_EMPTY_DOCUMENT',
  'NEURAL_EDITOR_DEFAULT_TEXT_COLORS',
  'NEURAL_EDITOR_DEFAULT_HIGHLIGHT_COLORS',
  'NEURAL_EDITOR_DEFAULT_IDENTIFIED_NODE_TYPES',
  'NEURAL_EDITOR_DEFAULT_NODE_ID_ATTRIBUTE',
  'createNeuralEditorNodeId',
  'createNeuralEditorOperationBatch',
  'editorDocumentToHtml',
  'editorDocumentFromHtml',
  'editorDocumentToText',
  'editorDocumentWithNodeIds',
]) {
  assert(types.includes(symbol), `Editor type export is missing: ${symbol}`);
}
assert(types.includes('editorPaste'), 'Editor output is missing: editorPaste.');
assert(
  types.includes('NeuralEditor'),
  'Canonical NeuralEditor export is missing.',
);
for (const canonicalTemplate of [
  'NeuralEditorToolbarTemplate',
  'NeuralEditorAiReviewTemplate',
  'NeuralEditorBubbleMenuTemplate',
  'NeuralEditorFloatingMenuTemplate',
  'NeuralEditorLinkPopoverTemplate',
  'NeuralEditorSlashMenuTemplate',
  'NeuralEditorMentionMenuTemplate',
  'NeuralEditorCommandPaletteTemplate',
]) {
  assert(
    types.includes(canonicalTemplate),
    `Canonical Editor template export is missing: ${canonicalTemplate}`,
  );
}
assert(types.includes('editorDrop'), 'Editor output is missing: editorDrop.');
assert(
  !types.includes('minCharacters'),
  'Unused minCharacters input leaked into the public API.',
);
assert(
  types.includes('maxCharacters'),
  'Editor input is missing: maxCharacters.',
);
for (const retired of [
  'linkEditor?: string',
  'linkInput?: string',
  'linkApplyButton?: string',
  'linkRemoveButton?: string',
]) {
  assert(
    !types.includes(retired),
    `Retired class slot leaked into public types: ${retired}`,
  );
}

const readme = await read('README.md');
const apiFreeze = await read('API_FREEZE.md');
const migration = await read('MIGRATION.md');
const llms = await read('llms.txt');
assert(
  apiFreeze.includes('Beta Public API Contract'),
  'API freeze heading is stale.',
);
assert(apiFreeze.includes('editorPaste'), 'API freeze omits editorPaste.');
assert(apiFreeze.includes('editorDrop'), 'API freeze omits editorDrop.');
assert(
  apiFreeze.includes('minimum-length validation'),
  'API freeze omits minimum-length ownership.',
);
assert(apiFreeze.includes('maxCharacters'), 'API freeze omits maxCharacters.');
assert(
  migration.includes('@neural-ng/core/editor'),
  'Migration guide must name the removed entry point.',
);
assert(
  migration.includes('@neural-ng/editor'),
  'Migration guide must name the standalone package.',
);
assert(
  readme.includes('npm install @neural-ng/editor'),
  'README must document one-command installation.',
);
assert(
  readme.includes("from '@neural-ng/editor'"),
  'README must use the standalone package import.',
);
assert(
  !readme.includes('@neural-ng/core/editor'),
  'README leaked the removed secondary entry point.',
);
assert(
  !readme.includes('[maxLength]'),
  'README leaked the retired maxLength input.',
);
assert(
  llms.includes('# @neural-ng/editor'),
  'llms.txt package heading is stale.',
);
assert(
  !llms.includes('@neural-ng/core/editor'),
  'llms.txt leaked the removed secondary entry point.',
);
const notices = await read('THIRD_PARTY_NOTICES.md');
for (const project of ['Tiptap', 'ProseMirror', 'Yjs', 'Floating UI']) {
  assert(notices.includes(project), `Third-party notices omit ${project}.`);
}

const neutralTheme = await read('themes/neutral.css');
for (const token of [
  '--neural-editor-content-background',
  '--neural-editor-border-color-invalid',
  '--neural-editor-toolbar-menu-background',
  '--neural-editor-task-checkbox-accent',
  '--neural-editor-table-cell-border',
  '--neural-editor-context-menu-background',
  '--neural-editor-suggestion-background',
  '--neural-editor-command-palette-background',
  '--neural-editor-ai-review-background',
  '--neural-editor-collaboration-border',
  '--neural-editor-comment-background',
  '--neural-editor-tracked-insertion-background',
  '--neural-editor-tracked-deletion-background',
]) {
  assert(neutralTheme.includes(token), `Missing Editor theme token: ${token}`);
}
for (const theme of [
  await read('themes/experimental/glass.css'),
  await read('themes/experimental/mist.css'),
  await read('themes/experimental/futuristic.css'),
]) {
  for (const token of [
    '--neural-editor-radius',
    '--neural-editor-collaboration-border',
    '--neural-editor-comment-background',
  ])
    assert(theme.includes(token), `Experimental Editor theme omits ${token}.`);
}

const npmCli =
  process.env['npm_execpath'] ??
  join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
await access(npmCli);
const { stdout } = await execute(
  process.execPath,
  [npmCli, 'pack', '--dry-run', '--json', packageRoot],
  { cwd: workspaceRoot, maxBuffer: 10 * 1024 * 1024 },
);
const packResult = JSON.parse(stdout)[0];
const publishedFiles = new Set(packResult.files.map((file) => file.path));
for (const file of [
  'fesm2022/neural-ng-editor.mjs',
  'types/neural-ng-editor.d.ts',
  'README.md',
  'API_FREEZE.md',
  'MIGRATION.md',
  'llms.txt',
  'LICENSE',
  'THIRD_PARTY_NOTICES.md',
  'themes/neutral.css',
  'themes/tailwind.css',
  'themes/experimental/glass.css',
  'themes/experimental/mist.css',
  'themes/experimental/futuristic.css',
])
  assert(publishedFiles.has(file), `npm pack would omit ${file}.`);
assert(
  [...publishedFiles].every((file) => !file.endsWith('.spec.ts')),
  'Test source leaked into the npm package.',
);

console.log(
  `Validated ${packageJson.name}@${packageJson.version}: runtime dependencies, public types, themes, docs, notices, and npm pack contents.`,
);

async function read(relativePath) {
  return readFile(join(packageRoot, relativePath), 'utf8');
}
async function readJson(relativePath) {
  return JSON.parse(await read(relativePath));
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
