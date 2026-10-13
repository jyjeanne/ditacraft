---
type: TypeScript Function
title: reuseCopy
resource: src/editor/reuseCopy.ts#L51-L148
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/html/decodeXmlText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/decode
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/types/isElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/collect
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/paths/samePath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/reuseCopy/isWithin
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/reuseCopy/rebase
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/reuseCopy/resolvedAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/reuseCopy/sameAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/openTag/rewriteOpenTag
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/reuse
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorReuse/test/copyOf
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function reuseCopy(input: ReuseCopyInput): string`

# Calls

- [decodeXmlText](../../../../functions/src/shared/render/html/decodeXmlText.md)
- [decode](../../../../functions/src/preview/resolver/decode.md)
- [isElement](../../../../functions/src/shared/cst/types/isElement.md)
- [collect](../../../../functions/src/preview/resolver/ReferenceResolver/collect.md)
- [samePath](../../../../functions/src/preview/paths/samePath.md)
- [isWithin](../../../../functions/src/editor/reuseCopy/isWithin.md)
- [has](../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [rebase](../../../../functions/src/editor/reuseCopy/rebase.md)
- [resolvedAttributes](../../../../functions/src/editor/reuseCopy/resolvedAttributes.md)
- [find](../../../../functions/webview/editor/mapView/RowDrag/find.md)
- [sameAttributes](../../../../functions/src/editor/reuseCopy/sameAttributes.md)
- [rewriteOpenTag](../../../../functions/src/shared/cst/openTag/rewriteOpenTag.md)

# Called by

- [reuse](../../../../functions/src/editor/visualEditorProvider/EditorSession/reuse.md)
- [copyOf](../../../../functions/src/test/shared/editorReuse/test/copyOf.md)