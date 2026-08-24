# Troubleshooting

This reference owns known failures; [status](../workflows/status.md) owns diagnostic order.

## Package does not load

Validate root `plugin.json`, root `mcp.json`, and skill frontmatter. Confirm installation and enablement, then start a fresh session because discovery commonly occurs at startup.

## MCP does not start

Check Node, `npx`, registry access, launcher permissions, and stderr. The first launch may download the pinned package. Missing credentials must yield an actionable launcher error.

## Authentication fails

Confirm API access is enabled, the key belongs to the selected production or sandbox environment, source-IP restrictions permit the host, and the key was not rotated. Never display it.

## Sandbox

Keys are separate, billing is simulated, and some contact and aftermarket operations have incomplete parity. Do not infer production failure from a sandbox limitation.

## DNS appears unchanged

Separate configured state from propagation. Verify authoritative nameservers, TTL, and public answers. Third-party nameservers require changes at that provider.

## Checks

Every remedy targets an observed failure and does not weaken permissions, expose credentials, or add a fallback route.
