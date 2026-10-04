# Developing DitaCraft

How to build, run and test DitaCraft from source. For using DitaCraft, see the [README](../README.md);
for contributing, the [Contributing](../README.md#contributing) section.

## Installing from source


If you want to install the plugin locally from source code for development or testing:

### Step 1: Prerequisites
Ensure you have the following installed:
- **Node.js** 18.x or 20.x ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **VS Code** 1.80 or higher
- **Git** (optional, for cloning)

### Step 2: Get the Source Code
```bash
# Clone the repository (or download ZIP from GitHub)
git clone https://github.com/jyjeanne/ditacraft.git
cd ditacraft

# OR if you downloaded as ZIP:
# Extract the ZIP file and navigate to the extracted folder
cd DitaCraft
```

### Step 3: Install Dependencies
```bash
npm install
```
This will install all required npm packages (~429 packages).

### Step 4: Compile TypeScript
```bash
npm run compile
```
This compiles the TypeScript source code to JavaScript in the `out/` directory.

### Step 5: Package the Extension
```bash
npm run package
```
This creates a `.vsix` file in the project root (e.g., `ditacraft-0.1.0.vsix`).

**Note:** If you don't have `vsce` installed, install it first:
```bash
npm install -g @vscode/vsce
```

### Step 6: Install in VS Code
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

### Step 7: Verify Installation
1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Type "DITA" - you should see all DitaCraft commands
3. Try creating a new topic: "DITA: Create New Topic"

### Step 8: Configure DITA-OT (Optional, for publishing)
1. Download DITA-OT from https://www.dita-ot.org/download
2. Extract to a location (e.g., `C:\DITA-OT-4.2.1`)
3. In VS Code, run "DITA: Configure DITA-OT Path"
4. Select your DITA-OT installation directory

## Troubleshooting a local installation

### Issue: `npm install` fails
**Solution:**
- Check Node.js version: `node --version` (should be 18.x or 20.x)
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`, then run `npm install` again

### Issue: Compilation errors
**Solution:**
- Ensure TypeScript is installed: `npm install -g typescript`
- Check for syntax errors in `.ts` files
- Run `npm run lint` to check for code issues

### Issue: Extension not appearing in VS Code
**Solution:**
- Verify the `.vsix` file was created successfully
- Check VS Code version is 1.80 or higher
- Try uninstalling any existing version first
- Restart VS Code completely

### Issue: "Cannot find module" errors
**Solution:**
- Run `npm install` again
- Check that `node_modules` directory exists
- Verify `package.json` has all dependencies

## Development workflow

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


## Building from Source

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

## Project Structure

```
ditacraft/
├── src/                         # Client-side extension code
│   ├── extension.ts             # Entry point
│   ├── commands/                # Command handlers
│   ├── providers/               # Tree views, validation, link & decoration providers
│   ├── utils/                   # Utilities (DITA-OT, key space, map parser, rate limiter)
│   └── test/                    # Client test suites (683+ tests)
├── server/                      # LSP Language Server (separate process)
│   ├── src/
│   │   ├── server.ts            # Server entry point & capability registration
│   │   ├── serverHandlers.ts    # Extracted LSP handler wiring & capabilities
│   │   ├── features/            # LSP feature handlers
│   │   │   ├── validation.ts    # Diagnostics (XML, DITA structure, IDs)
│   │   │   ├── completion.ts    # IntelliSense completions
│   │   │   ├── hover.ts         # Hover documentation
│   │   │   ├── symbols.ts       # Document & workspace symbols
│   │   │   ├── definition.ts    # Go to definition
│   │   │   ├── references.ts    # Find references
│   │   │   ├── rename.ts        # Rename with reference updates
│   │   │   ├── formatting.ts    # XML formatting
│   │   │   ├── codeActions.ts   # Quick fixes (12 actions)
│   │   │   ├── linkedEditing.ts # Tag name sync editing
│   │   │   ├── folding.ts       # Folding ranges
│   │   │   ├── documentLinks.ts # Clickable links
│   │   │   ├── crossRefValidation.ts    # Cross-file reference + scope validation
│   │   │   ├── circularRefDetection.ts  # Circular reference detection (DFS)
│   │   │   ├── workspaceValidation.ts   # Cross-file duplicate IDs, unused topics
│   │   │   ├── ditaRulesValidator.ts    # 43 Schematron-equivalent DITA rules (incl. DITA 2.0)
│   │   │   ├── profilingValidation.ts   # Subject scheme controlled values
│   │   │   └── customRulesValidator.ts  # User-defined regex validation rules
│   │   ├── services/            # Domain services with caching
│   │   │   ├── validationPipeline.ts       # 13-phase orchestration
│   │   │   ├── suppressionEngine.ts        # Comment-based rule suppression
│   │   │   ├── interfaces.ts               # Service interfaces (IKeySpaceService, etc.)
│   │   │   ├── catalogValidationService.ts # DTD validation (TypesXML)
│   │   │   ├── rngValidationService.ts     # RNG validation (salve-annos)
│   │   │   ├── keySpaceService.ts          # Key space resolution + caching
│   │   │   └── subjectSchemeService.ts     # Subject scheme parsing
│   │   ├── utils/               # Server utilities
│   │   │   ├── types.ts                    # Shared types (DitaVersion, RuleCategory)
│   │   │   ├── diagnosticCodes.ts          # Central diagnostic code registry (78 codes)
│   │   │   ├── textUtils.ts               # Comment stripping, offsetToRange, offsetToPosition
│   │   │   ├── xmlTokenizer.ts            # Error-tolerant state-machine tokenizer
│   │   │   ├── i18n.ts                    # Localization (80+ messages EN+FR)
│   │   │   └── ...
│   │   ├── messages/            # Localization bundles (en.json, fr.json — 80+ message keys)
│   │   └── data/                # DITA schema & specialization data (@class matching)
│   └── test/                    # Server test suites (881+ tests)
├── mcp/                         # Standalone MCP server (Model Context Protocol)
│   ├── src/
│   │   └── server.ts            # MCP entry point (6 tools, 3 resources)
│   └── test/                    # MCP test suites + smoke tests
├── dist/                        # Standalone bundles (built by npm run build-standalone)
│   ├── mcp-server.js            # Self-contained MCP server (3.2 MB)
│   └── lsp-server.js            # Self-contained LSP server (2.0 MB)
├── dtds/                        # DITA 1.2, 1.3, and 2.0 DTD files (master catalog)
├── docs/                        # Documentation
│   ├── architecture.puml        # Architecture diagram (PlantUML)
│   └── user-guide/              # DITA user guide (~80 files, bookmap structure)
├── ARCHITECTURE.md
├── DITA_LSP_ARCHITECTURE.md     # LSP server architecture documentation
├── ROADMAP.md
├── TEST_PLAN.md                 # LSP feature test plan
└── CHANGELOG.md
```

## Quality & Testing

DitaCraft includes comprehensive test coverage across client and server:

**Client Tests (683+ tests):**
- DTD validation, real-time validation, command & auto-detection
- Link navigation with key resolution, key space building & caching
- Security (path traversal, XXE protection), rate limiting
- Preview, file creation, configuration integration
- Activity bar views: DITA Explorer, Key Space, Diagnostics, file decorations
- Map hierarchy parser (25 tests)

**LSP Server Tests (881+ tests):**
- Reference parser (40 tests) - all 6 exported parsing functions
- XML tokenizer (26 tests) - state machine, error recovery, CRLF, context detection, Unicode/CJK
- XML formatting (25 tests) - indentation, inline, preformatted, edge cases, range formatting
- Folding ranges (10 tests) - elements, comments, CDATA, CRLF
- Workspace scanner (8 tests) - offset-to-position conversion
- Validation diagnostics (30 tests) - XML, DITA structure, IDs, maps, DITAVAL
- Completions (19 tests) - element, attribute, value, DITAVAL, subject scheme completions
- Hover (17 tests) - documentation, fallback, non-tag, DITAVAL, conref preview
- Document symbols (13 tests) - outline, titles, maps, self-closing
- Workspace symbols (8 tests) - cross-file search, in-memory preference
- Code actions (19 tests) - all 12 quick fixes + edge cases
- Linked editing (15 tests) - tag pairing, nesting, boundaries
- Cross-reference validation - href, conref, keyref target validation
- DITA rules validator - 43 Schematron-equivalent rules (5 categories incl. DITA 2.0) + 25 DITA 2.0 tests
- Custom rules validator - 23 tests (regex matching, fileTypes, caching, severity mapping, ReDoS protection)
- Profiling validation - subject scheme controlled value checks
- Validation pipeline - severity overrides, comment-based suppression, large file optimization, pipeline budget
- Subject scheme service - parsing, caching, hierarchy, value constraints
- DITA specialization - @class matching, topic/map type names, utility functions
- DITA version detector - version detection from content (1.0-2.0)
- Key space service - 100+ tests: keyref chains, keyscope nesting/inheritance/inline branches, provenance, scope explosion cap, explainKey reporting
- Server handlers - 31 wiring tests + 19 settings tests
- Edge cases - empty files, long lines, mixed CRLF, Unicode/CJK content

**MCP Server Tests (standalone Mocha):**
- Tool tests: `dita_validate`, `dita_context_snapshot`, `dita_key_space`, `dita_map_structure`, `dita_resolve_reference`, `dita_explain_key`
- Resource tests: all 3 workspace resources
- Security tests: path traversal rejection, workspace isolation
- Smoke test: `npx tsx mcp/test/smoke-test.ts` (end-to-end tools + resources)

**Running Tests:**
```bash
# Run client tests (requires VS Code)
npm test

# Run server tests (standalone, no VS Code needed)
cd server && npm test

# Run a single server test suite
cd server && npm test -- --grep "KeySpaceService"

# Run MCP server tests (standalone, no VS Code needed)
cd mcp && npx tsc -p test/tsconfig.json && npx mocha out/test/mcp/test/*.test.js --ui tdd --timeout 30000

# MCP smoke test (validates tools + resources end-to-end)
npx tsx mcp/test/smoke-test.ts

# Compile everything
npm run compile
```

## Screenshots

The README's and the user guide's screenshots of the visual editor and preview are taken in a real
VS Code window by `scripts/screenshots/shoot.js`, on the demo project in
`scripts/screenshots/demo/`. Retake them after a change to how the pages look:

```bash
npm run compile
node scripts/screenshots/shoot.js            # all of them, into docs/images and docs/user-guide/images
node scripts/screenshots/shoot.js menu fix   # some of them
```

See [scripts/screenshots/README.md](../scripts/screenshots/README.md).

## Contributing workflow

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Add tests for new features
5. Ensure all tests pass (`npm test`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request
