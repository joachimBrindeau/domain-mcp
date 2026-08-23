---
title: "server.help MCP Tool"
description: "Discover available tools and operations. Use query: \"tools\" to list all tools, \"actions\" with a tool name to list operations, \"examples\" for usage examples."
keywords:
  - MCP tool
  - domain management
  - Dynadot API
  - server.help
slug: /tools/server/help
---

# `server.help`

Discover available tools and operations. Use query: "tools" to list all tools, "actions" with a tool name to list operations, "examples" for usage examples.

## Safety and behavior

| Property | Value |
| --- | --- |
| Read-only | Yes |
| Destructive | No |
| Idempotent | Yes |
| Uses external systems | No |

## Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `query` | string | Yes | What to get help on |
| `tool` | string | No | Specific tool name (for actions query) |

## Input schema


```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "enum": [
        "tools",
        "actions",
        "examples"
      ],
      "description": "What to get help on"
    },
    "tool": {
      "description": "Specific tool name (for actions query)",
      "type": "string"
    }
  },
  "required": [
    "query"
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

