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

  it('uses sandbox environment defaults and disables transport retries', () => {
    vi.stubEnv('DYNADOT_SANDBOX', 'true');
    vi.stubEnv('DYNADOT_SANDBOX_KEY', 'sandbox-key');
    new DomainClient({ timeout: 1234 });

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        prefix: 'https://api-sandbox.dynadot.com',
        timeout: 1234,
        retry: 0,
      }),
    );
  });

  it('disables transport retries for registrar mutations on retryable HTTP failures', async () => {
    const client = new DomainClient({ apiKey: 'single-submit-key' });
    expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({ retry: 0 }));

    getSpy.mockReturnValueOnce({
      json: vi.fn().mockRejectedValue(
        Object.assign(new Error('Service Unavailable'), {
          response: new Response(null, { status: 503 }),
        }),
      ),
    });
    await expect(client.execute('register', { domain: 'example.com' })).rejects.toMatchObject({
      message: 'Service Unavailable',
      response: expect.objectContaining({ status: 503 }),
    });
    expect(getSpy).toHaveBeenCalledTimes(1);
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
    const firstClient = new DomainClient({
      apiKey: 'shared-boundary-key',
      requestIntervalMs: 0,
    });
    const secondClient = new DomainClient({
      apiKey: 'shared-boundary-key',
      requestIntervalMs: 0,
    });
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

  it('rejects conflicting pacing for the same credential and endpoint', () => {
    new DomainClient({ apiKey: 'conflicting-interval-key', requestIntervalMs: 0 });

    expect(
      () => new DomainClient({ apiKey: 'conflicting-interval-key', requestIntervalMs: 50 }),
    ).toThrow('Conflicting request intervals for the same Dynadot credential and endpoint');
  });

  it('keeps production and sandbox pacing independent', () => {
    expect(
      () =>
        new DomainClient({
          apiKey: 'shared-environment-key',
          sandbox: false,
          requestIntervalMs: 0,
        }),
    ).not.toThrow();
    expect(
      () =>
        new DomainClient({
          apiKey: 'shared-environment-key',
          sandbox: true,
          requestIntervalMs: 50,
        }),
    ).not.toThrow();
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

  it('rejects malformed top-level response statuses', async () => {
    const client = new DomainClient({ apiKey: 'malformed-status-key' });
    getSpy.mockReturnValueOnce({ json: vi.fn().mockResolvedValue(null) });
    await expect(client.execute('domain_info')).rejects.toThrow(
      'Dynadot API error: malformed response envelope',
    );

    getSpy.mockReturnValueOnce({ json: vi.fn().mockResolvedValue({ Result: 'ok' }) });
    await expect(client.execute('domain_info')).rejects.toThrow(
      'Dynadot API error: missing top-level Status',
    );

    getSpy.mockReturnValueOnce({
      json: vi.fn().mockResolvedValue({ Status: 'pending' }),
    });
    await expect(client.execute('domain_info')).rejects.toThrow(
      'Dynadot API error: unknown top-level Status "pending"',
    );

    getSpy.mockReturnValueOnce({ json: vi.fn().mockResolvedValue({ Status: 1 }) });
    await expect(client.execute('domain_info')).rejects.toThrow(
      'Dynadot API error: malformed top-level Status',
    );
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

  it('rejects nested error statuses inside array response envelopes', async () => {
    const client = new DomainClient({ apiKey: 'fixture-key' });
    getSpy.mockReturnValueOnce({
      json: vi.fn().mockResolvedValue({
        Status: 'success',
        Results: [{ Status: 'error', Error: 'Candidate rejected' }],
      }),
    });

    await expect(client.execute('search', { domain0: 'example.com' })).rejects.toThrow(
      'Dynadot API error: Candidate rejected',
    );
  });

  it('uses an unknown-error message for nonzero response codes without details', async () => {
    const client = new DomainClient({ apiKey: 'fixture-key' });
    getSpy.mockReturnValueOnce({
      json: vi.fn().mockResolvedValue({
        Status: 'success',
        SearchResponse: { ResponseCode: '-1' },
      }),
    });

    await expect(client.execute('search', { domain0: 'example.com' })).rejects.toThrow(
      'Dynadot API error: Unknown error',
    );
  });

  it('reuses the singleton client instance', () => {
    vi.stubEnv('DYNADOT_API_KEY', 'singleton-key');
    const first = getClient();
    expect(getClient()).toBe(first);
  });
});
