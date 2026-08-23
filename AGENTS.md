<!-- principles:begin v1 -->
## Engineering principles

KISS, SSOT, DRY, SOLID, MECE.

1. **Prefer a library over custom code.** Reach for a maintained library before
   writing your own version of a solved problem. If you catch yourself writing a
   second implementation of a standard, stop and use the standard. Check the
   skill or repo you are working in for a shipped script before writing one.
2. **Always the latest version.** Pin dependencies to the current release and
   look it up rather than recalling it. A version from memory is a guess.
3. **One way, the best one.** No fallbacks, no circumvention, no case-specific
   branch beside a general one. A fallback does not degrade the answer visibly,
   it degrades it invisibly, which is the failure mode you cannot debug from the
   output. When a prerequisite is missing, exit and name the fix.
4. **One source of truth.** Any fact that appears twice will drift. Derive the
   copies from the source, or keep only the source.
5. **Online information goes through `agent-reach`.** It is the single adapter
   for search and platform content, its search backend is `search.klarc.eu`,
   and it routes library and framework documentation to `context7` via
   `mcporter`. Read `agent-reach/references/dev.md` before reaching for
   anything else. Do not substitute an ad-hoc fetch, and do not wire a second
   route to a capability it already covers.
6. **Every fix ships with a check that fails without it.** Verify by mutation:
   break the fix, watch the check fail, restore it.
7. **Never let a doc state what the code does not do.** Derive documentation
   from the running code wherever that is possible.
<!-- principles:end -->
