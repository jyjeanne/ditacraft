---
type: TypeScript Function
title: parseElementTree
resource: server/src/features/contentModelValidation.ts#L320-L399
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/tagStack/resyncStackToMatch
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/contentModelValidation/validateContentModel
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function parseElementTree(content: string): { root: XmlElement | null; parseDiags: Diagnostic[] }`

# Calls

- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)
- [resyncStackToMatch](../../../../../functions/server/src/utils/tagStack/resyncStackToMatch.md)

# Called by

- [validateContentModel](../../../../../functions/server/src/features/contentModelValidation/validateContentModel.md)