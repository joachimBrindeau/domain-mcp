import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { afterEach, describe, expect, it } from 'vitest';
import { type RunningHttpServer, startHttpServer } from '../src/http-server.js';

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
});
