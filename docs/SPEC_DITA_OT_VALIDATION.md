# Specification: DITA OT Full Guide Validation

**Version:** 1.2
**Status:** Draft
**Target version:** v0.8.0

---

## 1. Overview

Add a new command **"DITA: Validate Entire Guide Using DITA-OT"** that runs the DITA Open Toolkit against the currently set root map. This performs a full end-to-end validation of the entire documentation guide (all referenced topics, maps, keys, and cross-references) using DITA-OT's own preprocessing pipeline, which catches issues that the LSP server cannot detect (e.g., broken conref targets across many files, unresolvable key references in deep map hierarchies, content model violations only visible during transformation).

The command produces a **validation report** displayed in a VS Code WebView panel with a structured, visually clear presentation of errors, warnings, and informational messages. Issues are also populated in the VS Code **Problems panel** for inline navigation.

This feature is **client-side only** — no LSP server changes are required.

---

## 2. Prerequisites & Guards

Both conditions must be satisfied before execution. If either fails, the command must abort with a clear message.

| # | Prerequisite | How to check | Failure message |
|---|-------------|--------------|-----------------|
| 1 | **DITA-OT installed and configured** | Call `ditaOtWrapper.verifyInstallation()` — returns `{ installed: boolean, version?: string, path?: string }` | `"Command not available: DITA-OT must be installed and configured. Use 'DITA: Configure DITA-OT Path' to set up."` with a **"Configure Now"** button that opens settings |
| 2 | **Root map explicitly set** | Read `ditacraft.rootMap` from workspace configuration — must be non-empty string | `"Command not available: a root map must be set. Use 'DITA: Set Root Map' to select your guide's root map."` with a **"Set Root Map"** button that triggers `ditacraft.setRootMap` |

> **Note:** The guard also returns `ditaOtVersion` (from the verification step) and the resolved `rootMapPath` so downstream code doesn't need to re-verify.

**Guard implementation pattern** (follows existing `validateAndPrepareForPublish()` in `publishCommand.ts`):

```typescript
interface GuideValidationContext {
    rootMapPath: string;       // Absolute path to root map file
    ditaOtVersion: string;     // DITA-OT version string (e.g., "4.2.0")
    ditaOt: DitaOtWrapper;     // Reuse for getAvailableTranstypes() and publish()
}

async function validateGuidePrerequisites(): Promise<GuideValidationContext | null> {
    // 1. Check DITA-OT
    // NOTE: DitaOtWrapper is NOT a singleton — instantiate with `new DitaOtWrapper()`
    // (same pattern as publishCommand.ts and previewCommand.ts)
    const ditaOt = new DitaOtWrapper();
    const installation = await ditaOt.verifyInstallation();
    if (!installation.installed) {
        const action = await vscode.window.showErrorMessage(
            'Command not available: DITA-OT must be installed and configured.',
            'Configure Now'
        );
        if (action === 'Configure Now') {
            await vscode.commands.executeCommand(
                'workbench.action.openSettings', 'ditacraft.ditaOtPath'
            );
        }
        return null;
    }

    // 2. Check root map
    const config = vscode.workspace.getConfiguration('ditacraft');
    const rootMap = config.get<string>('rootMap', '');
    if (!rootMap) {
        const action = await vscode.window.showErrorMessage(
            'Command not available: a root map must be set.',
            'Set Root Map'
        );
        if (action === 'Set Root Map') {
            await vscode.commands.executeCommand('ditacraft.setRootMap');
        }
        return null;
    }

    // 3. Resolve to absolute path
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showWarningMessage('No workspace folder open.');
        return null;
    }
    const rootMapPath = vscode.Uri.joinPath(workspaceFolders[0].uri, rootMap).fsPath;

    // 4. Verify root map file exists on disk
    try {
        await vscode.workspace.fs.stat(vscode.Uri.file(rootMapPath));
    } catch {
        const action = await vscode.window.showErrorMessage(
            `Root map file not found: ${rootMap}.`,
            'Set Root Map'
        );
        if (action === 'Set Root Map') {
            await vscode.commands.executeCommand('ditacraft.setRootMap');
        }
        return null;
    }

    return {
        rootMapPath,
        ditaOtVersion: installation.version ?? 'unknown',
        ditaOt,  // Reuse the same instance for publish() later
    };
}
```

---

## 3. Command Registration

### 3.1 package.json

Add to `contributes.commands`:

```json
{
    "command": "ditacraft.validateGuide",
    "title": "DITA: Validate Entire Guide Using DITA-OT"
}
```

### 3.2 extension.ts

Register the command in `activate()`, passing `context` for WebView panel creation:

```typescript
context.subscriptions.push(
    vscode.commands.registerCommand('ditacraft.validateGuide',
        () => validateGuideCommand(context))
);
```

---

## 4. Execution Flow

### 4.1 Transtype Selection

DITA-OT's preprocessing stage (which resolves keys, conrefs, cross-references, and validates structure) runs as part of every transformation. The simplest approach is to use `html5` as the transtype — it is **always available** in every DITA-OT installation and runs the full preprocessing pipeline before generating output.

However, some DITA-OT installations may have a lightweight transtype that runs preprocessing without generating full output. The command queries available transtypes and selects the lightest one:

1. Call `ditaOt.getAvailableTranstypes()` to query the installed DITA-OT
2. If `dita` transtype is available (DITA-OT 3.6+, identity/copy transform), use it — minimal output
3. Otherwise, use `html5` — always available, runs full preprocessing + transformation

```typescript
const transtypes = await ditaOt.getAvailableTranstypes();
const transtype = transtypes.includes('dita') ? 'dita' : 'html5';
```

> **Why `html5` as fallback:** The `dita` transtype (identity transform) was added in DITA-OT 3.6. It copies DITA source through the full preprocessing pipeline without a rendering stage, making it faster and producing minimal output. When unavailable, `html5` is the universal fallback — it runs the same preprocessing (key resolution, conref processing, link checking) plus the full HTML5 transformation. Both detect the same preprocessing errors.
>
> **Note:** `preprocess` is NOT a valid DITA-OT transtype. Preprocessing runs internally as part of every transformation and cannot be invoked standalone via `--format`.

### 4.2 DITA-OT Invocation

Use the existing `DitaOtWrapper.publish()` method:

```
dita --input <rootMapPath> --format <transtype> --output <tempDir> --verbose --clean.temp=yes
```

**Actual `publish()` API signature** (from `ditaOtWrapper.ts`):

```typescript
// publish() takes options as first arg, progressCallback as second arg
public async publish(
    options: PublishOptions,
    progressCallback?: (progress: PublishProgress) => void
): Promise<PublishResult>
```

Where:
```typescript
interface PublishOptions {
    inputFile: string;
    transtype: string;
    outputDir: string;
    tempDir?: string;
    additionalArgs?: string[];
}

interface PublishResult {
    success: boolean;
    outputPath: string;
    error?: string;
    output?: string;  // Combined stdout+stderr for parsing
}
```

**Key parameters:**
- `inputFile`: Absolute path to the root map (from `ditacraft.rootMap` setting)
- `transtype`: `dita` or `html5` (see Section 4.1)
- `outputDir`: Temporary directory (cleaned up after parsing)
- The `--verbose` and `--clean.temp=yes` flags are automatically added by `publish()`

### 4.3 Progress Reporting

Use `vscode.window.withProgress()` with `ProgressLocation.Notification`.

> **Cancellation limitation:** The current `DitaOtWrapper.publish()` API does not accept a cancellation token. The process has a built-in timeout (configurable via `ditacraft.ditaOtTimeoutMinutes`, default 10 min) with graceful SIGTERM → SIGKILL shutdown. User-initiated cancellation is **not supported** in v1.0 — the progress notification is shown as `cancellable: false`.

```typescript
const startTime = Date.now();

const result = await vscode.window.withProgress(
    {
        location: vscode.ProgressLocation.Notification,
        title: 'DITA-OT: Validating guide...',
        cancellable: false,  // See limitation above
    },
    async (progress) => {
        return await ditaOt.publish(
            {
                inputFile: rootMapPath,
                transtype: transtype,
                outputDir: tempDir,
            },
            (publishProgress) => {
                progress.report({
                    increment: publishProgress.percentage,
                    message: publishProgress.message,
                });
            }
        );
    }
);

const duration = Date.now() - startTime;
// `result` (PublishResult) and `duration` are now available for report assembly
```

### 4.4 Output Parsing

Reuse the existing `parseDitaOtOutput()` from `ditaOtErrorParser.ts` to extract structured errors and warnings from the DITA-OT stdout/stderr output.

```typescript
import { parseDitaOtOutput, ParsedDitaOtOutput, DitaOtError } from '../utils/ditaOtErrorParser';

const parsed: ParsedDitaOtOutput = parseDitaOtOutput(
    result.output ?? '',
    path.dirname(rootMapPath)  // baseDir for resolving relative file paths
);
```

> **Important:** The second argument `baseDir` is required to resolve relative file paths in DITA-OT error messages to absolute paths. Without it, clickable file links in the report would not work.

The parser returns `ParsedDitaOtOutput`:
```typescript
interface ParsedDitaOtOutput {
    errors: DitaOtError[];
    warnings: DitaOtError[];
    infos: DitaOtError[];
    buildSuccessful: boolean;
    summary: string;
}
```

Where each `DitaOtError` has:
```typescript
interface DitaOtError {
    code: string;                      // e.g., "DOTX060E"
    severity: 'error' | 'warning' | 'info';
    message: string;
    filePath?: string;                 // Source file (may be relative or absolute)
    line?: number;                     // 1-based
    column?: number;                   // 1-based
    rawLine: string;                   // Original DITA-OT output line
}
```

**Mapping `DitaOtError` → `ValidationIssue`:**

```typescript
function mapToValidationIssues(
    errors: DitaOtError[],
    baseDir: string
): ValidationIssue[] {
    return errors.map(e => ({
        severity: e.severity,
        code: e.code,
        message: e.message,
        file: e.filePath
            ? path.relative(baseDir, path.resolve(baseDir, e.filePath))
            : undefined,
        absolutePath: e.filePath
            ? path.resolve(baseDir, e.filePath)
            : undefined,
        line: e.line,
        column: e.column,
    }));
}

const issues: ValidationIssue[] = [
    ...mapToValidationIssues(parsed.errors, rootMapDir),
    ...mapToValidationIssues(parsed.warnings, rootMapDir),
    ...mapToValidationIssues(parsed.infos, rootMapDir),
];

// Compute filesAffected: count unique files that have at least one issue
const filesAffected = new Set(
    issues.filter(i => i.file).map(i => i.file)
).size;
```

### 4.5 Problems Panel Integration

In addition to the WebView report, populate the VS Code **Problems panel** using the existing `DitaOtDiagnostics` class (from `ditaOtErrorParser.ts`). This provides inline error squiggles in the editor.

```typescript
import { getDitaOtDiagnostics } from '../utils/ditaOtErrorParser';

const diagnostics = getDitaOtDiagnostics();
diagnostics.updateFromParsedOutput(parsed, vscode.Uri.file(rootMapPath));
```

> **Note:** `updateFromParsedOutput()` internally calls `clear()` before adding new diagnostics — no separate `clear()` call is needed.
>
> **Rationale:** The WebView gives a high-level overview of the full guide, while the Problems panel provides in-editor navigation. Both are needed for a complete workflow. This is the same pattern used by `publishCommand.ts`.

### 4.6 Cleanup

Delete the temporary output directory after parsing is complete, regardless of success or failure:

```typescript
finally {
    try {
        await fsPromises.rm(tempDir, { recursive: true, force: true });
    } catch (cleanupError) {
        // Log but don't fail — temp dir cleanup is best-effort
        logger.warn('Failed to clean up temp directory', { tempDir, cleanupError });
    }
}
```

### 4.7 Build Output Logging

Raw DITA-OT output is always logged to the `DitaOtOutputChannel` for debugging. This happens automatically inside `publish()` — no additional code needed. The user can view it via the "DITA-OT Output" channel in the Output panel.

---

## 5. Validation Report WebView

### 5.1 Panel Creation

Follow the same pattern as existing WebView panels (`previewPanel.ts`, `mapVisualizerPanel.ts`) in `src/providers/`:

```typescript
export class ValidationReportPanel {
    public static readonly viewType = 'ditacraftValidationReport';

    private static currentPanel: ValidationReportPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _report: ValidationReport;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(
        extensionUri: vscode.Uri,
        report: ValidationReport
    ): ValidationReportPanel {
        // If panel already exists, reveal and update
        if (ValidationReportPanel.currentPanel) {
            ValidationReportPanel.currentPanel._panel.reveal(vscode.ViewColumn.Beside);
            ValidationReportPanel.currentPanel.update(report);
            return ValidationReportPanel.currentPanel;
        }

        // Create new panel
        const panel = vscode.window.createWebviewPanel(
            ValidationReportPanel.viewType,
            'DITA Guide Validation Report',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true,  // Preserve filter/search state
                localResourceRoots: [extensionUri],
            }
        );

        ValidationReportPanel.currentPanel = new ValidationReportPanel(
            panel, extensionUri, report
        );
        return ValidationReportPanel.currentPanel;
    }

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        report: ValidationReport
    ) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._report = report;

        // Clean up static reference on dispose
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Re-render when panel becomes visible again (e.g., user switches tabs)
        this._panel.onDidChangeViewState(
            () => {
                if (this._panel.visible) {
                    this._panel.webview.html = this._getHtmlForWebview(this._report);
                }
            },
            null,
            this._disposables
        );

        // Handle messages from WebView
        this._panel.webview.onDidReceiveMessage(
            message => this._handleMessage(message),
            null,
            this._disposables
        );

        this.update(report);
    }

    public dispose(): void {
        ValidationReportPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const d = this._disposables.pop();
            d?.dispose();
        }
    }

    public update(report: ValidationReport): void {
        this._report = report;
        this._panel.title = `Validation: ${report.rootMap}`;
        this._panel.webview.html = this._getHtmlForWebview(report);
    }

    // ... _handleMessage, _getHtmlForWebview methods
}
```

> **Key differences from the original spec:**
> - `retainContextWhenHidden: true` — preserves filter/search/collapsed state when panel loses focus
> - `onDidDispose` handler — clears static reference so next run creates a new panel
> - Singleton pattern with `createOrShow()` — reuses existing panel instead of creating duplicates

### 5.2 WebView Security (CSP)

All WebView HTML must include a Content Security Policy with a nonce to prevent script injection. This follows the existing pattern in `previewPanel.ts` and `mapVisualizerPanel.ts`:

```typescript
private _getHtmlForWebview(report: ValidationReport): string {
    const nonce = this._getNonce();
    const webview = this._panel.webview;

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy"
              content="default-src 'none';
                       style-src ${webview.cspSource} 'nonce-${nonce}';
                       script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style nonce="${nonce}">
            /* Theme-aware styles using VS Code CSS variables */
        </style>
    </head>
    <body>
        <!-- Report HTML -->
        <script nonce="${nonce}">
            // WebView JavaScript
        </script>
    </body>
    </html>`;
}

private _getNonce(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let nonce = '';
    for (let i = 0; i < 32; i++) {
        nonce += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return nonce;
}
```

### 5.3 Report Data Model

```typescript
interface ValidationReport {
    rootMap: string;           // Relative path of the root map
    rootMapAbsolute: string;   // Absolute path (for file navigation)
    ditaOtVersion: string;     // DITA-OT version used
    transtype: string;         // Actual transtype used (dita or html5)
    timestamp: string;         // ISO 8601 timestamp
    duration: number;          // Execution time in milliseconds
    success: boolean;          // BUILD SUCCESSFUL or not
    summary: {
        errors: number;
        warnings: number;
        info: number;
        total: number;
        filesAffected: number;
    };
    issues: ValidationIssue[];
}

interface ValidationIssue {
    severity: 'error' | 'warning' | 'info';
    code: string;              // DITA-OT error code (e.g., DOTX060E)
    message: string;
    file?: string;             // Relative path to source file
    absolutePath?: string;     // Absolute path (for navigation)
    line?: number;             // 1-based line number
    column?: number;           // 1-based column number
}
```

> **Changes from v1.0:** Added `rootMapAbsolute` (needed for navigation), `transtype` (transparency about which validation was used), and clarified that line/column are 1-based (matching DITA-OT output).

### 5.4 WebView HTML Structure

The report uses a clean, professional layout with these sections:

```
+----------------------------------------------------------+
|  DITA Guide Validation Report                            |
|  Root map: user-guide/guide.ditamap                      |
|  DITA-OT 4.2.0 | dita | 2026-03-14 15:30:00 | 12.3s     |
+----------------------------------------------------------+
|                                                          |
|  SUMMARY                                                 |
|  +--------+  +--------+  +--------+  +--------+          |
|  | 3      |  | 7      |  | 2      |  | 5      |          |
|  | Errors |  | Warnings|  | Info   |  | Files  |          |
|  +--------+  +--------+  +--------+  +--------+          |
|                                                          |
|  FILTER: [All] [Errors] [Warnings] [Info]  SEARCH: [___] |
|                                                          |
|  GROUP BY: [File] [Severity]                             |
|                                                          |
+----------------------------------------------------------+
|                                                          |
|  chapter1/intro.dita (3 issues)              [collapse]  |
|  +-------------------------------------------------+     |
|  | E | DOTX060E | Conref target not found:          |     |
|  |   |          | "common/shared.dita#warnings"     |     |
|  |   |          | Line 42, Column 5           [copy]|     |
|  +-------------------------------------------------+     |
|  | W | DOTJ070W | Key "product-name" not defined     |     |
|  |   |          | Line 18, Column 12          [copy]|     |
|  +-------------------------------------------------+     |
|                                                          |
|  (no file) (1 issue)                         [collapse]  |
|  +-------------------------------------------------+     |
|  | W | DOTJ073W | Missing image reference            |     |
|  |   |          |                             [copy]|     |
|  +-------------------------------------------------+     |
|                                                          |
+----------------------------------------------------------+
|  BUILD FAILED | 3 errors, 7 warnings | 5 files affected  |
|  [Export JSON]  [View Build Output]  [Rerun Validation]  |
+----------------------------------------------------------+
```

> **Change from v1.0:** Added "(no file)" group for issues without a source file (some DITA-OT errors are global). Added "View Build Output" and "Rerun Validation" footer buttons.

### 5.5 WebView Features

| Feature | Description |
|---------|-------------|
| **Summary cards** | Color-coded count cards: red (errors), orange (warnings), blue (info), gray (files) |
| **Severity filter** | Toggle buttons to show/hide by severity; active state highlighted |
| **Search** | Text filter across message, file, and error code; debounced 200ms |
| **Group by** | Toggle between grouping by file path or by severity |
| **File links** | Clickable file paths that open the source file at the correct line via `postMessage` → `vscode.workspace.openTextDocument()` + `vscode.window.showTextDocument()` with selection |
| **Collapsible groups** | File groups are collapsible; groups with errors expanded by default, warning/info-only groups collapsed |
| **Severity icons** | Circle icons: red for errors, orange for warnings, blue for info |
| **Error codes** | Monospaced badge style |
| **Copy message** | Copy button on each issue row — copies `[CODE] message (file:line)` to clipboard |
| **Export** | "Export as JSON" button in footer to save report to file |
| **View Build Output** | Footer button to reveal the DITA-OT Output channel |
| **Rerun Validation** | Footer button to re-execute the command |
| **Theme-aware** | Uses VS Code CSS variables (`--vscode-editor-background`, `--vscode-editor-foreground`, `--vscode-badge-background`, etc.) for light/dark/high-contrast support |
| **No issues** | When validation passes with no issues, show a success state: green checkmark icon, "Your guide is valid!" message, root map name, and validation duration |
| **Responsive** | Adapts to narrow panel widths; issue cards wrap gracefully |

### 5.6 WebView Communication

**WebView → Extension (postMessage):**

```typescript
// User clicks a file link in the report
interface OpenFileMessage {
    command: 'openFile';
    path: string;    // Absolute file path
    line?: number;   // 1-based
    column?: number; // 1-based
}

// User clicks "Export as JSON"
interface ExportReportMessage {
    command: 'exportReport';
}

// User clicks "View Build Output"
interface ViewOutputMessage {
    command: 'viewBuildOutput';
}

// User clicks "Rerun Validation"
interface RerunMessage {
    command: 'rerunValidation';
}

// User clicks "Copy" on an issue
interface CopyMessage {
    command: 'copyIssue';
    text: string;
}
```

**Extension message handler:**

```typescript
private async _handleMessage(message: any): Promise<void> {
    switch (message.command) {
        case 'openFile': {
            try {
                const uri = vscode.Uri.file(message.path);
                const doc = await vscode.workspace.openTextDocument(uri);
                const line = Math.max(0, (message.line ?? 1) - 1);  // Convert 1-based to 0-based
                const col = Math.max(0, (message.column ?? 1) - 1);
                const pos = new vscode.Position(line, col);
                await vscode.window.showTextDocument(doc, {
                    selection: new vscode.Range(pos, pos),
                    viewColumn: vscode.ViewColumn.One,
                });
            } catch {
                vscode.window.showWarningMessage(
                    `Could not open file: ${message.path}`
                );
            }
            break;
        }
        case 'exportReport': {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri;
            const defaultUri = workspaceFolder
                ? vscode.Uri.joinPath(workspaceFolder, 'validation-report.json')
                : vscode.Uri.file('validation-report.json');
            const uri = await vscode.window.showSaveDialog({
                defaultUri,
                filters: { 'JSON': ['json'] },
            });
            if (uri) {
                await vscode.workspace.fs.writeFile(uri,
                    Buffer.from(JSON.stringify(this._report, null, 2)));
                vscode.window.showInformationMessage(
                    `Report exported to ${vscode.workspace.asRelativePath(uri)}`
                );
            }
            break;
        }
        case 'viewBuildOutput': {
            getDitaOtOutputChannel().show();
            break;
        }
        case 'rerunValidation': {
            await vscode.commands.executeCommand('ditacraft.validateGuide');
            break;
        }
        case 'copyIssue': {
            await vscode.env.clipboard.writeText(message.text);
            break;
        }
    }
}
```

> **Changes from v1.0:**
> - Added error handling on `openFile` (file may have been deleted since report was generated)
> - Added `viewBuildOutput`, `rerunValidation`, and `copyIssue` message types
> - Export shows confirmation message with relative path
> - `openFile` properly converts DITA-OT 1-based line/column to VS Code 0-based Position

---

## 6. File Structure

All new code is client-side. WebView panel follows the existing pattern in `src/providers/`:

```
src/
  commands/
    validateGuideCommand.ts          # NEW — Command entry point, prerequisites, orchestration
  providers/
    validationReportPanel.ts         # NEW — WebView panel class (singleton, HTML, messages)
  test/
    suite/
      validateGuideCommand.test.ts   # NEW — Unit tests
```

### 6.1 File Responsibilities

| File | Responsibility |
|------|---------------|
| `validateGuideCommand.ts` | `validateGuideCommand(context)` entry point, `validateGuidePrerequisites()`, transtype selection, DITA-OT invocation via `publish()`, output parsing via `parseDitaOtOutput()`, report assembly, temp dir lifecycle, Problems panel integration |
| `validationReportPanel.ts` | `ValidationReportPanel` class: singleton `createOrShow()`, WebView HTML generation with CSP nonce, `postMessage` handling (openFile, export, rerun, copy, viewOutput), dispose lifecycle, theme-aware CSS |

---

## 7. Integration with Existing Code

### 7.1 Reused Components

| Component | File | Usage |
|-----------|------|-------|
| `DitaOtWrapper` | `ditaOtWrapper.ts` | `new DitaOtWrapper()` — `verifyInstallation()`, `getAvailableTranstypes()`, `publish()` |
| `parseDitaOtOutput()` | `ditaOtErrorParser.ts` | Parse DITA-OT stdout/stderr into `ParsedDitaOtOutput` |
| `getDitaOtDiagnostics()` | `ditaOtErrorParser.ts` | Populate VS Code Problems panel with parsed issues |
| `getDitaOtOutputChannel()` | `ditaOtOutputChannel.ts` | Show raw DITA-OT output channel on user request |
| `Logger` | `logger.ts` | Error/debug logging via `logger.error()`, `logger.info()`, `logger.debug()` |
| `fireAndForget()` | `errorHandling.ts` | Safe async operations for non-critical paths |

### 7.2 Modified Files

| File | Change |
|------|--------|
| **`package.json`** | Add `ditacraft.validateGuide` command to `contributes.commands` |
| **`extension.ts`** | Add `vscode.commands.registerCommand('ditacraft.validateGuide', ...)` in `activate()` |

---

## 8. Error Handling

| Scenario | Behavior |
|----------|----------|
| DITA-OT not installed | Guard shows error with "Configure Now" action → opens settings |
| Root map not set | Guard shows error with "Set Root Map" action → triggers setRootMap command |
| Root map file missing on disk | Guard shows error with "Set Root Map" action |
| No workspace open | Guard shows warning; abort |
| DITA-OT process timeout | `publish()` handles SIGTERM→SIGKILL internally; `PublishResult.success=false` with timeout error; report panel shows "Validation timed out" with "View Build Output" button |
| DITA-OT non-zero exit (build failure) | Normal case for validation — parse output for errors/warnings, show report |
| DITA-OT crashes (no parseable output) | Show raw error in output channel; report panel shows "Validation failed — see build output" with `result.error` message |
| Temp dir creation fails | Show error message; abort (use `try/catch` around `fs.mkdtemp()`) |
| Temp dir cleanup fails | Log warning; don't fail (best-effort cleanup) |
| WebView panel already open | `createOrShow()` reveals existing panel and updates content |
| File not found when clicking link | Show warning message "Could not open file: path" |
| `parseDitaOtOutput` returns empty | Show success state in WebView (zero issues) |
| Concurrent executions | Disable: if validation is already running, show info message "Validation already in progress" |

---

## 9. Complete Command Flow

```
User triggers "DITA: Validate Entire Guide Using DITA-OT"
    │
    ▼
validateGuidePrerequisites()
    ├─ DITA-OT not installed? → error + "Configure Now" → STOP
    ├─ Root map not set? → error + "Set Root Map" → STOP
    ├─ Root map file missing? → error + "Set Root Map" → STOP
    └─ OK → { rootMapPath, ditaOtVersion }
    │
    ▼
Select transtype (dita > html5)
    │
    ▼
Create temp directory (os.tmpdir + 'ditacraft-validate-')
    │
    ▼
Show progress notification (non-cancellable)
    │
    ▼
ditaOt.publish({ inputFile, transtype, outputDir: tempDir }, progressCallback)
    │
    ▼
Parse result.output via parseDitaOtOutput(output, baseDir)
    │
    ├─ Map DitaOtError[] → ValidationIssue[]
    ├─ Compute summary (error/warning/info counts, unique files)
    │
    ▼
Build ValidationReport object
    │
    ├─► Populate Problems panel via getDitaOtDiagnostics().updateFromParsedOutput()
    │
    ├─► Show ValidationReportPanel.createOrShow(extensionUri, report)
    │
    └─► Log to DitaOtOutputChannel (automatic via publish())
    │
    ▼
Cleanup temp directory (finally block, best-effort)
```

---

## 10. Testing Strategy

### 10.1 Unit Tests (`validateGuideCommand.test.ts`)

| # | Test | Description |
|---|------|-------------|
| 1 | **Guard: no DITA-OT** | Mock `verifyInstallation()` → `{ installed: false }`; assert error message shown with "Configure Now" button |
| 2 | **Guard: no root map** | Set `ditacraft.rootMap` to `""`; assert error message shown with "Set Root Map" button |
| 3 | **Guard: root map file missing** | Set root map to non-existent path; assert file-not-found error with "Set Root Map" button |
| 4 | **Guard: no workspace** | No workspace folders; assert warning shown |
| 5 | **Guard: all prerequisites met** | Mock both passing; assert `publish()` is called with correct options |
| 6 | **Transtype fallback: dita available** | Mock `getAvailableTranstypes()` → `['dita', 'html5']`; assert `dita` selected |
| 7 | **Transtype fallback: dita unavailable** | Mock `getAvailableTranstypes()` → `['html5']`; assert `html5` selected |
| 8 | **Parse output → report** | Feed sample DITA-OT output; verify `ValidationReport` summary counts, issue mapping |
| 9 | **DitaOtError → ValidationIssue mapping** | Verify fields mapped correctly: `filePath`→`file` (relative), `absolutePath` resolved |
| 10 | **Empty output → success state** | `result.output` empty or no errors; verify report has zero issues and `success: true` |
| 11 | **Temp dir cleanup on success** | Assert temp dir removed after successful validation |
| 12 | **Temp dir cleanup on failure** | Assert temp dir removed even when `publish()` fails |
| 13 | **Problems panel populated** | Assert `getDitaOtDiagnostics().updateFromParsedOutput()` called with parsed output |
| 14 | **Concurrent execution blocked** | Trigger command twice; assert second call shows "already in progress" |

### 10.2 WebView Panel Tests (`validationReportPanel.test.ts`)

| # | Test | Description |
|---|------|-------------|
| 1 | **HTML contains CSP nonce** | Assert generated HTML includes `Content-Security-Policy` meta tag with nonce |
| 2 | **Summary counts match** | Assert summary cards show correct error/warning/info/file counts |
| 3 | **Issues grouped by file** | Assert issues with same file are grouped together |
| 4 | **No-file issues grouped** | Assert issues without `file` appear in "(no file)" group |
| 5 | **Success state** | Report with zero issues shows success banner |
| 6 | **HTML escaping** | Assert special characters in messages (`<`, `>`, `&`, `"`) are properly escaped to prevent XSS |

---

## 11. UX Considerations

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Command location** | Command Palette only (no keybinding) | Infrequent operation; keybinding would be wasted |
| **Panel position** | `ViewColumn.Beside` | Side-by-side with editor for navigation |
| **Reuse panel** | Single panel instance via `createOrShow()` | Prevent panel clutter; update in place |
| **Retain state** | `retainContextWhenHidden: true` | Preserve filter/search/collapsed state when switching tabs |
| **Auto-scroll** | Scroll to first error group when report loads | Draw attention to highest-priority issues |
| **Empty state** | Green checkmark + "Your guide is valid!" + root map + duration | Positive feedback for clean guides |
| **Performance** | For large guides (100+ topics), DITA-OT may take 30-60s | Progress notification with stage updates is essential |
| **Build output** | Always logged to DitaOtOutputChannel | Available via "View Build Output" button for debugging |
| **Problems panel** | Issues also shown in Problems panel | Enables inline editor navigation to error locations |
| **Non-cancellable** | Progress notification `cancellable: false` | `publish()` API doesn't support cancellation token (see Future Enhancements) |

---

## 12. Future Enhancements (Out of Scope for v1.0)

- [ ] **Cancellation support** — Extend `PublishOptions` with an `AbortSignal` or `CancellationToken` to allow user-initiated process kill
- [ ] Save/compare validation reports over time (diff between runs)
- [ ] Auto-run validation on root map save (opt-in via setting)
- [ ] Support user-selectable transtype for validation (some transtypes catch different issues)
- [ ] Filter by file glob pattern in report
- [ ] Export as HTML report (in addition to JSON)
- [ ] Integration with Diagnostics View tree (merge DITA-OT issues with LSP diagnostics)

---

*Last updated: March 2026 (v1.2 — fixed `duration` scoping, `_report` field, dispose pattern, `onDidChangeViewState`, `filesAffected` computation, export `defaultUri`, panel title update on rerun, removed redundant `diagnostics.clear()`, removed invalid `preprocess` transtype)*
