---
type: TypeScript Function
title: validateDitavalStructure
resource: server/src/features/validation.ts#L554-L669
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/features/validation/createRange
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/resources/query/OptionalQueryTemplate/match
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/validation/validateDITAStructure
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function validateDitavalStructure( text: string, diagnostics: Diagnostic[] ): void`

# Calls

- [createRange](../../../../../functions/server/src/features/validation/createRange.md)
- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [match](../../../../../functions/mcp/src/resources/query/OptionalQueryTemplate/match.md)

# Called by

- [validateDITAStructure](../../../../../functions/server/src/features/validation/validateDITAStructure.md)