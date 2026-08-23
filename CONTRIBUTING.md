# Contributing to domain-mcp

Thanks for helping improve domain-mcp. Bug reports, documentation fixes, Dynadot API findings, and focused code changes are all useful.

## Before you start

1. Search the [open issues](https://github.com/joachimBrindeau/domain-mcp/issues) for related work.
2. Open an issue before starting a large change so we can agree on the approach.
3. Never include Dynadot API keys, account data, or real domain credentials in an issue, fixture, or commit.

## Make a change

```bash
git clone https://github.com/joachimBrindeau/domain-mcp.git
cd domain-mcp
pnpm install
```

Create a branch, keep the change narrow, and follow the conventions in [`CLAUDE.md`](CLAUDE.md) and [`packages/domain-mcp/CLAUDE.md`](packages/domain-mcp/CLAUDE.md).

Before opening a pull request, run:

```bash
pnpm test
pnpm typecheck
pnpm check
pnpm build
```

## Open a pull request

Explain the problem, the chosen fix, and how you tested it. Add or update tests when behavior changes. For documentation or response-format bugs, include screenshots or sanitized API responses when useful.

By contributing, you agree that your work will be released under the repository's [MIT License](LICENSE).
