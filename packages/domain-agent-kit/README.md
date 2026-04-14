# domain-agent-kit

A Claude Code plugin for Dynadot domain management. Ships three autonomous
agents, five slash commands, an auto-registering MCP server, and a safety
hook on destructive operations — all wrapping the
[`domain-mcp`](https://www.npmjs.com/package/domain-mcp) npm package.

> **Unofficial.** This plugin is not affiliated with or endorsed by Dynadot.
> It's a third-party integration that talks to the public Dynadot API on
> your behalf.

## What's in the box

| Component | What it does |
|---|---|
| **`.mcp.json`** | Auto-registers the plugin's MCP server (named `domain-mcp`) when Claude Code loads the plugin. No manual `claude mcp add`. |
| **`scripts/launch-domain-mcp.sh`** | Wrapper that resolves credentials from `.claude/domain-agent-kit.local.md` (project-scoped) or the shell environment, then execs `npx -y domain-mcp`. |
| **`commands/setup.md`** | `/domain-agent-kit:setup` — collects the Dynadot API key, verifies it against the live API, persists to the project-scoped settings file. |
| **`commands/audit.md`** | `/domain-agent-kit:audit` — dispatches a full portfolio health walk to the `portfolio-auditor` agent. |
| **`commands/brainstorm.md`** | `/domain-agent-kit:brainstorm <description>` — dispatches domain name research to the `domain-research` agent. |
| **`commands/dns.md`** | `/domain-agent-kit:dns <domain>` — routes between DNS troubleshooting (via `dns-diagnostic` agent) and first-time DNS setup (inline). |
| **`commands/renewals.md`** | `/domain-agent-kit:renewals` — interactive renewal management: bucket by urgency, forecast cost, per-domain action with explicit batch approval. |
| **`commands/status.md`** | `/domain-agent-kit:status` — health check that works even when the MCP server is broken. Verifies plugin files, dependencies, credentials, MCP reachability, and account reachability. |
| **`agents/domain-research.md`** | Autonomous brainstorming + trademark screening. Triggers on "find a domain for…", "brainstorm domains about…", etc. |
| **`agents/portfolio-auditor.md`** | Autonomous portfolio health audit across expiration, locks, WHOIS, auto-renewal, DNS. Triggers on "audit my domains", "which domains expire soon", etc. Read-only — recommends fixes, never executes them. |
| **`agents/dns-diagnostic.md`** | Autonomous DNS root-cause analysis for "my site isn't loading", "emails bouncing", "SSL error", etc. Read-only — recommends fixes, never executes them. |
| **`skills/dns-best-practices/`** | Progressive-disclosure reference with copy-pasteable DNS record templates (Google Workspace/Fastmail/ProtonMail MX, SPF/DKIM/DMARC, CAA, subdomain delegation). Auto-activates when the user is configuring DNS. |
| **`hooks/hooks.json`** | Two hooks. **PreToolUse**: native Claude Code confirmation prompt before irreversible operations (delete, push, transfer initiate, aftermarket delist/cancel, contact/folder delete). Fail-closed on parse errors. **SessionStart**: fast credential presence check with a loud warning when neither project settings nor a shell env var is configured. |
| **`references/troubleshooting.md`** | Plugin-specific failure modes: install issues, credential errors, hook script issues, sandbox gotchas, restart requirements. |

## How this differs from the standalone `domain-mcp` package

`domain-mcp` is an MCP server that can be used by any MCP-compatible client
(Claude Code, Cursor, Claude Desktop, Zed, etc.). Use it standalone when you
want the raw tool surface without any opinions.

`domain-agent-kit` is a Claude Code plugin that wraps that same server and
adds:

- **Zero-config install.** The plugin's `.mcp.json` registers the server
  automatically — no manual `claude mcp add`, no editing
  `~/.claude.json`.
- **Agents for the workloads where agents win.** Research, portfolio audit,
  and DNS diagnosis all benefit from isolated context and multi-tool
  autonomous exploration. The plugin ships them pre-configured and
  read-only — agents recommend fixes, the user approves.
- **Slash-command UX.** `/domain-agent-kit:audit` and siblings give
  first-class discoverability that raw MCP prompts lack.
- **Safety hook on destructive ops.** Native Claude Code confirmation
  prompts before anything irreversible, layered on top of Claude's own
  judgment. The hook is fail-closed — parsing errors prompt for
  confirmation, not silent allow.

If you use Cursor, Claude Desktop, or another MCP client, install
`domain-mcp` directly from npm. If you use Claude Code, install this plugin.

## Install

### Local install (development / testing)

```bash
git clone https://github.com/joachimBrindeau/domain-mcp.git
cd domain-mcp
claude --plugin-dir ./domain-agent-kit
```

### Marketplace install

Coming in a future release.

### Prerequisites

- **Node 18+** — the underlying `domain-mcp` binary requires it.
- **`jq`** — used by the destructive-op hook script and the setup command's
  credential verification. Install via `brew install jq` (macOS) or
  `apt install jq` (Debian/Ubuntu).
- **A Dynadot account with API access enabled.** Get an API key at
  [dynadot.com/account/domain/setting/api.html](https://www.dynadot.com/account/domain/setting/api.html?s9F6L9F7U8Q9U8Z8v).
  API access must be explicitly enabled on the account — the key itself
  isn't enough.

Run `/domain-agent-kit:status` after install to verify everything is
wired up correctly.

### MCP server version pinning

The plugin pins the underlying `domain-mcp` npm package to `^1.1.0` via
`DOMAIN_MCP_VERSION` in `.mcp.json`. This means new 1.x releases are
picked up automatically (bug fixes, additive features) but a future 2.x
with breaking tool-shape changes will not silently replace the version
the plugin was built against. To override, edit the `env` block in
`.mcp.json` or export `DOMAIN_MCP_VERSION` in your shell before launching
Claude Code.

## First-run setup

After installing the plugin, run the setup command from Claude Code:

```
/domain-agent-kit:setup
```

The command will:

1. Check if `DYNADOT_API_KEY` is already set in your shell. If so, offer
   to use it.
2. If not, prompt you to paste the key.
3. Verify the key against the live Dynadot API before writing anything
   (parsing the response with `jq`, not substring search).
4. Ask about sandbox mode (default: production — sandbox has capability
   gaps).
5. Write `.claude/domain-agent-kit.local.md` at your **project root**
   (not `~/.claude/`, not the plugin install dir), with `chmod 600`.
6. Make sure `.gitignore` excludes `.claude/*.local.md`.
7. Remind you to restart Claude Code so the MCP server picks up the new
   settings.

**Restart Claude Code after setup.** The MCP server is launched once at
session start — hot reload of settings is not supported.

## Credential flow

The launcher script (`scripts/launch-domain-mcp.sh`) resolves
`DYNADOT_API_KEY` and `DYNADOT_SANDBOX` at MCP server startup in this
precedence:

1. **Project-scoped settings file** — `.claude/domain-agent-kit.local.md`
   in the current working directory. YAML frontmatter with
   `dynadot_api_key` and `dynadot_sandbox` fields.
2. **Shell environment variables** — `DYNADOT_API_KEY` and
   `DYNADOT_SANDBOX` exported by your shell before launching Claude Code.
3. **Fail with an actionable message** — if neither is present, the
   launcher exits 1 and tells you to run `/domain-agent-kit:setup`.

Project settings win over shell environment. You can set a default
`DYNADOT_API_KEY` in your shell `rc` file and override it per-project with
a settings file.

### Settings file schema

```markdown
---
dynadot_api_key: "your-key-here"
dynadot_sandbox: false
---

# Domain Agent Kit — project settings
```

**Always gitignore this file.** The setup command adds the line
automatically; if you create it manually, add `.claude/*.local.md` to your
project's `.gitignore`. Note that `chmod 600` does NOT protect against
cloud sync (Dropbox, iCloud, OneDrive) — a cloud-synced project directory
is not appropriate for storing the settings file with a real key.

## Usage

### Slash commands

```
/domain-agent-kit:setup                    # first-run credential setup
/domain-agent-kit:status                   # plugin health check
/domain-agent-kit:audit                    # full portfolio health walk
/domain-agent-kit:brainstorm <description> # domain name research
/domain-agent-kit:dns <domain>             # diagnose or configure DNS
/domain-agent-kit:renewals                 # interactive renewal management
```

### Natural language (triggers agents)

The three agents activate on description-matching queries without an
explicit slash command:

- `"find me a domain for a task management app"` → `domain-research`
- `"audit my domain portfolio"` → `portfolio-auditor`
- `"my site example.com isn't loading"` → `dns-diagnostic`

For setup and renewal flows, use the slash commands above — those don't
have agents and rely on explicit invocation.

### Raw MCP tools

All underlying MCP tools are available too. Use the `help` tool for
discovery:

```
help query=tools
help query=actions tool=domain
```

**Composite tools** (each takes an `operation` argument — use
`help query=actions tool=<name>` to list operations):

`domain`, `domain_settings`, `dns`, `nameserver`, `transfer`, `contact`,
`folder`, `account`, `aftermarket`, `order`

**Standalone tools**:

`check_domain`, `generate_domain_ideas`, `help`

### MCP resources

- `account://info` — Dynadot account info and balance
- `domains://list` — all domains with expiration dates
- `contacts://list` — all WHOIS contacts
- `folders://list` — all domain folders

## Safety: destructive-op confirmation

The plugin ships a `PreToolUse` hook that surfaces a native Claude Code
confirmation prompt before any of these operations (tools are routed
through the plugin's `domain-mcp` MCP registration, so Claude Code resolves
them as `mcp__domain-mcp__<tool>`):

- `domain` with `operation: delete` or `operation: push`
- `transfer` with `operation: initiate`
- `aftermarket` with `operation: delist` or `cancel_bid`
- `contact` with `operation: delete`
- `folder` with `operation: delete`

All other operations pass through unchanged. The hook is a safety net on
top of Claude's own judgment, not a replacement for it.

**Fail-closed design**: if the hook script can't parse the tool-call JSON
(missing fields, malformed input), it surfaces a confirmation prompt
rather than silently allowing the call. Better an extra confirmation than
a silent destructive op.

## Troubleshooting

See [`references/troubleshooting.md`](references/troubleshooting.md)
for plugin-specific failure modes: plugin not loading, credential errors,
hook script issues, sandbox gotchas, and restart requirements.

## License

MIT. See [LICENSE](LICENSE).
