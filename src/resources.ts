import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getClient } from './client.js';

export function registerAllResources(server: McpServer): void {
  // Account information resource
  server.resource(
    'Account Information',
    'account://info',
    {
      description: 'Current Dynadot account info: balance, email, limits',
      mimeType: 'application/json',
    },
    async () => {
      const client = getClient();
      const result = await client.execute('account_info');
      return {
        contents: [
          {
            uri: 'account://info',
            mimeType: 'application/json',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  // Domains list resource
  server.resource(
    'My Domains',
    'domains://list',
    {
      description: 'All domains in your Dynadot account with expiry dates',
      mimeType: 'application/json',
    },
    async () => {
      const client = getClient();
      const result = await client.execute('list_domain');
      return {
        contents: [
          {
            uri: 'domains://list',
            mimeType: 'application/json',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  // Contacts list resource
  server.resource(
    'My Contacts',
    'contacts://list',
    {
      description: 'All WHOIS contacts in your Dynadot account',
      mimeType: 'application/json',
    },
    async () => {
      const client = getClient();
      const result = await client.execute('contact_list');
      return {
        contents: [
          {
            uri: 'contacts://list',
            mimeType: 'application/json',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  // Folders list resource
  server.resource(
    'My Folders',
    'folders://list',
    {
      description: 'All folders in your Dynadot account',
      mimeType: 'application/json',
    },
    async () => {
      const client = getClient();
      const result = await client.execute('folder_list');
      return {
        contents: [
          {
            uri: 'folders://list',
            mimeType: 'application/json',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );
}
