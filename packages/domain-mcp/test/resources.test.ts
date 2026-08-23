import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/client.js', () => ({
  getClient: vi.fn(),
}));

vi.mock('../src/normalize.js', () => ({
  normalizeResponse: vi.fn((command: string, result: unknown) => ({ command, result })),
}));

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getClient } from '../src/client.js';
import { normalizeResponse } from '../src/normalize.js';
import { registerAllResources } from '../src/resources.js';
import { getRegisteredResourceCallback } from './tool-test-helpers.js';

describe('MCP Resources', () => {
  let server: McpServer;
  let execute: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    server = new McpServer({ name: 'test', version: '1.0.0' });
    execute = vi.fn(async (command: string) => ({ Status: 'success', command }));
    vi.mocked(getClient).mockReturnValue({ execute } as unknown as ReturnType<typeof getClient>);
    registerAllResources(server);
  });

  it.each([
    ['account://info', 'account_info'],
    ['domains://list', 'list_domain'],
    ['contacts://list', 'contact_list'],
    ['folders://list', 'folder_list'],
  ])('reads %s through %s and normalizes its response', async (uri, command) => {
    const result = await getRegisteredResourceCallback(server, uri)();

    expect(execute).toHaveBeenCalledWith(command);
    expect(normalizeResponse).toHaveBeenCalledWith(command, { Status: 'success', command });
    expect(result.contents).toHaveLength(1);
    expect(result.contents[0]).toMatchObject({ uri, mimeType: 'application/json' });
    expect(JSON.parse(result.contents[0]?.text ?? '{}')).toEqual({
      command,
      result: { Status: 'success', command },
    });
  });
});
