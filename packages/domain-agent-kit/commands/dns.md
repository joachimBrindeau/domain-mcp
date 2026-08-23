---
description: Diagnose DNS problems or configure DNS records for a domain
argument-hint: "[diagnose|setup] <domain>"
allowed-tools: Task, AskUserQuestion, Read, mcp__domain-mcp__dns_manage, mcp__domain-mcp__domains_manage
---

Route the DNS request to the right backend: the `dns-diagnostic` agent for troubleshooting, or direct `dns.manage` MCP tool calls for first-time setup.

# Process

1. Read `$ARGUMENTS`. Identify the domain and the intent.

2. Determine mode by keyword content:
   - **Diagnostic mode** — argument includes problem words: "not loading", "broken", "error", "bouncing", "diagnose", "why", "what's wrong", "down".
   - **Setup mode** — argument includes setup words: "set up", "setup", "configure", "add records".
   - **Bare domain or anything else** — use AskUserQuestion with two options: `diagnose-problem`, `configure-records`. Do NOT default a bare domain to setup mode — a user typing `/domain-agent-kit:dns example.com` is more likely to be reporting a problem than asking for fresh configuration.

# Diagnostic mode

1. Invoke the `dns-diagnostic` agent via the Task tool with: the domain, the exact symptom the user described, and any context from surrounding messages.

2. Present the agent's report verbatim. The report includes a proposed fix as a concrete `dns.manage` tool call.

3. If the user approves the fix, execute the exact tool call the agent proposed — do not modify parameters. If the user wants changes, re-invoke the agent with the adjustments.

# Setup mode

1. Fetch current records via `dns.manage` with `operation: get` for the domain. This is mandatory — never write without reading first.

2. Present the current state, then ask via AskUserQuestion what the user wants to configure:
   - `website` — A / AAAA records pointing at a host
   - `email` — MX + SPF + DMARC (optionally DKIM)
   - `verification` — TXT records for domain ownership proof
   - `subdomain` — CNAME for a subdomain
   - `redirect` — URL forwarding (handled via `domains.settings.manage`, not `dns.manage`)

3. For each record type, collect specific values (IP address, mail server, TXT content, etc.) via AskUserQuestion with free-text entry.

4. Compute the merged record set:
   - **Merge rule**: new records of a given (type, host) tuple replace any existing records for that tuple. Records of other (type, host) tuples are preserved verbatim. The `dns.manage` tool's `set` operation rewrites the entire record set for a domain in one call, so you must include both the new records AND the preserved existing ones in your call.
   - Display the diff to the user before calling `set`: which records will be added, which replaced, which preserved unchanged.

5. Apply via `dns.manage` with `operation: set`, passing the full merged record set.

6. Re-fetch records via `dns.manage` with `operation: get` after applying and present the confirmed new state.

# Do not

- Do not diagnose DNS problems inline by running `dig` and `curl` yourself in this command. The dns-diagnostic agent runs in an isolated context and produces a cleaner report.
- Do not propose any DNS change without fetching the current state first. Overwriting without merge is the number-one source of DNS outages.
- Do not combine diagnose and setup into one workflow. They have different risk profiles — diagnostic reads only, setup writes — and conflating them leads to accidental overwrites during troubleshooting.
- Do not use this command for bulk DNS audits across many domains — use `/domain-agent-kit:audit` instead.
- Do not use this command to choose a new domain — use `/domain-agent-kit:brainstorm` instead.

# Success criteria

- **Diagnostic mode**: user receives a root-cause report with a specific fix and, if approved, the fix is applied and re-verified.
- **Setup mode**: requested DNS records are live at Dynadot, existing records are preserved, and the final state is fetched and shown.
