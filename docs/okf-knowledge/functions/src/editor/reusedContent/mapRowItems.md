---
type: TypeScript Function
title: mapRowItems
resource: src/editor/reusedContent.ts#L75-L103
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/types/isElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/resolveMapReference
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/postResolved
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function mapRowItems(doc: Document, resolver: ReferenceResolver, docPath: string, deps: Set<string>): Promise<ResolvedItem[]>`

# Calls

- [isElement](../../../../functions/src/shared/cst/types/isElement.md)
- [resolveMapReference](../../../../functions/src/preview/resolver/ReferenceResolver/resolveMapReference.md)
- [basename](../../../../functions/src/shared/render/toHtml/basename.md)

# Called by

- [postResolved](../../../../functions/src/editor/visualEditorProvider/EditorSession/postResolved.md)