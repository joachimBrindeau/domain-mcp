---
description: Run a full Dynadot portfolio health audit via the portfolio-auditor agent
allowed-tools: Task
---

Run a full portfolio audit of every domain in the user's Dynadot account. The actual work — enumerating domains, checking health across expiration, locks, WHOIS privacy, auto-renewal, and DNS, and computing renewal costs — is owned by the `portfolio-auditor` agent.

# Process

1. Invoke the `portfolio-auditor` agent via the Task tool with this brief: "Walk the user's Dynadot portfolio and produce a health audit report. Cover expiration dates, lock state, auto-renewal settings, WHOIS privacy, DNS configuration on non-default-NS domains, and a renewal cost forecast for the next 90 days."

2. Present the agent's returned report verbatim to the user. Do not paraphrase, summarize, or reformat — the agent's structure is already tuned for readability.

3. For follow-up questions about specific findings, either answer from the report that is already in context or re-invoke the agent with a narrower scope (for example: "re-audit only domains expiring within 30 days").

# Do not

- Do not walk the portfolio inline in this command. The agent runs in an isolated context so the per-domain tool output does not pollute the main context window.
- Do not filter or reorder the agent's output after the fact. If the user wants a narrower view, re-invoke the agent with that filter baked into the brief.
- Do not request a partial walk from the agent. The agent always walks the full portfolio; "narrower" means narrower emphasis in the report, not skipping domains.

# Success criteria

The user receives a structured audit report with prioritized findings (urgent/soon/info), a renewal cost forecast, and concrete remediation actions for every urgent finding — delivered as one response without interim questions.
