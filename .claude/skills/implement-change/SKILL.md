---
name: implement-change
description: Makes a bounded, verifiable change. Use when implementing a feature, fix or behavior-preserving refactor.
---

# Implement a change

Read applicable instructions, the working state and nearby implementations. Establish the intended outcome and check before editing.

1. Identify the files and contracts the task requires. Preserve unrelated work.
2. Use existing commands and conventions. Isolate concurrent writers when their edits could overlap.
3. For behavioral changes, add or adapt a check that distinguishes the intended behavior from the defect.
4. For a reproducible defect, confirm the check fails for the expected reason before fixing it.
5. Make the smallest coherent change. Separate unrelated restructuring from behavior changes.
6. Run the check, inspect its result and review the diff. Re-read files changed by formatters or other agents.
7. Follow the repository's required gates for the affected surface. Report missing tools or checks explicitly.

Use proportionate validation for documentation and mechanical edits. Avoid tests that merely duplicate implementation details.
Do not delete necessary boundaries, validation or comments merely to reduce line count.

Return the resulting behavior, relevant checks, remaining concerns and the reviewable change.
