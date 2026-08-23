#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const packageRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const bundlePath = resolve(process.argv[2] ?? join(packageRoot, 'domain-mcp.mcpb'));
const extracted = await mkdtemp(join(tmpdir(), 'domain-mcp-mcpb-test-'));

try {
  execFileSync('unzip', ['-q', bundlePath, '-d', extracted]);
  const manifest = JSON.parse(await readFile(join(extracted, 'manifest.json'), 'utf8'));
  await readFile(join(extracted, manifest.icon));
  if (manifest.tools?.length !== 13) {
    throw new Error(`Expected 13 tool schemas, got ${manifest.tools?.length ?? 0}`);
  }
  const expectedToolNames = [
    'domains.manage',
    'domains.settings.manage',
    'dns.manage',
    'nameservers.manage',
    'transfers.manage',
    'contacts.manage',
    'folders.manage',
    'account.manage',
    'aftermarket.manage',
    'orders.manage',
    'domains.availability.check',
    'domains.ideas.generate',
    'server.help',
  ];
  if (
    JSON.stringify(manifest.tools.map((tool) => tool.name)) !== JSON.stringify(expectedToolNames)
  ) {
    throw new Error('Bundle tool names do not use the expected category-oriented dot notation');
  }
  if (manifest.user_config?.dynadot_api_key?.required !== false) {
    throw new Error('Bundle configuration must allow metadata and help access without credentials');
  }
  if (!manifest.icon) {
    throw new Error('Bundle manifest must declare an explicit icon');
  }
  const incompleteTools = manifest.tools.filter(
    (tool) =>
      !tool.outputSchema ||
      !tool.annotations ||
      Object.values(tool.inputSchema?.properties ?? {}).some((parameter) => !parameter.description),
  );
  if (incompleteTools.length > 0) {
    throw new Error(
      `Incomplete quality metadata for: ${incompleteTools.map((tool) => tool.name).join(', ')}`,
    );
  }

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [join(extracted, manifest.server.entry_point)],
    env: { ...process.env, DYNADOT_API_KEY: '' },
    stderr: 'pipe',
  });
  const client = new Client({ name: 'mcpb-test', version: '1.0.0' });
  await client.connect(transport);
  try {
    const result = await client.listTools();
    if (result.tools.length !== manifest.tools.length) {
      throw new Error(
        `Bundle exposes ${result.tools.length} tools but declares ${manifest.tools.length}`,
      );
    }
    const help = await client.callTool({ name: 'server.help', arguments: { query: 'tools' } });
    if (help.isError) {
      throw new Error('Credential-free local help call failed');
    }
    const domain = await client.callTool({
      name: 'domains.manage',
      arguments: { operation: 'list' },
    });
    if (!domain.isError || !JSON.stringify(domain.structuredContent).includes('API key required')) {
      throw new Error(
        'Credential-free registrar call must return an actionable configuration error',
      );
    }
    console.log(`Verified ${result.tools.length} MCP tools from ${bundlePath}`);
  } finally {
    await client.close();
  }
} finally {
  await rm(extracted, { recursive: true, force: true });
}
