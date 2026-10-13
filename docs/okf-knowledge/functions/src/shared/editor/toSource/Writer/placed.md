---
type: TypeScript Method
title: placed
resource: src/shared/editor/toSource.ts#L284-L302
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/origin
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/toSource/Writer/blockList
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/blockMiddle
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private placed(child: PMNode, indent: string): string`

# Calls

- [has](../../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [origin](../../../../../../functions/src/shared/editor/toSource/Writer/origin.md)
- [startsWith](../../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)

# Called by

- [blockList](../../../../../../functions/src/shared/editor/toSource/Writer/blockList.md)
- [blockMiddle](../../../../../../functions/src/shared/editor/toSource/Writer/blockMiddle.md)