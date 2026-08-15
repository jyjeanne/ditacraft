---
type: TypeScript Function
title: findIdAtOffset
resource: server/src/utils/referenceParser.ts#L107-L147
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/features/references/handleReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/handlePrepareRename
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/handleRename
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function findIdAtOffset(text: string, offset: number): { id: string; valueStart: number; valueEnd: number } | null`

# Called by

- [handleReferences](../../../../../functions/server/src/features/references/handleReferences.md)
- [handlePrepareRename](../../../../../functions/server/src/features/rename/handlePrepareRename.md)
- [handleRename](../../../../../functions/server/src/features/rename/handleRename.md)