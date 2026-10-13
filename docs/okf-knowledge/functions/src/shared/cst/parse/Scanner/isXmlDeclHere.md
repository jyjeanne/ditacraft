---
type: TypeScript Method
title: isXmlDeclHere
resource: src/shared/cst/parse.ts#L94-L98
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/isWs
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/cst/parse/Scanner/parseNode
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private isXmlDeclHere(): boolean`

# Calls

- [isWs](../../../../../../functions/src/shared/cst/parse/isWs.md)

# Called by

- [parseNode](../../../../../../functions/src/shared/cst/parse/Scanner/parseNode.md)