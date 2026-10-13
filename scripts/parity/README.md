# LSP vs DITA-OT parity helpers

Utilities to compare DitaCraft LSP diagnostics with DITA-OT validation output.

## Scripts

- `run-lsp-diagnostics.js`  
  Runs standalone `dist/lsp-server.js` on a JSON file list and writes per-file diagnostics summary.
- `parse-ditaot-log.js`  
  Parses `DitaOtValidateTask` console logs into structured JSON counts by file, including per-issue code/severity entries.
- `compare-results.js`  
  Compares LSP and DITA-OT summaries and emits JSON + Markdown report with mismatch families (`scope`, `key-space`, `dotx-build-time`, `resource-availability`, `other`).

## Typical flow

1. Generate a map file list (`map-files.json`).
2. Run LSP diagnostics:
   - `node scripts/parity/run-lsp-diagnostics.js <lspServerJs> <workspaceRoot> <mapFilesJson> <lspOutJson> --ditaot-profile`
3. Run DITA-OT validation with Gradle plugin and capture log.
4. Parse DITA-OT log:
   - `node scripts/parity/parse-ditaot-log.js <ditaotRawLog> <mapFilesJson> <ditaotOutJson>`
5. Compare:
   - `node scripts/parity/compare-results.js <mapFilesJson> <lspOutJson> <ditaotOutJson> <reportJson> <reportMd>`
   - optional normalization profile:
     - `node scripts/parity/compare-results.js <mapFilesJson> <lspOutJson> <ditaotOutJson> <reportJson> <reportMd> --normalization ditaot-known-limits`

## Notes

- `--ditaot-profile` enables a comparison profile in LSP (`typesxml`, `ditaRulesEnabled=false`, `subjectSchemeValidationEnabled=false`) to better match DITA-OT validation scope.
- The DITA-OT parser relies on `Validating:` sections emitted by `DitaOtValidateTask`.
- `--normalization ditaot-known-limits` filters mismatch families known to diverge by design or tooling limits in the full corpus:
  - `scope` (`DITA-STRUCT-004`, `DITA-SCOPE-*`, `DOTJ036W`)
  - `key-space` (`DITA-KEY-001`, `DOTX019W`, `DOTX030W`)
  - `dotx-build-time` (`DOTX008E`, `DOTX023W`, `DOTX026W`, `DOTX027W`)
  - `resource-availability` (`DITA-XREF-001` when the map set references generated or optional resources not loaded by DITA-OT validate in the same way)
