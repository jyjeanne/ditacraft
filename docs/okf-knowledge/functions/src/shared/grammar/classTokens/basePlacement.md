---
type: TypeScript Function
title: basePlacement
resource: src/shared/grammar/classTokens.ts#L79-L94
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/grammar/classTokens/baseToken
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/schema/kindOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/compiler/compileGrammar
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/conrefRange
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function basePlacement(classValue: string | undefined): Placement | undefined`

# Calls

- [baseToken](../../../../../functions/src/shared/grammar/classTokens/baseToken.md)
- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)

# Called by

- [kindOf](../../../../../functions/src/shared/editor/schema/kindOf.md)
- [compileGrammar](../../../../../functions/src/shared/grammar/compiler/compileGrammar.md)
- [conrefRange](../../../../../functions/src/shared/render/toHtml/Renderer/conrefRange.md)