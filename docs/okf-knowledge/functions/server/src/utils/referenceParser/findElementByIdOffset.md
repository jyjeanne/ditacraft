---
type: TypeScript Function
title: findElementByIdOffset
resource: server/src/utils/referenceParser.ts#L370-L380
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/mcp/src/tools/ditaResolveReference/resolveConkeyref
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/definition/resolveInDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/definition/resolveElementInFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/references/handleReferences
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function findElementByIdOffset(text: string, elementId: string): number`

# Called by

- [resolveConkeyref](../../../../../functions/mcp/src/tools/ditaResolveReference/resolveConkeyref.md)
- [resolveInDocument](../../../../../functions/server/src/features/definition/resolveInDocument.md)
- [resolveElementInFile](../../../../../functions/server/src/features/definition/resolveElementInFile.md)
- [handleReferences](../../../../../functions/server/src/features/references/handleReferences.md)