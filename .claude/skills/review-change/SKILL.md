---
name: review-change
description: Reviews a diff for consequential defects. Use when checking correctness, maintainability, security or review feedback.
---

# Review a change

Read the diff, its intended behavior and applicable contracts. Review is read-only unless fixes are also requested.

1. Inspect correctness and compatibility before style. Follow affected callers where the diff alone cannot establish behavior.
2. Examine trust boundaries: authorization, input handling, sensitive outputs, privileges and dependency changes.
3. Check concurrency, failure paths and data transitions where they affect the change.
4. Inspect whether verification exercises the relevant behavior and revision.
5. Challenge unnecessary indirection or fallback paths without removing established contracts or error handling.
6. Validate each proposed finding against the actual source and a concrete failure scenario.

Treat automated review comments as hypotheses. Refute unsupported findings with evidence rather than manufacturing a change.
Separate material defects from optional improvements. Report no substantiated findings when that is the result.

Return each finding's impact, location, trigger and recommended correction. State review coverage and unresolved uncertainty.
Use specialist security or domain review when the consequences exceed the available expertise.
