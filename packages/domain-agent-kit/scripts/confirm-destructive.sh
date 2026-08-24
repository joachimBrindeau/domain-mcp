#!/usr/bin/env bash
# Claude Code PreToolUse adapter for domain-agent-kit.
# Every valid mutating Domain MCP operation listed in hooks/approval-policy.json
# receives a native confirmation prompt. Unknown tools, unknown operations, and
# malformed input fail closed; policy lookup failures also fail closed.

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
TOOL_NAME="$(printf '%s' "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null || true)"
OPERATION="$(printf '%s' "$INPUT" | jq -r '.tool_input.operation // empty' 2>/dev/null || true)"

if [[ -z "$TOOL_NAME" || -z "$OPERATION" ]]; then
  emit_ask "domain-agent-kit guard could not parse this tool call. Confirm manually before proceeding."
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
POLICY_PATH="${SCRIPT_DIR}/../hooks/approval-policy.json"

if ! jq -e --arg tool "$TOOL_NAME" 'has($tool)' "$POLICY_PATH" >/dev/null 2>&1; then
  emit_ask "domain-agent-kit guard does not recognize ${TOOL_NAME}. Confirm manually before proceeding."
fi

if ! jq -e --arg tool "$TOOL_NAME" --arg operation "$OPERATION" \
  '.[$tool].all | index($operation)' "$POLICY_PATH" >/dev/null 2>&1; then
  emit_ask "domain-agent-kit guard does not recognize ${TOOL_NAME} operation=\"${OPERATION}\". Confirm manually before proceeding."
fi

if ! jq -e --arg tool "$TOOL_NAME" --arg operation "$OPERATION" \
  '.[$tool].mutating | index($operation)' "$POLICY_PATH" >/dev/null 2>&1; then
  exit 0
fi

DOMAIN="$(printf '%s' "$INPUT" | jq -r '.tool_input.domain // (.tool_input.domains[0]? // empty) // empty' 2>/dev/null || true)"
CONTACT_ID="$(printf '%s' "$INPUT" | jq -r '.tool_input.contactId // .tool_input.contact_id // empty' 2>/dev/null || true)"
FOLDER_ID="$(printf '%s' "$INPUT" | jq -r '.tool_input.folderId // .tool_input.folder_id // empty' 2>/dev/null || true)"

target_parts=()
[[ -n "$DOMAIN" ]] && target_parts+=("domain=${DOMAIN}")
[[ -n "$CONTACT_ID" ]] && target_parts+=("contact_id=${CONTACT_ID}")
[[ -n "$FOLDER_ID" ]] && target_parts+=("folder_id=${FOLDER_ID}")
TARGET="${target_parts[*]:-(no target field in tool_input)}"

emit_ask "domain-agent-kit guard: ${TOOL_NAME} operation=\"${OPERATION}\" (${TARGET}) changes registrar state or creates a paid commitment. Confirm before proceeding."
