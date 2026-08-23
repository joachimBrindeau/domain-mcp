import { describe, expect, it } from 'vitest';
import { tx } from '../src/schemas/common.js';

describe('DNS record transforms', () => {
  it.each([
    ['domain DNS', tx.dnsRecords, { domain: 'example.com' }],
    ['folder DNS', tx.folderDns, { folderId: '12345' }],
    ['default DNS', tx.defaultDns, {}],
  ])('uses Dynadot priority parameter names for %s', (_name, transform, baseInput) => {
    const params = transform({
      ...baseInput,
      mainRecords: [{ type: 'MX', value: 'mx.example.com', priority: 10 }],
      subdomainRecords: [{ subdomain: 'mail', type: 'MX', value: 'mx.example.com', priority: 20 }],
    });

    expect(params).toMatchObject({
      main_record_type0: 'mx',
      main_recordx0: 10,
      sub_record_type0: 'mx',
      sub_recordx0: 20,
    });
    expect(params).not.toHaveProperty('main_record_distance0');
    expect(params).not.toHaveProperty('sub_record_distance0');
  });
});
