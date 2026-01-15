import { z } from 'zod';
import type { ApiParams } from '../client.js';

// Composite tool definition
export interface CompositeTool {
  name: string;
  description: string;
  actions: Record<string, ActionDefinition>;
}

export interface ActionDefinition {
  command: string;
  description: string;
  params?: z.ZodObject<z.ZodRawShape>;
  transform?: (action: string, input: Record<string, unknown>) => ApiParams;
}

// Reusable param schemas
export const p = {
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
export const dnsRecord = z.object({
  type: z.string().describe('Record type (A, AAAA, CNAME, MX, TXT)'),
  value: z.string().describe('Record value'),
  ttl: z.number().optional().describe('TTL in seconds'),
  priority: z.number().optional().describe('Priority (for MX)'),
});

export const subdomainRecord = z.object({
  subdomain: z.string().describe('Subdomain name'),
  type: z.string().describe('Record type'),
  value: z.string().describe('Record value'),
  ttl: z.number().optional().describe('TTL in seconds'),
  priority: z.number().optional().describe('Priority (for MX)'),
});

// Contact schema
export const contactFields = z.object({
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
// Helper for processing DNS records (main and subdomain)
const processDnsRecords = (
  params: ApiParams,
  mainRecords?: Array<{ type: string; value: string; ttl?: number; priority?: number }>,
  subRecords?: Array<{ subdomain: string; type: string; value: string; ttl?: number; priority?: number }>
): void => {
  mainRecords?.forEach((r, i) => {
    params[`main_record_type${i}`] = r.type;
    params[`main_record${i}`] = r.value;
    if (r.ttl) params[`main_record_ttl${i}`] = r.ttl;
    if (r.priority !== undefined) params[`main_record_distance${i}`] = r.priority;
  });

  subRecords?.forEach((r, i) => {
    params[`subdomain${i}`] = r.subdomain;
    params[`sub_record_type${i}`] = r.type;
    params[`sub_record${i}`] = r.value;
    if (r.ttl) params[`sub_record_ttl${i}`] = r.ttl;
    if (r.priority !== undefined) params[`sub_record_distance${i}`] = r.priority;
  });
};

export const tx = {
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
    const main = input.mainRecords as Array<{ type: string; value: string; ttl?: number; priority?: number }> | undefined;
    const sub = input.subdomainRecords as Array<{ subdomain: string; type: string; value: string; ttl?: number; priority?: number }> | undefined;
    processDnsRecords(params, main, sub);
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
    const main = input.mainRecords as Array<{ type: string; value: string; ttl?: number; priority?: number }> | undefined;
    const sub = input.subdomainRecords as Array<{ subdomain: string; type: string; value: string; ttl?: number; priority?: number }> | undefined;
    processDnsRecords(params, main, sub);
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
    const main = input.mainRecords as Array<{ type: string; value: string; ttl?: number; priority?: number }> | undefined;
    const sub = input.subdomainRecords as Array<{ subdomain: string; type: string; value: string; ttl?: number; priority?: number }> | undefined;
    processDnsRecords(params, main, sub);
    return params;
  },
};
