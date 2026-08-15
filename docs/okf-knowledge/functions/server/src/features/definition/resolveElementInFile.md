---
type: TypeScript Function
title: resolveElementInFile
resource: server/src/features/definition.ts#L147-L173
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/definition/locationAtFileStart
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/referenceParser/findElementByIdOffset
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/definition/handleDefinition
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function resolveElementInFile( filePath: string, fileUri: string, workspaceFolders: readonly string[], elementId?: string ): Location | null`

# Calls

- [locationAtFileStart](../../../../../functions/server/src/features/definition/locationAtFileStart.md)
- [findElementByIdOffset](../../../../../functions/server/src/utils/referenceParser/findElementByIdOffset.md)

# Called by

- [handleDefinition](../../../../../functions/server/src/features/definition/handleDefinition.md)