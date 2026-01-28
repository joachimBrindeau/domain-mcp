import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getClient } from '../client.js';
import { normalizeResponse } from '../normalize.js';

const inputSchema = {
  domain: z.string().describe('Domain to check (e.g., example.com)'),
  showPrice: z.boolean().optional().default(false).describe('Include pricing info'),
};

export function registerCheckDomainTool(server: McpServer): void {
  server.registerTool(
    'check_domain',
    {
      description:
        'Check if a single domain is available for registration. Designed for parallel execution - launch multiple haiku agents to check many domains at once.',
      inputSchema,
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

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: normalized.success,
                domain,
                available: result?.available ?? false,
                ...(showPrice && result?.price ? { price: result.price } : {}),
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
