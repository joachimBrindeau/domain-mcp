import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

const inputSchema = {
  prompt: z.string().describe('Description of what the domains should convey (e.g., "task breakdown tool")'),
  count: z.number().optional().default(20).describe('Number of suggestions to generate'),
  tlds: z.array(z.string()).optional().default(['com']).describe('Preferred TLDs'),
  maxLength: z.number().optional().default(15).describe('Maximum domain length'),
};

const SYSTEM_PROMPT = `You are a creative domain name generator. Generate short, memorable domain names.

Rules:
- Keep names SHORT (under maxLength characters before TLD)
- Be CREATIVE - use wordplay, portmanteaus, invented words
- Make them MEMORABLE and easy to spell
- Avoid hyphens and numbers
- Return ONLY the domain names, one per line
- No explanations, just the domains`;

export function registerGenerateDomainsTools(server: McpServer): void {
  server.registerTool(
    'generate_domains',
    {
      description:
        'Generate creative domain name suggestions. Returns a list of domains for checking. Use parallel haiku agents to check availability afterward.',
      inputSchema,
    },
    async (input) => {
      const prompt = input.prompt as string;
      const count = (input.count as number) ?? 20;
      const tlds = (input.tlds as string[]) ?? ['com'];
      const maxLength = (input.maxLength as number) ?? 15;

      const agentPrompt = `${SYSTEM_PROMPT}

Generate ${count} creative domain names for: "${prompt}"
TLDs to use: ${tlds.join(', ')}
Max length before TLD: ${maxLength} characters

Output format: one domain per line (e.g., taskly.com)`;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                instruction:
                  'Launch parallel haiku agents to generate domains. Each agent should use this prompt:',
                agentPrompt,
                postProcess:
                  'Collect all suggestions, deduplicate, write to CSV with columns: domain,available',
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
