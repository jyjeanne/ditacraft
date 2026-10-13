---
type: TypeScript Function
title: findReferencesToId
resource: server/src/utils/referenceParser.ts#L241-L264
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/utils/referenceParser/referenceMatchesId
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/references/handleReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/handleIdRename
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/workspaceScanner/findCrossFileReferences
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function findReferencesToId(text: string, targetId: string, isTopicId = false): ReferenceOccurrence[]`

# Calls

- [referenceMatchesId](../../../../../functions/server/src/utils/referenceParser/referenceMatchesId.md)

# Called by

- [handleReferences](../../../../../functions/server/src/features/references/handleReferences.md)
- [handleIdRename](../../../../../functions/server/src/features/rename/handleIdRename.md)
- [findCrossFileReferences](../../../../../functions/server/src/utils/workspaceScanner/findCrossFileReferences.md)