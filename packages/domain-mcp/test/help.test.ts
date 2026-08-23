import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it } from 'vitest';
import { registerHelpTool } from '../src/tools/help.js';
import { getRegisteredToolHandler, type ToolResult } from './tool-test-helpers.js';

describe('Help Tool', () => {
  let handler: (input: Record<string, unknown>) => Promise<ToolResult>;

  beforeEach(() => {
    const server = new McpServer({ name: 'test', version: '1.0.0' });
    registerHelpTool(server);
    handler = getRegisteredToolHandler(server, 'server.help');
  });

  it('lists composite and standalone tools', async () => {
    const result = await handler({ query: 'tools' });
    const payload = JSON.parse(result.content[0]?.text ?? '{}') as {
      success: boolean;
      tools: Array<{ name: string; actionCount: number }>;
      standalone: Array<{ name: string }>;
    };

    expect(payload.success).toBe(true);
    expect(
      payload.tools.find((tool) => tool.name === 'domains.manage')?.actionCount,
    ).toBeGreaterThan(0);
    expect(payload.standalone.map((tool) => tool.name)).toEqual([
      'domains.availability.check',
      'domains.ideas.generate',
      'server.help',
    ]);
  });

  it('lists actions for a known tool', async () => {
    const result = await handler({ query: 'actions', tool: 'dns.manage' });
    const payload = JSON.parse(result.content[0]?.text ?? '{}') as {
      success: boolean;
      tool: string;
      actions: Array<{ name: string; command: string }>;
    };

    expect(payload).toMatchObject({ success: true, tool: 'dns.manage' });
    expect(payload.actions).toContainEqual(
      expect.objectContaining({ name: 'set', command: 'set_dns2' }),
    );
  });

  it('returns structured errors for missing and unknown tools', async () => {
    const missing = await handler({ query: 'actions' });
    expect(missing.isError).toBe(true);
    expect(JSON.parse(missing.content[0]?.text ?? '{}')).toMatchObject({
      success: false,
      error: { type: 'MISSING_PARAM' },
    });

    const unknown = await handler({ query: 'actions', tool: 'missing' });
    expect(unknown.isError).toBe(true);
    expect(JSON.parse(unknown.content[0]?.text ?? '{}')).toMatchObject({
      success: false,
      error: { type: 'VALIDATION_ERROR' },
    });
  });

  it('returns examples and rejects invalid queries defensively', async () => {
    const examples = await handler({ query: 'examples' });
    expect(JSON.parse(examples.content[0]?.text ?? '{}')).toMatchObject({
      success: true,
      examples: expect.arrayContaining([
        expect.objectContaining({ tool: 'domains.availability.check' }),
      ]),
    });

    const invalid = await handler({ query: 'invalid' });
    expect(invalid.isError).toBe(true);
    expect(JSON.parse(invalid.content[0]?.text ?? '{}')).toMatchObject({
      success: false,
      error: { type: 'VALIDATION_ERROR' },
    });
  });
});
