# Manage renewals

1. Enumerate domains and bucket by days remaining: urgent `0–30`, soon `31–90`, upcoming `91–365`, stable `>365`.
2. Fetch one renewal price per unique TLD, calculate each bucket, and read account balance.
3. Show domain, days remaining, effective renewal option, price, recommendation, and any balance gap.
4. Process urgent domains first. Obtain one explicit decision per domain: auto-renew, renew now for a stated duration, intentionally let expire, or skip.
5. For a batch request, bind a numbered proposal containing every domain, operation, duration, and total cost. Execute only after explicit matching approval.
6. Do not process soon or upcoming domains unless the user opts in.
7. Re-read every affected domain and verify expiration or renewal-option changes. Surface silent failures.

Renewal and auto-renew are paid commitments. Never infer approval from a request to review renewals.

## Checks

Every urgent domain has a recorded decision; every executed change has matching approval and post-action evidence.
