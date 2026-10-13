---
type: TypeScript Function
title: fileTargets
resource: src/editor/linkPicker.ts#L111-L124
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/editor/linkPicker/tokensFor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/linkPicker/candidateFiles
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/linkTargets/fileSummary
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/linkPicker/pickLinkTarget
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function fileTargets(ctx: LinkPickerContext): Promise<FileTarget[]>`

# Calls

- [tokensFor](../../../../functions/src/editor/linkPicker/tokensFor.md)
- [candidateFiles](../../../../functions/src/editor/linkPicker/candidateFiles.md)
- [fileSummary](../../../../functions/src/editor/linkTargets/fileSummary.md)

# Called by

- [pickLinkTarget](../../../../functions/src/editor/linkPicker/pickLinkTarget.md)