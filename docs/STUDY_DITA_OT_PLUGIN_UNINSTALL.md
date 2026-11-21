# Study: Uninstalling DITA-OT Plugins

**Version:** 1.1 (1.0: study; 1.1: decisions D1 to D3 taken, fix of the Windows path length limit for the install feature, §7)  
**Status:** Study — decisions taken, implementation scope to finalize  
**Related:** [SPEC_DITA_OT_INSTALL_AND_PLUGIN_MANAGEMENT.md](SPEC_DITA_OT_INSTALL_AND_PLUGIN_MANAGEMENT.md) (§2.2 lists plugin uninstall as a non-goal of v1)

---

## 1. Summary

DITA-OT has a command for this, `dita uninstall <id>`, so DITA Craft can offer it the way it offers `dita install`: a third action of **DITA: Manage DITA-OT Plugins**. But DITA-OT's command is not safe on its own:

- It **deletes the plugin folder first and re-integrates DITA-OT after**. When another plugin needs the removed one, the integration fails, the folder stays deleted, and DITA-OT is left broken: no rollback, and re-integrating keeps failing.
- It does not protect DITA-OT's own plugins. Removing the DITA 1.3 grammars succeeds without a message, and every DITA 1.3 document then fails to publish.

The feature is worth doing only with three safeguards that DITA-OT lacks: a **dependency check** before the command, a **protection list** for DITA-OT's own plugins, and a **backup of the plugin folder with rollback** when the command fails. With them, the feature is about **M** (1 to 2 days, tests included).

The study also found a limit of DITA-OT on Windows that affects the install feature: DITA-OT stops working when the path of its folder is longer than about 96 characters. §7 measures it and proposes a fix, about **S to M** (1 day).

## 2. DITA-OT behaviour (verified)

Verified on DITA-OT 4.3.5 (Windows, Java 21), on copies of an installation, never on the original. Repeat cases 1, 4 and 6 on the latest DITA-OT release before implementing.

### 2.1 The command

```
dita uninstall <id>
```

One plugin id; options `--debug`, `--verbose`, `--no-color`. No `--force`, no dependency option. It runs `PluginUninstallTask` (`integrator.xml`, target `uninstall`): it removes `<DITA-OT>/plugins/<id>`, then re-integrates DITA-OT.

### 2.2 Results

| # | Case | Exit | Output | State after |
|---|---|---|---|---|
| 1 | Plugin that nothing depends on (`org.dita.eclipsehelp`, `com.elovirta.pdf`, a plugin installed from a ZIP) | 0 | stdout `Removed <id>` | Folder deleted, `dita plugins` and `dita transtypes` updated. 2 to 5 s. |
| 2 | Unknown id, or a plugin removed already | 1 | stderr `Error: Plug-in <id> not found` | Nothing changed. |
| 3 | Id with a path (`../org.dita.html5`) | 1 | `Error: Plug-in ../org.dita.html5 not found` | Nothing changed. |
| 4 | Plugin that another plugin requires (`<require plugin="…"/>`) | 1 | `Error: Integration failed: java.lang.RuntimeException: [DOTJ020W] The 'com.example.child' plug-in cannot be loaded because it requires at least one plug-in in 'PluginRequirement[plugins=[com.example.test], required=true]'…` | **Folder deleted.** The integration keeps failing (`dita install` with no argument fails the same way). |
| 5 | Plugin whose extension points another plugin uses (`org.dita.pdf2`: `org.dita.index` plugs into `depend.org.dita.pdf2.index`, with no `<require>`) | 1 | `Error: Integration failed: … Plug-in org.dita.index uses an undefined extension point depend.org.dita.pdf2.index` | **Folder deleted**, while `dita transtypes` still lists `pdf` and `pdf2`: a PDF build would fail. Same with `org.dita.base`. |
| 6 | A grammar plugin (`org.oasis-open.dita.v1_3`) | 0 | `Removed org.oasis-open.dita.v1_3` | Succeeds without a warning; publishing a DITA 1.3 topic then fails with `DOTJ078F` (grammar files not found). |
| 7 | A plugin in an extra plugin folder (`plugindirs = plugins;demo;Q:/dev` in `config/configuration.properties`) | 1 | `Error: Plug-in com.example.test not found` | Nothing deleted: `dita uninstall` only removes plugins under `<DITA-OT>/plugins`. |
| 8 | A plugin whose folder name is not its id (`plugins/my-folder`, id `com.example.test`) | 1 | `Error: Plug-in com.example.test not found` | Nothing deleted: the plugin is found by its folder, `plugins/<id>`. |

### 2.3 Recovery

- After cases 4 and 5, copying the plugin folder back and running `dita install` with no argument re-integrates DITA-OT: exit 0, the plugin is listed again, transtypes work. This is the rollback DITA Craft can provide.
- Installing the removed plugin again (`dita install <id>` or its ZIP) also repairs case 4. Then removing the dependent plugin first, and the required one after, both succeed.
- Most plugins bundled with DITA-OT can be installed again from the registry (`plugins.dita-ot.org`, 93 plugins): `org.dita.pdf2`, `org.dita.pdf2.fop`, `org.dita.xhtml`, `org.dita.eclipsehelp`, `com.elovirta.pdf`, `org.lwdita`… The grammar plugins `org.oasis-open.*` are not in the registry: only reinstalling DITA-OT restores them.

## 3. Design

### 3.1 User flow

1. **DITA: Manage DITA-OT Plugins** gets a third action, **Uninstall plugin**, after the guard that already checks the DITA-OT installation.
2. DITA Craft lists the installed plugins (`dita plugins`, as the list action does) and classifies them (§3.2). A QuickPick shows the removable plugins, id and version, then, under a separator **Cannot be removed here**, the others with the reason in their description. Picking one of those shows the reason and stops.
3. A modal confirmation: `Remove DITA-OT plugin <id>@<version> from <DITA-OT path>? Its folder is deleted and DITA-OT is integrated again.` with **Remove**.
4. DITA Craft backs up `<DITA-OT>/plugins/<id>` (§3.3), runs `dita uninstall <id>` with a progress notification, and writes the command and its output to the DITA-OT output channel (`info()` for its own lines).
5. Success (exit 0 and `Removed <id>` on stdout): `DITA-OT plugin <id> removed.` with **List Installed Plugins**, and the backup is deleted.
6. Failure: §3.4.

### 3.2 Which plugins can be removed

A plugin is offered only when all of these hold:

| Rule | Reason shown otherwise | Evidence |
|---|---|---|
| Its folder is `<DITA-OT>/plugins/<id>`, and the `plugin.xml` there has that id. | `In <folder>: not removed by dita uninstall` | Cases 7 and 8 |
| It is not one of DITA-OT's own plugins (decision D1). | `Part of DITA-OT` | Case 6 |
| No other installed plugin depends on it. | `Required by <ids>` | Cases 4 and 5 |

**Dependencies.** Read the `plugin.xml` of every plugin in every plugin folder: the folders of `plugindirs` in `<DITA-OT>/config/configuration.properties` (default `plugins;demo`, relative to the DITA-OT folder or absolute). Plugin *P* depends on target *T* when:

- *P* has `<require plugin="…"/>` naming *T*, unless `importance="optional"`, and none of the other alternatives of the attribute (`a|b`) is installed;
- or *P* has `<feature extension="X">` and *T* declares `<extension-point id="X">`.

The second rule is the one that matters for DITA-OT's own plugins: `org.dita.index` declares no `<require>`, yet it breaks the integration without `org.dita.pdf2` (case 5). The rules come from the `plugin.xml` format and the integrator's messages; the `|` alternatives and `importance="optional"` were not tested here (see §5).

### 3.3 Backup and rollback

The backup is the safety net for whatever the check of §3.2 misses (a rule of the integrator that it does not know, a plugin added by hand meanwhile).

- Before the command, copy `<DITA-OT>/plugins/<id>` to a temporary folder (`os.tmpdir()/ditacraft-plugin-<id>-<time>`). Plugin folders are small; a failed copy stops the operation before anything is removed.
- On success, delete the backup.
- On failure, if the plugin folder is gone, copy the backup back and run `dita install` with no argument. Then delete the backup.

### 3.4 Errors and messages

| Situation | Message |
|---|---|
| `Plug-in <id> not found` | `Could not remove <id>: DITA-OT did not find it in <DITA-OT>/plugins.` |
| Integration failed, rollback succeeded | `Could not remove <id>: <first Error: line>. The plugin was restored.` + **Show Output** |
| Integration failed, rollback failed | `<id> was removed, but DITA-OT could not be integrated again: <reason>. Install <id> again, or remove the plugins that depend on it.` + **Show Output**. Keep the backup and give its path. |
| Timeout | `Removing <id> timed out.` The rollback applies as above. |

As in §8 of the specification: no success-shaped message when a step failed.

### 3.5 Code

| File | Changes |
|---|---|
| `src/utils/ditaOtPluginManager.ts` | `buildUninstallArgs(id)` (with `isValidPluginId`), `parseUninstallOutput(result, id)`, `findDependents(target, descriptors)`, `isProtectedPlugin(id)`. Pure, like the existing functions. |
| `src/utils/ditaOtPluginFiles.ts` (new) | Reads `plugindirs` and the `plugin.xml` files into descriptors (id, version, folder, requires, features, extension points), with `fast-xml-parser`, already a dependency. Backup and restore of a plugin folder. |
| `src/commands/manageDitaOtPluginsCommand.ts` | The **Uninstall plugin** action and its flow. |
| `src/test/suite/ditaOtPluginManager.test.ts` | Arguments, output parsing, dependency rules (require, alternatives, optional, extension points), protection. |
| `src/test/suite/ditaOtPluginUninstall.test.ts` (new) | Temporary plugin folders: descriptors, `plugindirs`, backup, and a rollback driven by a fake runner that deletes the folder and returns the integration error of case 4. |
| `src/test/suite/manageDitaOtPluginsCommand.test.ts` | The dialogs: removable and non-removable items, confirmation, success, failure with rollback. |
| `README.md`, `docs/user-guide/topics/commands/publishing-commands.dita`, `CHANGELOG.md`, the specification | The new action; remove "uninstalling … not available yet" from the known limitations. |

No new setting, no new command: the action belongs to the existing command.

## 4. Decisions

Decided on 21 November 2026, as recommended.

| # | Question | Options | Decision |
|---|---|---|---|
| D1 | Which plugins are protected? | **A.** Every `org.dita.*` and `org.oasis-open.*` plugin (DITA-OT's own namespaces). **B.** Only the grammar plugins `org.oasis-open.*`, the rest left to the dependency check and the rollback. | **A, decided.** It is simple and covers case 6 and the core plugins whose loss no check detects. DITA-OT's plugins follow the DITA-OT release, and the registry can hold another version. Users can still remove what they install themselves; the rare removal of a DITA-OT output (such as `org.dita.eclipsehelp`) stays possible on the command line. |
| D2 | A plugin that others depend on | **A.** Refuse, and name the dependents. **B.** Offer to remove the dependents too, in order. | **A, decided**: the message names the dependents. **B** can come later: removing dependents first, then the plugin, works (§2.3). |
| D3 | Keep the backup after a success, for an **Undo** button? | Yes / no | **No, decided**: reinstalling from the registry or the ZIP is the way back, and a backup would have to be cleaned up later. |

## 5. To verify while implementing

- The `|` alternatives and `importance="optional"` of `<require>`, with test plugins like `com.example.child`.
- A plugin whose files are locked on Windows (a file of the plugin open, a running build): what `dita uninstall` does, and that the rollback still applies.
- The same cases on the latest DITA-OT release (4.4.x), which the installer offers.
- A build running while a plugin is removed: the wrapper keeps no build state today, so at least say in the confirmation that builds should not run meanwhile.

## 6. Phases

### Phase 8 — Uninstall core

1. **Descriptors:** read `plugindirs` and the `plugin.xml` files of every plugin folder.
2. **Rules:** `findDependents`, `isProtectedPlugin`, and the classification of §3.2.
3. **Command and output:** `buildUninstallArgs`, `parseUninstallOutput` (success only with exit 0 and `Removed <id>`).
4. **Backup and rollback** of §3.3, with `dita install` (no argument) to re-integrate.

### Phase 9 — Uninstall command UX

1. **Action** in the action picker, after the installation guard.
2. **Plugin picker** with the removable plugins and, under a separator, the others with their reason.
3. **Confirmation, progress, output channel, result messages** of §3.4, and **List Installed Plugins** after a success.

### Phase 10 — Tests and documentation

1. **Tests** of §3.5, including the integration failure of case 4 and its rollback.
2. **Manual check** on a copy of a DITA-OT installation: cases 1, 4, 5 and 6 of §2.2.
3. **Documentation:** README, user guide, CHANGELOG; in the specification, move uninstall out of the non-goals.

## 7. Windows path length (install feature)

### 7.1 Cause

On Windows, `bin/dita.bat` runs `config/env.bat`, which the integration writes: it adds every library of every plugin to the Java class path, each with the **full path** of the DITA-OT folder (47 entries with DITA-OT 4.3.5 and its bundled plugins). The whole class path ends up on one command line, and `cmd.exe` refuses a line longer than 8,191 characters: `The input line is too long.` (in French, `La ligne entrée est trop longue.`).

`dita install` and `dita uninstall` do not run `env.bat`, so they keep working; every other command fails: `--version`, `plugins`, `transtypes`, and publishing.

### 7.2 Measurements

DITA-OT 4.3.5, Java 21, copies of one installation at paths of chosen lengths. The Java command line was captured by making a copy of `dita.bat` print it instead of running it.

| DITA-OT folder path | `dita plugins` | Java command line |
|---|---|---|
| 80 characters | works | 7,350 characters, of which 6,581 are the class path |
| 90 characters | works | 7,870 |
| 95 characters | works | 8,130 |
| 96 characters | works | 8,182 |
| 97 characters and more | **fails** | 8,234 and more |

- Each character of the folder path adds 52 characters to the line: 47 class path entries and 5 other uses. For `dita plugins`, the line is 3,190 + 52 × the path length (with a 38-character `JAVA_HOME`).
- **Arguments count too.** A DITA-OT at 95 characters lists its plugins and publishes `--input Q:\t.dita --output Q:\o`, but fails to publish with absolute input and output paths (382 characters of arguments in the test), as DITA Craft passes them (`--input`, `--output`, and `--temp` and `--filter` when set).
- **Plugins count too.** Each plugin library adds about the folder path length plus 50 characters. A DITA-OT that works can stop working after a plugin install.
- The DITA-OT of this repository's user guide build, `docs/user-guide/build/dita-ot/dita-ot-4.3.5`, is 95 characters long in a checkout under `C:\Users\<user>\Documents\Perso\Projects\`: at the limit. Publishing from DITA Craft with it can fail, depending on the paths of the document and of the output.

### 7.3 Impact in DITA Craft

- **DITA: Install DITA-OT** lets the user choose any folder. An install into a deep folder fails at the version check, with a message that does not say why.
- The version check fails the same way for a DITA-OT installed by hand: **DITA: Manage DITA-OT Plugins** then says that DITA-OT was not found.
- Publishing fails with the localized `cmd.exe` message, which DITA Craft cannot recognize, for some documents only (the long paths).

### 7.4 Fix

**F1 — Launch DITA-OT through the short name of its folder.** Windows gives most folders a short (8.3) name as well, such as `C:\Users\<user>\DOCUME~1\…\DITA-O~1.5`. Before launching `dita.bat`, DITA Craft resolves the short path of the DITA-OT folder once (`cmd /c for %I in ("<path>") do @echo %~sI`, cached per path) and uses it for the command (`<short path>\bin\dita.bat`) and for `DITA_HOME`. Measured: a DITA-OT at 135 characters, whose `dita plugins` fails, runs `plugins`, `transtypes` and an HTML5 publish with a 162-character output path through its 89-character short path.

The wrapper launches `dita.bat` in four places: `verifyInstallation`, `getAvailableTranstypes`, `runDitaCli` and `publish`. Only the last two set `DITA_HOME`. One launch helper serves all four.

Limits: Windows creates short names only where 8.3 name generation is enabled on the volume. It usually is on the system drive, but it can be disabled, on other drives or by policy. Without a short name, the resolved path is the long one, and F2 applies. DITA-OT messages show the short names (`DITA-O~1.5`); that is cosmetic.

**F2 — Check the command line before launching, and explain.** On Windows, DITA Craft computes the length of the Java command line that `dita.bat` will build: the class path of `config/env.bat` with `%DITA_HOME%` replaced by the folder path in use, the rest of the Java line of `bin/dita.bat` with its variables, and the arguments. When it is over 8,191 characters, DITA Craft does not launch DITA-OT and says:

> DITA-OT cannot run from `<path>` on Windows: its command line would be N characters long, over the 8,191-character limit of `cmd.exe`. Move DITA-OT to a shorter folder, such as `C:\DITA-OT`, then run **DITA: Configure DITA-OT Path**.

This replaces the localized `cmd.exe` message and "DITA-OT was not found". Read `env.bat` again only when its modification time changes.

**F3 — Warn when installing into a deep folder.** Before the download, when F1 cannot shorten the chosen folder (no short name) and the path of the folder to create (`<target>\dita-ot-<version>`) is longer than 80 characters, a modal warning: "DITA-OT may not run from this folder on Windows: its path is N characters long…", with **Choose Another Folder** and **Install Anyway**. At 80 characters, DITA-OT 4.3.5's command line is 7,350 characters: that leaves about 840 for publishing arguments and the libraries of added plugins.

**F4 — Check after a plugin install.** After a successful `dita install` on Windows, run the F2 check with an allowance of 300 characters for publishing arguments. When it is over the limit: "<plugin> added libraries to DITA-OT, and its command line would now be N characters long: publishing may fail. Move DITA-OT to a shorter folder, or uninstall the plugin." Uninstalling still works, since `dita uninstall` does not run `env.bat`.

**Alternatives not chosen**

- Launching Java directly instead of `dita.bat`, with the class path in an environment variable (up to 32,767 characters) or a Java argument file: it removes the limit, but DITA Craft would have to follow every change of DITA-OT's launcher (Java detection, `ANT_OPTS`, options).
- Recognizing the `cmd.exe` message: it is localized.
- Windows long path support (`LongPathsEnabled`): it concerns file paths, not the length of a `cmd.exe` command line.

### 7.5 Tests

- Short path resolution: the short path is used for the command and `DITA_HOME` in the four launch places; the long path is kept when Windows returns no short name; no change on Linux and macOS.
- Command line estimate, with the `env.bat` and the Java line of `dita.bat` of DITA-OT 4.3.5 as fixtures and a 38-character Java path: 7,350 characters at 80 and 7,870 at 90 for `dita plugins`; the F2 message above 8,191.
- Installer: the F3 warning, and **Choose Another Folder**.
- Manual, on Windows: a DITA-OT copy at more than 100 characters: version check, plugin list, transtypes and a publish work through F1; with F1 disabled, the F2 message appears instead of the `cmd.exe` one.

### 7.6 Phase 11 — Windows path length

1. **Launch helper (F1)** used by the four places that launch `dita.bat`.
2. **Command line estimate and message (F2).**
3. **Installer warning (F3) and check after a plugin install (F4).**
4. **Tests** of §7.5, and the **user guide**: a Windows note in **DITA: Install DITA-OT** and **DITA: Configure DITA-OT Path**.
