# DevOps and CI/CD Review Heuristics

## CI expectations
- Static analysis and tests aligned with risk
- Fast feedback for common failures
- Reproducible builds
- Artifact traceability

## CD expectations
- Safe rollout strategy
- Rollback plan
- Migration safety for schema and data changes
- Environment parity where it matters

## Operability expectations
- Structured logs
- Metrics and alerts on critical paths
- Health checks and smoke tests
- Runbooks for failure modes
- Backup and recovery strategy

## Common risks
- Deployments that cannot be rolled back safely
- No smoke checks after release
- Secrets or config handled manually
- No observability for business-critical workflows
- Hidden environment-specific behavior

## Review questions
- Can every deployment be rolled back without data loss?
- What gates must pass before code reaches production?
- How will the team detect and diagnose failures in production?
- Which environment differences could cause behavior drift?
- Are secrets and configuration managed through a controlled pipeline?
