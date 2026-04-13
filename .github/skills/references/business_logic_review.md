# Business Logic Review Heuristics

## Focus areas
- Core workflows and state transitions
- Eligibility, pricing, thresholds, or approval rules
- Ownership and permission logic
- Invariants that must always remain true
- Exceptional and compensating flows
- Temporal logic (deadlines, expirations, scheduling, cooldowns)
- Data integrity across concurrent operations
- Audit trail and traceability requirements

## Common risks
- Contradictory rules across sections
- Undefined behavior for edge conditions
- Logic that allows inconsistent state
- Missing tie-breakers or conflict resolution
- Business rules mixed with transport or UI concerns
- Race conditions in state transitions
- No handling for partial failures in multi-step workflows
- Missing rollback or compensation logic
- Calculations that can produce negative, zero, or overflow values without guard conditions

## Review questions
- What decisions must always be deterministic?
- Which states are terminal, reversible, or retriable?
- What data must remain consistent across the workflow?
- What happens when two concurrent requests modify the same entity?
- Are all calculations bounded and guarded against edge values (zero, negative, overflow)?
- Which workflows span multiple services or transactions, and what happens if one step fails?
- Are temporal rules (expiration, cooldown, scheduling) fully defined?
- What audit or compliance requirements apply to business decisions?
