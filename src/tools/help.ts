import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
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
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: false,
                    error: 'Please specify a tool name with the "tool" parameter',
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        const tool = compositeTools.find((t) => t.name === toolName);
        if (!tool) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: false,
                    error: `Tool "${toolName}" not found`,
                    availableTools: compositeTools.map((t) => t.name),
                  },
                  null,
                  2,
                ),
              },
            ],
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

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: 'Invalid query. Use: tools, actions, or examples',
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );
}
