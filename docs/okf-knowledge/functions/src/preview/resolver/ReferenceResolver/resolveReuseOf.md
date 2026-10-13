---
type: TypeScript Method
title: resolveReuseOf
resource: src/preview/resolver.ts#L134-L142
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/resolveReuse
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

`async resolveReuseOf(el: ElementNode, doc: Document, docPath: string): Promise<Resolution>`

# Calls

- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [resolveReuse](../../../../../functions/src/preview/resolver/ReferenceResolver/resolveReuse.md)

# Called by

- [reuse](../../../../../functions/src/editor/visualEditorProvider/EditorSession/reuse.md)
- [copyOf](../../../../../functions/src/test/shared/editorReuse/test/copyOf.md)