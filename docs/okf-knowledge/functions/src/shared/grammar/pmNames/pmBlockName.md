---
type: TypeScript Function
title: pmBlockName
resource: src/shared/grammar/pmNames.ts#L25-L27
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/grammar/pmNames/pmName
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/schema/buildEditorSchema
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/compiler/contentExpression
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function pmBlockName(elementName: string): string`

# Calls

- [pmName](../../../../../functions/src/shared/grammar/pmNames/pmName.md)

# Called by

- [buildEditorSchema](../../../../../functions/src/shared/editor/schema/buildEditorSchema.md)
- [contentExpression](../../../../../functions/src/shared/grammar/compiler/contentExpression.md)