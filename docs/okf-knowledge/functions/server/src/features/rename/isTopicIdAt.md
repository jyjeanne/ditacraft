---
type: TypeScript Function
title: isTopicIdAt
resource: server/src/features/rename.ts#L291-L298
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/rename/handleRename
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function isTopicIdAt(text: string, offset: number): boolean`

# Calls

- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)

# Called by

- [handleRename](../../../../../functions/server/src/features/rename/handleRename.md)