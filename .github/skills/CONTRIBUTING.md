# Contributing to AI Spec Review Skill

Thank you for your interest in improving this skill! This guide will help you contribute effectively.

## How the project is structured

This is an **AI skill package**, not a conventional application. Understanding the file roles is essential:

| File | Role |
|------|------|
| `SKILL.md` | **Source of truth** — skill contract, output schema, review steps, behavior rules |
| `references/*.md` | Grounding heuristics — one file per review dimension |
| `scripts/review_spec.py` | Lightweight preflight helper (narrow scope by design) |
| `scripts/test_review_spec.py` | Unit tests for the helper script |
| `README.md` | Install and usage documentation |
| `.github/copilot-instructions.md` | Copilot session conventions |

## Development workflow

1. **Fork and clone** the repository
2. **Create a feature branch** from `main`
3. **Make your changes** following the guidelines below
4. **Run the tests**: `python3 -m unittest scripts.test_review_spec -v`
5. **Submit a pull request** with a clear description of what and why

## Guidelines

### Changing the review contract

- Any change to review dimensions, output schema, scoring, or behavior rules **must start in SKILL.md**
- After updating SKILL.md, propagate changes to affected files (README.md, copilot-instructions.md, review_spec.py)
- If adding a new review dimension:
  1. Add the dimension to the Purpose list in SKILL.md
  2. Add a `*_review` section to the output schema
  3. Add the dimension to the `score` block
  4. Add the category to the `category` enum in the issues schema
  5. Create a grounding reference file in `references/`
  6. Ground the corresponding step to the new reference file

### Adding or editing reference files

- Follow the existing structure: **Focus areas**, **Common risks / anti-patterns**, **Review questions**
- Keep heuristics concrete and actionable — avoid generic advice
- Reference files should be self-contained (an AI reviewer should be able to apply them without external context)

### Modifying the helper script

- The helper is intentionally narrow: it emits `summary`, `risk_register`, and `issues` only
- It does **not** perform domain reviews, generate test plans, or produce scores — that is the AI reviewer's job
- All new detection functions must validate against `VALID_CATEGORIES`
- Add unit tests for any new or changed functions

### Code style

- Python: follow PEP 8, use type hints where practical
- Markdown: use ATX headings (`#`), prefer bullet lists over numbered lists for unordered items
- YAML in SKILL.md: remember this is a **template**, not executable YAML — use `null` for unset fields

## Reporting issues

When opening an issue, please include:

- Which file is affected (SKILL.md, a reference file, or the helper script)
- Whether it's a **contract issue** (wrong/missing review behavior) or a **tooling issue** (helper script bug)
- Expected vs. actual behavior
- For helper script bugs: the spec text (or a minimal reproduction) and the JSON output

## Enums reference

These enums are defined in SKILL.md and must stay consistent across all files:

- **Severity**: `low | medium | high | critical`
- **Verdict**: `ready | ready_with_risks | not_ready`
- **Category**: `spec | business_logic | architecture | performance | security | testing | devops | dependencies | standards | ux | documentation | code_quality | maintainability`
- **Score dimensions**: all categories above + `overall`
