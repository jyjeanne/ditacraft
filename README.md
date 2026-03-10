# DitaCraft

<p align="center">
  <img src="docs/user-guide/front_page_picture.png" alt="DitaCraft - A Beginner-Friendly VS Code Extension for DITA Authoring and Publishing" width="360" />
</p>

**The easiest way to edit and publish your DITA files**

[![VS Code](https://img.shields.io/badge/VS%20Code-1.80+-blue.svg)](https://code.visualstudio.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![CI](https://github.com/jyjeanne/ditacraft/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/jyjeanne/ditacraft/actions/workflows/ci.yml)

DitaCraft is a comprehensive Visual Studio Code extension for editing and publishing DITA (Darwin Information Typing Architecture) content. It provides syntax highlighting, validation, and seamless integration with DITA-OT for multi-format publishing.

## Highlights

🔗 **Smart Navigation** - Ctrl+Click on `href`, `conref`, `keyref`, and `conkeyref` attributes with full key space resolution
🔑 **Key Space Resolution** - Automatic or explicit root map selection with key scope support
✅ **Multi-Layer Validation** - DTD (TypesXML) + optional RelaxNG (salve-annos) + 35 DITA rules with DITA 1.2/1.3/2.0 support
🌍 **Localized Diagnostics** - All 76+ diagnostic messages translatable (English + French included)
⚡ **Real-time Validation** - Smart debouncing (300ms topics, 1000ms maps) with per-document cancellation
🔒 **Enterprise Security** - Path traversal protection, XXE neutralization, and command injection prevention
🚀 **One-Click Publishing** - Direct DITA-OT integration for HTML5, PDF, EPUB, and more
👁️ **Live Preview** - Side-by-side HTML5 preview with auto-refresh and bidirectional scroll sync
🗺️ **Map Visualizer** - Interactive tree view of DITA map hierarchies with navigation
📂 **Activity Bar Views** - DITA Explorer, Key Space, and Diagnostics views in dedicated sidebar
📝 **21 Smart Snippets** - Comprehensive DITA code snippets for rapid editing
🛡️ **Rate Limiting** - Built-in DoS protection for validation operations
🧪 **1084+ Tests** - Extensively tested with comprehensive integration, security, and LSP server tests
📚 **DITA User Guide** - Comprehensive documentation written in DITA (55 files, bookmap structure)

## Features

### 🖥️ **Language Server Protocol (LSP)**
- Full-featured DITA Language Server running in a separate process for performance
- **IntelliSense**: Context-aware element, attribute, and value completions with subject scheme hierarchy grouping
- **Hover**: Element documentation tooltips from DITA schema with conref content preview
- **Document Symbols**: Hierarchical outline view (Ctrl+Shift+O)
- **Workspace Symbols**: Cross-file symbol search (Ctrl+T)
- **Go to Definition**: Navigate to href/conref/keyref targets with key space resolution
- **Find References**: Locate all usages of an element ID across files
- **Rename**: Rename IDs with automatic reference updates across workspace
- **Formatting**: XML document formatting with inline/block/preformatted handling
- **Code Actions**: Quick fixes for missing DOCTYPE, missing ID, missing title, empty elements, duplicate IDs, missing otherrole, deprecated indextermref, alt attribute conversion, missing alt text
- **Linked Editing**: Simultaneous open/close XML tag name editing
- **Folding Ranges**: Collapse XML elements, comments, and CDATA blocks
- **Document Links**: Clickable href/conref/keyref links with key resolution
- **Diagnostics**: XML well-formedness, DITA structure, ID, cross-reference, scope consistency, circular reference detection, DITA rules (35 Schematron-equivalent rules including DITA 2.0), profiling/subject scheme, DTD (OASIS catalog with DITA 1.2/1.3/2.0), optional RelaxNG, workspace-level analysis, and DITAVAL validation
- **Localization**: All diagnostic messages translatable via i18n system (English + French)

### 📝 **DITA Editing**
- Syntax highlighting for `.dita`, `.ditamap`, `.bookmap`, and `.ditaval` files
- Intelligent code snippets and auto-completion (21 comprehensive snippets)
- Support for all DITA topic types (concept, task, reference, topic, glossentry)

### 🔗 **Smart Navigation**
- **Ctrl+Click navigation** in DITA maps, bookmaps, and topics
  - Click on `href` attributes in `<topicref>` elements to open referenced files
  - Click on `conref` attributes to navigate to content references
  - Click on `keyref` and `conkeyref` to navigate to key-defined targets
  - Works with relative paths and handles fragment identifiers (e.g., `file.dita#topic_id`)
  - Visual link indicators (underlined references when you hover)
  - Hover tooltip showing target filename and reference type
  - Automatically resolves paths relative to the map file location
  - Skips external URLs (http://, https://) - they won't be underlined
- **Full Key Space Resolution** (NEW in v0.2.0)
  - Automatically discovers root maps in your workspace
  - Builds and caches key space from map hierarchies
  - Resolves `@keyref`, `@conkeyref`, and key-based references
  - Handles submaps, nested maps, and complex key definitions
  - 1-minute cache TTL with intelligent invalidation
- Navigate seamlessly between maps and topics in your documentation structure
- **How to use:**
  1. Open a `.ditamap`, `.bookmap`, or `.dita` file
  2. Hover over any `href`, `conref`, `keyref`, or `conkeyref` value - it will be underlined
  3. Ctrl+Click (Windows/Linux) or Cmd+Click (Mac) to open the target file
  4. Works with nested topicrefs, key definitions, and complex map structures

### ✅ **Advanced Validation**
- **Real-time validation** on file open, save, and change with smart debouncing (300ms topics, 1000ms maps)
- **Full DTD validation** against DITA 1.2, 1.3, and 2.0 specifications using TypesXML
  - Bundled DTDs for all three DITA versions (topic, concept, task, reference, map, bookmap, learning, etc.)
  - Master OASIS XML Catalog with `<nextCatalog>` chaining — auto-resolves PUBLIC IDs for any DITA version
  - Custom XML catalog support (`ditacraft.xmlCatalogPath`) for DTD specializations
  - Parser pool (3 concurrent instances) for efficient reuse
  - 100% W3C XML Conformance Test Suite compliance
- **Optional RelaxNG validation** using salve-annos + saxes
  - Schema compilation with caching (max 20 grammars, JSON cache files)
  - Root element to RNG schema auto-mapping (10 DITA element types)
  - Configurable schema directory path
- **35 DITA rules** (Schematron-equivalent) with DITA version awareness
  - 4 mandatory rules, 7 recommendation rules, 2 authoring rules, 8 accessibility rules
  - 10 DITA 2.0 removal/migration rules (deprecated elements and attributes)
  - Version-gated: rules apply only to relevant DITA versions
  - Precise attribute-level diagnostic highlighting
- **Three validation engines**:
  - **TypesXML** (default, recommended) - Pure TypeScript DTD validation with no native dependencies
  - Built-in parser with content model checking (lightweight, no full DTD)
  - xmllint integration for external validation (requires libxml2 installation)
- **DITA version detection**: Auto-detects from `@DITAArchVersion` attribute or DOCTYPE declaration
- **Scope validation**: Validates `scope="local|peer|external"` consistency with href format (DITA-SCOPE-001/002/003)
- **Circular reference detection**: Detects href/conref/mapref cycles using DFS traversal (DITA-CYCLE-001)
- **Workspace-level analysis**:
  - `DITA: Validate Workspace` command with progress reporting
  - Cross-file duplicate root ID detection (DITA-ID-003)
  - Unused topic detection — finds topics not referenced by any map (DITA-ORPHAN-001)
- **Enterprise Security Features**:
  - XXE (XML External Entity) neutralization to prevent injection attacks
  - Path traversal protection with workspace bounds validation
  - Command injection prevention using safe execution methods
  - Async file operations to prevent UI blocking
- **Intelligent error highlighting**:
  - Inline error highlighting with squiggly underlines
  - Errors appear in Problems panel with severity indicators
  - Accurate line and column positioning
  - Source attribution (DTD validator, XML parser, DITA validator, dita-rules)
- **Auto-detection of DITA files**:
  - By extension: `.dita`, `.ditamap`, `.bookmap`, `.ditaval`
  - By DOCTYPE: Recognizes DITA DOCTYPE declarations in `.xml` files
- **Manual validation command**: `DITA: Validate Current File` (Ctrl+Shift+V / Cmd+Shift+V)

### 🚀 **One-Click Publishing**
- Publish to multiple formats: HTML5, PDF, EPUB, and more
- Direct integration with DITA Open Toolkit (DITA-OT)
- Real-time progress tracking with visual indicators
- Smart caching for faster preview generation

### 👁️ **Live Preview**
- Side-by-side HTML5 preview with WebView panel
- Auto-refresh on save with configurable behavior
- **Bidirectional scroll sync** - Editor and preview scroll positions stay synchronized
- **Theme support** - Light, dark, and auto modes (follows VS Code theme)
- **Custom CSS** - Apply custom stylesheets to preview
- **Print preview mode** - Print-optimized view with dedicated print button
- Navigate directly from source to preview

### 📊 **Build Output**
- **Syntax-highlighted output** - DITA-OT build output with automatic colorization
- **Log level detection** - Errors, warnings, info, and debug messages color-coded
- **Error diagnostics** - Build errors parsed and shown in Problems panel
- **Timestamped builds** - Build start and completion times displayed

### 📂 **Activity Bar Views**
- **DitaCraft sidebar** in the Activity Bar with three dedicated tree views
- **DITA Explorer** — All workspace maps with expandable hierarchy, type icons, click-to-open navigation
- **Key Space View** — Defined, undefined, and unused keys with usage locations and key scope support
- **Diagnostics View** — Aggregated DITA issues, group by file or severity, click-to-navigate
- **Root Map Selector** — Status bar indicator with click-to-set, auto-discover or explicit mode
- **File decorations** — Error/warning badges on tree items from validation diagnostics
- **Welcome content** — Helpful actions shown when views are empty
- Auto-refresh on file and diagnostics changes with debouncing

### 🗺️ **Map Visualizer**
- **Interactive tree view** - Visual hierarchy of DITA maps, bookmaps, and topics
- **Element type icons** - Different icons for maps, chapters, appendices, parts, topics, and keys
- **Missing file detection** - Missing referenced files shown with strikethrough styling
- **Circular reference protection** - Detects and marks circular map references
- **Double-click navigation** - Open any topic or map directly from the visualizer
- **Expand/Collapse controls** - Easily navigate large map hierarchies
- **Real-time refresh** - Update the visualization when map content changes

### 🎯 **Quick File Creation**
- Create DITA topics from templates (concept, task, reference)
- Generate DITA maps and bookmaps with proper structure
- Pre-filled DOCTYPE declarations and valid XML structure

### ⚙️ **Flexible Configuration**
- Configure DITA-OT installation path
- Customize output formats and directories
- Add custom DITA-OT arguments and filters
- Choose validation engine (xmllint or built-in)

## Installation

### From VS Code Marketplace
1. Open VS Code
2. Press `Ctrl+P` / `Cmd+P`
3. Type `ext install ditacraft`
4. Press Enter

### From VSIX
1. Download the latest `.vsix` file from [Releases](https://github.com/jyjeanne/ditacraft/releases)
2. Open VS Code
3. Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
4. Click `...` menu → "Install from VSIX..."
5. Select the downloaded file

### Local Installation for Development

If you want to install the plugin locally from source code for development or testing:

#### Step 1: Prerequisites
Ensure you have the following installed:
- **Node.js** 18.x or 20.x ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **VS Code** 1.80 or higher
- **Git** (optional, for cloning)

#### Step 2: Get the Source Code
```bash
# Clone the repository (or download ZIP from GitHub)
git clone https://github.com/jyjeanne/ditacraft.git
cd ditacraft

# OR if you downloaded as ZIP:
# Extract the ZIP file and navigate to the extracted folder
cd DitaCraft
```

#### Step 3: Install Dependencies
```bash
npm install
```
This will install all required npm packages (~429 packages).

#### Step 4: Compile TypeScript
```bash
npm run compile
```
This compiles the TypeScript source code to JavaScript in the `out/` directory.

#### Step 5: Package the Extension
```bash
npm run package
```
This creates a `.vsix` file in the project root (e.g., `ditacraft-0.1.0.vsix`).

**Note:** If you don't have `vsce` installed, install it first:
```bash
npm install -g @vscode/vsce
```

#### Step 6: Install in VS Code
**Option A: Install from VSIX**
1. Open VS Code
2. Press `Ctrl+Shift+X` (or `Cmd+Shift+X` on macOS) to open Extensions
3. Click the `...` menu at the top right
4. Select "Install from VSIX..."
5. Navigate to your project folder
6. Select the `ditacraft-0.1.0.vsix` file
7. Click "Install"
8. Reload VS Code when prompted

**Option B: Run in Development Mode** (Recommended for testing)
1. Open the `ditacraft` folder in VS Code
2. Press `F5` (or Run → Start Debugging)
3. A new VS Code window opens with the extension loaded
4. Test the extension in this window
5. Make changes to code, save, and press `Ctrl+R` in the Extension Host window to reload

#### Step 7: Verify Installation
1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Type "DITA" - you should see all DitaCraft commands
3. Try creating a new topic: "DITA: Create New Topic"

#### Step 8: Configure DITA-OT (Optional, for publishing)
1. Download DITA-OT from https://www.dita-ot.org/download
2. Extract to a location (e.g., `C:\DITA-OT-4.2.1`)
3. In VS Code, run "DITA: Configure DITA-OT Path"
4. Select your DITA-OT installation directory

### Troubleshooting Local Installation

#### Issue: `npm install` fails
**Solution:**
- Check Node.js version: `node --version` (should be 18.x or 20.x)
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`, then run `npm install` again

#### Issue: Compilation errors
**Solution:**
- Ensure TypeScript is installed: `npm install -g typescript`
- Check for syntax errors in `.ts` files
- Run `npm run lint` to check for code issues

#### Issue: Extension not appearing in VS Code
**Solution:**
- Verify the `.vsix` file was created successfully
- Check VS Code version is 1.80 or higher
- Try uninstalling any existing version first
- Restart VS Code completely

#### Issue: "Cannot find module" errors
**Solution:**
- Run `npm install` again
- Check that `node_modules` directory exists
- Verify `package.json` has all dependencies

### Development Workflow

For active development on the extension:

```bash
# Terminal 1: Watch mode (auto-compile on changes)
npm run watch

# Terminal 2: Run extension in debug mode
# Press F5 in VS Code (or Run → Start Debugging)
```

**Making Changes:**
1. Edit TypeScript files in `src/`
2. Watch mode auto-compiles to `out/`
3. In Extension Host window, press `Ctrl+R` (or `Cmd+R`) to reload
4. Test your changes

**Running Tests:**
```bash
npm test
```

**Linting Code:**
```bash
npm run lint
```

## Prerequisites

### Required
- **VS Code** 1.80 or higher
- **Node.js** 18.x or 20.x (for development)

### For Publishing
- **DITA-OT** 4.2.1 or higher ([Download](https://www.dita-ot.org/download))

### For Alternative Validation (Optional)
- **xmllint** (libxml2) for external XML validation (TypesXML is the default and recommended engine)

## Quick Start

### 1. Install DITA-OT
Download and install DITA-OT from https://www.dita-ot.org/download

### 2. Configure DitaCraft
1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Type "DITA: Configure DITA-OT Path"
3. Select your DITA-OT installation directory

### 3. Create Your First DITA File
1. Open Command Palette
2. Type "DITA: Create New Topic"
3. Select topic type (concept, task, reference)
4. Enter file name

### 4. Publish
1. Open your `.dita`, `.ditamap`, or `.bookmap` file
2. Press `Ctrl+Shift+B` / `Cmd+Shift+B`
3. Select output format (HTML5, PDF, etc.)
4. View published content

## Commands

All commands are accessible via Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

| Command | Shortcut | Description |
|---------|----------|-------------|
| **DITA: Validate Current File** | `Ctrl+Shift+V` | Validate DITA syntax and structure |
| **DITA: Publish (Select Format)** | `Ctrl+Shift+B` | Publish with format selection |
| **DITA: Publish to HTML5** | - | Quick publish to HTML5 |
| **DITA: Preview HTML5** | `Ctrl+Shift+H` | Show live HTML5 preview |
| **DITA: Show Map Visualizer** | - | Show interactive map hierarchy |
| **DITA: Create New Topic** | - | Create new DITA topic |
| **DITA: Create New Map** | - | Create new DITA map |
| **DITA: Create New Bookmap** | - | Create new bookmap |
| **DITA: Configure DITA-OT Path** | - | Set DITA-OT installation path |
| **DITA: Set Root Map** | - | Choose explicit root map for key resolution |
| **DITA: Clear Root Map** | - | Revert to automatic root map discovery |
| **DITA: Validate Workspace** | - | Validate all DITA files across workspace |
| **DITA: Setup cSpell Configuration** | - | Create cSpell config for DITA files |

## Spell Checking with cSpell

DitaCraft includes a pre-configured cSpell configuration with comprehensive DITA vocabulary to prevent false "unknown word" errors when using spell checkers.

### Setup cSpell

**Option 1: Automatic Setup (Recommended)**
1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Type "DITA: Setup cSpell Configuration"
3. Click the command
4. DitaCraft will create a `.cspellrc.json` file in your workspace root with all DITA terminology pre-configured

**Option 2: Manual Setup**
1. Copy the template `.cspellrc.json` from the DitaCraft project repository
2. Place it in your workspace root folder
3. The configuration includes:
   - All DITA 1.3 elements (topic, titlealts, topicref, etc.)
   - Common DITA attributes (href, conref, keyref, format, scope, etc.)
   - Publishing terms (ditamap, bookmap, ditaval, etc.)
   - Specialized configurations for `.dita`, `.ditamap`, `.bookmap`, and `.ditaval` files

### Why cSpell Configuration?

DITA includes many technical terms and element names (like `titlealts`, `conref`, `keyref`) that aren't recognized by standard spell checkers. The pre-configured `.cspellrc.json` prevents false "unknown word" warnings for these legitimate DITA terms while still catching actual spelling errors in your documentation content.

### What's Included in the Configuration

The default cSpell configuration includes:
- **DITA elements**: topic, concept, task, reference, figure, table, section, and 100+ more
- **DITA attributes**: href, conref, keyref, conkeyref, format, scope, type, and more
- **Map elements**: ditamap, topicref, mapref, keydef, reltable, and more
- **Bookmap elements**: chapter, part, appendix, frontmatter, backmatter, and more
- **Learning elements**: learningBase, learningObject, learningContent, and more
- **Specialized terms**: ditaarch, xmlns, OASIS standards, and DITA-OT related terms

## Configuration

### Basic Settings

```json
{
    "ditacraft.ditaOtPath": "C:\\DITA-OT-4.2.1",
    "ditacraft.defaultTranstype": "html5",
    "ditacraft.outputDirectory": "${workspaceFolder}/out"
}
```

### All Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `ditacraft.ditaOtPath` | string | `""` | DITA-OT installation path |
| `ditacraft.defaultTranstype` | string | `"html5"` | Default output format |
| `ditacraft.outputDirectory` | string | `"${workspaceFolder}/out"` | Output directory |
| `ditacraft.autoValidate` | boolean | `true` | Auto-validate on save |
| `ditacraft.previewAutoRefresh` | boolean | `true` | Auto-refresh preview |
| `ditacraft.previewScrollSync` | boolean | `true` | Bidirectional scroll sync |
| `ditacraft.previewTheme` | string | `"auto"` | Preview theme (auto/light/dark) |
| `ditacraft.previewCustomCss` | string | `""` | Custom CSS for preview |
| `ditacraft.showProgressNotifications` | boolean | `true` | Show progress notifications |
| `ditacraft.validationEngine` | string | `"built-in"` | Validation engine (built-in/typesxml/xmllint) |
| `ditacraft.ditaOtArgs` | array | `[]` | Custom DITA-OT arguments |
| `ditacraft.enableSnippets` | boolean | `true` | Enable code snippets |
| `ditacraft.maxNumberOfProblems` | number | `100` | Maximum diagnostics per file |
| `ditacraft.ditaRulesEnabled` | boolean | `true` | Enable Schematron-equivalent DITA rules |
| `ditacraft.ditaRulesCategories` | string[] | all | Rule categories to activate (mandatory, recommendation, authoring, accessibility) |
| `ditacraft.crossRefValidationEnabled` | boolean | `true` | Validate cross-file references (href, conref, keyref) |
| `ditacraft.subjectSchemeValidationEnabled` | boolean | `true` | Validate attribute values against subject schemes |
| `ditacraft.rootMap` | string | `""` | Explicit root map path (relative to workspace). Empty = auto-discover |
| `ditacraft.xmlCatalogPath` | string | `""` | Path to external XML catalog for custom DTD specializations |

📖 **[Full Configuration Guide](CONFIGURATION.md)**

## Supported Output Formats

DitaCraft supports all DITA-OT transtypes:

- **HTML5** - Modern responsive HTML
- **PDF** - PDF via Apache FOP
- **XHTML** - XHTML output
- **EPUB** - EPUB3 e-books
- **HTML Help** - Windows CHM files
- **Markdown** - Markdown conversion

Additional formats available through DITA-OT plugins.

## Workflows

### Navigating Your Documentation Structure

1. Open a `.ditamap` or `.bookmap` file
2. **Ctrl+Click** (Cmd+Click on Mac) on any `href` attribute value in `<topicref>` elements
3. The referenced topic file opens in a new tab
4. Navigate back and forth between map and topics seamlessly

**Example:**
```xml
<map>
    <topicref href="introduction.dita"/>     <!-- Ctrl+Click opens introduction.dita -->
    <topicref href="chapters/ch1.dita"/>     <!-- Works with relative paths -->
    <topicref href="overview.dita#intro"/>   <!-- Handles fragment IDs -->
</map>
```

### Publishing a Book

1. Create bookmap: `DITA: Create New Bookmap`
2. Create chapters: `DITA: Create New Topic` (multiple times)
3. Edit bookmap to reference chapters
4. Use **Ctrl+Click navigation** to quickly jump between bookmap and chapter files
5. Validate: `Ctrl+Shift+V`
6. Publish: `Ctrl+Shift+B` → Select format
7. Open output folder

### Previewing Changes

1. Open `.dita` file
2. Make edits
3. Press `Ctrl+Shift+H` to preview
4. Preview auto-refreshes on save
5. Toggle between source and preview

### Using Filters (DITAVAL)

```json
{
    "ditacraft.ditaOtArgs": [
        "--filter=filters/product-a.ditaval"
    ]
}
```

## Development

### Building from Source

```bash
# Clone repository
git clone https://github.com/jyjeanne/ditacraft.git
cd ditacraft

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Run tests
npm test

# Package extension
npm run package
```

### Project Structure

```
ditacraft/
├── src/                         # Client-side extension code
│   ├── extension.ts             # Entry point
│   ├── commands/                # Command handlers
│   ├── providers/               # Tree views, validation, link & decoration providers
│   ├── utils/                   # Utilities (DITA-OT, key space, map parser, rate limiter)
│   └── test/                    # Client test suites (620+ tests)
├── server/                      # LSP Language Server (separate process)
│   ├── src/
│   │   ├── server.ts            # Server entry point & capability registration
│   │   ├── features/            # LSP feature handlers
│   │   │   ├── validation.ts    # Diagnostics (XML, DITA structure, IDs)
│   │   │   ├── completion.ts    # IntelliSense completions
│   │   │   ├── hover.ts         # Hover documentation
│   │   │   ├── symbols.ts       # Document & workspace symbols
│   │   │   ├── definition.ts    # Go to definition
│   │   │   ├── references.ts    # Find references
│   │   │   ├── rename.ts        # Rename with reference updates
│   │   │   ├── formatting.ts    # XML formatting
│   │   │   ├── codeActions.ts   # Quick fixes (9 actions)
│   │   │   ├── linkedEditing.ts # Tag name sync editing
│   │   │   ├── folding.ts       # Folding ranges
│   │   │   ├── documentLinks.ts # Clickable links
│   │   │   ├── crossRefValidation.ts    # Cross-file reference + scope validation
│   │   │   ├── circularRefDetection.ts  # Circular reference detection (DFS)
│   │   │   ├── workspaceValidation.ts   # Cross-file duplicate IDs, unused topics
│   │   │   ├── ditaRulesValidator.ts    # 35 Schematron-equivalent DITA rules (incl. DITA 2.0)
│   │   │   └── profilingValidation.ts   # Subject scheme controlled values
│   │   ├── services/            # Key space, subject scheme, catalog & RNG validation services
│   │   ├── utils/               # XML tokenizer, reference parser, workspace scanner, version detector, i18n
│   │   ├── messages/            # Localization bundles (en.json, fr.json — 76+ message keys)
│   │   └── data/                # DITA schema & specialization data (@class matching)
│   └── test/                    # Server test suites (432 tests)
├── dtds/                        # DITA 1.2, 1.3, and 2.0 DTD files (master catalog)
├── docs/                        # Documentation
│   ├── architecture.puml        # Architecture diagram (PlantUML)
│   └── user-guide/              # DITA user guide (55 files, bookmap structure)
├── ARCHITECTURE.md
├── DITA_LSP_ARCHITECTURE.md     # LSP server architecture documentation
├── ROADMAP.md
├── TEST_PLAN.md                 # LSP feature test plan
└── CHANGELOG.md
```

### Quality & Testing

DitaCraft includes comprehensive test coverage across client and server:

**Client Tests (620+ tests):**
- DTD validation, real-time validation, command & auto-detection
- Link navigation with key resolution, key space building & caching
- Security (path traversal, XXE protection), rate limiting
- Preview, file creation, configuration integration
- Activity bar views: DITA Explorer, Key Space, Diagnostics, file decorations
- Map hierarchy parser (25 tests)

**LSP Server Tests (432 tests):**
- Reference parser (40 tests) - all 6 exported parsing functions
- XML tokenizer (18 tests) - state machine, error recovery, CRLF, context detection
- XML formatting (20 tests) - indentation, inline, preformatted, edge cases
- Folding ranges (10 tests) - elements, comments, CDATA, CRLF
- Workspace scanner (8 tests) - offset-to-position conversion
- Validation diagnostics (30 tests) - XML, DITA structure, IDs, maps, DITAVAL
- Completions (19 tests) - element, attribute, value, DITAVAL, subject scheme completions
- Hover (17 tests) - documentation, fallback, non-tag, DITAVAL, conref preview
- Document symbols (13 tests) - outline, titles, maps, self-closing
- Workspace symbols (8 tests) - cross-file search, in-memory preference
- Code actions (14 tests) - all 9 quick fixes + edge cases
- Linked editing (15 tests) - tag pairing, nesting, boundaries
- Cross-reference validation - href, conref, keyref target validation
- DITA rules validator - 35 Schematron-equivalent rules (5 categories incl. DITA 2.0)
- Profiling validation - subject scheme controlled value checks
- Subject scheme service - parsing, caching, hierarchy, value constraints
- DITA specialization - @class matching, topic/map type names, utility functions
- DITA version detector - version detection from content (1.0-2.0)

**Running Tests:**
```bash
# Run client tests (requires VS Code)
npm test

# Run server tests (standalone, no VS Code needed)
cd server && npm test

# Compile everything
npm run compile
```

## Known Limitations

### Smart Navigation (v0.2.0)

The current implementation provides comprehensive navigation support. Minor limitations include:

1. **Same-file Content References (`@conref` with `#`)** - e.g., `<ph conref="#v4.3/summary"/>`
   - References starting with `#` point to elements within the same file
   - Currently opens the file but doesn't scroll to the specific element

2. **Conditional Key Definitions**
   - Keys with DITAVAL conditions may not be resolved correctly
   - The key space builder uses the first definition found

3. **External Key Scopes**
   - Keys defined in external key scopes are not yet supported
   - Limited to keys within the workspace

**What now works (NEW in v0.2.0):**
- ✅ `href="path/to/file.dita"` - Direct file paths
- ✅ `href="file.dita#topic_id"` - File paths with fragment identifiers
- ✅ `conref="file.dita#element_id"` - Content references
- ✅ `keyref="key-name"` - Key references resolved via key space
- ✅ `conkeyref="key-name/element"` - Content key references
- ✅ Automatic root map discovery and key space building
- ✅ Intelligent caching with 1-minute TTL
- ✅ File watcher debouncing (300ms) for performance

### Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Add tests for new features
5. Ensure all tests pass (`npm test`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Troubleshooting

### DITA-OT Not Found

**Problem:** Extension shows "DITA-OT not found"

**Solution:**
1. Verify DITA-OT is installed
2. Run "DITA: Configure DITA-OT Path" command
3. Select DITA-OT installation directory
4. Verify with "DITA: Validate Current File"

### Validation Errors

**Problem:** Validation shows unexpected errors

**Solution:**
1. Check XML syntax (closing tags, quotes, etc.)
2. Verify DOCTYPE declaration
3. Try switching validation engine: `"ditacraft.validationEngine": "built-in"`

### Publishing Fails

**Problem:** Publishing fails with error

**Solution:**
1. Check DITA-OT logs in Output panel
2. Verify output directory is writable
3. Check for syntax errors in DITA file
4. Try publishing with `--verbose` flag:
   ```json
   "ditacraft.ditaOtArgs": ["--verbose"]
   ```

### Smart Navigation Not Working

**Problem:** Ctrl+Click on href attributes doesn't open files

**Solution:**
1. Verify you're in a `.ditamap` or `.bookmap` file (check file extension in status bar)
2. Hover over the href value - it should be underlined if detected as a link
3. Make sure you're clicking on the href value itself (e.g., `introduction.dita`), not the attribute name `href=`
4. Check that the referenced file path is correct and file exists
5. Try reloading VS Code window (`Ctrl+R` / `Cmd+R` in VS Code)
6. Verify extension is activated (look for "DitaCraft" in Extensions)

**Example of correct usage:**
```xml
<topicref href="introduction.dita"/>
              ^^^^^^^^^^^^^^^^^^^^
         Ctrl+Click here (on the value)
```

### Preview Not Showing

**Problem:** Preview panel is blank or shows error

**Solution:**
1. Verify HTML5 output was generated
2. Check output directory exists
3. Look for JavaScript errors in Developer Tools
4. Try republishing: `Ctrl+Shift+B` → HTML5

## Documentation

DitaCraft includes comprehensive documentation written in DITA format:

### 📖 User Guide (`docs/user-guide/`)

A complete DITA bookmap with 55 files covering:

| Section | Contents |
|---------|----------|
| **Part I: Getting Started** | Introduction, Installation & Setup |
| **Part II: Using DitaCraft** | Commands (validation, publishing, file creation, navigation), Features (smart navigation, validation, preview, map visualizer, key resolution) |
| **Part III: Configuration** | Settings (general, validation, publishing, preview) |
| **Appendix** | Keyboard Shortcuts reference |
| **Backmatter** | Glossary (28 terms), Index |

The user guide demonstrates DitaCraft's own capabilities - you can open it in VS Code to test validation, navigation, preview, and publishing features.

## Resources

### DITA Resources
- [DITA-OT Documentation](https://www.dita-ot.org/dev/)
- [OASIS DITA Specification](https://www.oasis-open.org/committees/dita/)
- [DITA Style Guide](http://www.ditastyle.com/)

### VS Code Resources
- [VS Code Extension API](https://code.visualstudio.com/api)
- [VS Code Publishing](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)

## Recent Updates

### Version 0.6.2 (Current)
**Enhanced LSP Validation, Diagnostics Deduplication & Bug Fixes**
- **Bookmap Validation** — LSP now warns on missing `<booktitle>` and `<mainbooktitle>` elements in bookmaps
- **Topicref Validation** — LSP flags `<topicref>` elements without `href`, `keyref`, `keys`, `conref`, or `conkeyref` (information-level; self-closing containers are skipped)
- **Single-Quote ID Support** — ID validation (`validateIDs`) now handles `id='value'` in addition to `id="value"`
- **Improved Error Ranges** — Diagnostic underlines now span full line or exact match bounds instead of 1-character-wide squiggles
- **Validation Deduplication** — Disabled client-side on-save auto-validation; LSP server is now the sole provider of real-time diagnostics, eliminating duplicate `dita` vs `dita-lsp` entries
- **Diagnostics View Dedup** — Identical diagnostics from multiple sources are filtered to show each issue only once
- **Stale Diagnostics Cleanup** — Client-side `dita` diagnostics from manual validation are automatically cleared on save
- **cSpell Auto-Prompt Disabled** — cSpell setup prompt disabled by default (new `cspellAutoPrompt` setting); `DITA: Setup cSpell Configuration` command still available
- **Bug Fixes** — Code action single-quote ID handling, DITA Explorer error handling, completion position clamping, XML tokenizer CRLF, `openFile` command declaration
- **652 Client Tests + 430 Server Tests** — 1082 total

### Version 0.6.1
**Localization, DITA 2.0 Rules, Root Map & Validation Enhancements**
- **Localization (i18n)** — All 67 diagnostic messages translatable; English + French bundles included; auto-detects LSP locale
- **DITA 2.0 Rules** — 10 new version-specific rules (SCH-050 to SCH-059): removed elements (`<boolean>`, `<indextermref>`, `<object>`, learning specializations), removed attributes (`@print`, `@copy-to`, `@navtitle`, `@query`), `<audio>`/`<video>` fallback accessibility checks
- **35 Total DITA Rules** — Expanded from 18 to 35 Schematron-equivalent rules across 5 categories (mandatory, recommendation, authoring, accessibility, DITA 2.0 removal); version-gated per DITA version
- **Root Map Feature** — Set/clear explicit root map via command palette or clickable status bar item; workspace-level `rootMap` setting; auto-discover mode by default
- **DITA Specialization** — `@class` attribute matching for specialization-aware element handling; pre-built matchers for 20+ element types
- **Catalog Validation Service** — DTD validation with OASIS XML Catalog resolution and parser pool (3 concurrent instances)
- **RNG Validation Service** — Optional RelaxNG schema validation via salve-annos + saxes; grammar compilation with caching (max 20 schemas)
- **Subject Scheme Enhancements** — Hierarchy path display in completions, grouping by parent subject, default value preselection
- **Conref Content Preview** — Hover on `conref`/`conkeyref` shows inline preview of referenced content
- **Smart Debouncing** — Tiered validation delays (300ms topics, 1000ms maps) with per-document cancellation
- **Key Scope Support** — `@keyscope` attribute handling with scope-qualified key resolution
- **New Logo** — Updated extension icon
- **Bug Fixes** — Code action single-quote ID handling, DITA Explorer error handling, completion position clamping, XML tokenizer CRLF, `openFile` declaration

### Version 0.6.0
**Project Management, Activity Bar Views & Advanced LSP**
- **Activity Bar Views** — DITA Explorer, Key Space, and Diagnostics views in dedicated sidebar
- **File Decorations** — Error/warning badges on tree items from validation diagnostics
- **Cross-Reference Validation** — Validates href, conref, keyref, and conkeyref targets across files (6 diagnostic codes)
- **DITA Rules Engine** — Schematron-equivalent rules in 4 categories (mandatory, recommendation, authoring, accessibility)
- **Profiling Validation** — Subject scheme controlled value validation with automatic scheme discovery
- **Subject Scheme Service** — Parses subject scheme maps for controlled vocabularies with caching
- **Error-Tolerant XML Tokenizer** — State-machine tokenizer with error recovery for malformed XML
- **DITA Version Detection** — Auto-detects DITA version from `@DITAArchVersion` or DOCTYPE
- **4 New Code Actions** — Add missing `otherrole`, remove deprecated `<indextermref>`, convert `alt` attribute to element, add missing `<alt>` to `<image>`
- **5 New Settings** — `maxNumberOfProblems`, `ditaRulesEnabled`, `ditaRulesCategories`, `crossRefValidationEnabled`, `subjectSchemeValidationEnabled`
- **LSP Architecture Documentation** — Comprehensive `DITA_LSP_ARCHITECTURE.md` describing server internals
- **1040+ Total Tests** — Client (620) + Server (419)

### Version 0.5.0
**DITA Language Server with IntelliSense**
- ✅ **Full LSP Implementation** - 14 language features in a dedicated server process
- ✅ **IntelliSense** - Context-aware completion for elements, attributes, and values (364 DITA elements)
- ✅ **DITAVAL Support** - Full IntelliSense, validation, and hover docs for `.ditaval` files
- ✅ **Hover Documentation** - Element docs from DITA schema with children fallback
- ✅ **Document & Workspace Symbols** - Outline view and cross-file symbol search (Ctrl+T)
- ✅ **Go to Definition** - Navigate href/conref/keyref targets with full key space resolution
- ✅ **Find References & Rename** - Cross-file ID references and rename with updates
- ✅ **Formatting** - XML formatter with inline/block/preformatted element handling
- ✅ **Code Actions** - 5 quick fixes (DOCTYPE, ID, title, empty element, duplicate ID)
- ✅ **Linked Editing** - Simultaneous open/close tag name editing
- ✅ **Folding & Document Links** - Collapsible ranges and clickable references
- ✅ **Key Space Resolution Fix** - Improved root map discovery across nested directories
- ✅ **cSpell Auto-Prompt** - Suggests cSpell setup when extension detected without config
- ✅ **Server Test Suite** - 190 standalone Mocha tests (no VS Code dependency)
- ✅ **737+ Total Tests** - Client (547) + Server (190) with CI integration

### Version 0.4.2
**Architecture, Security & Documentation**
- ✅ **Modular Validation Engine** - Refactored validation with pluggable engine architecture
- ✅ **Rate Limiting** - DoS protection for validation operations (10 req/sec per file)
- ✅ **Adaptive Cache Cleanup** - Intelligent cache management that skips cleanup when empty
- ✅ **Architecture Documentation** - Comprehensive ARCHITECTURE.md with data flow diagrams
- ✅ **DITA User Guide** - Complete user documentation in DITA format (55 files with bookmap, glossary, index)
- ✅ **Preview Scroll Sync Fix** - Fixed scroll sync for content smaller than viewport
- ✅ **Preview Print Mode Fix** - Fixed toolbar injection for non-standard HTML structures
- ✅ **547+ Tests** - Expanded test suite with security and edge case coverage

### Version 0.4.1
**TypesXML DTD Validation**
- ✅ **TypesXML DTD Validation** - Pure TypeScript validation with 100% W3C conformance (no native dependencies)
- ✅ **OASIS XML Catalog Support** - Full DITA public identifier resolution via TypesXML
- ✅ **Three Validation Engines** - TypesXML (default), built-in, xmllint

### Version 0.4.0
**Enhanced Preview, Build Output & Map Visualizer**
- ✅ **DITA Map Visualizer** - Interactive tree view showing map hierarchies with navigation
- ✅ **Bidirectional Scroll Sync** - Editor and preview scroll positions stay synchronized
- ✅ **Print Preview Mode** - Print-optimized view with dedicated print button
- ✅ **Syntax-Highlighted Build Output** - DITA-OT output with automatic colorization by log level
- ✅ **Log Level Detection** - Errors, warnings, info, debug messages auto-classified
- ✅ **Build Timestamps** - Build start and completion times displayed
- ✅ **Circular Reference Detection** - Map visualizer detects and warns about circular map references
- ✅ **490+ Tests** - Comprehensive test suite with new feature coverage

### Version 0.3.0
**Developer Experience & Quality Milestone**
- ✅ **Code Coverage with c8** - Switched from nyc to c8 for VS Code extension-compatible coverage
- ✅ **Coverage Threshold Enforcement** - CI enforces minimum coverage (62% lines, 65% functions, 73% branches)
- ✅ **CI Security Audit** - Dedicated security audit job with weekly scheduled scans
- ✅ **Cross-Platform CI** - Tests run on Windows, macOS, and Linux
- ✅ **Dynamic Configuration** - Centralized ConfigurationManager with real-time change propagation
- ✅ **Advanced Element Navigation** - Same-file and cross-file element navigation with fragment support
- ✅ **Configurable Settings** - Validation debounce, key space TTL, DITA-OT timeout, max link matches
- ✅ **Code Quality** - Removed unused dependencies, consolidated file reading, standardized async patterns

### Version 0.2.4
- ✅ **Fixed DITA-OT HTML5 Publishing** - Resolved Windows path case sensitivity issue
- ✅ **Comprehensive Test Suite** - 307+ tests including error handling tests
- ✅ **Improved Error Handling** - Added `fireAndForget` utility for safe async handling

### Version 0.2.0
- ✅ **Full Key Space Resolution** - Navigate `@keyref`, `@conkeyref`, and key-based references with automatic key space building
- ✅ **Enhanced Security** - XXE neutralization, path traversal protection, and command injection prevention
- ✅ **Performance Optimizations** - Async file operations, intelligent caching (1-min TTL), and file watcher debouncing
- ✅ **Content Reference Navigation** - Ctrl+Click on `@conref` attributes to navigate to referenced content
- ✅ **Better UI Responsiveness** - Async operations prevent UI blocking during file operations

### Version 0.1.3 Fixes
- ✅ **Fixed preview and publishing with paths containing spaces** - File paths with spaces now work correctly
- ✅ **Fixed DITA validation** - Title element is now correctly validated as required per DTD spec
- ✅ **Enhanced DTD validation** - Added proper DTD validation support with xmllint
- ✅ **Improved error messages** - Better, more descriptive validation and publishing error messages
- ✅ **Fixed file path validation** - Comprehensive checks to ensure files are being processed
- ✅ **Added verbose logging** - Detailed console logging for easier debugging

## Roadmap

We have an exciting roadmap planned for DitaCraft! See our detailed [ROADMAP.md](ROADMAP.md) for:

- **v0.3.0** - Developer Experience & Quality ✅ **COMPLETE**
- **v0.4.0** - Enhanced Preview, Build Output & Map Visualizer ✅ **COMPLETE**
- **v0.5.0** - IntelliSense & Content Assistance (LSP, DITAVAL, 737+ tests) ✅ **COMPLETE**
- **v0.6.0** - Project Management, Views & Advanced LSP (1010+ tests) ✅ **COMPLETE**
- **v0.7.0** - Advanced Validation (DITA 1.2/2.0 DTDs, workspace-level analysis) **NEXT**
- **v0.8.0** - Refactoring & Productivity (rename keys, templates)
- **v0.9.0** - Publishing Enhancements (profiles, DITAVAL editor)

## Contributing

We welcome contributions! Here's how you can help:

### Good First Issues
Look for issues labeled [`good first issue`](https://github.com/jyjeanne/ditacraft/labels/good%20first%20issue) - these are great starting points for new contributors.

### Development Setup
```bash
git clone https://github.com/jyjeanne/ditacraft.git
cd ditacraft
npm install
npm run compile
# Press F5 in VS Code to run in debug mode
```

### Areas Needing Help
| Area | Difficulty | Description |
|------|------------|-------------|
| Test Coverage | Easy-Medium | Add tests for commands and providers |
| Documentation | Easy | Improve README, add tutorials |
| DITAVAL Editor | Medium | Visual condition editing |
| DTD Support | Hard | Add DITA 1.2/2.0 support |
| DITAVAL Editor | Medium | Visual condition editing |

See [ROADMAP.md](ROADMAP.md) for detailed feature breakdown and contribution opportunities.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.

## Third-Party Licenses & Attributions

DitaCraft includes third-party components with the following licenses:

### OASIS DITA 1.3 Grammar Files

This extension bundles DITA 1.3 DTD files for validation purposes.

- **Copyright:** OASIS Open 2005, 2015. All rights reserved.
- **Source:** [OASIS DITA Technical Committee](https://www.oasis-open.org/committees/dita/)
- **License:** [OASIS IPR Policy](https://www.oasis-open.org/policies-guidelines/ipr/) (RF on Limited Terms)

These grammar files are included to enable DTD-based validation of DITA documents, as permitted under the OASIS IPR Policy for implementing the standard.

### NPM Dependencies

| Package | License | Purpose |
|---------|---------|---------|
| `typesxml` | EPL-1.0 | Full DTD validation with OASIS catalog support |
| `@xmldom/xmldom` | MIT | XML DOM parsing for fallback validation |
| `fast-xml-parser` | MIT | Fast XML validation and parsing |

For complete license texts, see [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 🐛 **Bug Reports:** [GitHub Issues](https://github.com/jyjeanne/ditacraft/issues)
- 💡 **Feature Requests:** [GitHub Issues](https://github.com/jyjeanne/ditacraft/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/jyjeanne/ditacraft/discussions)
- 📧 **Email:** jyjeanne@gmail.com

## Acknowledgments

- DITA Open Toolkit team for the excellent DITA-OT
- OASIS DITA Technical Committee
- VS Code extension development community
- All contributors and users

---

**Made with ❤️ for technical writers and documentation teams**

[⭐ Star this project on GitHub](https://github.com/jyjeanne/ditacraft)
