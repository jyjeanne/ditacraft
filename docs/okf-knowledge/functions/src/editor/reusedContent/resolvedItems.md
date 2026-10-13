---
type: TypeScript Function
title: resolvedItems
resource: src/editor/reusedContent.ts#L28-L69
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/resolver/ReferenceResolver/collect
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/renderElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/postResolved
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorReused/test/resolve
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function resolvedItems(doc: Document, resolver: ReferenceResolver, resolutions: ReadonlyMap<ElementNode, Resolution>, options: RenderOptions, imageUrl: (absolutePath: string) => string | undefined): ResolvedItem[]`

# Calls

- [collect](../../../../functions/src/preview/resolver/ReferenceResolver/collect.md)
- [renderElement](../../../../functions/src/shared/render/toHtml/renderElement.md)
- [basename](../../../../functions/src/shared/render/toHtml/basename.md)

# Called by

- [postResolved](../../../../functions/src/editor/visualEditorProvider/EditorSession/postResolved.md)
- [resolve](../../../../functions/src/test/shared/editorReused/test/resolve.md)