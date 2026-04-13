#!/usr/bin/env bash
# session-preflight.sh — domain-agent-kit SessionStart hook.
#
# Fast credential presence check that runs once per Claude Code session. Does
# NOT hit the network — that would slow every session start. Only verifies
# file-level presence of either the project settings file or the shell env
# var. If neither is present, prints a loud stderr message pointing at
# /domain-agent-kit:setup. Silent when credentials are in place.
#
# Exit 0 always — this is advisory, never blocking. Blocking the session on
# missing credentials would lock users out of Claude Code entirely.

set -uo pipefail

SETTINGS_FILE=".claude/domain-agent-kit.local.md"

have_key=false

if [[ -f "$SETTINGS_FILE" ]]; then
  # Check the dynadot_api_key field exists in frontmatter and is non-empty.
  # Anchor on ":" to avoid matching a settings field like `dynadot_api_key_notes`.
  key_value="$(sed -n '/^---$/,/^---$/{ /^---$/d; p; }' "$SETTINGS_FILE" 2>/dev/null \
    | awk '/^dynadot_api_key:[[:space:]]/ { sub(/^dynadot_api_key:[[:space:]]*/, ""); gsub(/^"|"$/, ""); print; exit }')"
  if [[ -n "$key_value" ]]; then
    have_key=true
  fi
fi

if [[ "$have_key" == "false" && -n "${DYNADOT_API_KEY:-}" ]]; then
  have_key=true
fi

# Silent success — no noise at every session start when things are fine.
if [[ "$have_key" == "true" ]]; then
  exit 0
fi

# Loud failure — user needs to know before they try their first tool call.
cat >&2 <<'MSG'
[domain-agent-kit] Credentials NOT configured.
  Run /domain-agent-kit:setup in this session to configure, or export
  DYNADOT_API_KEY in your shell and restart Claude Code. Until then, all
  Dynadot MCP tool calls will fail with a credential error.
MSG

exit 0
