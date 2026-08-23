#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { EXAMPLE_CONFIG, GITHUB_URL } from './constants.js';
import { startHttpServer } from './http-server.js';
import { createDomainMcpServer } from './server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

function writeStdoutLine(line: string): void {
  process.stdout.write(`${line}\n`);
}

function writeStderrLine(line: string): void {
  process.stderr.write(`${line}\n`);
}

function showHelp(): never {
  writeStdoutLine(`domain-mcp v${packageJson.version}`);
  writeStdoutLine('');
  writeStdoutLine('A Domain MCP server for AI-powered Dynadot domain management.');
  writeStdoutLine('');
  writeStdoutLine('Transports: stdio (default) or Streamable HTTP.');
  writeStdoutLine('');
  writeStdoutLine('Options:');
  writeStdoutLine('  --stdio                    Use stdio transport (default)');
  writeStdoutLine('  --http                     Use Streamable HTTP transport');
  writeStdoutLine('  --host <host>              HTTP bind host (default: 127.0.0.1)');
  writeStdoutLine('  --port <port>              HTTP bind port (default: 8102)');
  writeStdoutLine('  --allow-unauthenticated    Disable auth on loopback only');
  writeStdoutLine('');
  writeStdoutLine('Setup instructions:');
  writeStdoutLine(`  ${GITHUB_URL}#quick-installation`);
  writeStdoutLine('');
  writeStdoutLine('Example configuration:');
  writeStdoutLine(JSON.stringify(EXAMPLE_CONFIG, null, 2));
  process.exit(0);
}

function showUsageAndExit(): never {
  writeStderrLine('domain-mcp is an MCP server. Use --http or pipe it as a stdio server.');
  writeStderrLine('');
  writeStderrLine('Run with --help for usage information.');
  writeStderrLine('');
  writeStderrLine('Quick start:');
  writeStderrLine(`  ${GITHUB_URL}#quick-installation`);
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  showHelp();
}

if (args.includes('--version') || args.includes('-v')) {
  writeStdoutLine(packageJson.version);
  process.exit(0);
}

function optionValue(name: string, fallback: string): string {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  const value = args[index + 1];
  if (!value || value.startsWith('-')) throw new Error(`${name} requires a value`);
  return value;
}

const useHttp = args.includes('--http');
if (useHttp && args.includes('--stdio')) throw new Error('Choose either --http or --stdio');

if (useHttp) {
  const host = optionValue('--host', '127.0.0.1');
  const portText = optionValue('--port', '8102');
  const port = Number(portText);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid --port value');
  const sessionIdleTimeoutMs = Number(
    process.env.DOMAIN_MCP_SESSION_IDLE_TIMEOUT_MS ?? 30 * 60 * 1000,
  );

  const running = await startHttpServer({
    host,
    port,
    version: packageJson.version,
    authToken: process.env.DOMAIN_MCP_AUTH_TOKEN,
    allowUnauthenticated: args.includes('--allow-unauthenticated'),
    allowedHosts: process.env.DOMAIN_MCP_ALLOWED_HOSTS?.split(',').map((value) => value.trim()),
    allowedOrigins: process.env.DOMAIN_MCP_ALLOWED_ORIGINS?.split(',').map((value) => value.trim()),
    sessionIdleTimeoutMs,
  });
  writeStderrLine(`domain-mcp listening at ${running.url}`);

  let shuttingDown = false;
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    await running.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} else {
  // Detect if running interactively in a terminal
  // process.stdin.isTTY is undefined when piped, true when interactive
  if (process.stdin.isTTY === true) showUsageAndExit();

  const server = createDomainMcpServer(packageJson.version);
  await server.connect(new StdioServerTransport());
}
