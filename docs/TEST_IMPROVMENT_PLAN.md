# Test Improvement Plan: Coverage Threshold Enforcement

This document outlines the plan to implement coverage threshold enforcement (minimum 70%) for the DitaCraft VS Code extension.

## Current State Analysis

### Coverage Tools Evaluation

| Tool | Status | Notes |
|------|--------|-------|
| **nyc** | Not working | Cannot instrument VS Code extension code - Electron blocks NODE_OPTIONS |
| **c8** | Working | Uses V8's native coverage, works with child processes |

### Current Coverage Metrics (using c8)

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| Statements | 62.26% | 70% | -7.74% |
| Branches | 73.70% | 70% | +3.70% |
| Functions | 65.50% | 70% | -4.50% |
| Lines | 62.26% | 70% | -7.74% |

### Key Findings

1. **nyc doesn't work** - VS Code (Electron) blocks `NODE_OPTIONS` that nyc uses for instrumentation. Coverage shows 0/0.
2. **c8 works** - Uses V8's native coverage which properly tracks code executed in child processes.
3. **Coverage gap** - Need to increase ~8% in statements/lines and ~4.5% in functions to hit 70%.
4. **CI currently broken** - Uses `npm run coverage` which calls nyc (doesn't collect data).

---

## Implementation Plan

### Step 1: Switch from nyc to c8

#### 1.1 Update package.json scripts

Replace the existing coverage scripts:

```json
"scripts": {
  "coverage": "npx c8 npm test",
  "coverage:check": "npx c8 check-coverage",
  "coverage:report": "npx c8 report --reporter=html --reporter=text --reporter=lcov"
}
```

#### 1.2 Add c8 configuration to package.json

Add a new `c8` section (can keep nyc config for backwards compatibility):

```json
"c8": {
  "include": [
    "out/**/*.js"
  ],
  "exclude": [
    "out/test/**",
    "**/*.test.js"
  ],
  "reporter": [
    "text",
    "html",
    "lcov"
  ],
  "report-dir": "coverage",
  "temp-directory": ".c8_output",
  "clean": true,
  "all": true
}
```

#### 1.3 Remove or comment out nyc configuration

The existing nyc configuration can be removed or kept for reference:

```json
"nyc": {
  "// NOTE": "nyc does not work with VS Code extension tests - use c8 instead",
  ...
}
```

---

### Step 2: Update CI Workflow

#### 2.1 Update Linux coverage step

In `.github/workflows/ci.yml`, update the Linux test step:

```yaml
- name: Run tests with coverage (Linux)
  id: test-linux
  if: runner.os == 'Linux'
  shell: bash
  run: |
    set -o pipefail
    xvfb-run -a npm run coverage 2>&1 | tee test-output.log

- name: Check coverage threshold (Linux)
  if: runner.os == 'Linux'
  run: |
    npx c8 check-coverage --lines 70 --functions 70 --branches 70 --statements 70
```

#### 2.2 Update coverage summary step

```yaml
- name: Display test and coverage summary
  if: always() && runner.os == 'Linux'
  shell: bash
  run: |
    echo "## 🧪 Test Results" >> $GITHUB_STEP_SUMMARY
    # ... existing test result extraction ...

    echo "## 📊 Coverage Summary" >> $GITHUB_STEP_SUMMARY
    echo "" >> $GITHUB_STEP_SUMMARY
    echo '```' >> $GITHUB_STEP_SUMMARY
    npx c8 report --reporter=text-summary 2>/dev/null | tail -n 6 >> $GITHUB_STEP_SUMMARY || echo "Coverage report not available" >> $GITHUB_STEP_SUMMARY
    echo '```' >> $GITHUB_STEP_SUMMARY
```

---

### Step 3: Improve Test Coverage

To reach 70% coverage, additional tests are needed for the following areas:

#### 3.1 High Priority (Large Coverage Gaps)

| File | Current Coverage | Priority | Notes |
|------|-----------------|----------|-------|
| `src/commands/previewCommand.ts` | Low | High | Preview command logic |
| `src/providers/previewPanel.ts` | Low | High | WebView panel implementation |
| `src/commands/fileCreationCommands.ts` | Medium | High | File creation workflows |

#### 3.2 Medium Priority

| File | Current Coverage | Priority | Notes |
|------|-----------------|----------|-------|
| `src/utils/ditaOtWrapper.ts` | Medium | Medium | DITA-OT integration (requires DITA-OT) |
| `src/utils/configurationManager.ts` | High | Medium | Edge cases and error paths |
| `src/extension.ts` | Medium | Medium | Activation and command registration |

#### 3.3 Test Categories to Add

1. **Preview Command Tests**
   - Test preview with valid DITA file
   - Test preview with invalid file
   - Test preview caching behavior
   - Test preview refresh

2. **File Creation Tests**
   - Test topic creation with different types
   - Test map creation
   - Test bookmap creation
   - Test file naming validation
   - Test template content

3. **Error Path Tests**
   - Test handling of missing files
   - Test handling of invalid XML
   - Test timeout scenarios
   - Test configuration errors

---

### Step 4: Gradual Enforcement Strategy

If achieving 70% immediately is too aggressive, implement gradual enforcement:

#### Phase 1: Baseline (Immediate)
- Set threshold to current coverage: **62%**
- Prevents regression
- CI will fail if coverage drops

```yaml
npx c8 check-coverage --lines 62 --functions 65 --branches 73 --statements 62
```

#### Phase 2: Incremental Improvement
- Increase threshold to **65%** after adding initial tests
- Target: 2-3 weeks

```yaml
npx c8 check-coverage --lines 65 --functions 65 --branches 70 --statements 65
```

#### Phase 3: Target Achievement
- Reach **70%** target
- Target: 4-6 weeks

```yaml
npx c8 check-coverage --lines 70 --functions 70 --branches 70 --statements 70
```

---

## Implementation Checklist

### Configuration Changes
- [ ] Update `package.json` scripts to use c8
- [ ] Add c8 configuration to `package.json`
- [ ] Update `.github/workflows/ci.yml` for c8 coverage
- [ ] Add coverage threshold check step to CI

### Test Improvements
- [ ] Add preview command tests
- [ ] Add file creation command tests
- [ ] Add error handling tests
- [ ] Add configuration edge case tests

### Validation
- [ ] Run coverage locally and verify c8 works
- [ ] Verify CI pipeline passes with new configuration
- [ ] Verify coverage reports are generated correctly
- [ ] Verify threshold enforcement works (test with low threshold)

---

## Commands Reference

### Local Development

```bash
# Run tests with coverage
npm run coverage

# Check coverage thresholds
npx c8 check-coverage --lines 70 --functions 70 --branches 70 --statements 70

# Generate coverage report
npm run coverage:report

# View HTML coverage report
# Open coverage/index.html in browser
```

### CI/CD

```bash
# Full coverage workflow
xvfb-run -a npm run coverage
npx c8 check-coverage --lines 70 --functions 70 --branches 70 --statements 70
npx c8 report --reporter=text-summary
```

---

## Notes

### Why c8 Instead of nyc?

VS Code extension tests run inside a separate Electron process (the VS Code Extension Host). Traditional coverage tools like nyc use `NODE_OPTIONS` to inject instrumentation, but Electron blocks most `NODE_OPTIONS` for security reasons.

c8 uses V8's built-in coverage support (`NODE_V8_COVERAGE`), which:
- Works with child processes
- Doesn't require instrumentation injection
- Is more accurate for modern JavaScript

### Coverage Exclusions

The following are excluded from coverage:
- Test files (`out/test/**`, `**/*.test.js`)
- Type declaration files (`**/*.d.ts`)
- Configuration files

### Known Limitations

1. **Windows/macOS CI** - Currently only Linux runs coverage in CI to avoid complexity with display servers
2. **DITA-OT dependent tests** - Some tests require DITA-OT to be installed, which may affect coverage in CI
3. **VS Code API mocking** - Some VS Code APIs are difficult to test without the full VS Code environment

---

*Last updated: December 2024*
*Status: Planning*
