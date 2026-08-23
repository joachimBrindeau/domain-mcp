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
  if (manifest.tools?.length !== 13) {
    throw new Error(`Expected 13 tool schemas, got ${manifest.tools?.length ?? 0}`);
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
    env: { ...process.env, DYNADOT_API_KEY: 'metadata-only' },
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
    console.log(`Verified ${result.tools.length} MCP tools from ${bundlePath}`);
  } finally {
    await client.close();
  }
} finally {
  await rm(extracted, { recursive: true, force: true });
}
