<div align="center">

# domain-mcp: Domain Management MCP Server

**Manage Dynadot domains, DNS, renewals, transfers, and WHOIS from Claude, Cursor, or any MCP client.**

<br />

[![Star this repo](https://img.shields.io/github/stars/joachimBrindeau/domain-mcp?style=for-the-badge&logo=github&label=%E2%AD%90%20Star%20this%20repo&color=yellow)](https://github.com/joachimBrindeau/domain-mcp/?tab=stars)

<br />

[![npm](https://img.shields.io/npm/v/domain-mcp?style=for-the-badge&logo=npm&color=CB3837)](https://www.npmjs.com/package/domain-mcp)
&nbsp;
[![CI](https://img.shields.io/github/actions/workflow/status/joachimBrindeau/domain-mcp/ci.yml?branch=main&style=for-the-badge&logo=githubactions&label=CI)](https://github.com/joachimBrindeau/domain-mcp/actions/workflows/ci.yml)
&nbsp;
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

---

Skip the registrar dashboard and brittle one-off scripts. `domain-mcp` groups 108 Dynadot API actions into 10 MCP tools you can call from an AI client.

[Quick Start](#quick-start) · [How It Works](#how-domain-mcp-works) · [Features](#domain-management-features) · [Packages](#whats-inside) · [Contributing](#contributing)

</div>

## Why manage domains through MCP?

Registrar APIs cover dozens of jobs, but each command has its own parameters, response shape, and edge cases. Working with the API directly takes time and leaves plenty of room for mistakes.

`domain-mcp` gives your AI client a smaller, typed toolset. Ask it to check availability, update DNS, review renewals, or manage a portfolio without memorizing Dynadot's API.

| Without domain-mcp | With domain-mcp |
|---|---|
| Search API docs for every task | Describe the outcome in plain language |
| Build and maintain registrar scripts | Use the same MCP tools from supported clients |
| Handle inconsistent response envelopes | Get results in a consistent format |
| Expose every API command as a separate tool | Keep context small with 10 composite tools |

## Quick start

You need Node.js 18 or newer and a [Dynadot API key](https://www.dynadot.com/account/domain/setting/api.html?s9F6L9F7U8Q9U8Z8v).

Add the server to your MCP client:

```json
{
  "mcpServers": {
    "domain-mcp": {
      "command": "npx",
      "args": ["-y", "domain-mcp"],
      "env": {
        "DYNADOT_API_KEY": "your-api-key"
      }
    }
  }
}
```

Restart the client, then try:

> List my domains that expire in the next 60 days.

For client-specific setup, shared HTTP transport, environment options, and troubleshooting, read the [domain-mcp package guide](packages/domain-mcp/README.md).

## How domain-mcp works

```text
You describe a domain task
          │
          ▼
Claude, Cursor, or another MCP client
          │  selects a tool and operation
          ▼
domain-mcp validates and transforms the request
          │  calls the Dynadot API
          ▼
The result returns to your AI client
```

The server groups related operations into composite tools, so clients load a small set of tools instead of more than 100 separate definitions.

## Domain management features

| Area | What you can do |
|---|---|
| Domains | Search, register, renew, delete, lock, push, and inspect domains |
| DNS | Read and update DNS records, forwarding, parking, and email settings |
| Nameservers | Create, edit, list, and assign nameservers |
| Transfers | Start transfers, check status, and manage authorization steps |
| Contacts | Create and maintain WHOIS contact records |
| Portfolio | Work with folders, account data, bulk settings, and renewals |
| Aftermarket | List domains, manage auctions, bids, and marketplace operations |
| Agent workflows | Generate domain ideas, run portfolio audits, and diagnose DNS issues |

The server groups Dynadot operations into 10 composite tools, with additional tools for domain checks, name generation, and tool discovery. Zod validates inputs. Responses follow a consistent format, and errors explain what went wrong.

## What's inside

This repository is a pnpm workspace with two related packages:

| Package | Best for | Distribution |
|---|---|---|
| [`domain-mcp`](packages/domain-mcp) | Claude, Cursor, Claude Desktop, Zed, and other MCP clients | [npm](https://www.npmjs.com/package/domain-mcp) |
| [`domain-agent-kit`](packages/domain-agent-kit) | Agent Plugins v1 hosts, including Hermes and Claude Code | Portable plugin with optional Claude safety adapter |

```text
packages/
├── domain-mcp/        # TypeScript MCP server published to npm
└── domain-agent-kit/  # Portable Agent Plugin built on domain-mcp
```

## Domain MCP examples

Once connected, you can ask your client to:

- “Check whether example.com is available and show similar names.”
- “Add an A record for example.com and point it to 203.0.113.10.”
- “Find domains expiring this quarter and group them by urgency.”
- “Enable auto-renew for every unlocked .com domain.”
- “Show the current nameservers and WHOIS contacts for example.com.”

Your client should still ask before destructive or paid operations. The portable plugin defines that approval and read-back contract, and its optional Claude Code adapter adds a native confirmation hook for selected irreversible actions.

## Development

```bash
git clone https://github.com/joachimBrindeau/domain-mcp.git
cd domain-mcp
pnpm install
pnpm test
pnpm build
```

Useful workspace commands:

| Command | Purpose |
|---|---|
| `pnpm test` | Run the domain-mcp test suite |
| `pnpm typecheck` | Check TypeScript without emitting files |
| `pnpm check` | Run Biome across the repository |
| `pnpm build` | Build the npm package |

See [`CLAUDE.md`](CLAUDE.md) for the workspace map and [`packages/domain-mcp/CLAUDE.md`](packages/domain-mcp/CLAUDE.md) for server architecture and conventions.

## Contributing

Bug reports, API findings, documentation fixes, and focused pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a change.

## License

MIT. See [LICENSE](LICENSE).

---

<div align="center">

Built by [Joachim Brindeau](https://github.com/joachimBrindeau)

<br />

**If domain-mcp saves you time:**

[![Star this repo](https://img.shields.io/github/stars/joachimBrindeau/domain-mcp?style=for-the-badge&logo=github&label=%E2%AD%90%20Star%20this%20repo&color=yellow)](https://github.com/joachimBrindeau/domain-mcp/?tab=stars)

</div>
