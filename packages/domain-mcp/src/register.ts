import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { type ApiParams, getClient } from './client.js';
import { createToolError } from './errors.js';
import { normalizeResponse } from './normalize.js';
import { compositeTools } from './schemas/index.js';
import {
  registerCheckDomainTool,
  registerGenerateIdeasTool,
  registerHelpTool,
} from './tools/index.js';

export function registerAllTools(server: McpServer): void {
  for (const tool of compositeTools) {
    // Build operation enum from keys
    const operationKeys = Object.keys(tool.actions) as [string, ...string[]];

    // Build combined input schema with operation + all possible params
    const operationDescriptions = operationKeys
      .map((k) => {
        const actionDef = tool.actions[k];
        return actionDef ? `${k}: ${actionDef.description}` : k;
      })
      .join(' | ');

    const inputSchema: Record<string, z.ZodTypeAny> = {
      operation: z.enum(operationKeys).describe(`Operation to perform: ${operationDescriptions}`),
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
        const operation = input.operation as string;
        const actionDef = tool.actions[operation];

        if (!actionDef) {
          const error = createToolError(`Unknown operation: ${operation}`, {
            type: 'UNKNOWN_ACTION',
            action: operation,
            validActions: operationKeys,
            tool: tool.name,
          });
          return {
            content: [{ type: 'text', text: error.toJSON() }],
            isError: true,
          };
        }

        const parsedInput = actionDef.params
          ? actionDef.params.safeParse(input)
          : ({ success: true, data: {} } as const);

        if (!parsedInput.success) {
          const details = parsedInput.error.issues
            .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
            .join('; ');

          const error = createToolError('Invalid tool input', {
            type: 'VALIDATION_ERROR',
            tool: tool.name,
            message: details,
          });
          return {
            content: [{ type: 'text', text: error.toJSON() }],
            isError: true,
          };
        }

        try {
          const client = getClient();
          const params = actionDef.transform
            ? actionDef.transform(operation, parsedInput.data as Record<string, unknown>)
            : (parsedInput.data as Record<string, unknown> as ApiParams);

          const result = await client.execute(actionDef.command, params);
          const normalized = normalizeResponse(actionDef.command, result);
          return {
            content: [{ type: 'text', text: JSON.stringify(normalized, null, 2) }],
          };
        } catch (error) {
          const toolError = createToolError('Tool execution failed', {
            type: 'API_ERROR',
            tool: tool.name,
            message: error instanceof Error ? error.message : String(error),
          });
          return {
            content: [{ type: 'text', text: toolError.toJSON() }],
            isError: true,
          };
        }
      },
    );
  }

  // Register standalone tools
  registerCheckDomainTool(server);
  registerGenerateIdeasTool(server);
  registerHelpTool(server);
}
