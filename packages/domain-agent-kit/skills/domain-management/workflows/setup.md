# Set up domain-mcp

Setup is explicit and separate from normal workflow activation. Never ask the user to paste a credential into chat, and never print its value.

1. Check Node.js, `npx`, Bash, and whether the host can inject `DYNADOT_API_KEY`. `DYNADOT_SANDBOX` is optional and defaults to production.
2. Direct the user to Dynadot **My Info → Security → API Settings** to create or retrieve an API key and configure any required IP access control. The user enters the key only in the host's protected credential UI or secret store.
3. Configure the active host:
   - **Hermes:** install the portable package disabled. Have the user add `DYNADOT_API_KEY` to the active profile's Hermes secret store (`$HERMES_HOME/.env`, using the profile resolved by Hermes rather than a hard-coded path), then enable the plugin and restart Hermes. Hermes marks values loaded from its secret store as credential sources and passes them through the filtered MCP subprocess environment; do not duplicate the value in `mcp.json` or `config.yaml`.
   - **Claude Code:** set `DYNADOT_API_KEY` in the protected environment used to launch Claude Code, then restart the client so the `.mcp.json` subprocess inherits it.
   - **Other Agent Plugins v1 hosts:** use that host's protected secret or environment-injection mechanism. If it has none, report `blocked`; never create a project-local credential file as a fallback.
4. Ask whether the user wants production or sandbox before activation. Set `DYNADOT_SANDBOX=true` only for sandbox, and keep sandbox and production credentials distinct.
5. After restart or MCP reload, call server help to prove process launch and tool discovery, then call read-only account information to prove authentication. Report server identity, discovered tool count, environment, and authentication result with account details redacted.
6. Explain known sandbox gaps from [troubleshooting](../references/troubleshooting.md) and provide the exact restart/reload step for the active host.
7. Return `ready`, `blocked`, or `approval_required`, with one remediation per block.

## Checks

- No secret appears in files, shell history, chat output, or diagnostics.
- The selected environment is explicit.
- MCP discovery succeeds and exposes the expected composite tools.
- A live read-only account call proves authentication.
- The handoff names the host, secret location class, environment, and restart requirement without exposing the secret.
