# DitaCraft Commands and Keyboard Shortcuts

## Overview

This document describes all available commands, keyboard shortcuts, and their usage in the DitaCraft extension.

## Command Palette Commands

All commands can be accessed via the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).

### Publishing & Preview Commands

#### `DITA: Validate Current File`
- **Command ID:** `ditacraft.validate`
- **Keyboard Shortcut:** `Ctrl+Shift+V` (Windows/Linux), `Cmd+Shift+V` (macOS)
- **Icon:** Check mark (✓)
- **Description:** Validates the current DITA file for XML syntax errors and DITA conformance
- **Availability:** When editing `.dita`, `.ditamap`, or `.bookmap` files
- **Action:**
  - Runs XML validation using configured validation engine
  - Checks DITA element structure and attributes
  - Reports errors in Problems panel
  - Shows inline error decorations

#### `DITA: Publish (Select Format)`
- **Command ID:** `ditacraft.publish`
- **Keyboard Shortcut:** `Ctrl+Shift+B` (Windows/Linux), `Cmd+Shift+B` (macOS)
- **Icon:** Export (📤)
- **Description:** Opens format picker and publishes to selected format
- **Availability:** When editing `.dita`, `.ditamap`, or `.bookmap` files
- **Action:**
  1. Shows quick pick menu with available transtypes
  2. User selects desired output format (HTML5, PDF, etc.)
  3. Executes DITA-OT publishing with progress indicator
  4. Opens output location or preview when complete

#### `DITA: Publish to HTML5`
- **Command ID:** `ditacraft.publishHTML5`
- **Keyboard Shortcut:** None (can be customized)
- **Icon:** Globe (🌐)
- **Description:** Quick publish to HTML5 format (skips format selection)
- **Availability:** When editing `.dita`, `.ditamap`, or `.bookmap` files
- **Action:**
  - Directly publishes to HTML5 format
  - Shows progress notification
  - Automatically opens preview panel when complete

#### `DITA: Preview HTML5`
- **Command ID:** `ditacraft.previewHTML5`
- **Keyboard Shortcut:** `Ctrl+Shift+P` (Windows/Linux), `Cmd+Shift+P` (macOS)
- **Icon:** Open Preview (👁)
- **Description:** Shows HTML5 preview in WebView panel
- **Availability:** When editing `.dita`, `.ditamap`, or `.bookmap` files
- **Action:**
  - Publishes to HTML5 if needed (or uses cached version)
  - Opens WebView panel side-by-side with editor
  - Auto-refreshes on save (if enabled in settings)

### File Creation Commands

#### `DITA: Create New Topic`
- **Command ID:** `ditacraft.newTopic`
- **Keyboard Shortcut:** None (can be customized)
- **Description:** Creates a new DITA topic file from template
- **Availability:** Always available
- **Action:**
  1. Prompts for topic type (concept, task, reference, generic)
  2. Prompts for file name
  3. Creates file with appropriate DITA structure
  4. Opens file in editor

#### `DITA: Create New Map`
- **Command ID:** `ditacraft.newMap`
- **Keyboard Shortcut:** None (can be customized)
- **Description:** Creates a new DITA map file
- **Availability:** Always available
- **Action:**
  1. Prompts for file name
  2. Creates ditamap with basic structure
  3. Opens file in editor

#### `DITA: Create New Bookmap`
- **Command ID:** `ditacraft.newBookmap`
- **Keyboard Shortcut:** None (can be customized)
- **Description:** Creates a new DITA bookmap file
- **Availability:** Always available
- **Action:**
  1. Prompts for book title and file name
  2. Creates bookmap with frontmatter/backmatter structure
  3. Opens file in editor

### Configuration Commands

#### `DITA: Configure DITA-OT Path`
- **Command ID:** `ditacraft.configureDitaOT`
- **Keyboard Shortcut:** None
- **Description:** Opens folder picker to configure DITA-OT installation path
- **Availability:** Always available
- **Action:**
  1. Opens folder selection dialog
  2. Validates selected directory contains DITA-OT
  3. Updates `ditacraft.ditaOtPath` setting
  4. Verifies installation and shows version

## Keyboard Shortcuts

### Default Keybindings

| Command | Windows/Linux | macOS | Context |
|---------|--------------|-------|---------|
| Validate | `Ctrl+Shift+V` | `Cmd+Shift+V` | DITA files |
| Preview HTML5 | `Ctrl+Shift+P` | `Cmd+Shift+P` | DITA files |
| Publish | `Ctrl+Shift+B` | `Cmd+Shift+B` | DITA files |

### Customizing Keybindings

Users can customize keybindings in VS Code:

1. Open Command Palette (`Ctrl+Shift+P`)
2. Type "Preferences: Open Keyboard Shortcuts"
3. Search for "DITA" or "ditacraft"
4. Click on command and press desired key combination

**Example custom keybinding in `keybindings.json`:**
```json
{
  "key": "ctrl+alt+h",
  "command": "ditacraft.publishHTML5",
  "when": "resourceExtname == .dita"
}
```

## Editor Context Menu

Right-click menu when editing DITA files includes:

- **DITA: Validate Current File** - Validate syntax
- **DITA: Publish (Select Format)** - Publish with format selection

## Editor Title Bar Buttons

When viewing DITA files, the following buttons appear in the editor title bar:

1. **Validate** (✓) - Validate current file
2. **Preview** (👁) - Show HTML5 preview
3. **Publish** (📤) - Publish with format selection

## Command Availability Context

Commands are context-aware and only appear when appropriate:

### DITA File Context
```
resourceLangId == dita
OR resourceExtname == .dita
OR resourceExtname == .ditamap
OR resourceExtname == .bookmap
```

All publishing, validation, and preview commands require this context.

## Command Workflow Examples

### Example 1: Quick HTML5 Preview
```
1. Open .dita file
2. Press Ctrl+Shift+P (Cmd+Shift+P on macOS)
3. WebView opens with rendered HTML5
4. Make edits to DITA file
5. Save file → Preview auto-refreshes
```

### Example 2: Publish to PDF
```
1. Open .bookmap file
2. Press Ctrl+Shift+B (or click Publish button)
3. Select "pdf" from quick pick menu
4. Watch progress notification (0% → 100%)
5. Notification shows output directory
6. Click notification to open output folder
```

### Example 3: Validate Before Publishing
```
1. Open .ditamap file
2. Press Ctrl+Shift+V to validate
3. Fix any errors shown in Problems panel
4. Press Ctrl+Shift+B to publish
5. Select desired format
```

### Example 4: Create New Document Set
```
1. Run "DITA: Create New Bookmap"
2. Enter title: "User Guide"
3. Run "DITA: Create New Topic" (multiple times)
4. Create topics: concept, task, reference
5. Edit bookmap to reference topics
6. Publish bookmap
```

## Command Implementation

### Command Registration

Commands are registered in `extension.ts`:

```typescript
context.subscriptions.push(
    vscode.commands.registerCommand('ditacraft.validate', validateCommand),
    vscode.commands.registerCommand('ditacraft.publish', publishCommand),
    vscode.commands.registerCommand('ditacraft.publishHTML5', publishHTML5Command),
    vscode.commands.registerCommand('ditacraft.previewHTML5', previewHTML5Command),
    vscode.commands.registerCommand('ditacraft.newTopic', newTopicCommand),
    vscode.commands.registerCommand('ditacraft.newMap', newMapCommand),
    vscode.commands.registerCommand('ditacraft.newBookmap', newBookmapCommand),
    vscode.commands.registerCommand('ditacraft.configureDitaOT', configureDitaOTCommand)
);
```

### Command Handler Structure

Each command handler follows this pattern:

```typescript
async function commandHandler(uri?: vscode.Uri): Promise<void> {
    try {
        // 1. Get active file or use passed URI
        const fileUri = uri || vscode.window.activeTextEditor?.document.uri;

        // 2. Validate preconditions
        if (!fileUri) {
            vscode.window.showErrorMessage('No DITA file open');
            return;
        }

        // 3. Execute command logic
        await performAction(fileUri);

        // 4. Show success message
        vscode.window.showInformationMessage('Action completed');

    } catch (error) {
        // 5. Handle errors
        vscode.window.showErrorMessage(`Error: ${error.message}`);
    }
}
```

## Progress Reporting

Commands that take time (publishing, validation) show progress:

### Progress Notification
```typescript
vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: "Publishing DITA content",
    cancellable: true
}, async (progress, token) => {
    progress.report({ increment: 0, message: "Starting..." });
    // ... perform work
    progress.report({ increment: 50, message: "Transforming..." });
    // ... more work
    progress.report({ increment: 100, message: "Complete!" });
});
```

### Status Bar Progress
```typescript
vscode.window.setStatusBarMessage('$(sync~spin) Publishing...', promise);
```

## Error Handling

All commands implement consistent error handling:

1. **Validation Errors** → Problems panel + inline decorations
2. **DITA-OT Errors** → Notification with error message + Output panel
3. **Configuration Errors** → Notification with help link
4. **File Errors** → Notification with file path

## Future Commands (Planned)

- `DITA: Insert Element` - Insert DITA elements at cursor
- `DITA: Validate All` - Validate all DITA files in workspace
- `DITA: Publish Workspace` - Batch publish multiple maps
- `DITA: Manage DITA-OT Plugins` - Install/remove DITA-OT plugins
- `DITA: Create Build Profile` - Save publishing configurations
- `DITA: Run Build Profile` - Execute saved build profile

## Accessibility

All commands support:
- Keyboard navigation (no mouse required)
- Screen reader announcements for progress and errors
- High contrast theme compatibility
- Keyboard shortcuts following VS Code conventions

## Performance Considerations

- Commands cache results when appropriate (preview generation)
- Long-running commands are cancellable
- Background processing doesn't block editor
- Progress updates are throttled to avoid UI lag

## References

- [VS Code Commands API](https://code.visualstudio.com/api/extension-guides/command)
- [VS Code Keybindings](https://code.visualstudio.com/docs/getstarted/keybindings)
- [VS Code Context Keys](https://code.visualstudio.com/api/references/when-clause-contexts)
