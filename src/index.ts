#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { EXAMPLE_CONFIG, GITHUB_URL } from './constants.js';
import { registerAllTools } from './register.js';
import { registerAllResources } from './resources.js';

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
  writeStdoutLine('This is not a CLI tool - it runs as an MCP server via stdin/stdout.');
  writeStdoutLine('');
  writeStdoutLine('Setup instructions:');
  writeStdoutLine(`  ${GITHUB_URL}#quick-installation`);
  writeStdoutLine('');
  writeStdoutLine('Example configuration:');
  writeStdoutLine(JSON.stringify(EXAMPLE_CONFIG, null, 2));
  process.exit(0);
}

function showUsageAndExit(): never {
  writeStderrLine('domain-mcp is an MCP server, not a CLI tool.');
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

// Detect if running interactively in a terminal
// process.stdin.isTTY is undefined when piped, true when interactive
if (process.stdin.isTTY === true) {
  showUsageAndExit();
}

const server = new McpServer({
  name: 'domain-mcp',
  version: packageJson.version,
});

registerAllTools(server);
registerAllResources(server);

const transport = new StdioServerTransport();
await server.connect(transport);
