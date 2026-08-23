---
title: "account.manage MCP Tool"
description: "Account info, balance, and default settings for new domains. Manage API keys: https://www.dynadot.com/account/domain/setting/api.html?s9F6L9F7U8Q9U8Z8v"
keywords:
  - MCP tool
  - domain management
  - Dynadot API
  - account.manage
slug: /tools/account/manage
---

# `account.manage`

Account info, balance, and default settings for new domains. Manage API keys: https://www.dynadot.com/account/domain/setting/api.html?s9F6L9F7U8Q9U8Z8v

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
| `operation` | string | Yes | Operation to perform: info: Get account information \| balance: Get account balance \| set_default_whois: Set default WHOIS contact \| set_default_ns: Set default nameservers \| set_default_parking: Set default parking \| set_default_forwarding: Set default forwarding \| set_default_stealth: Set default stealth forwarding \| set_default_hosting: Set default hosting \| set_default_dns: Set default DNS \| set_default_dns2: Set default DNS2 \| set_default_email_forward: Set default email forwarding \| set_default_renew_option: Set default renewal option \| clear_defaults: Clear all default settings |
| `currency` | string | No | Optional currency parameter. |
| `contactId` | string | No | Contact ID from contact list (e.g., "12345") |
| `nameservers` | array | No | Nameservers (e.g., ["ns1.example.com", "ns2.example.com"]) |
| `forwardUrl` | string | No | URL for forwarding (e.g., https://example.com/page) |
| `stealthUrl` | string | No | URL for forwarding (e.g., https://example.com/page) |
| `options` | object | No | Optional options parameter. |
| `mainRecords` | array | No | Optional mainRecords parameter. |
| `subdomainRecords` | array | No | Optional subdomainRecords parameter. |
| `email` | string | No | Email address (e.g., admin@example.com) |
| `renewOption` | string | No | Optional renewOption parameter. |

## Input schema


```json
{
  "type": "object",
  "properties": {
    "operation": {
      "type": "string",
      "enum": [
        "info",
        "balance",
        "set_default_whois",
        "set_default_ns",
        "set_default_parking",
        "set_default_forwarding",
        "set_default_stealth",
        "set_default_hosting",
        "set_default_dns",
        "set_default_dns2",
        "set_default_email_forward",
        "set_default_renew_option",
        "clear_defaults"
      ],
      "description": "Operation to perform: info: Get account information | balance: Get account balance | set_default_whois: Set default WHOIS contact | set_default_ns: Set default nameservers | set_default_parking: Set default parking | set_default_forwarding: Set default forwarding | set_default_stealth: Set default stealth forwarding | set_default_hosting: Set default hosting | set_default_dns: Set default DNS | set_default_dns2: Set default DNS2 | set_default_email_forward: Set default email forwarding | set_default_renew_option: Set default renewal option | clear_defaults: Clear all default settings"
    },
    "currency": {
      "description": "Optional currency parameter.",
      "default": "USD",
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
      "description": "Optional renewOption parameter.",
      "type": "string",
      "enum": [
        "auto",
        "donot"
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

