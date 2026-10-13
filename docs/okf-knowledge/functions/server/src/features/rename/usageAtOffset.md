---
type: TypeScript Function
title: usageAtOffset
resource: server/src/features/rename.ts#L161-L165
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/utils/referenceParser/findReferenceAtOffset
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/referenceParser/referencePartAtOffset
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/rename/handlePrepareRename
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/handleRename
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function usageAtOffset(text: string, offset: number): Usage | undefined`

# Calls

- [findReferenceAtOffset](../../../../../functions/server/src/utils/referenceParser/findReferenceAtOffset.md)
- [referencePartAtOffset](../../../../../functions/server/src/utils/referenceParser/referencePartAtOffset.md)

# Called by

- [handlePrepareRename](../../../../../functions/server/src/features/rename/handlePrepareRename.md)
- [handleRename](../../../../../functions/server/src/features/rename/handleRename.md)