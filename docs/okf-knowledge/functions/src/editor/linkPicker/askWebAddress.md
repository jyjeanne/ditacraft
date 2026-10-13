---
type: TypeScript Function
title: askWebAddress
resource: src/editor/linkPicker.ts#L195-L202
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/editor/linkTargets/webLink
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/linkPicker/pickLinkTarget
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function askWebAddress(ctx: LinkPickerContext, value: string): Promise<LinkTarget | undefined>`

# Calls

- [webLink](../../../../functions/src/editor/linkTargets/webLink.md)

# Called by

- [pickLinkTarget](../../../../functions/src/editor/linkPicker/pickLinkTarget.md)