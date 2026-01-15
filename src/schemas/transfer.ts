import { z } from 'zod';
import type { CompositeTool } from './common.js';
import { p } from './common.js';

export const transferTool: CompositeTool = {
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
};
