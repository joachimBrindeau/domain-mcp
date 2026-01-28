import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { createToolError } from '../errors.js';
import { compositeTools } from '../schemas/index.js';

const inputSchema = {
  query: z.enum(['tools', 'actions', 'examples']).describe('What to get help on'),
  tool: z.string().optional().describe('Specific tool name (for actions query)'),
};

export function registerHelpTool(server: McpServer): void {
  server.registerTool(
    'dynadot_help',
    {
      description:
        'Discover available tools and actions. Use query: "tools" to list all tools, "actions" with a tool name to list actions, "examples" for usage examples.',
      inputSchema,
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

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  tools,
                  standalone: [
                    { name: 'check_domain', description: 'Check single domain availability' },
                    { name: 'dynadot_help', description: 'This help tool' },
                  ],
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      if (query === 'actions') {
        if (!toolName) {
          const error = createToolError('Missing tool parameter', {
            type: 'MISSING_PARAM',
            param: 'tool',
            tool: 'dynadot_help',
          });
          return {
            content: [{ type: 'text', text: error.toJSON() }],
            isError: true,
          };
        }

        const tool = compositeTools.find((t) => t.name === toolName);
        if (!tool) {
          const error = createToolError(`Tool "${toolName}" not found`, {
            type: 'VALIDATION_ERROR',
            tool: 'dynadot_help',
          });
          error.suggestions = [`Available tools: ${compositeTools.map((t) => t.name).join(', ')}`];
          return {
            content: [{ type: 'text', text: error.toJSON() }],
            isError: true,
          };
        }

        const actions = Object.entries(tool.actions).map(([name, def]) => ({
          name,
          description: def.description,
          command: def.command,
        }));

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, tool: toolName, actions }, null, 2),
            },
          ],
        };
      }

      if (query === 'examples') {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  examples: [
                    {
                      description: 'List all domains',
                      tool: 'dynadot_domain',
                      input: { action: 'list' },
                    },
                    {
                      description: 'Check domain availability',
                      tool: 'check_domain',
                      input: { domain: 'example.com', showPrice: true },
                    },
                    {
                      description: 'Get domain DNS records',
                      tool: 'dynadot_dns',
                      input: { action: 'get', domain: 'example.com' },
                    },
                  ],
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      const error = createToolError('Invalid query', {
        type: 'VALIDATION_ERROR',
        tool: 'dynadot_help',
      });
      error.suggestions = ['Use query: "tools", "actions", or "examples"'];
      return {
        content: [{ type: 'text', text: error.toJSON() }],
        isError: true,
      };
    },
  );
}
