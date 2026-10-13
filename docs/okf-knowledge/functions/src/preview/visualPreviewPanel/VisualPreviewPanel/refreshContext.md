---
type: TypeScript Method
title: refreshContext
resource: src/preview/visualPreviewPanel.ts#L353-L372
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/utils/errorUtils/fireAndForget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/MapContexts/contextOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/scripts/screenshots/key
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderNow
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private refreshContext(): void`

# Calls

- [fireAndForget](../../../../../functions/src/utils/errorUtils/fireAndForget.md)
- [contextOf](../../../../../functions/src/preview/mapContexts/MapContexts/contextOf.md)
- [key](../../../../../functions/scripts/screenshots/key.md)
- [renderNow](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderNow.md)