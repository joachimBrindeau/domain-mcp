import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/client.js', () => ({
  getClient: vi.fn(() => ({
    execute: vi.fn(),
  })),
}));

vi.mock('../src/normalize.js', () => ({
  normalizeResponse: vi.fn(() => ({ success: true, normalized: true })),
}));

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getClient } from '../src/client.js';
import { normalizeResponse } from '../src/normalize.js';
import { registerAllTools } from '../src/register.js';

type RegisteredTool = {
  handler: (input: Record<string, unknown>) => Promise<Record<string, unknown>>;
};

function getRegisteredTools(server: McpServer): Record<string, RegisteredTool> {
  return (server as unknown as { _registeredTools: Record<string, RegisteredTool> })
    ._registeredTools;
}

describe('Tool Registration with Normalizer', () => {
  let server: McpServer;
  let mockClient: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    server = new McpServer({ name: 'test', version: '1.0.0' });
    mockClient = {
      execute: vi.fn().mockResolvedValue({
        Status: 'success',
        DomainInfoResponse: { DomainInfo: { Name: 'test.com' } },
      }),
    };
    vi.mocked(getClient).mockReturnValue(mockClient as unknown as ReturnType<typeof getClient>);
  });

  it('should call normalizeResponse for tool results', async () => {
    registerAllTools(server);
    const tools = getRegisteredTools(server);
    const domainTool = tools.domain;

    await domainTool.handler({ operation: 'list' });

    expect(normalizeResponse).toHaveBeenCalled();
  });

  it('should require operation-specific params before executing', async () => {
    registerAllTools(server);
    const tools = getRegisteredTools(server);
    const domainTool = tools.domain;

    const result = await domainTool.handler({ operation: 'register' });

    expect(result.isError).toBe(true);
    expect(mockClient.execute).not.toHaveBeenCalled();
  });

  it('should preserve api action parameter for operations that need it', async () => {
    registerAllTools(server);
    const tools = getRegisteredTools(server);
    const transferTool = tools.transfer;

    await transferTool.handler({
      operation: 'set_push_request',
      domain: 'example.com',
      action: 'decline',
    });

    expect(mockClient.execute).toHaveBeenCalledWith('set_domain_push_request', {
      domain: 'example.com',
      action: 'decline',
    });
  });
});
