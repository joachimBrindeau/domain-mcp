---
title: MCP tools
description: The complete credential-free tool catalog exposed by Domain MCP.
---

# MCP tools

The complete credential-free tool catalog exposed by Domain MCP.

- [`domains.manage`](/docs/tools/domains/manage) — Core domain operations: list, search, register, renew, delete, info, lock, pricing. Search domains: https://www.dynadot.com/domain/search.html?s9F6L9F7U8Q9U8Z8v
- [`domains.settings.manage`](/docs/tools/domains/settings/manage) — Configure domain settings: nameservers, privacy, renewal, forwarding, parking, WHOIS
- [`dns.manage`](/docs/tools/dns/manage) — DNS management: get/set DNS records, DNSSEC configuration
- [`nameservers.manage`](/docs/tools/nameservers/manage) — Manage registered nameservers (glue records): register, update IP, delete, list
- [`transfers.manage`](/docs/tools/transfers/manage) — Domain transfers: initiate, check status, manage auth codes, push requests
- [`contacts.manage`](/docs/tools/contacts/manage) — WHOIS contact management: create, edit, delete, list, regional settings
- [`folders.manage`](/docs/tools/folders/manage) — Folder management: create, delete, list, configure folder-level settings
- [`account.manage`](/docs/tools/account/manage) — Account info, balance, and default settings for new domains. Manage API keys: https://www.dynadot.com/account/domain/setting/api.html?s9F6L9F7U8Q9U8Z8v
- [`aftermarket.manage`](/docs/tools/aftermarket/manage) — Aftermarket: auctions, backorders, expired domains, marketplace listings. Browse domains: https://www.dynadot.com/?s9F6L9F7U8Q9U8Z8v
- [`orders.manage`](/docs/tools/orders/manage) — Orders, coupons, processing status, reseller operations
- [`domains.availability.check`](/docs/tools/domains/availability/check) — Check if a single domain is available for registration. Fails closed when Dynadot returns an API error or no conclusive availability result. The shared client serializes registrar requests.
- [`domains.ideas.generate`](/docs/tools/domains/ideas/generate) — Deterministically generate domain candidates and check availability. For brandable searches, use brandMultiplex to combine ordered phoneme or morpheme dimensions without materializing the full Cartesian product. For descriptive searches, prefer ranked DataForSEO keywordVariations; use llmVariations only when keyword data is unavailable. Exact and hyphenated patterns test each phrase both without and with hyphens across TLDs. Fails the whole request on any inconclusive or failed Dynadot check rather than reporting a false negative.
- [`server.help`](/docs/tools/server/help) — Discover available tools and operations. Use query: "tools" to list all tools, "actions" with a tool name to list operations, "examples" for usage examples.
