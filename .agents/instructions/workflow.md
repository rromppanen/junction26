# Working through a task

Start with the request, applicable instructions and actual working state. Determine what would demonstrate a useful result.
Use a retained plan when the work spans decisions, dependencies or sessions.
Keep plans and checkpoints in the authoritative task location named by the repository map.

## Execute and verify

Use these decisions as needed; a simple task does not require a written response to every step.
For an assessment request, deliver findings. For a change request, complete the authorized change and its checks.

1. Define the outcome, scope and acceptance evidence.
2. Inspect relevant code, tests and operating constraints before choosing a change.
3. Record significant uncertainty and select the next observation or implementation step.
4. Make a bounded change and run the relevant check.
5. Inspect the result and revise the plan when its assumptions fail.
6. Review the diff and complete the authorized delivery stage.
7. Report the resulting behavior, checks and any remaining owner decision.

A green aggregate command can exercise no relevant targets. Inspect coverage and artifacts before claiming success.
Use existing repository gates; this pack provides no replacement lint or test configuration.
Once acceptance evidence and required checks pass, repeat or broaden verification only for new changes, failures or unresolved concerns.
Keep edits focused. Retain tests when they protect requested behavior or satisfy repository requirements; temporary probes need not become permanent files.

## Delegate when independence helps

Give each delegate one outcome, relevant context, authority and expected evidence.
Isolate conflicting edits and keep integration under one owner.
Choose resources according to task difficulty and verify the combined result.
Batch independent reads when tools support it. Preserve ordering for dependencies and conflicting writes.
Continue useful independent work while delegates run; wait when their result determines the next action.

## Stop or preserve progress

Stop an unsafe or unauthorized step. Continue permitted work that resolves the blocking decision.
Avoid unchanged retry loops; use an explicit retry or time budget when recurrence is expected.
Preserve the current state and next action before handing off unfinished work.

The task's definition of done determines completion. A summary, elapsed budget or successful tool invocation does not substitute for acceptance evidence.
