---
title: "contacts.manage MCP Tool"
description: "WHOIS contact management: create, edit, delete, list, regional settings"
keywords:
  - MCP tool
  - domain management
  - Dynadot API
  - contacts.manage
slug: /tools/contacts/manage
---

# `contacts.manage`

WHOIS contact management: create, edit, delete, list, regional settings

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
| `operation` | string | Yes | Operation to perform: list: List all contacts \| get: Get contact details \| create: Create new contact \| edit: Update contact \| delete: Delete contact \| create_cn_audit: Create .CN domain audit \| get_cn_audit_status: Get .CN audit status \| set_eu_setting: Set EU contact settings \| set_lv_setting: Set Latvia contact settings \| set_lt_setting: Set Lithuania contact settings |
| `contactId` | string | No | Contact ID from contact list (e.g., "12345") |
| `name` | string | No | Contact name |
| `email` | string | No | Email |
| `phoneCc` | string | No | Phone country code (e.g., "1" for US, "33" for France) |
| `phoneNum` | string | No | Phone number without country code (e.g., "5551234567") |
| `address1` | string | No | Address line 1 |
| `city` | string | No | City |
| `state` | string | No | State/Province |
| `zipCode` | string | No | Postal code |
| `country` | string | No | Country code (2-letter) |
| `organization` | string | No | Organization |
| `address2` | string | No | Address line 2 |
| `auditDetails` | object | No | Audit details |
| `settings` | object | No | Optional settings parameter. |

## Input schema


```json
{
  "type": "object",
  "properties": {
    "operation": {
      "type": "string",
      "enum": [
        "list",
        "get",
        "create",
        "edit",
        "delete",
        "create_cn_audit",
        "get_cn_audit_status",
        "set_eu_setting",
        "set_lv_setting",
        "set_lt_setting"
      ],
      "description": "Operation to perform: list: List all contacts | get: Get contact details | create: Create new contact | edit: Update contact | delete: Delete contact | create_cn_audit: Create .CN domain audit | get_cn_audit_status: Get .CN audit status | set_eu_setting: Set EU contact settings | set_lv_setting: Set Latvia contact settings | set_lt_setting: Set Lithuania contact settings"
    },
    "contactId": {
      "description": "Contact ID from contact list (e.g., \"12345\")",
      "type": "string"
    },
    "name": {
      "description": "Contact name",
      "type": "string"
    },
    "email": {
      "description": "Email",
      "type": "string"
    },
    "phoneCc": {
      "description": "Phone country code (e.g., \"1\" for US, \"33\" for France)",
      "type": "string"
    },
    "phoneNum": {
      "description": "Phone number without country code (e.g., \"5551234567\")",
      "type": "string"
    },
    "address1": {
      "description": "Address line 1",
      "type": "string"
    },
    "city": {
      "description": "City",
      "type": "string"
    },
    "state": {
      "description": "State/Province",
      "type": "string"
    },
    "zipCode": {
      "description": "Postal code",
      "type": "string"
    },
    "country": {
      "description": "Country code (2-letter)",
      "type": "string"
    },
    "organization": {
      "description": "Organization",
      "type": "string"
    },
    "address2": {
      "description": "Address line 2",
      "type": "string"
    },
    "auditDetails": {
      "description": "Audit details",
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {
        "type": "string"
      }
    },
    "settings": {
      "description": "Optional settings parameter.",
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {
        "type": "string"
      }
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

