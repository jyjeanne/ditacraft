---
type: TypeScript Function
title: tokensFor
resource: src/editor/linkPicker.ts#L51-L53
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/grammar/classTokens/classTokens
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/linkPicker/fileTargets
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/linkPicker/pickLinkTarget
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function tokensFor(classOf: (name: string) => string | undefined): (el: ElementNode) => string[]`

# Calls

- [classTokens](../../../../functions/src/shared/grammar/classTokens/classTokens.md)

# Called by

- [fileTargets](../../../../functions/src/editor/linkPicker/fileTargets.md)
- [pickLinkTarget](../../../../functions/src/editor/linkPicker/pickLinkTarget.md)