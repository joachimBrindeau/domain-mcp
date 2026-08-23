import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getClient } from '../client.js';
import { normalizeResponse } from '../normalize.js';
import { createSuccessResult, READ_ONLY_EXTERNAL, toolOutputSchema } from '../tool-metadata.js';

const inputSchema = {
  domain: z.string().describe('Domain to check (e.g., example.com)'),
  showPrice: z.boolean().optional().default(false).describe('Include pricing info'),
};

export function registerCheckDomainTool(server: McpServer): void {
  server.registerTool(
    'domains.availability.check',
    {
      description:
        'Check if a single domain is available for registration. Designed for parallel execution - launch multiple haiku agents to check many domains at once.',
      inputSchema,
      outputSchema: toolOutputSchema,
      annotations: READ_ONLY_EXTERNAL,
    },
    async (input) => {
      const domain = input.domain as string;
      const showPrice = (input.showPrice as boolean) ?? false;

      const client = getClient();

      const params: Record<string, string | number | boolean> = {
        domain0: domain,
      };

      if (showPrice) {
        params.show_price = 1;
      }

      const response = await client.execute('search', params);
      const normalized = normalizeResponse('search', response) as {
        success: boolean;
        results?: Array<{ domain: string; available: boolean; price?: string }>;
      };

      const result = normalized.results?.[0];

      const data = {
        domain,
        available: result?.available ?? false,
        ...(showPrice && result?.price ? { price: result.price } : {}),
      };
      return createSuccessResult(
        data,
        JSON.stringify({ success: normalized.success, ...data }, null, 2),
      );
    },
  );
}
