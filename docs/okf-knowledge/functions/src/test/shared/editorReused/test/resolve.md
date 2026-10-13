---
type: TypeScript Function
title: resolve
resource: src/test/shared/editorReused.test.ts#L56-L66
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/editor/reusedContent/resolvedItems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/labels/labelsFor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function resolve(source = MAIN_SRC): Promise<ResolvedItem[]>`

# Calls

- [resolvedItems](../../../../../../functions/src/editor/reusedContent/resolvedItems.md)
- [labelsFor](../../../../../../functions/src/shared/render/labels/labelsFor.md)
- [basename](../../../../../../functions/src/shared/render/toHtml/basename.md)