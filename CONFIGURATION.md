# DitaCraft Configuration Guide

## Overview

This document provides comprehensive information about all configuration settings available in the DitaCraft extension.

## Accessing Settings

### Via UI
1. Open VS Code Settings (`Ctrl+,` / `Cmd+,`)
2. Search for "DitaCraft" or "dita"
3. Configure settings using the UI

### Via settings.json
1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Type "Preferences: Open Settings (JSON)"
3. Add DitaCraft settings under the `ditacraft` namespace

## Configuration Settings

### 1. `ditacraft.ditaOtPath`

**Type:** `string`
**Default:** `""` (empty string)
**Description:** Path to DITA-OT installation directory

This setting specifies the absolute path to your DITA-OT installation. If left empty, the extension will attempt to use DITA-OT from your system PATH.

**Examples:**

```json
// Windows
"ditacraft.ditaOtPath": "C:\\DITA-OT-4.2.1"

// macOS/Linux
"ditacraft.ditaOtPath": "/usr/local/dita-ot-4.2.1"

// Use system PATH (default)
"ditacraft.ditaOtPath": ""
```

**Tips:**
- Use the "DITA: Configure DITA-OT Path" command for guided setup
- The path should point to the root DITA-OT directory (containing the `bin` folder)
- Verify installation with "DITA: Validate Current File" command

**Troubleshooting:**
- If DITA-OT is not found, check that the path is correct
- Ensure the `bin` directory exists within the specified path
- On Windows, use double backslashes (`\\`) or forward slashes (`/`)

---

### 2. `ditacraft.defaultTranstype`

**Type:** `string` (enum)
**Default:** `"html5"`
**Options:** `html5`, `pdf`, `xhtml`, `epub`, `htmlhelp`, `markdown`
**Description:** Default output format when publishing DITA content

This setting determines which format is pre-selected when using quick publish commands.

**Examples:**

```json
// Publish to HTML5 by default
"ditacraft.defaultTranstype": "html5"

// Publish to PDF by default
"ditacraft.defaultTranstype": "pdf"

// Publish to EPUB by default
"ditacraft.defaultTranstype": "epub"
```

**Available Formats:**
- **html5** - Modern HTML5 responsive output
- **pdf** - PDF output (requires Apache FOP)
- **xhtml** - XHTML output
- **epub** - EPUB3 e-book format
- **htmlhelp** - HTML Help (CHM) for Windows
- **markdown** - Markdown conversion

**Note:** Additional transtypes may be available if you have DITA-OT plugins installed.

---

### 3. `ditacraft.outputDirectory`

**Type:** `string`
**Default:** `"${workspaceFolder}/out"`
**Description:** Directory where published files will be saved

Specifies the location for DITA-OT output files. Supports workspace variables.

**Examples:**

```json
// Relative to workspace (default)
"ditacraft.outputDirectory": "${workspaceFolder}/out"

// Custom directory name
"ditacraft.outputDirectory": "${workspaceFolder}/build/output"

// Absolute path
"ditacraft.outputDirectory": "C:\\Projects\\Output"

// User home directory (macOS/Linux)
"ditacraft.outputDirectory": "~/Documents/DITA-Output"
```

**Supported Variables:**
- `${workspaceFolder}` - Root directory of the current workspace
- `${workspaceFolderBasename}` - Name of the workspace folder

**Directory Structure:**
```
outputDirectory/
├── html5/
│   └── my-document/
│       └── index.html
├── pdf/
│   └── my-document/
│       └── my-document.pdf
└── epub/
    └── my-document/
        └── my-document.epub
```

**Tips:**
- Use SSD locations for better performance
- Avoid network drives for faster builds
- Consider adding output directory to `.gitignore`

---

### 4. `ditacraft.autoValidate`

**Type:** `boolean`
**Default:** `true`
**Description:** Automatically validate DITA files when saved

When enabled, DITA files are validated automatically on save, showing errors in the Problems panel.

**Examples:**

```json
// Enable auto-validation (default)
"ditacraft.autoValidate": true

// Disable auto-validation (validate manually)
"ditacraft.autoValidate": false
```

**Behavior:**
- When `true`: Validation runs on file save
- When `false`: Use "DITA: Validate Current File" command manually

**Performance Note:** For large files, consider disabling auto-validation and using manual validation.

---

### 5. `ditacraft.previewAutoRefresh`

**Type:** `boolean`
**Default:** `true`
**Description:** Automatically refresh HTML5 preview when file is saved

Controls whether the preview panel updates automatically when you save changes.

**Examples:**

```json
// Enable auto-refresh (default)
"ditacraft.previewAutoRefresh": true

// Disable auto-refresh (manual refresh only)
"ditacraft.previewAutoRefresh": false
```

**Behavior:**
- When `true`: Preview regenerates and refreshes on save
- When `false`: Use "DITA: Preview HTML5" command to refresh manually

**Note:** Auto-refresh triggers a new DITA-OT build, which may take time for large documents.

---

### 6. `ditacraft.showProgressNotifications`

**Type:** `boolean`
**Default:** `true`
**Description:** Show progress notifications during DITA-OT processing

Controls whether progress notifications appear during publishing operations.

**Examples:**

```json
// Show progress notifications (default)
"ditacraft.showProgressNotifications": true

// Hide progress notifications
"ditacraft.showProgressNotifications": false
```

**Behavior:**
- When `true`: Shows notification with progress bar (0% → 100%)
- When `false`: Silent processing (status bar only)

**Recommended:** Keep enabled for visibility into long-running operations.

---

### 7. `ditacraft.validationEngine`

**Type:** `string` (enum)
**Default:** `"xmllint"`
**Options:** `xmllint`, `built-in`
**Description:** XML validation engine to use

Specifies which validation engine to use for DITA file validation.

**Examples:**

```json
// Use xmllint (requires libxml2 installed)
"ditacraft.validationEngine": "xmllint"

// Use built-in validator
"ditacraft.validationEngine": "built-in"
```

**Validation Engines:**

| Engine | Pros | Cons | Requirements |
|--------|------|------|--------------|
| **xmllint** | Fast, strict validation | Requires external tool | libxml2 installed |
| **built-in** | No dependencies | Basic validation only | None |

**Installation:**
- **Windows:** Install libxml2 or use built-in
- **macOS:** Pre-installed on most systems
- **Linux:** `sudo apt-get install libxml2-utils` (Ubuntu/Debian)

---

### 8. `ditacraft.ditaOtArgs`

**Type:** `array` of strings
**Default:** `[]` (empty array)
**Description:** Additional command-line arguments to pass to DITA-OT

Allows you to specify custom arguments that are passed to every DITA-OT execution.

**Examples:**

```json
// Verbose output
"ditacraft.ditaOtArgs": ["--verbose"]

// Use DITAVAL filter
"ditacraft.ditaOtArgs": ["--filter=myfilter.ditaval"]

// Multiple arguments
"ditacraft.ditaOtArgs": [
    "--verbose",
    "--filter=filters/product-a.ditaval",
    "--propertyfile=custom.properties"
]

// Custom parameter
"ditacraft.ditaOtArgs": [
    "--args.input.dir=content",
    "--args.css=custom.css"
]
```

**Common Arguments:**
- `--verbose` - Detailed output
- `--debug` - Debug-level output
- `--filter=<file>` - Apply DITAVAL filter
- `--propertyfile=<file>` - Load properties file
- `--args.css=<file>` - Custom CSS for HTML output
- `--args.copycss=yes` - Copy CSS to output

**Reference:** See [DITA-OT Parameters](https://www.dita-ot.org/dev/parameters/) for all options.

---

### 9. `ditacraft.enableSnippets`

**Type:** `boolean`
**Default:** `true`
**Description:** Enable DITA code snippets and auto-completion

Controls whether code snippets and auto-completion are enabled for DITA files.

**Examples:**

```json
// Enable snippets (default)
"ditacraft.enableSnippets": true

// Disable snippets
"ditacraft.enableSnippets": false
```

**Available Snippets:**
- `topic` - Create topic structure
- `concept` - Create concept structure
- `task` - Create task structure
- `reference` - Create reference structure
- `section` - Add section
- `step` - Add task step
- `table` - Add simple table
- `codeblock` - Add code block

**Usage:** Type the snippet name and press `Tab` or `Enter` to expand.

---

## Configuration Examples

### Minimal Configuration (Use Defaults)

```json
{
    "ditacraft.ditaOtPath": "",
    "ditacraft.defaultTranstype": "html5"
}
```

### Professional Writer Configuration

```json
{
    "ditacraft.ditaOtPath": "C:\\DITA-OT-4.2.1",
    "ditacraft.defaultTranstype": "pdf",
    "ditacraft.outputDirectory": "${workspaceFolder}/build/output",
    "ditacraft.autoValidate": true,
    "ditacraft.previewAutoRefresh": true,
    "ditacraft.showProgressNotifications": true,
    "ditacraft.validationEngine": "xmllint",
    "ditacraft.enableSnippets": true,
    "ditacraft.ditaOtArgs": [
        "--filter=filters/production.ditaval",
        "--args.css=styles/corporate.css"
    ]
}
```

### Performance-Optimized Configuration

```json
{
    "ditacraft.ditaOtPath": "/usr/local/dita-ot",
    "ditacraft.defaultTranstype": "html5",
    "ditacraft.outputDirectory": "/tmp/dita-output",
    "ditacraft.autoValidate": false,
    "ditacraft.previewAutoRefresh": false,
    "ditacraft.showProgressNotifications": false,
    "ditacraft.validationEngine": "built-in",
    "ditacraft.enableSnippets": true,
    "ditacraft.ditaOtArgs": []
}
```

### Multi-Format Publishing Configuration

```json
{
    "ditacraft.ditaOtPath": "${workspaceFolder}/tools/dita-ot",
    "ditacraft.defaultTranstype": "html5",
    "ditacraft.outputDirectory": "${workspaceFolder}/output",
    "ditacraft.autoValidate": true,
    "ditacraft.previewAutoRefresh": true,
    "ditacraft.showProgressNotifications": true,
    "ditacraft.validationEngine": "xmllint",
    "ditacraft.enableSnippets": true,
    "ditacraft.ditaOtArgs": [
        "--args.rellinks=all",
        "--args.copycss=yes"
    ]
}
```

---

## Workspace vs User Settings

### User Settings (Global)
Settings apply to all VS Code workspaces.

**Location:** `~/.config/Code/User/settings.json` (Linux/macOS) or `%APPDATA%\Code\User\settings.json` (Windows)

**Use for:**
- DITA-OT path (same installation for all projects)
- Preferred transtype
- UI preferences (progress notifications, etc.)

### Workspace Settings (Project-Specific)
Settings apply only to the current workspace.

**Location:** `.vscode/settings.json` in workspace root

**Use for:**
- Output directory (project-specific)
- Custom DITA-OT arguments (project filters, CSS)
- Project-specific transtypes

**Example Workspace Settings:**
```json
{
    "ditacraft.outputDirectory": "${workspaceFolder}/docs/output",
    "ditacraft.ditaOtArgs": [
        "--filter=project-filters/v2.0.ditaval"
    ]
}
```

---

## Configuration Best Practices

### 1. **Version Control**
- Commit workspace settings (`.vscode/settings.json`) to Git
- Don't commit user-specific paths in workspace settings
- Use workspace variables (`${workspaceFolder}`) for portability

### 2. **Team Collaboration**
- Document required DITA-OT version in README
- Share workspace settings for consistent builds
- Use relative paths when possible

### 3. **Security**
- Don't store sensitive information in settings
- Use environment variables for secrets
- Review settings before committing to public repos

### 4. **Performance**
- Use fast local drives for output directory
- Disable auto-refresh for large documents
- Consider manual validation for very large projects

### 5. **Maintenance**
- Update DITA-OT path when upgrading DITA-OT
- Review custom arguments periodically
- Clean output directory regularly

---

## Troubleshooting

### Issue: "DITA-OT not found"
**Solution:**
1. Check `ditacraft.ditaOtPath` is correct
2. Verify DITA-OT is installed
3. Run "DITA: Configure DITA-OT Path" command

### Issue: Validation not working
**Solution:**
1. Check `ditacraft.validationEngine` setting
2. If using `xmllint`, ensure libxml2 is installed
3. Try switching to `built-in` engine

### Issue: Preview not refreshing
**Solution:**
1. Check `ditacraft.previewAutoRefresh` is `true`
2. Save the file to trigger refresh
3. Check output directory permissions

### Issue: Publishing fails
**Solution:**
1. Check DITA-OT logs in Output panel
2. Verify `ditacraft.outputDirectory` is writable
3. Check `ditacraft.ditaOtArgs` for invalid arguments

### Issue: Slow performance
**Solution:**
1. Set `ditacraft.autoValidate` to `false`
2. Set `ditacraft.previewAutoRefresh` to `false`
3. Use local SSD for `ditacraft.outputDirectory`
4. Remove `--verbose` from `ditacraft.ditaOtArgs`

---

## Settings Schema

For extension developers, here's the complete schema:

```typescript
interface DitaCraftConfiguration {
    ditaOtPath: string;                    // "" = use PATH
    defaultTranstype: TranstypeEnum;       // "html5" | "pdf" | ...
    outputDirectory: string;               // "${workspaceFolder}/out"
    autoValidate: boolean;                 // true
    previewAutoRefresh: boolean;           // true
    showProgressNotifications: boolean;    // true
    validationEngine: ValidationEngine;    // "xmllint" | "built-in"
    ditaOtArgs: string[];                 // []
    enableSnippets: boolean;               // true
}
```

---

## Additional Resources

- [DITA-OT Documentation](https://www.dita-ot.org/dev/)
- [DITA-OT Parameters Reference](https://www.dita-ot.org/dev/parameters/)
- [VS Code Settings Documentation](https://code.visualstudio.com/docs/getstarted/settings)
- [DitaCraft GitHub Repository](https://github.com/jyjeanne/ditacraft)

---

## Feedback and Support

If you encounter issues with configuration:
1. Check this documentation first
2. Search existing issues on GitHub
3. Create a new issue with:
   - Your settings (sanitize sensitive info)
   - DITA-OT version
   - VS Code version
   - Error messages or unexpected behavior

---

**Last Updated:** 2025-10-13
**Version:** 0.1.0
