---
type: TypeScript Function
title: isPathInsideDir
resource: server/src/features/crossRefValidation.ts#L566-L569
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/crossRefValidation/validateCrossReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/appendOutsideInputDirDiagnosticsFromMap
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function isPathInsideDir(candidatePath: string, dirPath: string): boolean`

# Calls

- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)

# Called by

- [validateCrossReferences](../../../../../functions/server/src/features/crossRefValidation/validateCrossReferences.md)
- [appendOutsideInputDirDiagnosticsFromMap](../../../../../functions/server/src/features/crossRefValidation/appendOutsideInputDirDiagnosticsFromMap.md)