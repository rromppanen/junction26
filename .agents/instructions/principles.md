# Engineering principles

Use these principles to choose between solutions and resolve tradeoffs. Procedures serve the outcome and remain proportional to the task.

## Order of concern

Correctness, clarity, simplicity, then performance. Required security, reliability and resource limits are part of correctness.
Within those constraints, prefer the solution readers can understand and maintain. Follow established conventions when they preserve these properties.

## One authoritative definition

Keep each fact where its owner maintains it. Derive or reference other representations instead of maintaining competing copies.
Ask which definition must change when the fact changes, and how dependent representations remain consistent.

## Explicit behavior

Make dependencies, side effects and failure behavior visible through contracts and names.
Avoid wrappers, casts and fallbacks that conceal an invariant or obscure an error.
Ask whether a caller can understand the consequences without tracing unrelated implementation details.

## Boundaries are contracts

Define accepted inputs, observable results and failure behavior at each boundary. Validate untrusted input there; trust established internal guarantees.
Check callers, stored data and compatibility before changing a contract. Plan migration where consumers cannot move together.
Ask whether each side can change independently while preserving the agreement.

## Coherent responsibilities

Group behavior that changes for the same reason. Separate concerns when their coupling makes either harder to understand or change.
Keep core rules independent of replaceable infrastructure where that separation reduces coupling.
Ask whether replacing an external dependency requires changing the domain rules.

## Remove unnecessary complexity

Prefer direct changes over speculative abstractions. Look for branches, modes and helpers the requirement no longer needs.
Preserve required validation and compatibility while simplifying. Remove obsolete paths after their consumers and data have migrated.
Ask whether removing a mechanism solves the problem more clearly than adding another condition.

## Verifiable change

Choose increments whose effects can be checked and recovered independently where practical. Keep unrelated changes separately reviewable.
Use evidence that exercises the changed behavior. Measure optimization against representative workloads and comparable conditions.
Review depth follows the consequences of failure, including authorization, shared contracts and persistent data.
Ask what observation would disprove the claim and what recovery remains possible.

## Improve the conditions for future work

Turn recurring failures into focused checks or guidance when evidence supports the change.
Keep instructions scoped, test their effect and remove rules that no longer help.
Judge agent work by accepted outcomes and maintained system quality. Code volume and agent activity are inputs to that judgment.
