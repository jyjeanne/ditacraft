---
type: TypeScript Function
title: findReferencesToKey
resource: server/src/utils/referenceParser.ts#L354-L377
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/utils/referenceParser/referenceMatchesKey
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/rename/handleKeyRename
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function findReferencesToKey(text: string, targetKey: string): ReferenceOccurrence[]`

# Calls

- [referenceMatchesKey](../../../../../functions/server/src/utils/referenceParser/referenceMatchesKey.md)

# Called by

- [handleKeyRename](../../../../../functions/server/src/features/rename/handleKeyRename.md)