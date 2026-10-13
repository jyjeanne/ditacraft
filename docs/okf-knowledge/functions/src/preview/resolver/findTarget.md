---
type: TypeScript Function
title: findTarget
resource: src/preview/resolver.ts#L615-L627
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/query/rootElement
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/resolver/ReferenceResolver/titleOfFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/resolveReuse
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/resolveKeyref
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/glossaryText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/resolveHref
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function findTarget(doc: Document, topicId: string | undefined, elemId: string | undefined): ElementNode | undefined`

# Calls

- [rootElement](../../../../functions/src/shared/cst/query/rootElement.md)

# Called by

- [titleOfFile](../../../../functions/src/preview/resolver/ReferenceResolver/titleOfFile.md)
- [resolveReuse](../../../../functions/src/preview/resolver/ReferenceResolver/resolveReuse.md)
- [resolveKeyref](../../../../functions/src/preview/resolver/ReferenceResolver/resolveKeyref.md)
- [glossaryText](../../../../functions/src/preview/resolver/ReferenceResolver/glossaryText.md)
- [resolveHref](../../../../functions/src/preview/resolver/ReferenceResolver/resolveHref.md)