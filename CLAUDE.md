# CLAUDE.md

This is a pnpm workspace monorepo. Two packages live under `packages/`:

- **`packages/domain-mcp/`** — the `domain-mcp` npm package: a stdio MCP server
  wrapping the Dynadot registrar API. See `packages/domain-mcp/CLAUDE.md` for
  architecture, commands, and conventions.
- **`packages/domain-agent-kit/`** — the portable Agent Plugins v1 workflow package
  built on `domain-mcp`. Canonical behavior lives in `skills/domain-management/`;
  the Claude manifest, MCP declaration, and destructive-operation hook are thin
  compatibility adapters.

## When editing code

- Changes to the MCP server: work inside `packages/domain-mcp/`. Use
  `pnpm --filter domain-mcp run <script>` or `cd packages/domain-mcp && pnpm <script>`.
- Changes to the plugin: work inside `packages/domain-agent-kit/`. Run
  `pnpm --filter domain-agent-kit test` and
  `hermes plugins doctor packages/domain-agent-kit --ci` after changes.

## Root commands

```bash
pnpm install       # install all workspace deps
pnpm build         # build domain-mcp
pnpm test          # test domain-mcp
pnpm typecheck     # tsc --noEmit domain-mcp
pnpm check         # biome across repo
pnpm check:fix     # biome --write across repo
```

## Publishing

Only `packages/domain-mcp/` publishes to npm. Tag pushes on `main` trigger the
`publish` job in `.github/workflows/ci.yml`. The plugin publishes via the Claude
Code marketplace (manifest at `.claude-plugin/marketplace.json`).
