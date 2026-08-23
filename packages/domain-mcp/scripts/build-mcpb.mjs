#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ZipArchive } from 'archiver';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = resolve(packageRoot, '..', '..');
const outputPath = resolve(process.argv[2] ?? join(packageRoot, 'domain-mcp.mcpb'));
const stage = await mkdtemp(join(tmpdir(), 'domain-mcp-mcpb-'));

try {
  run('pnpm', ['run', 'build'], packageRoot);

  const packageJson = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'));
  const manifest = JSON.parse(await readFile(join(packageRoot, 'mcpb', 'manifest.json'), 'utf8'));
  manifest.version = packageJson.version;

  const tools = await listTools();
  const strictManifest = { ...manifest, tools_generated: true };
  const smitheryManifest = { ...manifest, tools };
  delete smitheryManifest.tools_generated;

  await Promise.all([
    cp(join(packageRoot, 'dist'), join(stage, 'dist'), { recursive: true }),
    cp(join(packageRoot, 'LICENSE'), join(stage, 'LICENSE')),
    cp(join(packageRoot, 'README.md'), join(stage, 'README.md')),
    cp(join(repositoryRoot, 'icon.png'), join(stage, 'icon.png')),
    writeFile(join(stage, 'manifest.json'), `${JSON.stringify(strictManifest, null, 2)}\n`),
  ]);

  const runtimePackage = {
    name: packageJson.name,
    version: packageJson.version,
    private: true,
    type: packageJson.type,
    dependencies: packageJson.dependencies,
  };
  await writeFile(join(stage, 'package.json'), `${JSON.stringify(runtimePackage, null, 2)}\n`);

  run(
    'env',
    [
      '-i',
      `PATH=${process.env.PATH}`,
      `HOME=${process.env.HOME}`,
      'npm',
      '--userconfig=/dev/null',
      '--globalconfig=/tmp/domain-mcp-empty-npmrc',
      'install',
      '--omit=dev',
      '--omit=optional',
      '--ignore-scripts',
    ],
    stage,
  );
  run('mcpb', ['validate', join(stage, 'manifest.json')], stage);

  // Smithery currently requires full MCP Tool objects, while MCPB v0.3 only
  // permits tool names/descriptions. Validate the standards-compliant manifest
  // first, then replace it in the Smithery upload artifact with live schemas.
  await writeFile(join(stage, 'manifest.json'), `${JSON.stringify(smitheryManifest, null, 2)}\n`);
  await archive(stage, outputPath);
  console.log(outputPath);
} finally {
  await rm(stage, { recursive: true, force: true });
}

function run(command, args, cwd) {
  execFileSync(command, args, { cwd, stdio: 'inherit' });
}

async function listTools() {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [join(packageRoot, 'dist', 'index.js')],
    env: { ...process.env, DYNADOT_API_KEY: 'metadata-only' },
    stderr: 'pipe',
  });
  const client = new Client({ name: 'mcpb-builder', version: '1.0.0' });
  await client.connect(transport);
  try {
    const result = await client.listTools();
    return result.tools.map(({ name, description, inputSchema, outputSchema, annotations }) => ({
      name,
      description,
      inputSchema,
      outputSchema,
      annotations,
    }));
  } finally {
    await client.close();
  }
}

async function archive(source, destination) {
  await mkdir(dirname(destination), { recursive: true });
  await new Promise((resolvePromise, reject) => {
    const output = createWriteStream(destination);
    const zip = new ZipArchive({ zlib: { level: 9 } });
    output.on('close', resolvePromise);
    output.on('error', reject);
    zip.on('error', reject);
    zip.pipe(output);
    zip.directory(source, false);
    zip.finalize();
  });
}
