import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { createToolError } from '../errors.js';
import { compositeTools } from '../schemas/index.js';
import {
  createErrorResult,
  createSuccessResult,
  READ_ONLY_LOCAL,
  toolOutputSchema,
} from '../tool-metadata.js';

const inputSchema = {
  query: z.enum(['tools', 'actions', 'examples']).describe('What to get help on'),
  tool: z.string().optional().describe('Specific tool name (for actions query)'),
};

export function registerHelpTool(server: McpServer): void {
  server.registerTool(
    'server.help',
    {
      description:
        'Discover available tools and operations. Use query: "tools" to list all tools, "actions" with a tool name to list operations, "examples" for usage examples.',
      inputSchema,
      outputSchema: toolOutputSchema,
      annotations: READ_ONLY_LOCAL,
    },
    async (input) => {
      const query = input.query as string;
      const toolName = input.tool as string | undefined;

      if (query === 'tools') {
        const tools = compositeTools.map((t) => ({
          name: t.name,
          description: t.description,
          actionCount: Object.keys(t.actions).length,
        }));

        const data = {
          tools,
          standalone: [
            { name: 'domains.availability.check', description: 'Check single domain availability' },
            {
              name: 'domains.ideas.generate',
              description: 'Generate available domain ideas from keywords',
            },
            { name: 'server.help', description: 'This help tool' },
          ],
        };
        return createSuccessResult(data, JSON.stringify({ success: true, ...data }, null, 2));
      }

      if (query === 'actions') {
        if (!toolName) {
          const error = createToolError('Missing tool parameter', {
            type: 'MISSING_PARAM',
            param: 'tool',
            tool: 'server.help',
          });
          return createErrorResult(error);
        }

        const tool = compositeTools.find((t) => t.name === toolName);
        if (!tool) {
          const error = createToolError(`Tool "${toolName}" not found`, {
            type: 'VALIDATION_ERROR',
            tool: 'server.help',
          });
          error.suggestions = [`Available tools: ${compositeTools.map((t) => t.name).join(', ')}`];
          return createErrorResult(error);
        }

        const actions = Object.entries(tool.actions).map(([name, def]) => ({
          name,
          description: def.description,
          command: def.command,
        }));

        const data = { tool: toolName, actions };
        return createSuccessResult(data, JSON.stringify({ success: true, ...data }, null, 2));
      }

      if (query === 'examples') {
        const data = {
          examples: [
            {
              description: 'List all domains',
              tool: 'domains.manage',
              input: { operation: 'list' },
            },
            {
              description: 'Check domain availability',
              tool: 'domains.availability.check',
              input: { domain: 'example.com', showPrice: true },
            },
            {
              description: 'Get domain DNS records',
              tool: 'dns.manage',
              input: { operation: 'get', domain: 'example.com' },
            },
          ],
        };
        return createSuccessResult(data, JSON.stringify({ success: true, ...data }, null, 2));
      }

      const error = createToolError('Invalid query', {
        type: 'VALIDATION_ERROR',
        tool: 'server.help',
      });
      error.suggestions = ['Use query: "tools", "actions", or "examples"'];
      return createErrorResult(error);
    },
  );
}
