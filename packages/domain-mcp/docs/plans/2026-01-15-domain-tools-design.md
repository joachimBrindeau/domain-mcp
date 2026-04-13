# Domain Generator & Bulk Checker Design

## Overview

Two new MCP tools for domain name generation and bulk availability checking, designed for parallel execution via Claude Code agents.

## Architecture

```
src/
├── tools/
│   ├── generate-domains.ts   # AI domain generation tool
│   └── check-domain.ts       # Single domain availability check
└── register.ts               # Updated registration
```

## Tools

### generate_domains

Returns suggested domain names based on user prompt. Does NOT check availability.

**Input:**
- `prompt: string` - User's description/keywords

**Output:**
- Array of domain name strings

**Usage:** Claude Code calls this tool, writes results to CSV, then launches parallel agents to check.

### check_domain

Checks availability of a single domain. Designed for parallel execution.

**Input:**
- `domain: string` - Domain to check (e.g., "example.com")
- `showPrice?: boolean` - Include pricing info

**Output:**
- `{ domain, available, price? }`

**Usage:** Multiple haiku agents call this in parallel, each checking one domain.

## Workflow

1. User asks for domain suggestions
2. Claude Code calls `generate_domains` with user prompt
3. Claude Code writes results to CSV: `domain,available`
4. Claude Code launches N haiku agents in parallel
5. Each agent: reads one row, calls `check_domain`, updates CSV
6. Final CSV has availability status for all domains

## Design Principles

- **DRY**: Reuse existing Dynadot client
- **SOLID**: Single responsibility - generate OR check, not both
- **MECE**: Clear separation between generation and checking
- **Lean**: Minimal tools, parallelism handled by Claude Code
