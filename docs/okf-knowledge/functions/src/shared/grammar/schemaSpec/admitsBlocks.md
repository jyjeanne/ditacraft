---
type: TypeScript Function
title: admitsBlocks
resource: src/shared/grammar/schemaSpec.ts#L28-L30
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/grammar/schemaSpec/buildSchemaSpec
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function admitsBlocks(content: string, blockNames: Set<string>): boolean`

# Calls

- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)

# Called by

- [buildSchemaSpec](../../../../../functions/src/shared/grammar/schemaSpec/buildSchemaSpec.md)