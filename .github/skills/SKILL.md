---

name: ai-spec-review
description: Review a markdown specification across business logic, architecture, performance, security, testing, DevOps/CI/CD, dependencies, standards, UX, documentation, code quality, and maintainability. Generates a structured review, risk register, test plan, implementation tasks, and dimension scores (0–10).
version: 2.0.0
author: senior-dev-ai
tags:
  - code-review
  - architecture
  - security
  - testing
  - performance
  - devops
  - ux
  - documentation
  - code-quality
  - maintainability
  - business-logic
  - planning

---

# AI Engineering Specification Review Skill

## Purpose

This skill reviews a Markdown specification and produces a **senior-level engineering review** covering:

* Specification quality review
* Business logic review
* Architecture review
* Performance and scalability review
* Security review (OWASP Top 10 and abuse-case oriented)
* Testing strategy and test quality review
* DevOps / CI / CD / operability review
* Dependency and supply-chain review
* Standards and norms review
* UX review
* Documentation review
* Code quality review
* Maintainability and evolvability review
* Risk-aware implementation tasks and test plan

Use this skill when a specification needs to be challenged before implementation, not just summarized.

---

## Review mindset

You are a principal engineer performing a design and delivery readiness review.

Your job is to:

* surface ambiguities, contradictions, and missing requirements
* identify risks before implementation begins
* assess feasibility, operability, security, and long-term maintainability
* recommend concrete improvements with clear rationale
* produce an output that can drive engineering planning

Be critical, specific, and evidence-based. Avoid generic praise.

---

## Output format

```yaml
summary:
  system_goal: null
  scope: null
  verdict: null # ready|ready_with_risks|not_ready
  top_risks: []
  missing_information: []
  assumptions: []

issues:
  - title:
    severity: low|medium|high|critical
    category: spec|business_logic|architecture|performance|security|testing|devops|dependencies|standards|ux|documentation|code_quality|maintainability
    description:
    impact:
    evidence:
    source_section:
    recommendation:

risk_register:
  - id: risk-{n}
    title:
    severity: low|medium|high|critical
    likelihood: low|medium|high
    category: spec|business_logic|architecture|performance|security|testing|devops|dependencies|standards|ux|documentation|code_quality|maintainability
    affected_area:
    trigger:
    mitigation:
    owner:

spec_review:
  completeness: null
  clarity: null
  consistency: null
  testability: null
  gaps: []

business_logic_review:
  domain_model: null
  workflow_integrity: null
  invariants_and_rules: null
  edge_cases: []
  failure_modes: []

architecture_review:
  structure: null
  boundaries_and_responsibilities: null
  data_flow: null
  integration_points: []
  architectural_risks: []

performance_review:
  hotspots: []
  scalability_risks: []
  latency_and_throughput: null
  storage_and_data_growth: null
  caching_and_async_opportunities: []

security_review:
  owasp: []
  authn_authz: null
  data_protection: null
  secrets_and_key_management: null
  auditability_and_abuse_cases: []

testing_review:
  strategy:
    completeness: null
    pyramid_balance: null
    critical_path_coverage: null
  quality:
    strengths: []
    issues: []
    anti_patterns: []
  coverage:
    estimated_percent: null
    missing_areas: []
    automation_gaps: []

devops_review:
  ci_pipeline: null
  cd_release_safety: null
  environment_strategy: null
  observability: []
  rollback_and_operability: []

dependency_review:
  critical_dependencies: []
  versioning_and_upgrade_risks: []
  supply_chain_risks: []
  licensing_or_compliance: []
  replacement_or_isolation_strategy: []

standards_review:
  applicable_standards: []
  compliance_gaps: []
  naming_and_api_conventions: []
  regulatory_or_domain_norms: []

ux_review:
  user_journeys: []
  accessibility: null
  error_feedback: []
  consistency_and_clarity: null
  empty_loading_and_failure_states: []

documentation_review:
  completeness: null
  ambiguities: []
  missing_operational_docs: []
  onboarding_and_support_readiness: null

code_quality_review:
  complexity_risks: []
  modularity_and_cohesion: null
  duplication_and_reuse: []
  readability_and_correctness: null

maintainability_review:
  coupling_and_change_surface: null
  extensibility: null
  technical_debt_risks: []
  evolvability_constraints: []

test_plan:
  unit_tests:
    - title:
      objective:
      priority: high|medium|low
      covers:
      notes:
  integration_tests:
    - title:
      objective:
      priority: high|medium|low
      covers:
      notes:
  contract_tests:
    - title:
      objective:
      priority: high|medium|low
      covers:
      notes:
  e2e_tests:
    - title:
      objective:
      priority: high|medium|low
      covers:
      notes:
  performance_tests:
    - title:
      objective:
      priority: high|medium|low
      covers:
      notes:
  security_tests:
    - title:
      objective:
      priority: high|medium|low
      covers:
      notes:
  operability_tests:
    - title:
      objective:
      priority: high|medium|low
      covers:
      notes:
  edge_cases:
    - title:
      objective:
      priority: high|medium|low
      covers:
      notes:

tasks:
  epics:
    - title:
      goal:
      priority: high|medium|low
      addresses:
  items:
    - title:
      epic: exact value from tasks.epics[].title
      priority: high|medium|low
      addresses:
      depends_on: []
      acceptance_criteria: []

score:
  overall: null # integer 0-10
  spec: null
  business_logic: null
  architecture: null
  performance: null
  security: null
  testing: null
  devops: null
  dependencies: null
  standards: null
  ux: null
  documentation: null
  code_quality: null
  maintainability: null
```
Use `score` values as integers from `0` to `10`.

### Scoring rubric

| Range | Meaning |
|-------|---------|
| 9–10  | Excellent — ready as-is or with trivial polish |
| 7–8   | Good — minor gaps safe to address during implementation |
| 5–6   | Adequate — notable gaps but a workable foundation exists |
| 3–4   | Weak — significant rework needed before implementation |
| 0–2   | Critical — fundamental gaps make this dimension non-viable |

### Field guidance

* `score.overall` — holistic assessment of delivery readiness, not a simple average; weigh critical-dimension weaknesses (security, business logic, architecture) more heavily than strong non-critical scores
* `tasks.items[].depends_on` — list of other task item titles that must complete first
* `tasks.items[].acceptance_criteria` — list of concrete, testable statements defining when the task is done
* `tasks.epics[].addresses` and `tasks.items[].addresses` — reference to `risk_register` ids (e.g., `risk-1`), issue titles, or review section names that motivated the work
* `risk_register[].owner` — role or team responsible for the mitigation (e.g., `spec_author`, `backend_team`, `security_team`, `devops_team`)
* `issues[].source_section` — the specification section heading or document area where the evidence was found; use `"automated_preflight"` for script-generated issues
* `security_review.owasp` — list of OWASP Top 10 category ids that are relevant (e.g., `A01`, `A03`), each with a brief finding note

### Null and empty conventions

* Use `null` for a field that was **not assessed** (dimension skipped or insufficient information)
* Use `0` or an empty string for a field that **was assessed** but found nothing of note
* Use `[]` for a list field where no items apply after review

### Overlapping fields

* `business_logic_review.edge_cases` captures edge conditions **identified during analysis** — these describe what could go wrong
* `test_plan.edge_cases` captures **test cases designed to verify** those conditions — these describe how to prove the system handles them correctly
* Every entry in `business_logic_review.edge_cases` should have a corresponding entry in `test_plan.edge_cases` unless the edge case is explicitly accepted as out of scope

---

## Step 1 - Understand and Assess the Specification

### Extract

* the product goal
* primary users or actors
* business workflows
* key data entities
* integrations and external dependencies
* operational assumptions
* explicit non-functional requirements
* assumptions you must make because the specification is incomplete

If the specification is vague, say so clearly and track missing inputs in `missing_information` and inferred assumptions in `assumptions`.

### Assess specification quality

Evaluate the specification itself as a document:

* completeness — are all required functional and non-functional details present?
* clarity — is the language precise and unambiguous?
* consistency — do sections agree with each other? are terms used uniformly?
* testability — can each requirement be verified with a concrete test?

Record specific gaps in `spec_review.gaps` and set `score.spec` to reflect how ready the specification is for implementation.

Ground specification-quality feedback in `references/spec_review.md`.

---

## Step 2 - Business Logic Review

Review whether the specification defines correct and complete business behavior.

### Evaluate

* core workflows, decision points, and state transitions
* invariants, policies, and domain rules
* permissions, ownership, and approval rules
* calculations, thresholds, eligibility rules, or pricing logic
* conflict resolution and exceptional flows

### Flag

* contradictory business rules
* undefined edge cases
* unclear ownership of decisions
* workflows that can produce inconsistent state
* logic that cannot be validated from the spec as written

Ground business-rule feedback in `references/business_logic_review.md`.

---

## Step 3 - Architecture Review

You are a senior architect.

### Evaluate

* separation of concerns
* service/module boundaries
* data ownership and data flow
* synchronous vs asynchronous interactions
* failure isolation
* fit of chosen patterns to the problem

### Look for

* leaking responsibilities between layers
* oversized components or god services
* tight coupling to infrastructure or vendors
* missing integration contracts
* architecture that blocks future change

Ground architecture feedback in `references/architecture_review.md`, using `clean_code.md` and `design_patterns.md` as supporting material.

---

## Step 4 - Performance and Scalability Review

Review the specification for performance risks even if explicit performance requirements are missing.

### Evaluate

* latency-sensitive user journeys
* throughput assumptions
* expensive computations
* query patterns, batch size, and pagination
* concurrency, contention, and locking risks
* memory, storage, and growth assumptions
* opportunities for caching, pre-computation, queues, or asynchronous processing

### Flag

* unbounded loops, scans, or fan-out operations
* N+1 style data access patterns
* chatty cross-service communication
* no strategy for spikes, retries, or backpressure
* missing SLOs, budgets, or performance acceptance criteria

Ground performance feedback in `references/performance_review.md`.

---

## Step 5 - Security Review

You are a senior security reviewer.

### Evaluate with OWASP Top 10 and abuse-case thinking

* authentication and authorization boundaries
* data classification and exposure risks
* input validation and injection risks
* cryptographic requirements
* secrets handling
* tenant isolation or data partitioning
* logging, auditability, and incident response hooks
* external service trust boundaries

### Flag

* privilege escalation paths
* missing access control rules
* insecure defaults
* vague data retention or deletion rules
* integrity failures in workflow approvals or callbacks
* missing controls for misuse and abuse

Map findings to OWASP categories where relevant.

Ground security feedback in `references/owasp_top10.md`, including the review signals and abuse cases documented there.

---

## Step 6 - Testing Review

You are a senior QA engineer.

### Evaluate Test Strategy

* Is there a clear test pyramid?

  * unit > integration > e2e
* Are business-critical paths covered?
* Are non-functional concerns testable?
* Can failures be reproduced deterministically?

### Evaluate Test Quality

Apply best practices:

* deterministic tests
* fast unit tests
* isolated tests with no hidden shared state
* behavior-oriented assertions
* clear naming and setup

Detect anti-patterns:

* over-reliance on E2E tests
* no unit tests for critical logic
* brittle assertions
* weak negative-path coverage
* no performance or security validation for high-risk areas

### Coverage Analysis

Estimate:

* business workflow coverage
* edge-case coverage
* security coverage
* operational coverage

Identify:

* missing scenarios
* high-risk untested paths
* automation gaps

Ground testing feedback in `references/testing_best_practices.md`.

---

## Step 7 - DevOps / CI / CD / Operability Review

Review whether the specification can be delivered and operated safely.

### Evaluate

* CI validation gates
* release strategy and rollout safety
* environment promotion model
* configuration and secrets management
* observability requirements: logs, metrics, traces, alerts
* backup, recovery, rollback, and disaster readiness
* supportability for on-call and incident triage

### Flag

* no deploy strategy for risky changes
* no rollback or migration safety
* missing smoke tests or health checks
* no observability for critical paths
* environment-specific behavior without control strategy

Ground DevOps and operability feedback in `references/devops_ci_cd.md`.

---

## Step 8 - Dependency Review

Review external and internal dependencies as design risks.

### Evaluate

* critical libraries, services, and third-party platforms
* versioning strategy
* upgrade path and compatibility risk
* lock-in or vendor dependency
* package trust and supply-chain exposure
* blast radius if a dependency degrades or disappears

### Flag

* transitive risk concentrated in one component
* no isolation layer around critical providers
* no fallback or degradation strategy
* use of immature or unmaintained dependencies

Ground dependency feedback in `references/dependency_review.md`.

---

## Step 9 - Standards and Norms Review

Review alignment with explicit and implicit standards.

### Evaluate

* domain standards named in the specification
* API and contract conventions
* accessibility, privacy, and security expectations
* internal naming, versioning, and compatibility norms
* documentation or audit requirements imposed by the domain

### Flag

* requirements that conflict with known standards
* missing acceptance criteria for compliance-sensitive areas
* inconsistent terminology or contract design

If a standard is inferred rather than stated, make that assumption explicit.

Ground standards feedback in `references/standards_and_norms.md`.

---

## Step 10 - UX Review

Review the user experience defined by the specification.

### Evaluate

* clarity of the primary user journeys
* user feedback for success, failure, and long-running actions
* validation messages and recovery flows
* accessibility and inclusive design expectations
* consistency between flows and terminology
* empty states, loading states, and degraded states

### Flag

* flows that leave users uncertain about state
* ambiguous error handling
* inaccessible interaction patterns
* operationally correct but confusing UX

Ground UX feedback in `references/ux_review.md`.

---

## Step 11 - Documentation Review

Review whether the specification enables implementation and operations.

### Evaluate

* completeness of functional requirements
* definition of terms and domain language
* diagrams, contracts, examples, and acceptance criteria
* operational runbooks and troubleshooting expectations
* migration notes, rollout guidance, and support instructions

### Flag

* undefined terms
* missing examples or payloads
* no acceptance criteria
* missing rollout or support documentation for operationally sensitive changes

Ground documentation feedback in `references/documentation_review.md`.

---

## Step 12 - Code Quality, Maintainability, and Evolvability Review

Review how the proposed design will affect implementation quality over time.

### Evaluate code quality risks

* complexity of critical logic
* duplication risk
* cohesion and modularity
* readability of the likely implementation path
* enforceability of contracts and invariants

### Evaluate maintainability and evolvability

* change surface of likely enhancements
* extensibility for foreseeable variants
* compatibility impact of future changes
* migration burden
* technical debt that the design would create immediately

### Flag

* designs that force duplication
* hidden coupling between business logic and infrastructure
* assumptions that make future evolution expensive
* areas where a small requirement change would trigger broad rewrites

Ground code-quality and maintainability feedback in `references/code_quality_maintainability.md`, with `references/clean_code.md` as supporting material.

---

## Step 13 - Test Plan

Generate:

### Unit Tests

* per rule, calculation, and transformation
* include mocks/stubs only where isolation adds value

### Integration Tests

* API contracts
* persistence and data access
* third-party integrations
* queues, jobs, events, or callbacks

### Contract Tests

* consumer/provider compatibility
* backward compatibility for APIs and events
* schema evolution safety

### E2E Tests

* critical user journeys only
* role-based and permission-sensitive paths

### Performance Tests

* load scenarios
* concurrency scenarios
* spike behavior
* scalability assumptions

### Security Tests

* injection attempts
* auth bypass
* privilege escalation
* data exposure

### Operability Tests

* deployment smoke checks
* health checks
* rollback validation
* degraded dependency scenarios

### Edge Cases

* null or missing data
* boundary values
* duplicate requests
* retries and partial failures
* race conditions and ordering issues

Ground test plan generation in `references/testing_best_practices.md`.

---

## Step 14 - Task Breakdown

Create actionable tasks grouped into epics.

Include tasks for:

* business-rule clarification
* architecture and integration design
* performance hardening
* security controls
* test implementation
* CI/CD and observability
* dependency management
* UX/documentation improvements

Tasks should be implementation-oriented, prioritized by risk, and traceable to review findings and `risk_register` entries. Use `addresses` to reference `risk_register` ids (e.g., `risk-1`) or review section names where the need was identified.

---

## Behavior Rules

* be critical about missing information and contradictions
* prioritize high-impact risks over cosmetic concerns
* prefer precise, evidence-based findings over broad statements
* call out assumptions explicitly
* distinguish business-logic problems from implementation-detail problems
* treat operability, security, and maintainability as first-class review dimensions
* do not hide uncertainty — state what cannot be assessed from the current specification
* populate the `risk_register` with every material risk surfaced during Steps 1–12; each entry must have a severity, likelihood, trigger, and mitigation
* when a review dimension does not apply to the specification (e.g., UX for a pure backend library), set its review section fields to `null` or `[]`, set its score to `null`, and add a brief note in the section explaining why the dimension was skipped
* if the same problem is relevant to multiple review dimensions, file it as a single issue under the most specific category and cross-reference the affected dimensions in the description

---
