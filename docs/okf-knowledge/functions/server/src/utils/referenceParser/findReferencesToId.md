---
type: TypeScript Function
title: findReferencesToId
resource: server/src/utils/referenceParser.ts#L240-L263
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/referenceParser/referenceMatchesId
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/references/handleReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/handleRename
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/workspaceScanner/findCrossFileReferences
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function findReferencesToId(text: string, targetId: string): ReferenceOccurrence[]`

# Calls

- [referenceMatchesId](../../../../../functions/server/src/utils/referenceParser/referenceMatchesId.md)

# Called by

- [handleReferences](../../../../../functions/server/src/features/references/handleReferences.md)
- [handleRename](../../../../../functions/server/src/features/rename/handleRename.md)
- [findCrossFileReferences](../../../../../functions/server/src/utils/workspaceScanner/findCrossFileReferences.md)