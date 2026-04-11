# Troubleshooting domain-mcp Setup

Failure modes you may hit while running this skill, grouped by phase.

---

## Preflight failures

### Node version too old

**Symptom**: `node --version` prints `v16.x.x`, `v14.x.x`, or similar.

**Root cause**: `domain-mcp` requires Node 18+ (from `engines.node`).

**Fix**:
- With `nvm`: `nvm install 22 && nvm use 22`
- With `fnm`: `fnm install 22 && fnm use 22`
- System install: download from [nodejs.org](https://nodejs.org/en/download)

Re-run the skill after upgrading. Do NOT try to run `npx -y domain-mcp`
on an unsupported Node — it will fail mid-execution with a cryptic error
inside the MCP client, which is worse than refusing at Phase 1.

### `command not found: npx`

**Symptom**: Bash reports `npx` missing even though `node` works.

**Root cause**: Extremely old `npm` (pre-5.2) or a broken Node install.

**Fix**: `npm install -g npm@latest`. If that fails, reinstall Node
entirely — the install is corrupt.

### No MCP client detected

**Symptom**: Phase 1 finds neither `claude` on PATH nor `~/.cursor/`
nor a Claude Desktop config path.

**Root cause**: The user has no MCP-compatible client installed yet.

**Fix**: install one before running this skill.
- Claude Code: [claude.com/code](https://claude.com/code)
- Cursor: [cursor.com](https://cursor.com)
- Claude Desktop: [claude.ai/download](https://claude.ai/download)

---

## Credential failures

### API call returns `"Status": "error"` with an auth message

**Symptom**: the Phase 2 verification curl returns JSON with
`"Status": "error"` and an `Error` field mentioning invalid key, access
denied, or IP restrictions.

**Root causes and fixes**:

1. **Key not activated**. Dynadot requires you to explicitly enable API
   access on your account. Log in, visit the API settings page
   ([dynadot.com/account/domain/setting/api.html](https://www.dynadot.com/account/domain/setting/api.html?s9F6L9F7U8Q9U8Z8v)),
   and toggle API access on. Regenerate the key if needed.

2. **Sandbox key used against prod** (or vice versa). Sandbox keys only
   work against `api-sandbox.dynadot.com`; prod keys only work against
   `api.dynadot.com`. If the user explicitly chose sandbox in Phase 2,
   they need to generate a sandbox-specific key from the Dynadot
   sandbox UI. Most users want prod.

3. **IP whitelist**. Some Dynadot accounts restrict API access by
   source IP. If the user enabled this, either add the current IP in
   the Dynadot dashboard or remove the restriction. The skill has no
   way to work around this.

4. **Key was rotated or revoked** between generation and the skill
   run. Regenerate and paste the new key.

### Verification curl hangs

**Symptom**: the curl call in Phase 2 runs for >30 seconds without
returning.

**Root cause**: network egress is blocked (corporate proxy, firewall,
captive portal) or Dynadot is having an outage.

**Fix**: check basic connectivity with
`curl -I https://api.dynadot.com/`. If that fails, the user is
offline or proxied — solve the proxy problem first. If it succeeds
but the account_info call still hangs, try again in 5 minutes;
Dynadot's API occasionally has transient slowdowns.

---

## Config write failures

### Existing config file won't parse as JSON

**Symptom**: Read + parse of the target config fails with a JSON
syntax error.

**Root cause**: the user has a malformed config (typically a trailing
comma or an unquoted key from hand-editing).

**Fix**: do NOT overwrite. Tell the user to fix the JSON manually —
they can paste the file into
[jsonlint.com](https://jsonlint.com/) or run `jq . <path>` to locate
the error. Re-run this skill once the file parses. Overwriting a
broken config would destroy any other MCP servers they had configured.

### Write succeeds but client doesn't see the new tool

**Symptom**: config file contains the `domain-mcp` stanza, but the
client's tool list doesn't show domain tools.

**Root causes and fixes**:

1. **Forgot to restart the client**. Cursor and Claude Desktop do not
   hot-reload MCP config. Fully quit and relaunch. Claude Code picks
   up new servers on the next `/mcp` command or session restart.

2. **Wrote to the wrong scope**. Claude Code has both user-level and
   project-level MCP config. If the user opened Claude Code inside a
   directory that has a project `.mcp.json`, that file takes
   precedence. Run `claude mcp list` to see which servers the current
   session sees. If `domain-mcp` is missing, re-add at the right
   scope with `claude mcp add --scope user`.

3. **Stale cached tool definitions**. Some clients cache tool
   metadata. A full restart (not just reload) clears the cache.

### `npx -y domain-mcp --version` hangs

**Symptom**: the Phase 4 smoke test doesn't return a version and exit.

**Root causes and fixes**:

1. **Missed the `--version` flag**. Without any argument, the binary
   detects a piped stdin and runs as an MCP transport, which looks like
   a hang. Confirm the command line includes `--version`.

2. **First-time `npx` download is slow**. On a fresh machine, the
   first `npx -y domain-mcp` can take 10–30 seconds to fetch and
   install the package. Give it time. Subsequent runs are cached.

3. **Package registry is unreachable**. Check network and npm registry
   health: `npm ping`.

---

## Post-install runtime failures

These aren't in the install chain, but you'll hit them next and users
report them back as "install didn't work."

### All tool calls fail with "Dynadot API error"

**Root causes and fixes**:

1. **Rate limit**. Dynadot throttles API calls. Wait 60 seconds and
   retry. If it persists, reduce call volume or batch where possible
   (e.g., `search` accepts an array of domains and checks up to 100
   in one call).

2. **Key revoked** post-install. Regenerate and re-run this skill —
   the config needs to be rewritten with the new key.

3. **Account balance too low** for billable operations (registration,
   renewal, transfer). Top up at
   [dynadot.com/account/credit](https://www.dynadot.com/account/credit.html?s9F6L9F7U8Q9U8Z8v).

### `edit_contact` fails with "missing email" on a partial update

**Root cause**: Dynadot requires the entire contact payload on every
edit, not just the changed fields. This is an upstream API quirk, not
a bug in `domain-mcp`.

**Fix**: provide all contact fields every time you call
`dynadot_contact` with `operation: edit`. Fetch the contact first with
`operation: list` or `operation: get` to populate the fields you don't
intend to change.

### `lock_domain` unlock returns "this domain has been locked already"

**Root cause**: Dynadot's API returns a misleading error when
unlocking some domains — sometimes the domain really is locked and
the server is refusing to unlock via API, sometimes the error is
spurious.

**Fix**: try unlocking from the Dynadot web control panel. If that
also fails, the domain has a registry-level lock that requires a
support ticket.

---

## Sandbox gotchas

The `DYNADOT_SANDBOX=true` mode routes to `api-sandbox.dynadot.com`.
It has real capability gaps compared to production — most of which
are NOT documented in the Dynadot API reference.

**Known issues**:

- **`create_contact` fails** with a misleading "missing phone number"
  error even when the phone number is present and correctly
  formatted. The exact same payload succeeds against prod. Workaround:
  use an existing contact ID from your prod account in sandbox tests.
- **Aftermarket operations** that are destructive in prod (placing
  bids, buying backordered domains) are sandbox-only in this package
  as a deliberate safety measure.
- **Balance and billing** are simulated in sandbox — you can "buy"
  domains and they will appear in your sandbox account, but nothing
  is actually registered and no money moves.
- **Key rotation** is independent between sandbox and prod. A key
  generated in the Dynadot prod dashboard does not work against
  sandbox, and vice versa.

**Advice**: default new users to `prod`. Sandbox is genuinely useful
for integration tests and experimentation, but a user who thinks
sandbox should behave exactly like prod will file bugs against
`domain-mcp` that are actually upstream Dynadot API gaps.
