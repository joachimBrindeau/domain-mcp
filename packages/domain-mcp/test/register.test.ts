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
import { z } from 'zod';
import { getClient } from '../src/client.js';
import { normalizeResponse } from '../src/normalize.js';
import { registerAllTools } from '../src/register.js';
import { domainTool } from '../src/schemas/domain.js';

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
    const domainTool = tools['domains.manage'];

    await domainTool.handler({ operation: 'list' });

    expect(normalizeResponse).toHaveBeenCalled();
  });

  it('passes validated inputs directly when an action has no transform', async () => {
    registerAllTools(server);

    await getRegisteredTools(server)['domains.manage'].handler({
      operation: 'info',
      domain: 'example.com',
    });

    expect(mockClient.execute).toHaveBeenCalledWith('domain_info', { domain: 'example.com' });
  });

  it('applies an action transform before executing the API command', async () => {
    registerAllTools(server);

    await getRegisteredTools(server)['domains.manage'].handler({
      operation: 'search',
      domain: 'example.com',
      showPrice: true,
    });

    expect(mockClient.execute).toHaveBeenCalledWith('search', {
      domain0: 'example.com',
      show_price: '1',
      currency: 'USD',
    });
  });

  it('should require operation-specific params before executing', async () => {
    registerAllTools(server);
    const tools = getRegisteredTools(server);
    const domainTool = tools['domains.manage'];

    const result = await domainTool.handler({ operation: 'register' });

    expect(result.isError).toBe(true);
    expect(mockClient.execute).not.toHaveBeenCalled();
  });

  it('should preserve api action parameter for operations that need it', async () => {
    registerAllTools(server);
    const tools = getRegisteredTools(server);
    const transferTool = tools['transfers.manage'];

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

  it('returns a structured error when a registered operation is no longer available', async () => {
    const missingOperation = '__missing_test_operation__';
    const actions = domainTool.actions as Record<
      string,
      (typeof domainTool.actions)[string] | undefined
    >;
    actions[missingOperation] = undefined;
    registerAllTools(server);
    const domainToolRegistration = getRegisteredTools(server)['domains.manage'];

    try {
      const result = await domainToolRegistration.handler({ operation: missingOperation });

      expect(result.isError).toBe(true);
      expect(
        JSON.parse((result.content as Array<{ text: string }>)[0]?.text ?? '{}'),
      ).toMatchObject({
        error: {
          type: 'UNKNOWN_ACTION',
          message: `Unknown operation: ${missingOperation}`,
          validActions: expect.arrayContaining([missingOperation, 'info']),
        },
      });
      expect(mockClient.execute).not.toHaveBeenCalled();
    } finally {
      delete actions[missingOperation];
    }
  });

  it('reports root-level validation failures without calling the API', async () => {
    const originalParams = domainTool.actions.info?.params;
    if (!domainTool.actions.info) throw new Error('Missing domain.info action');
    domainTool.actions.info.params = z.object({}).refine(() => false, 'input is rejected');

    try {
      registerAllTools(server);
      const result = await getRegisteredTools(server)['domains.manage'].handler({
        operation: 'info',
      });

      expect(result.isError).toBe(true);
      expect((result.content as Array<{ text: string }>)[0]?.text).toContain(
        '(root): input is rejected',
      );
      expect(mockClient.execute).not.toHaveBeenCalled();
    } finally {
      domainTool.actions.info.params = originalParams;
    }
  });

  it.each([
    [new Error('service unavailable'), 'service unavailable'],
    ['connection closed', 'connection closed'],
  ])('returns API failures from thrown values %#', async (failure, message) => {
    mockClient.execute.mockRejectedValueOnce(failure);
    registerAllTools(server);

    const result = await getRegisteredTools(server)['domains.manage'].handler({
      operation: 'list',
    });

    expect(result.isError).toBe(true);
    expect(JSON.parse((result.content as Array<{ text: string }>)[0]?.text ?? '{}')).toMatchObject({
      error: {
        type: 'API_ERROR',
        message,
      },
    });
  });
});
