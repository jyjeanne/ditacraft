---
type: TypeScript Function
title: resolver
resource: src/test/shared/editorReuse.test.ts#L77-L82
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/test/shared/editorReuse/test/copyOf
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function resolver(files: Record<string, string> = { [path.resolve(LIB)]: LIB_SRC }): ReferenceResolver`

# Called by

- [copyOf](../../../../../../functions/src/test/shared/editorReuse/test/copyOf.md)