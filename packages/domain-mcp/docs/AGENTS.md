# Contributor Standards

Standards for working in `domain-mcp`. Anything mechanically enforceable is
enforced by `biome`, `tsc`, `vitest`, `commitlint`, `lefthook`, or CI — this
document exists to explain the *why* and cover the conventions no linter can
catch. If a rule here isn't enforced mechanically, treat the reviewer as the
enforcer.

See `CLAUDE.md` at the repo root for the architectural walkthrough (request
pipeline, `CompositeTool` model, response normalization, Dynadot API quirks).
Don't duplicate that here.

---

## What this repo is

An MCP (Model Context Protocol) server that wraps the Dynadot registrar API.
It supports stdio and Streamable HTTP transports. It is **not** a REST service,
web app, or library with a conventional public API. Two invariants follow:

1. **The stdio transport owns `process.stdout`.** Any `console.log`,
   `process.stdout.write`, or other write to stdout from `src/` will corrupt
   the MCP protocol frames and break every client. Diagnostic output goes to
   `process.stderr` directly. `biome`'s `noConsole` rule is set to `error`
   in `src/**` for exactly this reason. Tests and `scripts/**` are excepted.

2. **`getClient()` is a deliberate singleton.** One process, one API client,
   one API key. There is no DI framework, no service/repository
   pattern, and no interface-per-implementation. If you find yourself wanting
   one, the answer is almost always no — write the simpler thing.

---

## Layout

```
src/
├── index.ts          # CLI entry point; selects stdio or HTTP transport
├── http-server.ts    # Streamable HTTP, auth, sessions, health, shutdown
├── server.ts         # McpServer factory shared by both transports
├── client.ts         # DynadotClient + getClient() singleton (ky, retries)
├── register.ts       # Composite tool → MCP tool registration pipeline
├── normalize.ts      # Dynadot nested PascalCase response → flat camelCase
├── errors.ts         # ToolError envelope returned to MCP clients
├── prompts.ts        # MCP prompt workflows (audit, dns-setup, brainstorm, …)
├── resources.ts      # MCP resources (account://info, domains://list, …)
├── constants.ts      # GITHUB_URL, DYNADOT_URLS, referral-tagged links
├── schemas/          # One CompositeTool per file; schemas/index.ts aggregates
└── tools/            # Standalone MCP tools (domains.availability.check, domains.ideas.generate, server.help)
test/                 # vitest, flat; integration tests gated on env vars
scripts/              # CLI helpers (exempt from noConsole)
dist/                 # tsc output, published to npm
docs/                 # Human docs; do not invent new top-level dirs
```

Keep this flat. Don't introduce `features/`, `services/`, `repositories/`,
`dto/`, or `domain/` subdirectories — the schema-per-tool layout is
intentional and matches the MCP tool boundary.

---

## Naming

- **Files and folders**: `kebab-case.ts` (`domain-settings.ts`,
  `generate-ideas.ts`). No `PascalCase.ts`, no matching filename to the
  exported class.
- **Types, classes, interfaces**: `PascalCase`. **No `I` prefix**
  (`ClientConfig`, not `IClientConfig`; `CompositeTool`, not `ICompositeTool`).
- **Functions, variables**: `camelCase`.
- **Constants**: `SCREAMING_SNAKE_CASE` for module-level immutable config
  (`RESERVED_PARAM_KEYS`, `DEFAULT_TLDS`). Local `const` bindings stay
  `camelCase`.
- **Tool-input params**: `camelCase` in Zod schemas (`phoneCc`, `zipCode`,
  `mainRecords`). The `transform` function is where translation to Dynadot's
  `snake_case` / indexed flat keys (`phonecc`, `zip`, `main_record_type0`)
  happens. Don't leak Dynadot naming into the tool-facing schema.

---

## TypeScript

- Strict mode is on (`tsconfig.json` enables every strictness flag plus
  `noUncheckedIndexedAccess`, `noUnusedLocals`, `noImplicitReturns`,
  `noFallthroughCasesInSwitch`). Don't loosen these.
- **No `any`** (`biome`'s `noExplicitAny` is `error`). Use `unknown` and
  narrow. If you need to reach into Dynadot's untyped response envelope, do
  it in `src/normalize.ts` and hand back a typed shape to everything upstream.
- ESM everywhere. Import paths inside `src/` end in `.js` even though sources
  are `.ts` (`NodeNext` module resolution requirement). Biome will not catch
  a missing `.js`; TypeScript will.
- Use `async/await`. Don't hand-chain `.then()`.

---

## Adding a tool or action

The mental model is in `CLAUDE.md`. Summary:

1. Find or create the right `CompositeTool` in `src/schemas/`. Add a new
   file to the array in `schemas/index.ts` if creating.
2. Add an `ActionDefinition` under `actions`. Reuse shared params from `p`
   in `schemas/common.ts` wherever possible.
3. If the Dynadot command takes flat indexed params (`domain0`, `ns0`,
   `main_record_type0`, …), add or reuse a `transform` in `tx` in
   `schemas/common.ts`. Don't inline new indexing logic in per-tool files.
4. If the response shape doesn't flatten cleanly under the default extractor
   in `src/normalize.ts`, add a command-specific normalizer there. Do not
   work around unusual response shapes by massaging the schema.
5. Add an e2e assertion in `test/e2e.test.ts` (shape + command wiring) and,
   if the action is stateful, a CRUD path in `test/functional.test.ts`.

---

## Error handling

Errors surface to the MCP client through `ToolError` in `src/errors.ts`. The
envelope has `type` (`UNKNOWN_ACTION` | `MISSING_PARAM` | `VALIDATION_ERROR`
| `API_ERROR`), `message`, optional `suggestions` (fuzzy action matches),
optional `validActions`, and a `docsUrl`.

- **Don't invent a new error class** unless you're adding a new `type`.
- **Don't leak internal stack traces** to the client — wrap with
  `createToolError` at the tool boundary.
- **Don't attach HTTP status codes.** We're not HTTP; status codes would be
  misleading.
- **Don't swallow errors** from `client.execute`. The `Dynadot API error: …`
  string is the source of truth for upstream API failures — pass it through.

---

## Testing

- `*.test.ts` in `test/`, flat. `vitest` with global APIs.
- Unit tests hit pure modules (`normalize`, `errors`, `register`,
  `prompts`, `resources`, `client` contract, targeted tool logic).
- Integration tests (`e2e.test.ts`, `functional.test.ts`) and anything
  that touches the real Dynadot API are gated on `RUN_INTEGRATION_TESTS=true`
  plus `DYNADOT_API_KEY` and `TEST_DOMAIN`. Default `npm test` must stay
  network-free.
- Sandbox has real limitations. Read `docs/sandbox.md` before writing a
  sandbox-only test — some commands (notably `create_contact`) do not work
  there. Destructive aftermarket operations are deliberately sandbox-gated.
- Coverage thresholds are 80% lines/functions/branches/statements, enforced
  by `vitest.config.ts`. Don't lower them.

---

## Commits and branches

- **Conventional Commits**, enforced by `commitlint` on `commit-msg` via
  lefthook. Format: `type(scope): subject`.
- **Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`,
  `build`, `ci`, `perf`, `revert` (from `@commitlint/config-conventional`).
- **Scopes** are constrained to match the `src/` layout:
  `client`, `register`, `normalize`, `errors`, `prompts`, `resources`,
  `schemas`, `tools`, `constants`, `tests`, `ci`, `deps`, `docs`, `release`.
  Add a new scope in `commitlint.config.js` only when you add a new top-level
  concern, not for every ad-hoc change.
- **Branches**: `feat/…`, `fix/…`, `docs/…`, `chore/…`. No direct pushes to
  `main`.

---

## Forbidden

- Filenames with `-new`, `-v2`, `-fixed`, `-copy`, `enhanced-` — edit the
  original file.
- Commented-out code. Delete it; git remembers.
- `console.log` / `console.warn` / `console.info` / `console.debug` /
  `console.error` anywhere in `src/**`. Use `process.stderr.write` if you
  genuinely need stderr. (`noConsole` = `error`; `test/**` and `scripts/**`
  are overridden to allow it.)
- Hardcoded credentials, API keys, or the Dynadot referral parameter
  (`s9F6L9F7U8Q9U8Z8v`). Referral links are built through `DYNADOT_URLS` /
  `buildDynadotUrl` in `src/constants.ts`.
- New `.md` files outside `docs/` without a reason. `docs/plans/` is the
  right home for design docs.
- Fallback mechanisms, compatibility shims, or "just in case" abstractions.
  YAGNI — write the minimal thing that passes tests.
