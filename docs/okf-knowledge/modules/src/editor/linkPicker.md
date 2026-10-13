---
type: TypeScript Module
title: linkPicker
resource: src/editor/linkPicker.ts#L1-L299
generated:
  by: okf-rs/0.7.0
relationships:
  imports:
  - target: external/fs
    resolved_by: tree-sitter
    confidence: exact
  - target: external/path
    resolved_by: tree-sitter
    confidence: exact
  - target: external/vscode
    resolved_by: tree-sitter
    confidence: exact
  - target: external/providers-ditalinkprovider
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-cst-parse
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-cst-query
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-cst-types
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-editor-links
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-grammar-classtokens
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-render-labels
    resolved_by: tree-sitter
    confidence: exact
  - target: external/preview-resolver
    resolved_by: tree-sitter
    confidence: exact
  - target: external/preview-workspacetext
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-logger
    resolved_by: tree-sitter
    confidence: exact
  - target: external/imagefiles
    resolved_by: tree-sitter
    confidence: exact
  - target: external/linktargets
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [DialogAnswer](../../../interfaces/src/editor/linkPicker/DialogAnswer.md)
- [LinkPickerContext](../../../interfaces/src/editor/linkPicker/LinkPickerContext.md)
- [tokensFor](../../../functions/src/editor/linkPicker/tokensFor.md)
- [load](../../../functions/src/editor/linkPicker/load.md)
- [candidateFiles](../../../functions/src/editor/linkPicker/candidateFiles.md)
- [fileTargets](../../../functions/src/editor/linkPicker/fileTargets.md)
- [keyTargets](../../../functions/src/editor/linkPicker/keyTargets.md)
- [toQuickPick](../../../functions/src/editor/linkPicker/toQuickPick.md)
- [choose](../../../functions/src/editor/linkPicker/choose.md)
- [askWebAddress](../../../functions/src/editor/linkPicker/askWebAddress.md)
- [pickLinkTarget](../../../functions/src/editor/linkPicker/pickLinkTarget.md)
- [openLinkTarget](../../../functions/src/editor/linkPicker/openLinkTarget.md)

# Imports

- `fs`
- `path`
- `vscode`
- `../providers/ditaLinkProvider`
- `../shared/cst/parse`
- `../shared/cst/query`
- `../shared/cst/types`
- `../shared/editor/links`
- `../shared/grammar/classTokens`
- `../shared/render/labels`
- `../preview/resolver`
- `../preview/workspaceText`
- `../utils/logger`
- `./imageFiles`
- `./linkTargets`

# Member of

- [ditacraft](../../../packages/ditacraft.md)