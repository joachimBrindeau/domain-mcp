import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import fastCartesian from 'fast-cartesian';
import { z } from 'zod';
import { getClient } from '../client.js';
import { normalizeResponse } from '../normalize.js';
import { createSuccessResult, READ_ONLY_EXTERNAL, toolOutputSchema } from '../tool-metadata.js';

const PATTERNS = ['exact', 'hyphenated', 'prefix', 'suffix'] as const;
const DEFAULT_TLDS = ['com', 'io', 'co', 'app', 'dev', 'ai'];
const PREFIXES = ['get', 'try', 'use', 'go', 'my', 'the', 'hey', 'meet'];
const SUFFIXES = ['app', 'hq', 'io', 'ai', 'hub', 'lab', 'dev', 'now'];
// Dynadot's `search` command accepts exactly one domain per call. DomainClient owns
// process-wide request serialization, so every MCP tool shares the same constraint.

type Pattern = (typeof PATTERNS)[number];

interface KeywordVariation {
  keyword: string;
  searchVolume?: number;
}

interface BrandMultiplex {
  dimensions: string[][];
  separator?: '' | '-';
  minLength?: number;
  maxLength?: number;
}

interface AvailableDomain {
  domain: string;
  price?: string;
}

function words(keyword: string): string[] {
  return keyword.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

function phraseLabels(keyword: string): { compact: string; hyphenated?: string } | null {
  const parts = words(keyword);
  const compact = parts.join('');
  if (compact.length < 2) return null;
  return {
    compact,
    hyphenated: parts.length > 1 ? parts.join('-') : undefined,
  };
}

function generatePhraseDomains(
  keywords: string[],
  tlds: string[],
  includeCompact: boolean,
  includeHyphenated: boolean,
): string[] {
  const results: string[] = [];
  for (const keyword of keywords) {
    const labels = phraseLabels(keyword);
    if (!labels) continue;
    for (const tld of tlds) {
      if (includeCompact) results.push(`${labels.compact}.${tld}`);
      if (includeHyphenated && labels.hyphenated) {
        results.push(`${labels.hyphenated}.${tld}`);
      }
    }
  }
  return results;
}

function generateExact(keywords: string[], tlds: string[]): string[] {
  return generatePhraseDomains(keywords, tlds, true, false);
}

function generateHyphenated(keywords: string[], tlds: string[]): string[] {
  return generatePhraseDomains(keywords, tlds, false, true);
}

function generatePrefix(keywords: string[], tlds: string[]): string[] {
  const results: string[] = [];
  for (const keyword of keywords) {
    const clean = words(keyword).join('');
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
    const clean = words(keyword).join('');
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

function selectKeywords(
  keywords: string[],
  keywordVariations: KeywordVariation[],
  llmVariations: string[],
  brandMultiplex?: BrandMultiplex,
): { source: 'multiplex' | 'dataforseo' | 'llm' | 'keywords'; keywords: string[] } {
  if (brandMultiplex) {
    const minLength = brandMultiplex.minLength ?? 4;
    const maxLength = brandMultiplex.maxLength ?? 12;
    const separator = brandMultiplex.separator ?? '';
    const multiplexed = fastCartesian(brandMultiplex.dimensions)
      .map((parts) => parts.flatMap(words).join(separator))
      .filter((name) => name.length >= minLength && name.length <= maxLength);
    return { source: 'multiplex', keywords: [...new Set(multiplexed)] };
  }
  if (keywordVariations.length > 0) {
    const ranked = [...keywordVariations].sort(
      (a, b) => (b.searchVolume ?? 0) - (a.searchVolume ?? 0) || a.keyword.localeCompare(b.keyword),
    );
    return { source: 'dataforseo', keywords: ranked.map(({ keyword }) => keyword) };
  }
  if (llmVariations.length > 0) return { source: 'llm', keywords: llmVariations };
  return { source: 'keywords', keywords };
}

function generateCandidates(keywords: string[], tlds: string[], patterns: Pattern[]): string[] {
  const candidates: string[] = [];
  const phrasePatterns = patterns.filter(
    (pattern) => pattern === 'exact' || pattern === 'hyphenated',
  );
  if (phrasePatterns.length > 0) {
    candidates.push(
      ...generatePhraseDomains(
        keywords,
        tlds,
        phrasePatterns.includes('exact'),
        phrasePatterns.includes('hyphenated'),
      ),
    );
  }
  for (const pattern of patterns) {
    if (pattern === 'exact' || pattern === 'hyphenated') continue;
    const generator = generators[pattern];
    if (generator) candidates.push(...generator(keywords, tlds));
  }
  return [...new Set(candidates)];
}

async function searchOnce(
  domain: string,
): Promise<{ domain: string; available: boolean; price?: string } | 'empty'> {
  const client = getClient();
  try {
    const response = await client.execute('search', { domain0: domain, show_price: 1 });
    const normalized = normalizeResponse('search', response) as {
      success: boolean;
      results?: Array<{ domain: string; available: boolean; price?: string }>;
    };
    if (!normalized.success) {
      throw new Error('Dynadot search returned an unsuccessful response');
    }
    const result = normalized.results?.[0];
    if (!result) return 'empty';
    if (result.domain.toLowerCase() !== domain.toLowerCase()) {
      throw new Error(`Dynadot returned ${result.domain} instead of ${domain}`);
    }
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Domain availability check failed for ${domain}: ${message}`);
  }
}

async function checkOne(domain: string): Promise<AvailableDomain | null> {
  const result = await searchOnce(domain);
  if (result === 'empty') {
    throw new Error(`Domain availability check failed for ${domain}: empty Dynadot response`);
  }
  if (!result.available) return null;
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
  keywordVariations: z
    .array(
      z.object({
        keyword: z.string(),
        searchVolume: z.number().nonnegative().optional(),
      }),
    )
    .max(50)
    .optional()
    .describe(
      'Current keyword variations from DataForSEO. When non-empty, these are ranked deterministically by search volume and used instead of LLM variations.',
    ),
  llmVariations: z
    .array(z.string())
    .max(50)
    .optional()
    .describe(
      'Fallback complete-name variations generated by the host LLM. Used only when keywordVariations and brandMultiplex are absent.',
    ),
  brandMultiplex: z
    .object({
      dimensions: z
        .array(z.array(z.string()).min(1).max(50))
        .min(2)
        .max(6)
        .describe('Ordered phoneme or morpheme dimensions combined by Cartesian product.'),
      separator: z.enum(['', '-']).optional(),
      minLength: z.number().int().min(2).max(63).optional(),
      maxLength: z.number().int().min(2).max(63).optional(),
    })
    .optional()
    .describe(
      'Deterministic brand generator. Multiplexes ordered dimensions, normalizes labels, filters by length, and deduplicates before TLD expansion.',
    ),
  tlds: z
    .array(z.string())
    .optional()
    .describe('TLDs to check (default: com, io, co, app, dev, ai)'),
  patterns: z
    .array(z.enum(PATTERNS))
    .optional()
    .describe(
      'Generation patterns: exact removes spaces, hyphenated preserves word boundaries, prefix and suffix add deterministic modifiers (default: all)',
    ),
  maxToCheck: z
    .number()
    .min(10)
    .max(500)
    .optional()
    .describe('Maximum domains to check for availability (default: 100)'),
};

export function registerGenerateIdeasTool(server: McpServer): void {
  server.registerTool(
    'domains.ideas.generate',
    {
      description:
        'Deterministically generate domain candidates and check availability. For brandable searches, use brandMultiplex to create a library-backed Cartesian product of ordered phoneme or morpheme dimensions. For descriptive searches, prefer ranked DataForSEO keywordVariations; use llmVariations only when keyword data is unavailable. Exact and hyphenated patterns test each phrase both without and with hyphens across TLDs. Fails the whole request on any inconclusive or failed Dynadot check rather than reporting a false negative.',
      inputSchema,
      outputSchema: toolOutputSchema,
      annotations: READ_ONLY_EXTERNAL,
    },
    async (input) => {
      const selection = selectKeywords(
        input.keywords as string[],
        (input.keywordVariations as KeywordVariation[] | undefined) ?? [],
        (input.llmVariations as string[] | undefined) ?? [],
        input.brandMultiplex as BrandMultiplex | undefined,
      );
      const tlds = (input.tlds as string[]) ?? DEFAULT_TLDS;
      const patterns = (input.patterns as Pattern[]) ?? [...PATTERNS];
      const maxToCheck = (input.maxToCheck as number) ?? 100;
      const candidates =
        selection.source === 'multiplex'
          ? selection.keywords.flatMap((keyword) => tlds.map((tld) => `${keyword}.${tld}`))
          : generateCandidates(selection.keywords, tlds, patterns);
      const toCheck = [...new Set(candidates)].slice(0, maxToCheck);

      const available = await checkAvailability(toCheck);

      available.sort((a, b) => {
        const priceA = Number.parseFloat(a.price?.replace(/[^0-9.]/g, '') ?? '999');
        const priceB = Number.parseFloat(b.price?.replace(/[^0-9.]/g, '') ?? '999');
        return priceA - priceB || a.domain.localeCompare(b.domain);
      });

      const lines = available.map((domain) => `${domain.domain} ${domain.price ?? ''}`);
      const text =
        available.length > 0
          ? `Found ${available.length} available domains (checked ${toCheck.length}):\n\n${lines.join('\n')}`
          : `No available domains found (checked ${toCheck.length} domains)`;
      return createSuccessResult(
        {
          checked: toCheck.length,
          keywordSource: selection.source,
          keywords: selection.keywords,
          available,
        },
        text,
      );
    },
  );
}
