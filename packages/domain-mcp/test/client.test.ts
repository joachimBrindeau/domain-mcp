import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSpy = vi.fn();

vi.mock('ky', () => ({
  default: {
    create: vi.fn(() => ({
      get: getSpy,
    })),
  },
}));

import { DomainClient } from '../src/client.js';

describe('DomainClient', () => {
  beforeEach(() => {
    getSpy.mockReset();
    getSpy.mockReturnValue({
      json: vi.fn().mockResolvedValue({ Status: 'success' }),
    });
  });

  it('should reject reserved command parameter override', async () => {
    const client = new DomainClient({ apiKey: 'test-key' });

    await expect(client.execute('domain_info', { command: 'delete' })).rejects.toThrow(
      'Reserved parameter "command" cannot be set by tool input',
    );
  });

  it('should preserve command and key when building search params', async () => {
    const client = new DomainClient({ apiKey: 'test-key' });
    await client.execute('domain_info', { domain: 'example.com' });

    const options = getSpy.mock.calls[0]?.[1] as { searchParams: URLSearchParams };
    expect(options.searchParams.get('command')).toBe('domain_info');
    expect(options.searchParams.get('key')).toBe('test-key');
    expect(options.searchParams.get('domain')).toBe('example.com');
  });
});
