#!/usr/bin/env bash
# Launch the pinned domain-mcp server. The host supplies credentials through
# its protected environment or secret mechanism; this script never reads or
# persists project-local secret files. Stdout is reserved for MCP transport.

set -euo pipefail

err() { printf '[domain-agent-kit] %s\n' "$*" >&2; }

if [[ -z "${DYNADOT_API_KEY:-}" ]]; then
  err "DYNADOT_API_KEY is not available to the MCP process."
  err "Configure it through your host's secret or protected environment mechanism, then restart the host."
  exit 1
fi

export DYNADOT_SANDBOX="${DYNADOT_SANDBOX:-false}"
VERSION="${DOMAIN_MCP_VERSION:-3.0.0}"
exec npx -y "domain-mcp@${VERSION}"
