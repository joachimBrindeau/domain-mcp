---
description: First-run setup for domain-agent-kit — collect Dynadot API key, verify against the live API, persist to project-scoped settings
allowed-tools: Read, Write, Edit, Bash, AskUserQuestion
---

Guide the user through first-run configuration of the domain-agent-kit plugin. Collect the Dynadot API key, verify it against the live Dynadot API, persist it to the project-scoped settings file `.claude/domain-agent-kit.local.md`, restrict its permissions, and hand off to the plugin's commands and agents.

# Essential rules

1. **Never echo the API key back to the user.** Read it from the environment or from a single paste, write it to the settings file, never repeat it in previews, confirmations, or logs. The user has the key; Claude repeating it writes a durable copy into the chat transcript.
2. **Verify before writing.** A bad key in the settings file produces silent failures on every tool call. Always hit `api.dynadot.com` first, parse the response with `jq` (not substring search), and write only after confirmation.
3. **Write to the project `.claude/`, not `~/.claude/`.** The plugin launcher (`${CLAUDE_PLUGIN_ROOT}/scripts/launch-domain-mcp.sh`) reads the settings file from the current working directory's `.claude/` subfolder — it will not find a file placed in the user's home directory.
4. **Never touch the plugin install directory.** Plugin files are read-only after install. Settings always go to the user's project, never the plugin.
5. **Pass the key via files or env, never on the command line.** Shell command lines may be logged in shell history or tool-call transcripts. Use stdin redirection or temp files with `chmod 600`.

# Pre-check — is the setup already done?

Before anything else, check if `.claude/domain-agent-kit.local.md` exists in the current working directory.

If the file exists:

1. Use the Read tool to load it.
2. Extract the `dynadot_api_key` value from the YAML frontmatter.
3. Re-verify the key against the live API (Phase 2 below). Pass the key via stdin to a temp file with restrictive permissions, then read the temp file in the curl call. Do not interpolate the key into the shell command line.
4. If verification succeeds, tell the user the setup is already valid, summarize the active sandbox setting, jump to Phase 4 (handoff), and **do not rewrite the file**.
5. If verification fails, tell the user the stored key no longer works and proceed to Phase 1 to collect a replacement.

# Phase 1 — Acquire

1. Check the shell environment for a pre-set `DYNADOT_API_KEY`:

```bash
test -n "${DYNADOT_API_KEY:-}" && echo set || echo unset
```

2. If the env var is set, use AskUserQuestion to confirm whether to use the existing value or enter a different key. Default to the existing one.

3. If not set, use AskUserQuestion to ask whether the user already has a key with options `yes-have-one` and `no-need-one`.

4. For `no-need-one`: show the Dynadot API settings URL — `https://www.dynadot.com/account/domain/setting/api.html?s9F6L9F7U8Q9U8Z8v` — preserving the referral parameter exactly. Ask the user to return with the key in their next message.

5. For `yes-have-one`: tell the user "Paste your Dynadot API key in your next message. I will verify it against the live Dynadot API and write it only to your project-scoped plugin settings file." Wait for the paste.

# Phase 2 — Verify

Verify against the live API before touching any files. Stage the key in a temp file with restrictive perms so it never appears on the command line.

```bash
KEYFILE="$(mktemp)"
chmod 600 "$KEYFILE"
# Use the Write tool to put the user's pasted key into $KEYFILE — do NOT
# use shell echo, which would log the key to history.
```

After staging, verify with curl, parsing the response with `jq` (not substring grep — Dynadot's envelope shape varies between endpoints):

```bash
curl -sSf "https://api.dynadot.com/api3.json?key=$(cat "$KEYFILE")&command=account_info" \
  | jq -r '.AccountInfoResponse.ResponseHeader.ResponseCode // .Response.ResponseCode // "unknown"'
```

Inspect the printed response code:

- `0` (or whatever Dynadot documents as success) means the key is valid.
- Anything else means the key was rejected. Read the corresponding error field via:
  ```bash
  curl -sSf "https://api.dynadot.com/api3.json?key=$(cat "$KEYFILE")&command=account_info" \
    | jq -r '.AccountInfoResponse.ResponseHeader.Error // .Response.Error // "no error message"'
  ```
  Show the user the error verbatim, **do not echo the key**, then loop back to Phase 1.
- If curl itself fails (network, DNS, proxy), show the curl error and offer to retry.

After verification (success or final failure), wipe the temp file:

```bash
trash "$KEYFILE" 2>/dev/null || shred -u "$KEYFILE" 2>/dev/null
```

# Phase 3 — Configure

1. Ask about sandbox mode via AskUserQuestion with two options: `prod` (default, real account, real transactions) and `sandbox` (testing against `api-sandbox.dynadot.com`). Recommend `prod`. Sandbox has known capability gaps documented in the troubleshooting reference, and defaulting to it confuses users who expect feature parity.

2. Use the Write tool to create `.claude/domain-agent-kit.local.md` at the **project root** — the user's current working directory, not the plugin install dir, not the user's home. Exact shape:

```markdown
---
dynadot_api_key: "<verified-key>"
dynadot_sandbox: <true|false>
---

# Domain Agent Kit — project settings

This file is read at launch by the plugin's MCP wrapper script.
Do not commit this file to version control.
```

3. Restrict file permissions immediately after writing:

```bash
chmod 600 .claude/domain-agent-kit.local.md
```

This prevents other local users from reading the key. Note that `chmod 600` does NOT protect against cloud sync (Dropbox, iCloud, OneDrive) or backup software — warn the user that the key is on disk in plain text and that a cloud-synced project directory is not appropriate for this file.

4. Ensure `.gitignore` covers the settings file:
   - Read the project's `.gitignore` if it exists.
   - If `.claude/*.local.md` is missing, use Edit to append it. Also add `.claude/*.local.json` while there.
   - If there is no `.gitignore`, create one with both lines.

# Phase 4 — Hand off

1. Tell the user explicitly:
   - Setup is complete and verified.
   - **Claude Code must be restarted** for the plugin's MCP server to pick up the new settings file. Hot-reload of MCP config is not supported.
   - After restart, `domain-mcp` will launch automatically via the plugin; no manual `npx` or config editing is required.

2. Show the available entry points:
   - **Slash commands**: `/domain-agent-kit:audit`, `/domain-agent-kit:brainstorm <description>`, `/domain-agent-kit:dns <domain>`, `/domain-agent-kit:renewals`.
   - **Agents** (trigger on natural language): `domain-research`, `portfolio-auditor`, `dns-diagnostic`.
   - **Direct MCP tools**: `help` (for discovery), `generate_domain_ideas`, `check_domain`, plus the composite tools `domain`, `domain_settings`, `dns`, `nameserver`, `transfer`, `contact`, `folder`, `account`, `aftermarket`, `order`. Each composite tool takes an `operation` argument — use `help query=actions tool=<name>` to list operations.

# Rationalizations to reject

| Rationalization | Why it's wrong |
|---|---|
| "I'll skip verification — the user said the key is valid" | A bad key produces silent failures on every tool call. The user will blame the plugin. Verify once, here. |
| "I'll write the key to ~/.claude/ so it's global across projects" | The plugin launcher reads project-local `.claude/` specifically. A global file will never be found. If the user wants a global default, they can set `DYNADOT_API_KEY` in their shell rc — the launcher falls back to the env var when the settings file is absent. |
| "I'll echo the key back masked (`abc...xyz`) so the user can confirm" | Partial masks still leak entropy. The user has the key in their clipboard; echoing any form of it writes a copy to the transcript. |
| "I'll hardcode `dynadot_sandbox: true` as a safer default" | Sandbox has real capability gaps. Users test in sandbox, everything looks broken, they blame the plugin. Default to prod. |
| "I'll modify the plugin's own .mcp.json to include the key directly" | The plugin install directory is read-only after install. Writes there break updates and may fail silently. Settings always go to the user's project. |
| "I'll grep the curl response for 'success' as a string" | Dynadot's envelope shape varies between endpoints. String matching produces false positives and false negatives. Parse with jq. |
| "I'll pass the key on the command line to curl — it's quick" | Command lines may be logged by the shell, by the Bash tool transcript, or by process listings (`ps`). Always stage in a temp file with `chmod 600`. |

# Additional resources

For plugin-specific failure modes (plugin not loading, credential errors, hook script issues, sandbox gotchas, restart requirements), reference the troubleshooting file: `@${CLAUDE_PLUGIN_ROOT}/references/troubleshooting.md`

# Success criteria

- `.claude/domain-agent-kit.local.md` exists at the project root with a verified `dynadot_api_key` and explicit `dynadot_sandbox` setting.
- The settings file has `chmod 600` permissions.
- `.gitignore` excludes `.claude/*.local.md` and `.claude/*.local.json`.
- User received explicit restart instructions.
- User received the entry-point reference (slash commands, agents, MCP tools).
- The API key never appeared verbatim in the conversation transcript after the user pasted it — no previews, no confirmations, no logs.
