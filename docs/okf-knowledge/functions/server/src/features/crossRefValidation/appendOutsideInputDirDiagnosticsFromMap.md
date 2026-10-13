---
type: TypeScript Function
title: appendOutsideInputDirDiagnosticsFromMap
resource: server/src/features/crossRefValidation.ts#L602-L636
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/readFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/stripCommentsAndCodeContent
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/isPathInsideDir
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/crossRefValidation/validateCrossReferences
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function appendOutsideInputDirDiagnosticsFromMap( mapPath: string, sourceInputDir: string, range: Range, diagnostics: Diagnostic[], maxProblems: number ): Promise<void>`

# Calls

- [readFile](../../../../../functions/webview/editor/readFile.md)
- [stripCommentsAndCodeContent](../../../../../functions/server/src/utils/textUtils/stripCommentsAndCodeContent.md)
- [isPathInsideDir](../../../../../functions/server/src/features/crossRefValidation/isPathInsideDir.md)

# Called by

- [validateCrossReferences](../../../../../functions/server/src/features/crossRefValidation/validateCrossReferences.md)