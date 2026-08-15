---
type: TypeScript Function
title: buildImageSnippet
resource: src/commands/insertImageCommand.ts#L321-L327
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/commands/insertImageCommand/buildImageElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/editorInsertUtils/indentContinuationLines
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/insertImageCommand/insertImageCommand
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function buildImageSnippet(href: string, caption: string, alt: string, size?: ImageSizeAttrs): string`

# Calls

- [buildImageElement](../../../../functions/src/commands/insertImageCommand/buildImageElement.md)
- [indentContinuationLines](../../../../functions/src/utils/editorInsertUtils/indentContinuationLines.md)

# Called by

- [insertImageCommand](../../../../functions/src/commands/insertImageCommand/insertImageCommand.md)