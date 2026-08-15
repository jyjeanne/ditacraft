---
type: TypeScript Module
title: insertImageCommand
resource: src/commands/insertImageCommand.ts#L1-L340
generated:
  by: okf-rs/0.4.0
relationships:
  imports:
  - target: external/vscode
    resolved_by: tree-sitter
    confidence: exact
  - target: external/path
    resolved_by: tree-sitter
    confidence: exact
  - target: external/fs-promises
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-constants
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-logger
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-xmlutils
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-editorinsertutils
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [ImageSizeAttrs](../../../interfaces/src/commands/insertImageCommand/ImageSizeAttrs.md)
- [insertImageCommand](../../../functions/src/commands/insertImageCommand/insertImageCommand.md)
- [isEligibleDocument](../../../functions/src/commands/insertImageCommand/isEligibleDocument.md)
- [resolveImageHref](../../../functions/src/commands/insertImageCommand/resolveImageHref.md)
- [reportUnresolvableHref](../../../functions/src/commands/insertImageCommand/reportUnresolvableHref.md)
- [copyImageIntoDirectory](../../../functions/src/commands/insertImageCommand/copyImageIntoDirectory.md)
- [computeImageHref](../../../functions/src/commands/insertImageCommand/computeImageHref.md)
- [promptForImageSize](../../../functions/src/commands/insertImageCommand/promptForImageSize.md)
- [promptForNmtokenValue](../../../functions/src/commands/insertImageCommand/promptForNmtokenValue.md)
- [buildImageSnippet](../../../functions/src/commands/insertImageCommand/buildImageSnippet.md)
- [buildImageElement](../../../functions/src/commands/insertImageCommand/buildImageElement.md)

# Imports

- `vscode`
- `path`
- `fs/promises`
- `../utils/constants`
- `../utils/logger`
- `../utils/xmlUtils`
- `../utils/editorInsertUtils`

# Member of

- [ditacraft](../../../packages/ditacraft.md)