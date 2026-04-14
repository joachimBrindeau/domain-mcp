---
description: Interactively manage Dynadot domain renewals — bucket by urgency, forecast cost, act per domain
allowed-tools: mcp__domain-mcp__domain, mcp__domain-mcp__domain_settings, mcp__domain-mcp__account, ReadMcpResourceTool, AskUserQuestion
---

Manage domain renewals interactively: review upcoming expirations, calculate costs, and take action (auto-renew, manual renew, let expire) per domain. This command runs inline (no agent dispatch) because each domain needs an explicit user decision.

# Process

1. **Enumerate.** Read the `domains://list` MCP resource for all domains with expiration dates.

2. **Bucket by urgency.**
   - **Urgent** — expires within 30 days
   - **Soon** — 31–90 days
   - **Upcoming** — 91–365 days
   - **Stable** — more than 1 year (exclude from the interactive flow)

3. **Forecast cost.** For each expiring domain, get the renewal price via `domain` with `operation: tld_price`. Batch by TLD — one call per unique TLD, not per domain. Sum cost per bucket.

4. **Check balance and surface gaps.** Call `account` with `operation: info` for the current balance. Compare to the 30-day forecast.
   - If balance covers the 30-day forecast → note "OK".
   - If balance is short → display the gap prominently in the overview AND in every per-domain action prompt that follows. Do not block the workflow — let the user decide — but make the gap impossible to miss. Suggest topping up at https://www.dynadot.com/account/credit.html?s9F6L9F7U8Q9U8Z8v before approving renewals.

5. **Present the overview.** Show a grouped table: domain, days to expire, current renewOption setting, renewal cost, recommended action.

6. **Act per domain — urgent bucket first.** For each urgent domain, use AskUserQuestion with four options:
   - `auto-renew` — enable via `domain_settings` with `operation: set_renew_option` and `renewOption: auto`. Do not silently apply; require explicit confirmation per domain.
   - `manual-renew-now` — run `domain` with `operation: renew` and ask for the duration (1–10 years).
   - `let-expire` — no action; confirm explicitly that this is intentional.
   - `skip` — leave as-is, will re-prompt at next run.

7. **Batch shortcuts (with mandatory approval gate).** If the user requests a batch action ("enable auto-renew for all urgent", "renew everything in 30 days for 1 year"), do NOT loop yet:
   - Compute the full action list (which domains, which operations, total cost).
   - Present the action list as a numbered preview with the total cost.
   - Use AskUserQuestion with `apply-all` and `cancel` options. Require an explicit `apply-all` before executing.
   - Only after approval, execute the loop without per-domain prompts.

8. **Soon bucket.** After all urgent decisions are applied, ask via AskUserQuestion whether to process the soon bucket now or defer. Default to defer.

9. **Confirm final state.** After all actions, re-read the affected domains' `info` and present the updated state (new expirations, new renewOption settings).
   - **Failure detection**: if the re-read shows no change in expiration date or renewOption for a domain that was supposedly updated, surface this as an error and ask the user how to proceed. Do NOT silently mark the action as done. Renewal calls can succeed at the API but fail to extend the expiration date in some Dynadot states (insufficient balance discovered after the call, sandbox quirks, registry-side issues).

# Do not

- Do not auto-enable auto-renewal without explicit user approval. Renewal is billable — silent enablement is a bug even when it's the obvious action.
- Do not skip the balance check. Users with many expiring domains need to know before approving actions whether their balance covers the commitments.
- Do not process the soon or upcoming buckets by default. Stay focused on urgent unless the user explicitly opts in.
- Do not use this command for first-time DNS setup or domain research — those have their own commands.

# Success criteria

The user has made an explicit decision on every urgent-bucket domain, the decisions have been applied at Dynadot, the post-action state has been confirmed via a re-fetch of each affected domain, and any silent-failure cases have been surfaced to the user rather than papered over.
