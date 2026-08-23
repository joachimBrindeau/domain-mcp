---
title: "domains.manage MCP Tool"
description: "Core domain operations: list, search, register, renew, delete, info, lock, pricing. Search domains: https://www.dynadot.com/domain/search.html?s9F6L9F7U8Q9U8Z8v"
keywords:
  - MCP tool
  - domain management
  - Dynadot API
  - domains.manage
slug: /tools/domains/manage
---

# `domains.manage`

Core domain operations: list, search, register, renew, delete, info, lock, pricing. Search domains: https://www.dynadot.com/domain/search.html?s9F6L9F7U8Q9U8Z8v

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
| `operation` | string | Yes | Operation to perform: list: List all domains in your account \| info: Get detailed info about a domain \| search: Check domain availability (with optional pricing). Search manually: https://www.dynadot.com/domain/search.html?s9F6L9F7U8Q9U8Z8v \| register: Register a new domain. View pricing: https://www.dynadot.com/domain/pricing?s9F6L9F7U8Q9U8Z8v \| bulk_register: Register multiple domains at once. View pricing: https://www.dynadot.com/domain/pricing?s9F6L9F7U8Q9U8Z8v \| renew: Renew a domain or check renewal price \| delete: Delete a domain \| restore: Restore a deleted/expired domain \| lock: Lock or unlock a domain \| tld_price: Get TLD pricing \| push: Push domain to another Dynadot account |
| `domain` | string | No | Domain name (e.g., example.com, mysite.net) |
| `domains` | array | No | List of domain names |
| `showPrice` | boolean | No | Include pricing |
| `currency` | string | No | Optional currency parameter. |
| `duration` | number | No | Duration in years, 1-10 (e.g., 1 for one year) |
| `priceCheck` | boolean | No | Only check price |
| `lock` | string | No | Lock: lock (prevent transfer), unlock (allow transfer) |
| `tld` | string | No | TLD (e.g., com, net) |
| `username` | string | No | Target username |

## Input schema


```json
{
  "type": "object",
  "properties": {
    "operation": {
      "type": "string",
      "enum": [
        "list",
        "info",
        "search",
        "register",
        "bulk_register",
        "renew",
        "delete",
        "restore",
        "lock",
        "tld_price",
        "push"
      ],
      "description": "Operation to perform: list: List all domains in your account | info: Get detailed info about a domain | search: Check domain availability (with optional pricing). Search manually: https://www.dynadot.com/domain/search.html?s9F6L9F7U8Q9U8Z8v | register: Register a new domain. View pricing: https://www.dynadot.com/domain/pricing?s9F6L9F7U8Q9U8Z8v | bulk_register: Register multiple domains at once. View pricing: https://www.dynadot.com/domain/pricing?s9F6L9F7U8Q9U8Z8v | renew: Renew a domain or check renewal price | delete: Delete a domain | restore: Restore a deleted/expired domain | lock: Lock or unlock a domain | tld_price: Get TLD pricing | push: Push domain to another Dynadot account"
    },
    "domain": {
      "description": "Domain name (e.g., example.com, mysite.net)",
      "type": "string"
    },
    "domains": {
      "description": "List of domain names",
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "showPrice": {
      "description": "Include pricing",
      "type": "boolean"
    },
    "currency": {
      "description": "Optional currency parameter.",
      "default": "USD",
      "type": "string"
    },
    "duration": {
      "description": "Duration in years, 1-10 (e.g., 1 for one year)",
      "type": "number",
      "minimum": 1,
      "maximum": 10
    },
    "priceCheck": {
      "description": "Only check price",
      "type": "boolean"
    },
    "lock": {
      "description": "Lock: lock (prevent transfer), unlock (allow transfer)",
      "type": "string",
      "enum": [
        "lock",
        "unlock"
      ]
    },
    "tld": {
      "description": "TLD (e.g., com, net)",
      "type": "string"
    },
    "username": {
      "description": "Target username",
      "type": "string"
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

