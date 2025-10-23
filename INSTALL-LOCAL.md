# Local Installation Guide for DitaCraft

## Quick Start - 5 Steps

```bash
# 1. Navigate to project folder
cd DitaCraft

# 2. Install dependencies
npm install

# 3. Compile TypeScript
npm run compile

# 4. Package extension
npm run package

# 5. Install the .vsix file in VS Code
```

Then in VS Code: Extensions → `...` menu → "Install from VSIX..." → Select `ditacraft-0.1.0.vsix`

## Detailed Step-by-Step Instructions

### Prerequisites Check

Before you begin, verify you have:

```bash
# Check Node.js version (should be 18.x or 20.x)
node --version

# Check npm version
npm --version

# Check VS Code version (should be 1.80+)
code --version
```

If any are missing:
- **Node.js & npm**: Download from https://nodejs.org/
- **VS Code**: Download from https://code.visualstudio.com/

### Step 1: Get the Source Code

**Option A: Already have the folder**
```bash
cd C:\Users\jjeanne\Desktop\DitaCraft
```

**Option B: Clone from Git**
```bash
git clone https://github.com/jyjeanne/ditacraft.git
cd ditacraft
```

**Option C: Download ZIP**
1. Download ZIP from GitHub
2. Extract to desired location
3. Open terminal in extracted folder

### Step 2: Install Dependencies

```bash
npm install
```

**What this does:**
- Downloads ~429 packages from npm registry
- Creates `node_modules/` folder
- Takes 1-2 minutes depending on internet speed

**Expected output:**
```
added 429 packages, and audited 430 packages in 1m
found 0 vulnerabilities
```

**If errors occur:**
```bash
# Clear npm cache and try again
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Step 3: Compile TypeScript

```bash
npm run compile
```

**What this does:**
- Compiles all `.ts` files in `src/` to `.js` in `out/`
- Generates source maps (`.js.map`)
- Generates type definitions (`.d.ts`)
- Takes ~3-5 seconds

**Expected output:**
```
> ditacraft@0.1.0 compile
> tsc -p ./

(No output means success)
```

**Verify compilation:**
```bash
# Check that out/ directory exists
ls out/

# Should show:
# commands/  extension.js  providers/  test/  utils/
```

### Step 4: Package Extension (Optional)

**Note:** This step is optional. You can skip to Step 5 Option B (Development Mode) to test immediately.

```bash
npm run package
```

**What this does:**
- Creates a `.vsix` file (VS Code extension package)
- Bundles compiled code and resources
- Takes ~5-10 seconds

**Expected output:**
```
> ditacraft@0.1.0 package
> vsce package

Executing prepublish script 'npm run vscode:prepublish'...
...
DONE  Packaged: C:\Users\jjeanne\Desktop\DitaCraft\ditacraft-0.1.0.vsix (1.5 MB)
```

**If `vsce` not found:**
```bash
npm install -g @vscode/vsce
# Then retry: npm run package
```

### Step 5: Install in VS Code

#### Option A: Install from VSIX (Permanent Installation)

1. **Open VS Code**
   ```bash
   code .
   ```

2. **Open Extensions View**
   - Press `Ctrl+Shift+X` (Windows/Linux)
   - Or `Cmd+Shift+X` (macOS)
   - Or View → Extensions

3. **Install from VSIX**
   - Click the `...` menu (three dots) at top-right of Extensions panel
   - Select "Install from VSIX..."
   - Navigate to project folder
   - Select `ditacraft-0.1.0.vsix`
   - Click "Install"

4. **Reload VS Code**
   - Click "Reload" button when prompted
   - Or close and reopen VS Code

5. **Verify Installation**
   - Press `Ctrl+Shift+P` (`Cmd+Shift+P` on macOS)
   - Type "DITA"
   - Should see all DitaCraft commands

#### Option B: Development Mode (Recommended for Testing)

1. **Open Project in VS Code**
   ```bash
   cd C:\Users\jjeanne\Desktop\DitaCraft
   code .
   ```

2. **Start Debugging**
   - Press `F5`
   - Or Run → Start Debugging
   - Or click green play button in Run and Debug panel

3. **Extension Host Window Opens**
   - New VS Code window titled "[Extension Development Host]"
   - Extension is loaded in this window only
   - Main window shows debug console

4. **Test the Extension**
   - In Extension Host window:
   - Press `Ctrl+Shift+P` (`Cmd+Shift+P`)
   - Type "DITA"
   - Try commands

5. **Reload After Changes**
   - Make changes to code in main window
   - Save files
   - In Extension Host window: `Ctrl+R` (`Cmd+R`) to reload

### Step 6: Verify Installation

Create a test DITA file:

1. **Open Command Palette**
   - `Ctrl+Shift+P` / `Cmd+Shift+P`

2. **Run Command**
   - Type: "DITA: Create New Topic"
   - Select: "Concept"
   - Enter name: "test-topic"

3. **File Should Be Created**
   - `test-topic.dita` opens in editor
   - Contains valid DITA XML structure

4. **Test Validation**
   - Press `Ctrl+Shift+V` (`Cmd+Shift+V`)
   - Should show: "✓ No issues found in test-topic.dita"

### Step 7: Configure DITA-OT (For Publishing Features)

1. **Download DITA-OT**
   - Visit: https://www.dita-ot.org/download
   - Download latest version (4.2.1+)
   - Extract to known location (e.g., `C:\DITA-OT-4.2.1`)

2. **Configure in Extension**
   - Command Palette: "DITA: Configure DITA-OT Path"
   - Browse to DITA-OT folder
   - Select the root folder (contains `bin/` subfolder)

3. **Verify Configuration**
   - Check VS Code Output panel
   - Should show: "DITA-OT found: Version X.X.X at path"

## Development Workflow

### Watch Mode (Auto-Compile)

Keep TypeScript auto-compiling while you work:

```bash
npm run watch
```

**What this does:**
- Monitors `src/` folder for changes
- Auto-compiles when files are saved
- Runs continuously until you stop it (Ctrl+C)

**Terminal output:**
```
> ditacraft@0.1.0 watch
> tsc -watch -p ./

[8:00:00 AM] Starting compilation in watch mode...
[8:00:03 AM] Found 0 errors. Watching for file changes.
```

### Debug Workflow

**Terminal 1:**
```bash
npm run watch
```

**VS Code:**
- Press `F5` to start Extension Host
- Edit files in `src/`
- Save to auto-compile
- Press `Ctrl+R` in Extension Host to reload

### Running Tests

```bash
# Run all tests
npm test

# In development: compile first
npm run compile
npm test
```

### Linting Code

```bash
npm run lint
```

Checks for:
- TypeScript errors
- Code style issues
- Potential bugs

## Uninstalling

### If Installed from VSIX
1. Open Extensions (`Ctrl+Shift+X`)
2. Find "DitaCraft"
3. Click gear icon → "Uninstall"
4. Reload VS Code

### If Running in Debug Mode
- Just close the Extension Development Host window
- Extension is not permanently installed

## Updating Local Installation

After making code changes:

```bash
# 1. Recompile
npm run compile

# 2. Reload extension
# Press Ctrl+R in Extension Host window

# OR if installed from VSIX:
# 3. Rebuild package
npm run package

# 4. Reinstall VSIX in VS Code
```

## Common Issues and Solutions

### Issue: "npm: command not found"
**Solution:** Install Node.js from https://nodejs.org/

### Issue: "Cannot find module 'typescript'"
**Solution:**
```bash
npm install
```

### Issue: "tsc: command not found"
**Solution:**
```bash
npm install -g typescript
```

### Issue: Extension doesn't show in VS Code
**Solution:**
- Check Extensions view (Ctrl+Shift+X)
- Look for "DitaCraft" in installed extensions
- If missing, reinstall from VSIX
- Check VS Code version is 1.80+

### Issue: Commands don't appear
**Solution:**
- Reload VS Code window
- Check Developer Tools (Help → Toggle Developer Tools) for errors
- Verify extension activated (check Output → DitaCraft)

### Issue: Changes not taking effect
**Solution:**
```bash
# 1. Recompile
npm run compile

# 2. Reload Extension Host
# Press Ctrl+R in Extension Host window

# 3. If still not working, restart debug session
# Stop (Shift+F5) and Start (F5) again
```

### Issue: "out/extension.js not found"
**Solution:**
```bash
npm run compile
```

## Folder Structure After Installation

```
DitaCraft/
├── node_modules/        # Dependencies (created by npm install)
├── out/                 # Compiled JavaScript (created by compile)
│   ├── commands/
│   ├── providers/
│   ├── test/
│   ├── utils/
│   └── extension.js
├── src/                 # TypeScript source code
├── .vscode/            # VS Code configuration
├── package.json        # Extension manifest
├── tsconfig.json       # TypeScript config
└── ditacraft-0.1.0.vsix  # Extension package (created by package)
```

## Quick Reference

| Task | Command |
|------|---------|
| Install dependencies | `npm install` |
| Compile TypeScript | `npm run compile` |
| Auto-compile (watch) | `npm run watch` |
| Run tests | `npm test` |
| Lint code | `npm run lint` |
| Package extension | `npm run package` |
| Start debugging | Press `F5` in VS Code |
| Reload extension | `Ctrl+R` in Extension Host |

## Next Steps

After installation:

1. ✅ Read [README.md](README.md) for usage guide
2. ✅ Check [CONFIGURATION.md](CONFIGURATION.md) for settings
3. ✅ Review [COMMANDS-AND-SHORTCUTS.md](COMMANDS-AND-SHORTCUTS.md) for commands
4. ✅ Configure DITA-OT for publishing features
5. ✅ Start creating DITA content!

## Support

If you encounter issues:
1. Check this guide first
2. Check main [README.md](README.md) troubleshooting section
3. Review error messages in VS Code Output panel (Output → DitaCraft)
4. Check Developer Tools console (Help → Toggle Developer Tools)
5. Open an issue on GitHub with error details

---

**Happy DITA editing! 🎉**
