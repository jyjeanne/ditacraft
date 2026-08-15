---
type: TypeScript Function
title: resolveImageHref
resource: src/commands/insertImageCommand.ts#L118-L161
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/commands/fileCreationCommands/getWorkspaceFolder
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/insertImageCommand/reportUnresolvableHref
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/insertImageCommand/computeImageHref
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/insertImageCommand/copyImageIntoDirectory
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/insertImageCommand/insertImageCommand
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function resolveImageHref(picked: vscode.Uri, documentDir: string): Promise<string | undefined>`

# Calls

- [getWorkspaceFolder](../../../../functions/src/commands/fileCreationCommands/getWorkspaceFolder.md)
- [reportUnresolvableHref](../../../../functions/src/commands/insertImageCommand/reportUnresolvableHref.md)
- [computeImageHref](../../../../functions/src/commands/insertImageCommand/computeImageHref.md)
- [copyImageIntoDirectory](../../../../functions/src/commands/insertImageCommand/copyImageIntoDirectory.md)

# Called by

- [insertImageCommand](../../../../functions/src/commands/insertImageCommand/insertImageCommand.md)