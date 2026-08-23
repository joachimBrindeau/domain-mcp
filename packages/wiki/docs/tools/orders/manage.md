---
title: "orders.manage MCP Tool"
description: "Orders, coupons, processing status, reseller operations"
keywords:
  - MCP tool
  - domain management
  - Dynadot API
  - orders.manage
slug: /tools/orders/manage
---

# `orders.manage`

Orders, coupons, processing status, reseller operations

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
| `operation` | string | Yes | Operation to perform: list: List recent orders \| status: Get order status \| is_processing: Check if operations pending \| coupons: List available coupons \| reseller_verification: Set reseller WHOIS verification status |
| `orderId` | string | No | Order ID (e.g., "order_456") |
| `contactId` | string | No | Contact ID from contact list (e.g., "12345") |
| `status` | string | No | Optional status parameter. |

## Input schema


```json
{
  "type": "object",
  "properties": {
    "operation": {
      "type": "string",
      "enum": [
        "list",
        "status",
        "is_processing",
        "coupons",
        "reseller_verification"
      ],
      "description": "Operation to perform: list: List recent orders | status: Get order status | is_processing: Check if operations pending | coupons: List available coupons | reseller_verification: Set reseller WHOIS verification status"
    },
    "orderId": {
      "description": "Order ID (e.g., \"order_456\")",
      "type": "string"
    },
    "contactId": {
      "description": "Contact ID from contact list (e.g., \"12345\")",
      "type": "string"
    },
    "status": {
      "description": "Optional status parameter.",
      "type": "string",
      "enum": [
        "verified",
        "unverified"
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

