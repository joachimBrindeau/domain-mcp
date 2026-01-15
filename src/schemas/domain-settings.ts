import { z } from 'zod';
import type { CompositeTool } from './common.js';
import { p, tx } from './common.js';
import type { ApiParams } from '../client.js';

export const domainSettingsTool: CompositeTool = {
  name: 'dynadot_domain_settings',
  description:
    'Configure domain settings: nameservers, privacy, renewal, forwarding, parking, WHOIS',
  actions: {
    set_ns: {
      command: 'set_ns',
      description: 'Set nameservers',
      params: z.object({ domain: p.domain, nameservers: p.nameservers }),
      transform: (_, input) => tx.nameservers(input),
    },
    get_ns: {
      command: 'get_ns',
      description: 'Get current nameservers',
      params: z.object({ domain: p.domain }),
    },
    set_renew_option: {
      command: 'set_renew_option',
      description: 'Set auto-renewal option',
      params: z.object({ domain: p.domain, renewOption: p.renewOption }),
      transform: (_, input) => ({
        domain: input.domain as string,
        renew_option: input.renewOption as string,
      }),
    },
    set_privacy: {
      command: 'set_privacy',
      description: 'Set WHOIS privacy',
      params: z.object({ domains: p.domains, option: p.privacyOption }),
      transform: (_, input) => {
        const params: ApiParams = { option: input.option as string };
        const domains = input.domains as string[] | undefined;
        if (!domains?.length) throw new Error('domains array is required for set_privacy action');
        domains.forEach((d, i) => {
          params[`domain${i}`] = d;
        });
        return params;
      },
    },
    set_whois: {
      command: 'set_whois',
      description: 'Set WHOIS contact',
      params: z.object({
        domain: p.domain,
        registrantContact: p.contactId,
        adminContact: p.contactId.optional(),
        techContact: p.contactId.optional(),
        billingContact: p.contactId.optional(),
      }),
      transform: (_, input) => ({
        domain: input.domain as string,
        registrant_contact: input.registrantContact as string,
        admin_contact: input.adminContact as string | undefined,
        tech_contact: input.techContact as string | undefined,
        billing_contact: input.billingContact as string | undefined,
      }),
    },
    set_forwarding: {
      command: 'set_forwarding',
      description: 'Set URL forwarding',
      params: z.object({
        domain: p.domain,
        forwardUrl: p.url,
        forwardType: z.enum(['temporary', 'permanent']).optional(),
      }),
      transform: (_, input) => ({
        domain: input.domain as string,
        forward_url: input.forwardUrl as string,
        forward_type: input.forwardType as string | undefined,
      }),
    },
    set_stealth: {
      command: 'set_stealth',
      description: 'Set stealth/masked forwarding',
      params: z.object({
        domain: p.domain,
        stealthUrl: p.url,
        stealthTitle: z.string().optional().describe('Page title'),
      }),
      transform: (_, input) => ({
        domain: input.domain as string,
        stealth_url: input.stealthUrl as string,
        stealth_title: input.stealthTitle as string | undefined,
      }),
    },
    set_parking: {
      command: 'set_parking',
      description: 'Enable parking page',
      params: z.object({ domain: p.domain }),
    },
    set_hosting: {
      command: 'set_hosting',
      description: 'Set hosting settings',
      params: z.object({
        domain: p.domain,
        options: z.record(z.string(), z.string()).describe('Hosting options'),
      }),
      transform: (_, input) => {
        const params: ApiParams = { domain: input.domain as string };
        for (const [k, v] of Object.entries(input.options as Record<string, string>)) {
          params[k] = v;
        }
        return params;
      },
    },
    set_email_forward: {
      command: 'set_email_forward',
      description: 'Set email forwarding',
      params: z.object({
        domain: p.domain,
        forwardTo: p.email,
        username: z.string().optional().describe('Email username (default: *)'),
      }),
      transform: (_, input) => ({
        domain: input.domain as string,
        forward_to: input.forwardTo as string,
        username: (input.username as string) || '*',
      }),
    },
    set_folder: {
      command: 'set_folder',
      description: 'Move domain to folder',
      params: z.object({ domain: p.domain, folderId: p.folderId }),
      transform: (_, input) => ({
        domain: input.domain as string,
        folder_id: input.folderId as string,
      }),
    },
    set_note: {
      command: 'set_note',
      description: 'Set domain note',
      params: z.object({ domain: p.domain, note: p.note }),
    },
    clear_settings: {
      command: 'set_clear_domain_setting',
      description: 'Clear all custom settings',
      params: z.object({ domain: p.domain }),
    },
  },
};
