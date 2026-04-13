# Documentation Review Heuristics

## Expected documentation
- Clear problem statement and scope
- Acceptance criteria
- Domain terminology
- Example payloads, scenarios, or diagrams
- Operational notes for rollout and support

## Common gaps
- Ambiguous terms
- Missing examples for complex flows
- No failure-mode documentation
- No migration or rollout notes
- No troubleshooting guidance for support teams

## Review questions
- Could an engineer implement every requirement without guessing?
- Are all domain terms defined and used consistently?
- Do complex flows have examples, diagrams, or payload samples?
- Is there enough operational documentation for on-call and support teams?
- Are migration and rollout steps documented for the first release?

## Review rule
- If engineers would need to guess behavior during implementation or support, treat it as a documentation gap.
