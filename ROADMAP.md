# DitaCraft Roadmap

This document outlines the planned features, improvements, and future direction for DitaCraft. It's designed to help users and contributors understand where the project is heading and find opportunities to contribute.

## Current Status (v0.5.0)

DitaCraft is a production-ready VS Code extension for DITA editing and publishing with the following complete features:

| Feature | Status | Completeness |
|---------|--------|--------------|
| Syntax Highlighting | Complete | 100% |
| Smart Navigation (Ctrl+Click) | Complete | 100% |
| **TypesXML DTD Validation** | Complete | 100% |
| **Modular Validation Engines** | Complete | 100% |
| DTD Validation (DITA 1.3) | Complete | 100% |
| OASIS XML Catalog Support | Complete | 100% |
| Key Space Resolution | Complete | 95% |
| Real-time Validation | Complete | 100% |
| **Rate Limiting (DoS Protection)** | Complete | 100% |
| DITA-OT Publishing | Complete | 100% |
| Live HTML5 Preview | Complete | 100% |
| Preview Theme Support | Complete | 100% |
| Preview Custom CSS | Complete | 100% |
| Preview Scroll Sync | Complete | 100% |
| Preview Print Mode | Complete | 100% |
| DITA-OT Output Highlighting | Complete | 100% |
| DITA-OT Error Diagnostics | Complete | 100% |
| DITA Map Visualizer | Complete | 100% |
| Code Snippets (21) | Complete | 100% |
| Security (XXE, Path Traversal) | Complete | 100% |
| cSpell Integration | Complete | 100% |
| Dynamic Configuration | Complete | 100% |
| CI Security Audit | Complete | 100% |
| Error Handling Utilities | Complete | 100% |
| Code Coverage (c8) | Complete | 100% |
| Architecture Documentation | Complete | 100% |
| DITA User Guide | Complete | 100% |
| **LSP: Diagnostics** | Complete | 100% |
| **LSP: IntelliSense (Completion)** | Complete | 100% |
| **LSP: Hover Documentation** | Complete | 100% |
| **LSP: Document Symbols** | Complete | 100% |
| **LSP: Workspace Symbols** | Complete | 100% |
| **LSP: Go to Definition** | Complete | 100% |
| **LSP: Find References** | Complete | 100% |
| **LSP: Rename** | Complete | 100% |
| **LSP: Formatting** | Complete | 100% |
| **LSP: Code Actions** | Complete | 100% |
| **LSP: Linked Editing** | Complete | 100% |
| **LSP: Folding Ranges** | Complete | 100% |
| **LSP: Document Links** | Complete | 100% |
| **LSP: Key Space Resolution** | Complete | 100% |
| **DITAVAL Support** | Complete | 100% |
| **cSpell Auto-Prompt** | Complete | 100% |
| **Server Test Suite (190 tests)** | Complete | 100% |

### Recent Changes (v0.5.0)
- **DITA Language Server** - Full LSP implementation with 14 language features in a dedicated process
- **IntelliSense** - Context-aware element, attribute, and value completions (364 DITA elements)
- **DITAVAL Support** - Full IntelliSense, validation, and hover for `.ditaval` files (7 elements)
- **Hover Documentation** - Element docs from DITA schema with children fallback
- **Document & Workspace Symbols** - Hierarchical outline (Ctrl+Shift+O) and cross-file search (Ctrl+T)
- **Go to Definition** - Navigate href/conref/keyref/conkeyref with server-side key space resolution
- **Find References & Rename** - Cross-file ID reference search and rename with updates
- **Formatting** - Token-based XML formatter with inline/block/preformatted handling
- **Code Actions** - 5 quick fixes: missing DOCTYPE, missing ID, missing title, empty elements, duplicate IDs
- **Linked Editing** - Simultaneous open/close XML tag name editing with depth-aware nesting
- **Folding Ranges & Document Links** - Collapsible elements/comments/CDATA and clickable references
- **Key Space Resolution Fix** - Improved root map discovery (searches all the way to workspace root)
- **cSpell Auto-Prompt** - Suggests cSpell configuration setup when extension detected
- **cSpell Setup Fix** - Fixed path resolution bug in bundled extension
- **TypeScript Project References** - Proper multi-project TypeScript setup for client + server
- **Server Test Suite** - 190 standalone Mocha tests across 10 files (94.3% coverage)
- **CI Integration** - Server tests + type-checking in GitHub Actions (ci.yml + release.yml)
- **737+ Total Tests** - Client (547) + Server (190)

### Previous Changes (v0.4.2)
- **Modular Validation Engine** - Refactored to pluggable architecture with Strategy pattern
- **Rate Limiting** - DoS protection for validation (10 req/sec per file)
- **Architecture Documentation** - Comprehensive ARCHITECTURE.md with data flow diagrams
- **DITA User Guide** - Complete 55-file documentation in DITA format
- **547+ Tests** - Expanded test suite with security and edge case coverage

---

## Milestone 1: Developer Experience & Quality (v0.3.0) ✅ COMPLETE

**Focus:** Improve code quality, test coverage, and developer experience.

### Testing & CI/CD
- [x] Add code coverage reporting with c8 (nyc doesn't work with VS Code extensions)
- [x] Add coverage threshold enforcement (gradual: 62% lines, 65% functions, 73% branches)
- [x] Add security scanning (npm audit) to CI pipeline with weekly schedule
- [x] Test DITA-OT integration (currently untested)
- [x] Test publish/preview/file creation commands
- [x] Test cSpell setup command
- [x] Add Windows and macOS to CI test matrix
- [x] Add error handling utility tests (fireAndForget, getErrorMessage, tryAsync)

### Code Quality
- [x] Remove unused `xml2js` dependency
- [x] Consolidate file reading in validator (eliminate duplicate reads)
- [x] Create utility function for safe error message extraction
- [x] Standardize async/await patterns (remove Promise chains)

### Configuration Flexibility
- [x] Make validation debounce configurable (100-2000ms)
- [x] Make key space cache TTL configurable (1-30 minutes)
- [x] Make DITA-OT process timeout configurable (5-30 minutes)
- [x] Add `ditacraft.maxLinkMatches` setting (currently hardcoded at 10,000)
- [x] Implement dynamic configuration reloading (no extension reload required)
- [x] Add centralized ConfigurationManager with change notifications
- [x] Add dynamic auto-validate toggle (effective immediately)

### Navigation Improvements
- [x] Implement precise element navigation for same-file conref (`#element`)
- [x] Add element navigation for cross-file references with fragments
- [x] Support element navigation in xref and link elements

**Good First Issues:**
- ~~Remove `xml2js` from package.json~~ (Done)
- ~~Add npm audit to CI workflow~~ (Done)
- ~~Create error message utility function~~ (Done)

---

## Milestone 2: Enhanced Preview & Build Output (v0.4.0) ✅ COMPLETE

**Focus:** Complete the preview feature and enhance build output.

### WebView Preview ✅
- [x] Implement full WebView panel for HTML5 preview
- [x] Add preview synchronization (scroll sync between source and preview)
- [x] Add preview theme support (light/dark/auto)
- [x] Add print preview mode with print button
- [x] Support custom CSS for preview styling

### Output Panel Improvements ✅
- [x] Add syntax highlighting to DITA-OT output (LogOutputChannel)
- [x] Automatic log level detection (error, warn, info, debug, trace)
- [x] Parse errors and link back to source files
- [x] Add problem matcher for DITA-OT errors in Problems panel
- [x] Build timestamps and duration display

### Test Coverage ✅
- [x] 60+ tests for DitaOtOutputChannel (log level detection, patterns)
- [x] Tests for preview configuration settings
- [x] Tests for file creation commands (validate, generate content)
- [x] Tests for preview command (validateFilePath, findMainHtmlFile)
- [x] Rate limiter integration tests
- [x] Security and edge case tests
- [x] Total: 547+ passing tests

---

## Milestone 2.1: DITA Map Visualizer (v0.4.0) ✅ COMPLETE

**Focus:** Add visual tools for DITA map navigation.

### DITA Map Visualizer ✅
- [x] Create WebView showing visual hierarchy of maps and topics
- [x] Display topic relationships and references
- [x] Add interactive navigation from visualization to source
- [x] Show validation status on nodes (missing files highlighted)
- [x] Circular reference detection and warning
- [x] Element type icons (map, chapter, appendix, part, topic, key)
- [x] Expand/collapse all controls
- [x] Real-time refresh capability

---

## Milestone 3: IntelliSense & Content Assistance (v0.5.0) ✅ COMPLETE

**Focus:** Add intelligent editing features via a DITA Language Server (LSP).

### Language Server Foundation ✅
- [x] LSP server skeleton with JSON-RPC over IPC
- [x] Client wiring and capability negotiation
- [x] Server-side key space resolution with BFS, caching (TTL + LRU), debounced invalidation

### Diagnostics ✅
- [x] XML well-formedness validation (fast-xml-parser)
- [x] DITA structure validation (DOCTYPE, root element, ID, title, empty elements)
- [x] ID validation (duplicates, format, comment exclusion)
- [x] Map and bookmap validation

### Hover Provider ✅
- [x] Display element documentation from DITA schema on hover
- [x] Show children list for elements without full docs
- [x] Hover on opening and closing tag names

### Completion Provider ✅
- [x] Context-aware element completions (children of parent element)
- [x] Attribute completions (element-specific + common attributes)
- [x] Attribute value completions (enumerations from schema)
- [x] Snippet format with tab stops and closing tags

### Code Actions (Quick Fixes) ✅
- [x] Add missing DOCTYPE declaration (auto-detects root type)
- [x] Add missing ID to root element (derived from filename)
- [x] Add missing title element
- [x] Remove empty elements
- [x] Rename duplicate IDs to make unique

### Symbol Provider ✅
- [x] Document symbols - hierarchical outline with title extraction (Ctrl+Shift+O)
- [x] Workspace symbols - cross-file search with query matching (Ctrl+T)

### Navigation ✅
- [x] Go to definition for href/conref (same-file and cross-file)
- [x] Go to definition for keyref/conkeyref (via key space resolution)
- [x] Find references for element IDs across workspace
- [x] Cross-file rename with reference updates

### Editing Features ✅
- [x] XML formatting with inline/block/preformatted element handling
- [x] Linked editing ranges (simultaneous open/close tag name editing)
- [x] Folding ranges for elements, comments, and CDATA
- [x] Document links for href/conref/keyref with key resolution

### DITAVAL Support ✅
- [x] `.ditaval` language registration and LSP integration
- [x] 7 DITAVAL elements with IntelliSense, hover, and validation
- [x] DITAVAL-specific attributes (excludes DITA common attributes)
- [x] Root element validation (`<val>` required)

### Server Test Suite ✅
- [x] 190 standalone Mocha tests across 10 files (94.3% statement coverage)
- [x] No VS Code dependency (runs via `cd server && npm test`)
- [x] Integrated into GitHub Actions CI pipeline

---

## Milestone 4: Project Management & Views (v0.6.0) 🎯 NEXT

**Focus:** Add VS Code sidebar views for better project navigation.

### DITA Explorer View
- [ ] Tree view showing all DITA maps in workspace
- [ ] Expandable map hierarchy showing topic references
- [ ] Icons indicating topic types (concept, task, reference)
- [ ] Validation status badges (errors, warnings)
- [ ] Context menu actions (open, validate, publish)

### Key Space View
- [ ] List all defined keys with their targets
- [ ] Show key usage across documents
- [ ] Navigate to key definitions and usages
- [ ] Highlight undefined/unused keys

### Diagnostics View
- [ ] Centralized view of all DITA validation issues
- [ ] Filter by severity (error, warning, info)
- [ ] Group by file or by issue type
- [ ] Quick navigation to issue location

### Welcome View
- [ ] Show getting started actions when no DITA files open
- [ ] Quick links to create new topic/map/bookmap
- [ ] Link to documentation and tutorials

**Good First Issues:**
- Create basic tree view for DITA maps
- Add welcome view with quick actions

---

## Milestone 5: Advanced Validation & DTD Support (v0.7.0)

**Focus:** Expand validation capabilities and DTD support.

### Validation Architecture (Completed in v0.4.0)
- [x] TypesXML integration for pure TypeScript DTD validation
- [x] OASIS XML Catalog support for DITA public identifier resolution
- [x] 100% W3C XML Conformance Test Suite compliance
- [x] Three validation engines: TypesXML (default), built-in, xmllint

### Validation Architecture Improvements
- [ ] Add DITA-OT validation option ("piggy-back" approach for comprehensive validation)
- [ ] Allow external XML catalog configuration for users with custom DTDs
- [ ] Document validation architecture for transparency (see `docs/VALIDATION-SPECIFICATION.md`)
- [ ] Multi-layer validation: real-time (fast) → on-save (DTD) → deep (DITA-OT)

### Extended DTD Support
- [ ] Add DITA 1.2 DTD support
- [ ] Add DITA 2.0 DTD support (when stable)
- [ ] Support custom specializations
- [ ] Load DTD catalog from external file (configurable)
- [ ] Auto-detect DITA version from DOCTYPE

### Enhanced Validation
- [ ] Cross-file reference validation (broken links)
- [ ] Key scope validation (local/peer/external)
- [ ] Duplicate ID detection across topics
- [ ] DITAVAL filter validation
- [ ] Schematron rule support for custom validation
- [ ] Conref/keyref target validation

### Workspace-Level Analysis
- [ ] Validate entire workspace command
- [ ] Batch validation with progress reporting
- [ ] Validation report export (HTML, JSON)
- [ ] Unused topic detection
- [ ] Circular reference detection

**Good First Issues:**
- Add command to validate all DITA files in workspace
- Implement duplicate ID detection
- ~~Add external catalog configuration setting~~ (Done via TypesXML OASIS catalog)

---

## Milestone 6: Refactoring & Productivity (v0.8.0)

**Focus:** Add refactoring tools and productivity features.

### Refactoring Tools
- [ ] Rename key across all usages
- [ ] Rename element ID with reference updates
- [ ] Move topic with reference updates
- [ ] Extract topic from section
- [ ] Inline conref (replace reference with content)

### Templates & Scaffolding
- [ ] Custom topic templates
- [ ] Project initialization wizard
- [ ] Map scaffolding from outline
- [ ] Import from Markdown/HTML

### Productivity Features
- [ ] Multi-file find and replace (DITA-aware)
- [ ] Batch insert/update metadata
- [ ] Table editor (visual table manipulation)
- [ ] Image insertion with automatic figure wrapper

**Good First Issues:**
- Add custom template support for new topics
- Create simple table insertion command

---

## Milestone 7: Publishing Enhancements (v0.9.0)

**Focus:** Enhance publishing capabilities and workflow.

### Publishing Profiles
- [ ] Save and reuse publishing configurations
- [ ] Profile management UI
- [ ] Quick switch between profiles
- [ ] Share profiles via settings

### DITAVAL Integration
- [x] DITAVAL IntelliSense, validation, and hover (completed in v0.5.0)
- [ ] Visual condition editor
- [ ] Preview with conditions applied
- [ ] Condition highlighting in editor

### Build System Integration
- [ ] VS Code task definitions for DITA workflows
- [ ] Watch mode for continuous publishing
- [ ] Incremental publishing (only changed files)
- [ ] Custom DITA-OT plugin management

### Output Formats
- [ ] Markdown output support
- [ ] Custom transformation configurations
- [ ] Post-processing hooks
- [ ] Output comparison (diff between versions)

**Good First Issues:**
- ~~Add DITAVAL syntax highlighting~~ (Done in v0.5.0)
- Create publishing profile save/load

---

## Long-term Vision (v1.0.0+)

### AI-Powered Features
- [ ] AI-assisted content suggestions
- [ ] Automatic metadata generation
- [ ] Content quality scoring
- [ ] Translation assistance

### Performance
- [ ] Large workspace optimization (10,000+ files)
- [ ] Streaming validation for large documents
- [ ] Background indexing
- [ ] Memory usage optimization

### Ecosystem
- [ ] Plugin/extension API for custom features
- [ ] Theme marketplace for preview styles
- [ ] Community snippet library
- [ ] Integration with documentation platforms

---

## Contributing

We welcome contributions! Here's how to get started:

### Finding Work

1. **Good First Issues**: Look for issues labeled `good first issue`
2. **Help Wanted**: Check issues labeled `help wanted`
3. **Roadmap Items**: Pick unchecked items from milestones above
4. **Bug Fixes**: Check the [issues page](https://github.com/jyjeanne/ditacraft/issues)

### Contribution Guidelines

1. **Discuss First**: For large features, open an issue to discuss before implementing
2. **Follow Patterns**: Match existing code style and patterns
3. **Add Tests**: All new features should include tests
4. **Update Docs**: Update README/CHANGELOG as needed
5. **One PR Per Feature**: Keep pull requests focused

### Development Setup

```bash
git clone https://github.com/jyjeanne/ditacraft.git
cd ditacraft
npm install
npm run compile
# Press F5 in VS Code to run extension in debug mode
```

### Areas Needing Help

| Area | Difficulty | Skills Needed |
|------|------------|---------------|
| Test Coverage | Easy-Medium | TypeScript, Mocha |
| Documentation | Easy | Markdown, DITA knowledge |
| WebView Preview | Medium | TypeScript, HTML/CSS |
| IntelliSense Providers | Medium-Hard | VS Code API |
| DITA Explorer View | Medium | VS Code TreeView API |
| DTD Support | Hard | XML, DTD, DITA specifications |

---

## Feedback

Have ideas for features not listed here? We'd love to hear from you!

- **Feature Requests**: [Open an issue](https://github.com/jyjeanne/ditacraft/issues/new)
- **Discussions**: [GitHub Discussions](https://github.com/jyjeanne/ditacraft/discussions)
- **Questions**: Tag issues with `question` label

---

## Version History

| Version | Focus | Status |
|---------|-------|--------|
| v0.1.x | Initial release, basic features | Released |
| v0.2.x | Key space, navigation, security, CI security audit | Released |
| v0.3.0 | Developer experience & quality | Released |
| v0.4.0 | Preview, build output & Map Visualizer | Released |
| v0.4.1 | TypesXML DTD Validation | Released |
| v0.4.2 | Architecture, Rate Limiting, 547+ Tests | Released |
| v0.5.0 | LSP with 14 features, DITAVAL, 737+ Tests | **Current** |
| v0.6.0 | Project views & navigation | Next |
| v0.7.0 | Advanced validation & DTD | Planned |
| v0.8.0 | Refactoring & productivity | Planned |
| v0.9.0 | Publishing enhancements | Planned |

---

*Last updated: February 2026 (v0.5.0 with DITA Language Server, 14 LSP features, DITAVAL support, 190 server tests, 737+ total tests)*
