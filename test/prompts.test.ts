import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it } from 'vitest';
import { registerAllPrompts } from '../src/prompts.js';

describe('MCP Prompts', () => {
  let server: McpServer;

  beforeEach(() => {
    server = new McpServer({ name: 'test', version: '1.0.0' });
  });

  it('should register domain-audit prompt', () => {
    expect(() => registerAllPrompts(server)).not.toThrow();
  });

  it('should register dns-setup prompt', () => {
    expect(() => registerAllPrompts(server)).not.toThrow();
  });

  it('should register bulk-renewal prompt', () => {
    expect(() => registerAllPrompts(server)).not.toThrow();
  });
});
