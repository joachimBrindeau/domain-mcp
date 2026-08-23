import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it } from 'vitest';
import { registerAllPrompts } from '../src/prompts.js';

type RegisteredPrompt = {
  callback: (args: Record<string, string>) => Promise<{
    messages: Array<{ content: { type: string; text?: string } }>;
  }>;
};

function getRegisteredPrompts(server: McpServer): Record<string, RegisteredPrompt> {
  return (server as unknown as { _registeredPrompts: Record<string, RegisteredPrompt> })
    ._registeredPrompts;
}

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

  it('references only current public tool names in generated workflow instructions', async () => {
    registerAllPrompts(server);
    const prompts = getRegisteredPrompts(server);
    const dnsSetup = await prompts['dns-setup'].callback({ domain: 'example.com' });
    const brainstorm = await prompts['domain-brainstorm'].callback({
      description: 'A writing app',
    });
    const instructions = [...dnsSetup.messages, ...brainstorm.messages]
      .map((message) => message.content.text ?? '')
      .join('\n');

    expect(instructions).toContain('dns.manage');
    expect(instructions).toContain('domains.ideas.generate');
    expect(instructions).not.toMatch(/\bthe dns tool\b|\bgenerate_domain_ideas\b/);
  });
});
