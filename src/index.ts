#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAllTools } from './register.js';

// Detect if running interactively in a terminal
if (process.stdin.isTTY) {
  console.error('domain-mcp is an MCP server, not a CLI tool.');
  console.error('');
  console.error('To use it, add this configuration to your MCP client:');
  console.error('');
  console.error(JSON.stringify({
    mcpServers: {
      'domain-mcp': {
        command: 'npx',
        args: ['-y', 'domain-mcp'],
        env: {
          DYNADOT_API_KEY: 'your-api-key-here'
        }
      }
    }
  }, null, 2));
  console.error('');
  console.error('For more information, visit:');
  console.error('https://github.com/joachimBrindeau/domain-mcp');
  process.exit(1);
}

const server = new McpServer({
  name: 'domain-mcp',
  version: '1.0.2',
});

registerAllTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
