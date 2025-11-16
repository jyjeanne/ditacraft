# DitaCraft VS Code Extension - Test Coverage Analysis

**Analysis Date:** 2025-11-16  
**Codebase Size:** 3,506 lines of TypeScript source code  
**Existing Test Files:** 6 test suites  

---

## EXECUTIVE SUMMARY

The DitaCraft extension has **3 modules with NO test files** and **2 modules with INCOMPLETE test coverage**. Critical functionality like file creation, publishing, preview generation, and DITA-OT configuration are completely untested. This creates significant risk for production issues.

**Test Coverage Status:**
- ✓ Tested: ditaValidator.ts, ditaLinkProvider.ts, keySpaceResolver.ts (partial)
- ✗ Untested: fileCreationCommands.ts, previewCommand.ts, publishCommand.ts, configureCommand.ts, logger.ts, ditaOtWrapper.ts, extension.ts, dtdResolver.ts (partial)

---

## 1. MODULES WITH NO CORRESPONDING TEST FILES

### 1.1 src/commands/fileCreationCommands.ts
**Status:** NO TEST FILE  
**Risk Level:** HIGH  
**Lines of Code:** 397

**Public Functions Not Tested:**
- `newTopicCommand()` - Creates DITA topic files with 4 topic types (concept, task, reference, topic)
- `newMapCommand()` - Creates DITA map files
- `newBookmapCommand()` - Creates bookmap files
- `validateFileName(value: string)` - Validates file name input
- `generateTopicContent(topicType, id)` - Content template generator
- `generateMapContent(id)` - Content template generator
- `generateBookmapContent(title, id)` - Content template generator

**Missing Tests:**
1. **User Interaction Tests:**
   - Quick pick selection for topic type
   - File name input validation with invalid characters
   - User cancellation paths (user clicks cancel/ESC)
   - Workspace folder not open scenario

2. **Edge Cases:**
   - File name with special characters: `test!@#$%.dita` (should reject)
   - File name with only numbers: `123.dita`
   - Very long file names (>255 chars)
   - File name patterns: `test-file`, `test_file`, `testfile`
   - Empty file name input
   - Whitespace-only file names
   - File names with leading/trailing spaces

3. **Error Paths:**
   - File already exists (fs.existsSync returns true)
   - Write permission denied (fs.writeFileSync throws)
   - Directory read error on workspace folder
   - File system quota exceeded
   - Invalid characters in XML ID attribute

4. **Async Operations:**
   - vscode.window.showInputBox() timeout/cancellation
   - vscode.window.showQuickPick() timeout/cancellation
   - vscode.workspace.openTextDocument() failure
   - vscode.window.showTextDocument() failure

5. **Content Generation:**
   - Topic type mapping correctness (concept → concept.dtd)
   - XML encoding correctness in file content
   - DOCTYPE declarations for all types
   - Special characters in ID attribute (< > & " ')

**Risk Assessment:**
- File creation is a core feature affecting user productivity
- No validation of generated XML content
- No testing of UI interaction flows
- Edge case handling unknown


---

### 1.2 src/commands/publishCommand.ts
**Status:** NO TEST FILE  
**Risk Level:** CRITICAL  
**Lines of Code:** 209

**Public Functions Not Tested:**
- `publishCommand(uri?)` - Main publish command with format selection
- `publishHTML5Command(uri?)` - Direct HTML5 publishing
- `executePublish(inputFile, transtype, ditaOt)` - Core publishing logic

**Missing Tests:**
1. **Command Execution Flow:**
   - URI parameter handling (provided vs. undefined)
   - Active editor fallback
   - File validation (no file open)
   - DITA-OT not configured scenario
   - DITA-OT verification failure handling

2. **Format Selection:**
   - User selecting different transtypes (html5, pdf, epub, etc.)
   - User cancelling format picker
   - Empty transtype list from DITA-OT
   - Invalid transtype handling

3. **Progress Tracking:**
   - Progress callback invocation
   - Progress percentage updates (0→100)
   - Progress message content
   - Long-running publish operations (>10 minutes timeout handling)

4. **Error Handling:**
   - File does not exist
   - File is a directory, not a file
   - Invalid file path with null bytes
   - DITA-OT command not found
   - DITA-OT process timeout
   - DITA-OT fatal errors during publish
   - Output directory creation failure
   - Insufficient disk space

5. **Post-Publish Actions:**
   - "Open Output Folder" button
   - "Show Preview" button for HTML5
   - "View Output" error button
   - "View Logs" error button
   - HTML5-specific success buttons

6. **Async Operations:**
   - ditaOt.verifyInstallation() async behavior
   - ditaOt.getAvailableTranstypes() async behavior
   - ditaOt.publish() cancellation/timeout
   - vscode.window.withProgress() integration
   - Error message display on publish failure

**Risk Assessment:**
- Publishing is critical functionality - failure breaks user workflows
- Timeout not tested (10 min process timeout)
- Error recovery paths untested
- Progress UI not validated
- DITA-OT integration completely untested


---

### 1.3 src/commands/previewCommand.ts
**Status:** NO TEST FILE  
**Risk Level:** CRITICAL  
**Lines of Code:** 187

**Public Functions Not Tested:**
- `previewHTML5Command(uri?)` - Main preview command
- `findMainHtmlFile(outputDir, baseName)` - HTML file discovery

**Missing Tests:**
1. **File Validation:**
   - Empty file path handling
   - Path with no file extension
   - Path ending with directory separator
   - Directory path instead of file
   - File doesn't exist

2. **Input File Validation:**
   - ditaOt.validateInputFile() failure cases
   - Invalid file extensions (.txt, .html)
   - Files with spaces in path
   - Symbolic links

3. **DITA-OT Verification:**
   - Installation verification failure
   - Version detection from "dita --version"
   - DITA-OT command missing (fallback handling)
   - User clicks "Configure Now" action

4. **Cache Logic:**
   - Output directory doesn't exist (first preview)
   - Output is newer than source (cache hit)
   - Output is older than source (cache miss, republish)
   - stat() errors on file system
   - Time comparison edge cases (same timestamp)

5. **HTML File Discovery:**
   - Pattern matching: `{baseName}.html`
   - Pattern matching: `index.html`
   - Fallback: finding any .html file
   - Empty output directory
   - Multiple HTML files (which one selected?)
   - Directory doesn't exist
   - Directory exists but inaccessible (permissions)

6. **Publishing Integration:**
   - ditaOt.publish() failure
   - ditaOt.publish() timeout
   - ditaOt.publish() partial output
   - Output directory not created

7. **Error Paths:**
   - Cannot preview (validation fails)
   - No file open error message
   - HTML file not found error message
   - Browser open failure (vscode.env.openExternal)

8. **Async Operations:**
   - ditaOt.verifyInstallation()
   - ditaOt.publish() with progress callback
   - fs operations (stat, readdir)
   - User dialog interactions

**Risk Assessment:**
- Preview is high-visibility feature (users expect fast feedback)
- Caching logic completely untested (could serve stale content)
- File discovery heuristics unvalidated (might fail on edge cases)
- DITA-OT integration points untested
- Critical error messages untested


---

### 1.4 src/commands/configureCommand.ts
**Status:** NO TEST FILE  
**Risk Level:** MEDIUM  
**Lines of Code:** 22

**Public Functions Not Tested:**
- `configureDitaOTCommand()` - DITA-OT path configuration dialog

**Missing Tests:**
1. **Dialog Flow:**
   - User selects valid DITA-OT directory
   - User cancels dialog
   - Dialog error handling

2. **Error Handling:**
   - ditaOt.configureOtPath() exception
   - Configuration update failure
   - Installation verification failure

3. **Async Operations:**
   - ditaOt.configureOtPath() async operation
   - Error message display

**Risk Assessment:**
- Small function but critical for extension setup
- Configuration not validated before saving
- Error recovery untested


---

### 1.5 src/utils/logger.ts
**Status:** NO TEST FILE  
**Risk Level:** MEDIUM  
**Lines of Code:** 263

**Public Functions Not Tested:**
- `getInstance()` - Singleton pattern
- `debug(message, data)` - Debug logging
- `info(message, data)` - Info logging
- `warn(message, data)` - Warn logging
- `error(message, error)` - Error logging
- `show()` - Show output channel
- `clear()` - Clear output channel
- `getLogFilePath()` - Get log file path
- `openLogFile()` - Open log file in editor
- `showLogFileLocation()` - Show log location dialog
- `clearOldLogs(daysToKeep)` - Clean old log files
- `dispose()` - Clean up resources

**Missing Tests:**
1. **Singleton Pattern:**
   - getInstance() returns same instance
   - Multiple calls return same logger

2. **Log Level Filtering:**
   - DEBUG level logs everything
   - INFO level skips debug messages
   - WARN level skips debug/info
   - ERROR level skips others
   - Unknown log level defaults to INFO

3. **Output Formatting:**
   - Timestamp format in logs
   - Log level padding ([DEBUG], [INFO ], etc.)
   - Data serialization (objects, errors)
   - Error stack trace inclusion
   - Circular reference handling in JSON.stringify

4. **File Logging:**
   - Log file creation in temp directory
   - File logging disabled when not DEBUG mode
   - Log file path construction
   - Append behavior (not overwrite)
   - Directory creation if missing
   - Write permission errors

5. **Error Handling in Formatting:**
   - Error object with stack
   - Error object without stack
   - Complex object serialization
   - Circular references in data
   - Null/undefined data

6. **File Operations:**
   - File write failures (fallback to console)
   - Directory not writable
   - Disk full errors
   - Path invalid (null bytes)

7. **clearOldLogs():**
   - Delete files older than N days
   - Keep current log file
   - Skip non-ditacraft log files
   - Directory not found
   - Directory not readable
   - File stat errors
   - Deletion failures

8. **UI Dialogs:**
   - showLogFileLocation() action buttons
   - openLogFile() when file doesn't exist
   - openLogFile() when file exists
   - File logging disabled message

**Risk Assessment:**
- Logger is used everywhere but untested
- Silent failures possible (write errors)
- Edge cases in formatting could cause crashes
- Log cleanup logic unvalidated


---

### 1.6 src/utils/ditaOtWrapper.ts
**Status:** NO TEST FILE  
**Risk Level:** CRITICAL  
**Lines of Code:** 531

**Public Functions Not Tested:**
- `constructor()` - Initialization with config loading
- `reloadConfiguration()` - Config reload on settings change
- `verifyInstallation()` - Check DITA-OT is installed and get version
- `getAvailableTranstypes()` - Parse transtype list from DITA-OT
- `publish(options, progressCallback)` - Core publishing function with process spawning
- `configureOtPath()` - Open folder picker and save configuration
- `validateInputFile(filePath)` - Validate file is suitable for publishing
- `getOutputDirectory()` - Get configured output directory
- `getDefaultTranstype()` - Get default transtype

**Missing Tests:**
1. **Configuration Loading:**
   - Load settings from vscode config
   - Handle missing ditaOtPath (empty string)
   - Handle invalid DITA-OT path
   - Handle invalid output directory path
   - Output directory variable substitution (${workspaceFolder})
   - Workspace folder not found
   - Invalid transtype defaults to 'html5'
   - Dangerous characters in paths (null bytes, <>:|?"*)
   - Windows drive letters (C:\) handled correctly
   - Path validation on Windows vs. Linux

2. **Command Detection:**
   - Windows: dita.bat vs dita.cmd
   - Linux/Mac: dita executable
   - Custom DITA-OT path detection
   - Path not found warning message
   - System PATH fallback

3. **Installation Verification:**
   - DITA-OT installed and accessible
   - DITA-OT not installed (process error)
   - Version regex parsing
   - Different version formats
   - Version number extraction
   - Missing version in output (version = 'unknown')

4. **Available Transtypes:**
   - Parse transtype list from command output
   - Handle missing transtypes output
   - Transtype parsing regex
   - Return default list on error
   - Sorted output

5. **Publishing Process:**
   - Process spawning with correct arguments
   - Input file existence check
   - Input file is directory check
   - Output directory creation
   - Process timeout (10 min)
   - Process kill on timeout (SIGTERM then SIGKILL)
   - Process error event handling
   - Process exit code 0 (success)
   - Process exit code != 0 (failure)
   - stdout data capturing
   - stderr data capturing
   - Progress callback invocation
   - Progress percentage updates

6. **Path Validation:**
   - Null byte detection in paths
   - Invalid characters on Windows (< > : " | ? *)
   - Reserved characters handling
   - Path normalization
   - Absolute vs. relative paths

7. **Error Handling:**
   - Input file doesn't exist
   - Input path is directory
   - Process start failure
   - DITA-OT command not found
   - DITA-OT timeout after 10 minutes
   - Command execution permission denied
   - Malformed arguments to DITA-OT

8. **Progress Parsing:**
   - Extract progress messages from output
   - Progress percentage calculation
   - Stage identification ([echo], [pipeline], [xslt], etc.)
   - Handle missing progress patterns
   - Return null when no pattern matches

9. **Configuration Persistence:**
   - User selects folder in dialog
   - Config.update() call
   - Validation of selected path (must have 'bin' subdir)
   - Error when 'bin' directory missing
   - Reload configuration after update
   - Verify installation after update

10. **Async Operations & Race Conditions:**
   - Concurrent publish() calls
   - Configuration change during publish
   - Process termination handling
   - Timeout race conditions
   - Progress callback exceptions

**Risk Assessment:**
- Core infrastructure for all publishing/preview features
- Process management untested (timeout, kill signals)
- Configuration validation minimal
- Path security (command injection) needs testing
- DITA-OT integration completely unvalidated
- Error messages not tested


---

### 1.7 src/extension.ts
**Status:** NO TEST FILE  
**Risk Level:** HIGH  
**Lines of Code:** 331

**Public Functions Not Tested:**
- `activate(context)` - Extension activation (entry point)
- `deactivate()` - Extension cleanup
- `registerCommands(context)` - Command registration
- `registerLoggerCommands(context)` - Logger command registration
- `registerConfigurationListener(context)` - Config change listener
- `verifyDitaOtInstallation()` - DITA-OT verification
- `showWelcomeMessage(context)` - Welcome dialog
- `getOutputChannel()` - Get output channel
- `getDitaOtWrapper()` - Get DITA-OT wrapper

**Missing Tests:**
1. **Activation Flow:**
   - Extension activation success
   - All components initialized in order
   - Command registration success
   - Link provider registration
   - Validator initialization
   - Error during activation (exception handling)
   - Exception message displayed to user

2. **Command Registration:**
   - All 8 commands registered (validate, publish, preview, newTopic, newMap, newBookmap, configure, testLogger)
   - Command function wrapping for error handling
   - Logger integration in command handlers

3. **Configuration Listener:**
   - Configuration change detected
   - ditacraft.* settings trigger reload
   - Other settings ignored
   - ditacraft.ditaOtPath change triggers verification
   - DITA-OT reload on configuration change

4. **DITA-OT Verification:**
   - Verification on activation
   - Success notification with version
   - Failure notification
   - User selects "Configure Now"
   - User dismisses notification
   - Error during verification
   - Async operation handling

5. **Welcome Message:**
   - First activation shows welcome
   - Subsequent activations skip welcome
   - User selects "Get Started" (opens URL)
   - User selects "View Documentation"
   - Welcome state persisted in globalState
   - Error handling for welcome message
   - Dialog cancellation

6. **Logger Command Registration:**
   - showLogFile command
   - openLogFile command
   - showOutputChannel command
   - clearOutputChannel command

7. **Error Handling in activate():**
   - Exception thrown during initialization
   - Error message displayed
   - Deactivation on failed activation
   - Clean shutdown on failure

8. **Deactivation:**
   - Logger disposed
   - Output channel disposed
   - Subscriptions cleaned up
   - Error handling during deactivation

**Risk Assessment:**
- Extension entry point - failure here breaks everything
- Activation order dependencies not tested
- Welcome state persistence untested
- Configuration listener untested
- Error paths during activation not validated


---

## 2. MODULES WITH PARTIAL/INCOMPLETE TEST COVERAGE

### 2.1 src/utils/dtdResolver.ts
**Status:** PARTIAL TEST COVERAGE (dtdValidation.test.ts)  
**Risk Level:** MEDIUM  
**Lines of Code:** ~150+ (need to read rest)

**Currently Tested:**
- `resolvePublicId(publicId)` - Basic DTD resolution
- `areDtdsAvailable()` - DTD availability check

**Missing Tests:**
1. **DTD Content Loading:**
   - `getDtdContent(publicId)` caching behavior
   - Cache hit (subsequent calls)
   - Cache miss (first call)
   - File not found (getDtdContent returns null)
   - File read errors

2. **Entity Resolution:**
   - `resolveEntity(publicId, systemId)` functionality
   - PUBLIC ID resolution
   - SYSTEM ID resolution
   - Both provided resolution priority
   - Neither provided returns null
   - Path resolution for entity files

3. **Error Handling:**
   - Failed DTD file load (exception)
   - File system errors
   - Invalid DTD paths

**Risk Assessment:**
- DTD resolution needed for validation
- Entity resolution untested
- Cache behavior untested


---

### 2.2 src/providers/ditaLinkProvider.ts
**Status:** PARTIAL TEST COVERAGE (ditaLinkProvider.test.ts)  
**Risk Level:** MEDIUM  
**Lines of Code:** 442

**Currently Tested:**
- Language ID configuration
- Basic link detection for href attributes
- Local DITA file links
- Relative path handling
- External URL skipping

**Missing Tests:**
1. **Attribute Processing - href:**
   - href with fragment identifiers (#topicid)
   - href with spaces or special characters
   - Empty href attribute
   - Multiple href attributes in file
   - Case sensitivity (HREF vs href)

2. **Attribute Processing - conref:**
   - conref with fragment (#elementid)
   - conref with paths and fragments (file.dita#topic/element)
   - Same-file conref (#elementid only)
   - Empty conref

3. **Attribute Processing - keyref:**
   - keyref resolution through key space
   - keyref with inline content (no file target)
   - keyref with missing key definition
   - keyref with special characters
   - Case sensitivity

4. **Attribute Processing - conkeyref:**
   - conkeyref resolution
   - conkeyref with element part (key/element)
   - conkeyref with missing key
   - Fallback to filename matching

5. **Path Resolution:**
   - Path traversal attack prevention
   - Workspace boundary checking
   - Absolute paths
   - Relative paths with ../
   - Symlinks
   - Non-existent files (still create link)

6. **Key Space Resolution:**
   - `processKeyrefAttributesWithKeySpace()` async behavior
   - `processConkeyrefAttributesWithKeySpace()` async behavior
   - Key resolution errors (try/catch)
   - Fallback filename matching
   - Link creation for resolved keys

7. **Performance:**
   - Max matches safety limit (10000)
   - Infinite loop prevention in regex
   - Large file handling

8. **Document Link Details:**
   - Link range calculation correctness
   - Link tooltip content
   - Target URI formation
   - Multiple links in same file

9. **Error Handling:**
   - KeySpaceResolver exceptions
   - File system errors
   - Cancellation token handling

**Risk Assessment:**
- Ctrl+Click navigation is user-facing feature
- Key space resolution async behavior untested
- Path traversal security needs validation
- Large document performance untested


---

## 3. SUMMARY TABLE: MODULES AND COVERAGE

| Module | Lines | Tested? | Test File | Gap Risk |
|--------|-------|---------|-----------|----------|
| src/commands/fileCreationCommands.ts | 397 | NO | None | HIGH |
| src/commands/publishCommand.ts | 209 | NO | None | CRITICAL |
| src/commands/previewCommand.ts | 187 | NO | None | CRITICAL |
| src/commands/configureCommand.ts | 22 | NO | None | MEDIUM |
| src/commands/validateCommand.ts | 137 | PARTIAL | commandAndDetection.test.ts | LOW |
| src/providers/ditaValidator.ts | 668 | YES | ditaValidator.test.ts, dtdValidation.test.ts, realtimeValidation.test.ts | LOW |
| src/providers/ditaLinkProvider.ts | 442 | PARTIAL | ditaLinkProvider.test.ts | MEDIUM |
| src/utils/logger.ts | 263 | NO | None | MEDIUM |
| src/utils/ditaOtWrapper.ts | 531 | NO | None | CRITICAL |
| src/utils/dtdResolver.ts | 150+ | PARTIAL | dtdValidation.test.ts | MEDIUM |
| src/utils/keySpaceResolver.ts | 507 | YES | keySpaceResolver.test.ts | LOW |
| src/extension.ts | 331 | NO | None | HIGH |
| **TOTALS** | **3,506** | **~34%** | 6 files | HIGH/CRITICAL |

---

## 4. CRITICAL GAPS REQUIRING IMMEDIATE ATTENTION

### 4.1 No Error Path Testing
**Affected Modules:**
- publishCommand.ts - DITA-OT failures, timeouts not tested
- previewCommand.ts - File discovery, cache logic not tested
- fileCreationCommands.ts - File already exists, permission denied not tested
- ditaOtWrapper.ts - Process spawn errors, timeout not tested
- extension.ts - Activation failures not tested

**Risk:** Users encounter untested error scenarios in production, no recovery paths validated

### 4.2 No Async Operation Testing
**Affected Modules:**
- publishCommand.ts - Async DITA-OT operations
- previewCommand.ts - Async file stats, process invocation
- fileCreationCommands.ts - Async file operations, dialog cancellation
- ditaLinkProvider.ts - Async key space resolution
- ditaOtWrapper.ts - Async process spawning, timeout handling
- extension.ts - Async welcome dialog, verification

**Risk:** Race conditions, timeout handling, cancellation scenarios untested

### 4.3 No Edge Case Testing
**Affected Areas:**
- File names with special characters
- Very long file paths (>260 chars on Windows)
- XML special characters in IDs and content
- Path traversal attempts
- Directory vs. file confusion
- Empty inputs and whitespace

**Risk:** Extension behavior unpredictable with non-standard inputs

### 4.4 No Integration Testing
**Affected Flows:**
- End-to-end file creation → save → validate → publish
- Configuration change → reload → re-verify
- Key space building → keyref resolution → link navigation
- DITA-OT installation → version check → publish

**Risk:** Component interactions untested, integration bugs undetected

### 4.5 No UI/UX Testing
**Affected Features:**
- Command execution with/without files open
- Dialog cancellation/timeouts
- Progress reporting accuracy
- Error message clarity
- Button action handling (Open Folder, Show Preview, View Logs)
- Welcome message display and persistence

**Risk:** User experience bugs, unclear error messages

---

## 5. RECOMMENDATIONS BY PRIORITY

### CRITICAL (Add immediately - affects core features):
1. **src/commands/publishCommand.ts** - Create full test suite
   - Command execution flow
   - Format selection
   - Error handling for DITA-OT failures
   - Progress tracking
   - Timeout handling

2. **src/commands/previewCommand.ts** - Create full test suite
   - File validation
   - DITA-OT verification
   - Cache logic verification
   - HTML file discovery
   - Error messages

3. **src/utils/ditaOtWrapper.ts** - Create full test suite
   - Configuration validation
   - Process spawning
   - Timeout handling (10 min)
   - Error recovery
   - Path security

### HIGH (Add within next sprint):
4. **src/commands/fileCreationCommands.ts** - Create full test suite
   - File name validation
   - Content generation
   - File already exists
   - Permission errors
   - User cancellation

5. **src/extension.ts** - Create integration test suite
   - Activation flow
   - Command registration
   - Configuration listener
   - Error handling

6. **src/utils/logger.ts** - Create unit test suite
   - Log level filtering
   - Output formatting
   - File logging
   - Async file operations

### MEDIUM (Add to backlog):
7. **src/commands/configureCommand.ts** - Add error path tests
8. **src/providers/ditaLinkProvider.ts** - Complete async/security tests
9. **src/utils/dtdResolver.ts** - Add caching and entity resolution tests

---

## 6. TEST ESTIMATION

### Lines of Test Code Needed (rough estimate):
- publishCommand.ts: 400-500 lines
- previewCommand.ts: 350-450 lines
- ditaOtWrapper.ts: 500-600 lines
- fileCreationCommands.ts: 350-450 lines
- extension.ts: 300-400 lines
- logger.ts: 250-350 lines
- Others: 300-400 lines

**Total: 2,500-3,200 lines of test code** (comparable to source code volume)

---

## 7. SPECIFIC FUNCTION-BY-FUNCTION GAPS

### fileCreationCommands.ts - newTopicCommand()
**Not Tested:**
- Quick pick selection for 4 topic types
- User cancellation at topic type selection
- File name input with validation
- User cancellation at file name input
- Workspace folder unavailable
- File already exists scenario
- fs.writeFileSync failure
- File open in editor failure
- Generated content for all 4 types
- XML special chars in ID param

### publishCommand.ts - publishCommand()
**Not Tested:**
- No file open → error message
- No DITA-OT configured → suggestion dialog
- Invalid file extension → warning
- Quick pick timeout/cancellation
- Empty transtype list
- Transtype selection flow
- DITA-OT verification failure handling
- Unknown publish format

### publishCommand.ts - executePublish()
**Not Tested:**
- Non-existent input file
- Input file is directory
- Output directory creation
- DITA-OT process spawning
- DITA-OT timeout (>10 min)
- Process SIGTERM/SIGKILL flow
- Exit code != 0 handling
- Error output parsing
- stderr/stdout capturing
- Progress callback with multiple updates
- Button action: "Open Output Folder"
- Button action: "Show Preview" (HTML5)
- Button action: "View Output"
- Button action: "View Logs"

### previewHTML5Command()
**Not Tested:**
- All the validations (empty path, no extension, is directory)
- DITA-OT not installed flow with "Configure Now" button
- Cache hit (output newer than source)
- Cache miss (republish needed)
- Output directory doesn't exist
- findMainHtmlFile returns null
- Browser open (vscode.env.openExternal) failure
- Publish through preview
- Progress callback during publish

### Logger class
**Not Tested:**
- Each log level (DEBUG, INFO, WARN, ERROR)
- Filtering by level
- Timestamp formatting
- Error stack trace inclusion
- Data object serialization
- Circular reference handling
- File creation in temp dir
- File append behavior
- Write failures
- clearOldLogs() date math
- Singleton pattern
- Configuration parsing

---

## CONCLUSION

**Current State:** Only ~34% of source code has test coverage, and many critical functions are untested or partially tested. Publishing, preview, file creation, and DITA-OT integration—the extension's core features—have NO automated tests.

**Risk:** Production failures are likely in:
- Publishing operations (timeout, DITA-OT errors)
- Preview generation (file discovery, caching)
- File creation (special characters, permissions)
- Configuration management (validation, persistence)
- Error scenarios (all error paths in untested modules)

**Immediate Action:** Create tests for publishCommand, previewCommand, and ditaOtWrapper to cover the critical path. These three modules represent the highest risk and impact.

