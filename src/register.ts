import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getClient, type ApiParams } from './client.js';
import { compositeTools } from './schemas/index.js';
import { registerGenerateDomainsTools, registerCheckDomainTool } from './tools/index.js';

export function registerAllTools(server: McpServer): void {
  for (const tool of compositeTools) {
    // Build action enum from keys
    const actionKeys = Object.keys(tool.actions) as [string, ...string[]];

    // Build combined input schema with action + all possible params
    const actionDescriptions = actionKeys
      .map((k) => {
        const actionDef = tool.actions[k];
        return actionDef ? `${k}: ${actionDef.description}` : k;
      })
      .join(' | ');

    const inputSchema: Record<string, z.ZodTypeAny> = {
      action: z.enum(actionKeys).describe(`Action to perform: ${actionDescriptions}`),
    };

    // Collect all unique params across actions
    for (const action of Object.values(tool.actions)) {
      if (action?.params) {
        const shape = action.params.shape;
        for (const [key, schema] of Object.entries(shape)) {
          if (!inputSchema[key]) {
            // Make optional since not all actions need all params
            inputSchema[key] = (schema as z.ZodTypeAny).optional();
          }
        }
      }
    }

    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema,
      },
      async (input) => {
        const action = input.action as string;
        const actionDef = tool.actions[action];

        if (!actionDef) {
          throw new Error(`Unknown action: ${action}. Valid actions: ${actionKeys.join(', ')}`);
        }

        const client = getClient();
        const params = actionDef.transform
          ? actionDef.transform(action, input as Record<string, unknown>)
          : (input as ApiParams);

        // Remove 'action' from params sent to API
        delete params.action;

        const result = await client.execute(actionDef.command, params);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }
    );
  }

  // Register standalone tools
  registerGenerateDomainsTools(server);
  registerCheckDomainTool(server);
}
