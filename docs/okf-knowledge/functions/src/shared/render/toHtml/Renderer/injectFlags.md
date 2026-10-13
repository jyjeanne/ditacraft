---
type: TypeScript Method
title: injectFlags
resource: src/shared/render/toHtml.ts#L579-L591
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/flagMarker
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/render/toHtml/Renderer/part
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private injectFlags(html: string, flags: FlagStyle[]): string`

# Calls

- [flagMarker](../../../../../../functions/src/shared/render/toHtml/Renderer/flagMarker.md)

# Called by

- [part](../../../../../../functions/src/shared/render/toHtml/Renderer/part.md)