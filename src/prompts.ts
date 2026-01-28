import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function registerAllPrompts(server: McpServer): void {
  // Domain audit workflow prompt
  server.prompt(
    'domain-audit',
    'Audit all domains for expiration, DNS, and security settings',
    async () => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please audit my domain portfolio:

1. First, read the domains://list resource to get all my domains
2. For each domain, check:
   - Expiration date (flag if < 30 days)
   - Lock status (flag if unlocked)
   - Auto-renewal setting
   - DNS configuration
3. Create a summary table with status indicators
4. Recommend actions for any issues found`,
          },
        },
      ],
    }),
  );

  // DNS setup workflow prompt
  server.prompt(
    'dns-setup',
    'Interactive DNS configuration for a domain',
    { domain: z.string().describe('Domain to configure DNS for') },
    async (args) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Help me configure DNS for ${args.domain}:

1. First, get current DNS records using dynadot_dns with action: get
2. Ask me what I want to set up:
   - Website hosting (A/AAAA records)
   - Email (MX records)
   - Domain verification (TXT records)
   - Subdomain (CNAME records)
3. Guide me through the configuration
4. Apply changes using dynadot_dns with action: set
5. Verify the changes were applied`,
          },
        },
      ],
    }),
  );

  // Domain brainstorming workflow prompt
  server.prompt(
    'domain-brainstorm',
    'Find available domains for a product or tool',
    { description: z.string().describe('Product or tool description to brainstorm domains for') },
    async (args) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Find available domains for: ${args.description}

1. Extract 5-8 keywords from the description (core words, action verbs, abbreviations)
2. Call generate_domain_ideas with those keywords
3. The tool automatically checks availability and returns only available domains with prices
4. Present the best options grouped by brandability`,
          },
        },
      ],
    }),
  );

  // Bulk renewal prompt
  server.prompt('bulk-renewal', 'Review and manage domain renewals', async () => ({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Help me manage domain renewals:

1. Read the domains://list resource
2. Group domains by expiration:
   - Expiring in 30 days (urgent)
   - Expiring in 90 days (soon)
   - Expiring in 1 year (upcoming)
3. Read account://info for current balance
4. Calculate total renewal cost for urgent domains
5. Present options:
   - Enable auto-renewal for specific domains
   - Manually renew now
   - Let domains expire`,
        },
      },
    ],
  }));
}
