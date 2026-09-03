import { spawn } from 'node:child_process';
import { access, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import process from 'node:process';

const workspaceRoot = process.cwd();
const packageRoot = resolve(workspaceRoot, 'dist/libs/neural-mcp');
const themePackageRoot = resolve(workspaceRoot, 'dist/libs/neural-theme');
const temporaryRoot = resolve(workspaceRoot, 'tmp');
const npmCli = process.env['npm_execpath'];

if (!npmCli) {
  throw new Error(
    'Run this smoke test through Nx or npm so npm_execpath is available.',
  );
}

await mkdir(temporaryRoot, { recursive: true });
const consumerRoot = await mkdtemp(join(temporaryRoot, 'neural-mcp-smoke-'));

try {
  await access(join(packageRoot, 'package.json'));
  await access(join(themePackageRoot, 'package.json'));
  const themePackResult = await runNpm(
    ['pack', themePackageRoot, '--pack-destination', consumerRoot, '--json'],
    workspaceRoot,
  );
  const themeTarball = JSON.parse(themePackResult.stdout)[0]?.filename;
  if (!themeTarball)
    throw new Error('npm pack produced no Neural theme archive.');

  const packResult = await runNpm(
    ['pack', packageRoot, '--pack-destination', consumerRoot, '--json'],
    workspaceRoot,
  );
  const tarball = JSON.parse(packResult.stdout)[0]?.filename;
  if (!tarball) throw new Error('npm pack produced no Neural MCP archive.');

  await writeFile(
    join(consumerRoot, 'package.json'),
    `${JSON.stringify(
      {
        name: 'neural-mcp-smoke-consumer',
        version: '0.0.0',
        private: true,
        dependencies: {
          '@neural-ng/mcp-server': `file:./${tarball}`,
          '@neural-ng/theme': `file:./${themeTarball}`,
        },
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  await runNpm(
    ['install', '--ignore-scripts', '--no-audit', '--no-fund'],
    consumerRoot,
  );

  const cliPath = join(
    consumerRoot,
    'node_modules/@neural-ng/mcp-server/src/cli.js',
  );
  const client = createJsonRpcClient(cliPath, consumerRoot);

  try {
    const initialized = await client.request('initialize', {
      protocolVersion: '2025-11-25',
      capabilities: {},
      clientInfo: { name: 'neural-mcp-smoke', version: '0.0.0' },
    });
    assert(
      initialized?.protocolVersion,
      'MCP initialize returned no protocol version.',
    );
    client.notify('notifications/initialized', {});

    const tools = await client.request('tools/list', {});
    const toolNames = tools?.tools?.map((tool) => tool.name) ?? [];
    assert(
      toolNames.length === 18,
      `Expected 18 tools, received ${toolNames.length}.`,
    );
    assert(
      toolNames.includes('recommend_components'),
      'Recommendation tool is missing.',
    );
    assert(
      toolNames.includes('get_component'),
      'Component API tool is missing.',
    );
    assert(
      toolNames.includes('get_component_examples'),
      'Component examples tool is missing.',
    );
    assert(toolNames.includes('plan_ui'), 'UI planning tool is missing.');
    assert(
      toolNames.includes('suggest_table_structure'),
      'Table structure tool is missing.',
    );
    assert(toolNames.includes('validate_usage'), 'Usage validator is missing.');
    assert(
      toolNames.includes('inspect_neuralng_project'),
      'Project inspection tool is missing.',
    );
    assert(
      toolNames.includes('suggest_consistent_ui'),
      'Project-consistent UI tool is missing.',
    );
    assert(
      toolNames.includes('create_theme_recipe'),
      'Theme recipe tool is missing.',
    );
    assert(
      toolNames.includes('compile_theme_recipe'),
      'Theme compile tool is missing.',
    );

    const resources = await client.request('resources/list', {});
    assert(
      (resources?.resources?.length ?? 0) > 240,
      'MCP resource catalog is unexpectedly small.',
    );

    const themeSchema = await client.request('resources/read', {
      uri: 'neural://themes/schema',
    });
    assert(
      (themeSchema?.contents?.[0]?.text ?? '').includes(
        'compact sparse JSON recipe',
      ),
      'MCP theme schema resource is missing.',
    );

    const contract = await client.request('resources/read', {
      uri: 'neural://components/tri-state-checkbox/contract',
    });
    const contractText = contract?.contents?.[0]?.text ?? '';
    assert(
      contractText.includes('FormValueControl<boolean | null>'),
      'MCP contract resource returned the wrong tri-state contract.',
    );

    const recommendation = await client.request('tools/call', {
      name: 'recommend_components',
      arguments: { goal: 'nullable inherited permission checkbox', limit: 3 },
    });
    const recommendationText = recommendation?.content?.[0]?.text ?? '';
    assert(
      recommendationText.includes('tri-state-checkbox'),
      'MCP recommendation tool did not return TriStateCheckbox.',
    );

    const componentApi = await client.request('tools/call', {
      name: 'get_component',
      arguments: { component: 'neural-select', detail: 'standard' },
    });
    assert(
      componentApi?.structuredContent?.component?.inputs?.some(
        (input) => input.name === 'options',
      ),
      'Structured component API returned no Select options input.',
    );

    const componentExamples = await client.request('tools/call', {
      name: 'get_component_examples',
      arguments: { component: 'neural-select', limit: 3 },
    });
    assert(
      componentExamples?.structuredContent?.examples?.length === 3,
      'Structured component examples returned the wrong bounded result.',
    );

    const uiPlan = await client.request('tools/call', {
      name: 'plan_ui',
      arguments: {
        goal: 'Admin user management with search, role filter, table and detail drawer',
      },
    });
    const plannedIds =
      uiPlan?.structuredContent?.plan?.components?.map(
        (component) => component.id,
      ) ?? [];
    assert(
      plannedIds.includes('table') &&
        plannedIds.includes('select') &&
        plannedIds.includes('neural-drawer'),
      'UI planning tool returned an incomplete admin table composition.',
    );

    const usageValidation = await client.request('tools/call', {
      name: 'validate_usage',
      arguments: {
        template: '<neural-button icon="trash"></neural-button>',
        imports_json: JSON.stringify(['NeuralButton']),
      },
    });
    assert(
      usageValidation?.structuredContent?.validation?.diagnostics?.some(
        (diagnostic) => diagnostic.code === 'NNG201',
      ),
      'Usage validator did not reject an inaccessible icon-only button.',
    );

    const projectInspection = await client.request('tools/call', {
      name: 'inspect_neuralng_project',
      arguments: {},
    });
    assert(
      projectInspection?.structuredContent?.inspection?.framework
        ?.neuralPackages?.['@neural-ng/mcp-server'],
      'Project inspector did not detect the installed MCP package.',
    );

    const createdTheme = await client.request('tools/call', {
      name: 'create_theme_recipe',
      arguments: {
        name: 'smoke-theme',
        options_json: JSON.stringify({
          primary: '#7c3aed',
          surface: 'slate',
          radius: 'large',
        }),
      },
    });
    const createdThemeText = createdTheme?.content?.[0]?.text ?? '';
    assert(
      createdThemeText.includes('smoke-theme') &&
        createdThemeText.includes('"valid": true'),
      'MCP theme recipe tool returned an invalid result.',
    );

    const compiledTheme = await client.request('tools/call', {
      name: 'compile_theme_recipe',
      arguments: {
        recipe_json: JSON.stringify({
          schemaVersion: 1,
          name: 'smoke-theme',
          extends: 'neutral',
          color: { primary: '#7c3aed', surface: 'slate' },
          modes: { dark: 'auto' },
        }),
      },
    });
    const compiledThemeText = compiledTheme?.content?.[0]?.text ?? '';
    assert(
      compiledThemeText.includes('smoke-theme') &&
        compiledThemeText.includes('artifact'),
      'MCP theme compile tool returned no summary metadata.',
    );
  } finally {
    await client.close();
  }

  console.log(
    'Packed theme and MCP packages, then initialized, listed, read, and called component and theme tools over stdio.',
  );
} finally {
  await rm(consumerRoot, { recursive: true, force: true });
}

function createJsonRpcClient(cliPath, cwd) {
  const child = spawn(process.execPath, [cliPath], {
    cwd,
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true,
  });
  const pending = new Map();
  let nextId = 1;
  let stdoutBuffer = '';
  let stderr = '';

  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    stdoutBuffer += chunk;
    let newline = stdoutBuffer.indexOf('\n');
    while (newline >= 0) {
      const line = stdoutBuffer.slice(0, newline).trim();
      stdoutBuffer = stdoutBuffer.slice(newline + 1);
      if (line) receive(line);
      newline = stdoutBuffer.indexOf('\n');
    }
  });
  child.on('exit', (code) => {
    if (code && pending.size > 0) {
      const error = new Error(
        `Neural MCP server exited with code ${code}. ${stderr}`.trim(),
      );
      for (const waiter of pending.values()) waiter.reject(error);
      pending.clear();
    }
  });

  function receive(line) {
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      const error = new Error(`Non-protocol stdout from MCP server: ${line}`);
      for (const waiter of pending.values()) waiter.reject(error);
      pending.clear();
      return;
    }
    if (message.id === undefined) return;
    const waiter = pending.get(message.id);
    if (!waiter) return;
    pending.delete(message.id);
    clearTimeout(waiter.timeout);
    if (message.error) waiter.reject(new Error(JSON.stringify(message.error)));
    else waiter.resolve(message.result);
  }

  function write(message) {
    child.stdin.write(`${JSON.stringify(message)}\n`);
  }

  return {
    request(method, params) {
      const id = nextId++;
      write({ jsonrpc: '2.0', id, method, params });
      return new Promise((resolvePromise, rejectPromise) => {
        const timeout = setTimeout(() => {
          pending.delete(id);
          rejectPromise(
            new Error(`Timed out waiting for ${method}. ${stderr}`.trim()),
          );
        }, 20000);
        pending.set(id, {
          resolve: resolvePromise,
          reject: rejectPromise,
          timeout,
        });
      });
    },
    notify(method, params) {
      write({ jsonrpc: '2.0', method, params });
    },
    async close() {
      child.stdin.end();
      if (child.exitCode === null) child.kill();
      await new Promise((resolvePromise) => {
        if (child.exitCode !== null) resolvePromise();
        else child.once('exit', resolvePromise);
      });
    },
  };
}

async function runNpm(args, cwd) {
  const child = spawn(process.execPath, [npmCli, ...args], {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => (stdout += chunk));
  child.stderr.on('data', (chunk) => (stderr += chunk));
  const code = await new Promise((resolvePromise) =>
    child.once('exit', resolvePromise),
  );
  if (code !== 0) {
    throw new Error(`npm ${args.join(' ')} failed (${code}).\n${stderr}`);
  }
  return { stdout, stderr };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
