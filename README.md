[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/joachimbrindeau-domain-mcp-badge.png)](https://mseep.ai/app/joachimbrindeau-domain-mcp)

# domain-mcp

A Claude / MCP toolkit for managing domains via Dynadot. This monorepo contains:

| Package | Description | Distribution |
|---|---|---|
| [`domain-mcp`](packages/domain-mcp) | MCP server wrapping ~108 Dynadot API actions as 10 composite tools | [npm](https://www.npmjs.com/package/domain-mcp) |
| [`domain-agent-kit`](packages/domain-agent-kit) | Claude Code plugin: agents, commands, skills for domain workflows | Claude Code marketplace |

## Quick start

**Use the MCP server in Claude / Cursor / any MCP client:** see [`packages/domain-mcp/README.md`](packages/domain-mcp/README.md).

**Use the Claude Code plugin:** see [`packages/domain-agent-kit/README.md`](packages/domain-agent-kit/README.md).

## Development

```bash
pnpm install            # installs all workspace deps
pnpm test               # runs domain-mcp tests
pnpm build              # builds domain-mcp
pnpm check              # biome across repo
```

See [`CLAUDE.md`](CLAUDE.md) for the monorepo layout and [`packages/domain-mcp/CLAUDE.md`](packages/domain-mcp/CLAUDE.md) for package-specific guidance.

## License

MIT
