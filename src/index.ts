#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAllTools } from './register.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { GITHUB_URL, EXAMPLE_CONFIG } from './constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8')
);

function showHelp(): never {
  console.log(`domain-mcp v${packageJson.version}`);
  console.log('');
  console.log('A Domain MCP server for AI-powered Dynadot domain management.');
  console.log('');
  console.log('This is not a CLI tool - it runs as an MCP server via stdin/stdout.');
  console.log('');
  console.log('Setup instructions:');
  console.log(`  ${GITHUB_URL}#quick-installation`);
  console.log('');
  console.log('Example configuration:');
  console.log(JSON.stringify(EXAMPLE_CONFIG, null, 2));
  process.exit(0);
}

function showUsageAndExit(): never {
  console.error('domain-mcp is an MCP server, not a CLI tool.');
  console.error('');
  console.error('Run with --help for usage information.');
  console.error('');
  console.error('Quick start:');
  console.error(`  ${GITHUB_URL}#quick-installation`);
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  showHelp();
}

if (args.includes('--version') || args.includes('-v')) {
  console.log(packageJson.version);
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

const transport = new StdioServerTransport();
await server.connect(transport);
