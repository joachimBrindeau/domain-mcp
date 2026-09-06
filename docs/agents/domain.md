# Domain Docs

How engineering skills consume this repository's domain documentation.

## Before exploring

Read these when they exist:

- `CONTEXT.md` at the repository root.
- Relevant decisions under `docs/adr/`.

If either is absent, proceed silently. Create domain documentation lazily only when a real term or decision needs recording.

## Layout

This repository uses a **single-context** layout. The MCP server, portable agent kit, and generated wiki expose one domain-management system and share one glossary and system-wide ADR directory.

## Vocabulary

Use terms defined in `CONTEXT.md` in issue titles, proposals, tests, and implementation. Do not introduce synonyms for concepts the glossary already names.

## ADR conflicts

If proposed work contradicts an ADR, surface the conflict explicitly rather than silently overriding it.
