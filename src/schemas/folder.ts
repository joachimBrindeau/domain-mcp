import { z } from 'zod';
import type { ApiParams } from '../client.js';
import type { CompositeTool } from './common.js';
import { dnsRecord, p, subdomainRecord, tx } from './common.js';

export const folderTool: CompositeTool = {
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
};
