---
type: TypeScript Function
title: hasNonPredefinedEntityRef
resource: server/src/features/validation.ts#L115-L124
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/validation/checkEntityExpansion
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function hasNonPredefinedEntityRef(value: string): boolean`

# Calls

- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)

# Called by

- [checkEntityExpansion](../../../../../functions/server/src/features/validation/checkEntityExpansion.md)