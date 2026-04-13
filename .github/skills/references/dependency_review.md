# Dependency Review Heuristics

## What to inspect
- Critical third-party packages and services
- Version pinning and upgrade cadence
- Vendor lock-in and replacement cost
- Blast radius of outages
- Security and maintenance posture

## Common risks
- Dependence on unmaintained packages
- Tight coupling to one provider API
- No adapter layer around critical dependencies
- Weak upgrade strategy for breaking changes
- Supply-chain exposure through broad transitive trees

## Good signals
- Clear ownership of major dependencies
- Compatibility strategy
- Isolation of provider-specific logic
- Defined degradation behavior when dependencies fail

## Review questions
- Which dependencies are critical-path and what happens if they fail?
- Is there an isolation layer between the core logic and each external provider?
- What is the upgrade strategy for dependencies with breaking changes?
- Are dependency versions pinned and is there a cadence for security patches?
- What is the blast radius if a transitive dependency is compromised?
