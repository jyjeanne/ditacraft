# Change Log

All notable changes to the "DitaCraft" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- DITA content key resolution
- Conref validation and navigation
- Map navigation tree view
- Topic relationship visualization
- Built-in DITA-OT installer
- Support for DITA 1.3 and 2.0 specifications
- Ditaval filter file support
- Subject scheme validation

---

**Note:** This is the initial release of DitaCraft. Please report any issues or feature requests on [GitHub](https://github.com/jyjeanne/ditacraft/issues).
