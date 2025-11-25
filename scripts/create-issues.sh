#!/bin/bash
# Create GitHub issues for DitaCraft
# Prerequisites: gh CLI installed and authenticated (gh auth login)

REPO="jyjeanne/ditacraft"

echo "Creating issues for $REPO..."

# ============================================
# Good First Issues (v0.3.0 - Developer Experience)
# ============================================

gh issue create --repo $REPO \
  --title "Remove unused xml2js dependency" \
  --body "## Description
The \`xml2js\` package is listed as a dependency but is not actively used in the codebase. All XML parsing is handled by \`fast-xml-parser\` and \`@xmldom/xmldom\`.

## Task
1. Remove \`xml2js\` from \`package.json\` dependencies
2. Run \`npm install\` to update \`package-lock.json\`
3. Verify the extension still compiles: \`npm run compile\`
4. Verify tests still pass: \`npm test\`

## Acceptance Criteria
- [ ] \`xml2js\` removed from dependencies
- [ ] Extension compiles without errors
- [ ] All tests pass
- [ ] Bundle size reduced

## Labels
good first issue, help wanted, dependencies" \
  --label "good first issue" --label "help wanted"

gh issue create --repo $REPO \
  --title "Add npm audit to CI workflow" \
  --body "## Description
The CI pipeline should check for security vulnerabilities in dependencies using \`npm audit\`.

## Task
1. Edit \`.github/workflows/ci.yml\`
2. Add a step to run \`npm audit --audit-level=moderate\`
3. This should fail the build if moderate or higher vulnerabilities are found

## Example
\`\`\`yaml
- name: Security audit
  run: npm audit --audit-level=moderate
\`\`\`

## Acceptance Criteria
- [ ] npm audit step added to CI
- [ ] Build fails on moderate+ vulnerabilities
- [ ] CI workflow passes with current dependencies

## Labels
good first issue, help wanted, ci/cd, security" \
  --label "good first issue" --label "help wanted"

gh issue create --repo $REPO \
  --title "Add code coverage reporting with nyc" \
  --body "## Description
Currently there's no way to measure test coverage. We should add nyc/istanbul for code coverage reporting.

## Task
1. Install nyc as dev dependency: \`npm install --save-dev nyc\`
2. Add nyc configuration to \`package.json\`
3. Add \`coverage\` npm script
4. Update CI to generate and upload coverage report

## Example Configuration
\`\`\`json
{
  \"nyc\": {
    \"extension\": [\".ts\"],
    \"include\": [\"src/**/*.ts\"],
    \"exclude\": [\"src/**/*.test.ts\", \"src/test/**\"],
    \"reporter\": [\"text\", \"html\", \"lcov\"],
    \"all\": true
  }
}
\`\`\`

## Acceptance Criteria
- [ ] nyc installed and configured
- [ ] \`npm run coverage\` generates report
- [ ] Coverage visible in CI artifacts
- [ ] README badge for coverage (optional)

## Labels
good first issue, help wanted, testing, ci/cd" \
  --label "good first issue" --label "help wanted"

gh issue create --repo $REPO \
  --title "Create utility function for safe error message extraction" \
  --body "## Description
Throughout the codebase, there's repetitive code for extracting error messages:
\`\`\`typescript
error instanceof Error ? error.message : 'Unknown error'
\`\`\`

This should be centralized in a utility function.

## Task
1. Create \`src/utils/errorUtils.ts\`
2. Implement \`getErrorMessage(error: unknown): string\`
3. Replace all instances of the pattern throughout the codebase
4. Add tests for the utility function

## Files to Update
- \`src/extension.ts\` (lines 96, 103)
- \`src/commands/publishCommand.ts\`
- \`src/commands/validateCommand.ts\`
- \`src/providers/ditaValidator.ts\`
- And others...

## Acceptance Criteria
- [ ] Utility function created and tested
- [ ] All existing occurrences replaced
- [ ] Code compiles and tests pass

## Labels
good first issue, help wanted, code quality, refactoring" \
  --label "good first issue" --label "help wanted"

# ============================================
# Medium Priority Issues (v0.3.0)
# ============================================

gh issue create --repo $REPO \
  --title "Make validation debounce time configurable" \
  --body "## Description
The validation debounce time is hardcoded to 500ms in \`validateCommand.ts:16\`. Users should be able to configure this.

## Task
1. Add \`ditacraft.validationDebounce\` configuration option to \`package.json\`
2. Update \`validateCommand.ts\` to read from configuration
3. Add reasonable bounds (100-2000ms suggested)
4. Update README with new configuration option

## Configuration Schema
\`\`\`json
\"ditacraft.validationDebounce\": {
  \"type\": \"number\",
  \"default\": 500,
  \"minimum\": 100,
  \"maximum\": 2000,
  \"description\": \"Debounce time in milliseconds for real-time validation\"
}
\`\`\`

## Labels
enhancement, help wanted, configuration" \
  --label "enhancement" --label "help wanted"

gh issue create --repo $REPO \
  --title "Add tests for publish command" \
  --body "## Description
The publish command (\`publishCommand.ts\`) has zero test coverage. This is a critical feature that needs testing.

## Task
1. Create \`src/test/suite/publishCommand.test.ts\`
2. Mock DITA-OT wrapper for unit tests
3. Test scenarios:
   - Successful publish with valid file
   - Handle missing DITA-OT installation
   - Handle invalid input file
   - Handle publish failures
   - Verify correct arguments passed to DITA-OT

## Example Test Structure
\`\`\`typescript
suite('Publish Command Tests', () => {
  test('should publish to HTML5 with valid map', async () => {
    // Test implementation
  });

  test('should show error when DITA-OT not configured', async () => {
    // Test implementation
  });
});
\`\`\`

## Labels
testing, help wanted, high priority" \
  --label "testing" --label "help wanted"

gh issue create --repo $REPO \
  --title "Add tests for file creation commands" \
  --body "## Description
File creation commands (newTopic, newMap, newBookmap) have no test coverage.

## Task
1. Create \`src/test/suite/fileCreationCommands.test.ts\`
2. Test each command:
   - newTopicCommand (concept, task, reference types)
   - newMapCommand
   - newBookmapCommand
3. Verify created files have correct structure
4. Test error handling (invalid paths, permission errors)

## Labels
testing, help wanted" \
  --label "testing" --label "help wanted"

# ============================================
# Feature Requests (Future Milestones)
# ============================================

gh issue create --repo $REPO \
  --title "[Feature] Hover provider for key definitions" \
  --body "## Description
When hovering over a \`keyref\` or \`conkeyref\` attribute, show the key definition including its target file and any associated metadata.

## Expected Behavior
Hovering over \`keyref=\"product-name\"\` should show:
\`\`\`
Key: product-name
Target: common/product-info.dita
Defined in: root-map.ditamap:42
\`\`\`

## Implementation Notes
- Use VS Code's HoverProvider API
- Leverage existing KeySpaceResolver
- Show helpful info for undefined keys too

## Labels
enhancement, feature request, milestone: v0.5.0" \
  --label "enhancement" --label "feature request"

gh issue create --repo $REPO \
  --title "[Feature] Auto-complete key names" \
  --body "## Description
When typing in a \`keyref\` or \`conkeyref\` attribute, provide auto-completion suggestions from the current key space.

## Expected Behavior
1. User types \`keyref=\"prod\`
2. Completion popup shows:
   - product-name
   - product-version
   - product-family
3. Each suggestion shows the target file

## Implementation Notes
- Use VS Code's CompletionItemProvider API
- Trigger on typing inside keyref/conkeyref attributes
- Use KeySpaceResolver to get available keys

## Labels
enhancement, feature request, milestone: v0.5.0" \
  --label "enhancement" --label "feature request"

gh issue create --repo $REPO \
  --title "[Feature] DITA Explorer sidebar view" \
  --body "## Description
Add a tree view in the VS Code sidebar showing all DITA maps and their topic hierarchy.

## Expected Behavior
- Tree view under Explorer or custom view container
- Shows all .ditamap and .bookmap files in workspace
- Expandable to show topicref hierarchy
- Click to open topic
- Right-click for actions (validate, publish)
- Validation status badges

## Implementation Notes
- Use VS Code's TreeDataProvider API
- Parse maps to build tree structure
- Watch for file changes to update tree

## Mockup
\`\`\`
DITA MAPS
├── user-guide.ditamap
│   ├── getting-started.dita
│   ├── installation/
│   │   ├── windows.dita
│   │   └── linux.dita
│   └── configuration.dita
└── api-reference.ditamap
    └── ...
\`\`\`

## Labels
enhancement, feature request, milestone: v0.6.0" \
  --label "enhancement" --label "feature request"

gh issue create --repo $REPO \
  --title "[Feature] Complete WebView HTML5 preview" \
  --body "## Description
The current preview implementation is incomplete (TODO at previewCommand.ts:141). Need to implement a full WebView panel for HTML5 preview.

## Expected Behavior
- Split view with source on left, preview on right
- Auto-refresh on file save
- Scroll synchronization (optional)
- Theme support (light/dark)
- Zoom controls

## Current State
- HTML5 is generated to temp directory
- WebView panel not implemented

## Implementation Notes
- Use VS Code's WebviewPanel API
- Consider using a lightweight framework for the preview
- Support CSS customization

## Labels
enhancement, feature request, high priority, milestone: v0.4.0" \
  --label "enhancement" --label "feature request" --label "high priority"

echo ""
echo "Issues created successfully!"
echo "View at: https://github.com/$REPO/issues"
