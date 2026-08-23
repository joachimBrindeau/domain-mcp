---
title: "folders.manage MCP Tool"
description: "Folder management: create, delete, list, configure folder-level settings"
keywords:
  - MCP tool
  - domain management
  - Dynadot API
  - folders.manage
slug: /tools/folders/manage
---

# `folders.manage`

Folder management: create, delete, list, configure folder-level settings

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
| `operation` | string | Yes | Operation to perform: list: List all folders \| create: Create new folder \| delete: Delete folder \| rename: Rename folder \| set_whois: Set WHOIS for all domains in folder \| set_ns: Set nameservers for folder \| set_parking: Enable parking for folder \| set_forwarding: Set forwarding for folder \| set_stealth: Set stealth forwarding for folder \| set_hosting: Set hosting for folder \| set_dns: Set DNS for folder \| set_dns2: Set DNS2 for folder \| set_email_forward: Set email forwarding for folder \| set_renew_option: Set renewal option for folder \| clear_settings: Clear all folder settings |
| `folderName` | string | No | Name (e.g., "John Doe") |
| `folderId` | string | No | Folder ID from folder list (e.g., "67890") |
| `contactId` | string | No | Contact ID from contact list (e.g., "12345") |
| `nameservers` | array | No | Nameservers (e.g., ["ns1.example.com", "ns2.example.com"]) |
| `forwardUrl` | string | No | URL for forwarding (e.g., https://example.com/page) |
| `stealthUrl` | string | No | URL for forwarding (e.g., https://example.com/page) |
| `options` | object | No | Optional options parameter. |
| `mainRecords` | array | No | Optional mainRecords parameter. |
| `subdomainRecords` | array | No | Optional subdomainRecords parameter. |
| `email` | string | No | Email address (e.g., admin@example.com) |
| `renewOption` | string | No | Renewal: auto (renew), donot (expire), reset (default) |

## Input schema


```json
{
  "type": "object",
  "properties": {
    "operation": {
      "type": "string",
      "enum": [
        "list",
        "create",
        "delete",
        "rename",
        "set_whois",
        "set_ns",
        "set_parking",
        "set_forwarding",
        "set_stealth",
        "set_hosting",
        "set_dns",
        "set_dns2",
        "set_email_forward",
        "set_renew_option",
        "clear_settings"
      ],
      "description": "Operation to perform: list: List all folders | create: Create new folder | delete: Delete folder | rename: Rename folder | set_whois: Set WHOIS for all domains in folder | set_ns: Set nameservers for folder | set_parking: Enable parking for folder | set_forwarding: Set forwarding for folder | set_stealth: Set stealth forwarding for folder | set_hosting: Set hosting for folder | set_dns: Set DNS for folder | set_dns2: Set DNS2 for folder | set_email_forward: Set email forwarding for folder | set_renew_option: Set renewal option for folder | clear_settings: Clear all folder settings"
    },
    "folderName": {
      "description": "Name (e.g., \"John Doe\")",
      "type": "string"
    },
    "folderId": {
      "description": "Folder ID from folder list (e.g., \"67890\")",
      "type": "string"
    },
    "contactId": {
      "description": "Contact ID from contact list (e.g., \"12345\")",
      "type": "string"
    },
    "nameservers": {
      "description": "Nameservers (e.g., [\"ns1.example.com\", \"ns2.example.com\"])",
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "forwardUrl": {
      "description": "URL for forwarding (e.g., https://example.com/page)",
      "type": "string"
    },
    "stealthUrl": {
      "description": "URL for forwarding (e.g., https://example.com/page)",
      "type": "string"
    },
    "options": {
      "description": "Optional options parameter.",
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {
        "type": "string"
      }
    },
    "mainRecords": {
      "description": "Optional mainRecords parameter.",
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "description": "Record type (A, AAAA, CNAME, MX, TXT)"
          },
          "value": {
            "type": "string",
            "description": "Record value"
          },
          "ttl": {
            "description": "TTL in seconds",
            "type": "number"
          },
          "priority": {
            "description": "Priority (for MX)",
            "type": "number"
          }
        },
        "required": [
          "type",
          "value"
        ]
      }
    },
    "subdomainRecords": {
      "description": "Optional subdomainRecords parameter.",
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "subdomain": {
            "type": "string",
            "description": "Subdomain name"
          },
          "type": {
            "type": "string",
            "description": "Record type"
          },
          "value": {
            "type": "string",
            "description": "Record value"
          },
          "ttl": {
            "description": "TTL in seconds",
            "type": "number"
          },
          "priority": {
            "description": "Priority (for MX)",
            "type": "number"
          }
        },
        "required": [
          "subdomain",
          "type",
          "value"
        ]
      }
    },
    "email": {
      "description": "Email address (e.g., admin@example.com)",
      "type": "string"
    },
    "renewOption": {
      "description": "Renewal: auto (renew), donot (expire), reset (default)",
      "type": "string",
      "enum": [
        "auto",
        "donot",
        "reset"
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

