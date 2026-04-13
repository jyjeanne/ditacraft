# Common Design Patterns

## Review rule
- Use patterns only when they simplify change, isolate complexity, or clarify responsibilities.
- Flag patterns that are implied by the problem but not represented in the design when their absence creates risk.

## Patterns and review signals

- **Repository**
  - Useful when persistence concerns need isolation from domain logic.
  - Risk signal: business rules depend directly on storage details.

- **Factory**
  - Useful when object creation has branching rules or environment-specific setup.
  - Risk signal: construction logic is duplicated across flows.

- **Strategy**
  - Useful when business behavior varies by rule set, channel, or policy.
  - Risk signal: condition-heavy logic mixes several interchangeable behaviors.

- **CQRS**
  - Useful when read and write workloads have different scaling, latency, or consistency needs.
  - Risk signal: one model is forced to serve incompatible read and write concerns.

- **Event-driven architecture**
  - Useful when workflows benefit from decoupling, async processing, or fan-out reactions.
  - Risk signal: synchronous chains create fragile coupling or poor resilience.

- **Hexagonal architecture**
  - Useful when the core domain should remain isolated from frameworks, UI, and providers.
  - Risk signal: business logic is tightly coupled to transport or infrastructure choices.

## Review questions
- Which pattern best isolates the volatile part of the design?
- Where is the current design coupling domain logic to infrastructure?
- Would introducing a pattern reduce complexity, or only add ceremony?
