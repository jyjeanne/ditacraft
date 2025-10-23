# DITA-OT Integration Documentation

## Overview

The DitaCraft extension integrates with DITA-OT (DITA Open Toolkit) to provide publishing capabilities directly from VS Code. This document explains the integration approach, configuration options, and usage.

## Integration Approach

### 1. **Detection Strategy**

The extension uses a multi-tier approach to detect DITA-OT:

1. **User-Configured Path** (Priority 1)
   - Check `ditacraft.ditaOtPath` setting
   - Verify `bin/dita` or `bin/dita.bat` exists
   - Most reliable method for custom installations

2. **System PATH** (Priority 2)
   - Attempt to execute `dita` command
   - Works when DITA-OT is globally installed
   - Platform-agnostic approach

3. **Verification**
   - Run `dita --version` to confirm installation
   - Extract and display version information
   - Warn user if detection fails

### 2. **Command Execution**

The extension uses Node.js `child_process` to execute DITA-OT:

```typescript
// Basic publish command structure
dita --input <file.ditamap> --format <transtype> --output <output-dir>
```

**Process Management:**
- Uses `spawn()` for long-running processes with progress tracking
- Uses `exec()` for quick queries (version, transtypes)
- Captures stdout/stderr for progress reporting and error handling

### 3. **Platform Support**

| Platform | Command | Location |
|----------|---------|----------|
| Windows  | `dita.bat` or `dita.cmd` | `%DITA_OT%\bin\dita.bat` |
| macOS    | `dita` | `$DITA_OT/bin/dita` |
| Linux    | `dita` | `$DITA_OT/bin/dita` |

## Configuration Options

### VS Code Settings

#### `ditacraft.ditaOtPath`
- **Type:** `string`
- **Default:** `""` (empty - use system PATH)
- **Description:** Absolute path to DITA-OT installation directory
- **Example:**
  - Windows: `C:\DITA-OT-4.2.1`
  - macOS/Linux: `/usr/local/dita-ot-4.2.1`

#### `ditacraft.defaultTranstype`
- **Type:** `string` (enum)
- **Default:** `"html5"`
- **Options:** `html5`, `pdf`, `xhtml`, `epub`, `htmlhelp`, `markdown`
- **Description:** Default output format when publishing

#### `ditacraft.outputDirectory`
- **Type:** `string`
- **Default:** `"${workspaceFolder}/out"`
- **Description:** Directory for published output
- **Variables Supported:**
  - `${workspaceFolder}` - Current workspace root

#### `ditacraft.ditaOtArgs`
- **Type:** `array` of strings
- **Default:** `[]`
- **Description:** Additional command-line arguments for DITA-OT
- **Example:** `["--verbose", "--filter=myfilter.ditaval"]`

## Publishing Workflow

### 1. **Pre-Publishing Validation**

```typescript
// Validate input file
- Check file exists
- Verify extension (.dita, .ditamap, .bookmap)
- Check DITA-OT is available
```

### 2. **Building Command**

```typescript
const args = [
    '--input', '/path/to/file.ditamap',
    '--format', 'html5',
    '--output', '/path/to/output',
    '--temp', '/path/to/temp',  // Optional
    ...additionalArgs            // User-defined
];
```

### 3. **Progress Tracking**

The integration monitors DITA-OT output and reports progress:

| Stage | Pattern Detected | Progress % |
|-------|-----------------|------------|
| Starting | Process spawn | 0% |
| Processing | `[echo]` messages | 10% |
| Pipeline | `[pipeline]` messages | 30% |
| Transforming | `[xslt] Processing` | 50% |
| Finalizing | `[move] Moving` | 80% |
| Complete | `BUILD SUCCESSFUL` | 100% |

### 4. **Output Handling**

- **HTML5:** Opens WebView preview automatically
- **PDF/Other:** Shows output directory notification
- **Errors:** Displays in Problems panel and notification

## API Methods

### DitaOtWrapper Class

#### `verifyInstallation()`
```typescript
// Check if DITA-OT is installed and get version
const result = await ditaOt.verifyInstallation();
// Returns: { installed: boolean, version?: string, path?: string }
```

#### `getAvailableTranstypes()`
```typescript
// Query available output formats
const transtypes = await ditaOt.getAvailableTranstypes();
// Returns: string[] (e.g., ['html5', 'pdf', 'xhtml', ...])
```

#### `publish(options, progressCallback)`
```typescript
// Publish DITA content
const result = await ditaOt.publish({
    inputFile: '/path/to/file.ditamap',
    transtype: 'html5',
    outputDir: '/path/to/output',
    tempDir: '/path/to/temp',
    additionalArgs: ['--verbose']
}, (progress) => {
    console.log(`${progress.stage}: ${progress.percentage}%`);
});
// Returns: { success: boolean, outputPath: string, error?: string }
```

#### `configureOtPath()`
```typescript
// Open folder picker to configure DITA-OT path
await ditaOt.configureOtPath();
// Updates settings automatically
```

#### `validateInputFile(filePath)`
```typescript
// Validate file is suitable for publishing
const result = ditaOt.validateInputFile('/path/to/file.dita');
// Returns: { valid: boolean, error?: string }
```

## Supported Transtypes

### Core Transtypes (DITA-OT Built-in)

| Transtype | Description | Output |
|-----------|-------------|--------|
| `html5` | HTML5 responsive output | HTML files |
| `pdf` | PDF via Apache FOP | PDF file |
| `xhtml` | XHTML output | XHTML files |
| `epub` | EPUB3 e-book format | EPUB file |
| `htmlhelp` | HTML Help (CHM) | CHM file |
| `markdown` | Markdown conversion | MD files |

### Plugin Transtypes
Additional transtypes available through DITA-OT plugins will be auto-detected.

## Error Handling

### Common Errors and Solutions

#### Error: "DITA-OT not found"
**Cause:** DITA-OT not installed or not in PATH
**Solution:**
1. Install DITA-OT from https://www.dita-ot.org/download
2. Set `ditacraft.ditaOtPath` setting
3. Or add DITA-OT bin directory to system PATH

#### Error: "Invalid input file"
**Cause:** File is not a valid DITA file
**Solution:** Ensure file has `.dita`, `.ditamap`, or `.bookmap` extension

#### Error: "Build failed"
**Cause:** DITA-OT transformation error (syntax, missing resources, etc.)
**Solution:** Check DITA-OT output in Output panel for detailed errors

#### Error: "Permission denied"
**Cause:** Cannot write to output directory
**Solution:** Check folder permissions or change `ditacraft.outputDirectory`

## Performance Considerations

### Optimization Tips

1. **Temp Directory**
   - Use SSD location for faster processing
   - Clean temp directory periodically
   - Default: System temp directory

2. **Output Directory**
   - Use local directory (not network drive)
   - Avoid deep folder hierarchies
   - Clean old outputs to save space

3. **Large Documents**
   - For large bookmaps, expect longer processing times
   - Progress tracking helps monitor status
   - Consider splitting very large documents

## Testing DITA-OT Integration

### Manual Testing Checklist

- [ ] DITA-OT detection (user path)
- [ ] DITA-OT detection (system PATH)
- [ ] Version verification
- [ ] Transtype enumeration
- [ ] HTML5 publishing
- [ ] PDF publishing (if Apache FOP configured)
- [ ] Progress reporting
- [ ] Error handling (invalid files)
- [ ] Error handling (DITA-OT errors)
- [ ] Output directory creation
- [ ] Configuration dialog

### Automated Tests

Unit tests should cover:
- Path detection logic
- Command argument building
- Progress parsing
- Error message extraction
- Platform-specific command selection

## Future Enhancements

### Planned Features
1. **Bundled DITA-OT** - Include portable DITA-OT with extension
2. **Plugin Management** - Install/manage DITA-OT plugins
3. **Build Profiles** - Save and reuse publishing configurations
4. **Parallel Builds** - Publish to multiple formats simultaneously
5. **Custom Templates** - Support custom DITA-OT plugins/themes

## References

- [DITA-OT Documentation](https://www.dita-ot.org/dev/)
- [DITA-OT Parameters](https://www.dita-ot.org/dev/parameters/)
- [DITA-OT Installing](https://www.dita-ot.org/dev/topics/installing-client.html)
- [DITA-OT Building Output](https://www.dita-ot.org/dev/topics/build-using-dita-command.html)
