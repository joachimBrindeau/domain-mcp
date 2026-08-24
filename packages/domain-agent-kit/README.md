# domain-agent-kit

A portable Agent Plugins v1 package for domain research, portfolio audits, DNS diagnosis and configuration, renewal management, setup, and health checks. It bundles the [`domain-mcp`](https://www.npmjs.com/package/domain-mcp) server declaration and one canonical workflow skill.

> Unofficial: this project is not affiliated with or endorsed by Dynadot.

## Source of truth

```text
plugin.json
mcp.json
skills/domain-management/
├── SKILL.md
├── workflows/
│   ├── research.md
│   ├── audit.md
│   ├── dns.md
│   ├── renewals.md
│   ├── setup.md
│   └── status.md
└── references/
    ├── dns.md
    ├── safety.md
    └── troubleshooting.md
```

The previous custom agents and slash commands were absorbed semantically into this skill and removed. Hosts activate the skill from natural-language intent. There is no parallel workflow body to drift.

## Portable MCP configuration

Root `mcp.json` launches `scripts/launch-domain-mcp.sh`, which runs the exact supported `domain-mcp@3.0.0`. Supply `DYNADOT_API_KEY` through the host's protected environment or secret store. Optional `DYNADOT_SANDBOX=true` selects sandbox. Credentials are never stored by this plugin.

After configuration, restart or reload the host, then ask for a domain-agent-kit health check. The status workflow verifies package files, runtime, MCP discovery, and read-only account authentication.

## Claude Code adapter

`.claude-plugin/plugin.json`, `.mcp.json`, and `hooks/hooks.json` remain only as thin Claude Code adapters:

- `.mcp.json` routes to the shared launcher.
- The sole hook asks for native confirmation on selected irreversible operations.
- No `agents/` or `commands/` directory remains; Claude uses the same portable skill as every other host.

The hook is optional defense in depth. The canonical approval and read-back contract is `skills/domain-management/references/safety.md`.

## Development

```bash
pnpm --filter domain-agent-kit test
hermes plugins doctor packages/domain-agent-kit --ci
```

The package check validates portable manifests, skill links, removal of duplicate workflow sources, adapter drift, shell syntax, and destructive-hook behavior.

## License

MIT. See [LICENSE](LICENSE).
