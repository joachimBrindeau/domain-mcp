# MCP Client Config Paths

Where `domain-mcp` lives in each supported client, and how to merge it
into an existing config without clobbering other servers.

---

## Claude Code

**Recommended path: the CLI.** Claude Code ships a non-interactive
`claude mcp add` command that handles JSON editing, validation, and
scope selection for you.

```bash
claude mcp add domain-mcp \
  --env DYNADOT_API_KEY=<key> \
  --env DYNADOT_SANDBOX=false \
  -- npx -y domain-mcp
```

Flags:
- `--env KEY=VALUE` — one per env var; repeat for multiple.
- `--` — everything after this is the command + args to run.
- `--scope user` (default) writes to the user-level config.
- `--scope project` writes to `.mcp.json` in the current directory
  (useful only when the server is shared by a team in a git repo —
  never do this with a plaintext API key).

**Verify after:**
```bash
claude mcp list
# expect a line like:  domain-mcp   npx -y domain-mcp
```

**Manual JSON fallback** (if `claude` is not on PATH): Claude Code's
user-level MCP config lives in `~/.claude.json` on macOS, Linux, and
Windows. Look for a top-level `mcpServers` key and merge in the same
stanza shown in the "Config Schema" section below.

---

## Cursor

| OS | Config file |
|---|---|
| macOS | `~/.cursor/mcp.json` |
| Linux | `~/.cursor/mcp.json` |
| Windows | `%APPDATA%\Cursor\mcp.json` |

Cursor does not ship a CLI for MCP management. Edit the JSON directly.

**After editing, fully quit and relaunch Cursor.** Hot reload of MCP
config is not supported — the menu will still show stale server state
until restart.

---

## Claude Desktop

| OS | Config file |
|---|---|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

Like Cursor, Claude Desktop has no MCP CLI. Edit the JSON directly.

**After editing, fully quit and relaunch Claude Desktop.** A dock-icon
close is often not enough — use "Quit Claude" from the menu bar (macOS)
or the system tray (Windows/Linux).

---

## Config Schema

All three clients use the same stanza shape:

```json
{
  "mcpServers": {
    "domain-mcp": {
      "command": "npx",
      "args": ["-y", "domain-mcp"],
      "env": {
        "DYNADOT_API_KEY": "<key>",
        "DYNADOT_SANDBOX": "false"
      }
    }
  }
}
```

Fields:
- `command` — the binary to invoke. Use `npx` for on-demand execution
  (no install needed) or `domain-mcp` if the user installed it globally
  with `npm install -g domain-mcp`.
- `args` — `["-y", "domain-mcp"]` tells npx to auto-accept installing
  the package. Drop to `[]` if the command is the globally installed
  binary.
- `env.DYNADOT_API_KEY` — the verified Dynadot API key. Required.
- `env.DYNADOT_SANDBOX` — `"true"` to route to
  `api-sandbox.dynadot.com`, `"false"` (or omit) for production. The
  value must be a string, not a boolean.

---

## Merge Procedure

Never overwrite the file blindly. MCP clients accumulate servers over
time — filesystem, postgres, slack, github, etc. — and replacing the
file loses all of them.

1. **Read** the existing file (Read tool). If it does not exist, treat
   as `{}`.
2. **Parse** as JSON. If parsing fails, stop — the user has a malformed
   config and this skill should not try to rewrite it. Tell them to
   validate with `jq . <path>` or equivalent and come back.
3. **Merge**: locate or create the `mcpServers` object at the top level.
   Add or replace `mcpServers["domain-mcp"]` only. Leave every other
   entry under `mcpServers` untouched. Leave every other top-level key
   untouched (Claude Desktop in particular puts other app settings at
   the top level of the same file).
4. **Preview**: show the merged result to the user with the API key
   replaced by the literal string `"<redacted>"` — not a partial mask,
   not `"***"`, not the first and last four characters. Confirm before
   writing.
5. **Write**: use Edit (if the file existed) or Write (if it did not).
   Do not use Bash redirection or heredocs to write JSON — quoting
   corruption is the most common cause of broken MCP config.

---

## Example: Merging into a File That Already Has Two Servers

Before:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/x/docs"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "ghp_..." }
    }
  }
}
```

After (only the new `domain-mcp` key is added — `filesystem` and
`github` are untouched, byte-for-byte):
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/x/docs"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "ghp_..." }
    },
    "domain-mcp": {
      "command": "npx",
      "args": ["-y", "domain-mcp"],
      "env": {
        "DYNADOT_API_KEY": "<verified key>",
        "DYNADOT_SANDBOX": "false"
      }
    }
  }
}
```
