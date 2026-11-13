---
name: resume-work
description: Preserves and restores task state. Use when handing off, resuming or checkpointing work across sessions.
---

# Resume work

Read the saved task record and inspect the actual workspace. Treat summaries as pointers to evidence, not as authority.

1. Recover the outcome, constraints and existing authorization from their sources.
2. Identify the current revision, uncommitted changes and completed work. Preserve unrelated edits.
3. Check which verification still applies. Changes to code, dependencies or environment can invalidate previous results.
4. Retain rejected hypotheses with their evidence so the next session can avoid repeating them.
5. Name the next bounded action, unresolved decisions and responsible owner.
6. Update one authoritative checkpoint with links to necessary artifacts. Avoid copying entire conversations or credentials.

For work that must survive a session, record this information in the chosen task location before handing off.
An ephemeral task can end with its result; it does not require a permanent checkpoint.
When several agents share a record, assign update ownership or use a conflict-aware store.
Resolve disagreements against original evidence and current state. A checkpoint cannot broaden deployment or data-access permission.

Return the reconciled state, stale assumptions, next action and any decision that requires the owner.
