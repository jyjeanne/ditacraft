# DitaCraft — AI Features End-to-End Test Plan

**Version:** 0.7.3  
**Date:** June 2026  
**Scope:** All LLM/AI features added in Phases 1–3 of the LLM integration spec.  
**Provider under test:** GitHub Copilot (installed locally)

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Test Workspace Setup](#2-test-workspace-setup)
3. [T01 — Configure AI Panel](#t01--configure-ai-panel)
4. [T02 — @ditacraft /restructure](#t02--ditacraft-restructure)
5. [T03 — @ditacraft /validate](#t03--ditacraft-validate)
6. [T04 — @ditacraft /explain](#t04--ditacraft-explain)
7. [T05 — @ditacraft /suggest-reuse](#t05--ditacraft-suggest-reuse)
8. [T06 — F2: Restructure Map Command](#t06--f2-restructure-map-command)
9. [T07 — F3: AI Quick Fix](#t07--f3-ai-quick-fix)
10. [T08 — F4: AI Completion](#t08--f4-ai-completion)
11. [T09 — Circuit Breaker](#t09--circuit-breaker)
12. [T10 — Metrics Telemetry](#t10--metrics-telemetry)
13. [T11 — Configuration Conflict Guard](#t11--configuration-conflict-guard)
14. [Regression Checklist](#regression-checklist)

---

## 1. Prerequisites

### Software

| Requirement | Version | Check |
|---|---|---|
| VS Code | 1.120+ | `Help → About` |
| GitHub Copilot extension | Latest | Extensions view |
| GitHub Copilot Chat extension | Latest | Extensions view |
| DitaCraft extension | 0.7.3 | Extensions view |
| Node.js (for build only) | 18.x or 20.x | `node -v` |

### GitHub Copilot

- [ ] You are signed in to GitHub with an active Copilot subscription.
- [ ] Copilot Chat is functional: open Chat panel (`Ctrl+Alt+I`) and send a test message.
- [ ] **DitaCraft AI mode** is set to `auto` (default) in Settings:
  `ditacraft.ai.mode = "auto"`

### DitaCraft Extension

- [ ] Build the extension from source: `npm run compile` (or use a packaged `.vsix`).
- [ ] DitaCraft output channel is visible: `View → Output → DitaCraft`.
- [ ] Language Server is running: open any `.dita` file and confirm diagnostics appear.

---

## 2. Test Workspace Setup

Create a folder (e.g. `ai-test-workspace/`) with the following files.

> **Tip:** You can create these files manually or paste the XML below into VS Code directly.

### `product-guide.ditamap`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">
<map title="Product Guide">
  <topicmeta>
    <prodinfo><prodname>Acme Widget</prodname><vrmlist><vrm version="3.0"/></vrmlist></prodinfo>
  </topicmeta>
  <topicref href="overview.dita"/>
  <topicref href="install-windows.dita"/>
  <topicref href="install-linux.dita"/>
  <topicref href="config.dita"/>
  <topicref href="troubleshoot.dita"/>
  <topicref href="faq.dita"/>
  <topicref href="release-notes.dita"/>
</map>
```

### `overview.dita`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE concept PUBLIC "-//OASIS//DTD DITA Concept//EN" "concept.dtd">
<concept id="overview">
  <title>Product Overview</title>
  <shortdesc>The Acme Widget is a powerful automation tool for enterprise workflows.</shortdesc>
  <conbody>
    <p>This guide covers installation, configuration, and troubleshooting for Acme Widget 3.0.</p>
    <p>Supported platforms: Windows 10/11, Ubuntu 22.04+, macOS 13+.</p>
  </conbody>
</concept>
```

### `install-windows.dita`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE task PUBLIC "-//OASIS//DTD DITA Task//EN" "task.dtd">
<task id="install-windows">
  <title>Installing on Windows</title>
  <shortdesc>How to install Acme Widget on Windows 10 or Windows 11.</shortdesc>
  <taskbody>
    <prereq><p>Administrator privileges required.</p></prereq>
    <steps>
      <step><cmd>Download the installer from <xref href="https://acme.example.com/download" scope="external" format="html">acme.example.com</xref>.</cmd></step>
      <step><cmd>Run <filepath>acme-widget-3.0-setup.exe</filepath> as Administrator.</cmd></step>
      <step><cmd>Follow the installation wizard and accept the license agreement.</cmd></step>
      <step><cmd>Click <uicontrol>Finish</uicontrol> to complete the installation.</cmd></step>
    </steps>
    <result><p>Acme Widget is installed in <filepath>C:\Program Files\Acme Widget</filepath>.</p></result>
  </taskbody>
</task>
```

### `install-linux.dita`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE task PUBLIC "-//OASIS//DTD DITA Task//EN" "task.dtd">
<task id="install-linux">
  <title>Installing on Linux</title>
  <shortdesc>How to install Acme Widget on Ubuntu 22.04 or later.</shortdesc>
  <taskbody>
    <prereq><p>sudo privileges required.</p></prereq>
    <steps>
      <step><cmd>Add the Acme repository: <codeph>sudo add-apt-repository ppa:acme/widget</codeph></cmd></step>
      <step><cmd>Update package list: <codeph>sudo apt update</codeph></cmd></step>
      <step><cmd>Install: <codeph>sudo apt install acme-widget</codeph></cmd></step>
    </steps>
  </taskbody>
</task>
```

### `config.dita`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE task PUBLIC "-//OASIS//DTD DITA Task//EN" "task.dtd">
<task id="config">
  <title>Configuring Acme Widget</title>
  <shortdesc>Initial configuration steps after installation.</shortdesc>
  <taskbody>
    <steps>
      <step><cmd>Open <filepath>config.yaml</filepath> in a text editor.</cmd></step>
      <step><cmd>Set the <parmname>api_key</parmname> value to your license key.</cmd></step>
      <step><cmd>Restart the Acme Widget service.</cmd></step>
    </steps>
  </taskbody>
</task>
```

### `troubleshoot.dita`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE reference PUBLIC "-//OASIS//DTD DITA Reference//EN" "reference.dtd">
<reference id="troubleshoot">
  <title>Troubleshooting</title>
  <shortdesc>Common issues and their resolutions.</shortdesc>
  <refbody>
    <table>
      <tgroup cols="2">
        <colspec colname="c1" colwidth="1*"/>
        <colspec colname="c2" colwidth="2*"/>
        <thead><row><entry>Problem</entry><entry>Solution</entry></row></thead>
        <tbody>
          <row><entry>Service won't start</entry><entry>Check that port 8080 is not in use.</entry></row>
          <row><entry>License invalid</entry><entry>Verify the api_key in config.yaml.</entry></row>
        </tbody>
      </tgroup>
    </table>
  </refbody>
</reference>
```

### `faq.dita` — intentional validation errors for T03/T07

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE concept PUBLIC "-//OASIS//DTD DITA Concept//EN" "concept.dtd">
<concept id="faq">
  <title>Frequently Asked Questions</title>
  <conbody>
    <section id="faq"><!-- DUPLICATE ID — triggers DITA-ID-002 -->
      <title>General</title>
      <p>Q: Is a trial available?</p>
      <p>A: Yes, a 30-day trial is available on the website.</p>
    </section>
    <section><!-- MISSING required id attribute — triggers DITA-STRUCT warning -->
      <title>Licensing</title>
      <p>Q: How many devices can I install on?</p>
    </section>
  </conbody>
</concept>
```

### `release-notes.dita`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE reference PUBLIC "-//OASIS//DTD DITA Reference//EN" "reference.dtd">
<reference id="release-notes">
  <title>Release Notes</title>
  <shortdesc>What's new in Acme Widget 3.0.</shortdesc>
  <refbody>
    <section id="v3-0"><title>Version 3.0</title>
      <ul>
        <li>New dashboard UI</li>
        <li>REST API v2 support</li>
        <li>Linux ARM64 support</li>
      </ul>
    </section>
  </refbody>
</reference>
```

---

## T01 — Configure AI Panel

**Objective:** Verify the Configure AI WebView opens, shows provider status, and stores API keys securely.

### Steps

1. Open the Command Palette (`Ctrl+Shift+P`) and run **DitaCraft: Configure AI**.
2. Verify the webview panel opens titled **DitaCraft AI Settings**.

### Expected Results

- [ ] Panel opens without errors in the developer console (`Help → Toggle Developer Tools → Console`).
- [ ] **Provider Status** section shows:
  - `GitHub Copilot` — ✅ Available (since Copilot is installed)
  - `Anthropic (Claude)` — ⚠ Not configured (no key set)
  - `OpenAI (GPT-4o)` — ⚠ Not configured
  - `Ollama` — Status depends on whether Ollama is running locally
- [ ] The panel contains no XSS vulnerabilities: provider names are HTML-escaped (check via DevTools → Elements).
- [ ] Entering an Anthropic key (`sk-ant-test123...`) and clicking **Save** shows a ✅ confirmation message.
- [ ] Refreshing the panel shows the key is still stored (persisted via VS Code SecretStorage).
- [ ] Setting **AI Mode** to `copilot-only` and saving dismisses the panel; reopening shows `copilot-only` selected.

### Cleanup

- Reset mode to `auto`.

---

## T02 — @ditacraft /restructure

**Objective:** Verify the Chat Participant can restructure a DITA map via Copilot.

### Steps

1. Open `product-guide.ditamap` in the editor (make it the active tab).
2. Open Copilot Chat (`Ctrl+Alt+I`).
3. Type: `@ditacraft /restructure Group installation topics first, then concepts, then reference`
4. Press Enter and wait for the response (up to 30 seconds).

### Expected Results

- [ ] Chat shows a progress indicator: *"Building DITA context snapshot…"*.
- [ ] Response streams progressively (character-by-character or chunk-by-chunk).
- [ ] The response contains valid DITA XML with `<map>` root element.
- [ ] All original `href` attributes are preserved exactly (e.g. `href="overview.dita"`).
- [ ] Footer shows: *"Powered by copilot · Validated by DitaCraft LSP"*.
- [ ] No `❌ Error:` prefix in the response.

### Edge Cases

- [ ] **No active ditamap:** Close all editors, then run `/restructure`. Expect: *"⚠ No `.ditamap` file is active."*
- [ ] **Empty intention:** Run `@ditacraft /restructure` with no text. Expect: *"❓ Please provide your restructuring intention."*

---

## T03 — @ditacraft /validate

**Objective:** Verify AI can explain a DITA validation error at the cursor.

### Steps

1. Open `faq.dita`.
2. Wait for diagnostics to appear (red squiggles). There should be at least one duplicate ID warning.
3. Click inside the duplicate `id="faq"` section element (line ~5).
4. Open Copilot Chat and type: `@ditacraft /validate`
5. Press Enter.

### Expected Results

- [ ] Response header shows the diagnostic code (e.g. `DITA-ID-002`).
- [ ] Response contains a plain-language explanation of the duplicate ID error.
- [ ] Response includes a concrete correction example (what to change).
- [ ] Footer shows: *"💡 Use `Ctrl+.` to apply AI Quick Fixes directly in the editor."*
- [ ] Response is ≤ ~300 words (LLM system prompt instructs conciseness).

### Edge Cases

- [ ] **No diagnostics:** Open `overview.dita` (no errors), run `/validate`. Expect: *"✅ No diagnostics found."*
- [ ] **With user question:** Run `@ditacraft /validate why does DITA require unique IDs?` — the user question should appear in the response header.

---

## T04 — @ditacraft /explain

**Objective:** Verify AI can explain the semantic structure of a selected DITA element.

### Steps

1. Open `install-windows.dita`.
2. Select the entire `<steps>…</steps>` block (lines 10–16).
3. Open Copilot Chat and type: `@ditacraft /explain`
4. Press Enter.

### Expected Results

- [ ] Response header shows the first 200 chars of the selected XML in a code fence.
- [ ] Response explains that `<steps>` is a DITA task element containing ordered `<step>` children.
- [ ] Response mentions the element's role in the task information type.
- [ ] No user prompt text appears inside the XML code fence in the header.
- [ ] Response uses markdown formatting (headers, bold, code snippets).

### Variant — With focus instruction

1. Select a single `<step>` element.
2. Run: `@ditacraft /explain focus on accessibility best practices`
3. Expect the response to address accessibility aspects of `<step>/<cmd>`.

### Edge Cases

- [ ] **Nothing selected, cursor on a line:** `/explain` uses the current line. Response is still meaningful.
- [ ] **No active file:** Expect: *"⚠ No file is active."*

---

## T05 — @ditacraft /suggest-reuse

**Objective:** Verify AI identifies conref/keyref reuse opportunities.

### Steps

1. Open `product-guide.ditamap` (make it the active tab).
2. Open Copilot Chat and type: `@ditacraft /suggest-reuse`
3. Press Enter and wait for the response.

### Expected Results

- [ ] Progress indicator: *"Analyzing map structure…"*.
- [ ] Response lists at least 2–3 concrete reuse opportunities, e.g.:
  - Variable text (product name "Acme Widget") → `<keyword keyref="product-name"/>`
  - Common prerequisite steps across install tasks → `<conref>`
  - Repeated platform references → keyrefs
- [ ] Each suggestion includes: what to reuse, which topics are affected, and a code example.
- [ ] Footer shows the conkeyref/keyref tip.
- [ ] Response is grounded in the actual map structure (mentions real hrefs like `install-windows.dita`).

### Variant — With focus

Run: `@ditacraft /suggest-reuse focus on the installation topics only`

Expect the response to limit suggestions to `install-windows.dita` and `install-linux.dita`.

### Edge Cases

- [ ] **Non-map file active:** Open `overview.dita`, run `/suggest-reuse`. Expect: *"⚠ No `.ditamap` file is active."*

---

## T06 — F2: Restructure Map Command

**Objective:** Verify the command-palette / context-menu restructure flow with diff preview and apply.

### Steps

1. Open `product-guide.ditamap` (make it active).
2. Open Command Palette and run **DitaCraft: Restructure Map with AI**.
   - *Alternative:* Right-click the file in Explorer → **Restructure Map with AI**.
3. In the InputBox that appears, type: `Group by platform: one group for Windows, one for Linux`
4. Press Enter and wait.
5. A **diff editor** opens showing the current map vs. the proposed restructure.
6. A modal dialog appears: **Apply restructured map?** with **Apply** and **Cancel** buttons.

### Expected Results

- [ ] InputBox prompt is clear: *"Describe your restructuring intention…"*
- [ ] Diff editor opens with **original** (left) and **proposed** (right) content.
- [ ] The proposed XML in the diff is valid DITA (no broken tags, all hrefs preserved).
- [ ] Clicking **Apply** closes the diff and updates `product-guide.ditamap` in-place.
- [ ] Undo (`Ctrl+Z`) restores the original content.
- [ ] Clicking **Cancel** closes the diff without modifying the file.

### Edge Cases

- [ ] **Non-map file:** Run the command with `overview.dita` active. Expect an error notification: *"No .ditamap file active."*
- [ ] **Empty intention:** Press Enter without typing. Command should either prompt again or show an error.

---

## T07 — F3: AI Quick Fix

**Objective:** Verify AI Quick Fix code actions appear for DITA diagnostics and apply fixes.

### Steps

1. Open `faq.dita`.
2. In the `<section>` element that is missing a required attribute, wait for its diagnostic to appear (`DITA-STRUCT-003` or similar structural warning).
3. Click on the squiggle or press `Ctrl+.` on the flagged element.
4. In the code actions lightbulb menu, look for: **✨ Fix with DitaCraft AI**.
5. Select the AI quick fix action.
6. Wait for the fix to be applied (up to 10 seconds).

### Expected Results

- [ ] **✨ Fix with DitaCraft AI** appears in the code actions menu.
- [ ] Progress notification: *"Applying AI fix…"* appears in the bottom-right.
- [ ] After applying: the element is corrected (e.g. a missing `id` attribute is added).
- [ ] The fix passes LSP validation: the diagnostic disappears after the fix is applied.
- [ ] Undo (`Ctrl+Z`) reverts the fix.

### Verify AI-fixable code set

The following codes should show the AI quick fix option:

| Code | Trigger condition |
|---|---|
| `DITA-CM-001/002/003` | Invalid child element (content model violation) |
| `DITA-XREF-001` | Broken href target file |
| `DITA-STRUCT-003/004/005` | Missing required attribute or structural violation |
| `DITA-STRUCT-008` | Missing topicref target |
| `DITA-XREF-003/004` | Broken conref or cross-reference |
| `DITA-DTD-001`, `DITA-RNG-001` | DTD or RelaxNG schema violation |

### Edge Cases

- [ ] **Non-AI-fixable code:** A duplicate ID (`DITA-ID-002`) should NOT show the AI quick fix option — use the built-in "Fix Duplicate ID" quick fix instead.

---

## T08 — F4: AI Completion

**Objective:** Verify AI-enriched completions appear for DITA elements within the 500ms budget.

### Steps

1. Open `overview.dita`.
2. Place the cursor inside `<conbody>` after the existing `<p>` elements.
3. Start typing `<` to trigger completions.
4. Wait up to 1 second for the completion list.

### Expected Results

- [ ] Native LSP completions appear (e.g. `<p>`, `<section>`, `<ul>`).
- [ ] AI completions appear with **(AI)** suffix (e.g. `<note> (AI)`, `<table> (AI)`).
- [ ] AI items are sorted **below** LSP items (sort key starts with `zzz`).
- [ ] AI items have detail label: `DitaCraft AI`.
- [ ] Selecting an AI completion inserts the bare tag text (not `<p> (AI)`).
- [ ] The total completion latency is ≤ 1 second (LSP items appear immediately; AI may arrive up to 500ms later).

### Verify cancellation

1. Type `<` to trigger completions.
2. Immediately press `Escape` to dismiss.
3. Confirm no errors in the output channel (the abandoned LLM call should be cancelled silently).

### Disable AI completion

1. Set `ditacraft.ai.completion.enabled = false` in Settings.
2. Open a DITA file and trigger completions.
3. Confirm no `(AI)` items appear.
4. Re-enable the setting.

---

## T09 — Circuit Breaker

**Objective:** Verify the circuit breaker opens after 3 provider failures and recovers after cooldown.

> ⚠️ This test requires temporarily simulating provider failures. Do not run in a production workspace.

### Steps — Simulating via Ollama

1. Enable Ollama provider in Settings and set a non-existent base URL:
   - `ditacraft.ai.provider.ollama.enabled = true`
   - Create a custom setting override to point Ollama at `http://localhost:19999` (no server running).
2. Set AI mode to `local-only` so only Ollama is used.
3. Open `product-guide.ditamap` and run **Restructure Map with AI** three times in quick succession.
4. Check the DitaCraft output channel.

### Expected Results

- [ ] First 1–2 calls fail with a connection error notification.
- [ ] After the 3rd failure, **no further calls** are attempted (circuit is OPEN).
- [ ] Output channel shows something like: *"Circuit open for provider ollama"*.
- [ ] After 10 minutes (or by reloading the extension), calls are attempted again (HALF_OPEN probe).

### Cleanup

- Reset `ditacraft.ai.mode` to `auto`.
- Disable Ollama or restore the correct base URL.

---

## T10 — Metrics Telemetry

**Objective:** Verify AI call metrics are logged to the output channel when telemetry is enabled.

### Steps

1. Enable telemetry: set `ditacraft.ai.telemetry.enabled = true` in Settings.
2. Open DitaCraft output channel: `View → Output → DitaCraft`.
3. Run any AI feature (e.g. `@ditacraft /validate` on `faq.dita`).

### Expected Results

- [ ] Output channel shows a metrics line, e.g.:
  `[AI] ✔ validate via copilot 1842ms ~340tok`
- [ ] Format: `[AI] <✔|✘> <command> via <provider> <ms>ms ~<tokens>tok`
- [ ] Successful calls show ✔; failed calls show ✘.
- [ ] Fallback calls show `[fallback]` tag.

### Verify disabled

1. Set `ditacraft.ai.telemetry.enabled = false`.
2. Run another AI call.
3. Confirm **no** `[AI]` lines appear in the output channel.

---

## T11 — Configuration Conflict Guard

**Objective:** Verify the extension shows a clear error when `local-only` mode + Ollama disabled creates an impossible configuration.

### Steps

1. Open VS Code Settings (`Ctrl+,`).
2. Set:
   - `ditacraft.ai.mode` → `local-only`
   - `ditacraft.ai.provider.ollama.enabled` → `false`
3. Reload the VS Code window (`Ctrl+Shift+P` → **Developer: Reload Window**).

### Expected Results

- [ ] A **red error notification** appears (not a yellow warning):
  *"DitaCraft AI: Configuration conflict — 'local-only' mode requires Ollama, but Ollama is disabled. Enable Ollama or change the AI mode in Settings → DitaCraft AI."*
- [ ] Running any AI command gracefully shows: *"No LLM provider available."*
- [ ] The error is specific — not the generic *"No LLM provider available"* warning.

### Cleanup

- Reset both settings to defaults (`auto` / `true`).

---

## Regression Checklist

After running all AI tests, verify that non-AI DitaCraft features are unaffected:

| Feature | Action | Expected |
|---|---|---|
| Validation | Open `faq.dita` | Diagnostics appear (DITA-ID-002 etc.) |
| Completion | Type `<` in any `.dita` file | LSP element completions appear |
| Hover | Hover over a DITA element | Tooltip with attribute docs appears |
| Go to Definition | `F12` on an `href` | Navigates to target file |
| Rename | `F2` on an `id` attribute | Renames all references |
| Format | `Shift+Alt+F` | Document is formatted without errors |
| Key Space | Open Key Space view | Keys from map are listed |
| DITA Explorer | Check Explorer panel | Map hierarchy tree renders |
| Output Channel | Check `DitaCraft` channel | No unexpected errors |

---

## Scoring

| Category | Tests | Pass | Fail |
|---|---|---|---|
| T01 Configure AI | 7 | | |
| T02 /restructure | 5 | | |
| T03 /validate | 5 | | |
| T04 /explain | 6 | | |
| T05 /suggest-reuse | 5 | | |
| T06 F2 Restructure | 6 | | |
| T07 F3 Quick Fix | 5 | | |
| T08 F4 Completion | 6 | | |
| T09 Circuit Breaker | 4 | | |
| T10 Telemetry | 4 | | |
| T11 Config Conflict | 3 | | |
| Regression | 9 | | |
| **TOTAL** | **65** | | |

---

## Notes

- **AI non-determinism:** LLM responses vary. Focus on structure and format correctness, not exact wording.
- **Latency:** Tests assume a responsive network connection to GitHub Copilot. VPN or proxies may increase latency.
- **Token limits:** If a map is very large (>200 topics), the context snapshot uses the Level 3 sliding window — the response may not reference topics outside the window. This is expected behaviour.
- **Ollama tests (T09):** Require Ollama running locally (`http://localhost:11434`). Skip T09 if Ollama is not installed.
