---
type: TypeScript Function
title: pastedImageName
resource: src/editor/imageFiles.ts#L41-L49
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/images
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function pastedImageName(docPath: string, ext: string, taken: (name: string) => boolean): string`

# Calls

- [basename](../../../../functions/src/shared/render/toHtml/basename.md)

# Called by

- [images](../../../../functions/src/editor/visualEditorProvider/EditorSession/images.md)