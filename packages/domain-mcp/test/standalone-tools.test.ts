import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getClient: vi.fn(),
  normalizeResponse: vi.fn(),
}));

vi.mock('../src/client.js', () => ({
  getClient: mocks.getClient,
}));

vi.mock('../src/normalize.js', () => ({
  normalizeResponse: mocks.normalizeResponse,
}));

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { getClient } from '../src/client.js';
import { registerCheckDomainTool } from '../src/tools/check-domain.js';
import { registerGenerateIdeasTool } from '../src/tools/generate-ideas.js';
import { getRegisteredToolHandler } from './tool-test-helpers.js';

const execute = vi.fn();

function checkDomainHandler() {
  const server = new McpServer({ name: 'test', version: '1.0.0' });
  registerCheckDomainTool(server);
  return getRegisteredToolHandler(server, 'domains.availability.check');
}

function generateIdeasHandler() {
  const server = new McpServer({ name: 'test', version: '1.0.0' });
  registerGenerateIdeasTool(server);
  return getRegisteredToolHandler(server, 'domains.ideas.generate');
}

beforeEach(() => {
  vi.clearAllMocks();
  execute.mockImplementation(async (_command: string, params: { domain0: string }) => ({
    Status: 'success',
    requestedDomain: params.domain0,
  }));
  mocks.normalizeResponse.mockImplementation(
    (_command: string, raw: { requestedDomain?: string }) => ({
      success: true,
      results: raw.requestedDomain
        ? [{ domain: raw.requestedDomain, available: false }]
        : undefined,
    }),
  );
  mocks.getClient.mockReturnValue({ execute } as unknown as ReturnType<typeof getClient>);
});

describe('check_domain tool', () => {
  it('checks a domain without requesting price by default', async () => {
    mocks.normalizeResponse.mockReturnValue({
      success: true,
      results: [{ domain: 'example.com', available: true }],
    });

    const result = await checkDomainHandler()({ domain: 'example.com' });
    const payload = JSON.parse(result.content[0]?.text ?? '{}');

    expect(execute).toHaveBeenCalledWith('search', { domain0: 'example.com' });
    expect(payload).toEqual({ success: true, domain: 'example.com', available: true });
  });

  it('includes price only when requested and returned', async () => {
    mocks.normalizeResponse.mockReturnValue({
      success: true,
      results: [{ domain: 'example.com', available: true, price: '$9.99' }],
    });

    const result = await checkDomainHandler()({ domain: 'example.com', showPrice: true });
    expect(execute).toHaveBeenCalledWith('search', { domain0: 'example.com', show_price: 1 });
    expect(JSON.parse(result.content[0]?.text ?? '{}')).toEqual({
      success: true,
      domain: 'example.com',
      available: true,
      price: '$9.99',
    });
  });

  it('fails closed when the normalized response has no availability result', async () => {
    mocks.normalizeResponse.mockReturnValue({ success: true });

    await expect(
      checkDomainHandler()({ domain: 'missing.example', showPrice: true }),
    ).rejects.toThrow('Dynadot search returned no availability result for missing.example');
  });

  it('fails closed when Dynadot returns a result for a different domain', async () => {
    mocks.normalizeResponse.mockReturnValue({
      success: true,
      results: [{ domain: 'stale.example', available: true }],
    });

    await expect(checkDomainHandler()({ domain: 'expected.example' })).rejects.toThrow(
      'Dynadot returned stale.example instead of expected.example',
    );
  });
});

describe('generate_domain_ideas tool', () => {
  it('generates exact domains, checks them serially, and sorts available prices', async () => {
    mocks.normalizeResponse
      .mockReturnValueOnce({
        success: true,
        results: [{ domain: 'task.com', available: true, price: '$12.00' }],
      })
      .mockReturnValueOnce({
        success: true,
        results: [{ domain: 'flow.com', available: true, price: '$8.00' }],
      });

    const result = await generateIdeasHandler()({
      keywords: ['Task', 'Flow'],
      tlds: ['com'],
      patterns: ['exact'],
      maxToCheck: 10,
    });

    expect(execute.mock.calls).toEqual([
      ['search', { domain0: 'task.com', show_price: 1 }],
      ['search', { domain0: 'flow.com', show_price: 1 }],
    ]);
    expect(result.content[0]?.text).toContain('Found 2 available domains');
    expect(result.content[0]?.text.indexOf('flow.com')).toBeLessThan(
      result.content[0]?.text.indexOf('task.com') ?? 0,
    );
  });

  it('fails closed on the first empty response without inventing retry semantics', async () => {
    mocks.normalizeResponse.mockReturnValue({ success: true });

    await expect(
      generateIdeasHandler()({
        keywords: ['retry'],
        tlds: ['com'],
        patterns: ['exact'],
        maxToCheck: 10,
      }),
    ).rejects.toThrow('Domain availability check failed for retry.com: empty Dynadot response');

    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('fails closed when Dynadot returns a result for a different domain', async () => {
    mocks.normalizeResponse.mockReturnValue({
      success: true,
      results: [{ domain: 'stale.example', available: true }],
    });

    await expect(
      generateIdeasHandler()({
        keywords: ['hourzen'],
        tlds: ['io'],
        patterns: ['exact'],
        maxToCheck: 10,
      }),
    ).rejects.toThrow(
      'Domain availability check failed for hourzen.io: Dynadot returned stale.example',
    );

    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('fails closed when any generated-domain search fails', async () => {
    execute.mockRejectedValueOnce(new Error('network')).mockResolvedValue({ Status: 'success' });
    mocks.normalizeResponse.mockReturnValue({
      success: true,
      results: [{ domain: 'unavailable.test', available: false }],
    });

    await expect(
      generateIdeasHandler()({
        keywords: ['A!', 'Task', 'Flow'],
        tlds: ['dev'],
        patterns: ['hyphenated', 'prefix', 'suffix'],
        maxToCheck: 10,
      }),
    ).rejects.toThrow('Domain availability check failed for get-task.dev: network');

    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('keeps exact candidates ahead of shuffled alternatives when capped', async () => {
    mocks.normalizeResponse.mockImplementation(
      (_command: string, raw: { requestedDomain: string }) => ({
        success: true,
        results: [{ domain: raw.requestedDomain, available: true }],
      }),
    );

    await generateIdeasHandler()({
      keywords: ['task'],
      tlds: ['com'],
      patterns: ['exact', 'prefix'],
      maxToCheck: 10,
    });

    expect(execute.mock.calls[0]?.[1]).toEqual({ domain0: 'task.com', show_price: 1 });
    expect(execute).toHaveBeenCalledTimes(9);
  });

  it('drops exact keywords that clean to fewer than two characters', async () => {
    mocks.normalizeResponse.mockReturnValue({
      success: true,
      results: [{ domain: 'valid.dev', available: true }],
    });

    const result = await generateIdeasHandler()({
      keywords: [' A! ', 'Valid'],
      tlds: ['dev'],
      patterns: ['exact'],
      maxToCheck: 10,
    });

    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith('search', {
      domain0: 'valid.dev',
      show_price: 1,
    });
    expect(result.content[0]?.text).toContain('valid.dev');
  });

  it('drops prefixed and suffixed candidates longer than twenty characters', async () => {
    const result = await generateIdeasHandler()({
      keywords: ['abcdefghijklmnopqr'],
      tlds: ['com'],
      patterns: ['prefix', 'suffix'],
      maxToCheck: 10,
    });

    expect(execute).not.toHaveBeenCalled();
    expect(result.content[0]?.text).toBe('No available domains found (checked 0 domains)');
  });

  it('uses the default TLDs, patterns, and check limit when omitted', async () => {
    const result = await generateIdeasHandler()({ keywords: ['Task'] });

    expect(execute).toHaveBeenCalledTimes(100);
    expect(execute.mock.calls.slice(0, 6).map((call) => call[1])).toEqual(
      ['com', 'io', 'co', 'app', 'dev', 'ai'].map((tld) => ({
        domain0: `task.${tld}`,
        show_price: 1,
      })),
    );
    expect(result.content[0]?.text).toBe('No available domains found (checked 100 domains)');
  });

  it('generates phrase labels with and without hyphens in deterministic TLD order', async () => {
    await generateIdeasHandler()({
      keywords: ['Time Tracking'],
      tlds: ['com', 'app'],
      patterns: ['exact', 'hyphenated'],
      maxToCheck: 10,
    });

    expect(execute.mock.calls.map((call) => call[1])).toEqual([
      { domain0: 'timetracking.com', show_price: 1 },
      { domain0: 'time-tracking.com', show_price: 1 },
      { domain0: 'timetracking.app', show_price: 1 },
      { domain0: 'time-tracking.app', show_price: 1 },
    ]);
  });

  it('multiplexes ordered brand dimensions before TLD expansion', async () => {
    await generateIdeasHandler()({
      keywords: ['time tracking'],
      brandMultiplex: {
        dimensions: [
          ['hor', 'tem'],
          ['v', 'l'],
          ['o', 'a'],
        ],
        minLength: 5,
        maxLength: 6,
      },
      tlds: ['com', 'app'],
      patterns: ['exact'],
      maxToCheck: 20,
    });

    expect(execute.mock.calls.map((call) => call[1])).toEqual([
      { domain0: 'horvo.com', show_price: 1 },
      { domain0: 'horvo.app', show_price: 1 },
      { domain0: 'horva.com', show_price: 1 },
      { domain0: 'horva.app', show_price: 1 },
      { domain0: 'horlo.com', show_price: 1 },
      { domain0: 'horlo.app', show_price: 1 },
      { domain0: 'horla.com', show_price: 1 },
      { domain0: 'horla.app', show_price: 1 },
      { domain0: 'temvo.com', show_price: 1 },
      { domain0: 'temvo.app', show_price: 1 },
      { domain0: 'temva.com', show_price: 1 },
      { domain0: 'temva.app', show_price: 1 },
      { domain0: 'temlo.com', show_price: 1 },
      { domain0: 'temlo.app', show_price: 1 },
      { domain0: 'temla.com', show_price: 1 },
      { domain0: 'temla.app', show_price: 1 },
    ]);
  });

  it('preserves an explicit multiplex separator', async () => {
    await generateIdeasHandler()({
      keywords: ['time tracking'],
      brandMultiplex: {
        dimensions: [['my'], ['time', 'hours']],
        separator: '-',
        minLength: 6,
        maxLength: 8,
      },
      tlds: ['com'],
      patterns: ['exact'],
      maxToCheck: 10,
    });

    expect(execute.mock.calls.map((call) => call[1])).toEqual([
      { domain0: 'my-time.com', show_price: 1 },
      { domain0: 'my-hours.com', show_price: 1 },
    ]);
  });

  it('uses supplied ranked keyword variations before deterministic LLM variations', async () => {
    await generateIdeasHandler()({
      keywords: ['time tracking software'],
      keywordVariations: [
        { keyword: 'time tracker software', searchVolume: 14800 },
        { keyword: 'time tracking software', searchVolume: 12100 },
      ],
      llmVariations: ['work time tracker'],
      tlds: ['com'],
      patterns: ['exact', 'hyphenated'],
      maxToCheck: 20,
    });

    expect(execute.mock.calls.map((call) => call[1])).toEqual([
      { domain0: 'timetrackersoftware.com', show_price: 1 },
      { domain0: 'time-tracker-software.com', show_price: 1 },
      { domain0: 'timetrackingsoftware.com', show_price: 1 },
      { domain0: 'time-tracking-software.com', show_price: 1 },
    ]);
  });

  it('uses deterministic LLM variations only when ranked keyword data is absent', async () => {
    await generateIdeasHandler()({
      keywords: ['time tracking software'],
      llmVariations: ['time tracker', 'time tracking'],
      tlds: ['com'],
      patterns: ['exact', 'hyphenated'],
      maxToCheck: 20,
    });

    expect(execute.mock.calls.map((call) => call[1])).toEqual([
      { domain0: 'timetracker.com', show_price: 1 },
      { domain0: 'time-tracker.com', show_price: 1 },
      { domain0: 'timetracking.com', show_price: 1 },
      { domain0: 'time-tracking.com', show_price: 1 },
    ]);
  });

  it('skips an unknown runtime pattern when the callback is invoked defensively', async () => {
    const result = await generateIdeasHandler()({
      keywords: ['task'],
      tlds: ['com'],
      patterns: ['unknown'] as never,
      maxToCheck: 10,
    });

    expect(execute).not.toHaveBeenCalled();
    expect(result.content[0]?.text).toBe('No available domains found (checked 0 domains)');
  });
});
