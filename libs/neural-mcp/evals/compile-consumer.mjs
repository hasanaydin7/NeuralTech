import { fileURLToPath } from 'node:url';
import {
  createCompilerHost,
  performCompilation,
  readConfiguration,
} from '@angular/compiler-cli';
import ts from 'typescript';

const config = readConfiguration(
  fileURLToPath(new URL('./consumer/tsconfig.json', import.meta.url)),
);
const host = createCompilerHost({ options: config.options });
const originalRead = host.readFile.bind(host);
const mode = process.argv[2] ?? 'valid';
if (!['valid', 'invalid-type', 'missing-import'].includes(mode))
  throw new Error(`Unknown mode: ${mode}`);
host.readFile = (path) => {
  const source = originalRead(path);
  if (
    mode === 'missing-import' &&
    path.replaceAll('\\', '/').endsWith('/consumer/users.ts')
  ) {
    const target = /(imports:\s*\[[\s\S]*?)\bNeuralPaginator,/;
    if (!source || !target.test(source))
      throw new Error('Missing standalone import mutation target');
    return source.replace(target, '$1');
  }
  if (
    mode === 'invalid-type' &&
    path.replaceAll('\\', '/').endsWith('/consumer/users.html')
  ) {
    if (!source?.includes('[totalItems]="filteredUsers().length"'))
      throw new Error('Missing mutation target');
    return source.replace(
      '[totalItems]="filteredUsers().length"',
      '[totalItems]="\'not-a-number\'"',
    );
  }
  return source;
};
const result = performCompilation({
  rootNames: config.rootNames,
  options: config.options,
  host,
});
const errors = [...config.errors, ...result.diagnostics].filter(
  (d) => d.category === ts.DiagnosticCategory.Error,
);
process.stdout.write(
  JSON.stringify(
    errors.map((d) => ({
      code: d.code,
      message: ts.flattenDiagnosticMessageText(d.messageText, '\n'),
      file: d.file?.fileName,
    })),
  ),
);
process.exitCode = errors.length ? 1 : 0;
