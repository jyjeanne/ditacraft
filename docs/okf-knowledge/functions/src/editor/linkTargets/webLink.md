---
type: TypeScript Function
title: webLink
resource: src/editor/linkTargets.ts#L127-L133
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/editor/linkPicker/askWebAddress
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/linkPicker/pickLinkTarget
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function webLink(address: string): LinkTarget | undefined`

# Called by

- [askWebAddress](../../../../functions/src/editor/linkPicker/askWebAddress.md)
- [pickLinkTarget](../../../../functions/src/editor/linkPicker/pickLinkTarget.md)