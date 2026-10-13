---
type: TypeScript Function
title: referencePartAtOffset
resource: server/src/utils/referenceParser.ts#L279-L305
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/part
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/rename/usageAtOffset
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function referencePartAtOffset(ref: ReferenceAtOffset, offset: number): ReferencePart | undefined`

# Calls

- [part](../../../../../functions/src/shared/render/toHtml/Renderer/part.md)

# Called by

- [usageAtOffset](../../../../../functions/server/src/features/rename/usageAtOffset.md)