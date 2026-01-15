import { z } from 'zod';
import type { CompositeTool } from './common.js';
import { p } from './common.js';

export const orderTool: CompositeTool = {
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
};
