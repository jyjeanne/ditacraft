---
type: TypeScript Method
title: block
resource: src/shared/editor/toProseMirror.ts#L281-L309
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/toProseMirror/Builder/isReference
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/opaque
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/viewFor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/attrsFor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/inlineContent
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/types/isElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/needsBlock
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/blockContent
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/prepareTable
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/schema/buildEditorSchema
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/fragment
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/blockContent
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/buildDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/clipboardParser
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`block(el: ElementNode): PMNode`

# Calls

- [isReference](../../../../../../functions/src/shared/editor/toProseMirror/Builder/isReference.md)
- [opaque](../../../../../../functions/src/shared/editor/toProseMirror/Builder/opaque.md)
- [viewFor](../../../../../../functions/src/shared/editor/toProseMirror/Builder/viewFor.md)
- [attrsFor](../../../../../../functions/src/shared/editor/toProseMirror/Builder/attrsFor.md)
- [inlineContent](../../../../../../functions/src/shared/editor/toProseMirror/Builder/inlineContent.md)
- [isElement](../../../../../../functions/src/shared/cst/types/isElement.md)
- [needsBlock](../../../../../../functions/src/shared/editor/toProseMirror/Builder/needsBlock.md)
- [blockContent](../../../../../../functions/src/shared/editor/toProseMirror/Builder/blockContent.md)
- [prepareTable](../../../../../../functions/src/shared/editor/toProseMirror/Builder/prepareTable.md)

# Called by

- [buildEditorSchema](../../../../../../functions/src/shared/editor/schema/buildEditorSchema.md)
- [fragment](../../../../../../functions/src/shared/editor/toProseMirror/Builder/fragment.md)
- [blockContent](../../../../../../functions/src/shared/editor/toProseMirror/Builder/blockContent.md)
- [buildDocument](../../../../../../functions/src/shared/editor/toProseMirror/buildDocument.md)
- [clipboardParser](../../../../../../functions/webview/editor/clipboardParser.md)