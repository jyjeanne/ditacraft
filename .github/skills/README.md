# AI Spec Review Skill

> A comprehensive AI skill that reviews markdown specifications through **16 engineering steps** and produces structured, actionable output — risk registers, scored dimensions, test plans, and implementation tasks.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.8+](https://img.shields.io/badge/python-3.8%2B-blue.svg)](https://www.python.org/)
[![Skill version](https://img.shields.io/badge/skill-v2.1.0-green.svg)](SKILL.md)

---

## Why this skill?

Most spec reviews stop at "looks good" or catch only surface issues. This skill acts as a **principal-engineer-level reviewer** that systematically challenges a specification before a single line of code is written.

It doesn't just summarize — it surfaces ambiguities, contradictions, security gaps, missing edge cases, and operational blind spots, then packages everything into a format that drives engineering planning.

## Review dimensions

| # | Dimension | Grounding reference |
|---|-----------|-------------------|
| 0 | Scope resolution & context loading | `references/language_security_patterns.md` |
| 1 | Specification quality | `references/spec_review.md` |
| 2 | Business logic | `references/business_logic_review.md` |
| 3 | Architecture | `references/architecture_review.md` |
| 4 | Performance & scalability | `references/performance_review.md` |
| 5 | Security (OWASP Top 10) | `references/owasp_top10.md`, `references/security_vulnerability_patterns.md`, `references/secret_management_checklist.md`, `references/language_security_patterns.md` |
| 6 | Testing strategy & quality | `references/testing_best_practices.md` |
| 7 | DevOps / CI / CD / operability | `references/devops_ci_cd.md` |
| 8 | Dependency & supply chain | `references/dependency_review.md`, `references/vulnerable_packages_watchlist.md` |
| 9 | Standards & norms | `references/standards_and_norms.md` |
| 10 | UX | `references/ux_review.md` |
| 11 | Documentation | `references/documentation_review.md` |
| 12 | Code quality & maintainability | `references/code_quality_maintainability.md` |
| 13 | Test plan generation | `references/testing_best_practices.md` |
| 14 | Task breakdown | *(output-focused, no heuristic reference)* |
| 15 | Self-verification pass | *(cross-cutting quality gate)* |

Each dimension is scored **0–10** using a five-band rubric (Critical / Weak / Adequate / Good / Excellent). The overall score is a holistic judgment, not a simple average — security, business logic, and architecture weigh more heavily.

## Structured output

The skill produces a YAML-structured review containing:

```
summary          → verdict (ready / ready_with_risks / not_ready), top risks, assumptions
issues[]         → title, severity, confidence, category, evidence, impact, recommendation
risk_register[]  → id, severity, likelihood, trigger, mitigation, owner
*_review         → dimension-specific findings (13 sections)
test_plan        → coverage matrix, edge cases, contract tests
tasks[]          → prioritized implementation tasks with acceptance criteria
score            → 14 dimension scores (0–10) + holistic overall
```

See [SKILL.md](SKILL.md) for the complete schema and field guidance.

### What's new in v2.1.0

* **Step 0 — Scope Resolution**: identifies the technology stack and loads project-specific guidelines before the review begins
* **Confidence ratings**: every issue now carries a `confidence: high|medium|low` field to help engineers prioritize
* **Deeper security review**: expanded to cover SSRF, BOLA/IDOR, JWT weaknesses, race conditions, secrets management lifecycle, data flow analysis, and rate limiting
* **Supply-chain awareness**: dependency review now references an ecosystem-specific vulnerable packages watchlist and supply-chain red flags
* **Step 15 — Self-Verification Pass**: re-examines all findings before final output to filter false positives and ensure severity accuracy
* **4 new reference files**: `security_vulnerability_patterns.md`, `secret_management_checklist.md`, `vulnerable_packages_watchlist.md`, `language_security_patterns.md`

## Install

### As a Copilot / Codex skill

```bash
# Clone into your skills directory
git clone https://github.com/jyjeanne/ai-spec-review-skill.git ~/.codex/skills/ai-spec-review

# Or for other AI runtimes, clone into their equivalent skills directory
```

### As a standalone tool

```bash
git clone https://github.com/jyjeanne/ai-spec-review-skill.git
cd ai-spec-review-skill

# Run the preflight helper on any spec
python3 scripts/review_spec.py path/to/your-spec.md
```

The preflight helper performs lightweight text heuristics (marker detection, testing/security/performance gap analysis) and outputs JSON with `summary`, `risk_register`, and `issues`. It is intentionally narrower than the full AI-driven review.

## Usage

### With an AI assistant

```
Review this specification using ai-spec-review skill
```

```
Review this specification with ai-spec-review and focus on security, performance, and business logic gaps
```

```
Use ai-spec-review to produce a structured architecture, testing, DevOps, and documentation review
```

### Preflight helper (CLI)

```bash
python3 scripts/review_spec.py spec.md
```

Output example:

```json
{
  "summary": {
    "verdict": "not_ready",
    "top_risks": ["No testing strategy defined", "No security considerations mentioned"],
    ...
  },
  "risk_register": [ ... ],
  "issues": [ ... ]
}
```

## Running tests

```bash
cd scripts
python3 -m unittest test_review_spec -v
```

82 unit tests cover all helper functions: marker detection, word-boundary matching, gap detectors, verdict logic, risk register construction, and CLI integration.

## Repository structure

```
.
├── SKILL.md                      # Skill contract (source of truth)
├── README.md
├── LICENSE
├── .gitignore
├── .github/
│   └── copilot-instructions.md   # Copilot session guidance
├── references/                   # Grounding heuristics (18 files)
│   ├── spec_review.md
│   ├── business_logic_review.md
│   ├── architecture_review.md
│   ├── performance_review.md
│   ├── owasp_top10.md
│   ├── security_vulnerability_patterns.md
│   ├── secret_management_checklist.md
│   ├── language_security_patterns.md
│   ├── vulnerable_packages_watchlist.md
│   ├── testing_best_practices.md
│   ├── devops_ci_cd.md
│   ├── dependency_review.md
│   ├── standards_and_norms.md
│   ├── ux_review.md
│   ├── documentation_review.md
│   ├── code_quality_maintainability.md
│   ├── clean_code.md
│   └── design_patterns.md
├── scripts/
│   ├── review_spec.py            # Preflight helper
│   └── test_review_spec.py       # Unit tests (82 tests)
└── docs/
    └── samples/                  # Example review artifacts
```

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request.

Key guidelines:

- **SKILL.md is the source of truth** — any change to review dimensions, output schema, or behavior rules starts there
- **Back dimensions with references** — heuristics belong in `references/*.md`, not buried in SKILL.md
- **Keep the helper narrow** — `review_spec.py` is a preflight tool, not the full review engine
- **Run the tests** — `python3 -m unittest test_review_spec -v` must pass before submitting

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## DitaCraft AI Integration

This repository also implements a full LLM/AI integration for the DitaCraft VS Code extension. The `ai-spec-review` skill was used to review and validate the LLM integration specification before implementation.

### @ditacraft Chat Participant

DitaCraft registers a Copilot Chat participant that provides DITA-aware AI assistance:

```
@ditacraft /restructure Group topics by audience: admin first, then end user
@ditacraft /validate
@ditacraft /explain focus on accessibility best practices
@ditacraft /suggest-reuse focus on installation topics only
```

| Command | Description |
|---|---|
| `/restructure` | Proposes a restructured DITA map as valid XML, based on a plain-language intention |
| `/validate` | Explains the diagnostic at the cursor position in plain language with a fix suggestion |
| `/explain` | Explains the semantic structure of the selected DITA element |
| `/suggest-reuse` | Identifies `conref`/`keyref` reuse opportunities in the active DITA map |

### Provider Cascade

The AI layer uses a priority cascade with per-provider circuit breakers:

```
GitHub Copilot → Anthropic Claude → OpenAI GPT-4o → Ollama (local)
```

Each provider is wrapped in a `CircuitBreaker`: after 3 failures in 5 minutes, the provider is bypassed for 10 minutes, and the next available provider is tried automatically.

### Additional AI Features

| Feature | Trigger | Description |
|---|---|---|
| **Configure AI** | Command Palette | WebView panel to view provider status and store API keys (SecretStorage) |
| **Restructure Map** | Command Palette / Explorer menu | Full diff-and-apply workflow with LLM-proposed DITA map |
| **AI Quick Fix** | `Ctrl+.` on supported diagnostics | `✨ Fix with DitaCraft AI` code action |
| **AI Completion** | Type `<` in a DITA file | AI-enriched completion items with `(AI)` suffix, 500ms timeout |

### Using ai-spec-review with DitaCraft

To review a new DitaCraft AI feature specification:

```
Review this specification using ai-spec-review skill
```

Point it at `docs/ditacraft-llm-spec.md` or any new feature spec to get a structured review covering all 14 engineering dimensions before implementation begins.
