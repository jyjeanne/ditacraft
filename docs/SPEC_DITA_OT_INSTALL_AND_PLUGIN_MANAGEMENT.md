# Specification: DITA-OT Installer & Plugin Management

**Version:** 1.0  
**Status:** Draft  
**Target version:** TBD

---

## 1. Overview

This specification defines two new DITA-OT productivity features in DitaCraft:

1. **Install DITA-OT from within VS Code settings**, with a version picker and target folder selection.
2. **Manage DITA-OT plugins for an existing local DITA-OT installation**, including:
   - Listing currently installed plugins
   - Installing plugins from the online DITA-OT plugin registry

These features are **client-side only** and integrate with the existing `DitaOtWrapper`, command registration, and settings UI.

---

## 2. Goals and Non-Goals

### 2.1 Goals

- Reduce manual setup friction for new users (no manual download/extract required).
- Keep DITA-OT path configuration authoritative in `ditacraft.ditaOtPath`.
- Expose plugin inventory and installation flow from inside the extension.
- Reuse existing command/output/progress patterns already used by publish/validate flows.

### 2.2 Non-Goals (v1)

- Plugin uninstall/update/remove.
- Editing custom registry URLs from UI.
- Managing multiple DITA-OT installs in one workspace profile.
- Automatic DITA-OT upgrades.

---

## 3. User Stories

1. As a new user, I can install DITA-OT from Settings without leaving VS Code.
2. As a user, I can choose the exact DITA-OT version to install from a supported list.
3. As a user, I can install into a target directory I choose.
4. As a user with local DITA-OT installed, I can view currently installed plugins.
5. As a user, I can install a new plugin from the online registry by selecting plugin + version.

---

## 4. Functional Requirements

## 4.1 Feature A — DITA-OT Download & Install

### A1. Entry points

- Add command: `ditacraft.installDitaOT`
- Surface in command palette.
- Surface from settings by adding setting descriptions with command links (via `markdownDescription`), e.g.:
  - `ditacraft.ditaOtPath`
  - new optional install helper settings (see Section 5)

### A2. Install workflow

1. Check prerequisites (network availability, writable target directory, no active conflicting install).
2. Ask user for:
   - DITA-OT version (from defined source list)
   - Target directory
3. Download selected release archive.
4. Validate archive integrity (at minimum download success + expected archive format).
5. Extract archive safely (zip-slip prevention).
6. Detect extracted DITA-OT root folder.
7. Validate installation structure (`bin/`, runnable `dita` script).
8. Update `ditacraft.ditaOtPath` to installed path.
9. Verify with existing `verifyInstallation()` and show success message including resolved version/path.

### A3. Version source

Version list should come from one of:

- Preferred: official GitHub releases (`dita-ot/dita-ot`)
- Fallback: curated static list in extension constants when online retrieval fails

### A4. Error handling

Clear user-facing errors for:
- Download failure / timeout
- Permission denied on target folder
- Corrupted archive / extraction failure
- Post-install verification failure

No silent fallback to partial success.

## 4.2 Feature B — Plugin Management

### B1. Entry point

- Add command: `ditacraft.manageDitaOtPlugins`

### B2. Guard

Before any plugin action:
- Resolve local DITA-OT using existing wrapper config.
- Run `verifyInstallation()`.
- If unavailable, show actionable error with button to run configure/install command.

### B3. List installed plugins

- Execute DITA-OT CLI `plugins` (existing install path or PATH fallback).
- Parse output lines like:
  - `plugin.id@1.2.3`
  - `plugin.id`
- Display in QuickPick/table-like list with plugin id and version.

### B4. Install plugin from registry

Support install by:
- `plugin.id` (latest compatible)
- `plugin.id@version` (specific version)

Execution path:
- Run `dita install <id>` or `dita install <id>@<version>`
- Stream output to existing DITA-OT output channel
- Return success/failure status with parsed highlights

### B5. Registry source

Registry discovery data source:
- Preferred endpoint: `https://plugins.dita-ot.org/_all.json`
- Fallback: GitHub `dita-ot/registry` JSON files list if endpoint unavailable

### B6. Plugin install UX

Recommended flow:
1. Action picker: `List installed plugins` / `Install from registry`
2. If install:
   - fetch searchable plugin catalog
   - choose plugin id
   - optional version picker (latest default)
   - confirm install
3. Show progress and final status
4. Offer immediate refresh of installed list

---

## 5. Settings and Command Contributions

## 5.1 New commands (`package.json`)

- `ditacraft.installDitaOT` — `DITA: Install DITA-OT`
- `ditacraft.manageDitaOtPlugins` — `DITA: Manage DITA-OT Plugins`

## 5.2 New settings (`package.json`)

1. `ditacraft.ditaOtInstallTargetDir` (string, default empty)  
   Optional default folder used by installer.

2. `ditacraft.ditaOtPreferredVersion` (string, default empty or `"latest"`)  
   Optional default preselection in version picker.

3. `ditacraft.ditaOtRegistryUrl` (string, default `"https://plugins.dita-ot.org/"`)  
   Advanced override for plugin registry base URL.

> Keep `ditacraft.ditaOtPath` as the runtime source of truth for publishing and validation.

---

## 6. Architecture and Integration Points

## 6.1 Files to add

- `src/commands/installDitaOtCommand.ts`
- `src/commands/manageDitaOtPluginsCommand.ts`
- `src/utils/ditaOtInstaller.ts` (download/extract/verify/update setting)
- `src/utils/ditaOtPluginManager.ts` (list/install/catalog parsing)

## 6.2 Files to modify

- `src/commands/index.ts` (exports)
- `src/extension.ts` (command registration)
- `src/utils/ditaOtWrapper.ts` (reusable low-level command runners if needed)
- `src/utils/configurationManager.ts` (new settings typing/defaults)
- `package.json` (commands + config schema)
- user docs in `docs/user-guide/topics/settings/*` and `docs/user-guide/topics/commands/*`

## 6.3 Reuse from existing code

- `DitaOtWrapper.verifyInstallation()`
- existing process execution/logging patterns (`ditaOtOutputChannel`)
- existing command error UX patterns from publish/validate commands

---

## 7. Security and Reliability Requirements

1. **Archive extraction safety:** reject zip entries escaping target root (zip-slip defense).
2. **Path validation:** continue using safe-path checks already present in wrapper config handling.
3. **No shell interpolation:** pass args arrays to spawned processes.
4. **Timeouts:** reuse configurable timeout patterns for long-running install/plugin operations.
5. **Atomic setting update:** update `ditacraft.ditaOtPath` only after successful verification.

---

## 8. Error Model and User Messages

All flows must return explicit failure states with actionable messages.

Examples:
- `"Failed to download DITA-OT 4.3.1: <reason>"`
- `"Installation directory is not writable: <path>"`
- `"DITA-OT installed but verification failed. Please run 'DITA: Configure DITA-OT Path'."`
- `"Plugin installation failed for org.example.plugin@1.0.0: <reason>"`

Do not show success-shaped messages when any required phase failed.

---

## 9. Testing Strategy

## 9.1 Unit tests (new)

- `src/test/suite/ditaOtInstaller.test.ts`
  - version list parsing
  - extraction guard (zip-slip)
  - install path resolution
  - setting update only on success

- `src/test/suite/ditaOtPluginManager.test.ts`
  - parsing `dita plugins` output
  - parsing registry catalog payload
  - building install commands (`id`, `id@version`)

## 9.2 Command tests

- `src/test/suite/installDitaOtCommand.test.ts`
- `src/test/suite/manageDitaOtPluginsCommand.test.ts`

Cover:
- guard failures
- happy path action flow
- error propagation to user-facing messages

## 9.3 Validation command

Run at minimum:
- `npm run test:shared` (if shared utils touched)
- `npm test` (client command integration coverage)

---

## 10. Documentation Updates

Update:
- `README.md` DITA-OT setup section
- `docs/user-guide/topics/settings/general-settings.dita`
- `docs/user-guide/topics/commands/publishing-commands.dita`
- settings overview pages for any new keys

Document:
- installer command usage
- plugin manager usage
- registry/network prerequisites
- known limitations

---

## 11. Development Phases and Detailed Tasks (LLM-Executable)

The tasks below are intentionally granular so a basic LLM can execute them reliably.

### Phase 1 — Settings & Command Surface

1. **Add command contributions in `package.json`:**  
   Insert `ditacraft.installDitaOT` and `ditacraft.manageDitaOtPlugins` under `contributes.commands` with user-facing titles.

2. **Add new setting schema entries in `package.json`:**  
   Add `ditacraft.ditaOtInstallTargetDir`, `ditacraft.ditaOtPreferredVersion`, and `ditacraft.ditaOtRegistryUrl` with types/defaults/descriptions/order.

3. **Add settings command links:**  
   Convert `ditacraft.ditaOtPath` description to `markdownDescription` and include links to run installer and manage plugin commands.

4. **Type new settings in `src/utils/configurationManager.ts`:**  
   Extend `DitaCraftConfiguration`, defaults object, and load logic for the three settings.

5. **Register commands in `src/extension.ts`:**  
   Import and register the two new command handlers in activate lifecycle, following existing command registration style.

6. **Export command handlers in `src/commands/index.ts`:**  
   Add exports for new command files.

### Phase 2 — DITA-OT Installer Core

1. **Create `src/utils/ditaOtInstaller.ts` skeleton:**  
   Define interfaces for release metadata, install options, and result objects.

2. **Implement version retrieval from GitHub releases:**  
   Add function that fetches releases for `dita-ot/dita-ot`, filters valid versions, and returns sorted list.

3. **Implement fallback version list:**  
   Add static list and fallback logic when online retrieval fails or times out.

4. **Implement archive download function:**  
   Download release archive to temp file with timeout and explicit failure messages.

5. **Implement safe extraction function:**  
   Extract archive into target directory and reject path traversal attempts.

6. **Implement install root detection:**  
   After extraction, locate folder containing `bin/dita` or `bin/dita.bat`.

7. **Implement post-install verification using `DitaOtWrapper.verifyInstallation()`:**  
   Validate install by temporarily pointing wrapper to extracted path or by direct script check, then confirm CLI version.

8. **Implement configuration update:**  
   Only when verification succeeds, update global `ditacraft.ditaOtPath`.

### Phase 3 — Installer Command UX

1. **Create `src/commands/installDitaOtCommand.ts`:**  
   Add command entry function with top-level error handling.

2. **Add version picker UI:**  
   Show QuickPick from installer version provider, preselect preferred version setting if available.

3. **Add target directory picker UI:**  
   Use configured default target directory when set, otherwise show folder picker.

4. **Add confirmation step:**  
   Display selected version and target path before download starts.

5. **Add progress UI:**  
   Show progress notification for download, extraction, verification.

6. **Add completion UX:**  
   On success show installed version/path and suggest testing with existing publish/preview command.

### Phase 4 — Plugin Manager Core

1. **Create `src/utils/ditaOtPluginManager.ts` skeleton:**  
   Define interfaces for installed plugin entries, registry catalog items, and install results.

2. **Implement `listInstalledPlugins()` via CLI:**  
   Run `dita plugins` and parse output into structured entries.

3. **Implement registry catalog fetch:**  
   Fetch from `https://plugins.dita-ot.org/_all.json` (or configured URL).

4. **Implement registry fallback provider:**  
   If registry endpoint fails, fetch JSON file list from `dita-ot/registry` and build minimal catalog.

5. **Implement `installPlugin(pluginId, version?)`:**  
   Run `dita install <id>` or `dita install <id>@<version>` and capture output.

6. **Implement output parsing:**  
   Return normalized success/failure with summarized reason for user messages.

### Phase 5 — Plugin Manager Command UX

1. **Create `src/commands/manageDitaOtPluginsCommand.ts`:**  
   Implement main action picker and flow coordinator.

2. **Implement installation guard:**  
   Verify DITA-OT installation first; on failure provide action to configure/install DITA-OT.

3. **Implement "List installed plugins" action:**  
   Show parsed plugin entries in QuickPick or information panel.

4. **Implement "Install from registry" action:**  
   Show searchable plugin picker, optional version picker, then confirmation.

5. **Add progress and logging:**  
   Show operation progress and pipe detailed output to DITA-OT output channel.

6. **Add post-install refresh prompt:**  
   Offer to refresh and reopen installed plugin list after successful install.

### Phase 6 — Tests

1. **Add installer utility tests:**  
   Include network failure, extraction failure, successful install flow, and safe path checks.

2. **Add plugin manager utility tests:**  
   Include parser tests for `dita plugins`, catalog parse tests, and command construction tests.

3. **Add command tests for both commands:**  
   Mock user picks and verify expected wrapper/util calls and error messages.

4. **Run focused suites:**  
   Run only impacted tests first, then broader `npm test` if needed.

### Phase 7 — Documentation & Final Hardening

1. **Update user-facing docs:**  
   Add installer/plugin manager usage to command and settings docs.

2. **Update README setup section:**  
   Mention automatic installer command and plugin manager command.

3. **Add known limitations section:**  
   Explain that uninstall/update and custom registry editing are out of scope for v1.

4. **Final consistency pass:**  
   Ensure setting names, command IDs, and message text are consistent across `package.json`, code, and docs.

