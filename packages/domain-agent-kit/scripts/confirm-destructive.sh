#!/usr/bin/env bash
# confirm-destructive.sh — Claude Code PreToolUse hook for domain-agent-kit.
#
# Reads the tool-call JSON from stdin. If the MCP tool call matches a known
# irreversible operation, emits a structured permissionDecision of "ask" so
# Claude Code surfaces a native confirmation prompt to the user. If the hook
# script cannot parse the input (truncation, missing fields, malformed JSON),
# it ALSO emits "ask" rather than allowing — the destructive-op guard fails
# closed, not open. Better to inconvenience the user with one extra
# confirmation than to silently let a delete through because jq tripped.
#
# Note on tool names: the underlying domain-mcp server registers composite
# tools without the `dynadot_` prefix (`domain`, `dns`, `domain_settings`,
# `transfer`, `contact`, `folder`, `aftermarket`, `account`, etc.). Claude
# Code prefixes those with `mcp__dynadot__` because the plugin's .mcp.json
# names the server `dynadot`.

set -uo pipefail

emit_ask() {
  local message="$1"
  jq -n --arg msg "$message" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask"
    },
    systemMessage: $msg
  }'
  exit 0
}

INPUT="$(cat)"

# Parse tool_name and operation. // empty makes jq print nothing for missing
# fields, which simplifies the emptiness checks below.
TOOL_NAME="$(printf '%s' "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null || true)"
OPERATION="$(printf '%s' "$INPUT" | jq -r '.tool_input.operation // empty' 2>/dev/null || true)"

# Fail closed: if we cannot identify the call, ask the user rather than
# silently allowing. This is the opposite of the typical "fail open" hook
# default — we accept the friction because the cost of a wrong allow is
# higher than the cost of an extra confirmation.
if [[ -z "$TOOL_NAME" || -z "$OPERATION" ]]; then
  emit_ask "domain-agent-kit guard could not parse this tool call. Confirm manually before proceeding."
fi

# Destructive operation set. Each line is "<tool_name>:<operation>".
# Keep this list in sync with the matcher regex in hooks.json.
is_destructive=false
reason=""
case "${TOOL_NAME}:${OPERATION}" in
  mcp__dynadot__domain:delete)
    is_destructive=true
    reason="permanently deletes a domain from the account"
    ;;
  mcp__dynadot__domain:push)
    is_destructive=true
    reason="transfers ownership to another Dynadot account"
    ;;
  mcp__dynadot__transfer:initiate)
    is_destructive=true
    reason="starts an inbound domain transfer (billable, multi-day commitment)"
    ;;
  mcp__dynadot__aftermarket:delist)
    is_destructive=true
    reason="removes an aftermarket listing and voids any standing offers"
    ;;
  mcp__dynadot__aftermarket:cancel_bid)
    is_destructive=true
    reason="cancels a placed auction bid"
    ;;
  mcp__dynadot__contact:delete)
    is_destructive=true
    reason="permanently deletes a WHOIS contact"
    ;;
  mcp__dynadot__folder:delete)
    is_destructive=true
    reason="permanently deletes a domain folder"
    ;;
esac

if [[ "$is_destructive" == "false" ]]; then
  exit 0
fi

# Pull useful target info out of tool_input so the prompt is specific.
DOMAIN="$(printf '%s' "$INPUT" | jq -r '.tool_input.domain // (.tool_input.domains[0]? // empty) // empty' 2>/dev/null || true)"
CONTACT_ID="$(printf '%s' "$INPUT" | jq -r '.tool_input.contactId // .tool_input.contact_id // empty' 2>/dev/null || true)"
FOLDER_ID="$(printf '%s' "$INPUT" | jq -r '.tool_input.folderId // .tool_input.folder_id // empty' 2>/dev/null || true)"

target_parts=()
[[ -n "$DOMAIN" ]]     && target_parts+=("domain=${DOMAIN}")
[[ -n "$CONTACT_ID" ]] && target_parts+=("contact_id=${CONTACT_ID}")
[[ -n "$FOLDER_ID" ]]  && target_parts+=("folder_id=${FOLDER_ID}")
TARGET="${target_parts[*]:-(no target field in tool_input)}"

emit_ask "domain-agent-kit guard: ${TOOL_NAME} operation=\"${OPERATION}\" (${TARGET}) ${reason}. Confirm before proceeding."
