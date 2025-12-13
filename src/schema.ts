import { z } from 'zod';
import type { ApiParams } from './client.js';
import { DYNADOT_URLS } from './constants.js';

// Composite tool definition
export interface CompositeTool {
  name: string;
  description: string;
  actions: Record<string, ActionDefinition>;
}

interface ActionDefinition {
  command: string;
  description: string;
  params?: z.ZodObject<z.ZodRawShape>;
  transform?: (action: string, input: Record<string, unknown>) => ApiParams;
}

// Reusable param schemas
const p = {
  domain: z.string().describe('Domain name (e.g., example.com)'),
  domains: z.array(z.string()).describe('List of domain names'),
  duration: z.number().min(1).max(10).describe('Duration in years (1-10)'),
  currency: z.string().describe('Currency code (default: USD)').default('USD'),
  contactId: z.string().describe('Contact ID'),
  folderId: z.string().describe('Folder ID'),
  auctionId: z.string().describe('Auction ID'),
  orderId: z.string().describe('Order ID'),
  nameservers: z.array(z.string()).describe('List of nameservers'),
  host: z.string().describe('Nameserver hostname'),
  ip: z.string().describe('IP address'),
  url: z.string().describe('URL'),
  email: z.string().describe('Email address'),
  note: z.string().describe('Note text'),
  authCode: z.string().describe('Authorization code'),
  amount: z.number().describe('Amount'),
  name: z.string().describe('Name'),
  renewOption: z.enum(['auto', 'donot', 'reset']).describe('Renewal option'),
  privacyOption: z.enum(['full', 'partial', 'off']).describe('Privacy level'),
  lockAction: z.enum(['lock', 'unlock']).describe('Lock action'),
  confirmAction: z.enum(['confirm', 'decline']).describe('Confirm action'),
  pushAction: z.enum(['accept', 'decline']).describe('Push request action'),
};

// DNS record schemas
const dnsRecord = z.object({
  type: z.string().describe('Record type (A, AAAA, CNAME, MX, TXT)'),
  value: z.string().describe('Record value'),
  ttl: z.number().optional().describe('TTL in seconds'),
  priority: z.number().optional().describe('Priority (for MX)'),
});

const subdomainRecord = z.object({
  subdomain: z.string().describe('Subdomain name'),
  type: z.string().describe('Record type'),
  value: z.string().describe('Record value'),
  ttl: z.number().optional().describe('TTL in seconds'),
  priority: z.number().optional().describe('Priority (for MX)'),
});

// Contact schema
const contactFields = z.object({
  name: z.string().describe('Contact name'),
  email: z.string().describe('Email'),
  phoneCc: z.string().describe('Phone country code (e.g., "1" for US, "33" for France)'),
  phoneNum: z.string().describe('Phone number without country code (e.g., "5551234567")'),
  address1: z.string().describe('Address line 1'),
  city: z.string().describe('City'),
  state: z.string().describe('State/Province'),
  zipCode: z.string().describe('Postal code'),
  country: z.string().describe('Country code (2-letter)'),
  organization: z.string().optional().describe('Organization'),
  address2: z.string().optional().describe('Address line 2'),
});

// Transform helpers
const tx = {
  domain: (input: Record<string, unknown>): ApiParams => ({
    domain: input.domain as string,
  }),

  domains:
    (prefix: string) =>
    (input: Record<string, unknown>): ApiParams => {
      const params: ApiParams = {};
      const domains = input.domains as string[] | undefined;
      domains?.forEach((d, i) => {
        params[`${prefix}${i}`] = d;
      });
      return params;
    },

  nameservers: (input: Record<string, unknown>): ApiParams => {
    const params: ApiParams = { domain: input.domain as string };
    const ns = input.nameservers as string[] | undefined;
    ns?.forEach((v, i) => {
      params[`ns${i}`] = v;
    });
    return params;
  },

  dnsRecords: (input: Record<string, unknown>): ApiParams => {
    const params: ApiParams = { domain: input.domain as string };
    const main = input.mainRecords as
      | Array<{ type: string; value: string; ttl?: number; priority?: number }>
      | undefined;
    const sub = input.subdomainRecords as
      | Array<{ subdomain: string; type: string; value: string; ttl?: number; priority?: number }>
      | undefined;

    main?.forEach((r, i) => {
      params[`main_record_type${i}`] = r.type;
      params[`main_record${i}`] = r.value;
      if (r.ttl) params[`main_record_ttl${i}`] = r.ttl;
      if (r.priority !== undefined) params[`main_record_distance${i}`] = r.priority;
    });

    sub?.forEach((r, i) => {
      params[`subdomain${i}`] = r.subdomain;
      params[`sub_record_type${i}`] = r.type;
      params[`sub_record${i}`] = r.value;
      if (r.ttl) params[`sub_record_ttl${i}`] = r.ttl;
      if (r.priority !== undefined) params[`sub_record_distance${i}`] = r.priority;
    });

    return params;
  },

  contact: (input: Record<string, unknown>): ApiParams => ({
    name: input.name as string,
    organization: input.organization as string | undefined,
    email: input.email as string,
    phonecc: input.phoneCc as string,
    phonenum: input.phoneNum as string,
    address1: input.address1 as string,
    address2: input.address2 as string | undefined,
    city: input.city as string,
    state: input.state as string,
    zip: input.zipCode as string,
    country: input.country as string,
  }),

  folderId: (input: Record<string, unknown>): ApiParams => ({
    folder_id: input.folderId as string,
  }),

  folderNs: (input: Record<string, unknown>): ApiParams => {
    const params: ApiParams = { folder_id: input.folderId as string };
    const ns = input.nameservers as string[] | undefined;
    ns?.forEach((v, i) => {
      params[`ns${i}`] = v;
    });
    return params;
  },

  folderDns: (input: Record<string, unknown>): ApiParams => {
    const params: ApiParams = { folder_id: input.folderId as string };
    const main = input.mainRecords as
      | Array<{ type: string; value: string; ttl?: number; priority?: number }>
      | undefined;
    const sub = input.subdomainRecords as
      | Array<{ subdomain: string; type: string; value: string; ttl?: number; priority?: number }>
      | undefined;

    main?.forEach((r, i) => {
      params[`main_record_type${i}`] = r.type;
      params[`main_record${i}`] = r.value;
      if (r.ttl) params[`main_record_ttl${i}`] = r.ttl;
      if (r.priority !== undefined) params[`main_record_distance${i}`] = r.priority;
    });

    sub?.forEach((r, i) => {
      params[`subdomain${i}`] = r.subdomain;
      params[`sub_record_type${i}`] = r.type;
      params[`sub_record${i}`] = r.value;
      if (r.ttl) params[`sub_record_ttl${i}`] = r.ttl;
      if (r.priority !== undefined) params[`sub_record_distance${i}`] = r.priority;
    });

    return params;
  },

  defaultNs: (input: Record<string, unknown>): ApiParams => {
    const params: ApiParams = {};
    const ns = input.nameservers as string[] | undefined;
    ns?.forEach((v, i) => {
      params[`ns${i}`] = v;
    });
    return params;
  },

  defaultDns: (input: Record<string, unknown>): ApiParams => {
    const params: ApiParams = {};
    const main = input.mainRecords as
      | Array<{ type: string; value: string; ttl?: number; priority?: number }>
      | undefined;
    const sub = input.subdomainRecords as
      | Array<{ subdomain: string; type: string; value: string; ttl?: number; priority?: number }>
      | undefined;

    main?.forEach((r, i) => {
      params[`main_record_type${i}`] = r.type;
      params[`main_record${i}`] = r.value;
      if (r.ttl) params[`main_record_ttl${i}`] = r.ttl;
      if (r.priority !== undefined) params[`main_record_distance${i}`] = r.priority;
    });

    sub?.forEach((r, i) => {
      params[`subdomain${i}`] = r.subdomain;
      params[`sub_record_type${i}`] = r.type;
      params[`sub_record${i}`] = r.value;
      if (r.ttl) params[`sub_record_ttl${i}`] = r.ttl;
      if (r.priority !== undefined) params[`sub_record_distance${i}`] = r.priority;
    });

    return params;
  },
};

// ============================================================================
// COMPOSITE TOOLS (10 tools covering all 107 API commands)
// ============================================================================

export const compositeTools: CompositeTool[] = [
  // 1. DOMAIN - Core domain operations
  {
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
  },

  // 2. DOMAIN SETTINGS - Domain configuration
  {
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
  },

  // 3. DNS - DNS management
  {
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
  },

  // 4. NAMESERVER - Nameserver management
  {
    name: 'dynadot_nameserver',
    description: 'Manage registered nameservers (glue records): register, update IP, delete, list',
    actions: {
      list: {
        command: 'server_list',
        description: 'List all registered nameservers',
      },
      register: {
        command: 'register_ns',
        description: 'Register a custom nameserver',
        params: z.object({ host: p.host, ip: p.ip }),
      },
      add: {
        command: 'add_ns',
        description: 'Add a nameserver',
        params: z.object({ host: p.host }),
      },
      set_ip: {
        command: 'set_ns_ip',
        description: 'Update nameserver IP',
        params: z.object({ host: p.host, ip: p.ip }),
      },
      delete: {
        command: 'delete_ns',
        description: 'Delete a nameserver',
        params: z.object({ host: p.host }),
      },
      delete_by_domain: {
        command: 'delete_ns_by_domain',
        description: 'Delete all nameservers for a domain',
        params: z.object({ domain: p.domain }),
      },
    },
  },

  // 5. TRANSFER - Domain transfers
  {
    name: 'dynadot_transfer',
    description: 'Domain transfers: initiate, check status, manage auth codes, push requests',
    actions: {
      initiate: {
        command: 'transfer',
        description: 'Initiate domain transfer',
        params: z.object({ domain: p.domain, authCode: p.authCode }),
        transform: (_, input) => ({
          domain: input.domain as string,
          auth: input.authCode as string,
        }),
      },
      status: {
        command: 'get_transfer_status',
        description: 'Check transfer status',
        params: z.object({ domain: p.domain }),
      },
      cancel: {
        command: 'cancel_transfer',
        description: 'Cancel pending transfer',
        params: z.object({ domain: p.domain }),
      },
      get_auth_code: {
        command: 'get_transfer_auth_code',
        description: 'Get transfer auth code',
        params: z.object({ domain: p.domain }),
      },
      set_auth_code: {
        command: 'set_transfer_auth_code',
        description: 'Set custom auth code',
        params: z.object({ domain: p.domain, authCode: p.authCode }),
        transform: (_, input) => ({
          domain: input.domain as string,
          auth_code: input.authCode as string,
        }),
      },
      authorize_away: {
        command: 'authorize_transfer_away',
        description: 'Authorize transfer to another registrar',
        params: z.object({ domain: p.domain }),
      },
      get_push_request: {
        command: 'get_domain_push_request',
        description: 'Get pending push request',
        params: z.object({ domain: p.domain }),
      },
      set_push_request: {
        command: 'set_domain_push_request',
        description: 'Accept or decline push request',
        params: z.object({ domain: p.domain, action: p.pushAction }),
      },
    },
  },

  // 6. CONTACT - Contact management
  {
    name: 'dynadot_contact',
    description: 'WHOIS contact management: create, edit, delete, list, regional settings',
    actions: {
      list: {
        command: 'contact_list',
        description: 'List all contacts',
      },
      get: {
        command: 'get_contact',
        description: 'Get contact details',
        params: z.object({ contactId: p.contactId }),
        transform: (_, input) => ({ contact_id: input.contactId as string }),
      },
      create: {
        command: 'create_contact',
        description: 'Create new contact',
        params: contactFields,
        transform: (_, input) => tx.contact(input),
      },
      edit: {
        command: 'edit_contact',
        description: 'Update contact',
        params: z.object({
          contactId: p.contactId,
          name: p.name.optional(),
          email: p.email.optional(),
          phoneCc: z.string().optional().describe('Phone country code'),
          phoneNum: z.string().optional().describe('Phone number without country code'),
          address1: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
          country: z.string().optional(),
        }),
        transform: (_, input) => ({
          contact_id: input.contactId as string,
          name: input.name as string | undefined,
          email: input.email as string | undefined,
          phonecc: input.phoneCc as string | undefined,
          phonenum: input.phoneNum as string | undefined,
          address1: input.address1 as string | undefined,
          city: input.city as string | undefined,
          state: input.state as string | undefined,
          zip: input.zipCode as string | undefined,
          country: input.country as string | undefined,
        }),
      },
      delete: {
        command: 'delete_contact',
        description: 'Delete contact',
        params: z.object({ contactId: p.contactId }),
        transform: (_, input) => ({ contact_id: input.contactId as string }),
      },
      create_cn_audit: {
        command: 'create_cn_audit',
        description: 'Create .CN domain audit',
        params: z.object({
          contactId: p.contactId,
          auditDetails: z.record(z.string(), z.string()).describe('Audit details'),
        }),
        transform: (_, input) => {
          const params: ApiParams = { contact_id: input.contactId as string };
          for (const [k, v] of Object.entries(input.auditDetails as Record<string, string>)) {
            params[k] = v;
          }
          return params;
        },
      },
      get_cn_audit_status: {
        command: 'get_cn_audit_status',
        description: 'Get .CN audit status',
        params: z.object({ contactId: p.contactId }),
        transform: (_, input) => ({ contact_id: input.contactId as string }),
      },
      set_eu_setting: {
        command: 'set_contact_eu_setting',
        description: 'Set EU contact settings',
        params: z.object({ contactId: p.contactId, settings: z.record(z.string(), z.string()) }),
        transform: (_, input) => {
          const params: ApiParams = { contact_id: input.contactId as string };
          for (const [k, v] of Object.entries(input.settings as Record<string, string>)) {
            params[k] = v;
          }
          return params;
        },
      },
      set_lv_setting: {
        command: 'set_contact_lv_setting',
        description: 'Set Latvia contact settings',
        params: z.object({ contactId: p.contactId, settings: z.record(z.string(), z.string()) }),
        transform: (_, input) => {
          const params: ApiParams = { contact_id: input.contactId as string };
          for (const [k, v] of Object.entries(input.settings as Record<string, string>)) {
            params[k] = v;
          }
          return params;
        },
      },
      set_lt_setting: {
        command: 'set_contact_lt_setting',
        description: 'Set Lithuania contact settings',
        params: z.object({ contactId: p.contactId, settings: z.record(z.string(), z.string()) }),
        transform: (_, input) => {
          const params: ApiParams = { contact_id: input.contactId as string };
          for (const [k, v] of Object.entries(input.settings as Record<string, string>)) {
            params[k] = v;
          }
          return params;
        },
      },
    },
  },

  // 7. FOLDER - Folder management
  {
    name: 'dynadot_folder',
    description: 'Folder management: create, delete, list, configure folder-level settings',
    actions: {
      list: {
        command: 'folder_list',
        description: 'List all folders',
      },
      create: {
        command: 'create_folder',
        description: 'Create new folder',
        params: z.object({ folderName: p.name }),
        transform: (_, input) => ({ folder_name: input.folderName as string }),
      },
      delete: {
        command: 'delete_folder',
        description: 'Delete folder',
        params: z.object({ folderId: p.folderId }),
        transform: (_, input) => tx.folderId(input),
      },
      rename: {
        command: 'set_folder_name',
        description: 'Rename folder',
        params: z.object({ folderId: p.folderId, folderName: p.name }),
        transform: (_, input) => ({
          folder_id: input.folderId as string,
          folder_name: input.folderName as string,
        }),
      },
      set_whois: {
        command: 'set_folder_whois',
        description: 'Set WHOIS for all domains in folder',
        params: z.object({ folderId: p.folderId, contactId: p.contactId }),
        transform: (_, input) => ({
          folder_id: input.folderId as string,
          contact_id: input.contactId as string,
        }),
      },
      set_ns: {
        command: 'set_folder_ns',
        description: 'Set nameservers for folder',
        params: z.object({ folderId: p.folderId, nameservers: p.nameservers }),
        transform: (_, input) => tx.folderNs(input),
      },
      set_parking: {
        command: 'set_folder_parking',
        description: 'Enable parking for folder',
        params: z.object({ folderId: p.folderId }),
        transform: (_, input) => tx.folderId(input),
      },
      set_forwarding: {
        command: 'set_folder_forwarding',
        description: 'Set forwarding for folder',
        params: z.object({ folderId: p.folderId, forwardUrl: p.url }),
        transform: (_, input) => ({
          folder_id: input.folderId as string,
          forward_url: input.forwardUrl as string,
        }),
      },
      set_stealth: {
        command: 'set_folder_stealth',
        description: 'Set stealth forwarding for folder',
        params: z.object({ folderId: p.folderId, stealthUrl: p.url }),
        transform: (_, input) => ({
          folder_id: input.folderId as string,
          stealth_url: input.stealthUrl as string,
        }),
      },
      set_hosting: {
        command: 'set_folder_hosting',
        description: 'Set hosting for folder',
        params: z.object({ folderId: p.folderId, options: z.record(z.string(), z.string()) }),
        transform: (_, input) => {
          const params: ApiParams = { folder_id: input.folderId as string };
          for (const [k, v] of Object.entries(input.options as Record<string, string>)) {
            params[k] = v;
          }
          return params;
        },
      },
      set_dns: {
        command: 'set_folder_dns',
        description: 'Set DNS for folder',
        params: z.object({
          folderId: p.folderId,
          mainRecords: z.array(dnsRecord).optional(),
          subdomainRecords: z.array(subdomainRecord).optional(),
        }),
        transform: (_, input) => tx.folderDns(input),
      },
      set_dns2: {
        command: 'set_folder_dns2',
        description: 'Set DNS2 for folder',
        params: z.object({
          folderId: p.folderId,
          mainRecords: z.array(dnsRecord).optional(),
          subdomainRecords: z.array(subdomainRecord).optional(),
        }),
        transform: (_, input) => tx.folderDns(input),
      },
      set_email_forward: {
        command: 'set_folder_email_forward',
        description: 'Set email forwarding for folder',
        params: z.object({ folderId: p.folderId, email: p.email }),
        transform: (_, input) => ({
          folder_id: input.folderId as string,
          email: input.email as string,
        }),
      },
      set_renew_option: {
        command: 'set_folder_renew_option',
        description: 'Set renewal option for folder',
        params: z.object({ folderId: p.folderId, renewOption: p.renewOption }),
        transform: (_, input) => ({
          folder_id: input.folderId as string,
          renew_option: input.renewOption as string,
        }),
      },
      clear_settings: {
        command: 'set_clear_folder_setting',
        description: 'Clear all folder settings',
        params: z.object({ folderId: p.folderId }),
        transform: (_, input) => tx.folderId(input),
      },
    },
  },

  // 8. ACCOUNT - Account management & defaults
  {
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
  },

  // 9. AFTERMARKET - Auctions, backorders, marketplace
  {
    name: 'dynadot_aftermarket',
    description: `Aftermarket: auctions, backorders, expired domains, marketplace listings. Browse domains: ${DYNADOT_URLS.home}`,
    actions: {
      // Backorders
      backorder_add: {
        command: 'add_backorder_request',
        description: 'Add domain to backorder list',
        params: z.object({ domain: p.domain }),
      },
      backorder_delete: {
        command: 'delete_backorder_request',
        description: 'Remove from backorder list',
        params: z.object({ domain: p.domain }),
      },
      backorder_list: {
        command: 'backorder_request_list',
        description: 'List backorder requests',
      },
      // Regular auctions
      auction_list_open: {
        command: 'get_open_auctions',
        description: 'List open auctions',
        params: z.object({ currency: p.currency.optional() }),
      },
      auction_details: {
        command: 'get_auction_details',
        description: 'Get auction details',
        params: z.object({ auctionId: p.auctionId }),
        transform: (_, input) => ({ auction_id: input.auctionId as string }),
      },
      auction_bids: {
        command: 'get_auction_bids',
        description: 'Get auction bids',
        params: z.object({ auctionId: p.auctionId }),
        transform: (_, input) => ({ auction_id: input.auctionId as string }),
      },
      auction_bid: {
        command: 'place_auction_bid',
        description: 'Place auction bid',
        params: z.object({
          auctionId: p.auctionId,
          bidAmount: p.amount,
          currency: p.currency.optional(),
        }),
        transform: (_, input) => ({
          auction_id: input.auctionId as string,
          bid_amount: input.bidAmount as number,
          currency: (input.currency as string) || 'USD',
        }),
      },
      auction_list_closed: {
        command: 'get_closed_auctions',
        description: 'List closed auctions',
      },
      // Backorder auctions
      backorder_auction_list_open: {
        command: 'get_open_backorder_auctions',
        description: 'List open backorder auctions',
        params: z.object({ currency: p.currency.optional() }),
      },
      backorder_auction_details: {
        command: 'get_backorder_auction_details',
        description: 'Get backorder auction details',
        params: z.object({ auctionId: p.auctionId }),
        transform: (_, input) => ({ auction_id: input.auctionId as string }),
      },
      backorder_auction_bid: {
        command: 'place_backorder_auction_bid',
        description: 'Place backorder auction bid',
        params: z.object({ auctionId: p.auctionId, bidAmount: p.amount }),
        transform: (_, input) => ({
          auction_id: input.auctionId as string,
          bid_amount: input.bidAmount as number,
        }),
      },
      backorder_auction_list_closed: {
        command: 'get_closed_backorder_auctions',
        description: 'List closed backorder auctions',
      },
      // Expired closeouts
      expired_list: {
        command: 'get_expired_closeout_domains',
        description: 'List expired closeout domains',
        params: z.object({ currency: p.currency.optional() }),
      },
      expired_buy: {
        command: 'buy_expired_closeout_domain',
        description: 'Buy expired closeout domain',
        params: z.object({ domain: p.domain, currency: p.currency.optional() }),
      },
      // Marketplace
      listings: {
        command: 'get_listings',
        description: 'Get marketplace listings',
        params: z.object({ currency: p.currency.optional() }),
      },
      listing_details: {
        command: 'get_listing_item',
        description: 'Get listing details',
        params: z.object({ domain: p.domain }),
      },
      buy_now: {
        command: 'buy_it_now',
        description: 'Buy domain from marketplace',
        params: z.object({ domain: p.domain, currency: p.currency.optional() }),
      },
      set_for_sale: {
        command: 'set_for_sale',
        description: 'List domain for sale',
        params: z.object({ domain: p.domain, price: p.amount, currency: p.currency.optional() }),
      },
      // Marketplace confirmations
      afternic_confirm: {
        command: 'set_afternic_confirm_action',
        description: 'Confirm/decline Afternic action',
        params: z.object({ domain: p.domain, action: p.confirmAction }),
      },
      sedo_confirm: {
        command: 'set_sedo_confirm_action',
        description: 'Confirm/decline Sedo action',
        params: z.object({ domain: p.domain, action: p.confirmAction }),
      },
    },
  },

  // 10. ORDER - Orders and misc
  {
    name: 'dynadot_order',
    description: 'Orders, coupons, processing status, reseller operations',
    actions: {
      list: {
        command: 'order_list',
        description: 'List recent orders',
      },
      status: {
        command: 'get_order_status',
        description: 'Get order status',
        params: z.object({ orderId: p.orderId }),
        transform: (_, input) => ({ order_id: input.orderId as string }),
      },
      is_processing: {
        command: 'is_processing',
        description: 'Check if operations pending',
      },
      coupons: {
        command: 'list_coupons',
        description: 'List available coupons',
      },
      reseller_verification: {
        command: 'set_reseller_contact_whois_verification_status',
        description: 'Set reseller WHOIS verification status',
        params: z.object({
          contactId: p.contactId,
          status: z.enum(['verified', 'unverified']),
        }),
        transform: (_, input) => ({
          contact_id: input.contactId as string,
          status: input.status as string,
        }),
      },
    },
  },
];
