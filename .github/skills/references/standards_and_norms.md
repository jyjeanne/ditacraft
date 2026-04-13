# Standards and Norms Review Heuristics

## Review targets
- Domain or regulatory standards named by the specification
- API naming, versioning, and compatibility conventions
- Security and privacy expectations
- Accessibility expectations
- Internal engineering conventions that affect interoperability

## Common gaps
- Terms used inconsistently across the spec
- Compliance-sensitive behavior without acceptance criteria
- API contracts that do not follow the surrounding ecosystem norms
- Missing audit or retention requirements where the domain implies them

## Review questions
- Which standards are explicitly required by the specification?
- Where is compliance assumed but not verified with acceptance criteria?
- Are API contracts consistent with the surrounding ecosystem conventions?
- Which inferred norms should be made explicit?

## Review rule
- Prefer explicit standards from the specification first.
- When inferring a norm, state that it is an assumption.
