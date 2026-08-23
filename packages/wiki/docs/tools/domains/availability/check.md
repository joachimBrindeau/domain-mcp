---
title: "domains.availability.check MCP Tool"
description: "Check if a single domain is available for registration. Designed for parallel execution - launch multiple haiku agents to check many domains at once."
keywords:
  - MCP tool
  - domain management
  - Dynadot API
  - domains.availability.check
slug: /tools/domains/availability/check
---

# `domains.availability.check`

Check if a single domain is available for registration. Designed for parallel execution - launch multiple haiku agents to check many domains at once.

## Safety and behavior

| Property | Value |
| --- | --- |
| Read-only | Yes |
| Destructive | No |
| Idempotent | Yes |
| Uses external systems | Yes |

## Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `domain` | string | Yes | Domain to check (e.g., example.com) |
| `showPrice` | boolean | No | Include pricing info |

## Input schema


```json
{
  "type": "object",
  "properties": {
    "domain": {
      "type": "string",
      "description": "Domain to check (e.g., example.com)"
    },
    "showPrice": {
      "default": false,
      "description": "Include pricing info",
      "type": "boolean"
    }
  },
  "required": [
    "domain"
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

