---
type: TypeScript Function
title: copyImageIntoDirectory
resource: src/commands/insertImageCommand.ts#L186-L221
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/readFile
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/insertImageCommand/resolveImageHref
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function copyImageIntoDirectory(sourcePath: string, targetDir: string): Promise<string>`

# Calls

- [basename](../../../../functions/src/shared/render/toHtml/basename.md)
- [readFile](../../../../functions/webview/editor/readFile.md)

# Called by

- [resolveImageHref](../../../../functions/src/commands/insertImageCommand/resolveImageHref.md)