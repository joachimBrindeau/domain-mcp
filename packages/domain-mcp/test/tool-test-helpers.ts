import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export type ToolResult = {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
};

type RegisteredTool = {
  handler: (input: Record<string, unknown>) => Promise<ToolResult>;
};

export type PromptResult = {
  messages: Array<{ role: string; content: { type: string; text: string } }>;
};

type RegisteredPrompt = {
  callback: (args?: Record<string, string>) => Promise<PromptResult>;
};

export type ResourceResult = {
  contents: Array<{ uri: string; mimeType: string; text: string }>;
};

type RegisteredResource = {
  readCallback: () => Promise<ResourceResult>;
};

export function getRegisteredToolHandler(
  server: McpServer,
  name: string,
): RegisteredTool['handler'] {
  const tools = (server as unknown as { _registeredTools: Record<string, RegisteredTool> })
    ._registeredTools;
  const registered = tools[name];
  if (!registered) throw new Error(`${name} not registered`);
  return registered.handler;
}

export function getRegisteredPromptCallback(
  server: McpServer,
  name: string,
): RegisteredPrompt['callback'] {
  const prompts = (server as unknown as { _registeredPrompts: Record<string, RegisteredPrompt> })
    ._registeredPrompts;
  const registered = prompts[name];
  if (!registered) throw new Error(`${name} not registered`);
  return registered.callback;
}

export function getRegisteredResourceCallback(
  server: McpServer,
  uri: string,
): RegisteredResource['readCallback'] {
  const resources = (
    server as unknown as { _registeredResources: Record<string, RegisteredResource> }
  )._registeredResources;
  const registered = resources[uri];
  if (!registered) throw new Error(`${uri} not registered`);
  return registered.readCallback;
}
