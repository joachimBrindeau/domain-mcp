import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it } from 'vitest';
import { registerAllPrompts } from '../src/prompts.js';
import { getRegisteredPromptCallback } from './tool-test-helpers.js';

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
    registerAllPrompts(server);
  });

  it('renders the domain audit workflow', async () => {
    const result = await getRegisteredPromptCallback(server, 'domain-audit')();
    expect(result.messages[0]?.content.text).toContain('domains://list');
    expect(result.messages[0]?.content.text).toContain('Expiration date');
  });

  it('renders DNS setup with the requested domain', async () => {
    const result = await getRegisteredPromptCallback(
      server,
      'dns-setup',
    )({
      domain: 'example.com',
    });
    expect(result.messages[0]?.content.text).toContain('example.com');
    expect(result.messages[0]?.content.text).toContain('operation: "set"');
  });

  it('renders domain brainstorming with the product description', async () => {
    const result = await getRegisteredPromptCallback(
      server,
      'domain-brainstorm',
    )({
      description: 'an automated task manager',
    });
    expect(result.messages[0]?.content.text).toContain('an automated task manager');
    expect(result.messages[0]?.content.text).toContain('domains.ideas.generate');
  });

  it('renders the bulk renewal workflow', async () => {
    const result = await getRegisteredPromptCallback(server, 'bulk-renewal')();
    expect(result.messages[0]?.content.text).toContain('account://info');
    expect(result.messages[0]?.content.text).toContain('Enable auto-renewal');
  });

  it('references only current public tool names in generated workflow instructions', async () => {
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
