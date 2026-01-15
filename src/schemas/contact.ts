import { z } from 'zod';
import type { CompositeTool } from './common.js';
import { p, tx, contactFields } from './common.js';
import type { ApiParams } from '../client.js';

// Helper for contact settings transforms (EU/LV/LT)
const settingsTransform = (_: string, input: Record<string, unknown>): ApiParams => {
  const params: ApiParams = { contact_id: input.contactId as string };
  for (const [k, v] of Object.entries(input.settings as Record<string, string>)) {
    params[k] = v;
  }
  return params;
};

export const contactTool: CompositeTool = {
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
      transform: settingsTransform,
    },
    set_lv_setting: {
      command: 'set_contact_lv_setting',
      description: 'Set Latvia contact settings',
      params: z.object({ contactId: p.contactId, settings: z.record(z.string(), z.string()) }),
      transform: settingsTransform,
    },
    set_lt_setting: {
      command: 'set_contact_lt_setting',
      description: 'Set Lithuania contact settings',
      params: z.object({ contactId: p.contactId, settings: z.record(z.string(), z.string()) }),
      transform: settingsTransform,
    },
  },
};
