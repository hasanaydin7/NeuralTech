import { execFile } from 'node:child_process';
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import process from 'node:process';

const execute = promisify(execFile);
const workspaceRoot = process.cwd();
const temporaryRoot = resolve(workspaceRoot, 'tmp');
const npmCli = process.env['npm_execpath'];

if (!npmCli) {
  throw new Error('Run this smoke test through `npm run package:smoke`.');
}

await mkdir(temporaryRoot, { recursive: true });
const consumerRoot = await mkdtemp(join(temporaryRoot, 'package-smoke-'));
const packageDirectory = join(consumerRoot, 'packages');

try {
  await mkdir(packageDirectory, { recursive: true });
  const coreTarball = await pack(
    resolve(workspaceRoot, 'dist/libs/neural-ng'),
    packageDirectory,
  );
  const editorTarball = await pack(
    resolve(workspaceRoot, 'dist/libs/neural-editor'),
    packageDirectory,
  );
  const iconsTarball = await pack(
    resolve(workspaceRoot, 'dist/libs/neural-icons'),
    packageDirectory,
  );
  const themeTarball = await pack(
    resolve(workspaceRoot, 'dist/libs/neural-theme'),
    packageDirectory,
  );

  const versions = await installedVersions([
    '@angular/common',
    '@angular/compiler',
    '@angular/compiler-cli',
    '@angular/core',
    '@angular/forms',
    '@angular/platform-browser',
    '@angular/router',
    'rxjs',
    'tslib',
    'typescript',
  ]);

  await writeJson(join(consumerRoot, 'package.json'), {
    name: 'neural-ng-package-smoke',
    version: '0.0.0',
    private: true,
    dependencies: {
      '@angular/common': versions['@angular/common'],
      '@angular/core': versions['@angular/core'],
      '@angular/forms': versions['@angular/forms'],
      '@angular/platform-browser': versions['@angular/platform-browser'],
      '@angular/router': versions['@angular/router'],
      '@neural-ng/core': `file:./packages/${coreTarball}`,
      '@neural-ng/editor': `file:./packages/${editorTarball}`,
      '@neural-ng/icons': `file:./packages/${iconsTarball}`,
      rxjs: versions.rxjs,
      tslib: versions.tslib,
    },
    devDependencies: {
      '@angular/compiler': versions['@angular/compiler'],
      '@angular/compiler-cli': versions['@angular/compiler-cli'],
      '@neural-ng/theme': `file:./packages/${themeTarball}`,
      typescript: versions.typescript,
    },
  });

  await writeJson(join(consumerRoot, 'tsconfig.json'), {
    compilerOptions: {
      target: 'ES2022',
      module: 'ES2022',
      moduleResolution: 'bundler',
      strict: true,
      skipLibCheck: false,
      experimentalDecorators: true,
      useDefineForClassFields: false,
      lib: ['ES2022', 'DOM'],
      rootDir: './src',
      outDir: './out',
    },
    angularCompilerOptions: {
      strictTemplates: true,
      compilationMode: 'full',
    },
    files: ['./src/app.ts'],
  });

  await mkdir(join(consumerRoot, 'src'), { recursive: true });
  await writeFile(
    join(consumerRoot, 'src/app.ts'),
    `import { Component, signal } from '@angular/core';
import { NeuralButton, NeuralButtonGroup } from '@neural-ng/core/button';
import { EditorComponent, type NeuralEditorDocument } from '@neural-ng/editor';
import {
  NeuralDatePicker,
  type NeuralDateParts
} from '@neural-ng/core/date-picker';

@Component({
  selector: 'smoke-app',
  standalone: true,
  imports: [NeuralButton, NeuralButtonGroup, NeuralDatePicker, EditorComponent],
  template: \`
    <neural-button-group ariaLabel="Smoke actions">
      <neural-button severity="primary" outlined rounded (clicked)="save()">Save</neural-button>
      <neural-button severity="primary" text raised>Preview</neural-button>
    </neural-button-group>
    <neural-date-picker [(value)]="date" />
    <neural-editor [(value)]="document" [maxCharacters]="5000" />
  \`
})
export class SmokeApp {
  readonly document = signal<NeuralEditorDocument>({
    type: 'doc',
    content: [{ type: 'paragraph' }]
  });

  readonly date = signal<NeuralDateParts | null>({
    year: 2026,
    month: 8,
    day: 12
  });

  save(): void {}
}
`,
    'utf8',
  );

  await executeNpm(
    ['install', '--ignore-scripts', '--no-audit', '--no-fund'],
    consumerRoot,
  );

  await access(
    join(consumerRoot, 'node_modules/@neural-ng/core/date-picker/README.md'),
  );
  await access(
    join(consumerRoot, 'node_modules/@neural-ng/core/date-picker/llms.txt'),
  );
  await access(join(consumerRoot, 'node_modules/@neural-ng/icons/icons.css'));
  await access(join(consumerRoot, 'node_modules/@neural-ng/theme/schema.json'));
  await access(
    join(
      consumerRoot,
      'node_modules/@neural-ng/theme/contracts/neutral.tokens.json',
    ),
  );
  await access(join(consumerRoot, 'node_modules/@neural-ng/editor/README.md'));
  await access(join(consumerRoot, 'node_modules/@neural-ng/editor/llms.txt'));
  await access(join(consumerRoot, 'node_modules/@neural-ng/editor/LICENSE'));
  await access(
    join(consumerRoot, 'node_modules/@neural-ng/editor/THIRD_PARTY_NOTICES.md'),
  );
  await access(join(consumerRoot, 'node_modules/@tiptap/core/package.json'));
  await access(
    join(consumerRoot, 'node_modules/@floating-ui/dom/package.json'),
  );
  await access(join(consumerRoot, 'node_modules/yjs/package.json'));

  await writeJson(join(consumerRoot, 'neural.theme.json'), {
    schemaVersion: 1,
    name: 'smoke',
    extends: 'neutral',
    color: { primary: '#7c3aed', surface: 'slate' },
    components: { button: { radius: '1rem' } },
  });
  const themeCli = join(
    consumerRoot,
    'node_modules/@neural-ng/theme/src/cli.js',
  );
  await execute(
    process.execPath,
    [themeCli, 'build', '--out-dir', 'src/generated'],
    {
      cwd: consumerRoot,
      maxBuffer: 10 * 1024 * 1024,
    },
  );
  const generatedTheme = await readFile(
    join(consumerRoot, 'src/generated/smoke.css'),
    'utf8',
  );
  if (!generatedTheme.includes("data-neural-theme='smoke'")) {
    throw new Error('Packed theme compiler did not emit scoped CSS.');
  }

  const compiler = join(
    consumerRoot,
    'node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js',
  );
  await execute(process.execPath, [compiler, '-p', 'tsconfig.json'], {
    cwd: consumerRoot,
    maxBuffer: 10 * 1024 * 1024,
  });

  console.log(
    'Installed packed @neural-ng/core, @neural-ng/editor, @neural-ng/icons and @neural-ng/theme into an external consumer, generated CSS and compiled its strict Angular template.',
  );
} finally {
  await rm(consumerRoot, { recursive: true, force: true });
}

async function pack(packageRoot, destination) {
  await access(join(packageRoot, 'package.json'));
  const { stdout } = await executeNpm(
    ['pack', packageRoot, '--pack-destination', destination, '--json'],
    workspaceRoot,
  );
  const result = JSON.parse(stdout);
  const filename = result[0]?.filename;
  if (!filename)
    throw new Error(`npm pack produced no archive for ${packageRoot}.`);
  return filename;
}

async function executeNpm(args, cwd) {
  return execute(process.execPath, [npmCli, ...args], {
    cwd,
    maxBuffer: 10 * 1024 * 1024,
  });
}

async function installedVersions(packages) {
  const result = {};
  for (const name of packages) {
    const manifest = JSON.parse(
      await readFile(
        resolve(workspaceRoot, 'node_modules', name, 'package.json'),
        'utf8',
      ),
    );
    result[name] = manifest.version;
  }
  return result;
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}
