import { z } from 'zod';
import type { CompositeTool } from './common.js';
import { p } from './common.js';

export const nameserverTool: CompositeTool = {
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
};
