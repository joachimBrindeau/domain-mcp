# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`domain-mcp` — an MCP (Model Context Protocol) server exposing the Dynadot registrar API (~108 actions) as 10 composite tools plus a few standalone tools. Runs as a stdio server, published to npm as `domain-mcp`. TypeScript strict, ESM-only (`"type": "module"`), Node >=18.

## Commands

```bash
pnpm build             # tsc → dist/
pnpm dev               # tsx watch src/index.ts
pnpm test              # vitest run (integration tests skipped by default)
pnpm test:watch
pnpm test:coverage     # thresholds: 80% lines/functions/branches/statements
pnpm typecheck         # tsc --noEmit
pnpm check             # biome check src/ test/
pnpm check:fix         # biome check --write

# Run a single test file
pnpm exec vitest run test/normalize.test.ts
pnpm exec vitest run -t "Folder CRUD"   # filter by test name

# Integration / functional / e2e tests (hit the real Dynadot API)
RUN_INTEGRATION_TESTS=true DYNADOT_API_KEY=xxx TEST_DOMAIN=your-domain.com pnpm test
RUN_INTEGRATION_TESTS=true TEST_DOMAIN=your-domain.com pnpm exec vitest run test/e2e.test.ts
RUN_INTEGRATION_TESTS=true TEST_DOMAIN=your-domain.com pnpm exec vitest run test/functional.test.ts
```

All commands run from `packages/domain-mcp/` or from the workspace root via `pnpm --filter domain-mcp run <script>`.

Pre-commit (lefthook): biome check+write, `tsc --noEmit`, gitleaks, knip. Pre-push: vitest, publint, attw, size-limit.

## Environment

- `DYNADOT_API_KEY` — required (prod key)
- `DYNADOT_SANDBOX=true` — route to `api-sandbox.dynadot.com` instead of `api.dynadot.com`
- `DYNADOT_SANDBOX_KEY` — optional separate key used only when sandbox mode is on
- `RUN_INTEGRATION_TESTS=true` and `TEST_DOMAIN=...` — gate integration/e2e/functional tests

Sandbox has real limitations (e.g. `create_contact` fails with a misleading "missing phone number"). See `docs/sandbox.md` before writing sandbox-targeted tests — destructive aftermarket operations are deliberately sandbox-only.

## Architecture

Everything funnels through one registration pipeline and one API client. Understand these four files first:

1. **`src/index.ts`** — entry point. Creates `McpServer`, calls `registerAllTools` / `registerAllResources` / `registerAllPrompts`, then connects `StdioServerTransport`. Handles `--help` / `--version` and refuses to run when stdin is a TTY.

2. **`src/client.ts`** — `DomainClient` singleton (via `getClient()`) wrapping `ky`. Every API call goes through `client.execute(command, params)`:
   - `key` and `command` are reserved and injected — tool input cannot set them (throws).
   - Undefined params are stripped.
   - `ky` retries on 408/429/5xx with exponential backoff (`retryDelay * 2^retryCount`, default 3 retries).
   - A response with `Status === 'error'` is thrown as `Dynadot API error: <msg>`.

3. **`src/schemas/*.ts`** — each file exports one `CompositeTool` (`common.ts` defines the type). A composite tool is `{ name, description, actions: Record<string, ActionDefinition> }`. Each action has:
   - `command` — the underlying Dynadot API command string
   - `description`
   - `params?` — a Zod object (required params come from the shared `p` / `dnsRecord` / `contactFields` schemas in `common.ts`)
   - `transform?(action, input) => ApiParams` — maps the tool's ergonomic input onto the flat, indexed param names Dynadot expects (`domain0`, `domain1`, `main_record_type0`, `ns0`, …). Shared transforms live in `tx` in `common.ts`; **add new array/indexed shapes there**, don't inline them.

   `schemas/index.ts` exports `compositeTools` — the single array driving registration. Adding a new tool = new file in `schemas/`, add it to the array.

4. **`src/register.ts`** — `registerAllTools` iterates `compositeTools`. For each one it:
   - Builds an input schema whose first field is `operation: z.enum(...)` covering all action keys, then merges the union of every action's params as optional fields.
   - At call time: looks up the action, runs `actionDef.params.safeParse(input)` (strict per-action validation), then `actionDef.transform?(op, data) ?? data` → `client.execute(command, params)` → `normalizeResponse(command, result)`.
   - All errors flow through `createToolError` in `src/errors.ts` and are returned as `{ content: [{ type: 'text', text: toolError.toJSON() }], isError: true }`. Error types: `UNKNOWN_ACTION`, `MISSING_PARAM`, `VALIDATION_ERROR`, `API_ERROR`. `UNKNOWN_ACTION` includes fuzzy suggestions based on prefix matching.

   Then it registers the three standalone tools: `domains.availability.check`, `domains.ideas.generate`, `server.help` (`src/tools/*.ts`). `domains.ideas.generate` is pure logic on top of `client.execute('search', ...)` — it generates candidates (exact / hyphenated / prefix / suffix patterns) and checks availability one-at-a-time with bounded concurrency. Dynadot's `search` command only accepts a single `domain0` per call (any n>1 errors with "too many domains entered") — do not try to reintroduce batching.

5. **`src/normalize.ts`** — Dynadot responses are deeply nested PascalCase (`FolderCreateResponse.FolderCreateContent.FolderId`). `normalizeResponse(command, raw)` flattens this into `{ success: true, ... }` (or `{ success: false, error }`). It has command-specific normalizers for the common shapes (`search`, `domain_info`, `create_folder`, `create_contact`); everything else falls through to the default extractor (peels one `*Response` + one `*Content`/`*Info`/`*List` wrapper) plus recursive `PascalCase → camelCase`. **If you add a tool whose response shape doesn't match the default extractor, add a command-specific normalizer — don't work around it in the schema.**

6. **`src/resources.ts`** / **`src/prompts.ts`** — register MCP resources (`account://info`, `domains://list`, `contacts://list`, `folders://list`) and workflow prompts (`domain-audit`, `dns-setup`, `domain-brainstorm`, `bulk-renewal`). Resources are thin wrappers over `client.execute` + `normalizeResponse`.

### Mental model for adding an action

1. Find the right composite file in `src/schemas/` (or create a new one and add to `schemas/index.ts`).
2. Add an entry under `actions`. If the API wants flat indexed params, write a `transform` or reuse one from `tx`.
3. If the response has an unusual shape, add a normalizer in `src/normalize.ts`.
4. Add an e2e assertion in `test/e2e.test.ts` (shape/command validation) and, if it's stateful, a CRUD test in `test/functional.test.ts`.

### Dynadot API quirks you will hit

- `edit_contact` requires **all** contact fields, not just the changed ones — partial updates fail with "missing email" etc.
- `lock_domain` unlock may return `"this domain has been locked already"` even though the domain is locked. May require the web UI.
- Response envelope varies: `CommandResponse.Status`, `CommandResponse.ResponseCode ('0'/'-1')`, or `Response.ResponseCode`. `test/e2e.test.ts` has a `getStatus` helper for this — don't reinvent it.
- `create_contact` does not work in sandbox. Use an existing contact ID from prod when writing sandbox tests.

## Conventions

- Strict TS everywhere (`noUncheckedIndexedAccess`, `noUnusedLocals`, `noImplicitReturns`, etc.). Tests are excluded from `tsconfig.json` build but still typechecked via biome/lefthook.
- Biome is the single formatter+linter: 2-space indent, single quotes, trailing commas, 100-col lines, `noExplicitAny: warn`, `noUnusedImports: error`.
- ESM imports use explicit `.js` extensions (required by `NodeNext` module resolution) even though sources are `.ts`.
- Tool input parameters in Zod use `camelCase` (`phoneCc`, `zipCode`, `mainRecords`); `transform` functions convert to the `snake_case` / indexed names Dynadot expects (`phonecc`, `zip`, `main_record_type0`).
- Never hardcode credentials or the referral param — referral URLs come from `src/constants.ts` (`DYNADOT_URLS`, `buildDynadotUrl`).
- Don't `console.log` in `src/` — the stdio transport owns stdout. Use `process.stderr.write` if you truly need diagnostic output.
