---
title: "aftermarket.manage MCP Tool"
description: "Aftermarket: auctions, backorders, expired domains, marketplace listings. Browse domains: Open this page on Dynadot"
keywords:
  - MCP tool
  - domain management
  - Dynadot API
  - aftermarket.manage
slug: /tools/aftermarket/manage
---

# `aftermarket.manage`

Aftermarket: auctions, backorders, expired domains, marketplace listings. Browse domains: [Open this page on Dynadot](https://www.dynadot.com/?s9F6L9F7U8Q9U8Z8v)

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
| `operation` | string | Yes | Operation to perform: backorder_add: Add domain to backorder list \| backorder_delete: Remove from backorder list \| backorder_list: List backorder requests \| auction_list_open: List open auctions \| auction_details: Get auction details \| auction_bids: Get auction bids \| auction_bid: Place auction bid \| auction_list_closed: List closed auctions \| backorder_auction_list_open: List open backorder auctions \| backorder_auction_details: Get backorder auction details \| backorder_auction_bid: Place backorder auction bid \| backorder_auction_list_closed: List closed backorder auctions \| expired_list: List expired closeout domains \| expired_buy: Buy expired closeout domain \| listings: Get marketplace listings \| listing_details: Get listing details \| buy_now: Buy domain from marketplace \| set_for_sale: List domain for sale \| remove_from_sale: Remove domain from marketplace/auction (delist from sale) \| afternic_confirm: Confirm/decline Afternic action \| sedo_confirm: Confirm/decline Sedo action |
| `domain` | string | No | Domain name (e.g., example.com, mysite.net) |
| `currency` | string | No | Optional currency parameter. |
| `auctionId` | string | No | Auction ID (e.g., "auction_123") |
| `bidAmount` | number | No | Amount in currency (e.g., 9.99) |
| `price` | number | No | Amount in currency (e.g., 9.99) |
| `action` | string | No | Confirm or decline action |

## Input schema


```json
{
  "type": "object",
  "properties": {
    "operation": {
      "type": "string",
      "enum": [
        "backorder_add",
        "backorder_delete",
        "backorder_list",
        "auction_list_open",
        "auction_details",
        "auction_bids",
        "auction_bid",
        "auction_list_closed",
        "backorder_auction_list_open",
        "backorder_auction_details",
        "backorder_auction_bid",
        "backorder_auction_list_closed",
        "expired_list",
        "expired_buy",
        "listings",
        "listing_details",
        "buy_now",
        "set_for_sale",
        "remove_from_sale",
        "afternic_confirm",
        "sedo_confirm"
      ],
      "description": "Operation to perform: backorder_add: Add domain to backorder list | backorder_delete: Remove from backorder list | backorder_list: List backorder requests | auction_list_open: List open auctions | auction_details: Get auction details | auction_bids: Get auction bids | auction_bid: Place auction bid | auction_list_closed: List closed auctions | backorder_auction_list_open: List open backorder auctions | backorder_auction_details: Get backorder auction details | backorder_auction_bid: Place backorder auction bid | backorder_auction_list_closed: List closed backorder auctions | expired_list: List expired closeout domains | expired_buy: Buy expired closeout domain | listings: Get marketplace listings | listing_details: Get listing details | buy_now: Buy domain from marketplace | set_for_sale: List domain for sale | remove_from_sale: Remove domain from marketplace/auction (delist from sale) | afternic_confirm: Confirm/decline Afternic action | sedo_confirm: Confirm/decline Sedo action"
    },
    "domain": {
      "description": "Domain name (e.g., example.com, mysite.net)",
      "type": "string"
    },
    "currency": {
      "description": "Optional currency parameter.",
      "default": "USD",
      "type": "string"
    },
    "auctionId": {
      "description": "Auction ID (e.g., \"auction_123\")",
      "type": "string"
    },
    "bidAmount": {
      "description": "Amount in currency (e.g., 9.99)",
      "type": "number"
    },
    "price": {
      "description": "Amount in currency (e.g., 9.99)",
      "type": "number"
    },
    "action": {
      "description": "Confirm or decline action",
      "type": "string",
      "enum": [
        "confirm",
        "decline"
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

