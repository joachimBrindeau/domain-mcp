---
description: Brainstorm available domain names for a product or brand via the domain-research agent
argument-hint: "<product or brand description>"
allowed-tools: Task, AskUserQuestion
---

Run a domain research session for the product or brand the user describes in `$ARGUMENTS`. The `domain-research` agent handles keyword extraction, candidate generation via `domains.ideas.generate`, availability checks, trademark scanning via WebSearch, and final ranking.

# Process

1. Read `$ARGUMENTS` — the product or brand description.

2. If `$ARGUMENTS` is empty or contains only a domain name with no description, use AskUserQuestion to ask: "What's the product or brand you want domain ideas for? A sentence or two is enough." Do not proceed without a description. (If the argument is non-empty, pass it through to the agent verbatim — the agent is responsible for asking clarifying questions if it needs more.)

3. Invoke the `domain-research` agent via the Task tool with the full description verbatim, plus any hints the user included (preferred TLDs, length limits, terms to avoid).

4. Present the agent's ranked report verbatim to the user.

5. For follow-up requests like "give me different angles" or "try more hyphenated options", re-invoke the agent with an adjusted brief. Do not try to tweak the existing results manually.

# Do not

- Do not call `domains.ideas.generate` directly from this command. That is the agent's job. Direct calls duplicate work and flood the main context with hundreds of candidate names.
- Do not shortcut trademark screening. The agent owns that screening step; skipping it produces recommendations the user cannot actually ship.
- Do not reorder or filter the agent's ranking. If the user disagrees with the ranking, re-run the agent with explicit constraints in the new brief.
- Do not use this command to check availability of one already-known domain — call `domains.availability.check` directly for that, or use `domains.manage` with `operation: search`.

# Success criteria

The user receives a ranked markdown table of available, trademark-screened domains with brand-fit scores, pricing, and a clear recommendation — without the main context being polluted by intermediate candidate lists or per-name web searches.
