"""Unit tests for review_spec.py"""

import json
import os
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(__file__))

from review_spec import (
    LIKELIHOOD_BY_SEVERITY,
    PERFORMANCE_TERMS,
    SECURITY_TERMS,
    SEVERITY_RANK,
    VALID_CATEGORIES,
    basic_analysis,
    build_risk_register,
    build_summary,
    create_issue,
    detect_performance_gaps,
    detect_security_gaps,
    detect_testing_gaps,
    load_spec,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _tmp_spec(content):
    """Write content to a temp file and return its path."""
    f = tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False)
    f.write(content)
    f.close()
    return f.name


RICH_SPEC = (
    "## Feature: User Authentication\n"
    "The system must support OAuth2 authentication with access control.\n"
    "Security: All endpoints require authorization headers.\n"
    "Testing strategy: unit tests, integration tests, and e2e tests.\n"
    "Performance: p99 latency must stay below 200ms under SLA.\n"
    "Edge cases and error handling should be documented.\n"
) * 2  # >200 chars, mentions all dimensions


# ===========================================================================
# Constants
# ===========================================================================

class TestConstants(unittest.TestCase):

    def test_severity_rank_has_four_levels(self):
        self.assertEqual(set(SEVERITY_RANK.keys()), {"low", "medium", "high", "critical"})

    def test_severity_rank_ordering(self):
        self.assertLess(SEVERITY_RANK["low"], SEVERITY_RANK["medium"])
        self.assertLess(SEVERITY_RANK["medium"], SEVERITY_RANK["high"])
        self.assertLess(SEVERITY_RANK["high"], SEVERITY_RANK["critical"])

    def test_likelihood_covers_all_severities(self):
        self.assertEqual(set(LIKELIHOOD_BY_SEVERITY.keys()), set(SEVERITY_RANK.keys()))

    def test_likelihood_values_are_valid(self):
        for v in LIKELIHOOD_BY_SEVERITY.values():
            self.assertIn(v, {"low", "medium", "high"})

    def test_valid_categories_count(self):
        self.assertEqual(len(VALID_CATEGORIES), 13)

    def test_security_terms_non_empty(self):
        self.assertGreater(len(SECURITY_TERMS), 0)

    def test_performance_terms_non_empty(self):
        self.assertGreater(len(PERFORMANCE_TERMS), 0)


# ===========================================================================
# load_spec
# ===========================================================================

class TestLoadSpec(unittest.TestCase):

    def test_loads_existing_file(self):
        path = _tmp_spec("hello world")
        try:
            self.assertEqual(load_spec(path), "hello world")
        finally:
            os.unlink(path)

    def test_exits_on_missing_file(self):
        with self.assertRaises(SystemExit) as ctx:
            load_spec("/tmp/no_such_file_abc123.md")
        self.assertEqual(ctx.exception.code, 1)

    def test_preserves_unicode(self):
        path = _tmp_spec("Spécification — données élémentaires")
        try:
            self.assertIn("Spécification", load_spec(path))
        finally:
            os.unlink(path)


# ===========================================================================
# create_issue
# ===========================================================================

class TestCreateIssue(unittest.TestCase):

    def _make(self, **overrides):
        defaults = dict(
            title="Test issue",
            severity="medium",
            category="spec",
            description="desc",
            recommendation="rec",
            evidence="ev",
            impact="imp",
        )
        defaults.update(overrides)
        return create_issue(**defaults)

    def test_returns_all_expected_keys(self):
        issue = self._make()
        expected_keys = {
            "title", "severity", "category", "description",
            "impact", "evidence", "source_section", "recommendation",
        }
        self.assertEqual(set(issue.keys()), expected_keys)

    def test_source_section_is_automated(self):
        self.assertEqual(self._make()["source_section"], "automated_preflight")

    def test_all_valid_categories_accepted(self):
        for cat in VALID_CATEGORIES:
            issue = self._make(category=cat)
            self.assertEqual(issue["category"], cat)

    def test_invalid_category_raises(self):
        with self.assertRaises(ValueError) as ctx:
            self._make(category="invalid_cat")
        self.assertIn("invalid_cat", str(ctx.exception))

    def test_overall_is_not_a_valid_category(self):
        with self.assertRaises(ValueError):
            self._make(category="overall")

    def test_values_pass_through(self):
        issue = self._make(title="T", severity="high", description="D", impact="I")
        self.assertEqual(issue["title"], "T")
        self.assertEqual(issue["severity"], "high")
        self.assertEqual(issue["description"], "D")
        self.assertEqual(issue["impact"], "I")


# ===========================================================================
# basic_analysis
# ===========================================================================

class TestBasicAnalysis(unittest.TestCase):

    def test_clean_long_spec_returns_no_issues(self):
        spec = "A perfectly clean specification. " * 20
        self.assertEqual(basic_analysis(spec), [])

    # -- marker detection --

    def test_detects_todo(self):
        spec = "We should TODO refactor this module later. " * 10
        issues = basic_analysis(spec)
        titles = [i["title"] for i in issues]
        self.assertIn("Unresolved markers in specification", titles)

    def test_detects_fixme(self):
        spec = "There is a FIXME in the payment flow. " * 10
        issues = basic_analysis(spec)
        self.assertTrue(any("markers" in i["title"].lower() for i in issues))

    def test_detects_hack(self):
        spec = "This is a HACK until the DB migration is done. " * 10
        issues = basic_analysis(spec)
        self.assertTrue(any("markers" in i["title"].lower() for i in issues))

    def test_detects_xxx(self):
        spec = "XXX need to revisit this integration layer. " * 10
        issues = basic_analysis(spec)
        self.assertTrue(any("markers" in i["title"].lower() for i in issues))

    def test_case_insensitive_markers(self):
        spec = "todo: decide auth mechanism, Fixme: rate limiter. " * 10
        issues = basic_analysis(spec)
        marker_issues = [i for i in issues if "markers" in i["title"].lower()]
        self.assertEqual(len(marker_issues), 1)
        self.assertIn("FIXME", marker_issues[0]["evidence"])
        self.assertIn("TODO", marker_issues[0]["evidence"])

    def test_no_false_positive_on_todolist(self):
        """'todolist' should not trigger because \\b prevents partial match."""
        spec = "Check our todolist for project items. " * 10
        marker_issues = [i for i in basic_analysis(spec) if "markers" in i["title"].lower()]
        self.assertEqual(marker_issues, [])

    def test_marker_severity_is_medium(self):
        spec = "TODO: fix this. " * 20
        issues = [i for i in basic_analysis(spec) if "markers" in i["title"].lower()]
        self.assertEqual(issues[0]["severity"], "medium")

    # -- short spec detection --

    def test_short_spec_flagged(self):
        spec = "Short."
        issues = basic_analysis(spec)
        self.assertTrue(any("too short" in i["title"].lower() for i in issues))

    def test_short_spec_severity_is_high(self):
        spec = "Short."
        issues = [i for i in basic_analysis(spec) if "too short" in i["title"].lower()]
        self.assertEqual(issues[0]["severity"], "high")

    def test_exactly_200_chars_not_flagged(self):
        spec = "x" * 200
        issues = [i for i in basic_analysis(spec) if "too short" in i["title"].lower()]
        self.assertEqual(issues, [])

    def test_199_chars_is_flagged(self):
        spec = "x" * 199
        issues = [i for i in basic_analysis(spec) if "too short" in i["title"].lower()]
        self.assertEqual(len(issues), 1)

    def test_evidence_includes_length(self):
        spec = "Short."
        issues = [i for i in basic_analysis(spec) if "too short" in i["title"].lower()]
        self.assertIn(str(len(spec)), issues[0]["evidence"])


# ===========================================================================
# detect_testing_gaps
# ===========================================================================

class TestDetectTestingGaps(unittest.TestCase):

    # -- no testing terms --

    def test_no_testing_terms_flagged(self):
        spec = "Build a REST API for inventory management."
        issues = detect_testing_gaps(spec)
        self.assertTrue(any("no testing" in i["title"].lower() for i in issues))

    def test_no_testing_severity_is_high(self):
        spec = "Build a REST API."
        issues = [i for i in detect_testing_gaps(spec) if "no testing" in i["title"].lower()]
        self.assertEqual(issues[0]["severity"], "high")

    # -- word boundary: false positives rejected --

    def test_latest_does_not_satisfy_testing(self):
        """'latest' contains 'test' but is NOT a testing term."""
        spec = "Use the latest version of the library."
        issues = detect_testing_gaps(spec)
        self.assertTrue(any("no testing" in i["title"].lower() for i in issues))

    def test_contest_does_not_satisfy_testing(self):
        spec = "We are running a contest for best feature."
        issues = detect_testing_gaps(spec)
        self.assertTrue(any("no testing" in i["title"].lower() for i in issues))

    def test_protest_does_not_satisfy_testing(self):
        spec = "Users may protest the new policy."
        issues = detect_testing_gaps(spec)
        self.assertTrue(any("no testing" in i["title"].lower() for i in issues))

    # -- word boundary: real testing terms accepted --

    def test_test_alone_accepted(self):
        spec = "We must test the payment flow end-to-end."
        issues = [i for i in detect_testing_gaps(spec) if "no testing" in i["title"].lower()]
        self.assertEqual(issues, [])

    def test_tests_accepted(self):
        spec = "Integration tests are required for all APIs."
        issues = [i for i in detect_testing_gaps(spec) if "no testing" in i["title"].lower()]
        self.assertEqual(issues, [])

    def test_testing_accepted(self):
        spec = "Testing strategy: unit and integration testing."
        issues = [i for i in detect_testing_gaps(spec) if "no testing" in i["title"].lower()]
        self.assertEqual(issues, [])

    def test_tested_accepted(self):
        spec = "All modules must be tested before release."
        issues = [i for i in detect_testing_gaps(spec) if "no testing" in i["title"].lower()]
        self.assertEqual(issues, [])

    def test_testable_accepted(self):
        spec = "Requirements must be testable and measurable."
        issues = [i for i in detect_testing_gaps(spec) if "no testing" in i["title"].lower()]
        self.assertEqual(issues, [])

    # -- imbalanced test strategy --

    def test_e2e_without_unit_flagged(self):
        spec = "We will rely on e2e tests for validation."
        issues = detect_testing_gaps(spec)
        self.assertTrue(any("imbalanced" in i["title"].lower() for i in issues))

    def test_e2e_with_unit_not_flagged(self):
        spec = "Run e2e and unit tests for this feature."
        imbalanced = [i for i in detect_testing_gaps(spec) if "imbalanced" in i["title"].lower()]
        self.assertEqual(imbalanced, [])

    def test_imbalanced_severity_is_medium(self):
        spec = "We will rely on e2e tests for validation."
        issues = [i for i in detect_testing_gaps(spec) if "imbalanced" in i["title"].lower()]
        self.assertEqual(issues[0]["severity"], "medium")


# ===========================================================================
# detect_security_gaps
# ===========================================================================

class TestDetectSecurityGaps(unittest.TestCase):

    def test_no_security_terms_flagged(self):
        spec = "Build a simple calculator UI."
        issues = detect_security_gaps(spec)
        self.assertEqual(len(issues), 1)
        self.assertIn("security", issues[0]["title"].lower())

    def test_severity_is_high(self):
        spec = "Build a simple calculator UI."
        self.assertEqual(detect_security_gaps(spec)[0]["severity"], "high")

    def test_category_is_security(self):
        spec = "Build a simple calculator UI."
        self.assertEqual(detect_security_gaps(spec)[0]["category"], "security")

    def test_each_security_term_satisfies(self):
        for term in SECURITY_TERMS:
            spec = f"The system requires {term} support."
            issues = detect_security_gaps(spec)
            self.assertEqual(issues, [], f"Term '{term}' should suppress the security gap")

    def test_case_insensitive(self):
        spec = "All endpoints use AUTHENTICATION headers."
        self.assertEqual(detect_security_gaps(spec), [])


# ===========================================================================
# detect_performance_gaps
# ===========================================================================

class TestDetectPerformanceGaps(unittest.TestCase):

    def test_no_performance_terms_flagged(self):
        spec = "Build a simple contact form."
        issues = detect_performance_gaps(spec)
        self.assertEqual(len(issues), 1)
        self.assertIn("performance", issues[0]["title"].lower())

    def test_severity_is_medium(self):
        spec = "Build a simple contact form."
        self.assertEqual(detect_performance_gaps(spec)[0]["severity"], "medium")

    def test_category_is_performance(self):
        spec = "Build a simple contact form."
        self.assertEqual(detect_performance_gaps(spec)[0]["category"], "performance")

    def test_each_performance_term_satisfies(self):
        for term in PERFORMANCE_TERMS:
            spec = f"The system should meet {term} targets."
            issues = detect_performance_gaps(spec)
            self.assertEqual(issues, [], f"Term '{term}' should suppress the performance gap")

    def test_case_insensitive(self):
        spec = "LATENCY must be below 100ms."
        self.assertEqual(detect_performance_gaps(spec), [])


# ===========================================================================
# build_summary
# ===========================================================================

class TestBuildSummary(unittest.TestCase):

    def _issue(self, severity="medium", title="Issue"):
        return create_issue(
            title=title, severity=severity, category="spec",
            description="d", recommendation="r", evidence="e", impact="i",
        )

    def test_no_issues_is_ready(self):
        s = build_summary([])
        self.assertEqual(s["verdict"], "ready")

    def test_low_only_is_ready_with_risks(self):
        s = build_summary([self._issue("low")])
        self.assertEqual(s["verdict"], "ready_with_risks")

    def test_medium_only_is_ready_with_risks(self):
        s = build_summary([self._issue("medium")])
        self.assertEqual(s["verdict"], "ready_with_risks")

    def test_high_triggers_not_ready(self):
        s = build_summary([self._issue("high")])
        self.assertEqual(s["verdict"], "not_ready")

    def test_critical_triggers_not_ready(self):
        s = build_summary([self._issue("critical")])
        self.assertEqual(s["verdict"], "not_ready")

    def test_mixed_with_high_is_not_ready(self):
        issues = [self._issue("low"), self._issue("medium"), self._issue("high")]
        self.assertEqual(build_summary(issues)["verdict"], "not_ready")

    def test_top_risks_max_three(self):
        issues = [self._issue("medium", f"Issue {i}") for i in range(5)]
        s = build_summary(issues)
        self.assertEqual(len(s["top_risks"]), 3)

    def test_top_risks_sorted_by_severity(self):
        issues = [
            self._issue("low", "Low issue"),
            self._issue("critical", "Critical issue"),
            self._issue("medium", "Medium issue"),
        ]
        s = build_summary(issues)
        self.assertEqual(s["top_risks"][0], "Critical issue")

    def test_summary_has_expected_keys(self):
        s = build_summary([])
        expected = {"system_goal", "scope", "verdict", "top_risks", "missing_information", "assumptions"}
        self.assertEqual(set(s.keys()), expected)

    def test_system_goal_is_null(self):
        self.assertIsNone(build_summary([])["system_goal"])

    def test_assumptions_non_empty(self):
        self.assertGreater(len(build_summary([])["assumptions"]), 0)


# ===========================================================================
# build_risk_register
# ===========================================================================

class TestBuildRiskRegister(unittest.TestCase):

    def _issue(self, severity="medium", title="Issue"):
        return create_issue(
            title=title, severity=severity, category="spec",
            description="d", recommendation="r", evidence="e", impact="i",
        )

    def test_empty_issues_yields_empty_register(self):
        self.assertEqual(build_risk_register([]), [])

    def test_risk_ids_start_at_one(self):
        reg = build_risk_register([self._issue()])
        self.assertEqual(reg[0]["id"], "risk-1")

    def test_ids_are_sequential(self):
        issues = [self._issue("medium", f"I{i}") for i in range(4)]
        reg = build_risk_register(issues)
        ids = [r["id"] for r in reg]
        self.assertEqual(ids, ["risk-1", "risk-2", "risk-3", "risk-4"])

    def test_sorted_by_severity_descending(self):
        issues = [
            self._issue("low", "Low"),
            self._issue("critical", "Critical"),
            self._issue("medium", "Medium"),
        ]
        reg = build_risk_register(issues)
        self.assertEqual(reg[0]["title"], "Critical")
        self.assertEqual(reg[1]["title"], "Medium")
        self.assertEqual(reg[2]["title"], "Low")

    def test_highest_severity_gets_risk_1(self):
        issues = [self._issue("low", "L"), self._issue("high", "H")]
        reg = build_risk_register(issues)
        risk1 = next(r for r in reg if r["id"] == "risk-1")
        self.assertEqual(risk1["severity"], "high")

    def test_risk_entry_has_expected_keys(self):
        reg = build_risk_register([self._issue()])
        expected = {
            "id", "title", "severity", "likelihood", "category",
            "affected_area", "trigger", "mitigation", "owner",
        }
        self.assertEqual(set(reg[0].keys()), expected)

    def test_likelihood_matches_severity(self):
        for sev in ("low", "medium", "high", "critical"):
            reg = build_risk_register([self._issue(sev)])
            self.assertEqual(reg[0]["likelihood"], LIKELIHOOD_BY_SEVERITY[sev])

    def test_owner_is_spec_author(self):
        reg = build_risk_register([self._issue()])
        self.assertEqual(reg[0]["owner"], "spec_author")


# ===========================================================================
# Integration: main via subprocess
# ===========================================================================

class TestMainIntegration(unittest.TestCase):

    def _run(self, spec_content):
        path = _tmp_spec(spec_content)
        try:
            result = subprocess.run(
                [sys.executable, os.path.join(os.path.dirname(__file__), "review_spec.py"), path],
                capture_output=True, text=True,
            )
            return result, json.loads(result.stdout)
        finally:
            os.unlink(path)

    def test_no_args_exits_nonzero(self):
        result = subprocess.run(
            [sys.executable, os.path.join(os.path.dirname(__file__), "review_spec.py")],
            capture_output=True, text=True,
        )
        self.assertNotEqual(result.returncode, 0)

    def test_missing_file_exits_nonzero(self):
        result = subprocess.run(
            [sys.executable, os.path.join(os.path.dirname(__file__), "review_spec.py"), "/no/such/file.md"],
            capture_output=True, text=True,
        )
        self.assertNotEqual(result.returncode, 0)

    def test_output_is_valid_json(self):
        result, data = self._run(RICH_SPEC)
        self.assertEqual(result.returncode, 0)
        self.assertIsInstance(data, dict)

    def test_output_has_three_top_keys(self):
        _, data = self._run(RICH_SPEC)
        self.assertEqual(set(data.keys()), {"summary", "risk_register", "issues"})

    def test_rich_spec_is_ready(self):
        _, data = self._run(RICH_SPEC)
        self.assertEqual(data["summary"]["verdict"], "ready")

    def test_rich_spec_no_issues(self):
        _, data = self._run(RICH_SPEC)
        self.assertEqual(data["issues"], [])

    def test_minimal_spec_not_ready(self):
        _, data = self._run("short")
        self.assertEqual(data["summary"]["verdict"], "not_ready")

    def test_minimal_spec_has_issues(self):
        _, data = self._run("short")
        self.assertGreater(len(data["issues"]), 0)

    def test_risk_register_matches_issues_count(self):
        _, data = self._run("short")
        self.assertEqual(len(data["risk_register"]), len(data["issues"]))

    def test_issues_with_todo_marker(self):
        spec = "TODO: define auth mechanism.\n" * 20
        _, data = self._run(spec)
        titles = [i["title"] for i in data["issues"]]
        self.assertIn("Unresolved markers in specification", titles)

    def test_all_issue_categories_are_valid(self):
        _, data = self._run("short")
        for issue in data["issues"]:
            self.assertIn(issue["category"], VALID_CATEGORIES)


if __name__ == "__main__":
    unittest.main()
