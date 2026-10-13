---
type: TypeScript Function
title: collectScopedIds
resource: server/src/features/validation.ts#L755-L834
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/features/validation/findTagEnd
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/resources/query/OptionalQueryTemplate/match
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/validation/validateIDs
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function collectScopedIds(text: string): CollectedIds`

# Calls

- [findTagEnd](../../../../../functions/server/src/features/validation/findTagEnd.md)
- [match](../../../../../functions/mcp/src/resources/query/OptionalQueryTemplate/match.md)
- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)

# Called by

- [validateIDs](../../../../../functions/server/src/features/validation/validateIDs.md)