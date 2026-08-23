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
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
  execute.mockResolvedValue({ Status: 'success' });
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

  it('reports unavailable when the normalized response has no result', async () => {
    mocks.normalizeResponse.mockReturnValue({ success: true });

    const result = await checkDomainHandler()({ domain: 'missing.example', showPrice: true });
    expect(JSON.parse(result.content[0]?.text ?? '{}')).toEqual({
      success: true,
      domain: 'missing.example',
      available: false,
    });
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

  it('retries an empty response once and omits unavailable candidates', async () => {
    mocks.normalizeResponse.mockReturnValueOnce({ success: true }).mockReturnValueOnce({
      success: true,
      results: [{ domain: 'retry.com', available: false }],
    });

    const result = await generateIdeasHandler()({
      keywords: ['retry'],
      tlds: ['com'],
      patterns: ['exact'],
      maxToCheck: 10,
    });

    expect(execute).toHaveBeenCalledTimes(2);
    expect(result.content[0]?.text).toBe('No available domains found (checked 1 domains)');
  });

  it('handles failed searches and non-exact generation patterns', async () => {
    execute.mockRejectedValueOnce(new Error('network')).mockResolvedValue({ Status: 'success' });
    mocks.normalizeResponse.mockReturnValue({ success: false });

    const result = await generateIdeasHandler()({
      keywords: ['A!', 'Task', 'Flow'],
      tlds: ['dev'],
      patterns: ['hyphenated', 'prefix', 'suffix'],
      maxToCheck: 10,
    });

    expect(execute.mock.calls.length).toBe(10);
    expect(result.content[0]?.text).toContain('No available domains found');
  });

  it('keeps exact candidates ahead of shuffled alternatives when capped', async () => {
    mocks.normalizeResponse.mockReturnValue({
      success: true,
      results: [{ domain: 'task.com', available: true }],
    });

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
    mocks.normalizeResponse.mockReturnValue({ success: false });

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
