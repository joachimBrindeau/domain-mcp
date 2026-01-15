import { z } from 'zod';
import type { CompositeTool } from './common.js';
import { p } from './common.js';
import type { ApiParams } from '../client.js';
import { DYNADOT_URLS } from '../constants.js';

export const domainTool: CompositeTool = {
  name: 'dynadot_domain',
  description: `Core domain operations: list, search, register, renew, delete, info, lock, pricing. Search domains: ${DYNADOT_URLS.domainSearch}`,
  actions: {
    list: {
      command: 'list_domain',
      description: 'List all domains in your account',
    },
    info: {
      command: 'domain_info',
      description: 'Get detailed info about a domain',
      params: z.object({ domain: p.domain }),
    },
    search: {
      command: 'search',
      description: `Check domain availability (with optional pricing). Search manually: ${DYNADOT_URLS.domainSearch}`,
      params: z.object({
        domain: z.string().optional().describe('Single domain name (e.g., example.com)'),
        domains: z.array(z.string()).optional().describe('List of domain names'),
        showPrice: z.boolean().optional().describe('Include pricing'),
        currency: p.currency.optional(),
      }),
      transform: (_, input) => {
        const params: ApiParams = {};
        // Accept both domain (singular) and domains (plural)
        let domainList: string[] = [];
        if (input.domain) {
          domainList = [input.domain as string];
        } else if (input.domains) {
          domainList = input.domains as string[];
        }
        if (!domainList.length)
          throw new Error('Either domain or domains parameter is required for search action');
        domainList.forEach((d, i) => {
          params[`domain${i}`] = d;
        });
        if (input.showPrice) params.show_price = '1';
        if (input.currency) params.currency = input.currency as string;
        return params;
      },
    },
    register: {
      command: 'register',
      description: `Register a new domain. View pricing: ${DYNADOT_URLS.pricing}`,
      params: z.object({
        domain: p.domain,
        duration: p.duration,
        currency: p.currency.optional(),
      }),
    },
    bulk_register: {
      command: 'bulk_register',
      description: `Register multiple domains at once. View pricing: ${DYNADOT_URLS.pricing}`,
      params: z.object({
        domains: p.domains,
        duration: p.duration,
        currency: p.currency.optional(),
      }),
      transform: (_, input) => {
        const params: ApiParams = {
          duration: input.duration as number,
          currency: (input.currency as string) || 'USD',
        };
        const domains = input.domains as string[] | undefined;
        if (!domains?.length)
          throw new Error('domains array is required for bulk_register action');
        domains.forEach((d, i) => {
          params[`domain${i}`] = d;
        });
        return params;
      },
    },
    renew: {
      command: 'renew',
      description: 'Renew a domain or check renewal price',
      params: z.object({
        domain: p.domain,
        duration: p.duration,
        currency: p.currency.optional(),
        priceCheck: z.boolean().optional().describe('Only check price'),
      }),
      transform: (_, input) => ({
        domain: input.domain as string,
        duration: input.duration as number,
        currency: (input.currency as string) || 'USD',
        price_check: input.priceCheck ? '1' : undefined,
      }),
    },
    delete: {
      command: 'delete',
      description: 'Delete a domain',
      params: z.object({ domain: p.domain }),
    },
    restore: {
      command: 'restore',
      description: 'Restore a deleted/expired domain',
      params: z.object({ domain: p.domain }),
    },
    lock: {
      command: 'lock_domain',
      description: 'Lock or unlock a domain',
      params: z.object({ domain: p.domain, lock: p.lockAction }),
    },
    tld_price: {
      command: 'tld_price',
      description: 'Get TLD pricing',
      params: z.object({
        tld: z.string().describe('TLD (e.g., com, net)'),
        currency: p.currency.optional(),
      }),
    },
    push: {
      command: 'push',
      description: 'Push domain to another Dynadot account',
      params: z.object({ domain: p.domain, username: z.string().describe('Target username') }),
    },
  },
};
