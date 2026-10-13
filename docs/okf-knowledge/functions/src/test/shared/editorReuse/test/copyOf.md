---
type: TypeScript Function
title: copyOf
resource: src/test/shared/editorReuse.test.ts#L89-L99
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/test/shared/editorReuse/test/resolver
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorReuse/test/reuseElements
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/resolveReuseOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/reuseCopy/reuseCopy
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/test/shared/editorReuse/test/replaced
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function copyOf(which: Reuse, source = MAIN_SRC): Promise<string>`

# Calls

- [resolver](../../../../../../functions/src/test/shared/editorReuse/test/resolver.md)
- [reuseElements](../../../../../../functions/src/test/shared/editorReuse/test/reuseElements.md)
- [resolveReuseOf](../../../../../../functions/src/preview/resolver/ReferenceResolver/resolveReuseOf.md)
- [reuseCopy](../../../../../../functions/src/editor/reuseCopy/reuseCopy.md)

# Called by

- [replaced](../../../../../../functions/src/test/shared/editorReuse/test/replaced.md)