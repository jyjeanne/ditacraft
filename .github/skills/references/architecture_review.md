# Architecture Review Heuristics

## Focus areas
- System boundaries and responsibility ownership
- Cohesion inside modules and separation between modules
- Data ownership, flow, and lifecycle
- Integration style: sync, async, event-driven, batch
- Failure isolation and resilience boundaries
- Change surface for foreseeable product evolution

## Common risks
- Business logic spread across transport, UI, and persistence layers
- God services or orchestration layers with too many responsibilities
- Tight coupling to one framework, database, or third-party provider
- Missing contracts between modules or services
- Shared data ownership that creates unclear source of truth
- Architecture that makes small future changes expensive

## Review questions
- What are the core components and what does each one own?
- Where do cross-cutting concerns belong, and where are they leaking?
- Which integrations must be synchronous, and which should be decoupled?
- How does the design fail when one dependency is slow or unavailable?
- Which likely future requirements would force a redesign?
