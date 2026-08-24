# Diagnose or configure DNS

Resolve the domain and choose one route. A symptom selects diagnosis; a request to add or configure records selects configuration. A bare domain is ambiguous, so ask which route the user wants.

## Diagnosis

1. Read registrar information and check expiry and registry nameservers.
2. Compare public NS answers, then run only symptom-relevant public checks: A/AAAA and HTTP for web, MX/SPF/DKIM/DMARC for mail, certificate dates and names for TLS, or direct lookup for a subdomain.
3. Compare configured records with public answers when Dynadot is authoritative. If third-party nameservers are authoritative, direct the investigation there.
4. State one root cause when evidence supports it; otherwise distinguish DNS from origin, CDN, firewall, certificate, and client-cache causes.
5. Return an exact proposed change and verification probes. Do not mutate during diagnosis.

## Configuration

1. Read the complete current record set.
2. Load [the DNS reference](../references/dns.md) when a known pattern applies. Require exact provider-issued verification and DKIM values.
3. Compute the full replacement set: replace only intended `(type, host)` tuples and preserve all others.
4. Display additions, replacements, removals, and preserved records. Request explicit approval for that exact full set.
5. Apply once, re-read configured records, and query relevant public DNS. Distinguish saved state from propagation.
6. If observed state differs from the approved set, report failure and stop.

## Checks

Diagnosis performs no writes. Configuration has a before snapshot, exact approved proposal, one write, and read-back evidence.
