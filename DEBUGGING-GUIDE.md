# DitaCraft Debugging Guide

## Problem: Commands not appearing in Command Palette

### Step 1: Check if Extension is Installed

1. Open VS Code
2. Press `Ctrl+Shift+X` (Extensions panel)
3. Search for "ditacraft"
4. **Questions:**
   - Is "DitaCraft" in the list?
   - Is it **ENABLED** (not grayed out)?
   - Does it show "Reload Required"?

**If not installed:** Install `ditacraft-0.1.0.vsix` again

**If disabled:** Click "Enable"

**If "Reload Required":** Click "Reload" button

---

### Step 2: Check Extension Host Logs

1. Open Command Palette (`Ctrl+Shift+P`)
2. Type: **"Developer: Show Logs..."**
3. Select: **"Extension Host"**
4. Look for errors related to "ditacraft"

**What to look for:**
- ❌ Red error messages mentioning "ditacraft"
- ❌ "Failed to activate extension"
- ❌ "Cannot find module"
- ❌ File not found errors

**Copy any errors you find**

---

### Step 3: Check if Extension Activated

1. Open Command Palette (`Ctrl+Shift+P`)
2. Type: **"Developer: Show Running Extensions"**
3. Look for "ditacraft" or "DitaCraft" in the list

**If NOT in the list:** Extension failed to activate

**If in the list:** Click on it to see activation status

---

### Step 4: Force Extension to Activate

1. Open a workspace folder (File → Open Folder)
2. Create a test file: `test.dita`
3. This should trigger activation (activationEvents includes "onLanguage:xml")

**Check again:**
- View → Output → Select "DitaCraft" from dropdown
- Do you see activation messages?

---

### Step 5: Check Output Panel

1. View → Output (or `Ctrl+Shift+U`)
2. In the dropdown, select **"DitaCraft"**

**You should see:**
```
=== DitaCraft Activation Starting ===
Initializing DITA-OT wrapper...
DITA-OT wrapper initialized
Validator initialized
Registering commands...
Commands registered
=== DitaCraft Activation Complete ===
```

**If you see errors:** Copy the full error message

**If panel is empty:** Extension never activated

---

### Step 6: Test Minimal Extension

I've created a minimal test extension to verify VS Code can load extensions:

**Location:** `C:\Users\jjeanne\Desktop\DitaCraft\test-minimal\`

**To test:**

1. Open VS Code
2. Press `F1` → Type "Extensions: Install from VSIX"
3. Navigate to `test-minimal` folder
4. If no .vsix file exists, run from that folder:
   ```
   npm install -g @vscode/vsce
   vsce package
   ```
5. Install the resulting `ditacraft-test-0.0.1.vsix`
6. Reload window
7. You should see popup: "DitaCraft Test Extension Activated!"
8. Try command: `DitaCraft Test: Hello World`

**If this works:** The problem is specific to the main extension
**If this doesn't work:** VS Code has a general extension loading problem

---

### Step 7: Check for Extension Conflicts

Some extensions might conflict. Try:

1. Open Extensions panel (`Ctrl+Shift+X`)
2. Disable ALL other extensions temporarily
3. Reload window
4. Try DitaCraft commands again

**If it works now:** Another extension was conflicting
**If still doesn't work:** Not an extension conflict

---

### Step 8: Check VS Code User Data

Extensions are installed to user data folder:

**Windows:** `C:\Users\<username>\.vscode\extensions\`

1. Open Windows Explorer
2. Go to: `C:\Users\jjeanne\.vscode\extensions\`
3. Look for folder starting with "your-publisher-name.ditacraft-"

**Questions:**
- Is the folder there?
- What's the folder name?
- Does it contain files?

---

### Step 9: Reinstall VS Code (Last Resort)

If nothing works:

1. Uninstall VS Code completely
2. Delete: `C:\Users\jjeanne\.vscode\`
3. Delete: `C:\Users\jjeanne\AppData\Roaming\Code\`
4. Reinstall VS Code fresh
5. Install DitaCraft extension

---

## Common Issues and Solutions

### Issue: "command not found"
**Cause:** Extension not activated or commands not registered
**Solution:** Check Step 2 (Extension Host Logs) and Step 5 (Output Panel)

### Issue: Commands in palette but grayed out
**Cause:** "when" clauses in package.json restricting availability
**Solution:** Commands like validate/publish only work with DITA files open

### Issue: Extension shows in list but commands don't appear
**Cause:** Activation failed silently
**Solution:** Check Extension Host logs (Step 2)

### Issue: "Cannot find module"
**Cause:** Missing dependency or file
**Solution:** Check Extension Host logs for specific missing file

---

## Debug Checklist

Copy this checklist and fill in the answers:

```
[ ] Extension appears in Extensions panel (Ctrl+Shift+X)
[ ] Extension is ENABLED (not grayed out)
[ ] Extension appears in "Show Running Extensions"
[ ] Extension Host logs show no errors
[ ] Output panel (DitaCraft) shows activation messages
[ ] Minimal test extension works
[ ] Commands appear when typing "DITA:" in command palette
[ ] Opening a .dita file triggers activation
[ ] No popup messages on activation
[ ] VS Code version: ____________
[ ] Extension folder exists in .vscode/extensions/
```

---

## Commands to Run

Run these in Command Prompt and share output:

```cmd
REM Check VS Code version
code --version

REM List installed extensions
code --list-extensions --show-versions | findstr dita

REM Check if extension folder exists
dir "C:\Users\jjeanne\.vscode\extensions\" | findstr dita
```

---

## Next Steps

After completing all steps above, provide:

1. ✅ Checklist results (which steps passed/failed)
2. ✅ Any error messages from Extension Host logs
3. ✅ Output from "DitaCraft" output panel
4. ✅ Screenshot of Extensions panel showing DitaCraft
5. ✅ Results of minimal test extension

With this information, we can identify the exact problem!
