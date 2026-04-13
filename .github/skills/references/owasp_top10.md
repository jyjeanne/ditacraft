# OWASP Top 10

## Review rule
- Map findings to OWASP categories when the specification provides enough evidence.
- If the specification is too vague to prove a category, state the uncertainty explicitly.

## Categories and review signals

- **A01: Broken Access Control**
  - Review signals: missing authorization rules, unclear ownership boundaries, admin/user paths mixed together, tenant isolation not defined.
  - Spec questions: who can read, create, update, approve, delete, or export each resource?

- **A02: Cryptographic Failures**
  - Review signals: sensitive data is stored or transmitted without protection requirements, weak key/secret handling, no rotation or encryption expectations.
  - Spec questions: which data requires encryption at rest, in transit, or both?

- **A03: Injection**
  - Review signals: user-controlled input flows into queries, templates, shell commands, or downstream services without validation or encoding rules.
  - Spec questions: what input validation, output encoding, and query parameterization expectations exist?

- **A04: Insecure Design**
  - Review signals: high-risk workflows have no abuse-case controls, approval flows are bypassable, dangerous actions lack safety constraints.
  - Spec questions: what misuse scenarios were considered, and what controls stop them?

- **A05: Security Misconfiguration**
  - Review signals: insecure defaults, environment-specific security behavior, operational controls left undefined.
  - Spec questions: what secure defaults, headers, policies, or environment guards are required?

- **A06: Vulnerable Components**
  - Review signals: critical dependencies have no ownership, update strategy, or supply-chain controls.
  - Spec questions: how are third-party libraries and services approved, tracked, and upgraded?

- **A07: Authentication Failures**
  - Review signals: login/session/token behavior is underspecified, account recovery is weak, identity proof requirements are missing.
  - Spec questions: how are users authenticated, sessions managed, and recovery flows protected?

- **A08: Integrity Failures**
  - Review signals: callbacks, events, builds, or approvals can be tampered with; signatures and trusted sources are undefined.
  - Spec questions: how is integrity verified for artifacts, webhooks, approvals, and state transitions?

- **A09: Logging Failures**
  - Review signals: critical security events are not auditable, incident investigation would be impossible, sensitive data may leak into logs.
  - Spec questions: which events must be logged, alerted on, retained, and redacted?

- **A10: SSRF**
  - Review signals: the system fetches user-provided URLs or interacts with network targets without restrictions.
  - Spec questions: what outbound request controls, allowlists, or network boundaries are required?

## Abuse-case prompts
- What can an untrusted user do to exceed intended permissions?
- What data could be exposed through errors, exports, logs, or callbacks?
- Which actions are irreversible or high impact, and what safeguards protect them?
