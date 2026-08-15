---
type: TypeScript Function
title: locationAtFileStart
resource: server/src/features/definition.ts#L175-L180
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/features/definition/handleDefinition
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/definition/resolveElementInFile
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function locationAtFileStart(uri: string): Location`

# Called by

- [handleDefinition](../../../../../functions/server/src/features/definition/handleDefinition.md)
- [resolveElementInFile](../../../../../functions/server/src/features/definition/resolveElementInFile.md)