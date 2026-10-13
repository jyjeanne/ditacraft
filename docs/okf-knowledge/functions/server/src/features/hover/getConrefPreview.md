---
type: TypeScript Function
title: getConrefPreview
resource: server/src/features/hover.ts#L251-L270
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/readFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/referenceParser/getTargetId
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/elementExtent/findElementExtentById
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/hover/getKeyrefHover
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/hover/getHrefHover
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function getConrefPreview(filePath: string, fragment: string): Promise<string | null>`

# Calls

- [readFile](../../../../../functions/webview/editor/readFile.md)
- [getTargetId](../../../../../functions/server/src/utils/referenceParser/getTargetId.md)
- [findElementExtentById](../../../../../functions/server/src/utils/elementExtent/findElementExtentById.md)

# Called by

- [getKeyrefHover](../../../../../functions/server/src/features/hover/getKeyrefHover.md)
- [getHrefHover](../../../../../functions/server/src/features/hover/getHrefHover.md)