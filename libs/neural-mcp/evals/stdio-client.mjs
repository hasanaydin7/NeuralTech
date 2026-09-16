import { spawn } from 'node:child_process';

// Test-only protocol client. It does not run a model or modify host configuration.
export function createStdioClient(cli, cwd) {
  const child = spawn(process.execPath, [cli], {
    cwd,
    stdio: 'pipe',
    windowsHide: true,
  });
  const pending = new Map();
  let id = 0;
  let buffer = '';
  let stderr = '';
  const fail = (error) => {
    for (const waiter of pending.values()) {
      clearTimeout(waiter.timer);
      waiter.reject(error);
    }
    pending.clear();
  };
  child.on('error', fail);
  child.stdin.on('error', fail);
  child.on('exit', (code) =>
    fail(new Error(`MCP exited (${code}): ${stderr}`)),
  );
  child.stderr.setEncoding('utf8').on('data', (chunk) => {
    stderr = (stderr + chunk).slice(-4096);
  });
  child.stdout.setEncoding('utf8').on('data', (chunk) => {
    buffer += chunk;
    if (buffer.length > 4 * 1024 * 1024) {
      fail(new Error('MCP response exceeded test limit'));
      child.kill();
      return;
    }
    let newline;
    while ((newline = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (!line) continue;
      try {
        const message = JSON.parse(line);
        const waiter = pending.get(message.id);
        if (!waiter) continue;
        pending.delete(message.id);
        clearTimeout(waiter.timer);
        if (message.error)
          waiter.reject(new Error(JSON.stringify(message.error)));
        else waiter.resolve(message.result);
      } catch (error) {
        fail(error);
      }
    }
  });
  const write = (message) => child.stdin.write(JSON.stringify(message) + '\n');
  return {
    request(method, params) {
      return new Promise((resolve, reject) => {
        const requestId = ++id;
        const timer = setTimeout(() => {
          pending.delete(requestId);
          reject(new Error(`MCP ${method} timed out: ${stderr}`));
        }, 20_000);
        pending.set(requestId, { resolve, reject, timer });
        write({ jsonrpc: '2.0', id: requestId, method, params });
      });
    },
    notify(method, params) {
      write({ jsonrpc: '2.0', method, params });
    },
    async close() {
      fail(new Error('MCP test client closed'));
      if (child.exitCode !== null || child.signalCode !== null) return;
      const exit = new Promise((resolve) => child.once('exit', resolve));
      child.stdin.end();
      child.kill();
      await exit;
    },
  };
}
