---
type: TypeScript Function
title: groupOf
resource: src/shared/editor/properties.ts#L65-L79
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/properties/propertiesOf
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function groupOf(name: string, profiling: Set<string>): PropertyGroup`

# Calls

- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)

# Called by

- [propertiesOf](../../../../../functions/src/shared/editor/properties/propertiesOf.md)