# Troubleshooting — domain-agent-kit

Failure modes specific to the plugin install path, grouped by phase. For
issues with the underlying `domain-mcp` server itself, see the upstream
repository on GitHub.

---

## Plugin install

### Plugin doesn't load after install

**Symptom**: Running `/domain-agent-kit:audit` prints "unknown command", or
the plugin's commands and agents never trigger.

**Causes and fixes**:

1. **Plugin not enabled.** Run `/plugin` in Claude Code to see enabled
   plugins. If `domain-agent-kit` is listed but disabled, enable it. If
   it's not listed at all, the plugin directory wasn't picked up — check
   the install path and restart Claude Code.

2. **Claude Code not restarted.** Plugin config is read at session start.
   After install, exit Claude Code completely and relaunch. Adding
   `--debug` to the launch command helps see plugin loading errors:
   `claude --debug` or `cc --debug`.

3. **`.claude-plugin/plugin.json` invalid.** Malformed JSON blocks the
   whole plugin. Validate with `jq . .claude-plugin/plugin.json` from the
   plugin directory. Look for trailing commas, missing quotes, or
   unescaped characters.

4. **Wrong directory layout.** The manifest must be at
   `.claude-plugin/plugin.json`, not `plugin.json` at the root. Component
   directories (`commands/`, `agents/`, `hooks/`, `.mcp.json`) must be at
   the plugin root, not nested inside `.claude-plugin/`.

---

## Credential errors

### Launcher reports "DYNADOT_API_KEY is not set"

**Symptom**: On Claude Code startup, the MCP server fails to launch and
the user sees stderr output:

```
[domain-agent-kit] DYNADOT_API_KEY is not set.
[domain-agent-kit] Fix: run /domain-agent-kit:setup in Claude Code...
```

**Root cause**: The launcher script checked both the project-scoped
settings file and the shell environment, and found neither.

**Fix**:

1. **First-time setup.** Run `/domain-agent-kit:setup` in Claude Code.
   The command will collect the key, verify it, and write
   `.claude/domain-agent-kit.local.md` for you.

2. **Settings file exists but in the wrong directory.** The launcher
   reads from the current working directory's `.claude/` subfolder, not
   `~/.claude/`. If Claude Code was launched from a directory other than
   the one with the settings file, the launcher will not find it. Fix:
   relaunch Claude Code from the project root, or run the setup command
   again from the actual working directory.

3. **Shell env var approach not working.** If you rely on a shell
   `DYNADOT_API_KEY` export, make sure the shell that launched Claude
   Code has it set (`echo "$DYNADOT_API_KEY"`). GUI launches of Claude
   Desktop / Cursor inherit environment from the login shell, which may
   not have loaded `.zshrc` / `.bashrc`. Moving the export to
   `~/.zshenv` or `~/.profile` fixes this.

### API call returns an auth error

**Symptom**: The setup command's verification curl returns JSON with a
non-success response code and an error about the key.

**Root causes and fixes**:

1. **Key not activated.** Dynadot requires explicit API access enablement
   on the account. Log in, visit the API settings page, toggle API access
   on, regenerate the key if needed.

2. **Sandbox key used against prod** (or vice versa). Sandbox and prod
   maintain independent keys. If `dynadot_sandbox: true` is set in the
   settings file, the launcher talks to the sandbox endpoint — the key
   must be a sandbox key. For most users, set `dynadot_sandbox: false`.

3. **IP whitelist.** Some Dynadot accounts restrict API access by source
   IP. Add the current IP in the Dynadot dashboard or remove the
   restriction.

4. **Key rotated/revoked** between generation and this session. Generate
   a fresh key, re-run `/domain-agent-kit:setup`.

---

## Hook errors

### All MCP tool calls trigger a confirmation prompt

**Symptom**: Every single MCP call surfaces the destructive-op
confirmation hook, even for read-only operations like `list` or `info`.

**Root cause**: The hook script matches the tool name regex but is
incorrectly classifying safe operations as destructive — most likely the
`confirm-destructive.sh` script was modified or a new operation was
added to the case statement without being tested.

**Fix**: inspect `${CLAUDE_PLUGIN_ROOT}/scripts/confirm-destructive.sh`.
The destructive operation set should be limited to: `delete`, `push`
(for `domains.manage`), `initiate` (for `transfers.manage`), `delist`, `cancel_bid` (for
`aftermarket.manage`), and `delete` (for `contacts.manage`/`folders.manage`). Any other
operation should exit 0 (allow).

### Hook script exits with error, blocking all tool calls

**Symptom**: After install, every MCP tool call fails with a message
like "hook script failed with exit 127".

**Root causes and fixes**:

1. **Script not executable.** Run
   `chmod +x "${CLAUDE_PLUGIN_ROOT}/scripts/confirm-destructive.sh"`.
   Package managers sometimes strip execute bits on install.

2. **Missing `jq`.** The script uses `jq` to parse the hook input JSON.
   Install with `brew install jq` (macOS) or `apt install jq` (Debian/
   Ubuntu).

3. **Bash too old.** The script uses `[[`, `printf`, and arrays in ways
   that require bash 4+. macOS ships with bash 3.2 by default — `brew
   install bash` fixes this, and the script's `#!/usr/bin/env bash`
   shebang picks up the newer one automatically.

### Confirmation prompt fires on every safe operation after recent update

If you updated the plugin and now safe ops trigger confirmation, the
hook may have fallen back to its fail-closed mode. The hook is designed
to ask-on-error rather than allow-on-error — a parsing failure produces
the prompt, not silent allow. Check the hook input JSON: if `tool_name`
or `tool_input.operation` is missing or has an unexpected shape, the
script can't classify and asks for confirmation. This is intentional
safety, but if it fires too often, file an issue at the plugin's repo.

---

## Post-install

### Plugin loaded but MCP server never starts

**Symptom**: `/plugin` shows `domain-agent-kit` as enabled, but
`domains.manage`, `dns.manage`, etc. tools are not available. Running the `server.help` tool
returns "no such tool".

**Root causes and fixes**:

1. **`.mcp.json` syntax error.** Validate with
   `jq . "${CLAUDE_PLUGIN_ROOT}/.mcp.json"`. Fix any JSON errors.

2. **npx is slow on first run.** The first launch downloads the
   `domain-mcp` package from npm, which can take 10–30 seconds on a fresh
   machine. Subsequent launches use the npm cache. Be patient on the
   first startup; check again after 30 seconds.

3. **npm registry unreachable.** Test with `npm ping`. If unreachable,
   fix network/proxy before launching Claude Code.

4. **Launcher script not executable.** Run
   `chmod +x "${CLAUDE_PLUGIN_ROOT}/scripts/launch-domain-mcp.sh"`.

### Restart didn't pick up new settings

**Symptom**: After editing `.claude/domain-agent-kit.local.md`, calls
still use the old key.

**Root cause**: The settings file is read only at Claude Code startup,
not on every tool call. Hot reload is not supported.

**Fix**: fully quit Claude Code (not just close the window — Quit from
the menu bar or equivalent) and relaunch.

---

## Sandbox gotchas

The `dynadot_sandbox: true` mode routes MCP calls to
`api-sandbox.dynadot.com`. It has real capability gaps compared to
production — most undocumented in the Dynadot API reference.

**Known issues:**

- **`create_contact` fails** in sandbox with a misleading
  "missing phone number" error even when the phone is present and
  correctly formatted. The same payload succeeds in prod. Workaround:
  use an existing contact ID from the production account in any
  sandbox tests.
- **Balance and billing are simulated.** "Buying" domains in sandbox
  produces a fake order that never registers anything and never charges.
  This is the point — but users who expect full parity get confused.
- **Keys are siloed.** A prod-generated key does not work against
  sandbox, and vice versa.
- **Aftermarket destructive operations** (bid cancellation, delisting)
  may behave differently in sandbox than in prod. Test with caution.

**Advice**: default new users to `prod`. Reserve `sandbox: true` for
integration testing scenarios where the user knows they are hitting the
sandbox endpoint and accepts the gaps.
