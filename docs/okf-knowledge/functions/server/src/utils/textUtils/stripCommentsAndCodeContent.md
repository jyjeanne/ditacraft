---
type: TypeScript Function
title: stripCommentsAndCodeContent
resource: server/src/utils/textUtils.ts#L32-L37
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/server/src/features/crossRefValidation/validateCrossReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/getInvalidKeyNamesFromMap
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/appendOutsideInputDirDiagnosticsFromMap
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/appendDitaOtChunkBuildWarnings
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/profilingValidation/validateProfilingAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/validateDITAStructure
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/validateIDs
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function stripCommentsAndCodeContent(text: string): string`

# Called by

- [validateCrossReferences](../../../../../functions/server/src/features/crossRefValidation/validateCrossReferences.md)
- [getInvalidKeyNamesFromMap](../../../../../functions/server/src/features/crossRefValidation/getInvalidKeyNamesFromMap.md)
- [appendOutsideInputDirDiagnosticsFromMap](../../../../../functions/server/src/features/crossRefValidation/appendOutsideInputDirDiagnosticsFromMap.md)
- [appendDitaOtChunkBuildWarnings](../../../../../functions/server/src/features/crossRefValidation/appendDitaOtChunkBuildWarnings.md)
- [validateProfilingAttributes](../../../../../functions/server/src/features/profilingValidation/validateProfilingAttributes.md)
- [validateDITAStructure](../../../../../functions/server/src/features/validation/validateDITAStructure.md)
- [validateIDs](../../../../../functions/server/src/features/validation/validateIDs.md)