---
name: DNS Best Practices for Domains
description: This skill should be used when the user asks about configuring DNS records for common services — email ("set up email for my domain", "Google Workspace MX records", "Fastmail setup", "ProtonMail DNS", "SPF", "DKIM", "DMARC"), web hosting ("A records for my website", "apex vs subdomain"), domain verification ("TXT record for verification"), HTTPS certificate issuance ("CAA records", "LetsEncrypt"), or URL redirects ("forward www to apex"). Provides concrete copy-pasteable record templates for the most common configurations so Claude doesn't have to reason about them from scratch.
version: 0.1.0
---

# DNS Best Practices for Domains

Copy-pasteable templates for the DNS configurations users ask about most. Use these as the source of truth rather than reasoning about record formats from memory. When applying via the plugin's `dns` command, translate the templates into the `dns` MCP tool's `operation: set` parameters and preserve any existing records the user isn't replacing.

# Email

## Google Workspace (Gmail for business)

Replace `example.com` with the target domain. These are the current Google Workspace MX records.

```
Type   Host   Value                   Priority   TTL
MX     @      smtp.google.com.        1          3600
```

Google consolidated MX from the old five-record set to a single `smtp.google.com` record in 2023. Older tutorials still show the `ASPMX.L.GOOGLE.COM` / `ALT1-ALT4` setup — both work, but the single-record form is the official current recommendation.

Plus these TXT records:

```
Type   Host                       Value
TXT    @                          v=spf1 include:_spf.google.com ~all
TXT    google._domainkey          <DKIM key from Google Admin → Apps → Gmail → Authenticate email>
TXT    _dmarc                     v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com; pct=100
```

Notes:
- The DKIM selector `google._domainkey` is Google's default; do not change it.
- Start DMARC with `p=none` for the first week to collect reports, then ramp to `p=quarantine` and eventually `p=reject` if aggregate reports show no legitimate traffic being quarantined.
- `rua` points at a mailbox that receives aggregate reports. Use a dedicated address (it gets busy).

## Fastmail

```
Type   Host   Value                                Priority   TTL
MX     @      in1-smtp.messagingengine.com.        10         3600
MX     @      in2-smtp.messagingengine.com.        20         3600
```

Plus these TXT records:

```
Type   Host                       Value
TXT    @                          v=spf1 include:spf.messagingengine.com ?all
TXT    fm1._domainkey             <CNAME to fm1.<domain>.dkim.fmhosted.com>
TXT    fm2._domainkey             <CNAME to fm2.<domain>.dkim.fmhosted.com>
TXT    fm3._domainkey             <CNAME to fm3.<domain>.dkim.fmhosted.com>
TXT    _dmarc                     v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com
```

Note: Fastmail DKIM is set up as CNAMEs pointing at their hosted DKIM records, not inline TXT. Get the exact hosts from Fastmail admin.

## ProtonMail / Proton Mail

```
Type   Host   Value                         Priority   TTL
MX     @      mail.protonmail.ch.           10         3600
MX     @      mailsec.protonmail.ch.        20         3600
```

TXT records (Proton provides the exact DKIM selectors in their admin panel):

```
Type   Host                          Value
TXT    @                             v=spf1 include:_spf.protonmail.ch ~all
TXT    protonmail._domainkey         <from Proton admin>
TXT    protonmail2._domainkey        <from Proton admin>
TXT    protonmail3._domainkey        <from Proton admin>
TXT    _dmarc                        v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com
```

# SPF recipes

SPF syntax trips people up. Use these templates instead of hand-crafting.

**Single provider (Google):**
```
v=spf1 include:_spf.google.com ~all
```

**Single provider (Fastmail):**
```
v=spf1 include:spf.messagingengine.com ?all
```

**Two providers (Google + transactional via Postmark):**
```
v=spf1 include:_spf.google.com include:spf.mtasv.net ~all
```

**Shared mailbox on your own server (specific IPs):**
```
v=spf1 ip4:192.0.2.10 ip4:192.0.2.11 -all
```

**No mail should originate from this domain at all (park domains):**
```
v=spf1 -all
```

**Terminators:**
- `~all` — soft fail (recommended default during DMARC ramp)
- `-all` — hard fail (only after DMARC reports confirm clean)
- `?all` — neutral (Fastmail's documentation recommends this)
- `+all` — allow anything (NEVER use in production)

**Lookup limit:** SPF allows at most 10 DNS lookups total across all `include:` directives. Going over produces a permanent error. If hitting the limit, flatten with a tool like `spf-flatten` or consolidate providers.

# DMARC ramp-up

Recommended progression for a new domain:

1. **Week 1 (observe):** `v=DMARC1; p=none; rua=mailto:dmarc@example.com`
2. **Weeks 2–4 (tighten after reports are clean):** `v=DMARC1; p=quarantine; pct=25; rua=mailto:dmarc@example.com`
3. **Week 5+ (enforce):** `v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com`
4. **Long-term (after confidence):** `v=DMARC1; p=reject; rua=mailto:dmarc@example.com`

Never jump from `p=none` straight to `p=reject`. Transactional mail that forgot to pass SPF/DKIM will disappear silently.

# Web hosting

## Apex A records pointing at an IP

```
Type   Host   Value           TTL
A      @      192.0.2.10      3600
A      @      192.0.2.11      3600       (optional — second A for redundancy)
AAAA   @      2001:db8::10    3600       (optional — IPv6)
```

## Apex pointing at a host (problematic — CNAME not allowed on apex)

CNAME records are forbidden on the apex (`@`) per RFC 1034. If your host only gives you a hostname (e.g., `myapp.vercel.app`), solutions:

1. **ALIAS / ANAME / flattened CNAME** — some DNS providers support this as an extension (Dynadot, Cloudflare, Route 53 with alias). Check the Dynadot `dns` tool's supported types.
2. **Manual A record** — resolve the host to an IP and use an A record, accepting that the IP can change.
3. **Front with a redirect** — use URL forwarding on the apex, put the app on `www.example.com` with a CNAME.

## `www` subdomain

```
Type   Host   Value           TTL
CNAME  www    example.com.    3600
```

Or point `www` at the same IP as the apex with an A record. Both work; CNAME is cleaner if the apex ever moves.

## HTTPS redirect from apex to www (or vice versa)

DNS alone cannot redirect HTTPS traffic. Either:
- Use the Dynadot URL forwarding feature via `domain_settings` (operates at HTTP level, user's browser hits Dynadot's redirect service first).
- Run a redirect server at the apex that does HTTP/HTTPS 301.

# CAA — restrict which Certificate Authorities can issue certs

Prevents rogue CAs from issuing certificates for your domain. Always add CAA records once you pick a CA.

**LetsEncrypt only:**
```
Type   Host   Value
CAA    @      0 issue "letsencrypt.org"
CAA    @      0 issuewild "letsencrypt.org"
```

**LetsEncrypt + DigiCert (for wildcard + EV certs):**
```
Type   Host   Value
CAA    @      0 issue "letsencrypt.org"
CAA    @      0 issue "digicert.com"
```

**Report unauthorized attempts:**
```
Type   Host   Value
CAA    @      0 iodef "mailto:security@example.com"
```

**Deny all (extreme — use only if certs are issued elsewhere and pre-installed):**
```
Type   Host   Value
CAA    @      0 issue ";"
```

# Domain verification TXT records

Each service has its own format. Do NOT try to generate these — the verification service gives you the exact string to paste.

| Service | Typical host | Typical format |
|---|---|---|
| Google Search Console | `@` | `google-site-verification=<token>` |
| Google Workspace | `@` | `google-site-verification=<token>` (different from Search Console) |
| Microsoft 365 | `@` | `MS=ms<numbers>` |
| Apple Business Manager | `@` | `apple-domain-verification=<token>` |
| Facebook Business | `@` | `facebook-domain-verification=<token>` |
| GitHub Pages | `_github-pages-challenge-<org>` | `<token>` |
| Vercel | `_vercel` | `<token>` |

Preserve these — they're often short-lived but users forget they exist and accidentally delete them.

# Subdomain delegation

To delegate `sub.example.com` to different nameservers (for a separate DNS provider, a subsidiary, or a development cluster):

```
Type   Host   Value                    TTL
NS     sub    ns1.provider.net.        3600
NS     sub    ns2.provider.net.        3600
```

Now `sub.example.com` and everything under it is resolved by the delegated nameservers, not Dynadot's.

# Common mistakes to flag

- **Trailing dot.** Values like `smtp.google.com.` are fully qualified; without the trailing dot some DNS UIs append the domain, producing `smtp.google.com.example.com`. Most modern UIs normalize this, but flag it if records look doubled-up.
- **TTL too low.** TTL below 300 is almost never appropriate — you get slammed with repeat queries. Default to 3600 unless actively debugging.
- **TTL too high.** TTL above 86400 makes emergency changes hard. 3600 is the sweet spot for most records.
- **Overlapping SPF.** Only ONE SPF record per domain. Multiple `v=spf1` records on the same host produce a permanent error.
- **Missing reverse DNS.** For outbound mail, receiving servers often check that the sending IP's PTR record matches. Not DNS you control from the registrar — it's set at the hosting provider.

# How to use this skill in a workflow

When the user describes a DNS setup task, do NOT try to recall record formats from memory. Pattern-match the task to one of the sections above and use the template verbatim. If the user's situation isn't covered, say so and ask for the provider's published DNS setup docs — do not guess.

When applying records via the plugin's `dns` command, preserve any existing records for tuples the new template doesn't touch. The `dns` MCP tool's `operation: set` rewrites the whole record set, so the user's existing A records, verification TXTs, etc. must be included in the call alongside the new records from the template.
