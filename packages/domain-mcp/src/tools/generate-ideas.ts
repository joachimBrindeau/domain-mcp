import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getClient } from '../client.js';
import { normalizeResponse } from '../normalize.js';

const PATTERNS = ['exact', 'hyphenated', 'prefix', 'suffix'] as const;
const DEFAULT_TLDS = ['com', 'io', 'co', 'app', 'dev', 'ai'];
const PREFIXES = ['get', 'try', 'use', 'go', 'my', 'the', 'hey', 'meet'];
const SUFFIXES = ['app', 'hq', 'io', 'ai', 'hub', 'lab', 'dev', 'now'];
// Dynadot's `search` command accepts exactly one domain per call — any n>1 returns
// "too many domains entered, please search one domain per command". It is also
// effectively serial: parallel calls (even concurrency=2) intermittently return
// `{ResponseCode: 0}` with no `SearchResults`, silently dropping candidates. So we
// walk the list one at a time and retry empty responses once.

type Pattern = (typeof PATTERNS)[number];

interface AvailableDomain {
  domain: string;
  price?: string;
}

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j] as T, shuffled[i] as T];
  }
  return shuffled;
}

function generateExact(keywords: string[], tlds: string[]): string[] {
  const results: string[] = [];
  for (const keyword of keywords) {
    const clean = keyword.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean.length >= 2) {
      for (const tld of tlds) {
        results.push(`${clean}.${tld}`);
      }
    }
  }
  return results;
}

function generateHyphenated(keywords: string[], tlds: string[]): string[] {
  const results: string[] = [];
  const cleaned = keywords
    .map((k) => k.toLowerCase().replace(/[^a-z0-9]/g, ''))
    .filter((k) => k.length >= 2);

  for (const first of cleaned) {
    for (const second of cleaned) {
      if (first !== second) {
        for (const tld of tlds) {
          results.push(`${first}-${second}.${tld}`);
        }
      }
    }
  }
  return results;
}

function generatePrefix(keywords: string[], tlds: string[]): string[] {
  const results: string[] = [];
  for (const keyword of keywords) {
    const clean = keyword.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean.length >= 2) {
      for (const prefix of PREFIXES) {
        const domain = `${prefix}-${clean}`;
        if (domain.length <= 20) {
          for (const tld of tlds) {
            results.push(`${domain}.${tld}`);
          }
        }
      }
    }
  }
  return results;
}

function generateSuffix(keywords: string[], tlds: string[]): string[] {
  const results: string[] = [];
  for (const keyword of keywords) {
    const clean = keyword.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (clean.length >= 2) {
      for (const suffix of SUFFIXES) {
        const domain = `${clean}-${suffix}`;
        if (domain.length <= 20) {
          for (const tld of tlds) {
            results.push(`${domain}.${tld}`);
          }
        }
      }
    }
  }
  return results;
}

const generators: Record<Pattern, (keywords: string[], tlds: string[]) => string[]> = {
  exact: generateExact,
  hyphenated: generateHyphenated,
  prefix: generatePrefix,
  suffix: generateSuffix,
};

async function searchOnce(
  domain: string,
): Promise<{ domain: string; available: boolean; price?: string } | 'empty' | null> {
  const client = getClient();
  try {
    const response = await client.execute('search', { domain0: domain, show_price: 1 });
    const normalized = normalizeResponse('search', response) as {
      success: boolean;
      results?: Array<{ domain: string; available: boolean; price?: string }>;
    };
    if (!normalized.success) return null;
    const result = normalized.results?.[0];
    return result ?? 'empty';
  } catch {
    return null;
  }
}

async function checkOne(domain: string): Promise<AvailableDomain | null> {
  let result = await searchOnce(domain);
  if (result === 'empty') result = await searchOnce(domain);
  if (!result || result === 'empty' || !result.available) return null;
  return { domain: result.domain, price: result.price };
}

async function checkAvailability(domains: string[]): Promise<AvailableDomain[]> {
  const available: AvailableDomain[] = [];
  for (const domain of domains) {
    const result = await checkOne(domain);
    if (result) available.push(result);
  }
  return available;
}

const inputSchema = {
  keywords: z
    .array(z.string())
    .min(1)
    .max(10)
    .describe(
      'Core keywords extracted from product/tool description (e.g., ["task", "flow", "automate"])',
    ),
  tlds: z
    .array(z.string())
    .optional()
    .describe('TLDs to check (default: com, io, co, app, dev, ai)'),
  patterns: z
    .array(z.enum(PATTERNS))
    .optional()
    .describe('Generation patterns: exact, hyphenated, prefix, suffix (default: all)'),
  maxToCheck: z
    .number()
    .min(10)
    .max(500)
    .optional()
    .describe('Maximum domains to check for availability (default: 100)'),
};

export function registerGenerateIdeasTool(server: McpServer): void {
  server.registerTool(
    'generate_domain_ideas',
    {
      description:
        'Generate domain name ideas from keywords and automatically check availability. Returns ONLY available domains with prices. Dynadot`s search command is single-domain and effectively serial, so each candidate takes one round-trip; plan on roughly one second per 3 domains.',
      inputSchema,
    },
    async (input) => {
      const keywords = input.keywords as string[];
      const tlds = (input.tlds as string[]) ?? DEFAULT_TLDS;
      const patterns = (input.patterns as Pattern[]) ?? [...PATTERNS];
      const maxToCheck = (input.maxToCheck as number) ?? 100;

      // Generate exact matches first (always checked), then other patterns
      const exactDomains = patterns.includes('exact')
        ? [...new Set(generateExact(keywords, tlds))]
        : [];
      const otherDomains = new Set<string>();
      for (const pattern of patterns) {
        if (pattern === 'exact') continue;
        const generator = generators[pattern];
        if (generator) {
          for (const domain of generator(keywords, tlds)) {
            otherDomains.add(domain);
          }
        }
      }

      // Exact matches always included, fill remaining capacity with shuffled others
      const shuffledOthers = shuffle([...otherDomains]);
      const limitedExactDomains = exactDomains.slice(0, maxToCheck);
      const remainingSlots = Math.max(0, maxToCheck - limitedExactDomains.length);
      const toCheck = [...limitedExactDomains, ...shuffledOthers.slice(0, remainingSlots)];

      const available = await checkAvailability(toCheck);

      // Sort by price (cheapest first)
      available.sort((a, b) => {
        const priceA = Number.parseFloat(a.price?.replace(/[^0-9.]/g, '') ?? '999');
        const priceB = Number.parseFloat(b.price?.replace(/[^0-9.]/g, '') ?? '999');
        return priceA - priceB;
      });

      // Format output
      const lines = available.map((d) => `${d.domain} ${d.price ?? ''}`);

      return {
        content: [
          {
            type: 'text',
            text:
              available.length > 0
                ? `Found ${available.length} available domains (checked ${toCheck.length}):\n\n${lines.join('\n')}`
                : `No available domains found (checked ${toCheck.length} domains)`,
          },
        ],
      };
    },
  );
}
