---
type: TypeScript Function
title: pmName
resource: src/shared/grammar/pmNames.ts#L20-L23
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/schema/buildEditorSchema
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/compiler/contentExpression
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/pmNames/pmBlockName
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/schemaSpec/buildSchemaSpec
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function pmName(elementName: string): string`

# Calls

- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)

# Called by

- [buildEditorSchema](../../../../../functions/src/shared/editor/schema/buildEditorSchema.md)
- [contentExpression](../../../../../functions/src/shared/grammar/compiler/contentExpression.md)
- [pmBlockName](../../../../../functions/src/shared/grammar/pmNames/pmBlockName.md)
- [buildSchemaSpec](../../../../../functions/src/shared/grammar/schemaSpec/buildSchemaSpec.md)