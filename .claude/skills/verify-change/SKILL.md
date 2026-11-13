---
name: verify-change
description: Tests a claim against observable evidence. Use when proving a fix, behavior or performance improvement.
---

# Verify a change

State the claim in a form that evidence can disprove. Identify the relevant condition, result and acceptance threshold.

1. Choose the smallest surface that exercises the claim: test, request, user interaction, profile or other direct observation.
2. Record the baseline where the claim requires comparison.
3. Check the changed state using comparable inputs and environment. Account for warmup and noise in performance measurements.
4. Inspect the actual targets and artifacts. An exit code alone does not show that the changed path ran.
5. Check important behavior preserved by the change, including failure cases.
6. Distinguish a failed claim from failed measurement. Missing baselines or unavailable environments can make the result inconclusive.

Use independent observations where an implementation-generated test could repeat the same mistake.
Preserve enough evidence to reproduce the conclusion without retaining unnecessary sensitive data.

Return `verified`, `not verified` or `inconclusive`, followed by the claim, tested revision, evidence and limitations.
Verification applies only to the recorded scope and conditions.
