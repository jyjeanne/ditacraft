# DitaCraft v0.4.0: Live Preview, Map Visualizer, and Enhanced Developer Experience for DITA Authors

**Transform your DITA authoring workflow with real-time HTML5 preview, interactive map visualization, and intelligent error tracking.**

---

If you're working with DITA (Darwin Information Typing Architecture) in VS Code, you know the pain of the edit-publish-review cycle. Write some XML, run DITA-OT, wait, open a browser, check the output, find issues, go back to the source... rinse and repeat.

DitaCraft v0.4.0 changes that workflow entirely.

## What's New in v0.4.0

This release focuses on three major areas that directly impact your daily productivity:

1. **Live WebView Preview** — See your DITA content rendered as HTML5 directly inside VS Code
2. **Map Visualizer** — Interactive tree visualization of your DITA map structure
3. **Enhanced Output Panel** — Syntax-highlighted build output with clickable error links

Let's dive into each feature.

---

## Live WebView Preview: Write and See Instantly

The centerpiece of v0.4.0 is the new WebView Preview panel. No more switching to a browser or manually refreshing output files.

### Getting Started

Open any DITA topic or map file and run the command:

```
DitaCraft: Preview HTML5
```

Or use the keyboard shortcut `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac), type "Preview", and select the command.

A new panel opens beside your editor showing your content rendered as HTML5:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  my-topic.dita                    │  Preview: my-topic.dita            │
├───────────────────────────────────┼─────────────────────────────────────┤
│                                   │  ┌─────────────────────────────┐   │
│  <?xml version="1.0"?>            │  │ [↻ Refresh] [🖨 Print]      │   │
│  <topic id="intro">               │  └─────────────────────────────┘   │
│    <title>Introduction</title>    │                                    │
│    <body>                         │  Introduction                      │
│      <p>Welcome to our product    │  ════════════                      │
│      documentation.</p>           │                                    │
│                                   │  Welcome to our product            │
│      <ul>                         │  documentation.                    │
│        <li>Feature A</li>         │                                    │
│        <li>Feature B</li>         │  • Feature A                       │
│      </ul>                        │  • Feature B                       │
│    </body>                        │                                    │
│  </topic>                         │                                    │
└───────────────────────────────────┴─────────────────────────────────────┘
```

The preview uses DITA-OT to generate real HTML5 output, so what you see is exactly what you'll get when you publish.

### Scroll Synchronization

Here's where it gets interesting. As you scroll through your DITA source, the preview automatically scrolls to match your position. Edit a paragraph deep in your document? The preview jumps right there.

This bidirectional sync means:
- Scroll in the **source** → preview follows
- Click in the **preview** → source jumps to that section

You can toggle scroll sync on or off:

```json
{
  "ditacraft.previewScrollSync": true
}
```

### Theme Support: Light, Dark, or Auto

The preview respects your VS Code theme. Working late at night with a dark theme? Your preview matches automatically.

```
┌─────────────────────────────┐    ┌─────────────────────────────┐
│  LIGHT THEME                │    │  DARK THEME                 │
├─────────────────────────────┤    ├─────────────────────────────┤
│  ┌───────────────────────┐  │    │  ┌───────────────────────┐  │
│  │ Introduction          │  │    │  │ Introduction          │  │
│  │ ══════════════        │  │    │  │ ══════════════        │  │
│  │                       │  │    │  │                       │  │
│  │ Welcome to our        │  │    │  │ Welcome to our        │  │
│  │ documentation.        │  │    │  │ documentation.        │  │
│  │                       │  │    │  │                       │  │
│  │ [white background]    │  │    │  │ [dark background]     │  │
│  └───────────────────────┘  │    │  └───────────────────────┘  │
└─────────────────────────────┘    └─────────────────────────────┘
```

**Settings options:**

```json
{
  "ditacraft.previewTheme": "auto"  // "auto", "light", or "dark"
}
```

The preview panel automatically detects theme changes and updates instantly—no refresh needed.

### Print Preview Mode

Need to share your documentation or review it in print format? Click the **Print** button in the preview toolbar. The print dialog opens with optimized styling—proper margins, page breaks, and print-friendly fonts.

### Custom CSS Styling

Want to match your organization's style guide? Add custom CSS that applies to all previews:

```json
{
  "ditacraft.previewCustomCss": "body { font-family: 'Segoe UI', sans-serif; } h1 { color: #0066cc; }"
}
```

Or point to an external stylesheet:

```json
{
  "ditacraft.previewCustomCss": "@import url('file:///C:/styles/company-docs.css');"
}
```

This is perfect for:
- Matching corporate branding
- Testing different typography
- Previewing with customer-specific styles

### Auto-Refresh on Save

By default, the preview updates automatically when you save your file. For large documents where you want more control:

```json
{
  "ditacraft.previewAutoRefresh": false
}
```

Then use the **Refresh** button manually when you're ready to see changes.

---

## Map Visualizer: See Your Documentation Structure

DITA maps can get complex. Nested topicrefs, chapters, appendices, key definitions—it's easy to lose track of the overall structure when you're looking at XML. The new Map Visualizer gives you a bird's-eye view.

### Opening the Visualizer

Open any `.ditamap` or `.bookmap` file and run:

```
DitaCraft: Show Map Visualizer
```

A new panel opens showing your entire map as an interactive tree:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Map Visualizer: user-guide.ditamap                    [↻] [−] [+]     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  📘 User Guide                                                          │
│  ├── 📑 Chapter 1: Getting Started                                      │
│  │   ├── 📄 Introduction                                                │
│  │   ├── 📄 Installation                                                │
│  │   └── 📄 Quick Start                                                 │
│  ├── 📑 Chapter 2: Core Features                                        │
│  │   ├── 📄 Feature Overview                                            │
│  │   ├── 📄 Configuration                                               │
│  │   └── 📄 Advanced Settings                                           │
│  ├── 📑 Chapter 3: Tutorials                                            │
│  │   ├── 📄 Basic Tutorial                                              │
│  │   └── 📄 Advanced Tutorial                                           │
│  ├── 📎 Appendix A: Reference                                           │
│  │   └── 📄 API Reference                                               │
│  └── 🔑 Key Definitions                                                 │
│      ├── 🔑 product-name                                                │
│      └── 🔑 version                                                     │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│  Legend: 📘 Map  📑 Chapter  📄 Topic  📎 Appendix  📚 Part  🔑 Keydef  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Visual Node Types

Each element type has its own icon, making it easy to scan the structure:

| Icon | Type | Description |
|------|------|-------------|
| 📘 | Map/Bookmap | Root container |
| 📑 | Chapter | Major sections |
| 📄 | Topic | Individual topics |
| 📎 | Appendix | Back matter |
| 📚 | Part | Book parts |
| 🔑 | Keydef | Key definitions |

### Interactive Navigation

The Map Visualizer isn't just for viewing—it's for navigating:

- **Click any node** → Opens that file in the editor
- **Hover over a node** → Shows file path and metadata
- **Missing files** → Highlighted in red with ⚠️ indicator

```
├── 📄 installation.dita              ← Click to open
├── 📄 ⚠️ missing-topic.dita (!)      ← File not found - red highlight
└── 📄 configuration.dita
```

### Error Detection

The visualizer automatically detects problems in your map:

- **Missing files** — Referenced topics that don't exist
- **Broken references** — Invalid href values
- **Circular references** — Maps that reference themselves (prevented automatically)

No more discovering broken links during publishing—catch them while you write.

### Supported Map Types

The visualizer works with all DITA map types:

- **Standard maps** (`.ditamap`) — Basic topic collections
- **Bookmaps** (`.bookmap`) — With frontmatter, chapters, appendices, backmatter
- **Subject scheme maps** — For controlled vocabularies

### Toolbar Controls

- **↻ Refresh** — Reload the map structure after changes
- **− Collapse All** — Collapse to top-level nodes only
- **+ Expand All** — Show the complete structure

---

## Enhanced Output Panel: Build Intelligence

The third major feature transforms the DITA-OT output from a wall of text into an intelligent, navigable log.

### Syntax-Highlighted Build Output

When you run a publish command, the output channel now shows syntax-highlighted logs:

```
╔═══════════════════════════════════════════════════════════════════════╗
║  DITA-OT Build Started                                                ║
║  2024-01-15 14:32:05                                                  ║
╚═══════════════════════════════════════════════════════════════════════╝

[INFO]  Processing: user-guide.ditamap
[INFO]  Transtype: html5
[INFO]  Output directory: C:/projects/docs/out/html5
[DEBUG] Loading plugins...
[DEBUG] Initializing preprocessing...
[WARN]  ⚠ Missing navtitle for topicref: chapter3.dita
[INFO]  Processing topic: introduction.dita
[INFO]  Processing topic: installation.dita
[ERROR] ✖ DOTX001E: Topic not found: missing-topic.dita
[INFO]  Processing topic: configuration.dita
[INFO]  Generating HTML5 output...

╔═══════════════════════════════════════════════════════════════════════╗
║  Build completed in 4.2s                                              ║
║  Status: FAILED (1 error, 1 warning)                                  ║
║  Output: C:/projects/docs/out/html5                                   ║
╚═══════════════════════════════════════════════════════════════════════╝
```

Each log level gets distinct styling:
- **[ERROR]** — Red background, immediately visible
- **[WARN]** — Yellow/orange, catches attention
- **[INFO]** — Standard text
- **[DEBUG]** — Dimmed, for detailed troubleshooting

### Automatic Log Level Detection

DitaCraft automatically detects log levels from DITA-OT output patterns:

```
[DOTX001E] → Error   (E suffix = Error)
[DOTJ003W] → Warning (W suffix = Warning)
[DOTX005I] → Info    (I suffix = Info)
[INFO]     → Info    (Standard marker)
SEVERE:    → Error   (Java logging format)
BUILD FAILED → Error (Ant build failure)
```

No configuration needed—it just works.

### Clickable Error Links

This is a game-changer for debugging. When DITA-OT reports an error with a file path, **click it to jump directly to that file**:

```
[ERROR] DOTX001E: Topic not found
        File: src/topics/missing-chapter.dita:15:8
              ↑ Click to open at line 15, column 8
```

### Problems Panel Integration

Errors don't just appear in the output—they show up in VS Code's **Problems** panel:

```
PROBLEMS (3)
─────────────────────────────────────────────────────────────────────────
▼ user-guide.ditamap
    ⚠ Warning  Missing navtitle for topicref           line 15, col 5
    ✖ Error    DOTX001E: Topic not found               line 23, col 9

▼ chapter2.dita
    ✖ Error    Invalid element 'bogus' in context      line 42, col 13
─────────────────────────────────────────────────────────────────────────
```

This means you can:
- See all build errors at a glance
- **Click** to navigate directly to the problem
- Press **F8** to cycle through errors
- **Filter** by severity (errors only, warnings only)

### Build Timestamps and Duration

Every build shows timing information:
- **Start time** — When the build began
- **Duration** — How long it took
- **Status** — Success, failed, or success with warnings

This helps you:
- Track build performance over time
- Identify slow builds that need optimization
- Quickly see if a build succeeded without scrolling

---

## Configuration Reference

Here's a quick reference for all the new settings:

```json
{
  // Preview Settings
  "ditacraft.previewAutoRefresh": true,
  "ditacraft.previewScrollSync": true,
  "ditacraft.previewTheme": "auto",
  "ditacraft.previewCustomCss": "",

  // Logging Settings
  "ditacraft.logLevel": "info"
}
```

| Setting | Default | Description |
|---------|---------|-------------|
| `previewAutoRefresh` | `true` | Auto-update preview on file save |
| `previewScrollSync` | `true` | Sync scroll position between source and preview |
| `previewTheme` | `"auto"` | Preview theme: `"auto"`, `"light"`, or `"dark"` |
| `previewCustomCss` | `""` | Custom CSS for preview styling |
| `logLevel` | `"info"` | Output verbosity: `"debug"`, `"info"`, `"warn"`, `"error"` |

---

## All New Commands

v0.4.0 adds these commands to the command palette:

| Command | Description |
|---------|-------------|
| `DitaCraft: Preview HTML5` | Open live preview for current file |
| `DitaCraft: Show Map Visualizer` | Visualize DITA map structure |
| `DitaCraft: Publish to HTML5` | Build HTML5 output |
| `DitaCraft: Validate Current File` | Run validation on active file |

Access them via `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) and type "DitaCraft".

---

## Getting Started

### Installation

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X`)
3. Search for **"DitaCraft"**
4. Click **Install**

Or install from the command line:

```bash
code --install-extension JeremyJeanne.ditacraft
```

### Requirements

- **VS Code** 1.85.0 or higher
- **DITA-OT** 3.x or 4.x (for publishing and preview features)
- **xmllint** (optional, for enhanced validation)

### Quick Start

1. Open a folder containing DITA files
2. Open any `.dita` or `.ditamap` file
3. Run `DitaCraft: Preview HTML5` from the command palette
4. Start editing—your preview updates automatically!

For maps, try `DitaCraft: Show Map Visualizer` to see your documentation structure at a glance.

---

## What's Next?

DitaCraft v0.4.0 is a significant step forward, but we're not stopping here. On the roadmap:

- **Conref Preview** — See resolved content references in the preview
- **Key Space Explorer** — Browse and search your key definitions
- **PDF Preview** — Direct PDF preview without leaving VS Code
- **DITA-OT Plugin Manager** — Install and manage plugins from VS Code

---

## Try It Today

DitaCraft is open source and free to use. Install it from the VS Code Marketplace and transform your DITA authoring experience.

**Links:**
- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=JeremyJeanne.ditacraft)
- [GitHub Repository](https://github.com/jyjeanne/ditacraft)
- [Documentation](https://github.com/jyjeanne/ditacraft#readme)

Have feedback or feature requests? Open an issue on GitHub—we'd love to hear from you.

---

*DitaCraft is developed by Jeremy Jeanne. Special thanks to all contributors and the DITA community for their feedback and support.*

**Tags:** #DITA #VSCode #TechnicalWriting #Documentation #XML #OpenSource
