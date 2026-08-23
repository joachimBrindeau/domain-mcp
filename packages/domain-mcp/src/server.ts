import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAllPrompts } from './prompts.js';
import { registerAllTools } from './register.js';
import { registerAllResources } from './resources.js';

export function createDomainMcpServer(version: string): McpServer {
  const server = new McpServer({ name: 'domain-mcp', version });

  registerAllTools(server);
  registerAllResources(server);
  registerAllPrompts(server);

  return server;
}
