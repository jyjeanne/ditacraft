#!/bin/bash
# Create GitHub milestones for DitaCraft
# Prerequisites: gh CLI installed and authenticated (gh auth login)

REPO="jyjeanne/ditacraft"

echo "Creating milestones for $REPO..."

# Milestone 1: Developer Experience & Quality (v0.3.0)
gh api repos/$REPO/milestones -f title="v0.3.0 - Developer Experience & Quality" \
  -f description="Improve code quality, test coverage, and developer experience.

Key objectives:
- Add code coverage reporting with nyc/istanbul
- Test publish/preview/file creation commands
- Make hardcoded values configurable
- Remove unused dependencies
- Add Windows/macOS to CI test matrix" \
  -f state="open"

# Milestone 2: Enhanced Preview & Visualization (v0.4.0)
gh api repos/$REPO/milestones -f title="v0.4.0 - Enhanced Preview & Visualization" \
  -f description="Complete the preview feature and add visual tools for DITA navigation.

Key objectives:
- Implement full WebView panel for HTML5 preview
- Create DITA map visualizer
- Add preview synchronization
- Improve output panel with syntax highlighting" \
  -f state="open"

# Milestone 3: IntelliSense & Content Assistance (v0.5.0)
gh api repos/$REPO/milestones -f title="v0.5.0 - IntelliSense & Content Assistance" \
  -f description="Add intelligent editing features similar to professional DITA editors.

Key objectives:
- Hover provider for key definitions
- Auto-complete key names and file paths
- Code actions for quick fixes
- Symbol provider for document navigation" \
  -f state="open"

# Milestone 4: Project Management & Views (v0.6.0)
gh api repos/$REPO/milestones -f title="v0.6.0 - Project Management & Views" \
  -f description="Add VS Code sidebar views for better project navigation.

Key objectives:
- DITA Explorer tree view
- Key Space browser view
- Diagnostics view
- Welcome view with quick actions" \
  -f state="open"

# Milestone 5: Advanced Validation & DTD Support (v0.7.0)
gh api repos/$REPO/milestones -f title="v0.7.0 - Advanced Validation & DTD Support" \
  -f description="Expand validation capabilities and DTD support.

Key objectives:
- Add DITA 1.2 and 2.0 DTD support
- Cross-file reference validation
- Workspace-level batch validation
- Custom specialization support" \
  -f state="open"

# Milestone 6: Refactoring & Productivity (v0.8.0)
gh api repos/$REPO/milestones -f title="v0.8.0 - Refactoring & Productivity" \
  -f description="Add refactoring tools and productivity features.

Key objectives:
- Rename key across all usages
- Extract topic from section
- Custom topic templates
- Visual table editor" \
  -f state="open"

# Milestone 7: Publishing Enhancements (v0.9.0)
gh api repos/$REPO/milestones -f title="v0.9.0 - Publishing Enhancements" \
  -f description="Enhance publishing capabilities and workflow.

Key objectives:
- Publishing profiles (save/reuse configurations)
- DITAVAL integration and visual editor
- VS Code task definitions
- Incremental publishing" \
  -f state="open"

echo "Milestones created successfully!"
echo "View at: https://github.com/$REPO/milestones"
