---
title: "domains.ideas.generate MCP Tool"
description: "Generate domain name ideas from keywords and automatically check availability. Returns ONLY available domains with prices. Dynadot`s search command is single-domain and effectively serial, so each candidate takes one round-trip; plan on roughly one second per 3 domains."
keywords:
  - MCP tool
  - domain management
  - Dynadot API
  - domains.ideas.generate
slug: /tools/domains/ideas/generate
---

# `domains.ideas.generate`

Generate domain name ideas from keywords and automatically check availability. Returns ONLY available domains with prices. Dynadot`s search command is single-domain and effectively serial, so each candidate takes one round-trip; plan on roughly one second per 3 domains.

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
| `keywords` | array | Yes | Core keywords extracted from product/tool description (e.g., ["task", "flow", "automate"]) |
| `tlds` | array | No | TLDs to check (default: com, io, co, app, dev, ai) |
| `patterns` | array | No | Generation patterns: exact, hyphenated, prefix, suffix (default: all) |
| `maxToCheck` | number | No | Maximum domains to check for availability (default: 100) |

## Input schema


```json
{
  "type": "object",
  "properties": {
    "keywords": {
      "minItems": 1,
      "maxItems": 10,
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Core keywords extracted from product/tool description (e.g., [\"task\", \"flow\", \"automate\"])"
    },
    "tlds": {
      "description": "TLDs to check (default: com, io, co, app, dev, ai)",
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "patterns": {
      "description": "Generation patterns: exact, hyphenated, prefix, suffix (default: all)",
      "type": "array",
      "items": {
        "type": "string",
        "enum": [
          "exact",
          "hyphenated",
          "prefix",
          "suffix"
        ]
      }
    },
    "maxToCheck": {
      "description": "Maximum domains to check for availability (default: 100)",
      "type": "number",
      "minimum": 10,
      "maximum": 500
    }
  },
  "required": [
    "keywords"
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

