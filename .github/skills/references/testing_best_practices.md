# Testing Best Practices

## Focus areas
- Test pyramid balance (unit 70% > integration 20% > E2E 10%)
- Business-critical path coverage
- Non-functional test coverage (performance, security, operability)
- Determinism and reproducibility
- Test isolation and independence

## Common risks
- Over-reliance on E2E tests (inverted pyramid)
- No unit tests for critical business logic
- Flaky or non-deterministic tests
- Tests coupled to implementation instead of behavior
- Shared state between tests
- Hardcoded test data that hides edge cases
- No security or performance tests for high-risk areas

## Review questions
- Does the test strategy follow a pyramid shape?
- Are business-critical paths covered at the unit level?
- Can tests run independently in any order?
- Are negative paths and edge cases explicitly covered?
- Is there a strategy for testing non-functional requirements?
- What areas have no automated coverage?

## Test quality principles
- Deterministic: same input always produces same result
- Fast: unit tests give sub-second feedback
- Isolated: no hidden shared state or ordering dependencies
- Behavior-oriented: assert outcomes, not implementation details
- Clearly named: Given/When/Then or equivalent structure

## Anti-patterns to detect
- Testing implementation details instead of behavior
- Overuse of mocks that hide integration failures
- Brittle assertions on formatting or ordering
- Tests that pass in isolation but fail in CI
- Weak negative-path and error-handling coverage

## Advanced techniques
- Contract testing for service boundaries
- Property-based testing for invariants
- Mutation testing for assertion strength
