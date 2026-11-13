---
name: investigate-problem
description: Finds causes from evidence. Use when debugging a failure or researching an unfamiliar behavior.
---

# Investigate a problem

Read the observed failure and available evidence before changing the system. Determine whether this is a defect, environment failure or unanswered question.

1. Record the observed behavior, expected behavior and smallest known reproducer.
2. Trace the affected boundary through relevant code, configuration and recent changes.
3. State a falsifiable explanation. Choose the least disruptive observation that could reject it.
4. Run the observation and retain the result. Separate measured facts from interpretations.
5. Use primary documentation or source when behavior depends on an unfamiliar dependency. Record the revision or retrieval date.
6. Revise the explanation when evidence contradicts it. Avoid repeating an unchanged failing operation.

For an active service incident, use `respond-incident` to establish the impact and mitigation priorities first.
If reproduction or access is unavailable, identify the missing evidence and limit the conclusion.

Return the supported cause or open hypotheses, evidence locations and the smallest justified next step.
