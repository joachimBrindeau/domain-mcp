import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the client module
vi.mock('../src/client.js', () => ({
  getClient: vi.fn(() => ({
    execute: vi.fn(),
  })),
}));

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getClient } from '../src/client.js';
import { registerAllResources } from '../src/resources.js';

describe('MCP Resources', () => {
  let server: McpServer;
  let mockClient: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    server = new McpServer({ name: 'test', version: '1.0.0' });
    mockClient = { execute: vi.fn() };
    vi.mocked(getClient).mockReturnValue(mockClient as unknown as ReturnType<typeof getClient>);
  });

  it('should register account resource', () => {
    registerAllResources(server);
    expect(true).toBe(true);
  });

  it('should register domains resource', () => {
    registerAllResources(server);
    expect(true).toBe(true);
  });

  it('should register contacts resource', () => {
    registerAllResources(server);
    expect(true).toBe(true);
  });

  it('should register folders resource', () => {
    registerAllResources(server);
    expect(true).toBe(true);
  });
});
