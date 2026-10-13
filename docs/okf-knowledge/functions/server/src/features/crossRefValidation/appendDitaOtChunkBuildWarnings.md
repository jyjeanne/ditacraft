---
type: TypeScript Function
title: appendDitaOtChunkBuildWarnings
resource: server/src/features/crossRefValidation.ts#L638-L695
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/readFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/stripCommentsAndCodeContent
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/offsetToRange
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/crossRefValidation/validateCrossReferences
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function appendDitaOtChunkBuildWarnings( cleanText: string, text: string, mapFilePath: string, diagnostics: Diagnostic[], maxProblems: number ): Promise<void>`

# Calls

- [find](../../../../../functions/webview/editor/mapView/RowDrag/find.md)
- [readFile](../../../../../functions/webview/editor/readFile.md)
- [stripCommentsAndCodeContent](../../../../../functions/server/src/utils/textUtils/stripCommentsAndCodeContent.md)
- [offsetToRange](../../../../../functions/server/src/utils/textUtils/offsetToRange.md)

# Called by

- [validateCrossReferences](../../../../../functions/server/src/features/crossRefValidation/validateCrossReferences.md)