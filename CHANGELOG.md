# Change Log

All notable changes to the "DitaCraft" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.1] - 2025-01-25

### Added
- **TypesXML DTD Validation**: Full DTD validation using TypesXML (pure TypeScript)
  - 100% W3C XML Conformance Test Suite compliance
  - OASIS XML Catalog support for DITA public identifier resolution
  - No native dependencies required (works on all platforms without compilation)
  - Detects invalid elements (e.g., `<p>` in `<map>`), missing required attributes, content model violations
  - Graceful fallback to built-in validation if TypesXML unavailable

- **Three Validation Engines**: Configurable validation with engine selection
  - **TypesXML** (default, recommended): Full DTD validation, pure TypeScript
  - **Built-in**: Lightweight content model checking without full DTD
  - **xmllint**: External validation using libxml2 (requires installation)

- **TypesXML Validator Tests**: 15 new tests for DTD validation
  - Valid document tests (concept, topic, map, task, reference)
  - Invalid document detection (`<p>` in map, `<ul>` in map, `<topicref>` in concept)
  - Missing required attribute detection (id on topic)
  - Malformed XML detection
  - Integration tests with DitaValidator

### Changed
- Default validation engine changed from `xmllint` to `typesxml`
- Validation architecture improved to avoid duplicate errors when using TypesXML
- Content model validation skipped when TypesXML active (DTD covers it)
- Structure validation skips id/title checks when TypesXML active (DTD covers it)
- Test count increased from 476 to 491 passing tests

### Dependencies
- Added `typesxml` (^1.17.0) - Pure TypeScript XML/DTD validation with OASIS catalog support
- Removed `node-libxml` - No longer needed (had native compilation issues)

### Documentation
- Updated README.md with TypesXML validation details
- Updated ROADMAP.md with TypesXML completion status
- Created `docs/TYPESXML-DTD-VALIDATION-STUDY.md` with implementation research

## [0.2.2] - 2025-11-17

### Added
- **Cross-Reference (xref) Support**: Full navigation support for `<xref>` elements
  - Navigate `<xref href="file.dita">` to target files
  - Support for `<xref href="file.dita#element">` with fragment identifiers
  - Navigate `<xref keyref="keyname">` via key space resolution
  - Same-file navigation with `<xref href="#element">`
  - Smart tooltip indicating "cross-reference" type
  - Automatic skipping of external HTTP/HTTPS URLs

- **Related Link Element Support**: Navigation for `<link>` elements in related-links sections
  - Navigate `<link href="file.dita"/>` to target files
  - Support for fragments: `<link href="file.dita#element"/>`
  - Same-file links with `<link href="#element"/>`
  - Smart tooltip indicating "related link" type

- **Same-File Element Navigation**: Scroll-to-element support for `#element_id` references
  - Clicking on `conref="#element_id"` scrolls to target element
  - Clicking on `xref href="#element_id"` scrolls to target element
  - Clicking on `link href="#element_id"` scrolls to target element
  - Supports `topic_id/element_id` path format
  - Visual highlight on target element (2-second fade)
  - Cursor positioned at element location
  - Warning message if element not found

- **Key Reference Diagnostics**: Warning messages for missing key references
  - Automatic detection of undefined `keyref` and `conkeyref` attributes
  - Warning markers in editor for unresolved keys
  - Debounced validation to avoid excessive checking
  - Helpful message: "Key not found in key space. Make sure it's defined in a root map."
  - Integration with VS Code Problems panel

- **Enhanced Attribute Parsing**: Tooltips show @scope, @format, @type, @linktext, and @rev
  - `@scope` displayed as `[scope: local/peer/external]`
  - `@format` displayed as `[format: dita/pdf/html]`
  - `@type` displayed as `[type: concept/task/reference]`
  - `@linktext` displayed as `Link text: "custom text"`
  - `@rev` displayed as `[rev: 2.0]` for revision/version tracking
  - All attributes extracted and combined in enhanced tooltips

- **Enhanced Test Coverage**: Added 85+ new test cases
  - Cross-reference (xref) detection tests
  - Link element detection tests
  - Same-file element navigation tests
  - Element ID finding tests
  - Command URI generation tests
  - Fragment identifier handling tests
  - HTTP URL skipping tests
  - Mixed reference type tests
  - Enhanced attribute parsing tests (@scope, @format, @type, @linktext, @rev)
  - **Edge case handling** (13 new tests):
    - Empty attribute values (conref="", keyref="", scope="", etc.)
    - Malformed fragment identifiers (##, very long IDs)
    - Special characters in paths (spaces, unicode, parentheses)
    - Variable syntax skipping (${variable}/file.dita)
    - Case variations in attribute values
    - Whitespace handling in attributes

- **Updated Documentation**: DITA Reference Coverage Analysis
  - Coverage increased from 36% to **100%** (13/13 reference types fully implemented)
  - Full DITA reference type coverage achieved
  - Comprehensive coverage matrix and implementation notes
  - Added edge case test coverage documentation

### Changed
- **Reference Type Coverage**: Now supports all 13 major DITA reference types
  - @conref, @conkeyref, @keyref, @href, @scope, @format, @type, @linktext, @rev
  - `<xref>`, `<link>`, #fragment (same-file), @id (element navigator)
  - Improved from 4/11 to 13/13 fully implemented reference types (100%)
  - Same-file navigation now uses VS Code commands for proper scrolling

## [0.2.1] - 2025-11-17

### Fixed
- **Windows DITA-OT Support**: Fixed execution of .bat and .cmd files on Windows
  - DITA-OT verification now works correctly by executing through cmd.exe
  - Publishing now works on Windows with proper batch file handling
  - Resolves "DITA-OT path set, but verification failed" error
- **Title Validation**: Improved validation to check title as first child of root element
  - Now correctly detects missing title element even if title exists in nested elements
  - Validates that `<title>` must be direct child of topic/concept/task/reference
  - Better pattern matching for root element attributes (handles any order)
- **CI/CD Improvements**: Added VSIX artifact build to GitHub Actions workflow
  - Automatically builds and uploads VSIX on every push
  - Artifact includes commit SHA for easy identification
  - 30-day retention for downloadable artifacts

## [0.2.0] - 2025-11-16

### Added
- **Full Key Space Resolution**: Complete DITA key resolution support
  - Automatic root map discovery from workspace folders
  - Key space building from map hierarchies (maps, submaps, bookmaps)
  - Resolution of `@keyref`, `@conkeyref`, and key-based references
  - Intelligent caching with 1-minute TTL for performance
  - File watcher integration with 300ms debouncing
  - LRU eviction for cache memory management

- **Content Reference Navigation**: Enhanced Ctrl+Click support
  - Navigate `@conref` attributes to referenced content
  - Support for `file.dita#element_id` and `file.dita#topic_id/element_id` formats
  - Automatic path resolution relative to current file
  - Tooltip differentiation for conref, conkeyref, and keyref links

- **Enterprise Security Features**: Production-ready security hardening
  - XXE (XML External Entity) neutralization to prevent injection attacks
  - Path traversal protection with workspace bounds validation
  - Command injection prevention using `execFile()` instead of `exec()`
  - Input validation for all file system operations

- **Performance Optimizations**: Async operations and caching
  - Async file operations using `fs.promises` API to prevent UI blocking
  - Pre-compiled regex patterns for faster parsing
  - Root map caching to avoid repeated expensive directory scans
  - Debounced cache invalidation for file system events
  - Eliminated duplicate file reads in validation pipeline

- **Comprehensive Test Suite**: 144+ tests covering all features
  - Key space resolution tests with complex map hierarchies
  - Security tests for path traversal and XXE protection
  - Content reference and key reference navigation tests
  - Async operation and caching behavior tests

### Changed
- Upgraded test coverage from 65+ to 144+ tests
- Improved error handling with proper type annotations
- Enhanced tooltip messages to indicate reference type
- Better handling of Thenable vs Promise in VS Code API

### Fixed
- Promise rejection handling with proper `.catch()` wrappers
- TypeScript unused variable errors with underscore prefix convention
- DTD validation test fixtures with proper XML declarations and required elements
- Test reference consistency (element IDs matching test expectations)

### Security
- Added `neutralizeXXE()` method to strip external entity declarations
- Added `isPathWithinWorkspace()` for path traversal prevention
- Replaced `exec()` with `execFile()` to prevent shell injection
- Added workspace bounds validation before file operations

## [0.1.2] - 2025-02-03

### Added
- **Smart Navigation**: Ctrl+Click navigation in DITA maps and bookmaps
  - Click on `href` attributes in `<topicref>` elements to open referenced files
  - Works with relative paths and handles fragment identifiers (#topic_id)
  - Visual link indicators (underlined hrefs)
  - Hover tooltip showing target filename
  - Seamless navigation between maps and topics
- **DTD-Based Validation**: Complete DITA 1.3 DTD validation support
  - Bundled DITA 1.3 DTD files for all document types (topic, concept, task, reference, map, bookmap, learning, etc.)
  - DTD catalog resolver with PUBLIC ID mapping and caching
  - Validates against actual DITA specifications for required elements and attributes
  - Accurate error reporting with line and column information
- **Real-Time Validation**: Enhanced validation behavior
  - Validation on file open, save, and document change
  - 500ms debouncing for changes to prevent excessive validation
  - Auto-validation toggle via settings
- **Auto-Detection**: Intelligent DITA file detection
  - By extension: `.dita`, `.ditamap`, `.bookmap`
  - By DOCTYPE: Recognizes DITA DOCTYPE declarations in `.xml` files
- **Comprehensive Test Suite**: 60+ tests covering all key features
  - DTD validation tests (resolution, caching, validation)
  - Real-time validation tests (open, save, change, debouncing)
  - Command and auto-detection tests
  - Link navigation tests (Ctrl+Click, path resolution, edge cases)
  - TEST-COVERAGE.md documentation

### Changed
- Enhanced README.md with comprehensive feature documentation
- Updated project structure documentation
- Improved validation engine architecture with DTD support

### Dependencies
- Added `@xmldom/xmldom` for DTD-aware XML parsing

## [0.1.1] - 2025-02-01

### Changed
- **Preview Keyboard Shortcut**: Changed from `Ctrl+Shift+P` / `Cmd+Shift+P` to `Ctrl+Shift+H` / `Cmd+Shift+H` to avoid conflict with VS Code's Command Palette
- **Performance**: Implemented esbuild bundling to reduce extension size from 157 files to 13 files (~44 KB)

### Fixed
- Fixed CI build by upgrading to Node.js 20 (resolves `File is not defined` error)
- Configured ESLint to allow unused parameters prefixed with underscore

## [0.1.0] - 2025-01-27

### Added
- **DITA Language Support**
  - Syntax highlighting for `.dita`, `.ditamap`, and `.bookmap` files
  - Language configuration for DITA files
  - TextMate grammar for DITA syntax

- **Code Snippets**
  - 21 comprehensive DITA code snippets
  - Full document templates (Topic, Concept, Task, Reference, Map, Bookmap)
  - Content elements (paragraphs, sections, lists, tables, etc.)
  - Special elements (images, cross-references, notes, etc.)

- **Validation Features**
  - Real-time DITA file validation
  - XML syntax validation with two engines (xmllint and built-in parser)
  - DITA-specific structure validation
  - Auto-validation on save (configurable)
  - Inline error highlighting with diagnostics

- **Publishing Features**
  - Direct DITA-OT integration
  - Multi-format publishing (HTML5, PDF, EPUB, XHTML, htmlhelp, markdown)
  - Format selection dialog
  - Quick HTML5 publish command
  - HTML5 preview in external browser
  - Progress tracking with visual indicators
  - Custom DITA-OT arguments support

- **File Creation Commands**
  - Create new DITA topics (Topic, Concept, Task, Reference)
  - Create new DITA maps
  - Create new DITA bookmaps
  - Pre-filled templates with proper DOCTYPE declarations

- **Configuration Options**
  - DITA-OT path configuration
  - Default output format selection
  - Custom output directory with variable support
  - Validation engine selection
  - Auto-validation toggle
  - Preview auto-refresh toggle
  - Progress notifications toggle
  - Log level configuration
  - File and console logging options

- **Commands** (13 total)
  - `DITA: Validate Current File` - Validate DITA syntax and structure
  - `DITA: Publish (Select Format)` - Publish with format selection dialog
  - `DITA: Publish to HTML5` - Quick publish to HTML5
  - `DITA: Preview HTML5` - Preview HTML5 output
  - `DITA: Create New Topic` - Create new DITA topic with type selection
  - `DITA: Create New Map` - Create new DITA map
  - `DITA: Create New Bookmap` - Create new DITA bookmap
  - `DITA: Configure DITA-OT Path` - Set DITA-OT installation path
  - `DITA: Show Log File Location` - View log file location
  - `DITA: Open Log File` - Open log file in editor
  - `DITA: Show Output Channel` - Display DitaCraft output channel
  - `DITA: Clear Output Channel` - Clear output channel content
  - `DITA: Test Logger (Debug)` - Test logging functionality

- **Editor Integration**
  - Editor title bar icons for quick access
  - Context menu integration for DITA files
  - Keyboard shortcuts (Ctrl+Shift+V for validate, Ctrl+Shift+B for publish, Ctrl+Shift+P for preview)
  - Command Palette integration with context-aware visibility

- **Logging System**
  - Comprehensive logging to file and console
  - Configurable log levels (debug, info, warn, error)
  - Automatic log rotation (keeps 7 days)
  - Structured logging with timestamps and context
  - Log file management commands

### Fixed
- **Critical Path Handling**
  - Fixed preview and publishing failures when file paths contain spaces (e.g., "Learn Rust/project")
  - Added proper quoting around file paths in DITA-OT command arguments
  - Resolves "Failed to parse input file" errors with paths containing spaces

- **DITA Validation Improvements**
  - Fixed `<title>` validation to be an error (required by DTD) instead of warning
  - Fixed `id` attribute validation to be an error (required by DTD) instead of warning
  - Added validation for empty title elements
  - Enhanced error messages to include actual file paths

- **DTD Validation Enhancements**
  - Added `--valid` flag for proper DTD validation with xmllint
  - Added `--nonet` flag to prevent network access during validation
  - Set working directory for correct relative DTD path resolution

- **File Path Validation**
  - Added directory detection and rejection with clear error messages
  - Added file extension validation
  - Added empty path checks
  - Prevents DITA-OT from receiving directory paths instead of file paths

- **Error Logging and Debugging**
  - Added comprehensive console logging throughout preview and publish workflows
  - Added verbose output capture from DITA-OT
  - Improved error capture and reporting with full command line details
  - Better error messages for troubleshooting

- **README Updates**
  - Removed broken image references to non-existent screenshot files
  - Added "Recent Updates" section documenting all bug fixes

### Technical Details
- Built with TypeScript 5.2.2
- Requires VS Code 1.80.0 or higher
- Cross-platform support (Windows, macOS, Linux)
- No external extension dependencies
- MIT License
- Tested with DITA-OT 4.1.1

### Known Limitations
- HTML5 preview opens in external browser (WebView panel planned for future release)
- Publish error details shown in popup only (output channel integration planned)
- DITA-OT must be installed separately

---

## [Unreleased]

### Planned Features
- WebView-based HTML5 preview panel
- Enhanced error reporting in output channel
- Map navigation tree view
- Topic relationship visualization
- Built-in DITA-OT installer
- Support for DITA 2.0 specifications
- Ditaval filter file support
- Subject scheme validation
- External key scope resolution
- Same-file element navigation (scroll to `#element_id`)

---

**Note:** This is the initial release of DitaCraft. Please report any issues or feature requests on [GitHub](https://github.com/jyjeanne/ditacraft/issues).
