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
        'Check if a single domain is available for registration. Fails closed when Dynadot returns an API error or no conclusive availability result. The shared client serializes registrar requests.',
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
        error?: string;
        results?: Array<{ domain: string; available: boolean; price?: string }>;
      };

      if (!normalized.success) {
        throw new Error(normalized.error ?? `Dynadot search failed for ${domain}`);
      }
      const result = normalized.results?.[0];
      if (!result) {
        throw new Error(`Dynadot search returned no availability result for ${domain}`);
      }
      if (result.domain.toLowerCase() !== domain.toLowerCase()) {
        throw new Error(`Dynadot returned ${result.domain} instead of ${domain}`);
      }

      const data = {
        domain,
        available: result.available,
        ...(showPrice && result.price ? { price: result.price } : {}),
      };
      return createSuccessResult(
        data,
        JSON.stringify({ success: normalized.success, ...data }, null, 2),
      );
    },
  );
}
