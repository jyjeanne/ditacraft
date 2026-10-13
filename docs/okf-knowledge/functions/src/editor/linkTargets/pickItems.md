---
type: TypeScript Function
title: pickItems
resource: src/editor/linkTargets.ts#L146-L165
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/editor/linkTargets/docLink
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/imageFiles/hrefFor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/linkTargets/fileLink
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/linkPicker/pickLinkTarget
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function pickItems(docPath: string, here: DocTarget[], keys: KeyTarget[], files: FileTarget[], labels: PickLabels, wholeFiles = false): PickItem[]`

# Calls

- [docLink](../../../../functions/src/editor/linkTargets/docLink.md)
- [basename](../../../../functions/src/shared/render/toHtml/basename.md)
- [hrefFor](../../../../functions/src/editor/imageFiles/hrefFor.md)
- [fileLink](../../../../functions/src/editor/linkTargets/fileLink.md)

# Called by

- [pickLinkTarget](../../../../functions/src/editor/linkPicker/pickLinkTarget.md)