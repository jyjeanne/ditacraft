---
type: TypeScript Method
title: flagMarker
resource: src/shared/render/toHtml.ts#L593-L598
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/html/escapeHtml
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/render/toHtml/Renderer/injectFlags
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private flagMarker(image: string | undefined, text: string | undefined): string`

# Calls

- [escapeHtml](../../../../../../functions/src/shared/render/html/escapeHtml.md)

# Called by

- [injectFlags](../../../../../../functions/src/shared/render/toHtml/Renderer/injectFlags.md)