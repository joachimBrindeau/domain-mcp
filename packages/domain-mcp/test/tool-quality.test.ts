import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it } from 'vitest';
import { registerAllTools } from '../src/register.js';

type RegisteredTool = {
  inputSchema?: unknown;
  outputSchema?: unknown;
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
  handler: (input: Record<string, unknown>) => Promise<{
    isError?: boolean;
    structuredContent?: Record<string, unknown>;
  }>;
};

function getRegisteredTools(server: McpServer): Record<string, RegisteredTool> {
  return (server as unknown as { _registeredTools: Record<string, RegisteredTool> })
    ._registeredTools;
}

describe('MCP tool quality metadata', () => {
  let tools: Record<string, RegisteredTool>;

  beforeEach(() => {
    const server = new McpServer({ name: 'quality-test', version: '1.0.0' });
    registerAllTools(server);
    tools = getRegisteredTools(server);
  });

  it('declares specific output schemas and all annotation hints for every tool', () => {
    expect(Object.keys(tools)).toHaveLength(13);

    for (const [name, tool] of Object.entries(tools)) {
      expect(tool.outputSchema, `${name} output schema`).toBeDefined();
      expect(tool.annotations, `${name} annotations`).toMatchObject({
        readOnlyHint: expect.any(Boolean),
        destructiveHint: expect.any(Boolean),
        idempotentHint: expect.any(Boolean),
        openWorldHint: expect.any(Boolean),
      });
    }
  });

  it('describes every exposed input parameter', async () => {
    const server = new McpServer({ name: 'quality-client', version: '1.0.0' });
    registerAllTools(server);
    const registered = getRegisteredTools(server);

    for (const [name, tool] of Object.entries(registered)) {
      const schema = tool.inputSchema as {
        def?: { shape?: Record<string, { description?: string }> };
      };
      const shape = schema.def?.shape ?? {};
      const missing = Object.entries(shape)
        .filter(([, parameter]) => !parameter.description)
        .map(([parameter]) => parameter);
      expect(missing, `${name} parameter descriptions`).toEqual([]);
    }
  });

  it('returns structured content matching declared schemas for success and validation errors', async () => {
    const domainTool = tools.domain;
    const invalidResult = await domainTool.handler({ operation: 'register' });

    expect(invalidResult.isError).toBe(true);
    expect(invalidResult.structuredContent).toMatchObject({
      success: false,
      error: expect.any(Object),
    });
  });
});
