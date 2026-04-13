---
description: Check domain-agent-kit health — plugin files, dependencies, credentials, MCP server, account reachability
allowed-tools: Read, Bash, mcp__dynadot__help, mcp__dynadot__account
---

Run a focused health check of the domain-agent-kit plugin. Report green/yellow/red status for each dimension, then give an overall verdict. This command must work even when the MCP server is broken — that is exactly when users run it.

# Checks to run

Run the checks in this order. Some depend on earlier ones (no point probing the account if the MCP server isn't reachable).

## 1. Plugin files

Verify the core plugin artifacts exist and are executable where expected.

Via Bash, check each of these paths (prefix with `${CLAUDE_PLUGIN_ROOT}/`):

- `.claude-plugin/plugin.json` — must be readable JSON
- `.mcp.json` — must be readable JSON
- `commands/setup.md`, `commands/audit.md`, `commands/brainstorm.md`, `commands/dns.md`, `commands/renewals.md`, `commands/status.md` — must exist
- `agents/domain-research.md`, `agents/portfolio-auditor.md`, `agents/dns-diagnostic.md` — must exist
- `hooks/hooks.json` — must be readable JSON
- `scripts/launch-domain-mcp.sh` — must be executable (`test -x`)
- `scripts/confirm-destructive.sh` — must be executable
- `scripts/session-preflight.sh` — must be executable

Report `✅ all present` if everything passes, or list missing/broken files.

## 2. Dependencies

Via Bash, check these versions:

- `node --version` → must print a version with major ≥ 18
- `npm --version` → must succeed
- `npx --version` → must succeed
- `jq --version` → must succeed (required by the hook script and setup flow)
- `curl --version | head -1` → must succeed

Report each dependency's version on success. If any is missing or too old, flag as `❌` and include the install hint (Homebrew formula, apt package, Node LTS URL).

## 3. Credentials

Check in this order:

1. **Project settings file**: does `.claude/domain-agent-kit.local.md` exist in the current working directory? If yes, read it (via the Read tool) and verify the frontmatter has a non-empty `dynadot_api_key` field. Do NOT echo the value.
2. **Shell environment variable**: is `DYNADOT_API_KEY` exported? Check via Bash: `test -n "${DYNADOT_API_KEY:-}" && echo set || echo unset`. Do NOT echo the value.

Report one of:
- `✅ .claude/domain-agent-kit.local.md (sandbox: true/false)` if the project file is present and valid
- `⚠️ shell env var only — no project settings file` if only the env var is set
- `❌ no credentials found — run /domain-agent-kit:setup` if neither is set

Include the sandbox flag in the report when reading the project file, since it affects which endpoint will be used.

## 4. MCP server reachability

Call `help` with `query: tools` via the MCP tool. This is a fast read-only probe that confirms:
- the MCP server process is running
- the launcher successfully resolved credentials
- the plugin correctly registered `dynadot` under the `mcp__dynadot__` namespace

Report one of:
- `✅ reachable (N tools available)` with the count from the help response
- `❌ not reachable — restart Claude Code and check stderr for launcher errors` if the call fails

If the MCP server is not reachable, stop here and do not attempt check 5.

## 5. Account verification

Call `account` with `operation: info`. This confirms the stored credentials are accepted by the live Dynadot API and retrieves the current balance.

Report one of:
- `✅ connected (balance $X.XX, email <redacted>)` on success
- `❌ API error: <error message>` on failure — extract the error from the response; suggest running `/domain-agent-kit:setup` if the error is credential-related

Do NOT display the full account details in the report. Balance and "connected" status are sufficient — dump more only if the user explicitly asks for it.

# Output format

Produce a single report with this exact structure:

```
## domain-agent-kit — status

Plugin version:     <from .claude-plugin/plugin.json>
Plugin files:       <✅ / ❌ detail>
Dependencies:       <✅ Node vX, jq X, npx X, curl X   /   ❌ detail>
Credentials:        <✅/⚠️/❌ detail>
MCP server:         <✅/❌ detail>
Account:            <✅/❌ detail>

Overall:            ✅ READY   (if every line is ✅)
                    ⚠️ DEGRADED (if any warnings, no blockers)
                    ❌ NEEDS ATTENTION — <one-line summary of blockers>
```

# Do not

- Do not call any write operation in the status check. Read-only probes only.
- Do not display the API key or any portion of it — not even masked.
- Do not treat missing optional files as blocking. Only the files listed in check 1 are required; anything else the plugin may add in future releases is not part of the status contract.
- Do not fail on warnings. Warnings are informational — only `❌` on required checks flips the overall verdict to NEEDS ATTENTION.
- Do not suggest fixes for problems outside the plugin's scope (system Node install, npm registry outage, etc.). Name the problem and point at the user's environment.

# Success criteria

The user sees a complete, structured health report that correctly diagnoses the plugin's state in under 10 seconds. The report is useful both when the plugin is healthy (confirmation) and when it is broken (debug hint).
