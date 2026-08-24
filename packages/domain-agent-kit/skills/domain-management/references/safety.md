# Safety boundaries

This reference owns approval policy; workflows own when actions are proposed.

## Approval-required operations

Require exact approval immediately before domain registration, renewal, deletion, push, transfer changes, nameserver or DNS whole-set replacement, auto-renew settings, aftermarket mutations, bids, backorders, and contact or folder deletion. The proposal names operation, target, full parameters, price or financial exposure, affected records, and rollback limits. Changed parameters require fresh approval.

## Read-back

After mutation, fetch the affected resource and compare observed state. A successful transport response is not proof of state transition.

## Secrets

Credentials belong in the host secret store or protected environment. Report only presence, environment, scope, or authentication result.

## Checks

Read-only routes never invoke a mutating action. Every mutation has exact approval and read-back evidence.
