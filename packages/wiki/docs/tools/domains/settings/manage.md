---
title: "domains.settings.manage MCP Tool"
description: "Configure domain settings: nameservers, privacy, renewal, forwarding, parking, WHOIS"
keywords:
  - MCP tool
  - domain management
  - Dynadot API
  - domains.settings.manage
slug: /tools/domains/settings/manage
---

# `domains.settings.manage`

Configure domain settings: nameservers, privacy, renewal, forwarding, parking, WHOIS

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
| `operation` | string | Yes | Operation to perform: set_ns: Set nameservers \| get_ns: Get current nameservers \| set_renew_option: Set auto-renewal option \| set_privacy: Set WHOIS privacy \| set_whois: Set WHOIS contact \| set_forwarding: Set URL forwarding \| set_stealth: Set stealth/masked forwarding \| set_parking: Enable parking page \| set_hosting: Set hosting settings \| set_email_forward: Set email forwarding \| set_folder: Move domain to folder \| set_note: Set domain note \| clear_settings: Clear all custom settings |
| `domain` | string | No | Domain name (e.g., example.com, mysite.net) |
| `nameservers` | array | No | Nameservers (e.g., ["ns1.example.com", "ns2.example.com"]) |
| `renewOption` | string | No | Renewal: auto (renew), donot (expire), reset (default) |
| `domains` | array | No | List of domain names (e.g., ["example.com", "example.net"]) |
| `option` | string | No | WHOIS privacy: full (hide all), partial (hide email), off (public) |
| `registrantContact` | string | No | Contact ID from contact list (e.g., "12345") |
| `adminContact` | string | No | Optional adminContact parameter. |
| `techContact` | string | No | Optional techContact parameter. |
| `billingContact` | string | No | Optional billingContact parameter. |
| `forwardUrl` | string | No | URL for forwarding (e.g., https://example.com/page) |
| `forwardType` | string | No | Optional forwardType parameter. |
| `stealthUrl` | string | No | URL for forwarding (e.g., https://example.com/page) |
| `stealthTitle` | string | No | Page title |
| `options` | object | No | Hosting options |
| `forwardTo` | string | No | Email address (e.g., admin@example.com) |
| `username` | string | No | Email username (default: *) |
| `folderId` | string | No | Folder ID from folder list (e.g., "67890") |
| `note` | string | No | Note text (e.g., "Primary business domain") |

## Input schema


```json
{
  "type": "object",
  "properties": {
    "operation": {
      "type": "string",
      "enum": [
        "set_ns",
        "get_ns",
        "set_renew_option",
        "set_privacy",
        "set_whois",
        "set_forwarding",
        "set_stealth",
        "set_parking",
        "set_hosting",
        "set_email_forward",
        "set_folder",
        "set_note",
        "clear_settings"
      ],
      "description": "Operation to perform: set_ns: Set nameservers | get_ns: Get current nameservers | set_renew_option: Set auto-renewal option | set_privacy: Set WHOIS privacy | set_whois: Set WHOIS contact | set_forwarding: Set URL forwarding | set_stealth: Set stealth/masked forwarding | set_parking: Enable parking page | set_hosting: Set hosting settings | set_email_forward: Set email forwarding | set_folder: Move domain to folder | set_note: Set domain note | clear_settings: Clear all custom settings"
    },
    "domain": {
      "description": "Domain name (e.g., example.com, mysite.net)",
      "type": "string"
    },
    "nameservers": {
      "description": "Nameservers (e.g., [\"ns1.example.com\", \"ns2.example.com\"])",
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "renewOption": {
      "description": "Renewal: auto (renew), donot (expire), reset (default)",
      "type": "string",
      "enum": [
        "auto",
        "donot",
        "reset"
      ]
    },
    "domains": {
      "description": "List of domain names (e.g., [\"example.com\", \"example.net\"])",
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "option": {
      "description": "WHOIS privacy: full (hide all), partial (hide email), off (public)",
      "type": "string",
      "enum": [
        "full",
        "partial",
        "off"
      ]
    },
    "registrantContact": {
      "description": "Contact ID from contact list (e.g., \"12345\")",
      "type": "string"
    },
    "adminContact": {
      "description": "Optional adminContact parameter.",
      "type": "string"
    },
    "techContact": {
      "description": "Optional techContact parameter.",
      "type": "string"
    },
    "billingContact": {
      "description": "Optional billingContact parameter.",
      "type": "string"
    },
    "forwardUrl": {
      "description": "URL for forwarding (e.g., https://example.com/page)",
      "type": "string"
    },
    "forwardType": {
      "description": "Optional forwardType parameter.",
      "type": "string",
      "enum": [
        "temporary",
        "permanent"
      ]
    },
    "stealthUrl": {
      "description": "URL for forwarding (e.g., https://example.com/page)",
      "type": "string"
    },
    "stealthTitle": {
      "description": "Page title",
      "type": "string"
    },
    "options": {
      "description": "Hosting options",
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {
        "type": "string"
      }
    },
    "forwardTo": {
      "description": "Email address (e.g., admin@example.com)",
      "type": "string"
    },
    "username": {
      "description": "Email username (default: *)",
      "type": "string"
    },
    "folderId": {
      "description": "Folder ID from folder list (e.g., \"67890\")",
      "type": "string"
    },
    "note": {
      "description": "Note text (e.g., \"Primary business domain\")",
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

