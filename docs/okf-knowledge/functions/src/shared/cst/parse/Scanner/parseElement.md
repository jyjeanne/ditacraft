---
type: TypeScript Method
title: parseElement
resource: src/shared/cst/parse.ts#L196-L264
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/parseName
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/skipWs
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/parseAttr
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/eof
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/parseNode
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/cst/parse/Scanner/parseNode
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private parseElement(parent: ElementNode | null): ElementNode`

# Calls

- [parseName](../../../../../../functions/src/shared/cst/parse/Scanner/parseName.md)
- [skipWs](../../../../../../functions/src/shared/cst/parse/Scanner/skipWs.md)
- [parseAttr](../../../../../../functions/src/shared/cst/parse/Scanner/parseAttr.md)
- [eof](../../../../../../functions/src/shared/cst/parse/Scanner/eof.md)
- [parseNode](../../../../../../functions/src/shared/cst/parse/Scanner/parseNode.md)

# Called by

- [parseNode](../../../../../../functions/src/shared/cst/parse/Scanner/parseNode.md)