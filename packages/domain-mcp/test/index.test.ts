import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  connect: vi.fn(async () => undefined),
  close: vi.fn(async () => undefined),
  startHttpServer: vi.fn(),
  processOn: vi.fn(),
}));

vi.mock('../src/server.js', () => ({
  createDomainMcpServer: () => ({ connect: mocks.connect }),
}));

vi.mock('../src/http-server.js', () => ({
  startHttpServer: mocks.startHttpServer,
}));

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: class {},
}));

class ProcessExit extends Error {
  constructor(readonly code: number) {
    super(`process exited with ${code}`);
  }
}

async function runIndex(
  args: string[],
  options: { isTTY?: boolean; env?: Record<string, string | undefined> } = {},
): Promise<void> {
  process.argv = ['node', 'domain-mcp', ...args];
  Object.defineProperty(process.stdin, 'isTTY', { configurable: true, value: options.isTTY });
  for (const [key, value] of Object.entries(options.env ?? {})) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  vi.resetModules();
  await import('../src/index.js');
}

describe('CLI entrypoint', () => {
  const originalArgv = [...process.argv];
  const originalIsTTY = process.stdin.isTTY;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    mocks.connect.mockClear();
    mocks.close.mockClear();
    mocks.processOn.mockClear();
    mocks.startHttpServer.mockReset().mockResolvedValue({
      url: 'http://127.0.0.1:8102/mcp',
      close: mocks.close,
    });
    vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new ProcessExit(Number(code));
    });
    vi.spyOn(process, 'on').mockImplementation(((event: string, listener: () => void) => {
      mocks.processOn(event, listener);
      return process;
    }) as typeof process.on);
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    process.argv = originalArgv;
    Object.defineProperty(process.stdin, 'isTTY', { configurable: true, value: originalIsTTY });
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it.each([['--help'], ['-h']])('prints help for %s', async (flag) => {
    await expect(runIndex([flag])).rejects.toMatchObject({ code: 0 });
    expect(process.stdout.write).toHaveBeenCalledWith(expect.stringContaining('domain-mcp v'));
    expect(process.stdout.write).toHaveBeenCalledWith(
      expect.stringContaining('Example configuration'),
    );
  });

  it.each([['--version'], ['-v']])('prints the version for %s', async (flag) => {
    await expect(runIndex([flag])).rejects.toMatchObject({ code: 0 });
    expect(process.stdout.write).toHaveBeenCalledWith('3.0.0\n');
  });

  it('rejects conflicting transports', async () => {
    await expect(runIndex(['--http', '--stdio'])).rejects.toThrow('Choose either');
  });

  it.each([
    [['--http', '--host'], '--host requires a value'],
    [['--http', '--port', '-1'], '--port requires a value'],
    [['--http', '--port', 'not-a-port'], 'Invalid --port value'],
    [['--http', '--port', '65536'], 'Invalid --port value'],
  ] as const)('rejects invalid option values', async (args, message) => {
    await expect(runIndex([...args])).rejects.toThrow(message);
  });

  it('starts HTTP with defaults and explicit environment policy', async () => {
    await runIndex(['--http', '--allow-unauthenticated'], {
      env: {
        DOMAIN_MCP_AUTH_TOKEN: 'test-token',
        DOMAIN_MCP_ALLOWED_HOSTS: ' localhost, example.com ',
        DOMAIN_MCP_ALLOWED_ORIGINS: ' https://example.com, http://localhost ',
        DOMAIN_MCP_SESSION_IDLE_TIMEOUT_MS: '1234',
      },
    });

    expect(mocks.startHttpServer).toHaveBeenCalledWith({
      host: '127.0.0.1',
      port: 8102,
      version: '3.0.0',
      authToken: 'test-token',
      allowUnauthenticated: true,
      allowedHosts: ['localhost', 'example.com'],
      allowedOrigins: ['https://example.com', 'http://localhost'],
      sessionIdleTimeoutMs: 1234,
    });
    expect(process.stderr.write).toHaveBeenCalledWith(
      'domain-mcp listening at http://127.0.0.1:8102/mcp\n',
    );
  });

  it('uses explicit HTTP host and port and shuts down once per signal', async () => {
    await runIndex(['--http', '--host', 'localhost', '--port', '0'], {
      env: {
        DOMAIN_MCP_AUTH_TOKEN: undefined,
        DOMAIN_MCP_ALLOWED_HOSTS: undefined,
        DOMAIN_MCP_ALLOWED_ORIGINS: undefined,
        DOMAIN_MCP_SESSION_IDLE_TIMEOUT_MS: undefined,
      },
    });
    expect(mocks.startHttpServer).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'localhost',
        port: 0,
        allowedHosts: undefined,
        allowedOrigins: undefined,
        sessionIdleTimeoutMs: 1_800_000,
      }),
    );

    const shutdown = mocks.processOn.mock.calls.find(([event]) => event === 'SIGINT')?.[1];
    if (!shutdown) throw new Error('SIGINT handler not registered');
    await expect(shutdown()).rejects.toMatchObject({ code: 0 });
    await shutdown();
    expect(mocks.close).toHaveBeenCalledTimes(1);
  });

  it('shows usage when stdio is launched interactively', async () => {
    await expect(runIndex([], { isTTY: true })).rejects.toMatchObject({ code: 1 });
    expect(process.stderr.write).toHaveBeenCalledWith(
      expect.stringContaining('domain-mcp is an MCP server'),
    );
  });

  it('connects stdio when input is piped', async () => {
    await runIndex(['--stdio'], { isTTY: false });
    expect(mocks.connect).toHaveBeenCalledTimes(1);
  });
});
