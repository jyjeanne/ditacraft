---
type: TypeScript Function
title: findKeyAtOffset
resource: server/src/utils/referenceParser.ts#L166-L234
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/features/rename/handlePrepareRename
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/handleRename
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function findKeyAtOffset(text: string, offset: number): KeyAtOffset | null`

# Called by

- [handlePrepareRename](../../../../../functions/server/src/features/rename/handlePrepareRename.md)
- [handleRename](../../../../../functions/server/src/features/rename/handleRename.md)