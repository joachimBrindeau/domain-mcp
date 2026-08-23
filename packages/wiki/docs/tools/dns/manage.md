---
title: "dns.manage MCP Tool"
description: "DNS management: get/set DNS records, DNSSEC configuration"
keywords:
  - MCP tool
  - domain management
  - Dynadot API
  - dns.manage
slug: /tools/dns/manage
---

# `dns.manage`

DNS management: get/set DNS records, DNSSEC configuration

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
| `operation` | string | Yes | Operation to perform: get: Get current DNS records \| set: Set DNS records \| set_dnssec: Enable DNSSEC \| get_dnssec: Get DNSSEC settings \| clear_dnssec: Remove DNSSEC \| clear_dns: Clear all DNS records for a domain (removes all A, AAAA, CNAME, MX, TXT records) |
| `domain` | string | No | Domain name (e.g., example.com, mysite.net) |
| `mainRecords` | array | No | Main domain records |
| `subdomainRecords` | array | No | Subdomain records |
| `keyTag` | number | No | Key tag |
| `algorithm` | number | No | Algorithm |
| `digestType` | number | No | Digest type |
| `digest` | string | No | DS record digest |

## Input schema


```json
{
  "type": "object",
  "properties": {
    "operation": {
      "type": "string",
      "enum": [
        "get",
        "set",
        "set_dnssec",
        "get_dnssec",
        "clear_dnssec",
        "clear_dns"
      ],
      "description": "Operation to perform: get: Get current DNS records | set: Set DNS records | set_dnssec: Enable DNSSEC | get_dnssec: Get DNSSEC settings | clear_dnssec: Remove DNSSEC | clear_dns: Clear all DNS records for a domain (removes all A, AAAA, CNAME, MX, TXT records)"
    },
    "domain": {
      "description": "Domain name (e.g., example.com, mysite.net)",
      "type": "string"
    },
    "mainRecords": {
      "description": "Main domain records",
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
      "description": "Subdomain records",
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
    "keyTag": {
      "description": "Key tag",
      "type": "number"
    },
    "algorithm": {
      "description": "Algorithm",
      "type": "number"
    },
    "digestType": {
      "description": "Digest type",
      "type": "number"
    },
    "digest": {
      "description": "DS record digest",
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

