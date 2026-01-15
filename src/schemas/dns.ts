import { z } from 'zod';
import type { CompositeTool } from './common.js';
import { p, tx, dnsRecord, subdomainRecord } from './common.js';

export const dnsTool: CompositeTool = {
  name: 'dynadot_dns',
  description: 'DNS management: get/set DNS records, DNSSEC configuration',
  actions: {
    get: {
      command: 'get_dns',
      description: 'Get current DNS records',
      params: z.object({ domain: p.domain }),
    },
    set: {
      command: 'set_dns2',
      description: 'Set DNS records',
      params: z.object({
        domain: p.domain,
        mainRecords: z.array(dnsRecord).optional().describe('Main domain records'),
        subdomainRecords: z.array(subdomainRecord).optional().describe('Subdomain records'),
      }),
      transform: (_, input) => tx.dnsRecords(input),
    },
    set_dnssec: {
      command: 'set_dnssec',
      description: 'Enable DNSSEC',
      params: z.object({
        domain: p.domain,
        keyTag: z.number().describe('Key tag'),
        algorithm: z.number().describe('Algorithm'),
        digestType: z.number().describe('Digest type'),
        digest: z.string().describe('DS record digest'),
      }),
      transform: (_, input) => ({
        domain: input.domain as string,
        key_tag: input.keyTag as number,
        algorithm: input.algorithm as number,
        digest_type: input.digestType as number,
        digest: input.digest as string,
      }),
    },
    get_dnssec: {
      command: 'get_dnssec',
      description: 'Get DNSSEC settings',
      params: z.object({ domain: p.domain }),
    },
    clear_dnssec: {
      command: 'clear_dnssec',
      description: 'Remove DNSSEC',
      params: z.object({ domain: p.domain }),
    },
  },
};
