---
title: "transfers.manage MCP Tool"
description: "Domain transfers: initiate, check status, manage auth codes, push requests"
keywords:
  - MCP tool
  - domain management
  - Dynadot API
  - transfers.manage
slug: /tools/transfers/manage
---

# `transfers.manage`

Domain transfers: initiate, check status, manage auth codes, push requests

## Safety and behavior

| Property | Value |
| --- | --- |
| Read-only | No |
| Destructive | Yes |
| Idempotent | No |
| Uses external systems | Yes |

## Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `operation` | string | Yes | Operation to perform: initiate: Initiate domain transfer \| status: Check transfer status \| cancel: Cancel pending transfer \| get_auth_code: Get transfer auth code \| set_auth_code: Set custom auth code \| authorize_away: Authorize transfer to another registrar \| get_push_request: Get pending push request \| set_push_request: Accept or decline push request |
| `domain` | string | No | Domain name (e.g., example.com, mysite.net) |
| `authCode` | string | No | Transfer authorization/EPP code |
| `action` | string | No | Accept or decline push request |

## Input schema


```json
{
  "type": "object",
  "properties": {
    "operation": {
      "type": "string",
      "enum": [
        "initiate",
        "status",
        "cancel",
        "get_auth_code",
        "set_auth_code",
        "authorize_away",
        "get_push_request",
        "set_push_request"
      ],
      "description": "Operation to perform: initiate: Initiate domain transfer | status: Check transfer status | cancel: Cancel pending transfer | get_auth_code: Get transfer auth code | set_auth_code: Set custom auth code | authorize_away: Authorize transfer to another registrar | get_push_request: Get pending push request | set_push_request: Accept or decline push request"
    },
    "domain": {
      "description": "Domain name (e.g., example.com, mysite.net)",
      "type": "string"
    },
    "authCode": {
      "description": "Transfer authorization/EPP code",
      "type": "string"
    },
    "action": {
      "description": "Accept or decline push request",
      "type": "string",
      "enum": [
        "accept",
        "decline"
      ]
    }
  },
  "required": [
    "operation"
  ],
  "$schema": "http://json-schema.org/draft-07/schema#"
}
```

## Output schema


```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "description": "Whether the requested operation completed successfully."
    },
    "data": {
      "description": "Structured operation result when success is true.",
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {}
    },
    "error": {
      "description": "Structured failure details when success is false.",
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "description": "Stable error category for programmatic handling."
        },
        "message": {
          "type": "string",
          "description": "Human-readable explanation of the failure."
        },
        "suggestions": {
          "description": "Suggested corrective actions, when available.",
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "validActions": {
          "description": "Allowed operation names when an unknown operation was requested.",
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "docsUrl": {
          "type": "string",
          "description": "Documentation URL relevant to the failed tool."
        }
      },
      "required": [
        "type",
        "message",
        "docsUrl"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "success"
  ],
  "$schema": "http://json-schema.org/draft-07/schema#",
  "additionalProperties": false
}
```

