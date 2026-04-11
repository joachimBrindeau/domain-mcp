---
name: domain-mcp-setup
description: "Guided install and configuration of domain-mcp — the Dynadot-backed MCP server — for Claude Code, Cursor, or Claude Desktop. Use when the user asks to 'install domain-mcp', 'set up Dynadot in Claude/Cursor/Claude Desktop', 'connect my Dynadot account to Claude', 'configure domain management', or is troubleshooting a broken or missing domain-mcp install. Covers preflight checks, Dynadot API key verification, MCP client config merging without clobbering existing servers, and handoff to the server's usage tools. Do NOT activate when the user just wants to use domain-mcp tools that are already installed — route them to the `help` tool or the relevant prompt workflow instead."
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Bash
  - AskUserQuestion
  - TodoRead
  - TodoWrite
---

# domain-mcp Setup

Guided install, credential verification, and MCP client configuration for
`domain-mcp` (the Dynadot registrar MCP server published as
[`domain-mcp`](https://www.npmjs.com/package/domain-mcp)).

## Essential Principles

1. **Never leak the API key back to the user.** Read it from the user's
   environment or from a single paste, write it to the target MCP config
   file, and never echo it in plain text in the conversation (not in
   previews, not in confirmation prompts, not in verification logs). The
   user can see their own key; Claude repeating it back creates a durable
   copy in the chat transcript.

2. **Verify credentials against the live Dynadot API before writing any
   config file.** A key that fails `api.dynadot.com` will fail inside the
   MCP client too, but by then you've edited the user's Claude Code /
   Cursor / Claude Desktop config and they have to debug from a worse
   starting point. Always verify first, edit second.

3. **Never clobber existing MCP config.** Users may already have other
   MCP servers configured (filesystem, postgres, slack, …). Always
   Read → parse → merge into `mcpServers["domain-mcp"]` → Write, preserving
   every other key at every level. If reading or parsing fails, stop and
   ask the user rather than overwriting.

4. **One failure stops the pipeline.** Each phase has hard exit criteria.
   If Phase 1 finds Node 16, do not suggest workarounds or skip ahead —
   tell the user to upgrade Node and stop. Phases later in the chain
   assume earlier phases passed cleanly.

5. **The skill ends at "it's installed and the key is valid."** It does
   NOT teach individual tools, explain the Dynadot API, or brainstorm
   domains. Those are jobs for the `help` tool, `generate_domain_ideas`,
   and the prompt workflows (`domain-audit`, `dns-setup`,
   `domain-brainstorm`, `bulk-renewal`) that the server exposes once
   connected. Phase 5 hands off and exits.

## When to Use

- User says "install domain-mcp", "set up Dynadot", "connect my domains to
  Claude/Cursor/Claude Desktop", or similar first-time-setup phrasing.
- User has a Dynadot account but no MCP configuration yet.
- User is on a new machine or has switched AI clients and needs to
  reconfigure.
- User reports that the server's tools (`domain`, `dns`, `contact`, …) are missing after a previous install.
- User reports auth errors ("Dynadot API error: …") on every tool call and
  the root cause may be a bad/expired key.

## When NOT to Use

- User already has domain-mcp working and wants to perform domain
  operations — call the `help` tool to list capabilities, or invoke the
  relevant prompt workflow directly (`domain-audit`, `dns-setup`,
  `domain-brainstorm`, `bulk-renewal`).
- User wants to brainstorm available domain names — use the
  `generate_domain_ideas` tool directly; it handles keyword expansion and
  availability checks in one call.
- User is editing the domain-mcp source code — point them at the upstream
  repository on GitHub; this skill is for end users consuming the
  published npm package.
- User is building their own MCP server — use MCP SDK documentation and
  plugin development guides instead.
- User is debugging a Dynadot API quirk (`edit_contact` partial updates
  rejected, `lock_domain` unlock misreporting, sandbox capability gaps) —
  see [{baseDir}/references/troubleshooting.md]({baseDir}/references/troubleshooting.md);
  this skill installs the server, it doesn't diagnose API behaviour.

## Phases

All five phases run in order. Do not skip. Do not reorder. Do not proceed
past an exit-criteria failure.

### Phase 1 — Preflight

**Entry criteria**: user has asked to install/set up/connect domain-mcp.

**Actions**:

1. Initialize a TodoWrite list with the five phases so the user can see
   progress.
2. Run `node --version` via Bash. Parse the major version. If it is
   missing or `< 18`, report the gap, point at
   [nodejs.org/en/download](https://nodejs.org/en/download) or
   `nvm install 18`, and stop. Do NOT continue.
3. Run `npm --version` via Bash. If missing, tell the user npm ships with
   Node and their install is broken; stop.
4. Detect at least one supported MCP client. Run all three detections in a
   single parallel batch:
   - **Claude Code**: `command -v claude` via Bash. If present, record the
     CLI path.
   - **Cursor**: check `$HOME/.cursor/` via Glob (`**/.cursor`). Record
     `$HOME/.cursor/mcp.json` as the target.
   - **Claude Desktop**: run `uname -s` once, then Glob the per-OS path
     from `{baseDir}/references/mcp-client-paths.md`.
5. If zero clients are detected, stop. Tell the user they need at least
   one MCP-capable client installed first and link to each project's
   install page.

**Exit criteria**:
- Node ≥ 18 confirmed.
- npm available.
- At least one MCP client detected, with its config path (or CLI) known.

**Example output to present to the user at phase end**:
```
[OK] Node v22.11.0
[OK] npm 10.9.0
Detected MCP clients: Claude Code (~/.claude.json), Cursor (~/.cursor/mcp.json)
```

### Phase 2 — Credentials

**Entry criteria**: Phase 1 passed.

**Actions**:

1. Check if `DYNADOT_API_KEY` is already set in the shell environment:
   `test -n "${DYNADOT_API_KEY:-}" && echo set || echo unset` via Bash.
2. If unset, use AskUserQuestion to ask whether the user already has a
   Dynadot API key. Options: `yes-in-hand`, `no-need-one`.
   - For `no-need-one`: show the Dynadot API settings link
     `https://www.dynadot.com/account/domain/setting/api.html?s9F6L9F7U8Q9U8Z8v`
     (preserve the referral parameter exactly; it is how the upstream
     project is funded). Ask the user to return with the key in their
     next message, then wait for input before proceeding.
   - For `yes-in-hand`: prompt "Paste your Dynadot API key in your next
     message. I will verify it against the Dynadot API and write it only
     to your MCP client config." Wait for paste.
3. Ask about sandbox mode via AskUserQuestion: `prod` (default, real
   account, real transactions) or `sandbox` (testing against
   `api-sandbox.dynadot.com`). The sandbox has known capability gaps —
   most notably `create_contact` fails, and some destructive aftermarket
   operations exist only there — summarised in
   [{baseDir}/references/troubleshooting.md]({baseDir}/references/troubleshooting.md#sandbox-gotchas).
   New users almost always want `prod`.
4. Verify the key against the live API via Bash. Do NOT put the key on
   the command line (it would leak into shell history); pass it via env:
   ```bash
   DYNADOT_API_KEY="$KEY_FROM_USER" \
     curl -sSf "https://api.dynadot.com/api3.json?key=${DYNADOT_API_KEY}&command=account_info" \
     | head -c 2048
   ```
   Replace `$KEY_FROM_USER` with the value you received; invoke through
   Bash with the env var set. Inspect the response:
   - If JSON contains `"Status":"success"` anywhere in the nested
     `AccountInfoResponse` envelope, the key is valid.
   - If it contains `"Status":"error"`, extract the `Error` field and
     show it to the user (redact the key from the curl command echo),
     then loop back to step 2 and ask for a new key.
5. Do not record the key value anywhere. Keep it in tool-call arguments
   only until Phase 3 writes it to the config, then drop it from the
   response text.

**Exit criteria**:
- A Dynadot API key has been verified against the live API
  (`Status: success`).
- Sandbox preference recorded.
- Key is held only in memory, never echoed back.

**Rationalizations to reject**:
- "I'll skip verification and let the MCP client discover the bad key at
  runtime" — no. A bad key produces silent failures on every tool call;
  users blame the server, not the credential. Verify once, here.
- "I'll echo the key back so the user can confirm it" — no. The user has
  the key in their clipboard already. Echoing it writes it to the chat
  transcript.
- "Sandbox is safer so I'll default to sandbox" — no. Sandbox has real
  capability gaps that make new users think the server is broken. Default
  to prod.

### Phase 3 — Client selection and config

**Entry criteria**: Phase 2 passed and a verified key is in memory.

**Actions**:

1. If Phase 1 detected more than one client, use AskUserQuestion to ask
   which one to configure. Options include each detected client by name.
   Allow "all of them" as an option if the user wants redundant setup.
2. Look up the target config path from
   `{baseDir}/references/mcp-client-paths.md` based on the detected OS
   and selected client.
3. **Claude Code shortcut**: if the client is Claude Code and the
   `claude` CLI is on PATH, prefer `claude mcp add domain-mcp --env
   DYNADOT_API_KEY=... --env DYNADOT_SANDBOX=... -- npx -y domain-mcp`.
   This is the official path and handles JSON editing, scoping, and
   validation for you. Skip to Phase 4 after it succeeds.
4. **Cursor / Claude Desktop / Claude Code without CLI**: perform a
   read-merge-write on the JSON config file:
   a. Read the file via Read. If it does not exist, treat as `{}`.
   b. Parse it. If parsing fails, stop and tell the user the file is
      malformed; let them fix it manually. Do NOT overwrite a malformed
      file — the user has other servers in there you cannot reason about.
   c. Merge the following stanza into `mcpServers["domain-mcp"]`,
      preserving every other top-level key and every other entry under
      `mcpServers`:
      ```json
      {
        "command": "npx",
        "args": ["-y", "domain-mcp"],
        "env": {
          "DYNADOT_API_KEY": "<key>",
          "DYNADOT_SANDBOX": "false"
        }
      }
      ```
      Set `DYNADOT_SANDBOX` to `"true"` only if the user chose sandbox
      in Phase 2.
   d. Build a **redacted** preview of the merged config to show the
      user. Replace the API key value with the literal string
      `"<redacted>"` in the preview — never with a partial mask like
      `"abc...xyz"`, which still leaks entropy.
   e. Use AskUserQuestion: `write-config` (yes/no) with the redacted
      preview shown in the question body. If the user declines, stop
      and tell them the verified key is not being persisted.
   f. If the user confirms, write the merged config with the **real**
      key (Edit if the file existed, Write if it did not).
5. Remind the user about secrets hygiene in plain text: the config file
   now contains a plaintext key. Do not commit it to git. If the target
   path is inside a repo, warn loudly.

**Exit criteria**:
- Target config file exists at the expected path.
- `mcpServers["domain-mcp"]` points at `npx -y domain-mcp` with the
  verified key and correct sandbox flag in `env`.
- No other `mcpServers` entries were removed or altered.
- User saw a redacted preview and confirmed before writing.

**Example JSON (merged into an existing config with one other server)**:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/x/docs"]
    },
    "domain-mcp": {
      "command": "npx",
      "args": ["-y", "domain-mcp"],
      "env": {
        "DYNADOT_API_KEY": "<redacted in preview, real value on disk>",
        "DYNADOT_SANDBOX": "false"
      }
    }
  }
}
```

### Phase 4 — Verification

**Entry criteria**: Phase 3 wrote a config successfully.

**Actions**:

1. Smoke-test the binary via Bash: `npx -y domain-mcp --version`. The
   published binary supports `--version` and `--help` and exits
   immediately; any other invocation blocks on stdin as an MCP transport,
   so always pass `--version`. Expect a semver string on stdout and exit
   0. If the command hangs, kill it after ~5 seconds and treat it as a
   failure.
2. Re-verify the key with the same curl as Phase 2 (fresh network call).
   This catches the edge case where the key was revoked between Phase 2
   and Phase 4.
3. For Cursor and Claude Desktop: tell the user to fully quit and
   relaunch the app — hot-reload of MCP config is not reliable. For
   Claude Code: new MCP servers are picked up on the next `/mcp` refresh
   or session restart; tell the user to run `claude mcp list` to confirm
   `domain-mcp` appears.

**Exit criteria**:
- `npx -y domain-mcp --version` printed a version and exited 0.
- Live API re-verification returned `Status: success`.
- User received client-specific restart instructions.

### Phase 5 — Usage handoff

**Entry criteria**: Phase 4 passed.

**Actions**:

1. Print a compact quick-reference pointing at what already exists in the
   server — do not restate the whole API surface:
   - `help` tool — discovers tools and actions at runtime
   - `generate_domain_ideas` — brainstorm + availability check in one call
   - `check_domain` — single-domain availability check
   - Composite tools: `domain`, `domain_settings`, `dns`, `nameserver`,
     `transfer`, `contact`, `folder`, `account`, `aftermarket`, `order`
     (each takes an `operation` argument — use the `help` tool to list
     operations). These are namespaced by the server in clients as
     `mcp__domain-mcp__domain`, etc.
   - Prompt workflows: `domain-audit`, `dns-setup`, `domain-brainstorm`,
     `bulk-renewal`
   - Resources: `account://info`, `domains://list`, `contacts://list`,
     `folders://list`
2. Use AskUserQuestion to ask what the user wants to do next with
   options: `audit-portfolio`, `configure-dns`, `brainstorm-names`,
   `renewals`, `explore-tools`, `nothing-done`.
3. For each option, point at the matching prompt or tool and exit the
   skill. Do NOT execute the chosen workflow inside this skill — the
   skill's job ends at the handoff.

**Exit criteria**:
- User has been shown the four prompt workflows and the `help` entry
  point.
- User has been routed to the next action of their choice, or has
  declined and the skill has cleanly exited.

## Tool Usage Quick Reference

| Operation | Tool | Rationale |
|---|---|---|
| Check Node/npm versions | Bash | These are shell commands with no dedicated alternative. |
| Detect `claude` CLI | Bash | `command -v` is shell-native. |
| Detect Cursor / Claude Desktop config dir | Glob | Dedicated file-search tool. Do NOT use `find`/`ls`. |
| Read existing JSON config | Read | Absolute path only. |
| Merge + write JSON config | Edit (if existing) or Write (if new) | Never Bash heredocs or sed — they corrupt JSON. |
| Verify Dynadot API key | Bash | `curl` with key passed via env var, never on cmdline. |
| Smoke-test published binary | Bash | `npx -y domain-mcp --version`. |
| Ask user for choices / confirmations | AskUserQuestion | Structured, typed answers. |
| Free-form API key paste | Plain message | The user pastes in their next turn; AskUserQuestion is for structured choices only. |
| Track phase progress | TodoWrite / TodoRead | Let the user see what's done and what's next. |

## Rationalizations to Reject

| Rationalization | Why it's wrong |
|---|---|
| "I'll use Bash with heredoc to write the JSON config" | Heredoc redirects bypass JSON validation and can corrupt the file with quoting bugs. Use Write/Edit. |
| "I'll just hardcode `~/Library/Application Support/Claude/…` because the user is on a Mac" | Not every user is on macOS. Detect the OS and look up the right path from `references/mcp-client-paths.md`. |
| "I'll write the API key to a `.env` file in the current directory" | That's only useful for local dev of the server itself. The end user's MCP client reads env from the client config, not from an ambient `.env`. Put it in the config. |
| "The user's existing config is probably fine to overwrite" | Users accumulate MCP servers. Clobbering the file loses all their other integrations. Always merge. |
| "I'll skip Phase 4's binary smoke-test — if the config is valid, it will work" | `npx -y domain-mcp --version` catches package-resolution failures, proxy issues, and Node-ABI mismatches that a config write cannot. It's cheap, run it. |
| "I'll run `claude mcp add` via Bash and let its interactive prompts handle everything" | `claude mcp add` with no args goes interactive — Claude cannot respond to TUI prompts. Always pass flags (`--env`, `--`) so it runs non-interactively. |

## Reference Index

| File | Content |
|---|---|
| [{baseDir}/references/mcp-client-paths.md]({baseDir}/references/mcp-client-paths.md) | Config file paths per client and OS, Claude Code CLI form, and the merge schema. |
| [{baseDir}/references/troubleshooting.md]({baseDir}/references/troubleshooting.md) | Failure modes: Node version errors, rejected keys, missing tools after install, malformed JSON, rate limits. |

## Success Criteria

A complete run of this skill leaves all of the following true:

- [ ] Node ≥ 18 and npm verified.
- [ ] ≥ 1 supported MCP client detected and selected.
- [ ] Dynadot API key verified against `api.dynadot.com` (not just
      format-checked).
- [ ] Sandbox preference recorded and written into `env.DYNADOT_SANDBOX`.
- [ ] Target MCP config file merged (not clobbered), preserving every
      unrelated entry under `mcpServers`.
- [ ] User saw a redacted preview before any config write.
- [ ] `npx -y domain-mcp --version` returned successfully post-write.
- [ ] Key re-verified against the live API post-write.
- [ ] User received client-specific restart instructions.
- [ ] User was handed off to the `help` tool and the four prompt workflows.
- [ ] The API key never appeared verbatim in the conversation transcript
      after the user pasted it (no previews, no confirmations, no logs).
