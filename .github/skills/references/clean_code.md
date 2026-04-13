# Clean Code Principles

## Focus areas
- Clear responsibility boundaries
- Small, cohesive modules and functions
- Names that reflect domain intent
- Explicit contracts and invariants
- Simplicity over incidental cleverness

## Common risks
- Responsibilities mixed across layers
- Duplication in core workflows or rules
- Hidden side effects or unclear state changes
- Generic abstractions that obscure business meaning
- Premature flexibility that increases complexity without clear value

## Review questions
- What part of the design is likely to become hard to read or reason about?
- Which responsibilities should be split or isolated earlier?
- Where does the specification encourage duplication of rules or behavior?
- Are abstractions solving a real problem or adding indirection too early?

## Principles
- SOLID principles
- DRY (Don't Repeat Yourself)
- KISS (Keep It Simple)
- Avoid premature optimization
- Prefer composition over inheritance
