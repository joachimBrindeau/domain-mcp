#!/usr/bin/env bash
# launch-domain-mcp.sh — wrapper that resolves DYNADOT_API_KEY + DYNADOT_SANDBOX
# from plugin settings (project-scoped) or the shell environment, then execs
# the published `domain-mcp` binary via npx.
#
# Precedence for each var:
#   1. .claude/domain-agent-kit.local.md frontmatter in the current working dir
#      (the user's project, not the plugin install dir)
#   2. Existing env var (DYNADOT_API_KEY / DYNADOT_SANDBOX)
#   3. Error out with a pointer to /domain-agent-kit:setup
#
# Stderr only — stdout is reserved for the MCP transport.

set -euo pipefail

SETTINGS_FILE=".claude/domain-agent-kit.local.md"

err() { printf '[domain-agent-kit] %s\n' "$*" >&2; }

read_frontmatter_field() {
  # $1 = field name
  # reads YAML frontmatter (between --- markers) and prints the value.
  # Strips surrounding single or double quotes. Empty output if missing.
  local field="$1"
  [[ -f "$SETTINGS_FILE" ]] || return 0
  sed -n '/^---$/,/^---$/{ /^---$/d; p; }' "$SETTINGS_FILE" \
    | awk -v field="$field" '
        $0 ~ "^"field":" {
          sub("^"field":[[:space:]]*", "")
          sub(/^"/, ""); sub(/"$/, "")
          sub(/^'\''/, ""); sub(/'\''$/, "")
          print
          exit
        }
      '
}

# Resolve API key: settings file wins over shell env.
SETTINGS_KEY="$(read_frontmatter_field dynadot_api_key || true)"
if [[ -n "${SETTINGS_KEY:-}" ]]; then
  export DYNADOT_API_KEY="$SETTINGS_KEY"
fi

if [[ -z "${DYNADOT_API_KEY:-}" ]]; then
  err "DYNADOT_API_KEY is not set."
  err "Fix: run /domain-agent-kit:setup in Claude Code to configure it,"
  err "or export DYNADOT_API_KEY in your shell before launching Claude Code."
  exit 1
fi

# Resolve sandbox flag: settings file wins; default false.
SETTINGS_SANDBOX="$(read_frontmatter_field dynadot_sandbox || true)"
if [[ -n "${SETTINGS_SANDBOX:-}" ]]; then
  export DYNADOT_SANDBOX="$SETTINGS_SANDBOX"
fi
export DYNADOT_SANDBOX="${DYNADOT_SANDBOX:-false}"

# Exec the published MCP server. `-y` auto-accepts the npx install prompt.
# `exec` replaces this shell so the MCP server owns stdin/stdout directly.
#
# The version spec is controlled by DOMAIN_MCP_VERSION (set in .mcp.json env
# block). Default: ^3.0.0. Pinning prevents surprise breakage when upstream
# ships a new major version with an incompatible tool surface. Override by
# exporting DOMAIN_MCP_VERSION in your shell or editing the plugin's .mcp.json.
VERSION="${DOMAIN_MCP_VERSION:-^3.0.0}"
exec npx -y "domain-mcp@${VERSION}"
