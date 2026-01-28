import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it } from 'vitest';
import { registerHelpTool } from '../src/tools/help.js';

describe('Help Tool', () => {
  let server: McpServer;

  beforeEach(() => {
    server = new McpServer({ name: 'test', version: '1.0.0' });
  });

  it('should register without error', () => {
    expect(() => registerHelpTool(server)).not.toThrow();
  });
});
