---
type: TypeScript Function
title: resolvedAttributes
resource: src/editor/reuseCopy.ts#L151-L160
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/reuseCopy/reuseCopy
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function resolvedAttributes(referencing: AttributePairs, reused: AttributePairs): AttributePairs`

# Calls

- [has](../../../../functions/src/shared/render/toHtml/Renderer/has.md)

# Called by

- [reuseCopy](../../../../functions/src/editor/reuseCopy/reuseCopy.md)