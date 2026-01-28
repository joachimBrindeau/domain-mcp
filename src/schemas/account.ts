import { z } from 'zod';
import type { ApiParams } from '../client.js';
import { DYNADOT_URLS } from '../constants.js';
import type { CompositeTool } from './common.js';
import { dnsRecord, p, subdomainRecord, tx } from './common.js';

export const accountTool: CompositeTool = {
  name: 'dynadot_account',
  description: `Account info, balance, and default settings for new domains. Manage API keys: ${DYNADOT_URLS.apiKey}`,
  actions: {
    info: {
      command: 'account_info',
      description: 'Get account information',
    },
    balance: {
      command: 'get_account_balance',
      description: 'Get account balance',
      params: z.object({ currency: p.currency.optional() }),
    },
    set_default_whois: {
      command: 'set_default_whois',
      description: 'Set default WHOIS contact',
      params: z.object({ contactId: p.contactId }),
      transform: (_, input) => ({ contact_id: input.contactId as string }),
    },
    set_default_ns: {
      command: 'set_default_ns',
      description: 'Set default nameservers',
      params: z.object({ nameservers: p.nameservers }),
      transform: (_, input) => tx.defaultNs(input),
    },
    set_default_parking: {
      command: 'set_default_parking',
      description: 'Set default parking',
    },
    set_default_forwarding: {
      command: 'set_default_forwarding',
      description: 'Set default forwarding',
      params: z.object({ forwardUrl: p.url }),
      transform: (_, input) => ({ forward_url: input.forwardUrl as string }),
    },
    set_default_stealth: {
      command: 'set_default_stealth',
      description: 'Set default stealth forwarding',
      params: z.object({ stealthUrl: p.url }),
      transform: (_, input) => ({ stealth_url: input.stealthUrl as string }),
    },
    set_default_hosting: {
      command: 'set_default_hosting',
      description: 'Set default hosting',
      params: z.object({ options: z.record(z.string(), z.string()) }),
      transform: (_, input) => {
        const params: ApiParams = {};
        for (const [k, v] of Object.entries(input.options as Record<string, string>)) {
          params[k] = v;
        }
        return params;
      },
    },
    set_default_dns: {
      command: 'set_default_dns',
      description: 'Set default DNS',
      params: z.object({
        mainRecords: z.array(dnsRecord).optional(),
        subdomainRecords: z.array(subdomainRecord).optional(),
      }),
      transform: (_, input) => tx.defaultDns(input),
    },
    set_default_dns2: {
      command: 'set_default_dns2',
      description: 'Set default DNS2',
      params: z.object({
        mainRecords: z.array(dnsRecord).optional(),
        subdomainRecords: z.array(subdomainRecord).optional(),
      }),
      transform: (_, input) => tx.defaultDns(input),
    },
    set_default_email_forward: {
      command: 'set_default_email_forward',
      description: 'Set default email forwarding',
      params: z.object({ email: p.email }),
    },
    set_default_renew_option: {
      command: 'set_default_renew_option',
      description: 'Set default renewal option',
      params: z.object({ renewOption: z.enum(['auto', 'donot']) }),
      transform: (_, input) => ({ renew_option: input.renewOption as string }),
    },
    clear_defaults: {
      command: 'set_clear_default_setting',
      description: 'Clear all default settings',
    },
  },
};
