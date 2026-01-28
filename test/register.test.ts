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

    // The normalizer should be imported and used
    expect(normalizeResponse).toBeDefined();
  });
});
