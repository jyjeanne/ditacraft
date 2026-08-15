---
type: TypeScript Function
title: findFileReferences
resource: server/src/utils/referenceParser.ts#L280-L301
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/referenceParser/parseReference
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/moveTopic/handleComputeMoveEdits
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function findFileReferences(text: string): ReferenceOccurrence[]`

# Calls

- [parseReference](../../../../../functions/server/src/utils/referenceParser/parseReference.md)

# Called by

- [handleComputeMoveEdits](../../../../../functions/server/src/features/moveTopic/handleComputeMoveEdits.md)