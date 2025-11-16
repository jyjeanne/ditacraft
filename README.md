# DitaCraft

**The best way to edit and publish your DITA files**

[![VS Code](https://img.shields.io/badge/VS%20Code-1.80+-blue.svg)](https://code.visualstudio.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

DitaCraft is a comprehensive Visual Studio Code extension for editing and publishing DITA (Darwin Information Typing Architecture) content. It provides syntax highlighting, validation, and seamless integration with DITA-OT for multi-format publishing.

## Highlights

🔗 **Smart Navigation** - Ctrl+Click on `href`, `conref`, `keyref`, and `conkeyref` attributes with full key space resolution
🔑 **Key Space Resolution** - Automatic resolution of DITA keys from map hierarchies with intelligent caching
✅ **DTD Validation** - Complete DITA 1.3 DTD support with 168 bundled DTD files
⚡ **Real-time Validation** - Automatic validation on open, save, and change with debouncing
🔒 **Enterprise Security** - Path traversal protection, XXE neutralization, and command injection prevention
🚀 **One-Click Publishing** - Direct DITA-OT integration for HTML5, PDF, EPUB, and more
👁️ **Live Preview** - Side-by-side HTML5 preview with auto-refresh
📝 **21 Smart Snippets** - Comprehensive DITA code snippets for rapid editing
🧪 **144+ Tests** - Extensively tested with comprehensive integration and security tests

## Features

### 📝 **DITA Editing**
- Syntax highlighting for `.dita`, `.ditamap`, and `.bookmap` files
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
- **Real-time validation** on file open, save, and change (with 500ms debouncing)
- **DTD-based validation** against DITA 1.3 specifications
  - Bundled DITA 1.3 DTD files (topic, concept, task, reference, map, bookmap, learning, etc.)
  - Validates required elements (id, title) and proper structure
  - Accurate PUBLIC ID resolution with caching
- **Dual validation engines**:
  - Built-in parser with DTD support (default)
  - xmllint integration for advanced validation
- **Enterprise Security Features** (NEW in v0.2.0):
  - XXE (XML External Entity) neutralization to prevent injection attacks
  - Path traversal protection with workspace bounds validation
  - Command injection prevention using safe execution methods
  - Async file operations to prevent UI blocking
- **Intelligent error highlighting**:
  - Inline error highlighting with squiggly underlines
  - Errors appear in Problems panel with severity indicators
  - Accurate line and column positioning
  - Source attribution (DTD validator, XML parser, DITA validator)
- **Auto-detection of DITA files**:
  - By extension: `.dita`, `.ditamap`, `.bookmap`
  - By DOCTYPE: Recognizes DITA DOCTYPE declarations in `.xml` files
- **Manual validation command**: `DITA: Validate Current File` (Ctrl+Shift+V / Cmd+Shift+V)

### 🚀 **One-Click Publishing**
- Publish to multiple formats: HTML5, PDF, EPUB, and more
- Direct integration with DITA Open Toolkit (DITA-OT)
- Real-time progress tracking with visual indicators
- Smart caching for faster preview generation

### 👁️ **Live Preview**
- Side-by-side HTML5 preview
- Auto-refresh on save
- Navigate directly from source to preview

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

### For Advanced Validation (Optional)
- **xmllint** (libxml2) for strict XML validation

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
| **DITA: Create New Topic** | - | Create new DITA topic |
| **DITA: Create New Map** | - | Create new DITA map |
| **DITA: Create New Bookmap** | - | Create new bookmap |
| **DITA: Configure DITA-OT Path** | - | Set DITA-OT installation path |

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
| `ditacraft.showProgressNotifications` | boolean | `true` | Show progress notifications |
| `ditacraft.validationEngine` | string | `"xmllint"` | Validation engine |
| `ditacraft.ditaOtArgs` | array | `[]` | Custom DITA-OT arguments |
| `ditacraft.enableSnippets` | boolean | `true` | Enable code snippets |

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
├── src/
│   ├── extension.ts           # Entry point
│   ├── commands/              # Command handlers
│   │   ├── validateCommand.ts
│   │   ├── publishCommand.ts
│   │   ├── previewCommand.ts
│   │   └── fileCreationCommands.ts
│   ├── providers/
│   │   ├── ditaValidator.ts   # DITA validation engine
│   │   └── ditaLinkProvider.ts # Ctrl+Click navigation
│   ├── utils/
│   │   ├── ditaOtWrapper.ts   # DITA-OT integration
│   │   ├── dtdResolver.ts     # DTD catalog resolver
│   │   └── logger.ts          # Logging utility
│   ├── preview/
│   │   └── previewPanel.ts    # WebView preview
│   └── test/                  # Test suites
│       ├── suite/
│       │   ├── ditaValidator.test.ts
│       │   ├── dtdValidation.test.ts
│       │   ├── realtimeValidation.test.ts
│       │   ├── commandAndDetection.test.ts
│       │   └── ditaLinkProvider.test.ts
│       └── fixtures/          # Test fixtures
├── dtds/                      # DITA 1.3 DTD files
│   ├── base/
│   ├── technicalContent/
│   ├── bookmap/
│   └── learning/
├── syntaxes/
│   └── dita.tmLanguage.json   # Syntax highlighting
├── snippets/
│   └── dita.json              # Code snippets (21 snippets)
├── package.json               # Extension manifest
├── README.md
└── CHANGELOG.md               # Version history
```

### Quality & Testing

DitaCraft includes comprehensive test coverage for all key features:

**Test Suites:**
- **DTD Validation Tests** - Tests DTD resolution and DTD-based validation
- **Real-time Validation Tests** - Tests validation on file open, save, and change
- **Command & Auto-Detection Tests** - Tests manual validation and file detection
- **Link Navigation Tests** - Tests Ctrl+Click navigation including key resolution
- **Key Space Resolution Tests** - Tests key space building and caching

**Test Coverage:**
- ✅ 144+ passing tests covering all key features
- ✅ Real-time validation on file open, save, and change (with debouncing)
- ✅ DTD resolution and bundled DTD files
- ✅ Error highlighting with line/column accuracy
- ✅ Manual validation command
- ✅ Auto-detection by extension or DOCTYPE
- ✅ Smart navigation with key space resolution
- ✅ Content references (`@conref`, `@conkeyref`, `@keyref`)
- ✅ Security testing (path traversal, XXE protection)
- ✅ Async file operations and caching
- ✅ Language ID configuration and integration tests
- ✅ Link detection, range accuracy, and tooltip verification

**Running Tests:**
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run watch

# Compile tests
npm run compile-tests
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

## Resources

### DITA Resources
- [DITA-OT Documentation](https://www.dita-ot.org/dev/)
- [OASIS DITA Specification](https://www.oasis-open.org/committees/dita/)
- [DITA Style Guide](http://www.ditastyle.com/)

### VS Code Resources
- [VS Code Extension API](https://code.visualstudio.com/api)
- [VS Code Publishing](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)

## Recent Updates

### Version 0.2.0 (Current)
- ✅ **Full Key Space Resolution** - Navigate `@keyref`, `@conkeyref`, and key-based references with automatic key space building
- ✅ **Enhanced Security** - XXE neutralization, path traversal protection, and command injection prevention
- ✅ **Performance Optimizations** - Async file operations, intelligent caching (1-min TTL), and file watcher debouncing
- ✅ **Content Reference Navigation** - Ctrl+Click on `@conref` attributes to navigate to referenced content
- ✅ **Comprehensive Test Suite** - 144+ tests covering key resolution, security, and all core features
- ✅ **Better UI Responsiveness** - Async operations prevent UI blocking during file operations

### Version 0.1.3 Fixes
- ✅ **Fixed preview and publishing with paths containing spaces** - File paths with spaces now work correctly
- ✅ **Fixed DITA validation** - Title element is now correctly validated as required per DTD spec
- ✅ **Enhanced DTD validation** - Added proper DTD validation support with xmllint
- ✅ **Improved error messages** - Better, more descriptive validation and publishing error messages
- ✅ **Fixed file path validation** - Comprehensive checks to ensure files are being processed
- ✅ **Added verbose logging** - Detailed console logging for easier debugging

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.

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
