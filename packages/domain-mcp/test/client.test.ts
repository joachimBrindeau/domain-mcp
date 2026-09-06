import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getSpy, createSpy } = vi.hoisted(() => {
  const get = vi.fn();
  return {
    getSpy: get,
    createSpy: vi.fn(() => ({ get })),
  };
});

vi.mock('ky', () => ({
  default: { create: createSpy },
}));

import { DomainClient, getClient } from '../src/client.js';

describe('DomainClient', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    createSpy.mockClear();
    getSpy.mockReset();
    getSpy.mockReturnValue({
      json: vi.fn().mockResolvedValue({ Status: 'success' }),
    });
  });

  it('requires an API key when no configured or environment key exists', () => {
    vi.stubEnv('DYNADOT_API_KEY', '');
    vi.stubEnv('DYNADOT_SANDBOX_KEY', '');
    expect(() => new DomainClient()).toThrow('API key required');
  });

  it('uses sandbox environment defaults and configures ky retries', () => {
    vi.stubEnv('DYNADOT_SANDBOX', 'true');
    vi.stubEnv('DYNADOT_SANDBOX_KEY', 'sandbox-key');
    new DomainClient({ timeout: 1234, maxRetries: 2, retryDelay: 10 });

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        prefix: 'https://api-sandbox.dynadot.com',
        timeout: 1234,
        retry: expect.objectContaining({ limit: 2, backoffLimit: 40 }),
      }),
    );
  });

  it('waits with exponential backoff before a retry', async () => {
    vi.useFakeTimers();
    try {
      new DomainClient({ apiKey: 'fixture-key', maxRetries: 2, retryDelay: 10 });
      const options = createSpy.mock.calls[0]?.[0] as {
        hooks: { beforeRetry: Array<(context: { retryCount: number }) => Promise<void>> };
      };
      const beforeRetry = options.hooks.beforeRetry[0];

      const retry = beforeRetry?.({ retryCount: 2 });
      let completed = false;
      retry?.then(() => {
        completed = true;
      });

      await vi.advanceTimersByTimeAsync(39);
      expect(completed).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      await expect(retry).resolves.toBeUndefined();
      expect(completed).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('rejects reserved command parameter override', async () => {
    const client = new DomainClient({ apiKey: 'fixture-key' });

    await expect(client.execute('domain_info', { command: 'delete' })).rejects.toThrow(
      'Reserved parameter "command" cannot be set by tool input',
    );
  });

  it('preserves command and key when building search params', async () => {
    const client = new DomainClient({ apiKey: 'fixture-key' });
    await client.execute('domain_info', { domain: 'example.com' });

    const options = getSpy.mock.calls[0]?.[1] as { searchParams: URLSearchParams };
    expect(options.searchParams.get('command')).toBe('domain_info');
    expect(options.searchParams.get('key')).toBe('fixture-key');
    expect(options.searchParams.get('domain')).toBe('example.com');
  });

  it('filters undefined values and stringifies supported parameter types', async () => {
    const client = new DomainClient({ apiKey: 'fixture-key' });
    await client.execute('search', { count: 2, enabled: true, omitted: undefined });

    const options = getSpy.mock.calls[0]?.[1] as { searchParams: URLSearchParams };
    expect(options.searchParams.get('count')).toBe('2');
    expect(options.searchParams.get('enabled')).toBe('true');
    expect(options.searchParams.has('omitted')).toBe(false);
  });

  it('serializes every API request through the shared client boundary', async () => {
    const firstClient = new DomainClient({ apiKey: 'fixture-key', requestIntervalMs: 0 });
    const secondClient = new DomainClient({ apiKey: 'fixture-key', requestIntervalMs: 0 });
    let active = 0;
    let maxActive = 0;
    const releases: Array<() => void> = [];
    getSpy.mockImplementation(() => ({
      json: vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            active += 1;
            maxActive = Math.max(maxActive, active);
            releases.push(() => {
              active -= 1;
              resolve({ Status: 'success' });
            });
          }),
      ),
    }));

    const first = firstClient.execute('search', { domain0: 'first.example' });
    const second = secondClient.execute('search', { domain0: 'second.example' });
    await vi.waitFor(() => expect(releases).toHaveLength(1));
    releases.shift()?.();
    await vi.waitFor(() => expect(releases).toHaveLength(1));
    releases.shift()?.();
    await Promise.all([first, second]);

    expect(maxActive).toBe(1);
  });

  it('paces requests at the configured interval', async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(0);
      const client = new DomainClient({ apiKey: 'paced-key', requestIntervalMs: 100 });
      const startedAt: number[] = [];
      getSpy.mockImplementation(() => {
        startedAt.push(Date.now());
        return { json: vi.fn().mockResolvedValue({ Status: 'success' }) };
      });

      const first = client.execute('search', { domain0: 'first.example' });
      const second = client.execute('search', { domain0: 'second.example' });
      await vi.advanceTimersByTimeAsync(99);
      expect(startedAt).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(10);
      await Promise.all([first, second]);

      expect(startedAt).toHaveLength(2);
      expect((startedAt[1] ?? 0) - (startedAt[0] ?? 0)).toBeGreaterThanOrEqual(99);
    } finally {
      vi.useRealTimers();
    }
  });

  it('throws Dynadot errors with explicit and fallback messages', async () => {
    const client = new DomainClient({ apiKey: 'fixture-key' });
    getSpy.mockReturnValueOnce({
      json: vi.fn().mockResolvedValue({ Status: 'error', Error: 'Denied' }),
    });
    await expect(client.execute('domain_info')).rejects.toThrow('Dynadot API error: Denied');

    getSpy.mockReturnValueOnce({ json: vi.fn().mockResolvedValue({ Status: 'error' }) });
    await expect(client.execute('domain_info')).rejects.toThrow('Dynadot API error: Unknown error');
  });

  it('rejects nested nonzero response codes even when the outer status says success', async () => {
    const client = new DomainClient({ apiKey: 'fixture-key' });
    getSpy.mockReturnValueOnce({
      json: vi.fn().mockResolvedValue({
        Status: 'success',
        SearchResponse: {
          ResponseCode: '-1',
          Error: 'unauthorized ip address: 81.53.251.68',
        },
      }),
    });

    await expect(client.execute('search', { domain0: 'example.com' })).rejects.toThrow(
      'Dynadot API error: unauthorized ip address: 81.53.251.68',
    );
  });

  it('reuses the singleton client instance', () => {
    vi.stubEnv('DYNADOT_API_KEY', 'singleton-key');
    const first = getClient();
    expect(getClient()).toBe(first);
  });
});
