---
title: "nameservers.manage MCP Tool"
description: "Manage registered nameservers (glue records): register, update IP, delete, list"
keywords:
  - MCP tool
  - domain management
  - Dynadot API
  - nameservers.manage
slug: /tools/nameservers/manage
---

# `nameservers.manage`

Manage registered nameservers (glue records): register, update IP, delete, list

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
| `operation` | string | Yes | Operation to perform: list: List all registered nameservers \| register: Register a custom nameserver \| add: Add a nameserver \| set_ip: Update nameserver IP \| delete: Delete a nameserver \| delete_by_domain: Delete all nameservers for a domain |
| `host` | string | No | Nameserver hostname (e.g., ns1.example.com) |
| `ip` | string | No | IP address (e.g., 192.168.1.1 or 2001:db8::1) |
| `domain` | string | No | Domain name (e.g., example.com, mysite.net) |

## Input schema


```json
{
  "type": "object",
  "properties": {
    "operation": {
      "type": "string",
      "enum": [
        "list",
        "register",
        "add",
        "set_ip",
        "delete",
        "delete_by_domain"
      ],
      "description": "Operation to perform: list: List all registered nameservers | register: Register a custom nameserver | add: Add a nameserver | set_ip: Update nameserver IP | delete: Delete a nameserver | delete_by_domain: Delete all nameservers for a domain"
    },
    "host": {
      "description": "Nameserver hostname (e.g., ns1.example.com)",
      "type": "string"
    },
    "ip": {
      "description": "IP address (e.g., 192.168.1.1 or 2001:db8::1)",
      "type": "string"
    },
    "domain": {
      "description": "Domain name (e.g., example.com, mysite.net)",
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

