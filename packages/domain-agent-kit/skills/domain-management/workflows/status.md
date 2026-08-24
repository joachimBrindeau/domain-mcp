# Check plugin health

1. Validate `plugin.json`, `mcp.json`, canonical skills, shared launcher, and any host adapters present.
2. Check Node and `npx` against the server requirement, plus Bash. Check `jq` only for the optional Claude destructive-action hook.
3. Report credential-variable presence without reading or printing values.
4. Call server help to prove process launch, transport, and discovery. If unreachable, stop before account verification.
5. Call read-only account information to prove authentication.
6. Render each dimension as ready, warning, or blocked and give one overall verdict. Never call a write operation.

## Checks

The report works when MCP is broken, exposes no credentials, and distinguishes package, runtime, transport, and authentication failures.
