# Code Quality and Maintainability Heuristics

## Code quality signals
- Strong separation of responsibilities
- Low duplication in core logic
- Simple, testable control flow
- Contracts and invariants that can be enforced
- Clear module boundaries

## Maintainability and evolvability signals
- Changes stay localized
- Variants can be added without broad rewrites
- Infrastructure details are isolated from business logic
- Interfaces are stable enough for future growth

## Common risks
- God objects or oversized services
- Business rules duplicated in multiple layers
- Hidden coupling to one framework or provider
- New features requiring edits across many unrelated modules
- Short-term shortcuts that create immediate technical debt

## Review questions
- Which parts of the design will be hardest to understand or modify in six months?
- Where does the specification encourage god objects or oversized modules?
- Which future requirements would force changes across many unrelated files?
- Are infrastructure details isolated enough that the provider could be swapped?
- What technical debt does the design create on day one?
