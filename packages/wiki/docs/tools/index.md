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
- [`domains.availability.check`](/docs/tools/domains/availability/check) — Check if a single domain is available for registration. Designed for parallel execution - launch multiple haiku agents to check many domains at once.
- [`domains.ideas.generate`](/docs/tools/domains/ideas/generate) — Generate domain name ideas from keywords and automatically check availability. Returns ONLY available domains with prices. Dynadot`s search command is single-domain and effectively serial, so each candidate takes one round-trip; plan on roughly one second per 3 domains.
- [`server.help`](/docs/tools/server/help) — Discover available tools and operations. Use query: "tools" to list all tools, "actions" with a tool name to list operations, "examples" for usage examples.
