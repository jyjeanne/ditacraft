import sys
import json
import re

SEVERITY_RANK = {
    "low": 0,
    "medium": 1,
    "high": 2,
    "critical": 3,
}

LIKELIHOOD_BY_SEVERITY = {
    "low": "low",
    "medium": "medium",
    "high": "high",
    "critical": "high",
}

SECURITY_TERMS = [
    "security", "authentication", "authorization", "permission",
    "access control", "encrypt", "owasp", "vulnerability", "credential",
]

PERFORMANCE_TERMS = [
    "performance", "latency", "throughput", "sla", "slo",
    "scalability", "response time",
]

VALID_CATEGORIES = {
    "spec", "business_logic", "architecture", "performance", "security",
    "testing", "devops", "dependencies", "standards", "ux",
    "documentation", "code_quality", "maintainability",
}


def load_spec(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        print(f"Error: spec file not found: {path}", file=sys.stderr)
        sys.exit(1)
    except OSError as exc:
        print(f"Error: unable to read spec file {path}: {exc}", file=sys.stderr)
        sys.exit(1)


def create_issue(title, severity, category, description, recommendation, evidence, impact):
    if category not in VALID_CATEGORIES:
        raise ValueError(f"Invalid category '{category}'; expected one of {sorted(VALID_CATEGORIES)}")
    return {
        "title": title,
        "severity": severity,
        "category": category,
        "description": description,
        "impact": impact,
        "evidence": evidence,
        "source_section": "automated_preflight",
        "recommendation": recommendation,
    }


def basic_analysis(spec):
    issues = []

    markers = re.findall(r'\b(TODO|FIXME|HACK|XXX)\b', spec, re.IGNORECASE)
    if markers:
        unique = sorted(set(m.upper() for m in markers))
        markers_str = ", ".join(unique)
        issues.append(create_issue(
            "Unresolved markers in specification",
            "medium",
            "spec",
            f"Specification contains unresolved markers: {markers_str}.",
            "Resolve all TODO/FIXME/HACK/XXX markers before implementation.",
            f"Found markers in the specification text: {markers_str}.",
            "Open markers usually indicate incomplete requirements or unresolved design decisions.",
        ))

    if len(spec) < 200:
        issues.append(create_issue(
            "Specification too short",
            "high",
            "spec",
            "Specification lacks enough detail for a reliable engineering review.",
            "Expand the specification with functional, technical, and operational details.",
            f"Specification length is {len(spec)} characters.",
            "A short specification is likely missing business rules, edge cases, or delivery constraints.",
        ))

    return issues


def detect_testing_gaps(spec):
    gaps = []
    spec_lower = spec.lower()

    if not re.search(r'\btest(?:s|ing|ed|able)?\b', spec_lower):
        gaps.append(create_issue(
            "No testing strategy defined",
            "high",
            "testing",
            "Specification does not mention a testing strategy.",
            "Define unit, integration, contract, and end-to-end testing expectations.",
            "No testing-related terms were found in the specification text.",
            "Missing test guidance makes implementation quality and release safety hard to evaluate.",
        ))

    if re.search(r'\be2e\b', spec_lower) and not re.search(r'\bunit\b', spec_lower):
        gaps.append(create_issue(
            "Imbalanced test strategy",
            "medium",
            "testing",
            "Specification mentions E2E tests without describing unit-test coverage.",
            "Follow a test-pyramid approach and define unit coverage for critical logic.",
            'Found "e2e" in the specification text but no occurrence of "unit".',
            "Over-reliance on E2E tests usually slows feedback and leaves core logic under-specified.",
        ))

    return gaps


def detect_security_gaps(spec):
    gaps = []
    spec_lower = spec.lower()

    if not any(term in spec_lower for term in SECURITY_TERMS):
        gaps.append(create_issue(
            "No security considerations mentioned",
            "high",
            "security",
            "Specification does not mention security, authentication, authorization, or access control.",
            "Define security boundaries, authentication requirements, and data protection expectations.",
            "No security-related terms were found in the specification text.",
            "Missing security guidance increases the risk of insecure design and missed threat vectors.",
        ))

    return gaps


def detect_performance_gaps(spec):
    gaps = []
    spec_lower = spec.lower()

    if not any(term in spec_lower for term in PERFORMANCE_TERMS):
        gaps.append(create_issue(
            "No performance requirements mentioned",
            "medium",
            "performance",
            "Specification does not mention performance, latency, throughput, or scalability expectations.",
            "Define performance targets, SLOs, or acceptance criteria for latency-sensitive operations.",
            "No performance-related terms were found in the specification text.",
            "Missing performance guidance may lead to designs that do not meet user or operational expectations.",
        ))

    return gaps


def build_summary(issues):
    if any(issue["severity"] in {"high", "critical"} for issue in issues):
        verdict = "not_ready"
    elif issues:
        verdict = "ready_with_risks"
    else:
        verdict = "ready"

    return {
        "system_goal": None,
        "scope": "Automated preflight based on lightweight text heuristics.",
        "verdict": verdict,
        "top_risks": [
            issue["title"]
            for issue in sorted(
                issues,
                key=lambda i: SEVERITY_RANK[i["severity"]],
                reverse=True,
            )[:3]
        ],
        "missing_information": [],
        "assumptions": [
            "This helper performs shallow text checks and does not replace the full ai-spec-review skill contract."
        ],
    }


def build_risk_register(issues):
    risk_register = []

    sorted_issues = sorted(
        issues,
        key=lambda i: SEVERITY_RANK[i["severity"]],
        reverse=True,
    )

    for index, issue in enumerate(sorted_issues, start=1):
        risk_register.append({
            "id": f"risk-{index}",
            "title": issue["title"],
            "severity": issue["severity"],
            "likelihood": LIKELIHOOD_BY_SEVERITY[issue["severity"]],
            "category": issue["category"],
            "affected_area": "specification",
            "trigger": issue["description"],
            "mitigation": issue["recommendation"],
            "owner": "spec_author",
        })

    return risk_register


def main():
    if len(sys.argv) < 2:
        print("Usage: review_spec.py <spec.md>", file=sys.stderr)
        sys.exit(1)

    spec = load_spec(sys.argv[1])
    issues = (
        basic_analysis(spec)
        + detect_testing_gaps(spec)
        + detect_security_gaps(spec)
        + detect_performance_gaps(spec)
    )

    result = {
        "summary": build_summary(issues),
        "risk_register": build_risk_register(issues),
        "issues": issues,
    }

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
