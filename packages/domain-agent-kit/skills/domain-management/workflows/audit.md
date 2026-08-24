# Audit a domain portfolio

This route is read-only and covers many owned domains. Use direct domain information for one domain.

1. Enumerate the complete portfolio. If empty, report that and stop.
2. Inspect each domain for expiration, transfer lock, effective renewal option, privacy, nameservers, notes, and warnings. Track large portfolios without dropping failures.
3. For active domains, inspect configured DNS when available and compare nameservers with public DNS. Do not flag an intentionally parked domain as urgent merely because it is unlocked or sparse.
4. Group TLD price lookups and calculate renewal totals for 0–30 and 31–90 days. Read account balance and show any gap.
5. Classify findings as `urgent` (expiry within 30 days, funding gap, or material active-domain risk), `soon` (expiry within 31–90 days or a weaker active-domain control), or `healthy`.
6. Return one report with counts, cost forecast, incomplete checks, and an exact proposed remediation for every urgent item. Do not execute fixes.

On transient rate limiting, retry one idempotent read after the server's retry interval. If still blocked, return partial progress and name every skipped domain.

## Checks

The audited count reconciles with enumeration, totals are derived once per TLD, and no write operation was called.
