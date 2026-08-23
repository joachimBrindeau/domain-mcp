import { request } from 'node:http';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type RunningHttpServer, startHttpServer } from '../src/http-server.js';

const initializeBody = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'test', version: '1.0.0' },
  },
};

async function rawRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string | string[]>;
    body?: string | Buffer;
  } = {},
): Promise<{
  status: number;
  headers: Record<string, string | string[] | undefined>;
  body: string;
}> {
  return new Promise((resolve, reject) => {
    const req = request(url, { method: options.method, headers: options.headers }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      res.on('end', () => {
        resolve({
          status: res.statusCode ?? 0,
          headers: res.headers,
          body: Buffer.concat(chunks).toString('utf8'),
        });
      });
    });
    req.on('error', reject);
    if (options.body !== undefined) req.write(options.body);
    req.end();
  });
}

describe('Streamable HTTP server', () => {
  let running: RunningHttpServer | undefined;

  afterEach(async () => {
    await running?.close();
    running = undefined;
  });

  it('requires authentication unless loopback opt-out is explicit', async () => {
    await expect(startHttpServer({ host: '127.0.0.1', port: 0, version: 'test' })).rejects.toThrow(
      'DOMAIN_MCP_AUTH_TOKEN is required',
    );

    await expect(
      startHttpServer({
        host: '0.0.0.0',
        port: 0,
        version: 'test',
        allowUnauthenticated: true,
      }),
    ).rejects.toThrow('loopback host');
  });

  it('serves health without authentication and protects MCP requests', async () => {
    running = await startHttpServer({
      host: '127.0.0.1',
      port: 0,
      version: 'test',
      authToken: 'test-token',
    });

    const healthUrl = running.url.replace('/mcp', '/health');
    const health = await fetch(healthUrl);
    expect(health.status).toBe(200);
    expect(await health.json()).toEqual({ status: 'ok', sessions: 0 });

    const unauthorized = await fetch(running.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: { name: 'test', version: '1.0.0' },
        },
      }),
    });
    expect(unauthorized.status).toBe(401);
    expect(unauthorized.headers.get('www-authenticate')).toBe('Bearer');
  });

  it('supports an authenticated MCP session over Streamable HTTP', async () => {
    running = await startHttpServer({
      host: '127.0.0.1',
      port: 0,
      version: 'test',
      authToken: 'test-token',
      sessionIdleTimeoutMs: 200,
    });

    const client = new Client({ name: 'domain-mcp-test', version: '1.0.0' });
    const transport = new StreamableHTTPClientTransport(new URL(running.url), {
      requestInit: { headers: { Authorization: 'Bearer test-token' } },
    });

    await client.connect(transport);
    const tools = await client.listTools();
    expect(tools.tools.map((tool) => tool.name)).toContain('domains.manage');

    const health = await fetch(running.url.replace('/mcp', '/health'));
    expect(await health.json()).toEqual({ status: 'ok', sessions: 1 });

    await client.close();

    await new Promise((resolve) => setTimeout(resolve, 250));

    const closedHealth = await fetch(running.url.replace('/mcp', '/health'));
    expect(await closedHealth.json()).toEqual({ status: 'ok', sessions: 0 });
  });

  it('rejects unapproved browser origins', async () => {
    running = await startHttpServer({
      host: '127.0.0.1',
      port: 0,
      version: 'test',
      authToken: 'test-token',
    });

    const response = await fetch(running.url, {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-token',
        'content-type': 'application/json',
        origin: 'https://evil.example',
      },
      body: '{}',
    });
    expect(response.status).toBe(403);
  });

  it.each([0, -1, 1.5, Number.NaN])('rejects invalid session idle timeout %s', async (timeout) => {
    await expect(
      startHttpServer({
        host: '127.0.0.1',
        port: 0,
        version: 'test',
        allowUnauthenticated: true,
        sessionIdleTimeoutMs: timeout,
      }),
    ).rejects.toThrow('Session idle timeout must be a positive integer');
  });

  it('returns JSON-RPC errors for unknown routes and invalid session usage', async () => {
    running = await startHttpServer({
      host: '127.0.0.1',
      port: 0,
      version: 'test',
      allowUnauthenticated: true,
    });

    const baseHeaders = { host: 'localhost', 'content-type': 'application/json' };
    const cases = [
      { url: running.url.replace('/mcp', '/missing'), method: 'GET', status: 404 },
      { url: running.url, method: 'POST', status: 400, body: '{}' },
      { url: running.url, method: 'POST', status: 400 },
      { url: running.url, method: 'GET', status: 400 },
      { url: running.url, method: 'PATCH', status: 400 },
      {
        url: running.url,
        method: 'POST',
        status: 400,
        body: '{}',
        headers: { ...baseHeaders, 'mcp-session-id': 'missing' },
      },
      {
        url: running.url,
        method: 'GET',
        status: 404,
        headers: { ...baseHeaders, 'mcp-session-id': 'missing' },
      },
      {
        url: running.url,
        method: 'DELETE',
        status: 404,
        headers: { ...baseHeaders, 'mcp-session-id': 'missing' },
      },
    ];

    for (const testCase of cases) {
      const response = await rawRequest(testCase.url, {
        method: testCase.method,
        headers: testCase.headers ?? baseHeaders,
        body: testCase.body,
      });
      expect(response.status).toBe(testCase.status);
      expect(JSON.parse(response.body).error.message).toMatch(/Not found|Invalid or missing/);
    }
  });

  it('rejects missing hosts, malformed origins, and invalid bearer credentials', async () => {
    running = await startHttpServer({
      host: '127.0.0.1',
      port: 0,
      version: 'test',
      authToken: 'expected-token',
      allowedHosts: ['EXAMPLE.TEST:1234'],
      allowedOrigins: ['HTTPS://APP.EXAMPLE.TEST'],
    });

    const body = JSON.stringify(initializeBody);
    const denied = [
      {},
      { host: '' },
      { host: 'example.test', origin: 'not a valid URL' },
      { host: 'example.test', authorization: 'Basic abc' },
      { host: 'example.test', authorization: 'Bearer wrong-token' },
    ];
    for (const headers of denied) {
      const response = await rawRequest(running.url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...headers },
        body,
      });
      expect([401, 403]).toContain(response.status);
    }
  });

  it('accepts normalized custom hosts and origins', async () => {
    running = await startHttpServer({
      host: '127.0.0.1',
      port: 0,
      version: 'test',
      allowUnauthenticated: true,
      allowedHosts: ['EXAMPLE.TEST:9876'],
      allowedOrigins: ['HTTPS://APP.EXAMPLE.TEST'],
    });

    const response = await rawRequest(running.url, {
      method: 'POST',
      headers: {
        host: 'example.test:4321',
        origin: 'https://app.example.test',
        'content-type': 'application/json',
      },
      body: '{}',
    });
    expect(response.status).toBe(400);
    expect(JSON.parse(response.body).error.message).toBe('Invalid or missing MCP session ID');
  });

  it('reports malformed and oversized JSON request bodies without crashing', async () => {
    running = await startHttpServer({
      host: '127.0.0.1',
      port: 0,
      version: 'test',
      allowUnauthenticated: true,
    });
    const stderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    const malformed = await rawRequest(running.url, {
      method: 'POST',
      headers: { host: 'localhost', 'content-type': 'application/json' },
      body: '{',
    });
    expect(malformed.status).toBe(400);
    expect(JSON.parse(malformed.body).error.message).toBe('Request failed');

    const oversized = await rawRequest(running.url, {
      method: 'POST',
      headers: { host: 'localhost', 'content-type': 'application/json' },
      body: Buffer.alloc(1024 * 1024 + 1, 32),
    });
    expect(oversized.status).toBe(500);
    expect(JSON.parse(oversized.body).error.message).toBe('Request failed');
    expect(stderr).toHaveBeenCalledTimes(2);
    stderr.mockRestore();
  });

  it('supports IPv6 loopback defaults when available', async () => {
    try {
      running = await startHttpServer({
        host: '::1',
        port: 0,
        version: 'test',
        allowUnauthenticated: true,
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EADDRNOTAVAIL') return;
      throw error;
    }

    expect(running.url).toMatch(/^http:\/\/\[::1\]:\d+\/mcp$/);
    const response = await fetch(running.url, {
      method: 'POST',
      headers: { origin: running.url.replace('/mcp', '') },
      body: '{}',
    });
    expect(response.status).toBe(403);
  });

  it('rejects a port that is already in use', async () => {
    running = await startHttpServer({
      host: '127.0.0.1',
      port: 0,
      version: 'test',
      allowUnauthenticated: true,
    });
    const address = running.server.address();
    if (!address || typeof address === 'string') throw new Error('Expected TCP server address');

    await expect(
      startHttpServer({
        host: '127.0.0.1',
        port: address.port,
        version: 'test',
        allowUnauthenticated: true,
      }),
    ).rejects.toMatchObject({ code: 'EADDRINUSE' });
  });

  it('closes active MCP transports when the HTTP server shuts down', async () => {
    running = await startHttpServer({
      host: '127.0.0.1',
      port: 0,
      version: 'test',
      authToken: 'test-token',
    });
    const client = new Client({ name: 'domain-mcp-test', version: '1.0.0' });
    const transport = new StreamableHTTPClientTransport(new URL(running.url), {
      requestInit: { headers: { Authorization: 'Bearer test-token' } },
    });
    await client.connect(transport);

    await running.close();
    running = undefined;
    await client.close().catch(() => undefined);
  });

  it('handles protocol edge cases exposed by Node request and server APIs', async () => {
    type RequestHandler = (req: unknown, res: unknown) => Promise<void>;
    const handlers: RequestHandler[] = [];
    const transports: Array<{
      sessionId?: string;
      onclose?: () => void;
      close: ReturnType<typeof vi.fn>;
    }> = [];

    vi.resetModules();
    vi.doMock('node:http', () => ({
      createServer: (handler: RequestHandler) => {
        handlers.push(handler);
        return {
          once: vi.fn(),
          off: vi.fn(),
          listen: (_port: number, _host: string, callback: () => void) => callback(),
          address: () => 'test-socket',
          close: (callback: (error?: Error) => void) => callback(),
        };
      },
    }));
    vi.doMock('@modelcontextprotocol/sdk/types.js', () => ({ isInitializeRequest: () => true }));
    vi.doMock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => ({
      StreamableHTTPServerTransport: class {
        sessionId?: string;
        onclose?: () => void;
        close = vi.fn(async () => undefined);
        private readonly options: { onsessioninitialized: (id: string) => void };

        constructor(options: { onsessioninitialized: (id: string) => void }) {
          this.options = options;
          transports.push(this);
        }

        async handleRequest(): Promise<void> {
          if (!this.sessionId) {
            this.sessionId = 'session-id';
            this.options.onsessioninitialized(this.sessionId);
          }
        }
      },
    }));
    vi.doMock('../src/server.js', () => ({
      createDomainMcpServer: () => ({ connect: vi.fn(async () => undefined) }),
    }));

    const stderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    try {
      const { startHttpServer: startMockedServer } = await import('../src/http-server.js');
      const mockedServer = await startMockedServer({
        host: '127.0.0.1',
        port: 4568,
        version: 'test',
        allowUnauthenticated: true,
      });
      const handler = handlers.at(-1);
      if (!handler) throw new Error('Expected request handler');

      const response = (headersSent = false) => ({
        headersSent,
        writeHead: vi.fn(),
        end: vi.fn(),
        setHeader: vi.fn(),
      });
      await handler(
        { url: '/mcp', headers: {}, method: 'GET', async *[Symbol.asyncIterator]() {} },
        response(),
      );
      const defaultRouteResponse = response();
      await handler(
        { headers: { host: 'localhost' }, method: 'GET', async *[Symbol.asyncIterator]() {} },
        defaultRouteResponse,
      );
      expect(defaultRouteResponse.writeHead).toHaveBeenCalledWith(404, {
        'content-type': 'application/json',
      });
      await handler(
        {
          url: '/mcp',
          headers: { host: 'localhost' },
          method: 'POST',
          async *[Symbol.asyncIterator]() {
            yield '{}';
          },
        },
        response(),
      );
      await handler(
        {
          url: '/mcp',
          headers: { host: 'localhost', 'mcp-session-id': ['session-id', 'ignored'] },
          method: 'GET',
          async *[Symbol.asyncIterator]() {},
        },
        response(),
      );
      transports[0].sessionId = undefined;
      transports[0].onclose?.();
      await handler(
        {
          url: '/mcp',
          headers: { host: 'localhost' },
          method: 'POST',
          async *[Symbol.asyncIterator]() {
            yield await Promise.reject('stream failed');
          },
        },
        response(true),
      );

      expect(stderr).toHaveBeenCalledWith('stream failed\n');
      await mockedServer.close();
    } finally {
      stderr.mockRestore();
      vi.doUnmock('node:http');
      vi.doUnmock('@modelcontextprotocol/sdk/types.js');
      vi.doUnmock('@modelcontextprotocol/sdk/server/streamableHttp.js');
      vi.doUnmock('../src/server.js');
      vi.resetModules();
    }
  });

  it('rejects close when the underlying server was already closed', async () => {
    running = await startHttpServer({
      host: '127.0.0.1',
      port: 0,
      version: 'test',
      allowUnauthenticated: true,
    });
    await new Promise<void>((resolve, reject) =>
      running?.server.close((error) => (error ? reject(error) : resolve())),
    );

    await expect(running.close()).rejects.toMatchObject({ code: 'ERR_SERVER_NOT_RUNNING' });
    running = undefined;
  });
});
