---
type: TypeScript Method
title: changedElement
resource: src/shared/editor/toSource.ts#L200-L225
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/toSource/Writer/origin
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/sameXml
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/lineIndent
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/raw
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/openTag/rewriteOpenTag
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/toSource/Writer/node
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private changedElement(node: PMNode, old: PMNode, name: string, indent: string): string`

# Calls

- [origin](../../../../../../functions/src/shared/editor/toSource/Writer/origin.md)
- [sameXml](../../../../../../functions/src/shared/editor/toSource/sameXml.md)
- [lineIndent](../../../../../../functions/src/shared/editor/toSource/Writer/lineIndent.md)
- [raw](../../../../../../functions/src/shared/editor/toSource/Writer/raw.md)
- [rewriteOpenTag](../../../../../../functions/src/shared/cst/openTag/rewriteOpenTag.md)

# Called by

- [node](../../../../../../functions/src/shared/editor/toSource/Writer/node.md)