# Research domain names

Use this workflow for an unknown naming space, not for one known domain.

1. Parse the brief: offer, audience, geography, tone, desired TLDs, maximum length, required and forbidden words, and whether the user wants an exact-match domain. Ask only for a missing decision that materially changes the search.
2. Build one ordered source. For brandable names, define ordered phoneme or morpheme dimensions and pass them once as `brandMultiplex`; never hand-author batches of complete coined names. For descriptive names, use current DataForSEO keyword variations and volumes when available, otherwise generate 5–8 fallback phrases once as `llmVariations`. Do not mix sources. Record market, language, date, and match type, and do not call a low-volume term “high volume.”
3. Select TLDs from the brief. Do not add unrelated TLDs merely to increase results.
4. Call the server's domain-idea operation once with the selected source, TLDs, and patterns. For brandable searches, the server owns the library-backed Cartesian product, normalization, length filtering, de-duplication, TLD expansion, ordering, caps, and availability checks. For descriptive searches, it owns compact and dashed labels. The shared registrar client serializes and paces all external requests. Do not manually recreate or sample candidates in the model. Treat any tool error or inconclusive availability response as a blocker, never as an unavailable domain, and do not retry it. For an exact-match request, do not add prefixes or suffixes unless requested.
5. Check current registration and renewal price for the strongest available candidates. Reject premium or materially expensive renewals unless surfaced explicitly.
6. Screen top candidates for direct company, product, and trademark collisions using the environment's approved web-research route. Classify `clear`, `caution`, or `conflict`; this is a preliminary screen, not legal clearance.
7. Score survivors on keyword demand when requested, exactness, memorability, pronunciation, spelling clarity, length, category fit, price, and collision risk.
8. Return 5–12 verified candidates with availability observation time, price, evidence-backed collision notes, and a short recommendation. Keep rejected conflicts separate.

If no candidate survives, change one explicit search dimension and run once more. Otherwise report the blocking constraint.

## Checks

Every recommended domain was checked for availability and price during this run, and every top pick received a current collision screen. Registration remains a separate approved action.
